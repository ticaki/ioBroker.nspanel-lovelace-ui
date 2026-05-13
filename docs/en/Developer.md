# Developer

The **Developer** tab contains advanced settings for debugging and internal configuration.

> **Note:** This tab is only visible in **expert mode**. The settings here are intended for troubleshooting and development and may affect the performance or behavior of the adapter.

> 🖼️ **Image missing:** Full view of the Developer tab  
> Path: `Pictures/developer/developer-tab-uebersicht.png`  
> *Insert screenshot of the complete tab in expert mode.*

![Developer Tab Overview](Pictures/developer/developer-tab-uebersicht.png)

---

## Logging

These four checkboxes enable additional debug output in the ioBroker log. They should only be enabled when troubleshooting, as they can significantly increase the log volume.

| Config key | Default | Description |
|-----------|---------|-------------|
| `additionalLog` | `false` | General extended logging — outputs additional internal processing steps |
| `debugLogMqtt` | `false` | Logs all incoming and outgoing MQTT messages |
| `debugLogStates` | `false` | Logs all state changes processed by the adapter |
| `debugLogPages` | `false` | Logs the construction and rendering of pages |

> All four options are checkboxes. Multiple can be enabled simultaneously.

---

## Additional Settings

### Fix Broken Common Types

| Property | Value |
|----------|-------|
| Config key | `fixBrokenCommonTypes` |
| Type | Checkbox |
| Default | `false` |

Attempts to automatically correct faulty `common.type` definitions on ioBroker data points. Useful when devices or adapters deliver inconsistent types (e.g. a `boolean` data point that actually delivers numbers).

---

### Pin TFT Firmware Version

| Property | Value |
|----------|-------|
| Config key | `forceTFTVersion` |
| Type | Text field |
| Default | empty |

Forces a specific TFT firmware version during the flash process, regardless of the currently recommended version. Format: version number as a string, exactly as listed in the adapter's version JSON (e.g. `4.3.12` — illustrative format only, not a recommendation).

> ⚠️ **For testing only.** No support for issues caused by pinning a version. Use at your own risk.

---

### Hide Developer Symbols

| Property | Value |
|----------|-------|
| Config key | `hideDeveloperSymbols` |
| Type | Checkbox |
| Default | `false` |

Hides indicator symbols and markers that normally point to incompletely configured data points or development features. Useful for a cleaner admin interface.

---

## Danger Zone

> ⚠️ **Only use these settings if you know exactly what they do.**

### Activate URL Editing

| Property | Value |
|----------|-------|
| Config key | `_activateURls` |
| Type | Checkbox |
| Default | `false` |
| Persisted | **No** — reset on every restart |

Unlocks editing of the three URL fields (protection against accidental changes). Since this setting is not persisted, it must be re-enabled after each restart of the admin interface.

---

### Version JSON URL

| Property | Value |
|----------|-------|
| Config key | `versionJsonUrl` |
| Type | Text field |
| Default | `https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json` |
| Active when | `_activateURls` = `true` |

Overrides the URL from which the adapter fetches available versions. Useful for pointing to a custom mirror server or a test branch.

---

### Berry Script URL

| Property | Value |
|----------|-------|
| Config key | `berryUrl` |
| Type | Text field |
| Default | `https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry` |
| Active when | `_activateURls` = `true` |

Overrides the URL from which the adapter loads the Tasmota Berry script.

---

### TFT Server URL

| Property | Value |
|----------|-------|
| Config key | `tftUrl` |
| Type | Text field |
| Default | `http://nspanel.de` |
| Active when | `_activateURls` = `true` |

Overrides the URL of the server from which the TFT firmware is downloaded. **HTTP only** is supported (no HTTPS).

---

## Log Unknown Tokens

| Property | Value |
|----------|-------|
| Config key | `logUnknownTokens` |
| Type | Checkbox |
| Default | `false` |

Logs all tokens (data point references) that the adapter cannot resolve. Helpful for diagnosing configuration problems where data points cannot be found.

---

> **Note:** This tab contains additional elements (Channel Config Dialog, Icon Select) that were added for development and testing purposes and are not intended for production use.

---

## All Config Keys Summary

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `additionalLog` | boolean | `false` | Extended general logging |
| `debugLogMqtt` | boolean | `false` | Log MQTT messages |
| `debugLogStates` | boolean | `false` | Log state changes |
| `debugLogPages` | boolean | `false` | Log page rendering |
| `fixBrokenCommonTypes` | boolean | `false` | Correct faulty ioBroker types |
| `forceTFTVersion` | string | `""` | Force TFT version (testing only) |
| `hideDeveloperSymbols` | boolean | `false` | Hide developer indicator symbols |
| `_activateURls` | boolean | `false` | Unlock URL editing (not persisted) |
| `versionJsonUrl` | string | GitHub URL | Override version JSON URL |
| `berryUrl` | string | GitHub URL | Override Berry script URL |
| `tftUrl` | string | `http://nspanel.de` | Override TFT server URL (HTTP only) |
| `logUnknownTokens` | boolean | `false` | Log unknown tokens |

---

## Related Pages

- [Developer Templates](Developer-Templates) — Template system for developers
- [Developer Readme](Developer-Readme) — Developer documentation
- [Developer News (Latest)](Developer-News-(Latest)) — Latest developer news
