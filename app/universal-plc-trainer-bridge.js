#!/usr/bin/env node
/*
 * Universal PLC Trainer by Weintek USA — Modbus bridge service
 * ==================================
 * Stage 3 of the off-Claude test plan.
 *
 *     Browser (Universal PLC Trainer)
 *           |  WebSocket, JSON, ~100 ms
 *     THIS SERVICE
 *           |  Modbus TCP, port 502
 *     Weintek (Modbus TCP client / master)
 *
 * Architecture A, confirmed on the bench 19 Oct 2026: this service is the
 * Modbus SERVER and the Weintek polls it. That is why the published address
 * map works unchanged — every point the trainer produces lives in a read-only
 * Modbus class (discrete inputs, input registers), which only makes sense when
 * the trainer side is the one being read.
 *
 * Measured behaviour this is built against:
 *   - the Weintek polls FC01/FC02/FC03/FC04 in a cycle, ~23 cycles/second
 *   - it reads bits 16 at a time, registers one at a time, unit id 1
 *   - it writes single coils with FC05
 *   - its addressing is 1:1 with the documentation numbering (3x:1 -> offset 0)
 *
 * No dependencies. Node 20+ (uses node:crypto and the built-in http server).
 *
 *   node universal-plc-trainer-bridge.js                 # Modbus 502, web/WebSocket 8080
 *   node universal-plc-trainer-bridge.js --demo          # synthesise a moving I/O image
 *   node universal-plc-trainer-bridge.js --modbus-port 5020 --web-port 8081
 *   node universal-plc-trainer-bridge.js --verbose       # print every Modbus frame (noisy)
 *   node universal-plc-trainer-bridge.js --diag          # decoded, labelled, de-duplicated requests
 *   node universal-plc-trainer-bridge.js --hold          # on trainer OR PLC loss, hold last values
 *   node universal-plc-trainer-bridge.js --timeout 3000  # ms of trainer silence before it counts as lost
 *
 * Open http://localhost:8080/ for the stand-in trainer client.
 */

'use strict';
const net = require('net');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/* ================= options ================= */
const argv = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const opt = (n, d) => {
  const i = argv.indexOf('--' + n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const MODBUS_PORT = parseInt(opt('modbus-port', '502'), 10);
const WEB_PORT = parseInt(opt('web-port', '8080'), 10);
const DEMO = flag('demo');
/* Per-poll logging is OFF by default. A master polls ~90 times a second, so
   narrating every frame fills a terminal in seconds and buries the lines that
   matter. --verbose turns it on for debugging; --quiet is accepted and ignored,
   since quiet is now simply the default. */
const VERBOSE = flag('verbose');
/* --diag: decoded, labelled, de-duplicated per-request logging for debugging a
   master that is polling but reading the wrong thing. Additive and off by
   default; it changes nothing about what the bridge answers. */
const DIAG = flag('diag');
const HOLD_ON_LOSS = flag('hold');
/* 3000 ms, up from 1000. The trainer now publishes from a worker that is not
   throttled by page visibility, so a healthy link never goes quiet for more
   than ~250 ms; three seconds absorbs a GC pause or a laptop waking without
   declaring the trainer dead, while still catching a real loss well inside a
   student's reaction time. */
const TRAINER_TIMEOUT_MS = parseInt(opt('timeout', '3000'), 10);

/* ================= THE I/O IMAGE =================
 * One object, one direction of travel per field.
 *
 *   di / ai   produced by the trainer's wiring, READ by the PLC
 *   dq / ao   produced by the PLC's program,    SENT to the trainer
 *
 * Analog values are raw counts on the trainer's own 0..27648 scale
 * (Siemens-style), exactly as the trainer already computes them. The bridge
 * does no scaling: converting counts to engineering units is the PLC
 * program's job, which is the whole point of the exercise.
 */
const RAW_MAX = 27648;
const io = {
  di: [false, false, false, false],
  ai: [0, 0],
  dq: [false, false, false, false],
  ao: [0],
};

/* ================= THE MAPPING TABLE =================
 * The single place where Modbus addresses meet trainer points. Change a
 * number here and nothing else in this file needs to know. `doc` is the
 * traditional 5-digit reference, carried only so the logs are readable;
 * `offset` is what actually travels on the wire.
 */
const MAP = {
  discreteInputs: [
    { offset: 0, doc: 10001, field: 'di', index: 0, name: 'DI0 push button PB1' },
    { offset: 1, doc: 10002, field: 'di', index: 1, name: 'DI1 proximity sensor PX1' },
    { offset: 2, doc: 10003, field: 'di', index: 2, name: 'DI2 Start button' },
    { offset: 3, doc: 10004, field: 'di', index: 3, name: 'DI3 Stop button (NC)' },
  ],
  inputRegisters: [
    { offset: 0, doc: 30001, field: 'ai', index: 0, name: 'AI0 tank level (4-20 mA, 0-27648)' },
    { offset: 1, doc: 30002, field: 'ai', index: 1, name: 'AI1 weight (0-10 V, 0-27648)' },
  ],
  coils: [
    { offset: 0, doc: 1, field: 'dq', index: 0, name: 'DO0 pilot light PL1' },
    { offset: 1, doc: 2, field: 'dq', index: 1, name: 'DO1 motor M1' },
    { offset: 2, doc: 3, field: 'dq', index: 2, name: 'DO2 spare' },
    { offset: 3, doc: 4, field: 'dq', index: 3, name: 'DO3 spare' },
  ],
  holdingRegisters: [
    { offset: 0, doc: 40001, field: 'ao', index: 0, name: 'AO0 reserved' },
  ],
};

/* lookup tables built from MAP, so the hot path is an array index */
const SIZE = 256;
const byOffset = (list) => {
  const a = new Array(SIZE).fill(null);
  list.forEach((p) => (a[p.offset] = p));
  return a;
};
const DI_AT = byOffset(MAP.discreteInputs);
const IR_AT = byOffset(MAP.inputRegisters);
const COIL_AT = byOffset(MAP.coils);
const HR_AT = byOffset(MAP.holdingRegisters);

/* reading an unmapped address is legal and returns 0 — a master configured a
   little wide (16 bits at a time, as the Weintek does) must not get an error */
const readBit = (at, off) => {
  const p = at[off];
  return p ? (io[p.field][p.index] ? 1 : 0) : 0;
};
const readReg = (at, off) => {
  const p = at[off];
  return p ? io[p.field][p.index] & 0xffff : 0;
};

/* ================= logging ================= */
const ts = () => new Date().toISOString().slice(11, 23);
const log = (...a) => console.log(`${ts()}  ${a.join(' ')}`);
const vlog = (...a) => {
  if (VERBOSE) log(...a);
};

/* Liveness without spam: count what arrives, print one summary line on a timer
   while a master is actually connected. Twelve lines a minute, each of which
   tells you the poll rate and the current state of both links. */
let pollCount = 0;      // reset each summary, for the rate
let totalPolls = 0;     // never reset, so a soak log shows cumulative work
let lastSummary = Date.now();
setInterval(() => {
  if (!plcLive && !trainerLive) return;
  const now = Date.now();
  const secs = (now - lastSummary) / 1000;
  const rate = secs > 0 ? Math.round(pollCount / secs) : 0;
  pollCount = 0;
  lastSummary = now;
  log(
    `· ${rate}/s  ${upFor()}  rss ${rssMB()}MB  tx ${totalPolls}`
    + `  PLC ${plcLive ? 'polling' : 'absent'}  trainer ${trainerLive ? 'live' : 'absent'}`
    + `  DI ${io.di.map((b) => (b ? 1 : 0)).join('')}`
    + `  AI ${io.ai.join('/')}`
    + `  DO ${io.dq.map((b) => (b ? 1 : 0)).join('')}`
  );
}, 5000);

/* Health fields for a soak run. Without these a two-hour log is 1,440 lines
   that all say the same thing and prove only that the process did not crash.
   With them, the same log answers the question the run exists to ask: did
   memory stay flat, and did the transaction count keep climbing smoothly. */
const STARTED = Date.now();

function upFor() {
  const s = Math.floor((Date.now() - STARTED) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `up ${h}h${String(m).padStart(2, '0')}m` : `up ${m}m${String(s % 60).padStart(2, '0')}s`;
}

function rssMB() {
  return Math.round(process.memoryUsage().rss / 1048576);
}

/* ================= --diag: de-duplicated request logging =================
 * A master polls the same addresses ~20-90 times a second, so printing every
 * request is unreadable. Instead: print a line the moment its CONTENT changes,
 * and otherwise roll it up and print at most once every 5 s with a repeat
 * count. A steady state costs one line per 5 s per channel; the instant
 * anything changes, you see it immediately.
 *
 * Every line carries the trainer link state, because "the master is reading
 * zeros" and "the trainer stopped publishing so the failsafe zeroed the
 * inputs" look identical from the master's end.
 */
const DIAG_ROLLUP_MS = 5000;
const diagState = new Map(); // channel key -> { line, count, since }

function diag(key, line) {
  if (!DIAG) return;
  const now = Date.now();
  const st = diagState.get(key);
  if (!st || st.line !== line) {
    if (st && st.count > 1) {
      log(`   ↳ previous ${key} repeated ${st.count - 1}x over ${((now - st.since) / 1000).toFixed(1)}s`);
    }
    log(line);
    diagState.set(key, { line, count: 1, since: now });
    return;
  }
  st.count++;
  if (now - st.since >= DIAG_ROLLUP_MS) {
    log(`${line}   [unchanged, ${st.count}x in ${((now - st.since) / 1000).toFixed(1)}s]`);
    st.since = now;
    st.count = 1;
  }
}

/* the state every diag line ends with — the thing that explains all-zero reads */
function linkTag() {
  return trainerLive ? "trainer=LIVE" : "trainer=ABSENT → inputs forced de-energised";
}

/* label the first four bits of a bit response by their trainer point names */
function labelBits(kind, addr, bits) {
  const names = kind === "discrete inputs"
    ? ["DI0 button", "DI1 prox", "DI2 Start", "DI3 Stop(NC)"]
    : ["DO0 light", "DO1 motor", "DO2 spare", "DO3 spare"];
  const out = [];
  for (let i = 0; i < bits.length && i < 8; i++) {
    const n = names[addr + i];
    if (n) out.push(`${n}=${bits[i] ? 1 : 0}`);
  }
  return out.join("  ");
}

/* ================= trainer link state ================= */
let trainerSocket = null;      // the live browser connection, if any
const displacements = [];      // timestamps of trainer-takeovers, for flap detection
let lastFlapWarning = 0;
let lastTrainerMsg = 0;        // Date.now() of the last I/O publish
let trainerLive = false;
let plcLive = false;           // is a Modbus master connected right now
let modbusClients = 0;

/* FAILURE BEHAVIOUR — a deliberate decision, not a default.
 *
 * When the trainer goes away (tab closed, laptop asleep, WebSocket dropped),
 * the PLC must not keep reading the last values it saw. A stale "button
 * pressed" or a stale half-full tank is the dangerous kind of wrong: the
 * program carries on as if the field were still there.
 *
 * So on loss the inputs go to their de-energised state: every DI false, every
 * AI raw 0. That is not an arbitrary safe value — raw 0 is exactly what the
 * trainer itself produces for a broken 4-20 mA loop, so the PLC sees the
 * open-loop condition the live zero exists to signal. The failure looks like
 * the failure it actually is.
 *
 * --hold overrides this for anyone who wants last-value behaviour, but it is
 * off by default and should stay off in a classroom.
 */
function loseTrainer(why) {
  if (!trainerLive) return;
  trainerLive = false;
  if (HOLD_ON_LOSS) {
    log(`!! TRAINER LINK LOST (${why}) — holding last values (--hold)`);
  } else {
    io.di = [false, false, false, false];
    io.ai = [0, 0];
    log(`!! TRAINER LINK LOST (${why}) — inputs forced to de-energised`);
    log('   DI0-DI3 false, AI0/AI1 raw 0 — the PLC now sees an open loop,');
    log('   which is what a broken link really is.');
  }
}

/* The same rule in the other direction. When the last Modbus master goes
 * away, nothing is in charge of the outputs any more, and an output that
 * stays ON with no program driving it is a motor that keeps turning after
 * the PLC died — the opposite of the fail-safe behaviour the trainer exists
 * to teach. This is also what every student will hit when the CODESYS demo
 * licence expires mid-session: the process is simply gone, so no PLC-side
 * "outputs to default on stop" setting ever gets a chance to run.
 *
 * Coils go FALSE, the holding register goes 0, and the trainer is told, so
 * its bench de-energises immediately. --hold opts out of this too.
 */
function losePlc(why) {
  if (HOLD_ON_LOSS) {
    log(`!! PLC LOST (${why}) — holding last outputs (--hold)`);
    return;
  }
  const hadOn = io.dq.some(Boolean) || io.ao.some((v) => v !== 0);
  io.dq = [false, false, false, false];
  io.ao = [0];
  log(`!! PLC LOST (${why}) — outputs forced OFF${hadOn ? '' : ' (all were already OFF)'}`);
  if (hadOn) log('   DO0-DO3 false, AO0 0 — nothing is driving them, so nothing stays energised.');
}

setInterval(() => {
  if (trainerLive && Date.now() - lastTrainerMsg > TRAINER_TIMEOUT_MS) {
    loseTrainer(`no publish for ${TRAINER_TIMEOUT_MS} ms`);
  }
}, 250);

/* ================= Modbus TCP server =================
 * Protocol core carried over from the probe, which was validated against
 * pymodbus. Only the datastore changed: it now reads the live I/O image.
 */
const EX_ILLEGAL_FUNCTION = 0x01;
const EX_ILLEGAL_ADDRESS = 0x02;
const EX_ILLEGAL_VALUE = 0x03;
const FC_NAMES = {
  1: 'FC01 read coils', 2: 'FC02 read discrete inputs',
  3: 'FC03 read holding registers', 4: 'FC04 read input registers',
  5: 'FC05 write single coil', 6: 'FC06 write single register',
  15: 'FC15 write multiple coils', 16: 'FC16 write multiple registers',
};

function packBits(bits) {
  const out = Buffer.alloc(Math.ceil(bits.length / 8));
  bits.forEach((b, i) => {
    if (b) out[i >> 3] |= 1 << (i & 7);
  });
  return out;
}

/* a coil or holding register written by the master lands in the I/O image and
   is pushed straight to the trainer — this is the PLC -> physical direction */
function applyCoil(off, val) {
  const p = COIL_AT[off];
  if (!p) return false;
  const was = io[p.field][p.index];
  io[p.field][p.index] = !!val;
  if (was !== !!val) {
    log(`<- PLC WROTE  ${p.name}  (coil offset ${off}, documentation ${String(p.doc).padStart(5, '0')})  ${val ? 'ON' : 'OFF'}`);
    pushToTrainer();
  }
  return true;
}
function applyReg(off, val) {
  const p = HR_AT[off];
  if (!p) return false;
  const was = io[p.field][p.index];
  io[p.field][p.index] = val & 0xffff;
  if (was !== (val & 0xffff)) {
    log(`<- PLC WROTE  ${p.name}  (holding offset ${off})  ${val}`);
    pushToTrainer();
  }
  return true;
}

function handlePdu(pdu, unitId) {
  const fc = pdu[0];
  const u = unitId === undefined ? "?" : unitId;
  /* exceptions are always logged, with or without --diag: they are rare and
     each one is a master asking for something this bridge will not serve */
  const except = (code, why) => {
    log(`!! EXCEPTION ${code} to unit ${u} ${FC_NAMES[fc] || `fc ${fc}`} — ${why}`);
    return Buffer.from([fc | 0x80, code]);
  };

  const readBits = (at, kind) => {
    if (pdu.length < 5) return except(EX_ILLEGAL_VALUE, 'short request');
    const addr = pdu.readUInt16BE(1);
    const qty = pdu.readUInt16BE(3);
    if (qty < 1 || qty > 2000) return except(EX_ILLEGAL_VALUE, `quantity ${qty}`);
    if (addr + qty > SIZE) return except(EX_ILLEGAL_ADDRESS, `addr ${addr} + ${qty}`);
    const bits = [];
    for (let i = 0; i < qty; i++) bits.push(readBit(at, addr + i));
    vlog(`  ${kind} offset ${addr} x${qty} -> ${bits.slice(0, 8).join(',')}${qty > 8 ? ',…' : ''}`);
    const data = packBits(bits);
    /* the response EXACTLY as it goes on the wire, so "what the bridge sent"
       and "what the master shows" can be compared without inference */
    diag(`fc${fc}@${addr}x${qty}`,
      `unit ${u}  ${FC_NAMES[fc]}  addr ${addr} qty ${qty}\n`
      + `     ${labelBits(kind, addr, bits)}\n`
      + `     response data = 0x${data.toString('hex')}`
      + `  (byte0 bits lsb→msb ${(data[0] ?? 0).toString(2).padStart(8, '0').split('').reverse().join('')})\n`
      + `     ${linkTag()}`);
    return Buffer.concat([Buffer.from([fc, data.length]), data]);
  };

  const readRegs = (at, kind) => {
    if (pdu.length < 5) return except(EX_ILLEGAL_VALUE, 'short request');
    const addr = pdu.readUInt16BE(1);
    const qty = pdu.readUInt16BE(3);
    if (qty < 1 || qty > 125) return except(EX_ILLEGAL_VALUE, `quantity ${qty}`);
    if (addr + qty > SIZE) return except(EX_ILLEGAL_ADDRESS, `addr ${addr} + ${qty}`);
    const data = Buffer.alloc(qty * 2);
    const vals = [];
    for (let i = 0; i < qty; i++) {
      const v = readReg(at, addr + i);
      data.writeUInt16BE(v, i * 2);
      vals.push(v);
    }
    vlog(`  ${kind} offset ${addr} x${qty} -> ${vals.join(', ')}`);
    diag(`fc${fc}@${addr}x${qty}`,
      `unit ${u}  ${FC_NAMES[fc]}  addr ${addr} qty ${qty}\n`
      + `     values = ${vals.join(', ')}\n`
      + `     ${linkTag()}`);
    return Buffer.concat([Buffer.from([fc, data.length]), data]);
  };

  switch (fc) {
    case 1: return readBits(COIL_AT, 'coils');
    case 2: return readBits(DI_AT, 'discrete inputs');
    case 3: return readRegs(HR_AT, 'holding registers');
    case 4: return readRegs(IR_AT, 'input registers');

    case 5: {
      if (pdu.length < 5) return except(EX_ILLEGAL_VALUE, 'short request');
      const addr = pdu.readUInt16BE(1);
      const raw = pdu.readUInt16BE(3);
      if (raw !== 0x0000 && raw !== 0xff00) return except(EX_ILLEGAL_VALUE, `coil value 0x${raw.toString(16)}`);
      diag(`fc5@${addr}`,
        `unit ${u}  ${FC_NAMES[5]}  addr ${addr} qty 1\n`
        + `     ${labelBits('coils', addr, [raw === 0xff00 ? 1 : 0])}\n`
        + `     ${linkTag()}`);
      if (!applyCoil(addr, raw === 0xff00)) return except(EX_ILLEGAL_ADDRESS, `coil ${addr} is not mapped`);
      return pdu.subarray(0, 5);
    }

    case 6: {
      if (pdu.length < 5) return except(EX_ILLEGAL_VALUE, 'short request');
      const addr = pdu.readUInt16BE(1);
      diag(`fc6@${addr}`,
        `unit ${u}  ${FC_NAMES[6]}  addr ${addr} value ${pdu.readUInt16BE(3)}\n`
        + `     ${linkTag()}`);
      if (!applyReg(addr, pdu.readUInt16BE(3))) return except(EX_ILLEGAL_ADDRESS, `register ${addr} is not mapped`);
      return pdu.subarray(0, 5);
    }

    case 15: {
      if (pdu.length < 6) return except(EX_ILLEGAL_VALUE, 'short request');
      const addr = pdu.readUInt16BE(1);
      const qty = pdu.readUInt16BE(3);
      const bc = pdu[5];
      if (qty < 1 || qty > 1968) return except(EX_ILLEGAL_VALUE, `quantity ${qty}`);
      if (pdu.length < 6 + bc) return except(EX_ILLEGAL_VALUE, 'truncated payload');
      const wrote = [];
      const unmapped = [];
      for (let i = 0; i < qty; i++) {
        const bit = (pdu[6 + (i >> 3)] >> (i & 7)) & 1;
        wrote.push(bit);
        if (COIL_AT[addr + i]) applyCoil(addr + i, bit);
        else unmapped.push(addr + i);
      }
      diag(`fc15@${addr}x${qty}`,
        `unit ${u}  ${FC_NAMES[15]}  addr ${addr} qty ${qty}\n`
        + `     ${labelBits('coils', addr, wrote)}\n`
        + `     payload = 0x${pdu.subarray(6, 6 + bc).toString('hex')}`
        + (unmapped.length ? `   IGNORED (not in the map): offsets ${unmapped.join(', ')}` : '') + '\n'
        + `     ${linkTag()}`);
      return Buffer.concat([Buffer.from([fc]), pdu.subarray(1, 5)]);
    }

    case 16: {
      if (pdu.length < 6) return except(EX_ILLEGAL_VALUE, 'short request');
      const addr = pdu.readUInt16BE(1);
      const qty = pdu.readUInt16BE(3);
      const bc = pdu[5];
      if (qty < 1 || qty > 123) return except(EX_ILLEGAL_VALUE, `quantity ${qty}`);
      if (pdu.length < 6 + bc) return except(EX_ILLEGAL_VALUE, 'truncated payload');
      const vals16 = [];
      for (let i = 0; i < qty; i++) {
        const v = pdu.readUInt16BE(6 + i * 2);
        vals16.push(v);
        if (HR_AT[addr + i]) applyReg(addr + i, v);
      }
      diag(`fc16@${addr}x${qty}`,
        `unit ${u}  ${FC_NAMES[16]}  addr ${addr} qty ${qty}\n`
        + `     values = ${vals16.join(', ')}\n`
        + `     ${linkTag()}`);
      return Buffer.concat([Buffer.from([fc]), pdu.subarray(1, 5)]);
    }

    default:
      return except(EX_ILLEGAL_FUNCTION,
        `function code ${fc} is not implemented — this bridge serves FC01-06, 15, 16`);
  }
}

const modbusServer = net.createServer((socket) => {
  const peer = `${socket.remoteAddress}:${socket.remotePort}`;
  let buf = Buffer.alloc(0);
  modbusClients++;
  plcLive = true;
  log(`== PLC CONNECTED  ${peer}  (${modbusClients} active)`);
  pushToTrainer();

  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 7) return;
      const len = buf.readUInt16BE(4);
      if (len < 2 || len > 260) {
        log(`!! ${peer} bad MBAP length ${len} — dropping`);
        socket.destroy();
        return;
      }
      if (buf.length < 6 + len) return;
      const frame = buf.subarray(0, 6 + len);
      buf = buf.subarray(6 + len);
      const txId = frame.readUInt16BE(0);
      const unitId = frame[6];
      const pdu = frame.subarray(7);
      pollCount++;
      totalPolls++;
      vlog(`${FC_NAMES[pdu[0]] || `fc ${pdu[0]}`}  tx ${txId} unit ${unitId}`);
      let respPdu;
      try {
        respPdu = handlePdu(pdu, unitId);
      } catch (e) {
        log(`!! error handling frame: ${e.message}`);
        respPdu = Buffer.from([pdu[0] | 0x80, EX_ILLEGAL_VALUE]);
      }
      const header = Buffer.alloc(7);
      header.writeUInt16BE(txId, 0);
      header.writeUInt16BE(0, 2);
      header.writeUInt16BE(1 + respPdu.length, 4);
      header[6] = unitId;
      socket.write(Buffer.concat([header, respPdu]));
    }
  });

  socket.on('close', () => {
    modbusClients--;
    if (modbusClients <= 0) {
      modbusClients = 0;
      plcLive = false;
      log(`== PLC DISCONNECTED  ${peer} — no master connected`);
      losePlc('last master disconnected');
      pushToTrainer();   /* carries the cleared outputs AND plc:false in one push */
    } else {
      log(`== PLC DISCONNECTED  ${peer}  (${modbusClients} still active)`);
    }
  });
  socket.on('error', (e) => log(`!! ${peer} socket error: ${e.message}`));
});

/* ================= WebSocket (hand-rolled, no dependencies) ================= */
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function wsAccept(key) {
  return crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
}

function wsEncode(str) {
  const payload = Buffer.from(str, 'utf8');
  const n = payload.length;
  let header;
  if (n < 126) {
    header = Buffer.from([0x81, n]);
  } else if (n < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126; header.writeUInt16BE(n, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127;
    header.writeUInt32BE(0, 2); header.writeUInt32BE(n, 6);
  }
  return Buffer.concat([header, payload]);
}

/* pull complete frames out of a buffer; returns {frames, rest} */
function wsDecode(buf) {
  const frames = [];
  for (;;) {
    if (buf.length < 2) break;
    const fin = (buf[0] & 0x80) !== 0;
    const opcode = buf[0] & 0x0f;
    const masked = (buf[1] & 0x80) !== 0;
    let len = buf[1] & 0x7f;
    let p = 2;
    if (len === 126) {
      if (buf.length < 4) break;
      len = buf.readUInt16BE(2); p = 4;
    } else if (len === 127) {
      if (buf.length < 10) break;
      const hi = buf.readUInt32BE(2);
      if (hi !== 0) return { frames, rest: buf, fatal: 'frame too large' };
      len = buf.readUInt32BE(6); p = 10;
    }
    const maskKey = masked ? buf.subarray(p, p + 4) : null;
    if (masked) p += 4;
    if (buf.length < p + len) break;
    const payload = Buffer.from(buf.subarray(p, p + len));
    if (masked) for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i & 3];
    buf = buf.subarray(p + len);
    frames.push({ fin, opcode, payload });
  }
  return { frames, rest: buf };
}

/* ================= messages to and from the trainer ================= */
function snapshotForTrainer() {
  return JSON.stringify({
    type: 'out',
    dq: io.dq,
    ao: io.ao,
    plc: plcLive,
    t: Date.now(),
  });
}

function pushToTrainer() {
  if (trainerSocket && !trainerSocket.destroyed) {
    try {
      trainerSocket.write(wsEncode(snapshotForTrainer()));
    } catch (e) {
      log(`!! failed to push to trainer: ${e.message}`);
    }
  }
}

function handleTrainerMessage(text) {
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    log('!! trainer sent something that is not JSON — ignored');
    return;
  }
  if (msg.type !== 'io') return;

  if (!trainerLive) {
    trainerLive = true;
    log('== TRAINER LINK UP — publishing its I/O image');
  }
  lastTrainerMsg = Date.now();

  if (Array.isArray(msg.di)) {
    for (let i = 0; i < 4; i++) io.di[i] = !!msg.di[i];
  }
  if (Array.isArray(msg.ai)) {
    for (let i = 0; i < 2; i++) {
      const v = Number(msg.ai[i]);
      io.ai[i] = Number.isFinite(v) ? Math.max(0, Math.min(RAW_MAX, Math.round(v))) : 0;
    }
  }
}

/* ================= HTTP + WebSocket server ================= */
const CLIENT_FILE = path.join(__dirname, 'bridge-client.html');

const webServer = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(CLIENT_FILE, (err, data) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('bridge-client.html is not next to universal-plc-trainer-bridge.js.\n'
          + 'The bridge itself is still running — this page is only the stand-in trainer.\n');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }
  if (req.url === '/map.json') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(MAP, null, 2));
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found\n');
});

webServer.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n'
    + 'Upgrade: websocket\r\n'
    + 'Connection: Upgrade\r\n'
    + `Sec-WebSocket-Accept: ${wsAccept(key)}\r\n\r\n`
  );
  socket.setNoDelay(true);

  const peer = `${socket.remoteAddress}:${socket.remotePort}`;
  if (trainerSocket && !trainerSocket.destroyed) {
    log(`!! a second trainer connected (${peer}) — the newest one wins`);
    try { trainerSocket.destroy(); } catch { /* already gone */ }
    /* Newest-wins is right for a page reload, but two DIFFERENT pages that both
       auto-reconnect will displace each other forever, roughly once a second,
       and neither holds the link long enough to publish. Say so plainly rather
       than letting the operator watch an indicator flash. */
    displacements.push(Date.now());
    while (displacements.length && Date.now() - displacements[0] > 10000) displacements.shift();
    if (displacements.length >= 3 && Date.now() - lastFlapWarning > 15000) {
      lastFlapWarning = Date.now();
      log('');
      log('   ***************************************************************');
      log('   TWO PAGES ARE FIGHTING OVER THE TRAINER CONNECTION');
      log(`   ${displacements.length} takeovers in the last 10 s. Only one page can be the`);
      log('   trainer, and each is kicking the other off and reconnecting.');
      log('');
      log('   Almost always: the Stage 3 stand-in (bridge-client.html, served');
      log('   from this bridge) is open at the same time as the real trainer.');
      log('   CLOSE ONE OF THEM — the stand-in is only needed when the trainer');
      log('   has no external mode. Until then the PLC will read the failsafe.');
      log('   ***************************************************************');
      log('');
    }
  }
  trainerSocket = socket;
  log(`== TRAINER CONNECTED  ${peer}`);
  socket.write(wsEncode(JSON.stringify({ type: 'hello', map: MAP, rawMax: RAW_MAX })));
  socket.write(wsEncode(snapshotForTrainer()));

  let buf = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const { frames, rest, fatal } = wsDecode(buf);
    if (fatal) {
      log(`!! websocket framing: ${fatal}`);
      socket.destroy();
      return;
    }
    buf = rest;
    for (const f of frames) {
      if (f.opcode === 0x1) handleTrainerMessage(f.payload.toString('utf8'));
      else if (f.opcode === 0x8) { socket.end(); return; }
      else if (f.opcode === 0x9) socket.write(Buffer.concat([Buffer.from([0x8a, f.payload.length]), f.payload]));
    }
  });

  const gone = (why) => {
    if (trainerSocket === socket) {
      trainerSocket = null;
      loseTrainer(why);
      log(`== TRAINER DISCONNECTED  ${peer}`);
    }
  };
  socket.on('close', () => gone('socket closed'));
  socket.on('error', (e) => gone(`socket error: ${e.message}`));
});

/* ================= demo mode =================
 * Drives the I/O image with no browser attached, so the Modbus half can be
 * tested against the Weintek before Stage 4 exists. The tank fills and drains,
 * the weight steps, and the button and sensor blink on their own schedules —
 * every value moving at a different rate, so nothing can be confused with
 * anything else on a display.
 */
if (DEMO) {
  let t = 0;
  let warnedDemoYield = false;
  trainerLive = true;
  setInterval(() => {
    t += 0.1;
    /* A REAL trainer always wins. If a browser is attached, demo writes nothing
       at all — neither the link state nor the values. Without this, both write
       the I/O image every 100 ms and the master sees the two sources alternate,
       which looks like wildly flapping inputs and makes any seal-in rung chatter.
       Demo exists to stand in for a trainer that is NOT there. */
    if (trainerSocket) {
      if (!warnedDemoYield) {
        warnedDemoYield = true;
        log('!! a real trainer connected — demo mode is standing down and will');
        log('   write nothing while it is attached. Close the trainer tab to use');
        log('   --demo, or restart the bridge without --demo to use the trainer.');
      }
      return;
    }
    warnedDemoYield = false;
    trainerLive = true;
    lastTrainerMsg = Date.now();
    const level = (Math.sin(t / 6) + 1) / 2;           // 0..1 over ~38 s
    const weight = ((Math.sin(t / 11) + 1) / 2) * 50;  // 0..50 kg over ~69 s
    io.ai[0] = Math.round(level * RAW_MAX);
    io.ai[1] = Math.round((weight / 50) * RAW_MAX);
    io.di[0] = Math.floor(t) % 4 === 0;   // push button, 1 s in every 4
    io.di[1] = Math.floor(t / 2) % 5 === 0;
    io.di[2] = Math.floor(t / 3) % 7 === 0;
    io.di[3] = true;                      // Stop is NC: ON at rest
  }, 100);
}

/* ================= start ================= */
modbusServer.on('error', (e) => {
  console.error(`\nModbus port ${MODBUS_PORT}: ${e.code === 'EADDRINUSE' ? 'already in use' : e.message}`);
  console.error(`Try: node universal-plc-trainer-bridge.js --modbus-port 5020\n`);
  process.exit(1);
});
webServer.on('error', (e) => {
  console.error(`\nWeb port ${WEB_PORT}: ${e.code === 'EADDRINUSE' ? 'already in use' : e.message}`);
  console.error(`Try: node universal-plc-trainer-bridge.js --web-port 8081\n`);
  process.exit(1);
});

modbusServer.listen(MODBUS_PORT, '0.0.0.0', () => {
  webServer.listen(WEB_PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  Universal PLC Trainer — Modbus bridge');
    console.log('  ' + '-'.repeat(54));
    console.log(`  Modbus TCP server : 0.0.0.0:${MODBUS_PORT}   <- point the Weintek here`);
    console.log(`  Trainer / WebSocket: http://localhost:${WEB_PORT}/   <- open this in a browser`);
    console.log('');
    console.log('  Address map (documentation numbering, offset = doc - base):');
    for (const [kind, list] of Object.entries(MAP)) {
      for (const p of list) {
        console.log(`    ${kind.padEnd(16)} ${String(p.doc).padStart(5, '0')}  offset ${String(p.offset).padEnd(3)} ${p.name}`);
      }
    }
    console.log('');
    console.log(`  On trainer loss: ${HOLD_ON_LOSS ? 'HOLD last values (--hold)' : 'inputs forced de-energised (DI false, AI raw 0 = open loop)'}`);
    console.log(`  On PLC loss:     ${HOLD_ON_LOSS ? 'HOLD last outputs (--hold)' : 'outputs forced OFF (DO false, AO 0 = nothing in charge)'}`);
    console.log(`  Trainer timeout: ${TRAINER_TIMEOUT_MS} ms of silence`);
    if (DEMO) console.log('  --demo: synthesising a moving I/O image, no browser needed.');
    console.log('');
    console.log('  Logging: state changes, plus one summary line every 5 s while a link is up.');
    console.log(`  A master polls ~90 times a second; those are counted, not printed.${VERBOSE ? '' : '  --verbose prints each one.'}`);
    if (VERBOSE) console.log('  --verbose: printing every frame. Expect a lot of output.');
    if (DIAG) {
      console.log('  --diag: decoded per-request logging, de-duplicated. A line appears the');
      console.log('          moment its content changes, otherwise once per 5 s with a count.');
      console.log('          Every line ends with the trainer link state — if it says ABSENT,');
      console.log('          the zeros the master reads are this bridge\'s failsafe, not a');
      console.log('          mapping fault.');
    }
    console.log('  Ctrl+C to stop.');
    console.log('');
  });
});

process.on('SIGINT', () => {
  console.log('\nStopping bridge.\n');
  process.exit(0);
});