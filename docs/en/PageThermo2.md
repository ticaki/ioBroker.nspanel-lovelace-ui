# Page Thermo2

The PageThermo has a new design and additional functions. It can now manage several heating circuits and, in addition to the thermostat states, take in normal PageItems, making it more open in its configuration.

## Configuring PageThermo2 in the adapter
This differs from the script configuration, hence a complete description.
Structure:
- [Appearance](#appearance)
- [Features](#features)
- [Issues](#known-issues)
- [Configuration](#configuration)
    - [Alias](#alias)
    - [Directly via states](#directly-via-states)
    - [Common properties](#common-properties)
- [PageItem extension](#pageitem-extension)

### Appearance:
 <img alt='Thermo2WithDP' src='Pictures/PageThermo2/Thermo2MitDatenpunkten.png'>

### Features:

- up to 8 heating circuits possible (e.g. heating/air conditioning or kitchen/living room/...)
- an unlimited number of PageItems (with paging) – the 8 around the edge and no. 9 between the + and -
- PageItems can be assigned to a heating circuit (when there are several circuits, automatically created ones are always assigned to one)
- headings are per heating circuit
- the lines above and below the set temperature are freely definable with icon, value, unit

### Known issues
- slight flickering due to the nice look – this will remain
- mode and modeset may still be inconsistent – work in progress

### Configuration
A complete page looks like this in the script, for example:

```typescript
    const ThermoNew: PageType = {
        type: 'cardThermo2',
        uniqueName:'main',
        heading: 'does not matter, not shown anyway',
        thermoItems:[
            {name: 'test1', id:'0_userdata.0.Single_Devices.Thermostat'},
            {name: 'test2', modeList:['off','broken', 'wrong'], modeId:'0_userdata.0.Single_Devices.Thermostat.MODE' ,iconHeatCycle:'home', iconHeatCycleOffColor:Red, thermoId1:'0_userdata.0.Single_Devices.Thermostat.ACTUAL', set:'0_userdata.0.Single_Devices.Thermostat.SET', thermoId2:'0_userdata.0.Single_Devices.Thermostat.HUMIDITY'}],
        items:[
            {id: 'alias.0.Light.lights.Device_1', filter: 0},
            {id: 'alias.0.Light.lights.Device_2', filter: 0},
            {id: '0_userdata.0.Single_Devices.dimmer'},
            {id: 'alias.0.NSPanel.general.hue', },
            {navigate: true, targetPage: 'timetable'},
            {id: 'alias.0.NSPanel.general.shutter', filter: 1},
            {id: 'alias.0.NSPanel.general.shutter', filter: 1},
            {id: 'alias.0.NSPanel.general.shutter', filter: 1}
            ],
    }
```

#### Alias
As usual you can use aliases (see [table](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/ALIAS.md)). The role **airCondition** creates 2 heating circuits. This is configured via `name2`, `iconHeatCycle2`, `iconHeatCycleOnColor2` and `iconHeatCycleOffColor2`. Many of the optional states are included and are added as PageItems per heating circuit. Please report any missing ones.
```typescript
    const Thermo2New: PageType = {
        type: 'cardThermo2',
        uniqueName:'page name for internal use - required',
        heading: 'does not matter, not shown anyway',
        thermoItems:[
            {
                name: 'This is the heading',
                id:'0_userdata.0.Single_Devices.Thermostat', // this is the channel, device or folder
            },
        ],
        items:[],
    }
```
- `thermoItems` contains objects (`{}`) describing the heating circuits, minimum 1 (list/array)
  - `id` is the channel. (string)
  - `name` is the heading shown. (string) Without it, `common.name` of the channel is used.
  - `name2` is the heading used for an `airCondition`.
  - `iconHeatCycle2`: overrides the number icon in the PageItems (around the edge) **only for airCondition**
  - `iconHeatCycleOnColor2`: overrides the "active" colour in the PageItems (around the edge) **only for airCondition**
  - `iconHeatCycleOffColor2`: overrides the "inactive" colour in the PageItems (around the edge) **only for airCondition**

The **MODE** state has changed, so please read below under [modeList](#modelist).

#### Directly via states
This cannot be mixed with alias, but may of course reference the states of a created channel.
```typescript
const Thermo2New: PageType = {
        type: 'cardThermo2',
        uniqueName:'page name for internal use - required',
        heading: 'does not matter, not shown anyway',
        thermoItems:[
            {
                name: 'This is the heading',
                set:'0_userdata.0.Single_Devices.Thermostat.SET', // the heating set value
                thermoId1:'0_userdata.0.Single_Devices.Thermostat.ACTUAL', // current room temperature (top value in the display)
                thermoId2:'0_userdata.0.Single_Devices.Thermostat.HUMIDITY', // current humidity (bottom value in the display)
                modeId:'0_userdata.0.Single_Devices.Thermostat.MODE', // text field below the values - not a string state
            }
        ],
        items:[],
    }
```
- `thermoItems` contains objects (`{}`) describing the heating circuits, minimum 1 (list/array)
  - `name` is the heading shown. (string)
  - `set` is the heating set value – currently no split into read/write
  - `thermoId1` current room temperature (top value in the display)
  - `thermoId2` current humidity (bottom value in the display)
  - `modeId` see the description of `modeList` below

#### Common properties

<img alt='Thermo2_1' src='Pictures/PageThermo2/Thermo2_1.png'>
<img alt='Thermo2_2' src='Pictures/PageThermo2/Thermo2_2.png'>

These are the properties that can be specified in addition to `name`, `id` resp. `name`, `set`, and what they mean:

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
        power?: string;
        unit?: string;
        unit2?: string;
        onColor?: RGB;
        onColor2?: RGB;
        modeList?: string[];
```

**icon:** overrides the default icon in the 1st text line (temperature)
**onColor:** overrides the colour of the 1st text line (temperature)
**unit:** overrides the unit of the 1st and 2nd text line (temperature)

**icon2:** as above for line 3 (humidity)
**onColor2:** as above for line 3 (humidity)
**unit2:** overrides the unit of the 3rd text line (humidity)

**iconHeatCycle:** overrides the number icon in the PageItems (around the edge)
**iconHeatCycleOnColor:** overrides the "active" colour in the PageItems (around the edge)
**iconHeatCycleOffColor:** overrides the "inactive" colour in the PageItems (around the edge)

**minValue:** minimum settable temperature (default: 15) *configurable in the admin whether 10 = 1 °C or 10 = 10 °C*
**maxValue:** maximum settable temperature (default: 28) *configurable in the admin*
**stepValue:** steps for +/-. A value of 0.1 means steps of 0.1 (default: 0.5) *configurable in the admin*

**~~power~~:** currently used via MODESET; if it is 0 the display shows "off"

*configurable in the admin*: there is an option at the very bottom of the `NSPanel settings` page whether you want it script-compatible or natural.

### modeList
**modeList:** this is, I think, not final yet and needs significantly more text :)
`modeId` resp. 'MODE' and `MODESET` work in the same way. The state should be of type `number` and can use the object `common.states` – then `common.states` is used for `modeList`.
`modeList` overrides `common.states`, which overrides the `default mode list` stored in the adapter:

Default mode list
```typescript
['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN', 'DRY']
```
If the state contains e.g. 0 then `OFF` is shown, if it contains 3 then `HEAT` is shown (the texts are translated).
If the same is set in the state's `common.states`, the same applies there. Likewise in the modeList.

In the script this then looks, somewhat localised, like this:
```typescript
modeList: ["Off'm", "Automat", "Cool'n", "Heat'n", "Save", "Blow", "Dry"],
```

In addition, TargetMode and CurrentMode were split – see the alias table – this is not final yet; we would like to show the CurrentMode below the temperature with `inactive, idle, heating, cooling`.
If MODE is not specified it is replaced by MODESET.
MODE: can be of `common.type = 'string'`, then whatever is in the state is simply written.

### Arrangement of the PageItems (`sortOrder`)
Optional page property that defines the order in which the up to 8 surrounding PageItems are placed around the thermostat. The default is `'V'`.

```typescript
const ThermoNew: PageType = {
    type: 'cardThermo2',
    uniqueName: 'main',
    sortOrder: 'H', // optional, default 'V'
    thermoItems: [/* ... */],
    items: [/* ... */],
};
```

- `'V'` – vertical (default, natural order of `items`)
- `'H'` – horizontally interleaved
- `'VM'` / `'HM'` – vertical resp. horizontal, centre-anchored
- `'VB'` / `'HB'` – vertical resp. horizontal, bottom variant

The paging/filter parameters (`scrollPresentation`, `scrollType`, `filterType`) from [ScriptConfig](en-ScriptConfig#further-navigation-parameters) are also available, since `cardThermo2` can take in more than 8 (resp. 9) PageItems.

### PageItem extension
For the PageItems there is a new property that is currently only relevant for cardThermo2:
```typescript
items:[
    {id: 'alias.0.Light.lights.Device_1', filter: 0},
],
```
`filter:` if defined, the PageItem is only shown when the corresponding heating circuit is active. Counting starts at 0 (number).
**When an airCondition is added via 'id', the index increases by 1 after the airCondition.**

The adapter now also supports placeholder PageItems – they are defined via `id:'delete'` or `id:'empty'`.

Final note – the roles for airCondition may still change; they seem to differ from thermostat, so better check the alias table.
