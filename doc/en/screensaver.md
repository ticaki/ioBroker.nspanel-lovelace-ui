# Screensaver in the configuration script

> **The admin is the way.** The screensaver is set up in the *Screensaver* tab — every slot is shown as a
> picture, the fields are labelled, and the preview shows at once what the panel will display:
> [Screensaver – configuration in the admin](Screensaver-Admin), messages under
> [notifications](Screensaver-Notify).
>
> This page describes the **second way**: the same configuration from a configuration script. It is kept
> deliberately coarse — it explains the structure and shows examples, but it does not list every field.
> If you are looking for a field, you will find it in the admin interface where it belongs.

## When both exist, the admin wins

If a panel is listed in a screensaver of the admin tab, that one **replaces the screensaver from the
script**. The adapter says so in the log at start:

```
Screensaver '<name>' (<mode>) from the admin configuration replaces the script screensaver of panel '<panel>'
```

Without a matching admin entry nothing changes and the script screensaver stays. If a panel ends up in
several admin screensavers by accident, the adapter takes the first one and warns.

One difference remains afterwards:

| | Where version and rotation time come from |
|---|---|
| **Admin screensaver** | From the entry. The states `cmd.screenSaver.layout` and `.rotationTime` **follow** it. |
| **Script screensaver** | From exactly those states — they are the way to change both. |

The script itself **cannot** set the version: the script configuration has no field for it, and the page
is always built as `standard`. To get another version, set `panels.<panel>.cmd.screenSaver.layout`.

## The four versions

| Version | `layout` | Card | Favourite | Alternate | Left | Bottom | Indicators | MR icons |
|---|---|---|---|---|---|---|---|---|
| `standard` | 0 | `screensaver` | 1 | – | – | 4 | – | 2 |
| `alternate` | 1 | `screensaver` | 1 | 1 | – | 3 | – | 2 |
| `advanced` | 2 | `screensaver2` | 1 | – | 3 | 6 | 5 | 2 |
| `easyview` | 3 | `screensaver3` | 1 | – | – | 3 | – | 2 |

The numbers are for the **eu** model; on the `us-p` model `easyview` has four slots at the bottom instead
of three. The authoritative table lives in the code (`definition.ts`, `ScreenSaverConst`) and the admin
reads it from the same source.

## The areas

Every area is one field of the script configuration:

| Field | What it fills |
|---|---|
| `favoritScreensaverEntity` | The large slot — usually the current weather. |
| `alternateScreensaverEntity` | The slot that takes turns with the favourite. **Only in version `alternate`**; in any other one such entries are discarded. |
| `leftScreensaverEntity` | The left column, `advanced` only. May contain gaps (`undefined`/`null`). |
| `bottomScreensaverEntity` | The bottom row. |
| `indicatorScreensaverEntity` | The status icons at the top right, `advanced` only. May contain gaps as well. |
| `mrIcon1ScreensaverEntity` / `mrIcon2ScreensaverEntity` | The two icons at the bottom. **An object, not an array.** |
| `notifyScreensaverEntity` | The notifications (see below). |

## Three ways to fill a slot

```typescript
// 1. script – state and label by hand
{ type: 'script', ScreensaverEntity: '<state id>', ScreensaverEntityText: 'Inside' }

// 2. template – a ready-made template, dpInit tells it where to look
{ type: 'template', template: 'text.clock', dpInit: '', modeScr: 'left' }

// 3. native – the raw page structure, the emergency exit
{ type: 'native', native: { /* … */ } }
```

- With **`script`**, `ScreensaverEntity` and `ScreensaverEntityText` are mandatory; everything else (icon,
  unit, colour, decimals, date format, visibility) is optional.
- With **`template`**, `template`, `dpInit` and `modeScr` are mandatory — **`dpInit` too**, even when the
  template needs no search; then it stays an empty string.
- **MR icons know fewer fields** than the other slots: `ScreensaverEntity`, `ScreensaverEntityIconOn`,
  `ScreensaverEntityIconOff`, `ScreensaverEntityValue`, `ScreensaverEntityValueDecimalPlace`,
  `ScreensaverEntityValueUnit`, `ScreensaverEntityOnColor` and `ScreensaverEntityOffColor` — all eight
  belong to it. There is **no** `ScreensaverEntityText` or `ScreensaverEntityIconColor` there; the adapter
  reads neither.

## Templates

The templates that ship with the adapter are named `text.…` and cover clock, weather, windows, doors,
motion, battery, network and timetables. The list lives in the code (`src/lib/templates/text.ts`) and is
always current there; every name used below exists.

Weather comes for four adapters: `accuweather`, `openweathermap`, `pirate-weather` and `brightsky` — each
with its own family of templates (`text.<adapter>.favorit`, `.bot2values`, `.sunriseset`, `.windspeed`, …).
`weatherAddDefaultItems` appends sunrise/sunset, up to six forecast days, wind and — as far as the adapter
delivers them — UV index and solar radiation.

## Examples

The blocks below are **excerpts** from `const config: ScriptConfig.Config = { … }`; the mandatory parts of
the configuration (`version`, `scriptName`, `weatherEntity`, the colours, `pages`, …) still sit next to
them, see [ScriptConfig](ScriptConfig).

### Advanced — the full layout

```typescript
// Favourite: current weather
favoritScreensaverEntity: [{
    type: 'template',
    template: 'text.pirate-weather.favorit',
    dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
    modeScr: 'favorit',
}],

// Left column: three slots
leftScreensaverEntity: [
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Livingroom.Temperature',
        ScreensaverEntityText: 'Inside',
        ScreensaverEntityIconOn: 'thermometer',
        ScreensaverEntityUnitText: '°C',
        ScreensaverEntityIconColor: { val_min: 18, val_max: 26, val_best: 22 },
    },
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Livingroom.Humidity',
        ScreensaverEntityText: 'Humidity',
        ScreensaverEntityIconOn: 'water-percent',
        ScreensaverEntityUnitText: '%',
        ScreensaverEntityIconColor: { val_min: 30, val_max: 70, val_best: 45 },
    },
    { type: 'template', template: 'text.clock', dpInit: '', modeScr: 'left' },
],

// Status icons at the top right
indicatorScreensaverEntity: [
    { type: 'template', template: 'text.window.isOpen', dpInit: `/^alias\\.0\\.Livingroom\\.Window.*$/`, modeScr: 'indicator' },
    { type: 'template', template: 'text.motion', dpInit: `/^zigbee\\.0\\..*\\.occupancy$/`, modeScr: 'indicator' },
    { type: 'template', template: 'text.battery.low', dpInit: `/^zigbee\\.0\\..*\\.battery_low$/`, modeScr: 'indicator' },
],

// Bottom row
bottomScreensaverEntity: [
    { type: 'template', template: 'text.pirate-weather.bot2values', dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.01.*/`, modeScr: 'bottom' },
    { type: 'template', template: 'text.pirate-weather.bot2values', dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.02.*/`, modeScr: 'bottom' },
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Energy.Consumption.Current',
        ScreensaverEntityText: 'Power',
        ScreensaverEntityIconOn: 'flash',
        ScreensaverEntityUnitText: 'W',
        ScreensaverEntityIconColor: { val_min: 0, val_max: 5000, mode: 'triGrad' },
    },
],

// The two icons at the bottom – an object with eight fields
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',
    ScreensaverEntityIconOn: 'lightbulb-on',
    ScreensaverEntityIconOff: 'lightbulb-off',
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: null,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: { r: 255, g: 215, b: 0 },
    ScreensaverEntityOffColor: { r: 68, g: 115, b: 158 },
},
mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'alias.0.Livingroom.Socket',
    ScreensaverEntityIconOn: 'power-plug',
    ScreensaverEntityIconOff: 'power-plug-off',
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: null,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: { r: 0, g: 255, b: 0 },
    ScreensaverEntityOffColor: { r: 68, g: 115, b: 158 },
},
```

`Relay.1` and `Relay.2` are accepted shorthands for the panel's two relays; the adapter maps them to
`cmd/power1` and `cmd/power2`.

### Alternate — the favourite takes turns

```typescript
favoritScreensaverEntity: [{
    type: 'template',
    template: 'text.accuweather.favorit',
    dpInit: `/^accuweather\\.0\\.Current\\./`,
    modeScr: 'favorit',
}],

alternateScreensaverEntity: [{
    type: 'script',
    ScreensaverEntity: 'alias.0.Garden.Temperature',
    ScreensaverEntityText: 'Garden',
    ScreensaverEntityIconOn: 'tree',
    ScreensaverEntityUnitText: '°C',
}],

bottomScreensaverEntity: [
    { type: 'template', template: 'text.accuweather.sunriseset', dpInit: `/^accuweather\\.0\\.Daily\\.Day1\\./`, modeScr: 'bottom' },
    { type: 'template', template: 'text.accuweather.windspeed', dpInit: `/^accuweather\\.0\\.Current\\.WindSpeed$/`, modeScr: 'bottom' },
    { type: 'template', template: 'text.clock', dpInit: '', modeScr: 'bottom' },
],
```

### Standard and EasyView — four and three slots at the bottom

```typescript
// standard: favourite + 4 slots at the bottom
bottomScreensaverEntity: [
    { type: 'template', template: 'text.openweathermap.bot2values', dpInit: `/^openweathermap\\.0\\.forecast\\.day1\\./`, modeScr: 'bottom' },
    { type: 'template', template: 'text.openweathermap.sunriseset', dpInit: `/^openweathermap\\.0\\.forecast\\.current\\./`, modeScr: 'bottom' },
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.House.PowerConsumption',
        ScreensaverEntityText: 'Power',
        ScreensaverEntityIconOn: 'flash',
        ScreensaverEntityUnitText: 'W',
    },
    { type: 'template', template: 'text.clock', dpInit: '', modeScr: 'bottom' },
],
```

EasyView is the same with three slots (four on the `us-p` model) and a larger font.

## Notifications

Messages on the screensaver are the same thing on both routes: the admin writes them into its list, the
script into `notifyScreensaverEntity`. What they can do — content, condition, priority, acknowledge with a
group id, buzzer — is described in detail under [notifications](Screensaver-Notify).

```typescript
notifyScreensaverEntity: [{
    type: 'script',
    Priority: 10,
    Headline: 'Window open',
    Text: 'Please close it before leaving',
    HeadlineIcon: 'window-open',
    Enabled: 'alias.0.Window.Status',
    VisibleCondition: 'val > 0',
    isDismissiblePerEvent: true,
    dismissibleIDGlobal: 'window',
}],
```

`Priority`, `Headline` and `Text` are mandatory. If `VisibleCondition` is used, `Enabled` has to be set as
well. The smallest priority number wins; a message sent through a state or `sendTo` pushes everything from
this list aside.

## Pitfalls

- **Too many entries are not cut off, they are paged.** If an area holds more entries than it has slots,
  the adapter builds windows and shows them in turn — five entries on three slots alternate between the
  first three and the remaining two.
- **`alternate` entries disappear silently** as long as the version is not `alternate`. The same goes for
  any slot the current version does not have.
- **Loaded fewer than configured?** Then the log says `Warning: <area>ScreensaverEntity - loaded X of Y
  configured items` — almost always a state that does not exist.
- **`ScreensaverEntityEnabled` is a state id, not a `true`.** The state has to exist, otherwise the entry
  is rejected. The condition in `ScreensaverEntityVisibleCondition` is evaluated against **that** value,
  not against the one being displayed.
- **Colour scale:** `mode` knows `mixed`, `hue`, `cie`, `triGrad`, `triGradAnchor`, `quadriGrad` and
  `quadriGradAnchor`; `log10` only `'max'` or `'min'` — there is no `'center'`.
- **MR icons are displays, not switches.** Only indicator entries can switch something, through
  `ScreensaverEntityButton`, `ScreensaverEntitySwitch` or `ScreensaverEntityNaviToPage`.
