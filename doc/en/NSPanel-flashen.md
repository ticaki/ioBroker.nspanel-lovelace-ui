**What you need:**
* FTDI adapter
* Sonoff NSPanel
* 5 pins of a pin header with 2.54 mm pitch
* 5 jumper/Dupont cables female/female, separable
* A little bit of courage, because we take no liability for damage caused by following this guide ;-)

> [!IMPORTANT]  
> **Attention!**  
> * This procedure cannot be undone!  
> * There is **"no"** known way back to the original firmware  

***


**To flash, either follow this video** https://www.youtube.com/watch?v=uqPz08ZpFW8 ...

... **or go by the description below**:

The touch plate is held by only two screws that fix the plastic cover. Removing it reveals a well labelled board marked „E32-MSW-NX" and „NSPanel-EU".

The eye goes straight to the five pin holes at the bottom that we all like to see: 3V3, RX, TX, GND and IO0. Easy access for flashing! If you want to solder a pin header there permanently, take care to protect the other side with insulating tape to prevent a short circuit on the metal shielding. Soldering a pin header is not required as such.

Pin assignment for the FTDI adapter

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/22e56bf6-b35d-4d11-9054-d1e2593954a5)

1) Set your serial adapter (FTDI) to 3.3 V
2) Connect it to the pins GND, ESP_RX, ESP_TX and 3V3 on the board (marked yellow in the picture above).
3) Make sure RX-TX are crossed between the NSPanel and the FTDI.
4) Grab a Dupont cable and connect it between IO0 and one of the GND pins on the right (next to the 5V pins) to force the NSPanel to boot into flash mode.
5) Apply a little pressure to the Dupont cables to ensure a good connection, then plug the FTDI into your computer.

You do not have to take the NSPanel completely apart to flash it. It is enough to carefully slide a check card or a business card under the five pins of the board to avoid a short circuit with the metal foil below the board on the housing.
![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/810b67e0-0d01-4210-8059-5a712d2a49ac)

**Make sure that GPIO0 stays connected to ground during the whole flashing process.**
![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/8dcc0832-3663-4f26-b1a2-3b4613cec36d)

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/729f2d33-a46e-48d8-b38f-480f994bf24a)

Use the web installer - that is the quickest way - https://tasmota.github.io/install/
![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/87420a15-9080-416a-93d2-643febad9c23)

1) Open the Tasmota Web Installer in Chrome or Edge, because the browser has to be able to connect to your serial device.
2) Choose Tasmota32 Sonoff-NSPanel (English).
3) Press „Connect".
4) Select the serial device in the popup.
5) Flash Tasmota.

Follow the instructions of the Tasmota web installer - after about 5 minutes your NSPanel is ready for live operation.
