# Maintain

The maintenance tab: for every panel it shows which **Tasmota version**, which **TFT firmware** and which **script version** is running, detects available updates and triggers them.

<img alt="Maintain with the card of a connected panel" src="../Pictures/maintain/maintain-01-panelkarte.png" width="100%"/>

## The card of a panel

The name is at the top, next to it the connection state. The colour of the card tells whether something needs doing: **orange** means "there is a difference" (outdated firmware, newer script version, developer build), **yellow** means "currently flashing", **grey** means the adapter itself is not running.

| Control | Effect |
|---|---|
| **Panel active** | Switches the panel on or off in the adapter. Takes effect **immediately** — this switch writes a state and needs no saving. |
| **Tasmota version** + **TASMOTA UPDATE** | Starts the Tasmota OTA update: the adapter determines the matching version and sends the update command to the panel. The panel restarts and is unreachable for about 40 seconds. |
| **TFT version** + **TFT UPDATE** | Reinstalls the display firmware — the file matching the hardware model, optionally the beta (see [global settings](globelSettings)). Also restarts the panel. |
| **Script version** + **SCRIPT UPDATE** | Recreates the panel's configuration script, or brings it up to the current version. |
| **Open Tasmota console** | Opens the console of the Tasmota web interface in a new tab. |
| **Update scripts for all panels** (top) | The same as *SCRIPT UPDATE*, but for every panel with a newer script version available. |

Before the Tasmota and the TFT update the admin asks for confirmation and mentions the roughly 40 seconds of downtime.

## What survives a script update

The script contains a marker line reading `END STOP END STOP END - No more configuration - END STOP END STOP END`. **Everything above it is replaced, everything below it stays** — your own additions survive an update as long as they live below the marker. ⚠️ Removing the marker makes the script un-updatable: the update then stops with an error.

## When a button stays grey

- **TASMOTA UPDATE**: needs a valid IP, a valid topic, complete MQTT credentials and a panel that is online and not currently flashing.
- **TFT UPDATE**: only needs a reachable panel with an IP that is not flashing.
- **SCRIPT UPDATE**: needs the panel name and the topic.
- All buttons are disabled while the instance is not running or another update is in progress.

## Versions stay at `???`

Then the panel has not answered yet. After an adapter start that takes a moment; if it stays that way, something is wrong with the MQTT connection, the topic or the power supply. A TFT version of `0.0.0` means a developer build is running — the adapter treats that as "update needed".

If the **beta TFT** is enabled, the tab shows a notice at the top.
