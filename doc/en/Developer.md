# Developer

Switches for troubleshooting and an area where the built-in download addresses can be overridden.

> **The tab is only visible in expert mode.** Toggle it with the head icon at the bottom left of the admin sidebar; the setting applies to the current browser session only.

<img alt="Developer tab in expert mode" src="../Pictures/developer/developer-01-expertenmodus.png" width="100%"/>

## Logging

| Switch | Effect |
|---|---|
| **additionalLog** | Extra messages about messages sent to a panel that are still pending. |
| **debugLogMqtt** | Logs the MQTT traffic in detail — useful when a panel stays silent. |
| **debugLogStates** | Logs changes to states. |
| **debugLogPages** | Logs how pages are built and switched. |
| **logUnknownTokens** | Reports placeholders in texts that the adapter could not resolve. |

These switches produce a lot of log output. Turn them on for troubleshooting and off afterwards — and set the instance log level to `debug`, otherwise most of it stays invisible.

## Tools

| Setting | Effect |
|---|---|
| **Fix broken common types** | A one-off repair: on the next start the adapter corrects alias objects whose type is wrongly `state` instead of `mixed` (a known issue from the devices adapter). Afterwards it clears the tick itself. |
| **Pinned TFT firmware version** | Forces a specific TFT version instead of the one determined online. **For testing only**, without support — the adapter warns on every start while something is entered here. |
| **hideDeveloperSymbols** | Hides the cog the screensaver shows while a developer build of the display firmware is running. |

## Danger zone

The section is labelled exactly that, and it is meant seriously: these are the addresses the version list, the Berry driver and the TFT firmware are loaded from.

The fields stay locked until **allow editing of the URLs** is switched on — a safeguard against accidental typing. **That tick is not saved**: after reloading the page it is off again, while changed addresses do persist.

| Field | Default |
|---|---|
| Version list | `…/ioBroker.nspanel-lovelace-ui/main/json/version.json` |
| Berry driver | `…/ioBroker.nspanel-lovelace-ui/main/tasmota/berry` |
| TFT server | `http://nspanel.de` |

Changing anything here means firmware from a different source — when in doubt, leave the defaults. The section below is headed **Not used**; those fields currently have no function.
