# Connect the Universal Virtual PLC Trainer to a PLC

## Overview

This guide explains how to connect the Universal Virtual PLC Trainer to a real PLC, so that a program running on the PLC reads the trainer's field wiring and drives its outputs.

In this mode the trainer stops simulating its own PLC program. Wiring still determines what the PLC reads, and the downloaded program determines what the outputs do.

Connecting a PLC for the first time takes about 30 minutes, most of it CODESYS configuration.

## Before you start

Before you connect a PLC, make sure you have:

* The trainer running in its normal mode, with at least one exercise completed
* `universal-plc-trainer-bridge-v{#}.js`, the bridge service
* Node.js 22 or later, to run the bridge — check with `node --version`
* CODESYS V3.5 SP21 Patch 6 or later, with the CODESYS Control Win V3 x64 runtime and the Modbus TCP Client device package installed
* TCP port 502 free on the machine running the bridge

### Why a bridge service is needed

A browser cannot open a raw TCP socket, and the trainer must act as the Modbus server so the PLC can poll it. Neither is possible from a web page, so the trainer and the PLC cannot communicate directly.

The bridge sits between them. It holds the trainer's I/O image, serves it to the PLC as a Modbus TCP server on port 502, and passes the PLC's coil writes back to the trainer:

`trainer (browser) ↔ bridge (Modbus TCP server, port 502) ↔ PLC (Modbus TCP client)`

CODESYS is therefore configured as a client, not a server, and the bridge must be running before the PLC can reach the trainer.

## Start the bridge service

1. Open a terminal in the folder holding the bridge file.

2. Run the bridge.

    ```
    node universal-plc-trainer-bridge-v{#}.js
    ```

    It prints the register map and begins listening on TCP port 502. Leave this terminal open; closing it stops the bridge and drops the connection.

3. Confirm the trainer reaches the bridge.

    Open the trainer and press **EXTERNAL PLC**. The label beside the button should read *BRIDGE ONLY — NO PLC*, indicating that the trainer is connected to the bridge and no PLC is polling it yet. This is the expected state before the PLC is started.

## Configure the PLC in CODESYS

1. Add a **Modbus TCP Client** device under the Ethernet adapter in your device tree.

    Not the legacy *Modbus TCP Master*. The two have different configuration dialogs, and the legacy device will not work against the bridge.

2. Set the client's IP address to the machine running the bridge, and the port to 502.

    If the bridge and CODESYS are on the same machine, use `127.0.0.1`.

3. Add Modbus channels for the registers your program needs, using the register map below.

    The map is also shown in the trainer's **PLC & I/O** tab and printed by the bridge at startup.

4. Write a program that reads the inputs and drives the coils.

    A program that sets DO0 from DI0 is sufficient to verify the connection before further logic is added.

5. Download the program to the runtime and start it.

    The trainer's label changes from *BRIDGE ONLY — NO PLC* to *PLC POLLING*.

### Register map

| Address | Modbus type | Signal | Direction |
| --- | --- | --- | --- |
| 10001–10004 | Discrete input | DI0–DI3 | PLC reads |
| 30001–30002 | Input register | AI0–AI1, raw counts | PLC reads |
| 00001–00002 | Coil | DO0–DO1 | PLC writes |
| 40001 | Holding register | Reserved for AO0 | Not used in this version |

Analog inputs are raw counts on the trainer's documented scale, not engineering units. Scale them in the PLC program as you would with a real analog module.

Addresses are given in conventional 1-based Modbus notation. CODESYS channel configuration may expect 0-based offsets, in which case DI0 is offset 0 rather than 10001. Values that all read zero, or that appear shifted by one address, usually indicate this mismatch.

## Verify the connection

1. Switch the trainer to Operate mode and press the push button.

    The PLC program determines the result. A program that sets DO0 from DI0 turns the pilot light on while the button is held.

2. Open the **PLC & I/O** tab and watch the values change as you operate the bench.

    The trainer shows the values it is sending and receiving. CODESYS shows the same values from the other side; a mismatch between them indicates an addressing error.

3. Return to internal mode at any time.

    Press **EXTERNAL PLC** again. The trainer resumes simulating its own program, and the bridge can be left running or stopped.

## Troubleshoot

| Symptom | Likely cause and fix |
| --- | --- |
| The bridge exits immediately with a version or syntax error | Node.js is older than 22. Check with `node --version` and update. |
| The bridge reports the address or port is already in use | Another process holds TCP port 502, often a Modbus utility or a previous bridge still running. Close it and start the bridge again. |
| The bridge reports a permission error on startup | Port 502 is privileged on macOS and Linux. Run the bridge with elevated privileges, or remap the port if the build supports it. |
| The trainer's label stays on internal mode after pressing EXTERNAL PLC | The trainer cannot reach the bridge. Confirm the bridge is running and that no local firewall or browser policy is blocking the connection. |
| The label reads BRIDGE ONLY — NO PLC and does not change | The PLC is not polling. Confirm the program is downloaded and running, the client's IP and port are correct, and the device is a Modbus TCP Client rather than the legacy Master. |
| CODESYS reports the client is offline or times out | Wrong IP address, a firewall blocking port 502, or the bridge not running. Check in that order. |
| Values are all zero, or every signal is shifted by one address | 0-based versus 1-based register addressing. See the note under the register map. |
| Coils are written but the bench does not respond | The trainer must be in Operate mode. Also check the output module's power connections — a correctly addressed coil into an unpowered module does nothing. |
| The connection drops mid-session | The bridge terminal was closed, the machine slept, or the network path changed. Restart the bridge and press EXTERNAL PLC again. |

For anything not listed, report what you did, what you expected, and what happened to the support contact in the README. Include the bridge's startup output and a screenshot of the trainer's **PLC & I/O** tab.

## See also

* Get started with the Universal Virtual PLC Trainer (`how-to_get-started.md`) — open the trainer and complete your first exercise
* {System requirements} — supported browsers and minimum versions
* {Known simplifications and scope} — what the trainer models exactly and what it deliberately does not
* The **System** tab inside the trainer — glossary, I/O address map, and how the simulation works
