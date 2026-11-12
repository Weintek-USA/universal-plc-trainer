
<p align="center">
  <img src="docs/assets/weintekusa-logo-horizontal.png" alt="WeintekUSA logo" width="240" />
</p>

<h1 align="center">Connect the Universal Virtual PLC Trainer to a PLC</h1>

<p align="center">
  <strong>Bring your own PLC logic into the virtual workstation.</strong><br />
  Connect the trainer to a CODESYS PLC runtime using a Node.js bridge and Modbus TCP.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release-Alpha-0078F8?style=flat-square" alt="Alpha release" />
  <img src="https://img.shields.io/badge/Connection-External_PLC-022E68?style=flat-square" alt="External PLC connection" />
  <img src="https://img.shields.io/badge/Protocol-Modbus_TCP-0078F8?style=flat-square" alt="Modbus TCP" />
  <img src="https://img.shields.io/badge/Bridge-Node.js_22%2B-022E68?style=flat-square" alt="Node.js 22 or later" />
  <img src="https://img.shields.io/badge/TCP_port-502-0078F8?style=flat-square" alt="TCP port 502" />
</p>

<p align="center">
  <a href="#before-you-start"><strong>Requirements</strong></a> &nbsp;·&nbsp;
  <a href="#start-the-bridge-service">Start the bridge</a> &nbsp;·&nbsp;
  <a href="#configure-the-plc-in-codesys">Configure CODESYS</a>
</p>
<p align="center">
  <a href="#verify-the-connection">Verify</a> &nbsp;·&nbsp;
  <a href="#troubleshooting">Troubleshooting</a> &nbsp;·&nbsp;
  <a href="#alpha-testing-and-feedback">Feedback</a>
</p>

---

## Overview

**External PLC mode** lets a program running in a PLC read the trainer's virtual field wiring and control its outputs. The trainer still models the bench's electrical connections, but **your PLC program—not the trainer's built-in simulation—determines the output logic**.

| **1. Start the bridge** | **2. Configure the PLC** | **3. Verify the I/O** |
| :--- | :--- | :--- |
| Run the Node.js service and connect the trainer. | Have CODESYS poll the bridge as a Modbus TCP client. | Operate the virtual bench and compare its I/O with the PLC. |

### How the connection works

```mermaid
flowchart LR
    T["Virtual PLC Trainer<br/>(browser)"] <-->|"Virtual I/O exchange"| B["Bridge service<br/>Modbus TCP server · port 502"]
    B <-->|"PLC reads inputs<br/>and writes outputs"| P["CODESYS PLC runtime<br/>Modbus TCP client"]
    classDef navy fill:#022E68,color:#FFFFFF,stroke:#0078F8,stroke-width:2px;
    classDef blue fill:#0078F8,color:#FFFFFF,stroke:#022E68,stroke-width:2px;
    class T,P navy;
    class B blue;
```

A browser cannot open the raw TCP socket required for this connection, and the PLC needs to poll a Modbus TCP server. The **bridge** handles that communication: it exposes the trainer's I/O image on **TCP port 502**, serves input values to the PLC, and sends the PLC's coil writes back to the trainer.

> [!IMPORTANT]
> Configure **CODESYS as a Modbus TCP Client**, not a server. Start the bridge **before** attempting to connect the PLC.

## Before you start

| Requirement | Details |
| :--- | :--- |
| **Virtual PLC Trainer** | Open the trainer in a supported browser. No completed exercises are required. |
| **Bridge service** | Download the Node.js bridge from the [V1 alpha release](../../releases/tag/v1.0.0-alpha.1). The commands in this guide assume it is saved as `universal-plc-trainer-bridge.js`. No additional Node.js packages are required. |
| **Node.js** | Version **22 or later**. Verify with `node --version`. |
| **CODESYS** | **V3.5 SP21 Patch 6 or later** and the **CODESYS Control Win V3 x64** runtime. |
| **Device package** | The **Modbus TCP Client** device package must be installed in CODESYS. |
| **Network** | TCP **port 502** must be available on the computer running the bridge. |
| **Optional project** | [Download the CODESYS example project](codesys/universal-plc-trainer-codesys-v1.project) — a preconfigured project that simplifies the Modbus TCP setup. |

> [!NOTE]
> The bridge, Node.js, and CODESYS are only needed for **external PLC mode**. The trainer's internal simulation works without them.

## Start the bridge service

**1. Download `universal-plc-trainer-bridge.js`, then open a terminal** in the folder containing the file.

In VS Code: **File → Open Folder…**, select the folder holding the file, then open a terminal with **Terminal → New Terminal** (`` Ctrl+` ``). It starts in that folder already.

**2. Run the bridge:**

```bash
node universal-plc-trainer-bridge.js
```

The bridge prints its register map and starts listening on **port 502**. **Keep the terminal open:** closing it stops the bridge and disconnects the PLC.

> [!NOTE]
> **macOS and Linux reserve port 502 for administrators.** If the bridge exits with
> `listen EACCES: permission denied`, start it on a higher port and point the PLC at that port
> instead — the bridge prints this suggestion itself:
> ```bash
> node universal-plc-trainer-bridge.js --modbus-port 5020
> ```
> Windows has no such restriction.

> [!TIP]
> To check the bridge before involving a PLC, run `node universal-plc-trainer-bridge.js --demo`. It generates simulated inputs so you can watch values change without a browser or PLC attached.

**3. Connect the trainer to the bridge.** Open the trainer and select **EXTERNAL PLC**.

The status should now display **BRIDGE ONLY — NO PLC**. This means the trainer has reached the bridge; it is normal before the PLC starts polling.

| Trainer status | Meaning |
| :--- | :--- |
| **NO BRIDGE** | External mode is on, but the trainer cannot reach the bridge. Check that the bridge is still running in its terminal. |
| **BRIDGE ONLY — NO PLC** | The bridge is connected, but no PLC is polling yet. |
| **PLC POLLING** | A PLC is communicating with the bridge. |

## Configure the PLC in CODESYS

Choose **one** of the two setup paths below. Both result in the PLC polling the Node.js bridge.

The CODESYS runtime acts as the **Modbus TCP Client**. In the device tree, the **Modbus TCP Server** node beneath it represents the *remote Node.js bridge*; it does not turn the PLC runtime into a server.

```text
Device (CODESYS Control Win V3 x64)
└── Ethernet
    └── Modbus TCP Client
        └── Modbus TCP Server (Node.js bridge)
```

<details open>
<summary><strong>Option A — Use the provided CODESYS project (recommended)</strong></summary>

The optional example `.project` file in the release is designed to provide a **Modbus TCP Client**, mapped I/O channels, and a simple test program that drives **DO0 from DI0**. Check that its device tree includes the remote **Modbus TCP Server** node shown above.

1. **Open the example project in CODESYS.** The provided setup was developed with **CODESYS 3.5 SP21 Patch 6 (64-bit)**. If a later version prompts you to update the project, review and accept the update. Earlier versions may not be able to open it.
2. **Select your runtime.** Double-click **Device**, use **Scan Network**, and select the **CODESYS Control Win V3** runtime on your computer.
3. **Check the Ethernet adapter.** Under **Ethernet**, select the network interface used by the runtime.
4. **Configure the bridge endpoint.** Open the **Modbus TCP Server** node beneath **Modbus TCP Client**. Set its **Server IP address** to the computer running the bridge and its **Port** to `502` (or the alternate port selected when starting the bridge). If the bridge and runtime run on the same computer, use `127.0.0.1`.
5. **Confirm the I/O mappings and start the program.** Check the mapped channels, download the application, and start the PLC program. The trainer status should change from **BRIDGE ONLY — NO PLC** to **PLC POLLING**.

**Next:** Skip the manual setup and go to [Verify the connection](#verify-the-connection).

</details>

<details>
<summary><strong>Option B — Configure your own CODESYS project</strong></summary>

1. **Add an Ethernet device**, if one is not already present, under your CODESYS controller in the device tree. Choose the network interface used by the runtime.
2. **Add a Modbus TCP Client** under **Ethernet**. This represents the PLC runtime initiating Modbus requests to the bridge.
3. **Add a Modbus TCP Server** beneath the **Modbus TCP Client**. This child device represents the *remote bridge* and is where you configure the endpoint and channels. CODESYS versions may use older Master/Slave names; this guide uses Client/Server terminology for clarity.
4. **Enter the bridge address.** Open the child **Modbus TCP Server** node, then set **Server IP address** to the computer running the bridge and **Port** to `502` (or your selected alternate port). Use `127.0.0.1` when the bridge and runtime are on the same computer.
5. **Configure the Modbus channels and I/O mapping.** On the server node, add channels for the signals your program uses and map them to PLC variables. For a basic test, configure a **Read Discrete Inputs** channel for **DI0** (function code 02, offset 0) and a coil-write channel for **DO0** (function code 05 or 15, offset 0). Use the [register map](#modbus-register-map) below and the map printed at bridge startup.
6. **Create the test logic.** Read **DI0** and use it to control **DO0**. This verifies the communication before you add more advanced logic.
7. **Download and run the program.** The trainer status should change from **BRIDGE ONLY — NO PLC** to **PLC POLLING**.

</details>

### Modbus register map

| Modbus address | Type | Signal | Data flow |
| :--- | :--- | :--- | :--- |
| `10001–10004` | Discrete input | **DI0–DI3** | PLC reads |
| `30001–30002` | Input register | **AI0–AI1** (raw counts) | PLC reads |
| `00001–00004` | Coil | **DO0–DO3** (DO2–DO3 spare) | PLC writes |
| `40001` | Holding register | **AO0** (reserved) | Not used in this version |

**Analog inputs:** AI0 and AI1 are provided as **raw counts**, not engineering units. Scale them in the PLC program using the trainer's documented scale, just as you would with a physical analog module.

> [!WARNING]
> **Check your register offsets.** The table uses conventional **1-based Modbus addresses**. CODESYS channel configuration may instead expect **0-based offsets**: for example, DI0 is **offset 0**, not `10001`. All-zero values or signals shifted by one address often indicate this mismatch.

## Verify the connection

Once the trainer says **PLC POLLING**, confirm that both sides see the same values.

1. **Operate the bench.** Switch the trainer to **Operate** mode and press its push button. If your test program copies **DI0 to DO0**, the pilot light should turn on while the button is held.
2. **Compare the I/O.** Open the trainer's **PLC & I/O** tab and watch the signal values change. Compare them with the corresponding values in CODESYS. Any disagreement may indicate an addressing or mapping problem.
3. **Return to internal mode when finished.** Press **EXTERNAL PLC** again. The trainer resumes its built-in simulation; you may leave the bridge running or stop it.

> [!TIP]
> If a coil changes in CODESYS but the pilot light does not respond, verify that the trainer is in **Operate** mode and that the output module and lamp are powered and wired correctly.

## Troubleshooting

If the setup does not behave as expected, expand the relevant section.

<details>
<summary><strong>Bridge and connection problems</strong></summary>

| Symptom | Likely cause and fix |
| :--- | :--- |
| **The bridge exits with a version or syntax error.** | Node.js may be older than **22**. Check `node --version` and update if needed. |
| **The address or port is already in use.** | Another process, such as a Modbus tool or a previous bridge instance, is holding **TCP port 502**. Close that process and restart the bridge. |
| **The bridge reports a permission error on startup.** | Port **502** is privileged on macOS and Linux. Start the bridge with `--modbus-port 5020` and point the PLC at that port instead. Windows is unaffected. |
| **The trainer shows NO BRIDGE after selecting EXTERNAL PLC.** | It cannot reach the bridge. Confirm the bridge is still running in its terminal, then check local firewall or browser restrictions. |
| **The trainer stays on BRIDGE ONLY — NO PLC.** | The PLC is not polling. Verify that the runtime is running, the bridge endpoint is configured on the **Modbus TCP Server** child node, and the client has an active polling channel. |
| **The connection drops during use.** | The bridge terminal may have closed, the computer may have slept, or the network path may have changed. Restart the bridge and select **EXTERNAL PLC** again. |

</details>

<details>
<summary><strong>CODESYS and runtime problems</strong></summary>

| Symptom | Likely cause and fix |
| :--- | :--- |
| **CODESYS cannot open the provided project.** | The installed CODESYS version is older than the project's version. Use **3.5 SP21 Patch 6** or later. |
| **A device in the tree is unresolved or missing.** | Install the required CODESYS Modbus TCP device packages, then reopen the project. |
| **CODESYS reports no gateway or cannot find the device.** | The project may still reference the original runtime. Open **Device → Scan network** and choose your local **Control Win V3** instance. |
| **The Modbus client is offline or times out.** | Check the **Server IP address** and port on the child **Modbus TCP Server** node, firewall access, and whether the bridge is running. |
| **The runtime stops after a period of operation.** | An unlicensed **CODESYS Control Win V3** runtime stops when its demo period expires. Restart the runtime. |

</details>

<details>
<summary><strong>Register mapping and bench behavior</strong></summary>

| Symptom | Likely cause and fix |
| :--- | :--- |
| **Values stay at zero or appear shifted by one address.** | Check for **0-based versus 1-based addressing**. See the warning under the register map. |
| **Coils are written but the bench does not respond.** | Switch the trainer to **Operate** mode. Confirm the output module's supply wiring and the device's return path; a coil write cannot energize an unpowered output. |

</details>

For other technical issues, email [support@weintekusa.com](mailto:support@weintekusa.com) with **what you did, what you expected, and what happened**. If possible, include the **bridge's startup output** and a screenshot of the trainer's **PLC & I/O** tab.

## Alpha testing and feedback

The **Universal Virtual PLC Trainer V1** is available for alpha testing. Feedback on the external PLC connection, bridge setup, and overall trainer experience is welcome.

- **[Report a fault or request a feature](https://airtable.com/app4aD7d8dUZWlUT0/pagLJnoYMYpbd6UyK/form)** — Report a specific issue, unexpected behavior, or improvement idea.
- **[Submit an overall review](https://airtable.com/app4aD7d8dUZWlUT0/pageaZrlMt8toMNYm/form)** — Share your overall experience with the trainer, including usability and learning value.

## See also

| Resource | Purpose |
| :--- | :--- |
| [Getting-started guide](how-to_get-started.md) | Open the trainer and complete your first exercise. |
| [Application README](README.md) | Product overview, support contact, and general requirements. |
| [Browser compatibility](README.md#browser-compatibility) | Tested browsers, WebGL requirements, and current compatibility limitations. |
| **System tab (inside the trainer)** | Glossary, I/O address map, and simulation behavior. |

---

<p align="center"><sub>Universal Virtual PLC Trainer · Published by <strong>Weintek USA</strong></sub></p>
