# Tasmota Tools

The **Tasmota Tools** tab provides tools for troubleshooting and manually reinstalling Tasmota components. It is primarily intended for diagnostics and manual maintenance — in normal operation, updates are performed via the [Maintain](Maintain) tab.

> **Note:** This tab is only visible in **expert mode** in ioBroker and only appears when MQTT is fully configured and at least one panel exists.

> 🖼️ **Image missing:** Screenshot of the Tasmota Tools tab with the IP dropdown filled in and action buttons visible  
> Path: `Pictures/tasmotaTools/tasmotatools.png`

![Tasmota Tools](Pictures/tasmotaTools/tasmotatools.png)

---

## Select Panel

| Field | Description |
|-------|-------------|
| **IP of the panel** | Dropdown with autocomplete. The list of available Tasmota devices is queried from the adapter. A valid IPv4 address can also be entered manually. Required for all action buttons. |

---

## Action Buttons

| Button | Description |
|--------|-------------|
| **Open Tasmota WebUI** | Opens the Tasmota web interface of the selected panel in a new browser window. |
| **Restart** | Restarts Tasmota on the selected panel. Shows a confirmation dialog before execution. Displays progress. |
| **Install Berry Driver** | Reinstalls the Berry driver on the panel. Displays progress. Useful when the driver is corrupted or after Tasmota updates. |
| **Install TFT Firmware** | Reinstalls the TFT firmware. Respects the beta TFT setting from Global Settings (`useBetaTFT`) and the panel model. Displays progress. |

---

| **Factory reset Tasmota** | Resets **all Tasmota settings** to factory defaults — Wi-Fi credentials are preserved, everything else (MQTT, scripts, Berry driver) is erased. Shows a confirmation dialog. Equivalent to `reset 4` in the Tasmota console. The panel must be re-initialized afterward.

---

## Related Pages

- [Maintain](Maintain) — Regular updates for Tasmota, TFT, and script
- [NSPanel Settings](NSPanelsetting) — Initialize and configure panels
- [Flash NSPanel](NSPanel-flashen) — Initial flashing of the NSPanel with Tasmota
