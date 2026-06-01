# Adapter Installation

## Prerequisites

- ioBroker with **js-controller >= 7.0.6**
- **Node.js >= 22**
- `nspanel-lovelace-ui` adapter v1.x or newer installed
- An NSPanel flashed with Tasmota (see [Flashing the NSPanel](en-NSPanel-flashen))

## Basic Setup (MQTT)

In the `MQTT Server Settings` tab you have to configure the MQTT connection.

- **IMPORTANT** If the panel has previously been connected to another host, enter `reset 4` in the Tasmota console so that the old connection is forgotten.
  If you restore an ioBroker backup, you must delete the panels from the config and recreate them, because the TLS certificates have to be re-issued. Otherwise pairing will fail.
- When using the **internal MQTT server (from the adapter)**, you can fill in the data automatically via the button. This function also looks for a free port to avoid conflicts with other adapters (e.g. Shelly, Sonoff). **All** MQTT settings in Tasmota are overwritten and adapted to the **adapter MQTT server**.
- When using an external MQTT server (mosquitto or the MQTT adapter), fill in the fields below manually:
  - IP of the external MQTT server → for the MQTT adapter, enter the IP of the ioBroker host.
  - MQTT port → make sure the port is not already used by another adapter or service.
  - Username and password → the credentials Tasmota (the panel) uses to log in to the server.

  <img alt="Startbild" src="Pictures/general/MQTT-Setting.png" width="100%" height="100%"/>

  After saving you can switch to the `Panel Settings` tab.

## Panel Settings

  <img alt="Panel Step 1" src="Pictures/nspanelSettings/Nspanelsettings.png" width="100%" height="100%"/>

- The IP address — if possible, configure a static lease in your router.
- Give the panel a name.
- Set the MQTT topic the panel listens to.
- Pick the panel type [EU, US-P, US-L].
- Choose the time zone.

Finally click the **NSPanel initialization** button.
The MQTT data and Tasmota settings are sent to the panel, the Berry driver is installed, and the NSPanel firmware is flashed (≈ 10 minutes).
After initialization the panel is added to the list automatically.

You can watch the log to see:
- the Berry driver being installed
- the TFT firmware being installed
- the two scripts (panel and global) being created
- the scripts being started
- the adapter restarting and activating the panel

Now you should see a screensaver on the panel.

Once the panel runs with the basic config you can start with the script.

<img alt="Panel Step 5" src="Pictures/Installation/Installation_Panels_5.png" width="50%" height="100%"/>

- The configuration script:

[Example configuration script](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/script/example_sendTo_script_iobroker.ts)

For details about this script, see [**Configuration script** / Introduction](en-ScriptConfig).

If you have questions: Discord, Forum, here, Telegram, Teams — pick whichever you like.

[Alias table](en-ALIAS)
