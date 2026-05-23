# Standard Pages — Overview

Standard pages are predefined page types of the NSPanel adapter. Each page has a fixed structure and is embedded in the configuration script via a type declaration (`type: 'cardXxx'`). Some pages can additionally or exclusively be configured via the admin interface.

The string given after `type` is the **actual card type** (`cardGrid`, `cardQR` …); the corresponding `ScriptConfig.` type (`PageGrid`, `PageQR` …) has the same postfix. The mapping is also shown in the table under [ScriptConfig → Available page types](en-ScriptConfig#available-page-types).

---

## Available page types

| Page | `type` string | Description |
|------|---------------|-------------|
| [Page Config](en-PageConfig) | — (admin tab) | admin tab for configuring pages directly in the admin interface |
| [Page Menu / Grid](en-cardGrid) | `cardGrid`, `cardGrid2`, `cardGrid3` | grid pages with 6 / 8 (9) / 4 tiles |
| [Page QR](en-cardQR) | `cardQR` | shows a QR code (e.g. for WLAN credentials) |
| [Page Power](en-PagePower) | `cardPower` | power/energy flow display (own admin tab) |
| [Page Chart](en-PageChart) | `cardChart`, `cardLChart` | bar resp. line chart (own admin tab) |
| [Page Alarm](en-cardAlarm) | `cardAlarm` | alarm/security page with numpad |
| [Page Media](en-PageMedia) | `cardMedia` | media control (music, volume, title) |
| [Page Thermo2](en-PageThermo2) | `cardThermo2` | thermostat page for several heating circuits |
| [Page PopupNotify](en-PagePopup) | — (`sendTo` message) | notification popup, not a page type — via `setPopupNotification` |
| [Page Trash](en-cardTrash) | `cardTrash` (admin) | waste calendar; created in the admin PageConfig tab, internally a `cardEntities`/`cardSchedule` |
| [Page Unlock](en-pageUnlock) | `cardUnlock` | unlock page (PIN entry) — documentation pending |

### Further page types (without their own wiki page)

These types also exist in the `PageType` union but do not (yet) have their own page and are covered under [ScriptConfig](en-ScriptConfig) resp. [Page Menu / Grid](en-cardGrid):

- `cardEntities` — list layout (4, in US portrait 5 entries)
- `cardSchedule` — schedule (6 entries)
- `cardThermo` — classic thermostat page with exactly one item

---

## Related pages

- [ScriptConfig](en-ScriptConfig) — embedding pages in the configuration script
- [GlobalPages](en-GlobalPages) — global pages (screensaver, system pages)
