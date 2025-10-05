# Color Theme Keys

This page documents all currently defined color theme keys across all available themes (default, topical, technical, sunset, volcano) and their present code usages.

Legend:
- 1 = Key is defined in the respective theme
- (blank) = not defined (not occurring here; all themes share the same key space)
- Usage Count = rough number of direct references to `Color.<key>` outside the theme definition objects (first 200 matches scanned)
- Example = first match (file:line)

> Note: Many weather-related keys are not directly referenced in the TypeScript source. They may be reserved for dynamic generation, firmware usage or future features.

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
| warning | 1 | 1 | 1 | 1 | 1 | 1 | (indirect / rare) |
| success | 1 | 1 | 1 | 1 | 1 | 1 | (rare) |
| neutral | 1 | 1 | 1 | 1 | 1 | 0-1 | (no direct Color.neutral usage) |
| background | 1 | 1 | 1 | 1 | 1 | 0 | (not directly referenced) |
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
- Weather colors are currently not directly targeted in the TS code – likely reserved for panel rendering or future logic.
- Navigation colors are used dynamically in the navigation renderer.
- Screensaver and media keys are actively in use.

## Possible Next Steps
- Add an automated script to regenerate this table during build.
- Mark unused keys or extend usage tracking.
- Admin UI validation: ensure only existing keys may be overridden in custom themes.
