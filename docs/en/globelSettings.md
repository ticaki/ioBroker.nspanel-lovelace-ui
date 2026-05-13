# Global Settings

The **Global Settings** tab contains adapter-wide settings that apply to all connected NSPanels.

> **Note:** This tab is only shown after MQTT is fully configured and at least one panel has been added. All settings can only be changed while the adapter is running.

---

## Settings Overview

### Beta TFT Firmware

| Property | Value |
|----------|-------|
| Config key | `useBetaTFT` |
| Type | Checkbox |
| Default | `false` |
| Expert mode only | yes |

Enables the use of beta TFT firmware versions when flashing the NSPanel. When enabled, the section header is highlighted in red as a warning.

> **Warning:** Beta firmware may be unstable. Only enable if explicitly desired. Activation requires expert mode.

---

### Color Theme Settings

| Property | Value |
|----------|-------|
| Config key | `colorTheme` |
| Type | Select (dropdown) |
| Default | `0` (Default) |

Sets the color scheme for all panels.

| Value | Name | Description |
|-------|------|-------------|
| `0` | Default | Adapter default colors |
| `1` | Tropical | Warm, tropical color tones |
| `2` | Technical | Cool, technical color tones |
| `3` | Sunset | Orange-red tones |
| `4` | Vulcano | Dark, intense tones |
| `5` | User colors | Fully custom color scheme (configurable in the [colorTheme](ColorThemes) tab) |

When `5` (User colors) is selected, the **colorTheme** tab appears in the admin interface.

---

### Weather Entity

| Property | Value |
|----------|-------|
| Config key | `weatherEntity` |
| Type | Select (dynamically loaded) |
| Default | empty |

Selects the ioBroker object ID of the weather device whose data is displayed on the screensaver. Available entities are dynamically loaded by the adapter (requires running adapter).

---

### Date Format

Three settings together control how date and time are displayed on the panel.

#### Weekday Format

| Property | Value |
|----------|-------|
| Config key | `weekdayFormat` |
| Type | Checkbox |
| Default | `false` |

- `false` — Short weekday format (e.g. "Mon")
- `true` — Long weekday format (e.g. "Monday")

#### Month Format

| Property | Value |
|----------|-------|
| Config key | `monthFormat` |
| Type | Select |
| Default | `0` (long) |

| Value | Name | Example |
|-------|------|---------|
| `0` | long | "January" |
| `1` | short | "Jan" |
| `2` | numeric | "1" |

#### Year Format

| Property | Value |
|----------|-------|
| Config key | `yearFormat` |
| Type | Checkbox |
| Default | `false` |

- `false` — Short year format (e.g. "25")
- `true` — Long year format (e.g. "2025")

---

### Shutter Control

| Property | Value |
|----------|-------|
| Config key | `shutterClosedIsZero` |
| Type | Checkbox |
| Default | `false` |

Defines which position value means "fully closed".

- `false` — Position `100` = fully closed
- `true` — Position `0` = fully closed (maximally extended)

Relevant when the connected shutter drive uses `0` for "down".

---

### cardThermo2 Settings

| Property | Value |
|----------|-------|
| Config key | `defaultValueCardThermo` |
| Type | Checkbox |
| Default | `false` |

Controls how `minValue`, `maxValue` and `stepValue` are interpreted in cardThermo2 configurations.

- `false` — Values used directly (e.g. `2.5` = 2.5 °C)
- `true` — Values in tenths (e.g. `25` = 2.5 °C)

> Applies only to the `cardThermo2` page type. Acts as a global default for all thermostat pages.

---

### Service Pin

| Property | Value |
|----------|-------|
| Config key | `pw1` |
| Type | Password field (digits only) |
| Default | empty |

Numeric PIN code for service access. Must contain digits only. Required for certain service functions on the panel.

---

### Remember Last Page

| Property | Value |
|----------|-------|
| Config key | `rememberLastSite` |
| Type | Checkbox |
| Default | `false` |

- `false` — The panel always opens the configured start page on startup
- `true` — The panel remembers the last displayed page and opens it on next startup — until the panel is restarted

---

## All Config Keys Summary

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `useBetaTFT` | boolean | `false` | Use beta TFT firmware (expert mode only) |
| `colorTheme` | number (0–5) | `0` | Color theme for all panels |
| `weatherEntity` | string | `""` | ioBroker ID of the weather entity |
| `weekdayFormat` | boolean | `false` | Long weekday format |
| `monthFormat` | number (0–2) | `0` | Month format (long/short/numeric) |
| `yearFormat` | boolean | `false` | Long year format (4-digit) |
| `shutterClosedIsZero` | boolean | `false` | Position 0 = fully closed |
| `defaultValueCardThermo` | boolean | `false` | Thermo values in tenths |
| `pw1` | string | `""` | Service PIN (digits only) |
| `rememberLastSite` | boolean | `false` | Open last page on startup |

---

## Related Pages

- [Color Themes](ColorThemes) — Configure custom color scheme
- [MQTT Server Settings](General) — Connection settings
- [NSPanel Setting](NSPanelsetting) — Panel-specific settings
