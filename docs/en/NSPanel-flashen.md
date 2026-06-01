# Flashing the NSPanel

**You need:**

* an FTDI adapter
* a Sonoff NSPanel
* 5 pins of a 2.54 mm pitch pin header
* 5 female/female Dupont/jumper wires (separable)
* a little courage — we take no responsibility for damage caused by following this guide ;-)

> [!IMPORTANT]
> **Warning!**
> * This procedure cannot be undone!
> * There is **"no"** known way back to the original firmware.

***

**Either follow this video to flash:** https://www.youtube.com/watch?v=uqPz08ZpFW8 …

… **or follow the step-by-step description below**:

The touch plate only has two screws holding the plastic cover. When you remove it, you see a well-labelled PCB marked “E32-MSW-NX” and “NSPanel-EU”.

Your eye is drawn straight to the 5 pin holes at the bottom — exactly what we like to see: 3V3, RX, TX, GND and IO0. Easy access for flashing! If you want to solder a permanent pin header there, protect the other side with insulation tape to avoid shorting against the metal shielding. Soldering a pin header is not strictly necessary.

Pinout for the FTDI adapter:

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/22e56bf6-b35d-4d11-9054-d1e2593954a5)

1. Set your serial adapter (FTDI) to 3.3 V.
2. Connect it to the pins GND, ESP_RX, ESP_TX and 3V3 on the PCB (yellow in the picture above).
3. Make sure RX–TX between NSPanel and FTDI are crossed.
4. Grab a Dupont wire and connect it between IO0 and one of the GND pins on the right (next to the 5 V pins) to force the NSPanel into flash mode on boot.
5. Apply slight pressure to the Dupont wires for a good contact, then plug the FTDI into your computer.

You do not have to disassemble the NSPanel completely to flash it. It is enough to carefully slide a check card or business card under the 5 pins of the PCB to avoid a short circuit with the metal foil under the PCB.

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/810b67e0-0d01-4210-8059-5a712d2a49ac)

**Make sure GPIO0 stays connected to ground for the entire flash process.**

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/8dcc0832-3663-4f26-b1a2-3b4613cec36d)

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/729f2d33-a46e-48d8-b38f-480f994bf24a)

Use the web installer — it is the fastest way — https://tasmota.github.io/install/

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/87420a15-9080-416a-93d2-643febad9c23)

1. Open the Tasmota web installer in Chrome or Edge — the browser must be able to connect to your serial device.
2. Select **Tasmota32 Sonoff-NSPanel (English)**.
3. Press **Connect**.
4. Pick the serial device in the popup.
5. Flash Tasmota.

Follow the instructions of the Tasmota web installer — after about 5 minutes your NSPanel is ready for live operation.
