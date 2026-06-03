# Color Themes

The adapter ships with **five built-in color themes** that are selected by index in the admin interface. Every theme defines the same key space (identical keys), only with different color values.

| Index | Theme (code) | Display name (admin) |
|-------|--------------|----------------------|
| 0 | `defaultTheme` | Default |
| 1 | `topicalTheme` | Tropical (`tropical`) |
| 2 | `technicalTheme` | Technical |
| 3 | `sunsetTheme` | Sunset |
| 4 | `volcanoTheme` | Volcano (`vulcano`) |

Unknown indices fall back to `defaultTheme` (`Color.getThemeByIndex`, `src/lib/const/Color.ts`).

> ⚠️ **Naming discrepancy:** The code variables are named `topicalTheme` and `volcanoTheme` (`src/lib/const/Color.ts`). The UI labels in the admin interface, however, read **`tropical`** and **`vulcano`** (i18n keys in `de.json`/`en.json`). When searching for a theme, please consider all three spellings.

> **What is configurable?** Via `adapter-config.d.ts` (lines 161–248) the following color groups can be customized: `colorStates`, `colorNavigation`, `colorWeatherIcon`, `colorDisplay`, `colorWeatherForecast`, `colorScreensaver`, `colorScreensaverForecast`, `colorCardMedia`. Each group contains the keys listed below.

This page lists all color keys across every available theme (default, topical/tropical, technical, sunset, volcano/vulcano) together with their usage frequency in the code.

Legend:
- 1 = key is defined in the respective theme
- (empty) = not defined (does not occur here; all themes share an identical key space)
- Usage Count = rough number of direct references to `Color.<key>` outside the theme definition (first 200 matches scanned)
- Example = first occurrence (file:line)

> Note: Many weather keys are currently not addressed directly in the TypeScript code, but may be used for dynamic generation / future features or the panel firmware.

| Key | default | topical | technical | sunset | volcano | Usage Count (approx) | Example (first occurrence) |
|-----|---------|---------|-----------|--------|---------|----------------------|----------------------------|
| good | 1 | 1 | 1 | 1 | 1 | 30+ | templates/button.ts:126 |
| bad | 1 | 1 | 1 | 1 | 1 | 30+ | templates/button.ts:120 |
| true | 1 | 1 | 1 | 1 | 1 | 10+ | templates/card.ts:2321 |
| false | 1 | 1 | 1 | 1 | 1 | 2 | templates/card.ts:2325 |
| activated | 1 | 1 | 1 | 1 | 1 | 40+ | templates/script.ts:85 |
| deactivated | 1 | 1 | 1 | 1 | 1 | 40+ | templates/script.ts:89 |
| attention | 1 | 1 | 1 | 1 | 1 | 6+ | classes/config-manager.ts:2108 |
| info | 1 | 1 | 1 | 1 | 1 | 15+ | templates/system-templates.ts:1198 |
| option1 | 1 | 1 | 1 | 1 | 1 | 4 | templates/system-templates.ts:432 |
| option2 | 1 | 1 | 1 | 1 | 1 | 4 | templates/system-templates.ts:458 |
| option3 | 1 | 1 | 1 | 1 | 1 | 4 | templates/system-templates.ts:484 |
| option4 | 1 | 1 | 1 | 1 | 1 | 6 | templates/system-templates.ts:510 |
| open | 1 | 1 | 1 | 1 | 1 | 25+ | templates/script.ts:544 |
| close | 1 | 1 | 1 | 1 | 1 | 25+ | templates/script.ts:548 |
| hot | 1 | 1 | 1 | 1 | 1 | 6 | classes/config-manager.ts:1926 |
| cold | 1 | 1 | 1 | 1 | 1 | 6 | classes/config-manager.ts:1934 |
| on | 1 | 1 | 1 | 1 | 1 | 35+ | templates/script.ts:13 |
| off | 1 | 1 | 1 | 1 | 1 | 35+ | templates/script.ts:17 |
| light | 1 | 1 | 1 | 1 | 1 | 3 | classes/config-manager.ts:1777 |
| dark | 1 | 1 | 1 | 1 | 1 | 3 | classes/config-manager.ts:1784 |
| warning | 1 | 1 | 1 | 1 | 1 | 1 | (indirekt / selten) |
| success | 1 | 1 | 1 | 1 | 1 | 1 | (selten) |
| neutral | 1 | 1 | 1 | 1 | 1 | 0-1 | (kein direkter Treffer) |
| background | 1 | 1 | 1 | 1 | 1 | 0 | (nicht direkt referenziert) |
| highlight | 1 | 1 | 1 | 1 | 1 | 0 |  |
| disabled | 1 | 1 | 1 | 1 | 1 | 0 |  |
| navLeft | 1 | 1 | 1 | 1 | 1 | 3 | classes/navigation.ts:374 |
| navRight | 1 | 1 | 1 | 1 | 1 | 3 | classes/navigation.ts:406 |
| navDownLeft | 1 | 1 | 1 | 1 | 1 | 2 | classes/navigation.ts:375 |
| navDownRight | 1 | 1 | 1 | 1 | 1 | 2 | classes/navigation.ts:407 |
| navDown | 1 | 1 | 1 | 1 | 1 | 1 | classes/navigation.ts:416 |
| navHome | 1 | 1 | 1 | 1 | 1 | 1 | classes/navigation.ts:416 |
| navParent | 1 | 1 | 1 | 1 | 1 | 2 | classes/navigation.ts:318 |
| sunny | 1 | 1 | 1 | 1 | 1 | 0 |  |
| partlyCloudy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| cloudy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| fog | 1 | 1 | 1 | 1 | 1 | 0 |  |
| hail | 1 | 1 | 1 | 1 | 1 | 0 |  |
| lightning | 1 | 1 | 1 | 1 | 1 | 0 |  |
| lightningRainy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| pouring | 1 | 1 | 1 | 1 | 1 | 0 |  |
| rainy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| snowy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| snowyHeavy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| snowyRainy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| windy | 1 | 1 | 1 | 1 | 1 | 0 |  |
| tornado | 1 | 1 | 1 | 1 | 1 | 1 | lib/adapter-config.d.ts:224 |
| clearNight | 1 | 1 | 1 | 1 | 1 | 1 | lib/adapter-config.d.ts:225 |
| exceptional | 1 | 1 | 1 | 1 | 1 | 1 | lib/adapter-config.d.ts:226 |
| foreground | 1 | 1 | 1 | 1 | 1 | 3 | controller/panel.ts:1262 |
| solar | 1 | 1 | 1 | 1 | 1 | 2 | lib/adapter-config.d.ts:235 |
| temperature | 1 | 1 | 1 | 1 | 1 | 2 | lib/adapter-config.d.ts:236 |
| gust | 1 | 1 | 1 | 1 | 1 | 2 | lib/adapter-config.d.ts:237 |
| sunrise | 1 | 1 | 1 | 1 | 1 | 0 |  |
| sunset | 1 | 1 | 1 | 1 | 1 | 0 |  |
| fgTime | 1 | 1 | 1 | 1 | 1 | 1 | pages/screensaver.ts:341 |
| fgTimeAmPm | 1 | 1 | 1 | 1 | 1 | 1 | pages/screensaver.ts:341 |
| fgDate | 1 | 1 | 1 | 1 | 1 | 1 | pages/screensaver.ts:343 |
| fgMain | 1 | 1 | 1 | 1 | 1 | 1 | pages/screensaver.ts:345 |
| fgMainAlt | 1 | 1 | 1 | 1 | 1 | 1 | pages/screensaver.ts:365 |
| fgTimeAdd | 1 | 1 | 1 | 1 | 1 | 1 | pages/screensaver.ts:367 |
| fgForecast | 1 | 1 | 1 | 1 | 1 | 8+ | pages/screensaver.ts:347 |
| fgBar | 1 | 1 | 1 | 1 | 1 | 1 | pages/screensaver.ts:363 |
| mediaArtistOn | 1 | 1 | 1 | 1 | 1 | 2 | pages/pageMedia.ts:556 |
| mediaArtistOff | 1 | 1 | 1 | 1 | 1 | 2 | pages/pageMedia.ts:557 |
| mediaTitleOn | 1 | 1 | 1 | 1 | 1 | 2 | pages/pageMedia.ts:545 |
| mediaTitleOff | 1 | 1 | 1 | 1 | 1 | 2 | pages/pageMedia.ts:546 |
| mediaOnOffColor | 1 | 1 | 1 | 1 | 1 | 1 | pages/pageMedia.ts:564 |


## Observations
- Weather colors are currently not used directly in the TS code – they may be reserved for panel rendering.
- Navigation colors are used dynamically in the navigation rendering.
- Screensaver and media keys are actively in use.

## Possible next steps
- Integrate an automatic script for generating this table into the build process.
- Mark unused keys or extend usage tracking.
- Admin-UI validation: ensure that only existing keys are accepted for a custom theme.
