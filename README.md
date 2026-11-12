
<p align="center">
  <img src="docs/assets/weintekusa-logo-horizontal.png" alt="WeintekUSA logo" width="240" />
</p>

<h1 align="center">Universal Virtual PLC Trainer</h1>

<p align="center">
  <strong>Wire it. Test it. Troubleshoot it.</strong><br />
  Practice industrial I/O in a hands-on 3D workstation—no physical trainer bench required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-V1-022E68?style=flat-square" alt="Version V1" />
  <img src="https://img.shields.io/badge/Release-Alpha-0078F8?style=flat-square" alt="Alpha release" />
  <img src="https://img.shields.io/badge/Guided_exercises-6-0078F8?style=flat-square" alt="6 guided exercises" />
  <img src="https://img.shields.io/badge/Fault_scenarios-9-022E68?style=flat-square" alt="9 diagnostic scenarios" />
  <img src="https://img.shields.io/badge/Hardware-Not_required-0078F8?style=flat-square" alt="No physical hardware required" />
</p>

<p align="center">
  <sub>Published by <strong>Weintek USA</strong> · Alpha release · November 12, 2026</sub>
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick start</strong></a> &nbsp;·&nbsp;
  <a href="#what-you-can-learn">What you'll learn</a> &nbsp;·&nbsp;
  <a href="#browser-compatibility">Browser compatibility</a>
</p>
<p align="center">
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

## Alpha testing and feedback

**Version V1 is available for alpha testing.** Test the exercises, explore the workstation, and share what works well or needs improvement. Feedback on the overall trainer and individual issues is welcome.

- **[Report a fault or request a feature](https://airtable.com/app4aD7d8dUZWlUT0/pagLJnoYMYpbd6UyK/form)** — Use this form for a specific bug, unexpected behavior, or improvement idea.
- **[Submit an overall review](https://airtable.com/app4aD7d8dUZWlUT0/pageaZrlMt8toMNYm/form)** — Share your general experience with the trainer, including usability, learning value, and overall impressions.

Both forms collect feedback on the **Universal Virtual PLC Trainer as a whole**. Thank you for helping improve this alpha release.

## Overview

The **Universal Virtual PLC Trainer** is a browser-based learning environment for practicing industrial control wiring. Connect components in a 3D workstation and see how the simulated electrical system responds: correct circuits operate, wiring mistakes cause realistic symptoms, and modeled hazardous connections are flagged.

It teaches how PLC inputs and outputs connect to push buttons, sensors, transmitters, pilot lights, and motors—and how wiring decisions affect what a PLC reads and drives. Instead of relying on a physical training panel, you can learn, experiment, and diagnose faults at your own pace.

| Build circuits | Learn by doing | Find the fault |
| :--- | :--- | :--- |
| Connect terminals, supply rails, and field devices in a 3D workstation. | Work through **6 guided exercises** spanning digital and analog I/O. | Solve **9 diagnostic scenarios**, each with a hidden wiring fault. |

> [!NOTE]
> This is an educational simulation. It models selected electrical behaviors and wiring hazards; it does not replace approved safety procedures or hands-on training with supervised equipment.

## Quick start

**No installation, admin access, network connection, or physical PLC is required for the built-in simulation.**

1. **Download `universal-plc-trainer.html`** from the [V1 alpha release](../../releases/tag/v1.0.0-alpha.1). Use the release page, not the file view in the repository — GitHub serves `.html` files as plain text, so a link from the file list shows you the source code instead of the trainer.
2. **Open it.** Double-click the file, or right-click and choose **Open with** to pick a different browser.
3. **Choose an exercise.** When the 3D workstation appears, open the exercise library in the learning panel and start with **Exercise 1 — Wire a push button and light**.

That is the whole setup. The trainer is a single self-contained file: everything it needs, including its fonts and 3D engine, is inside it, so it runs offline and you can rename it or move it anywhere.

All exercises are available from the start; there are no locked levels or prerequisites.

### Where to go next

| If you want to… | Go to |
| :--- | :--- |
| Open the trainer and work through your first circuit, step by step | [Getting-started guide](how-to_get-started.md) |
| Launch it from **VS Code** instead of double-clicking | [Getting started → Open the trainer](how-to_get-started.md#open-the-trainer) |
| Run your own PLC program against the virtual bench | [Connect to a PLC](how-to_connect-plc.md) |
| Check whether your browser is supported | [Browser compatibility](#browser-compatibility) |

**What you'll see:** A mounting panel with a power supply, PLC input and output modules, a terminal block, a push button, and a pilot light.

> **New to industrial I/O?** No prior industrial experience is required. The trainer introduces terminology as it becomes relevant, and the **System** tab provides reference information.

## What you can learn

| Learning mode | What to expect |
| :--- | :--- |
| **6 guided exercises** | Build from basic digital I/O to 4–20 mA and 0–10 V analog measurement, sensor wiring, and Start/Stop seal-in motor control, then troubleshoot a loose connection. |
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
| **Trainer file** | `universal-plc-trainer.html` — one self-contained file. |
| **Browser** | A modern browser with WebGL enabled. See [Browser compatibility](#browser-compatibility) for tested environments. |
| **Graphics** | WebGL must be available. A dedicated graphics card is not required, but performance and availability depend on browser and device settings. |
| **Network and hardware** | No network connection, PLC hardware, or administrator rights are required for local use. |

**Virtual machines and remote desktops:** These may work, but their graphics configurations can restrict WebGL. If the workstation is blank, check the troubleshooting guidance below.

## Browser compatibility

The **Universal Virtual PLC Trainer** has been tested with the following desktop browsers for the V1 release:

| Browser | Verification status | Test environment |
| :--- | :--- | :--- |
| **Google Chrome** | ✅ Tested successfully | Windows PC |
| **Microsoft Edge** | ✅ Tested successfully | Windows PC |
| **Mozilla Firefox** | ✅ Tested successfully | Windows PC |
| **Safari (macOS)** | ✅ Tested successfully | BrowserStack |

**Recommended:** Use a current stable version of Chrome, Edge, Firefox, or Safari with WebGL available. Hardware-accelerated graphics are recommended for smoother interaction with the 3D workstation.

> [!NOTE]
> **Testing scope:** Browser compatibility information is based on third-party WebGL research and internal testing. While older browser versions may support WebGL, compatibility with the Universal Virtual PLC Trainer has not been verified. Hardware acceleration is recommended for optimal performance.

## Connect to a real PLC

For a more advanced workflow, the trainer can exchange its I/O with a real PLC runtime. In this mode, **your PLC program reads the virtual bench inputs and controls its outputs**, rather than the trainer's built-in logic handling them.

This connection uses a separate bridge because browser pages cannot open raw Modbus TCP sockets. The bridge serves the trainer's I/O image over **Modbus TCP**, where the PLC polls it as a client.

**Additional requirements for external PLC mode:**

- `trainer-bridge.js` — the bridge service, from the same release
- **Node.js 22 or later** — to run the bridge
- **CODESYS V3.5 SP21 Patch 6+** with the **CODESYS Control Win V3 x64** runtime and **Modbus TCP Client** device package

The bridge setup, register map, CODESYS configuration, and verification steps are documented in the [Connect to a PLC guide](how-to_connect-plc.md).

> [!IMPORTANT]
> The bridge and PLC software are **optional**. You can complete the built-in training exercises without either one.

## Troubleshooting

If something doesn't work as expected, open the common issues below.

<details>
<summary><strong>Show common issues and fixes</strong></summary>

| Issue | What to try |
| :--- | :--- |
| **The browser shows a wall of code instead of the trainer.** | The file was opened from a repository link rather than downloaded. Get it from the [V1 alpha release](../../releases/tag/v1.0.0-alpha.1) and save it to your computer first. |
| **The page loads, but the workstation is blank.** | WebGL is unavailable or blocked. Try another supported browser; see [Browser compatibility](#browser-compatibility). |
| **The trainer will not open at all.** | Make sure the download finished — the file is about 1 MB. A truncated download shows a blank or broken page. |

</details>

Everything else is covered where it belongs: wiring, exercises and the 3D view in the
[getting-started guide](how-to_get-started.md#troubleshooting), and the bridge, Modbus and CODESYS
in the [PLC connection guide](how-to_connect-plc.md#troubleshooting). If neither helps, contact
support below.

## Documentation

| Resource | Contents |
| :--- | :--- |
| [Getting-started guide](how-to_get-started.md) | Open the trainer, understand the interface, and complete your first exercise. |
| [PLC connection guide](how-to_connect-plc.md) | Bridge setup, Modbus TCP mapping, CODESYS configuration, and verification. |
| [Browser compatibility](#browser-compatibility) | Tested browsers, graphics requirements, and current validation scope. |
| **Known simplifications and scope** | What the simulation models and what it intentionally simplifies. *To be linked.* |
| **System tab (inside the trainer)** | Glossary, I/O address map, and an explanation of how the simulation works. |

<!-- Add links to future documentation when those guides are published. -->

## Support and feedback

**Support for this free product includes installation and startup issues, defect reports, and questions about using the trainer and its exercises.**

Alpha tester feedback is welcome, whether it concerns a specific issue or the overall experience with the trainer.

- **Bug reports and feature requests:** [Submit a specific issue or suggestion](https://airtable.com/app4aD7d8dUZWlUT0/pagLJnoYMYpbd6UyK/form)
- **General feedback:** [Submit an overall trainer review](https://airtable.com/app4aD7d8dUZWlUT0/pageaZrlMt8toMNYm/form)
- **Community questions:** [WeintekUSA Forum](https://forum.weintekusa.com/)
- **Direct support:** [support@weintekusa.com](mailto:support@weintekusa.com)
- **Getting started:** [Getting-started guide](how-to_get-started.md)

Because this release is distributed as a **compiled build rather than source code**, please use the feedback forms above to submit corrections, suggestions, and bug reports.

## Terms of use

All rights reserved. Licensing terms are pending review and have not yet been finalized.

