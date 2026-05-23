# NSPanel Settings

The **NSPanel Settings** tab is used to initialize new panels and manage existing ones. Initialization transfers all MQTT connection data to the panel, installs the Berry driver, and flashes the TFT firmware — no further manual configuration on the panel is needed afterward.

> **Note:** This tab is only visible when MQTT is fully configured (`mqttServer` active, or all manual MQTT fields filled in). All actions require a running adapter.

> 🖼️ **Image missing:** Screenshot of the NSPanel Settings tab with a filled-in initialization form and a panel card below  
> Path: `Pictures/nspanelSettings/Nspanelsettings.png`

![NSPanel Settings](Pictures/nspanelSettings/Nspanelsettings.png)

---

## Initialization Form

The form is used both for initial setup and for updating existing panels. The form border blinks blue when data from an existing panel was loaded via the edit button.

| Field | Config key | Description |
|-------|------------|-------------|
| **IP of ioBroker** | `internalServerIp` | IP address of the ioBroker host — only shown when the adapter's internal MQTT server is in use. Localhost (`127.0.0.1`) is not allowed. |
| **IP of the panel** | `_tasmotaIP` | IPv4 address of the NSPanel on the local network. A static IP assigned in the router is recommended. |
| **Panel name (unique)** | `_tasmotaName` | Unique name for this panel in the adapter. |
| **MQTT topic (unique)** | `_tasmotaTopic` | MQTT topic the panel communicates on. At least 4 characters, starting with a letter, followed by letters, digits, underscores, or slashes. |
| **NSPanel hardware model** | `_nsPanelModel` | Hardware model of the panel: `EU landscape` (default), `US landscape`, or `US portrait`. |
| **Timezone** | `timezone` | Timezone of the panel. The list of Tasmota timezones is loaded when the dropdown is opened. |

> **Initialization button:** The button label switches between **"NSPanel initialization"** (new panel) and **"Update NSPanel configuration"** (existing panel with the same topic), depending on whether the entered topic already exists in the configuration.

---

## Initialization Process

After confirming the dialog, the adapter sends MQTT data and Tasmota settings to the panel and performs the following steps:

1. Transfer MQTT connection data
2. Install the Berry driver
3. Flash the TFT firmware (NSPanel firmware)

> ⚠️ **Duration:** Initialization takes approximately 10 minutes. The panel is unreachable during this time.

After completion, a success dialog appears — confirm and save to create the panel configuration in the adapter.

---

## Panel Cards (Existing Panels)

Below the form, each already-configured panel is shown as a card.

> 🖼️ **Image missing:** Screenshot of a panel card with status, buttons, and info fields  
> Path: `Pictures/nspanelSettings/panelCard.png`

![Panel Card](Pictures/nspanelSettings/panelCard.png)

| Element | Description |
|---------|-------------|
| **Panel name** | Name of the panel as a heading |
| **Status badge** | Real-time online/offline status of the panel |
| **Edit** (pencil icon) | Loads the panel's data into the initialization form; form border blinks blue as confirmation |
| **Delete** (trash icon) | Removes the panel from the adapter configuration after confirmation |
| **MAC address of the panel** | Unique hardware ID of the panel (read-only) |
| **IP of the panel** | Currently saved IP address (read-only) |
| **MQTT topic** | Saved MQTT topic (read-only) |
| **NSPanel hardware model** | Saved model (read-only) |
| **Open Tasmota console** | Opens the Tasmota console (`http://<panel-ip>:80/cs?`) in a new browser window |

---

## Related Pages

- [MQTT Server Settings](General) — Configure the MQTT connection
- [Maintain](Maintain) — Updates for Tasmota, TFT, and script
- [Adapter Installation](Adapter-Installation) — Step-by-step setup guide
