# Page Thermo2

The PageThermo has been given a new design and extra functions. It can now handle several heat circuits
and, on top of the thermostat's states, take ordinary page items — which makes its configuration a good
deal more open.

> **The page is configured in the admin**, in the *PageConfig* tab:
> [Thermostat – configuration in the admin](PageThermo2-Admin). The editor, the heat circuit dialog and
> every field are described there, with pictures. **This page describes the second way: the configuration
> by script** — and what of it arrives on the panel.

## Configuring PageThermo2 in the adapter

This differs from the script configuration, hence a complete description.

Structure:
- [Appearance](#appearance)
- [Features](#features)
- [Known problems](#known-problems)
- [Configuration](#configuration)
    - [Alias](#alias)
    - [States directly](#states-directly)
    - [Shared options](#shared-properties)
- [Page item extension](#page-item-extension)

### Appearance

<img alt='Thermo2WithDP' src='../Pictures/PageThermo2/Thermo2MitDatenpunkten.png'>

### Features

- up to 8 heat circuits (e.g. heating/air conditioning, or kitchen/living room/…) — more are discarded with a warning („only 8 are supported")
- any number of page items (with paging); **eight arrive on the panel per page** — four on the left, four on the right
- the order of those eight tiles is set by `sortOrder`: `V` (default, vertical), `H` (horizontal), plus `HM`, `VM`, `HB` and `VB`
- page items can be tied to a heat circuit (items generated automatically always belong to one when there are several circuits)
- headlines are per heat circuit
- the lines above and below the setpoint are freely definable with icon, value and unit

> **The place between − and + is not a page item.** The mode text sits there permanently. The editor in the
> admin does offer nine slots per page, but the adapter only sends eight page items (`pageThermo2.ts`,
> `maxItems = 8`) — an item in the ninth slot never reaches the panel, and the paging in the editor runs
> against the paging on the panel.

### Known problems
- slight flickering because of the pretty looks – that will stay
- MODE and MODESET may still be inconsistent – work in progress

### Configuration

A complete page looks like this in the script:

```typescript
    const ThermoNew: PageType = {
        type: 'cardThermo2',
        uniqueName: 'main',
        heading: 'does not matter, it is not shown',
        thermoItems: [
            { name: 'test1', id: '0_userdata.0.Devices.Thermostat' },
            { name: 'test2', modeList: ['off', 'broken', 'wrong'], modeId: '0_userdata.0.Devices.Thermostat.MODE', iconHeatCycle: 'home', iconHeatCycleOffColor: Red, thermoId1: '0_userdata.0.Devices.Thermostat.ACTUAL', set: '0_userdata.0.Devices.Thermostat.SET', thermoId2: '0_userdata.0.Devices.Thermostat.HUMIDITY' }],
        items: [
            { id: 'alias.0.Light.lights.Device_1', filter: 0 },
            { id: 'alias.0.Light.lights.Device_2', filter: 0 },
            { id: '0_userdata.0.Devices.dimmer' },
            { id: 'alias.0.NSPanel.general.hue' },
            { navigate: true, targetPage: 'timetable' },
            { id: 'alias.0.NSPanel.general.shutter', filter: 1 },
            ],
    }
```

#### Alias

As usual, aliases can be used (see the [table](ALIAS)). The channel has to carry the role **thermostat**
or **airCondition**; any other role is rejected. The role **airCondition** creates 2 heat circuits — the
second one uses **`SET2`**; without that state the cooling circuit disappears. It is set up through
`name2`, `iconHeatCycle2`, `iconHeatCycleOnColor2` and `iconHeatCycleOffColor2`. Many of the optional
states are included and are added as page items belonging to the circuit. Please report missing ones.

```typescript
    const Thermo2New: PageType = {
        type: 'cardThermo2',
        uniqueName: 'page name for internal use – mandatory',
        heading: 'does not matter, it is not shown',
        thermoItems: [
            {
                name: 'This is the headline',
                id: '0_userdata.0.Devices.Thermostat', // this is the channel, device or folder
            },
        ],
        items: [],
    }
```

- `thermoItems` holds objects (`{}`) describing the heat circuits, at least one (a list/array)
  - `id` is the channel (string)
  - `name` is the headline shown (string). Without it the adapter looks at the channel's `common.name`.
  - `name2` is the headline used for an `airCondition`
  - `iconHeatCycle2`: overrides the number icon in the page items (around the ring) **for airCondition only**
  - `iconHeatCycleOnColor2`: overrides the colour for „active" in the page items **for airCondition only**
  - `iconHeatCycleOffColor2`: overrides the colour for „inactive" in the page items **for airCondition only**

The state **MODE** has changed, so please read [modeList](#modelist) below.

#### States directly

This cannot be mixed with an alias, but it may of course point at the states of an existing channel.

```typescript
const Thermo2New: PageType = {
        type: 'cardThermo2',
        uniqueName: 'page name for internal use – mandatory',
        heading: 'does not matter, it is not shown',
        thermoItems: [
            {
                name: 'This is the headline',
                set: '0_userdata.0.Devices.Thermostat.SET',        // the setpoint of the heating
                thermoId1: '0_userdata.0.Devices.Thermostat.ACTUAL',   // current room temperature (upper value)
                thermoId2: '0_userdata.0.Devices.Thermostat.HUMIDITY', // current humidity (lower value)
                modeId: '0_userdata.0.Devices.Thermostat.MODE',        // text field below the values
            }
        ],
        items: [],
    }
```

- `thermoItems` holds objects (`{}`) describing the heat circuits, at least one (a list/array)
  - `name` is the headline shown (string)
  - `set` is the setpoint of the heating — **it has to exist and be writeable**, otherwise the adapter skips the whole heat circuit and reports *invalid SET datapoint. Not exists or not writeable!*
  - `thermoId1` current room temperature (upper value in the display)
  - `thermoId2` current humidity (lower value in the display)
  - `modeId` see the description of `modeList` below

#### Shared properties

<img alt='Thermo2_1' src='../Pictures/PageThermo2/Thermo2_1.png'>
<img alt='Thermo2_2' src='../Pictures/PageThermo2/Thermo2_2.png'>

These are the properties that can be given in addition to `name`, `id` or `name`, `set`, and what they
mean:

```typescript
        icon?: AllIcons | '';
        icon2?: AllIcons | '';
        iconHeatCycle?: AllIcons | '';
        iconHeatCycleOnColor?: RGB;
        iconHeatCycleOffColor?: RGB;
        name?: string;
        minValue?: number;
        maxValue?: number;
        stepValue?: number;
        power: string;   // not optional
        unit: string;    // not optional
        unit2?: string;
        onColor?: RGB;
        onColor2?: RGB;
        modeList?: string[];
```

**icon:** overrides the default icon of the 1st text line (temperature)
**onColor:** overrides the colour of the 1st text line (temperature)
**unit:** overrides the unit — **in the script for both value lines** (temperature and humidity)

**icon2:** as above for line 3 (humidity)
**onColor2:** as above for line 3 (humidity)
**unit2:** overrides the unit of the 3rd text line (humidity) — **works in the admin configuration only**, the script route does not read the field

**iconHeatCycle:** overrides the number icon in the page items (around the ring)
**iconHeatCycleOnColor:** overrides the colour for „active" in the page items
**iconHeatCycleOffColor:** overrides the colour for „inactive" in the page items

**minValue:** lowest setpoint that can be dialled in (default: 15) *the admin decides whether 10 means 1 °C or 10 °C*
**maxValue:** highest setpoint (default: 28) *set in the admin*
**stepValue:** step for +/−. A 0.1 means steps of 0.1 (default: 0.5) *set in the admin*

**power:** state for on/off. **If it exists it takes precedence**; without it the adapter derives the
state from `MODESET` or `modeId` (a 0 there means „off").

*set in the admin*: on the page `Nspanel settings`, right at the bottom, there is an option whether you
want it compatible with the script or natural.

### modeList

**modeList:** this is probably not final yet and needs a good deal more text :)
`modeId`, `MODE` and `MODESET` all work the same way. The state should be of type `number` and may use
`common.states` in its object – then those `common.states` act as the `modeList`.

**Which list wins depends on the route:** with an **alias**, the state's `common.states` count first, then
`modeList`, finally the default list. With **states given directly** it is the other way round:
`modeList` first, then `common.states`, then the default list.

Default mode list
```typescript
['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN', 'DRY']
```
A 0 in the state shows `OFF`, a 3 shows `HEAT` (the texts are translated). The same applies when the
`common.states` of the state say so, and likewise for the modeList.

In a script, adapted to your region, it then looks like this:
```typescript
modeList: ["Off", "Auto", "Cool", "Heat", "Eco", "Fan", "Dry"],
```

In the alias the two states are called **`MODE`** (role `value.mode.thermostat`, read-only) and
**`MODESET`** (role `level.mode.thermostat`, writeable) — states named *TargetMode* or *CurrentMode* do
not exist. If `MODE` is not given, `MODESET` takes its place.

> A `MODE` of type `string` is provided for but hardly ever takes effect: the adapter checks the type of
> the **channel object** instead of the mode state, and channels usually have no type at all.

### Page item extension

For page items there is a property that currently only matters for cardThermo2:

```typescript
items:[
    {id: 'alias.0.Light.lights.Device_1', filter: 0},
],
```

`filter`: if it is defined, the page item is only shown while the corresponding heat circuit is active.
Counting starts at 0 (number). **If an airCondition is added through `id`, the index of everything after
it goes up by one.**

The adapter now also supports placeholder page items — defined through `id:'delete'` or `id:'empty'`.

> **Placeholders ignore `filter`.** They appear in **every** heat circuit — a gap built for one circuit is
> therefore built into all of them.

Closing remark – the roles for airCondition may still change; they seem to differ from thermostat, so
better check the alias table.
