# Developer-Readme

> Internal developer notes: status of the conversion from script configuration to admin/adapter configuration, plus explanations of the Icon, Value and PageItem types.

## Converting Script Configuration to Adapter Config

Legend: `[x]` = configurable in the admin UI, `[ ]` = not yet in admin (script-only).

### Cards
- [x] cardChart
- [x] cardLChart
- [x] cardEntities
- [x] cardGrid
- [x] cardGrid2
- [x] cardGrid3
- [x] cardThermo
- [ ] cardMedia
- [x] cardUnlock
- [x] cardQR
- [x] cardAlarm
- [x] cardPower

### PageItems
- [x] light
- [x] socket
- [x] dimmer
- [x] hue
- [x] rgb
- [x] rgbSingle
- [x] ct
- [x] blind
- [x] door
- [x] window
- [x] volumeGroup
- [x] volume
- [x] info
- [x] humidity
- [x] temperature
- [x] value.temperature
- [x] value.humidity
- [x] thermostat
- [x] warning
- [ ] cie
- [x] gate
- [x] motion
- [x] buttonSensor
- [x] button
- [ ] value.time
- [x] level.timer
- [ ] value.alarmtime
- [x] level.mode.fan
- [x] lock
- [x] slider
- [ ] switch.mode.wlan
- [x] media
- [x] timeTable
- [x] airCondition

### PageItems Navigation
- [x] light
- [x] socket
- [x] dimmer
- [x] hue
- [x] rgb
- [x] rgbSingle
- [x] ct
- [x] blind
- [x] door
- [x] window
- [x] volumeGroup
- [x] volume
- [x] info
- [x] humidity
- [x] temperature
- [x] value.temperature
- [x] value.humidity
- [x] thermostat
- [x] warning
- [ ] cie
- [x] gate
- [x] motion
- [x] buttonSensor
- [x] button
- [ ] value.time
- [x] level.timer
- [ ] value.alarmtime
- [x] level.mode.fan
- [x] lock
- [x] slider
- [ ] switch.mode.wlan
- [x] media
- [x] timeTable
- [x] airCondition



## Built in:
- cardChart
- cardLChart
- cardMedia
- cardGrid/2
- cardEntities
- cardPower
- cardThermo
- screensaver
- cardMedia
- all popups and PageItems

## Explanations

### Icons:
#### Data input
About `icon.x.color` (nothing related to actual light bulbs):
input is read via the following `common` property options:
- `type: number`
  - decimal
- `type: string`
  - stringified JSON: `{r:0,g:0,b:0}` or `{red:0,green:0,blue:0}`
  - hex color — 7 chars starting with `#`
  - CSS color names (`role: level.color.name`) — https://www.tutorialrepublic.com/css-reference/css-color-names.php
  - HSL: `"hsl(0, 50%, 50%)"` (`role: level.color.name`)

#### Function
##### IconEntryType
Applies to all icons except the screensaver at the moment.

- `true`: the default value, should always be given.
- `false`: optional, value for boolean `false`.
- `text`: optional, displayed on a cardGrid/2 instead of the icon.
- `scale`: see below.

##### IconScaleElement
`scale` has its own section: the object consists of these types: `{val_min: number, val_max: number, val_best?: number, log10?: 'max' | 'min';}`. To use it, `icon.true.color` and `icon.false.color` must be defined. `Value` typically comes from `entity1`.
- If only `val_min` is set, the `true` color is chosen when `val_min >= Value`.
- If only `val_max` is set, the `true` color is chosen when `val_max <= Value`.
- If both are set, the color is interpolated from `false` (val_min) to `true` (val_max).
- `val_max` and `val_min` are swapped (and the true/false colors with them) if `max < min`. If `min == max` the `true` color is returned.
- If `val_best` is additionally set, `val_best` is the `true` color and interpolates toward `false` in the direction of `val_min` and `val_max`.
- If `log10` is set, with `max` a `log10()` is applied (1 → false, 10 → true); with `min` `(10 - value)` is applied (10 → false, 1 → true).

### ValueEntryType

Consists of these types: `{value: string | number | boolean; decimal?: number; factor?: number; unit?: string; minScale?: number; maxScale?: number; set?: string | number | boolean;} | undefined;`

When *** is requested:
- a `boolean` reads `value` and double-negates it.
- a `number` is read or converted, multiplied by `factor`, and scaled to 0–100 using `minScale` / `maxScale`.
- a `string` is
  - read as a number with `decimal` applied when `type == number`,
  - or as a string otherwise,
  - `unit` is appended in both cases.

When writing:
- `set` is tried first; if missing, `value` is used.

All of the above are data items, of course.

### PageItems
#### formerly `CreateEntity()`

##### light
- `entity1` is the switch.
- `icon` (entity1)
- `iconColor`: light color comes from a defined RGB value, CT (kelvin/mired), or `IconEntryType` — either scaled with `dimmer` or `entity1`.
- `dimmer` is a number.
- `colorMode` can be `undefined | 'hue' | 'ct'` and decides which mode is used for the icon.
- `headline` is the item description.

##### shutter
- `entity1` is the level, a number 0–100.
- `icon` & `iconColor` (`IconEntryType`, entity1)
- `headline` is the item description.
- `valueList` is an array with 3 or 6 entries containing the icon caption — `''` to disable. Fields are also disabled if no command state is found.

##### number
- `entity1` is the level, a number 0–100.
- `text.true` is the caption.
- `icon` & `iconColor` as for `shutter`.

##### text
- `entity1` can be number or boolean. If parsing fails, `true` is assumed.
- `entity2` or `text1` is the text on the right in `cardEntities`.
- `text.true` is the caption.
- `icon` & `iconColor` as for `shutter`.

##### button
- `entity1` determines the button status, or `true`.
- `icon` & `iconColor` as for `shutter`.
- `setValue1` toggles the given state (optional).
- `setValue2` switches the given state to `false` (optional).
- `setNavi` navigates to the specified navigation ID.

##### input_sel
- `entityInSel` as number, boolean, or undefined.
- Icon/color as above.
- `headline` is the description.
- `text` is the text on the right in `cardEntities`.

##### fan
- `entity1` is the switch.
- `icon` …
- `headline` is the description.

##### timer
- Currently only the internal version is fully implemented.
- `entity1` — remaining seconds, or internal counter.
- `icon` …
- `text` — alternative text for the right-hand display in `cardEntities` (default: time).
