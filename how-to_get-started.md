# How to run the Universal PLC Trainer by Weintek

## Overview

This guide explains how to open the Virtual PLC Trainer and complete your first exercise — wiring a push button and a pilot light to a PLC, then pressing the button to turn the light on.

The trainer runs in your web browser. There is nothing to install, and it does not require a PLC, an internet connection, or any industrial hardware. Everything in this guide works from two files on your own computer.

## Before you start

Before you open the trainer, make sure you have:

* Both trainer files, kept together in the same folder: `{trainer.html}` and `{trainer.js}`
* A supported browser — {Chrome / Edge / Firefox / Safari, minimum versions}
* A computer whose graphics support WebGL 

Nothing else is required. This route runs the trainer on its own, without connecting it to a PLC, so CODESYS, an installer, administrator rights, a network connection, and industrial hardware are all unnecessary.

If you have been asked to install CODESYS, that is for the separate setup where the trainer drives a real PLC. Nothing in this guide depends on it.

> **Placeholders.** The filenames and browser versions above are in {curly brackets} because they are set when the release candidate is built. Replace them before this guide goes to testers.

## Open the trainer

1. Save both files into the same folder.

    Keep the filenames exactly as supplied. The HTML file loads the JS file by name from alongside it, so renaming either file, or separating them, stops the trainer loading.

2. Double-click the HTML file.

    It opens in your default browser. To use a different browser, right-click the file and choose Open with.

3. Wait for the 3D workstation to appear.

    The workstation shows a mounting panel with a power supply, a PLC with input and output modules, a terminal block, and a push button and pilot light. If the area stays blank, see [Troubleshoot](#troubleshoot).

4. Find your way around.

    4.1. Drag with the mouse to orbit around the workstation; scroll to zoom; use the pan controls to reposition the view.

    4.2. Use **GO TO** to jump to a station. Click its header to collapse the list and recover the screen space.

    4.3. Double-click a terminal to zoom to it. Terminal labels are small at full-bench zoom, so zoom to a terminal before wiring it.

5. Open the exercise library in the learning panel and select **Exercise 1**.

    All exercises are available from the start; none require completing another first. Drag the learning panel to the other side of the screen if it covers the equipment you are working on.

## Complete your first exercise

Exercise 1 wires a push button to a PLC input and a pilot light to a PLC output, so that pressing the button turns the light on. The guided steps in the learning panel give the exact connections; the steps below describe what each stage does.

1. Read the step before wiring anything.

    Each step states what to connect and the reason for the connection.

2. Power the panel first.

    The bench starts bare. Before any device can operate, the supply's L+ must reach a +24 V terminal and the supply's M must reach a 0 V terminal. Every exercise begins this way, so check supply power before diagnosing a device.

3. Wire the button into a PLC input.

    Click one terminal, then the other, to run a wire between them. Click a wire to remove it.

4. Wire the PLC output to the pilot light.

    The output module requires its own power connections in addition to the signal wire. A correctly wired signal into an unpowered module does nothing.

5. Press **CHECK WIRING** at any point.

    It reports every installed wire against the circuit this exercise builds: what is connected, what is missing, and what is connected but not as intended. Feedback has three states — **Correct**, **Try again**, and a **Safety warning** reserved for wiring that would damage equipment or endanger someone.

6. Switch to Operate mode and press the push button.

    The pilot light comes on while the button is held.

7. Open the **PLC & I/O** tab and press the button again while watching it.

    The DI0 contact closes, the program rung goes true, and the DO0 coil energises — the chain from physical device to electrical signal to PLC input to program to output to physical result.

8. Use **RESET WIRING** to clear the bench and repeat the exercise.

    It removes only the wires you installed; exercise progress is unaffected.

### If you want to experiment instead

Free Practice provides the same workstation with no prescribed circuit. Wiring is evaluated as you work, so a deliberately incorrect connection returns an explanation of what it would do. The diagnostic scenarios reverse the format: each is pre-wired with a hidden fault to find from the symptoms.

## Troubleshoot

| Symptom | Likely cause and fix |
| --- | --- |
| The page loads but the workstation area stays blank | The JS file is missing, renamed, or in a different folder from the HTML file. Restore both to the same folder under their original names and reload. |
| A message says 3D graphics are unavailable | The browser cannot use WebGL. Try another supported browser; if none works, the machine's graphics or its policy settings are blocking it. |
| Wires will not connect | Check that you are in wiring mode rather than Operate mode, and that you clicked a terminal rather than near one. Double-click a terminal to zoom in before clicking it. |
| The step will not complete, with no feedback | Something the step requires is missing but not stated — most often the supply rails. Press **CHECK WIRING** for a list of what is missing. |
| Pressing the button does nothing | Switch to Operate mode. If already in Operate mode, check the output module's power connections and the lamp's return to 0 V. |
| Progress is lost after reloading the page | Expected in this build. Progress persistence is a V1 item and is not yet implemented. |

If none of these scenarios apply, please document any technical difficulties encountered in an email to arden-yazici@weintekusa.com. Please include a screenshot of the bench and of the **CHECK WIRING** report.

## See also

* System requirements — supported browsers and minimum versions *(not written yet)*
* Known simplifications and scope — what the trainer models exactly and what it deliberately does not *(not written yet)*
* Connect the trainer to a CODESYS PLC — bridge setup, Modbus TCP configuration, external mode *(not written yet)*
* The **System** tab inside the trainer — glossary, I/O address map, and how the simulation works
