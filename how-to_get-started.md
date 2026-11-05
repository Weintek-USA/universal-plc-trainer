<!--
PRE-PUBLISH CHECKLIST (remove before release):
- Verify the GitHub Releases link and the workstation screenshot path.
- Verify all control labels and exercise details against the V1 release build.
- Confirm the current saved-progress behavior described below.
- Replace pending documentation references when those guides are published.
-->


<p align="center">
  <img src="https://github.com/user-attachments/assets/46ecea47-a22f-4072-a9bc-26a1b6759014" alt="Weintek logo" width="96" />
</p>

<h1 align="center">How to Run the Universal PLC Trainer by Weintek</h1>

<p align="center">
  <strong>Your first circuit, from wiring to working.</strong><br />
  Open the 3D workstation, connect a push button and pilot light, and watch the PLC's built-in simulation respond.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Mode-Internal_simulation-022E68?style=flat-square" alt="Internal simulation mode" />
  <img src="https://img.shields.io/badge/Installation-Not_required-0078F8?style=flat-square" alt="No installation required" />
  <img src="https://img.shields.io/badge/Physical_PLC-Not_required-022E68?style=flat-square" alt="Physical PLC not required" />
  <img src="https://img.shields.io/badge/Start_with-Exercise_1-0078F8?style=flat-square" alt="Start with Exercise 1" />
</p>

<p align="center">
  <a href="#before-you-start"><strong>Requirements</strong></a> &nbsp;·&nbsp;
  <a href="#open-the-trainer">Open the trainer</a> &nbsp;·&nbsp;
  <a href="#complete-your-first-exercise">First exercise</a> &nbsp;·&nbsp;
  <a href="#troubleshooting">Troubleshooting</a> &nbsp;·&nbsp;
  <a href="#see-also">More guides</a>
</p>

<p align="center">
  <a href="docs/assets/trainer-workstation-exercise1.png">
    <img src="docs/assets/trainer-workstation-exercise1.png" alt="Universal PLC Trainer 3D workstation with Exercise 1 selected, showing a power supply, PLC modules, and learning panel" width="650" />
  </a>
</p>

<p align="center"><sub>Figure 1. Universal PLC Trainer workstation with Exercise 1 selected. The learning panel guides students through wiring the 24 VDC power supply to the terminal block.</sub></p>

---

## Overview

This guide walks you through **Exercise 1** of the **Universal PLC Trainer by Weintek**: wire a push button to a PLC input and a pilot light to a PLC output, then press the button to turn on the light.

The trainer runs **locally in a web browser** from a single file on your computer. You do **not** need a physical PLC, CODESYS, an installer, an internet connection, or industrial equipment. The trainer uses its **built-in PLC simulation** for all steps in this guide.

| 1. Open | 2. Wire | 3. Operate |
| :--- | :--- | :--- |
| Launch the 3D workstation and select **Exercise 1**. | Connect the 24 V supply, push button, PLC I/O, and pilot light. | Check your wiring, press the button, and watch the I/O respond. |

> [!NOTE]
> **This is the standalone training route.** External PLC mode is optional and is covered separately in [Connect the trainer to a PLC](how-to_connect-plc.md).

## Before you start

| Requirement | What you need |
| :--- | :--- |
| **Trainer file** | `universal-plc-trainer.html` from the [latest release](../../releases/latest). No companion files are needed for standalone use. |
| **Web browser** | A current version of Chrome, Edge, Firefox, or Safari. See [Browser compatibility](README.md#browser-compatibility) for testing details. |
| **3D graphics** | A browser and device with **WebGL** available. Hardware acceleration is recommended. |

**Not required:** Administrator rights, CODESYS, physical PLC hardware, a network connection, or a separate installation.

> [!NOTE]
> **The trainer is one self-contained HTML file.** It includes the 3D engine, fonts, and exercises. You can move or rename it without breaking standalone mode. The optional `trainer-bridge.js` is used only for [connecting to a real PLC](how-to_connect-plc.md); it is not required for these exercises.

## Open the trainer

Choose either method below. **Option A** is recommended for most students; **Option B** is optional for those using VS Code.

<details open>
<summary><strong>Option A — Open the HTML file directly (recommended)</strong></summary>

1. **Save the trainer.** Download `universal-plc-trainer.html` from the [latest release](../../releases/latest) and save it anywhere on your computer, such as `Documents/plc-trainer`.
2. **Launch the workstation.** Double-click the HTML file to open it in your default browser. To use another browser, right-click the file and choose **Open with**.

</details>

<details>
<summary><strong>Option B — Open through VS Code and Live Server</strong></summary>

This method is optional and can be useful if your course already uses VS Code.

1. **Save the file** in a folder on your computer, such as `Documents/plc-trainer`.
2. **Open the folder in VS Code.** Select **File → Open Folder**, then choose the folder containing the trainer.
3. **Install Live Server** if it is not already installed. Open Extensions with `Ctrl+Shift+X` (`Cmd+Shift+X` on macOS), search for **Live Server**, and install it.
4. **Launch the trainer.** Right-click `universal-plc-trainer.html` in VS Code's Explorer and select **Open with Live Server**.

The trainer opens in your browser at a local address similar to `http://127.0.0.1:5500/universal-plc-trainer.html`. Live Server remains active until stopped and can reload the page when the file changes.

> [!TIP]
> You do **not** need VS Code or Live Server to use the trainer. If extension installation is restricted, choose Option A.

</details>

### Once the workstation opens

1. **Confirm the 3D workstation appears.** You should see a power supply, PLC I/O modules, terminal block, push button, and pilot light. If the scene is blank, see [Troubleshooting](#troubleshooting).
2. **Get familiar with the controls.** Use the table below to navigate the workstation.

| Control | How to use it |
| :--- | :--- |
| **Orbit** | Drag with the mouse to rotate your view around the workstation. |
| **Zoom** | Scroll to zoom in or out. **Double-click a terminal** to zoom directly to it. |
| **Pan** | Use the pan controls to reposition the view. |
| **GO TO** | Jump to a station; select the **GO TO** header to collapse the list and make more room. |
| **Learning panel** | Browse exercises and follow the instructions. Drag the panel aside if it covers equipment. |

3. **Select Exercise 1.** Open the exercise library in the learning panel and choose **Exercise 1 — Wire a push button and light**.

All exercises are available from the start; no prior exercise must be completed to unlock another.

> [!TIP]
> Terminal labels can be hard to read at full-bench zoom. **Double-click a terminal before wiring it** to get a closer view.

## Complete your first exercise

**Goal:** Wire a push button to **DI0** and a pilot light to **DO0** so the light turns on while the button is held. Follow the exact terminal-to-terminal connections shown in the trainer's learning panel. The steps here explain **why** each stage matters.

### How the circuit works

```mermaid
flowchart LR
    A["Push button"] -->|Input signal| B["PLC input · DI0"]
    B --> C["Built-in PLC program"]
    C --> D["PLC output · DO0"]
    D --> E["Pilot light"]
```

*This shows the signal flow, not the complete wiring diagram. Supply and return connections are still required.*

### Step-by-step walkthrough

1. **Read the current step.** The learning panel tells you what to connect and why. Use its terminal labels for the exact connections.

2. **Power the panel first.** The bench starts with no wires installed. Connect the supply's **L+** to the **+24 V** terminal and its **M** to the **0 V** terminal. Every exercise starts with the supply rails; check them first whenever something appears unpowered.

3. **Wire the push button to the PLC input.** Click one terminal and then the second to create a wire. To remove a wire, click it.

4. **Wire the PLC output to the pilot light.** Follow the guided connections. The **output module needs its own power connections**, in addition to the signal wire. A correct output signal cannot operate an unpowered module.

5. **Check your wiring.** Press **CHECK WIRING** at any point to review installed wires, missing connections, and connections that do not match the intended circuit.

6. **Test the circuit.** Switch to **Operate** mode, then press and hold the push button. The **pilot light should turn on while the button is held**.

7. **Watch the signals.** Open the **PLC & I/O** tab and press the button again. Follow the sequence: the **DI0** contact closes, the built-in program rung becomes true, and the **DO0** coil energizes.

8. **Try it again.** Select **RESET WIRING** to remove the wires you installed. This **does not affect exercise progress**.

### Understanding CHECK WIRING feedback

| Feedback | What it means | What to do |
| :--- | :--- | :--- |
| **Correct** | The checked connection matches the intended circuit. | Continue to the next guided step. |
| **Try again** | A connection is missing or does not match the intended wiring. | Review the learning panel and adjust your wires. |
| **Safety warning** | The wiring represents a potentially hazardous connection. | Stop and correct that connection before continuing. |

> [!WARNING]
> **A passing signal check is not the same as a complete powered circuit.** If the lamp stays off, check the **+24 V and 0 V supply rails**, the **output module's power connections**, and the **lamp's return to 0 V**.

## Keep exploring

When you finish Exercise 1, you can choose another guided exercise, use Free Practice, or try a diagnostic scenario.

| Mode | What you'll do |
| :--- | :--- |
| **Guided exercises** | Follow instructions to build and understand additional industrial I/O circuits. |
| **Free Practice** | Make your own connections without a prescribed circuit. The trainer evaluates wiring and explains incorrect connections. |
| **Diagnostic scenarios** | Start with a pre-wired bench, observe the symptoms, and find the hidden fault. |

> [!TIP]
> The trainer's **System** tab provides a glossary, I/O address map, and explanation of the simulation if you encounter unfamiliar terminology.

## Troubleshooting

Expand the category that best matches what you're seeing.

<details>
<summary><strong>Opening the trainer and viewing the workstation</strong></summary>

| Symptom | What to try |
| :--- | :--- |
| **The page opens, but the workstation is blank.** | Check that the downloaded HTML file is complete and reload the page. If WebGL is blocked or unavailable, try another supported browser. An unusually small HTML file may indicate an incomplete download. |
| **The browser says 3D graphics are unavailable.** | WebGL is unavailable or blocked. Try another supported browser. If none works, check your device's graphics capabilities and policy settings. |

</details>

<details>
<summary><strong>Connecting wires and completing guided steps</strong></summary>

| Symptom | What to try |
| :--- | :--- |
| **Wires will not connect.** | Confirm you're in **Wiring** mode, not Operate mode. Click directly on a terminal; double-click it to zoom closer if needed. |
| **A guided step will not complete, but no feedback appears.** | A required connection may be missing, often a supply rail. Press **CHECK WIRING** to see what is missing. |
| **The push button does nothing.** | Switch to **Operate** mode. If already there, check the output module's power and the pilot light's return to **0 V**. |

</details>

<details>
<summary><strong>Progress and resets</strong></summary>

| Symptom | What to know |
| :--- | :--- |
| **Where is my progress kept?** | In the browser you opened the trainer with, on that computer. Reopen it the same way to carry on where you left off. A different browser, a different computer, or private/incognito browsing each start fresh. |
| **I want to start over.** | **SYSTEM → Clear saved progress**. It asks for a second click to confirm, and it cannot be undone. |
| **RESET WIRING clears the bench.** | This is expected. It removes installed wires **without changing exercise progress**. |

</details>

**Still experiencing issues?** Email [support@weintekusa.com](mailto:support@weintekusa.com) with a brief description of what happened and any relevant screenshots.

## See also

| Resource | Purpose |
| :--- | :--- |
| [Project README](README.md) | Product overview, requirements, support, and feedback. |
| [Connect the trainer to a PLC](how-to_connect-plc.md) | Optional bridge setup, Modbus TCP communication, and CODESYS configuration. |
| [Browser compatibility and system requirements](README.md#browser-compatibility) | Tested browsers, WebGL requirements, and current compatibility limitations. |
| **Known simplifications and scope** *(guide pending)* | What the trainer models and what it deliberately does not. |
| **System tab (inside the trainer)** | Glossary, I/O address map, and simulation behavior. |

---

<p align="center"><sub>Universal PLC Trainer by Weintek · Published by <strong>Weintek USA</strong></sub></p>
