<img src="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/a268be21-25f2-420a-a53c-0286096d4245" width="30%" height="30%">

# ioBroker adapter wiki

## SONOFF NSPanel Lovelace UI GUI - NEXT LEVEL

<img src="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/dfb187fd-3a6f-41cb-9da6-26569e186e9b" width="443px" height="310px" >  <img src="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/66b54f11-6f22-4b3a-a946-6886a46c79dc" width="443px" height="310px" >  

This documentation covers the **ioBroker.nspanel-lovelace-ui** adapter: a user interface for the SONOFF NSPanel in the style of the Lovelace UI, driven entirely from ioBroker. The adapter installs its own Nextion firmware (TFT) on the display and talks to the panel through Tasmota and MQTT.

New to the adapter? Start with the [feature overview](User-NSPanel-Funktionalität) — it explains what the panel can do and how it is meant to be operated.

## From zero to a running panel

| Step | What to do | Page |
|---|---|---|
| 1 | Flash Tasmota onto the panel and upload the TFT firmware | Flashing the NSPanel |
| 2 | Install the adapter and connect the instance to your MQTT broker | Adapter installation |
| 3 | Create pages — in the admin or in the configuration script | [Pages in the admin](PageThermo2-Admin) · Configuration script |
| 4 | Set up the screensaver | [Screensaver – admin](Screensaver-Admin) |

## Two ways to configure the panel

- **In the admin.** Pages with a fixed layout (thermostat, power, chart, QR code, alarm, trash, menu pages) and the screensaver can be created in the instance settings. The editor draws the panel the way it will look later and stores the result in the instance.
- **In the configuration script.** The classic route through a JavaScript inside ioBroker. It can do everything, but takes more effort. Both ways can be combined: what is configured in the admin replaces the matching page of the script.

## When something does not work

- **Panel status and diagnostics:** the *Maintain* tab in the instance settings.
- **States and roles:** the alias table shows which roles a card expects.
- **Questions to the community:** [ioBroker forum](https://forum.iobroker.net/topic/80055/alphatest-nspanel-lovelace-ui-v0-1-1).
- **Bugs and feature requests:** [GitHub issues](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues).

> These pages live in the repository in two languages: German under `doc/de`, English under `doc/en`. Pages that are still being written are marked *iA* (work in progress) or *(to come)* in the sidebar.
