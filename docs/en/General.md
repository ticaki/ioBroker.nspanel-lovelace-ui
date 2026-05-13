# MQTT Server Settings

The **MQTT Server Settings** tab is where MQTT broker connection data is configured once. Once the connection is established, nothing here needs to be changed.

> **Note:** All fields in this tab are only editable when the adapter is running (online). The tab itself is always visible, even before MQTT is configured.

> 🖼️ **Image missing:** Screenshot of the full MQTT Server Settings tab with both sections visible  
> Path: `Pictures/general/MQTT-Setting.png`

![MQTT Server Settings](Pictures/general/MQTT-Setting.png)

---

## Internal MQTT Server (Adapter)

| Field / Element | Type | Config key | Description |
|----------------|------|------------|-------------|
| **Use the adapter's own MQTT server** | Checkbox | `mqttServer` | Enables the MQTT broker built into the adapter. **Recommended**, as it communicates directly with the panel and optimizes data exchange. |
| **Fill MQTT credentials and port** | Button | — | Automatically generates a free port, username, and password for the internal MQTT server. Only active when `mqttServer` is enabled and the adapter is running. |

> **Recommendation:** We recommend using the adapter's internal MQTT server. It works directly with the panel and optimizes data exchange.

---

## External MQTT Connection

These fields are only needed when using an **external MQTT server** (e.g., Mosquitto or the MQTT adapter). All fields are disabled when the internal server (`mqttServer`) is active.

| Field | Type | Config key | Description |
|-------|------|------------|-------------|
| **IP to the external MQTT server** | Text field | `mqttIp` | IP address of the external broker. When using the MQTT adapter, enter the IP of the ioBroker host. |
| **MQTT port** | Number | `mqttPort` | Port of the MQTT broker. Make sure the port is not already used by another adapter or service. |
| **MQTT username** | Text field | `mqttUsername` | Username with which Tasmota (the panel) connects to the broker. |
| **MQTT password** | Password field | `mqttPassword` | Password for the MQTT user. The eye icon toggles password visibility. |

---

## Tasmota WebUI Password

| Field | Type | Config key | Description |
|-------|------|------------|-------------|
| **Use Tasmota WebUI password** | Checkbox | `useTasmotaAdmin` | Enables the use of a password for the Tasmota web interface. |
| **Tasmota WebUI password** | Password field | `tasmotaAdminPassword` | The Tasmota WebUI password. Only shown when `useTasmotaAdmin` is enabled. Required for updates and API access when the WebUI is password-protected. |

---

## Important Notes

> ⚠️ **Panel was previously connected to another host:** Enter `reset 4` in the Tasmota console to erase the old connection before re-initializing the panel.

> ⚠️ **Restoring an ioBroker backup:** After restoring a backup, all panels must be deleted from the adapter configuration and re-created. TLS certificates are not preserved in backups and must be regenerated.

---

## Related Pages

- [NSPanel Settings](NSPanelsetting) — Initialize and manage panels
- [Adapter Installation](Adapter-Installation) — Step-by-step setup guide
