<p align="center">
  <img src="https://github.com/user-attachments/assets/46ecea47-a22f-4072-a9bc-26a1b6759014" alt="Weintek logo" width="96" />
</p>

<h1 align="center">Universal Virtual PLC Trainer</h1>

<p align="center">
  <strong>Wire it. Test it. Troubleshoot it.</strong><br />
  Practice industrial I/O in a hands-on 3D workstation—no physical trainer bench required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-V1-022E68?style=flat-square" alt="Version V1" />
  <img src="https://img.shields.io/badge/Guided_exercises-5-0078F8?style=flat-square" alt="5 guided exercises" />
  <img src="https://img.shields.io/badge/Fault_scenarios-9-022E68?style=flat-square" alt="9 diagnostic scenarios" />
  <img src="https://img.shields.io/badge/Hardware-Not_required-0078F8?style=flat-square" alt="No physical hardware required" />
</p>

<p align="center">
  <sub>Published by <strong>Weintek USA</strong> · Version V1 · Release date to be announced</sub>
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick start</strong></a> &nbsp;·&nbsp;
  <a href="#what-you-can-learn">What you'll learn</a> &nbsp;·&nbsp;
  <a href="#connect-to-a-real-plc">PLC connection</a> &nbsp;·&nbsp;
  <a href="#troubleshooting">Troubleshooting</a> &nbsp;·&nbsp;
  <a href="#support-and-feedback">Get help</a>
</p>

<!--
PRODUCT PREVIEW: When you have a screenshot, replace this comment with:

<p align="center">
  <img src="docs/assets/trainer-workstation.png" alt="Universal Virtual PLC Trainer 3D workstation showing a PLC, I/O modules, power supply, and wiring" width="900" />
</p>
<p align="center"><sub>The 3D workstation: build, operate, and troubleshoot industrial control circuits.</sub></p>

Commit the screenshot to the specified path (or update the path) before enabling it.
-->

---

## Overview

The **Universal Virtual PLC Trainer** is a browser-based learning environment for practicing industrial control wiring. Connect components in a 3D workstation and see how the simulated electrical system responds: correct circuits operate, wiring mistakes cause realistic symptoms, and modeled hazardous connections are flagged.

It teaches how PLC inputs and outputs connect to push buttons, sensors, transmitters, pilot lights, and motors—and how wiring decisions affect what a PLC reads and drives. Instead of relying on a physical training panel, you can learn, experiment, and diagnose faults at your own pace.

| Build circuits | Learn by doing | Find the fault |
| :--- | :--- | :--- |
| Connect terminals, supply rails, and field devices in a 3D workstation. | Work through **5 guided exercises** spanning digital and analog I/O. | Solve **9 diagnostic scenarios**, each with a hidden wiring fault. |

> [!NOTE]
> This is an educational simulation. It models selected electrical behaviors and wiring hazards; it does not replace approved safety procedures or hands-on training with supervised equipment.

## Quick start

**No installation, administrator access, network connection, or physical PLC is required for the built-in simulation.**

<!-- Add an official download URL here when available. -->

1. **Download the trainer files.** Obtain `trainer.html` and `trainer.js` from the release package. (Use the actual filenames supplied with your build.)
2. **Keep both files together.** Save them in the same folder without changing their names. The HTML file loads the JavaScript file from alongside it.
3. **Open the trainer.** Double-click the HTML file, or right-click it and select **Open with** to choose a different browser.
4. **Choose an exercise.** Once the 3D workstation appears, open the exercise library in the learning panel. Start with **Exercise 1** for the recommended introduction.

All exercises are available from the start; there are no locked levels or prerequisites.

**What you'll see:** A mounting panel with a power supply, PLC input and output modules, a terminal block, a push button, and a pilot light.

> **New to industrial I/O?** No prior industrial experience is required. The trainer introduces terminology as it becomes relevant, and the **System** tab provides reference information.

## What you can learn

| Learning mode | What to expect |
| :--- | :--- |
| **5 guided exercises** | Build from basic digital I/O to 4–20 mA and 0–10 V analog measurement, sensor wiring, and Start/Stop seal-in motor control. |
| **9 diagnostic scenarios** | Inspect a pre-wired bench, interpret the symptoms, and find a hidden fault. |
| **Independent exploration** | Experiment with wiring and I/O behavior without physical hardware. |

The trainer is designed for **students, new technicians, integrators, and Weintek customers** who want to develop practical wiring and troubleshooting skills.

### Working with the workstation

- **Wiring mode:** Select terminals and make connections. Double-click a terminal when you need a closer view.
- **Operate mode:** Interact with devices such as the push button and observe how the circuit responds.
- **Check Wiring:** If a guided step does not complete, use this control to see what the circuit is missing.

## System requirements

| Required for the built-in trainer | Details |
| :--- | :--- |
| **Trainer files** | The HTML and JavaScript files supplied with the release, kept in the same folder. |
| **Browser** | A modern browser with WebGL enabled. Supported browsers and minimum versions will be confirmed for release. |
| **Graphics** | WebGL must be available. A dedicated graphics card is not required, but performance and availability depend on browser and device settings. |
| **Network and hardware** | No network connection, PLC hardware, or administrator rights are required for local use. |

**Virtual machines and remote desktops:** These may work, but their graphics configurations can restrict WebGL. If the workstation is blank, check the troubleshooting guidance below.

## Connect to a real PLC

For a more advanced workflow, the trainer can exchange its I/O with a real PLC runtime. In this mode, **your PLC program reads the virtual bench inputs and controls its outputs**, rather than the trainer's built-in logic handling them.

This connection uses a separate bridge because browser pages cannot open raw Modbus TCP sockets. The bridge serves the trainer's I/O image over **Modbus TCP**, where the PLC polls it as a client.

**Additional requirements for external PLC mode:**

- `universal-plc-trainer-bridge.js` — the bridge service
- **Node.js 22 or later** — to run the bridge
- **CODESYS V3.5 SP21 Patch 6+** with the **CODESYS Control Win V3 x64** runtime and **Modbus TCP Client** device package

The bridge setup, register map, CODESYS configuration, and verification steps will be documented in `how-to_connect-a-plc.md` (guide in preparation).

> [!IMPORTANT]
> The bridge and PLC software are **optional**. You can complete the built-in training exercises without either one.

## Troubleshooting

If something doesn't work as expected, open the common issues below.

<details>
<summary><strong>Show common issues and fixes</strong></summary>

| Issue | What to try |
| :--- | :--- |
| **The page loads, but the workstation is blank.** | Confirm the HTML and JavaScript files are together and have their original filenames. Reload the page. |
| **The browser reports that 3D graphics are unavailable.** | Verify that WebGL is enabled. Try another supported browser, or check graphics policies and remote-desktop settings. |
| **Wires will not connect.** | Switch to **Wiring** mode and click a terminal, not the surrounding panel. Double-click a terminal to zoom in first. |
| **A guided step will not complete.** | Press **CHECK WIRING** to review missing connections, especially the supply rails. |
| **The push button does nothing.** | Switch to **Operate** mode. Check the output module's power wiring and the pilot light's return to 0 V. |
| **Progress disappears after reloading.** | This is expected in V1; progress persistence has not been implemented. |

</details>

For additional guidance, consult the getting-started guide or contact support below.

## Documentation

| Resource | Contents |
| :--- | :--- |
| **Getting-started guide** | Open the trainer, understand the interface, and complete your first exercise. |
| **PLC connection guide** (`how-to_connect-a-plc.md`) | Bridge setup, Modbus TCP mapping, CODESYS configuration, and verification. *In preparation.* |
| **System requirements** | Confirmed browser and platform compatibility. *To be finalized.* |
| **Known simplifications and scope** | What the simulation models and what it intentionally simplifies. *To be linked.* |
| **System tab (inside the trainer)** | Glossary, I/O address map, and an explanation of how the simulation works. |

<!-- Link the guide titles above when the corresponding files or pages exist. -->

## Support and feedback

Questions, suggestions, and defect reports help improve the trainer. Because this release is distributed as a **compiled build rather than source code**, please submit corrections, ideas for new exercises, and bug reports through the feedback form provided with the release.

- **Community questions:** [WeintekUSA Forum](https://forum.weintekusa.com/)
- **Direct support:** [arden-yazici@weintekusa.com](mailto:arden-yazici@weintekusa.com)
- **Additional help:** FAQ and getting-started guide (links to be added)

Support for this free product includes installation and startup issues, defect reports, and questions about using the trainer and its exercises. When reporting a problem, describe **what you did, what you expected, and what happened**. If relevant, include the bridge's startup output and a screenshot of the trainer's **PLC & I/O** tab.

## Terms of use

**All rights reserved.** Licensing terms are pending review and have not yet been finalized.


Support for this free product covers installation and startup problems, defect reports, and questions about using the trainer and its exercises. Use any of the contacts above.

## Terms of use

Licensing is not yet determined; all rights reserved pending review.
