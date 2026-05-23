# Maintain

The **Maintain** tab shows all configured panels with their current version information and allows updates for Tasmota, TFT firmware, and the configuration script.

> **Note:** This tab is only visible when MQTT is fully configured and at least one panel exists. All actions require a running adapter.

> 🖼️ **Image missing:** Screenshot of the Maintain tab with several panel cards, one of them highlighted in orange (update available)  
> Path: `Pictures/maintain/maintainAllg.png`

![Maintain](Pictures/maintain/maintainAllg.png)

---

## Header Area

| Element | Description |
|---------|-------------|
| **Beta warning** | Yellow banner: "Beta version in use" — appears when the beta TFT version is enabled in [Global Settings](globelSettings) (`useBetaTFT`). |
| **Help for adapter installation** | Red link to the wiki installation page. |
| **Update scripts for all panels** | Updates the configuration scripts for all panels that have a script update available, in one operation. The button is highlighted orange when updates are available and is only active when the adapter is running. |

---

## Panel Cards

Each configured panel is shown as its own card.

**Card color:**
- **Orange** — at least one component (Tasmota, TFT, or script) has an update available
- **Yellow** — TFT firmware is currently being flashed
- **Transparent** — all versions are up to date

### Card Content

| Element | Description |
|---------|-------------|
| **Panel name** | Display name of the panel |
| **Status badge** | Real-time online/offline status (subscribes to `panels.<id>.info.isOnline`) |
| **Panel active** | Toggle switch to activate/deactivate the panel. Writes to `panels.<id>.cmd.activated` in the ioBroker object tree. |
| **Tasmota version** | Currently installed Tasmota version (read-only). Update button is **light blue** when an update is available. |
| **TASMOTA UPDATE** | Starts a Tasmota OTA update via MQTT after confirmation. |
| **TFT version** | Currently installed TFT firmware version (read-only). Update button is **light blue** when an update is available. |
| **TFT UPDATE** | Starts installation of the TFT firmware after confirmation. Sends the update command via MQTT to the panel. |
| **Script version** | Version of the configuration script installed on the panel (read-only). Update button is **light blue** when an update is available. |
| **SCRIPT UPDATE** | Recreates and transfers the configuration script for this panel. |
| **Open Tasmota console** | Opens the Tasmota console of the panel (`http://<ip>:80/cs?`) in a new browser window. |

### Prerequisites for Update Buttons

The update buttons are only active when:
- The adapter is running (online)
- The panel is online and no flashing is in progress
- The panel's IP address and MQTT topic are valid
- MQTT port, username, and password are configured
- When using the internal MQTT server: a valid `internalServerIp` is configured (not `127.0.0.1`)

---

## Related Pages

- [NSPanel Settings](NSPanelsetting) — Add and initialize panels
- [Global Settings](globelSettings) — Enable beta TFT version
- [Adapter Installation](Adapter-Installation) — Installation guide
