# Trying the ioBroker Script Without a Real NSPanel

## Introduction

Once your NSPanel is mounted in the wall and you want to configure a new page, you find yourself walking back and forth between PC and panel to test functionality. The exercise might be healthy, but it kills your productivity. With this setup you can test the layout in an emulator instead.

After an ioBroker script update you can also use the emulator to check whether everything still works before pushing the change to your live instance. And finally, this is interesting for everyone who has not bought an NSPanel yet but wants to try the project before purchasing one.

![nextionEditor](Pictures/emulator/nextionEditor.png)

## Prerequisites

You need:

* a PC (tested on Windows 11)
* an ESP32 with Tasmota32
* the Nextion Editor
* an ioBroker installation.

<img src="Pictures/emulator/esp32.jpeg" alt="esp32" width="25%" height="25%">

> The ESP32 stays connected to the PC via USB data cable.

## Preparations

Once the ESP32 has arrived, plug it into the PC via USB. You may need to install the driver for the USB-to-UART bridge (e.g. CP210x Universal Windows Driver). After driver installation the device shows up in Windows Device Manager under *Ports* as e.g. *Silicon Labs CP210x USB to UART Bridge* on COM3.

Now install Tasmota on the ESP via the web installer: open https://tasmota.github.io/install/ in your browser. According to the Tasmota docs you must use Chrome or Edge. Pick *ESP32* on the right and *Tasmota* on the left. Click *CONNECT* and choose the COM port of your CP210x USB-to-UART bridge.

Once Tasmota is installed on the ESP32 you can enter your Wi-Fi credentials. Tasmota then takes you straight to the Tasmota web UI of the device. Close the installer page and briefly disconnect USB.

When the ESP is reachable again, check *Configure → Configure Module* and verify that RX (GPIO3) and TX (GPIO1) are set to **none**.

<img src="Pictures/emulator/tasmotaConfig.png" alt="esp32" width="25%" height="25%">

Now configure Tasmota and MQTT via the adapter admin UI. Follow the instructions up to (and including) the **NSPanel initialization** button. [Link to the installation guide](en-Adapter-Installation#basic-setup-mqtt).

## Berry Driver for Emulation

**ATTENTION:** Do not use the Berry driver from the wiki. Use the file linked below.

Download [tasmota/Emulator/autoexec.be](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/tasmota/Emulator/autoexec.be) from GitHub.

<img src="Pictures/emulator/Github.png" alt="esp32" width="25%" height="25%">

Once the panel appears in the list you have to install the Berry driver manually. On the ESP32 navigate to *Tools → Manage File System*.

<img src="Pictures/emulator/dateisystem.png" alt="esp32" width="25%" height="25%">

If an `autoexec.be` already exists (see the picture), delete it using the flame icon.
Pick the downloaded file via *Choose File* and click *Upload* to copy it to the chip.

After uploading `autoexec.be`, reboot the ESP32 once.

## Installing the Nextion Editor

You also need the Nextion Editor:
> https://nextion.tech/nextion-editor/

…and the HMI file from this repository (folder `HMI`). Install the editor, open `nspanel.hmi` and click **Debug** at the top. A new window opens. At the bottom left switch from *Keyboard Input* to *User MCU Input*, pick the COM port of the ESP and set the baud rate to **115200**. Click **Start** to connect to the ESP.

<img src="Pictures/emulator/netionEditorPort.png" alt="esp32" width="75%" height="75%">

Now run the DEV script in ioBroker. If everything was set up correctly, the first page appears in the Nextion Editor a moment later.

You now have a fully clickable, emulated NSPanel where you can develop and test new pages without touching the real device. Once you are happy with your changes you can move them into your production script.

## Notes

**A few additional tips:**

* Enable the ESP32 temperature with `setOption146 1`.

* Unlike the real NSPanel, the emulator ESP32 has neither a temperature sensor nor buttons/relays — so it cannot fill those datapoints itself. To avoid errors set the datapoint
  `0_userdata.0.NSPanel.Dev.Sensor.ANALOG.Temperature`
  to a reasonable room temperature value (e.g. 21).

* The status icons in the screensaver are also missing real values. Since the emulator usually mirrors an existing physical NSPanel, you can point the MQTT paths for the relay icons to the physical panel.

**Have fun with the emulator!**
