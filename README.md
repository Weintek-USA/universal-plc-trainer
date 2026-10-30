# Universal Virtual PLC Trainer

Published by Weintek USA · Version V.1 · {release date}

<img width="100" height="100" alt="logo_navy" src="https://github.com/user-attachments/assets/46ecea47-a22f-4072-a9bc-26a1b6759014" />


## Project description

With the Virtual PLC Trainer you can wire industrial control circuits in a 3D workstation and watch real electrical behavior follow: correct wiring works, incorrect wiring fails the way it would in the field, and hazardous wiring is flagged.

The trainer helps you learn how industrial I/O is physically connected — push buttons, sensors, transmitters, motors — and how a PLC reads and drives it. Five guided exercises build from digital I/O through 4–20 mA and 0–10 V analog measurement to sensor wiring and Start/Stop seal-in motor logic. Nine diagnostic scenarios then reverse the format: each bench is pre-wired with a hidden fault to find from the symptoms.

Unlike a traditional PLC trainer board, the Virtual PLC Trainer places the same I/O concepts in a small, realistic workstation, so the wiring you practice is the wiring you will meet on real equipment.

{Include screenshots or a short demo video here.}

## Who this project is for

This project is intended for students and professionals in the industry who want to learn how PLC I/O is wired and troubleshot, without needing access to a physical trainer bench.

It is also useful for integrators and Weintek customers who want a no-cost environment for practicing field wiring and fault-finding.

No prior industrial experience required! Terminology is introduced and explained as each exercise needs it.

## Project dependencies

Before using the Virtual PLC Trainer, ensure you have:

- Both trainer files, kept together in the same folder: {trainer.html} and {trainer.js}
- A supported browser — {Chrome / Edge / Firefox / Safari, minimum versions}
- A browser with WebGL enabled. A dedicated graphics card is not needed — the trainer runs on software rendering, so virtual machines and remote desktops are fine.

Administrator rights, a network connection and industrial hardware are not required.

Optional, for connecting the trainer to a real PLC:

- universal-plc-trainer-bridge.js, the bridge service
- Node.js 22 or later, to run it
- CODESYS V3.5 SP21 Patch 6+ with the CODESYS Control Win V3 x64 runtime, and the Modbus TCP Client device package

## Instructions for using the Virtual PLC Trainer

Get started by downloading both files from {download URL} and saving them into the same folder.

### Download the Virtual PLC Trainer

The trainer runs entirely in your browser.

1. Download both files from {download URL}.
2. Save them into the same folder. Keep the filenames exactly as supplied — the HTML file loads the JS file by name from alongside it, so renaming either file, or separating them, stops the trainer loading.

### Run the Virtual PLC Trainer
 
1. Double-click the HTML file. It opens in your default browser; to use a different browser, right-click the file and choose Open with.
2. Wait for the 3D workstation to appear. It shows a mounting panel with a power supply, a PLC with input and output modules, a terminal block, and a push button and pilot light.
3. Open the exercise library in the learning panel and select an exercise. All exercises are available from the start; none require completing another first. Exercise 1 is the recommended starting point.
For a step-by-step walkthrough of the first exercise, see the get-started guide.
 
### Connect to a real PLC
 
The trainer can hand its I/O over to a real PLC, so that your program reads the bench's wiring and drives its outputs instead of the built-in simulation.
 
This requires the bridge service and Node.js alongside the trainer files. A browser cannot open a raw TCP socket, and the trainer must act as the Modbus server so the PLC can poll it — neither is possible from a web page, so the bridge carries the trainer's I/O image to and from the PLC over Modbus TCP.
 
For the bridge, CODESYS configuration, register map, and verification steps, see `how-to_connect-a-plc.md`.

### Troubleshoot the Virtual PLC Trainer

| Issue | Solution |
| --- | --- |
| The page loads but the workstation area stays blank | The JS file is missing, renamed, or in a different folder from the HTML file. Restore both to the same folder under their original names and reload. |
| A message says 3D graphics are unavailable | The browser cannot use WebGL. Try another supported browser; if none works, the machine's graphics or its policy settings are blocking it. |
| Wires will not connect | Check that you are in wiring mode rather than Operate mode, and that you clicked a terminal rather than near one. Double-click a terminal to zoom in before clicking it. |
| A guided step will not complete, with no feedback | Something the step requires is missing but not stated — most often the supply rails. Press CHECK WIRING for a list of what is missing. |
| Pressing the button does nothing | Switch to Operate mode. If already in Operate mode, check the output module's power connections and the lamp's return to 0 V. |
| Progress is lost after reloading the page | Expected in this build. Progress persistence is not yet implemented. |

Other troubleshooting supports: {link to FAQ}, the get-started guide's own troubleshooting table, and {link to the support contact}.

## Contributing guidelines

The Virtual PLC Trainer is distributed as a compiled build rather than as source. Please use the provided form to send corrects, suggest exercises, and report any defects.

## Additional documentation

For more information:

- Get started with the Virtual PLC Trainer — open the trainer and complete your first exercise
- Connect the Virtual PLC Trainer to a PLC — Modbus TCP over the bridge service *(not written yet)*
- {System requirements} — supported browsers and minimum versions
- {Known simplifications and scope} — what the trainer models exactly and what it deliberately does not
- The System tab inside the trainer — glossary, I/O address map, and how the simulation works

## How to get help

- Non-urgent questions: WeintekUSA Forum
- {FAQ}
- Support email: arden-yazici@weintekusa.com

Support for this free product covers installation and startup problems, defect reports, and questions about using the trainer and its exercises. Use any of the contacts above.

## Terms of use

Licensing is not yet determined; all rights reserved pending review.
