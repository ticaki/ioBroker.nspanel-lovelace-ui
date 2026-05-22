# Notes on the configuration script for the adapter

The script has three areas:  
- [Page configuration](#page-configuration)
```typescript
        /***********************************************************************
         **                                                                   **
         **                       Page Configuration                          **
         **                                                                   **
         ***********************************************************************/
```  
  
- [Screensaver configuration](#screensaver)
``` typescript
        /***********************************************************************
         **                                                                   **
         **                    Screensaver Configuration                      **
         **                                                                   **
         ***********************************************************************/
```
  
- Code area  
Changes in the code area are not required by the user. If updates for the script are available, they can be applied via the [Maintain page](en-Maintain) of the admin.
```typescript
    /**
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     *  END STOP END STOP END - No more configuration - END STOP END STOP END       *
     ********************************************************************************
     *  For a update copy and paste the code below from orginal file.               *
     * ******************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     */
```  

## Page configuration   
  
Page configuration is almost identical to the panel script. There are a few important points that differ from the panel script.  
- Every page needs the property `uniqueName` -> a unique name for the page.   
- The main page must have `uniqueName` **main**.  
- `next`, `prev`, `home`, `parent` must be **strings** that refer to one of the `uniqueName` values.
- Pages listed in `pages` are linked in a loop; all other pages you want to use must be listed in `subPages`. 
- The first line has changed too. Instead of `let main: Pagetype = {` it is now `const main: ScriptConfig.PageGrid = {`. The type after `ScriptConfig.` matches the `type` `cardXxx`. In this example `PageGrid` = `cardGrid`. The mapping of all page types is shown in the table below.  
- The hardware buttons are named `buttonLeft` and `buttonRight` in the adapter script (formerly `button1`/`button2`) and ***have a new configuration*** – see [here](#hardware-button-configuration).

### Available page types

The `type` (in quotes) and the `ScriptConfig.` type share the same postfix. The following combinations are valid:

| `type` | `ScriptConfig` type | Paging/Filtering¹ | Note |
|--------|---------------------|:-----------------:|------|
| `cardEntities` | `PageEntities` | ✅ | list layout |
| `cardSchedule` | `PageSchedule` | ✅ | schedule |
| `cardGrid` | `PageGrid` | ✅ | 6 tiles |
| `cardGrid2` | `PageGrid2` | ✅ | 8 tiles, `fontSize` possible |
| `cardGrid3` | `PageGrid3` | ✅ | 4 tiles |
| `cardThermo` | `PageThermo` | – | exactly **one** thermostat item |
| `cardThermo2` | `PageThermo2` | ✅ | multiple thermostats (`thermoItems`) |
| `cardMedia` | `PageMedia` | ✅ | media player, no templates |
| `cardChart` | `PageChart` | – | bar chart, configured via admin |
| `cardLChart` | `PageChart` | – | line chart, configured via admin |
| `cardPower` | `PagePower` | – | configured via admin |
| `cardAlarm` | `PageAlarm` | – | exactly **one** item |
| `cardUnlock` | `PageUnlock` | – | exactly **one** item |
| `cardQR` | `PageQR` | – | configured via admin |

¹ The "Paging/Filtering" column = supports the parameters from the section [Further navigation parameters](#further-navigation-parameters) (`scrollPresentation`, `scrollType`, `filterType`). Details on the individual page types under [Pages](en-Pages).


Example of a main page   
```typescript
const main: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'main',
    heading: 'Living room',
    items: [
        // PageItems go here
    ]
};
```
  
And a subpage  
```typescript
   const lighttest: ScriptConfig.PageEntities = {
        type: 'cardEntities',
        heading: 'Light test',
        uniqueName: 'lighttest',
        home: 'main',
        prev: 'gate',
        subPage: true,
        items: [
            // PageItems go here
        ]
    };
```  
  
* `const pageName:` -> The word _pageName_ is a placeholder. Give the page a unique name, but please without spaces for multiple words and avoid special characters.  
* `'type':` -> The type of the page, as described above. PageType and type always share the same postfix. For `type` it is CardType instead of PageType, so it is written in quotes as `'cardEntities'`, `'cardGrid'`, etc.  
* `'heading':` -> The page name / heading shown at the top center of the NSPanel. It is enclosed in quotes.   
* `'items':` ->  This is where the actual page content goes. For each element to display you add a so-called `PageItem` that then receives the parameters to be shown.  

### Testing a page

Once page/card type, name and heading are defined, you can run a first test. Add the defined page (here `pageName`) to the script under `pages` (main pages) or `subPages` (subpages):

```typescript
export const config: Config = {
    // Page division
    // Main pages
    pages: [
      pageName, // after the double slash you can add an internal note
      NSPanel_Service, // Auto-Alias Service Page
    ],
    // Subpages
    subPages: [
      // here you find the service pages again
    ],
    // ...
};
```

Then restart the script and check on the NSPanel whether the new (still empty) page is displayed.

---  
## Optional parameters  

        subPage?: boolean;
        parent?: string;
        parentIcon?: string;
        parentIconColor?: RGB;
        prev?: string;
        prevIcon?: string;
        prevIconColor?: RGB;
        next?: string;
        nextIcon?: string;
        nextIconColor?: RGB;
        home?: string;
        homeIcon?: string;
        homeIconColor?: RGB;
        hiddenByTrigger?: boolean;
        alwaysOnDisplay?: boolean | 'action' | null;
        // useColor?: boolean;   // no effect at page level (deprecated)

Before we move on to creating **PageItems**, here are the optional parameters you can set at page level:  
* `'subPage':` -> Set to `true` if you want to work with a subpage. The page then only needs to be listed in the `subPages` section.    
* `next, prev, home, parent:` -> With **next, prev, home, parent** you define the target page for navigation via its `uniqueName`. This affects the controls and the paging arrows at the top of the page.  
* `nextIcon, nextIconColor, etc.` -> These adjust the icon for navigation and the icon color. The default is white arrows; `home` shows a house as icon. For each direction there is an `*Icon` (icon name from the icon list) and an `*IconColor` (RGB).
* `'hiddenByTrigger':` -> Optionally defined to hide top-level pages (level 0) at runtime via the boolean datapoint (true/false) `nspanel-lovelace-ui.0.panels.XX_XX_XX_XX_XX.cmd.hideCards`. For `subPage` pages (level 1-n) the subpage itself is not hidden at runtime, but the menu entry at the next higher level is disabled. HideCards can also be activated via the service pages in the panel.
* `alwaysOnDisplay` -> Controls the behavior towards the screensaver:
  * `true` -> The page stays **permanently** visible and does not return to the screensaver. To reach the screensaver you must select a page without this parameter.
  * `'action'` -> The page stays visible as long as activity (e.g. a value change) occurs. After the regular screensaver timeout without activity the panel does return to the screensaver.
  * omitted / `false` / `null` -> Default behavior, the screensaver works normally.
* `useColor` -> **Deprecated at page level** and without effect (the adapter does not evaluate it there). For many page types the field no longer exists. Color control is done per **PageItem** (see `useColor` in the PageItem parameters).

## Further navigation parameters

If more PageItems are defined on a page than can be shown at once, you can page through them. These paging and filtering options (`scrollPresentation`, `scrollType`, `filterType`, `scrollAutoTiming`) are available for the page types **cardEntities, cardSchedule, cardGrid, cardGrid2, cardGrid3, cardThermo2** and **cardMedia** ("Paging/Filtering" column in the table above).

### Scroll presentation – `scrollPresentation`

* **classic** (default) -> Pages through page by page via the top-right arrow. The arrow points down as long as there are more entries; on the last page it switches to the `right` direction.  
* **arrow** -> Adds an extra arrow PageItem in the last slot of the page; clicking it pages through in a loop. The top-right navigation arrow keeps its function, so you can move to the next page without paging through the whole page.  
* **auto** -> **Automatic paging**. Behaves like `classic`, but advances on its own after a fixed interval. The interval is set with `scrollAutoTiming` in seconds (default: 15 seconds).

### Scroll step – `scrollType`

Defines how many items are moved per paging action:
* **page** (default) -> pages by a full page (all visible items).
* **half** -> pages by half a page. Only supported by certain card types.

### Filtering – `filterType`

Shows only a subset of items depending on an item's primary value:
* **'true'** -> shows only items whose primary entity resolves to `true`.
* **'false'** -> shows only items whose primary entity resolves to `false`.
* **`number`** -> shows only items matching the given numeric value.

---  

There are also the standard pages `cardQR`, `cardChart`/`cardLChart`, `cardPower`, `cardAlarm` and `cardUnlock`. They have a simple config in the script because they are mostly configured in the adapter's admin UI. The `uniqueName` must match the one in the adapter configuration. For PageChart the `type` must also match the `uniqueName` (`cardChart` = bars, `cardLChart` = line). More on this on the [dedicated wiki pages](en-Pages).
```typescript
    const powerChart: ScriptConfig.PageChart = {
        uniqueName: 'power',
        type: 'cardChart' // bar chart
    };

    const temperature: ScriptConfig.PageChart = {
        uniqueName: 'temperature',
        type: 'cardLChart' // line chart
    };

    const powerGrid: ScriptConfig.PagePower = {
        uniqueName: 'powerpage',
        type: 'cardPower'
    };
```  

## PageItems    

PageItems are similar to those in the panel script, but the adapter reads a lot from the **Channel** and **State** objects. Therefore often only the `id` parameter is needed to create a PageItem – provided the channel and the underlying states are correctly set up regarding role, min/max and type (number/string/…).

A PageItem is declared as an object `{ … },` and added to a page's `items` array. What it almost always carries is an **`id`**, a **`name`** and a **color definition**:

```typescript
{ id: 'alias.0.NSPanel_1.AirPurifier', name: 'Air purifier', icon: 'power', icon2: 'power', offColor: MSRed, onColor: MSGreen },
```

For a PageItem used for **navigation**, instead of an `id` you provide `navigate: true` and `targetPage: '<uniqueName of the target page>'`:

```typescript
{ navigate: true, icon: 'home', name: 'Home', targetPage: 'MenuGrid' },
```

When everything is set up, start the script and wait for the feedback – the script terminates itself. The phrase `not implemented yet!` means it is not built in yet, and `not supported` means it will not be built in. ;)

### Three kinds of PageItems

| Kind | Identifier | Description |
|------|------------|-------------|
| **Standard** | `id` or `navigate`/`targetPage` | The normal case. The adapter reads role and values from the alias / channel. |
| **Custom** | `type: 'custom'` + `id` | Reduced set of options (`id`, `name`, `icon`/`icon2`, `onColor`/`offColor`, `colorScale`, `fontSize`, `buttonText`, `navigate`/`targetPage`/`longPress`), no automatic role evaluation. |
| **Native** | `native: { … }` | Adapter-internal raw configuration without type checking (e.g. for templates, see [Templates](#templates)). Optionally with `navigate`/`targetPage`. |

### Minimum entries (standard PageItem)
* `id` :  path to the alias/datapoint, enclosed in quotes
* `name` :  text shown as a label on the display, enclosed in quotes

> [!IMPORTANT]  
> * `name` is not mandatory if the alias is configured correctly – then the name is taken from `common.name.en`.  
> * How to define aliases and what options exist is covered in separate wiki chapters.

### Optional / specific entries

#### Visibility & status
* `enabled` : `false` = item permanently disabled (not selectable). If a datapoint `<id>.ENABLED` exists, it controls activation at runtime.
* `filter` : numeric filter value; works together with the page's `filterType` (see [Filtering](#filtering--filtertype)).
* `role` : overrides the automatically detected role of the item (only needed in special cases).

#### Icon color
* `offColor` :  color for off (RGB)
* `onColor` :  color for on (RGB; on CardChart also the bar color)
* `useColor` :  `true`/`false`. When `true`, the config parameters **defaultOnColor**/**defaultOffColor** are used, unless `onColor`/`offColor` are set in the PageItem.
* `colorScale` :  color scale or icon selection depending on the value (see [Color scale – colorScale](#color-scale--colorscale)).

> [!IMPORTANT]  
> Without an icon color a default combination applies. It can be set via **defaultColor** (**defaultOnColor** & **defaultOffColor**) in the configuration.

#### Label & text
* `prefixName` / `suffixName` : text before / after `name`.
* `prefixValue` / `suffixValue` : text before / after the **value**.
* `buttonText` : replaces the default text "PRESS" (e.g. on cardEntities).
* `buttonTextOff` : alternative button text for the off state.
* `fontSize` : font size **0–5** (mainly **cardGrid2**), together with `useValue: true`:
  * **0** – default – size 24 (no icons, many special chars)
  * **1** – size 32 (icons, limited chars)
  * **2** – size 32 (no icons, many special chars)
  * **3** – size 48 (icons, limited chars)
  * **4** – size 80 (icons, limited chars)
  * **5** – size 128 (ASCII only)

#### Icons
* `icon` : icon for the on/true state
* `icon2` : icon for the off/false state (not supported by all aliases)
* `icon3` : additional icon, e.g. for blinds "partially open"

> [!NOTE]  
> Icon names must come from the [icon file](https://htmlpreview.github.io/?https://github.com/jobr99/Generate-HASP-Fonts/blob/master/cheatsheet.html). `icon`/`icon2` override an icon supplied by default from the alias. For many aliases no `icon`/`icon2` is needed.

#### Values & units
* `unit` : unit (e.g. °C) – does not apply to all alias roles
* `useValue` : must be `true` when `fontSize` is used
* `minValue` / `maxValue` : start/end value for the slider
* `stepValue` : step size
* `modeList` : value list for an **InSelPopup** (array of strings)
* `inSel_Alias` : alias datapoint for the InSel selection
* `inSel_ChoiceState` : *(deprecated)* focus of a selected value in the InSelPopup
* `monobutton` : `true` if a real hardware push button is installed (a push button is emulated); `false` emulates a switch.
* `customIcons` : custom icon list (special cases)
* `actionStringArray` : custom action strings (special cases)
* `useValueConditions` : *(expert)* string expression for conditional value display

#### Navigation, long press & subpages
* `navigate` : `true` replaces `id` and requires `targetPage`; opens the target page.
* `targetPage` : `uniqueName` of the target page (short press).
* `targetPageLongPress` : target page on **long press**.
* `longPress` : datapoint/action on **long press**. ⚠️ `longPress` and `targetPageLongPress` must **not** be set together in one item.

#### Light & media control
* `interpolateColor` : `true` computes the current color of the light source.
* `colormode` : for ALIAS RGB – `'rgb'` (default) or `'xy'` (XY color translation).
* `asControl` : for media items – `true` = direct control (play/pause), `false` = navigation to the media page.

##### PopupLight
* `minValueBrightness` / `maxValueBrightness` : slider limits brightness
* `minValueColorTemp` / `maxValueColorTemp` : slider limits color temperature

#### Shutter (PopupShutter)
* `secondRow` : text for the second line
* `minValueLevel` / `maxValueLevel` : lowest (down) / highest (up) position
* `minValueTilt` / `maxValueTilt` : lowest / highest tilt position
* `shutterType` : type of the shutter
* `shutterIcons` : custom icon definitions (up to 3)
* `sliderItems` : custom slider definitions (up to 3)

#### role `button` – confirmation
* `confirm` : confirmation dialog before triggering – either a text (string) or an object `{ text?, icon?, color? }`.

#### CardChart-specific
* `yAxis` : name of the y-axis
* `yAxisTicks` : value scale of the y-axis (array of numbers or string)
* `xAxisDecorationId` : datapoint for labeling the x-axis
* `onColor` : color of the bars

#### CardAlarm / CardUnlock / CardQR-specific
* `autoCreateALias` : the NSPanel script creates the datapoints under `0_userdata.0` and `alias.0` automatically when `true`.
* `hidePassword` : *(CardQR)* hides the Wi-Fi password on the PageQR.

#### CardThermo-specific
* `stepValue` : step size of the setpoint temperature (together with `minValue`/`maxValue`)
* `iconArray` : replacement for the default icons in the lower part (notation like `modeList`)
* `setThermoDestTemp2` : second setpoint temperature via an additional ALIAS datapoint (ACTUAL2)
* `icon` : icon of the popup window

##### PopupThermo
* `popupThermoMode1` / `popupThermoMode2` / `popupThermoMode3` : popups (top / middle / bottom row) shown via the 3 dots below the setpoint temperature, accepting values to control additional states.
* `popUpThermoName` : list of headings (array)
* `setThermoAlias` : ALIAS list (array) returning the selected states numerically

#### CardMedia (`media` object)
A `cardMedia` page is not configured via normal PageItems but via its `media` object; the player instance is derived from its `id`. Important fields:
* `id` : media datapoint (folder/device/channel) – also determines the player instance
* `mediaDevice` : alexa2 = Echo serial number, sonos = IP, squeezeboxrpc = device name
* `speakerList` : switchable/selectable device names
* `playList` : alexa2 and spotify-premium only
* `favoriteList` : whitelist of playlists to show
* `equalizerList` : if device + adapter provide an equalizer function
* `repeatList` : e.g. `['off','context','track']` (spotify-premium)
* `volumePresets` : volume presets as `"name?value"` (e.g. `["quiet?5","loud?95"]`)
* `colorMediaIcon` / `colorMediaArtist` / `colorMediaTitle` : colors for icon / artist / title
* `minValue` / `maxValue` : volume limits

Full description on the [PageMedia](en-PageMedia) page.

### Color scale – `colorScale`

`colorScale` colors an icon depending on a value. There are two variants:

**Color gradient** (`val_min`/`val_max`):
```typescript
colorScale: {
    val_min: 0,        // value for the "min" color (default: red)
    val_max: 10,       // value for the "max" color (default: green)
    // val_best: 5,    // optional: optimum value; val_min/val_max then become red, val_best green
    // color_best: { red: 0, green: 255, blue: 0 }, // only effective when val_best is set
    // mode: 'mixed',  // mix mode (default: 'mixed')
    // log10: 'max',   // optional logarithmic scaling ('max'/'min'), otherwise linear
}
```

`mode` determines the color mixing:
* `mixed` (default) – linear interpolation between two RGB colors
* `cie` – mixing via the CIE color table
* `hue` – scaling via hue/saturation/brightness
* `triGrad` – three-color gradient red→yellow→green (ignores custom colors)
* `triGradAnchor` – like `triGrad`, anchors yellow to `val_best`
* `quadriGrad` – four-color gradient red→yellow→green→blue (ignores custom colors)
* `quadriGradAnchor` – like `quadriGrad`, anchors green to `val_best`

**Icon selection** – instead of a color, a different icon is chosen depending on the value:
```typescript
colorScale: { valIcon_min: 0, valIcon_max: 100 /*, valIcon_best: 50 */ }
```

## Base page with PageItem

Once you have built one – or, depending on the page type, several – `PageItems` and added them to the `items` array, you get a page with visible content:

```typescript
const name: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    heading: 'Page heading',
    uniqueName: 'livingroom',
    items: [
        { id: 'alias.0.NSPanel_1.AirPurifier', name: 'Air purifier', icon: 'power', icon2: 'power', offColor: MSRed, onColor: MSGreen },
    ],
};
```

> Test your `PageItems` entry by entry – this makes troubleshooting easier.

## Hardware button configuration

The two hardware buttons below the display are configured in the `config` object via `buttonLeft` and `buttonRight`. The following modes exist:

| `mode` | Effect | Additional fields |
|--------|--------|-------------------|
| `'page'` | navigates to a page | `page` (uniqueName of the target page) |
| `'switch'` | toggles a datapoint between `true`/`false` | `state` (boolean datapoint) |
| `'button'` | sets a button datapoint briefly to `true`; it stays `true`, only the timestamp changes | `state` |
| `'buttonOnDelayOff'` | immediately `true`, back to `false` after `delay` | `state`, `delay` |
| `'buttonOffDelayOn'` | immediately `false`, back to `true` after `delay` | `state`, `delay` |
| `'buttonDelayOn'` | to `true` after `delay` | `state`, `delay` |
| `'buttonDelayOff'` | to `false` after `delay` | `state`, `delay` |
| `null` | button without function | – |

* `delay` (only for the `button…Delay…` modes): delay in seconds. Default 0.25 s, valid range 0.001 to 2147483 (~24 days).

Examples (for `buttonLeft`; the right button is named `buttonRight`):

```typescript
// Navigate to a page (page = uniqueName of the page)
buttonLeft: { mode: 'page', page: 'main' },

// Toggle a boolean datapoint (e.g. a switch)
buttonRight: { mode: 'switch', state: 'alias.0.Light.switch' },

// Push button: briefly sets true (e.g. a blind push button, role Button)
buttonLeft: { mode: 'button', state: 'alias.0.Blind.up' },

// true for 30 s, then automatically false
buttonRight: { mode: 'buttonOnDelayOff', delay: 30, state: 'alias.0.relay' },

// set to false after 600 s
buttonLeft: { mode: 'buttonDelayOff', delay: 600, state: 'alias.0.relay' },

// button without function
buttonLeft: null,
```  
---
## Screensaver  
  
The screensaver offers several layouts. They are activated via the service pages. The script that the adapter generates automatically already contains various entries for all layouts. These just need slight adjustments but are largely identical to the script. More details on the screensaver in a [dedicated chapter](en-screensaver). 

---

## Templates  

### Introduction

Templates provide an easy way to integrate frequently used display and control elements into **PageItems**. 
A template is included as an object in a page's `items` array and automatically provides the matching visualization and logic.

### Usage

A template is defined via the `native.template` attribute. 
`dpInit` specifies the datapoint ID the template is bound to.

Example of a clock (digital display):

```ts
{ native: { template: 'text.clock', dpInit: '' } },
```

Example of a battery indicator (low battery, with `indicator.lowbat` role):

```ts
{ native: { template: 'text.battery.low', dpInit: 'hm-rpc.1.0000DYXSDSDEF71111B7.0.LOW_BAT' } },
```

#### Navigation extension

All templates additionally support the attributes `navigate` and `targetpage`. This allows opening another page when triggered.  
If necessary, `type: 'button'` must be added.

```ts
{
  navigate: true,
  targetpage: 'targetpage',
  native: { template: 'text.battery.low', dpInit: '', type: 'button' },
},
```

### Examples

#### Grid with template

Templates can be used on **cardGrid** pages:

```ts
const subgrid1: PageType = {
  uniqueName: 'media2',
  heading: 'Grid 1',
  items: [
    { native: { template: 'text.battery.low', dpInit: '0_userdata.0' } },
  ],
  type: 'cardGrid',
  home: 'hidden',
  parent: 'cardGrid1',
  hiddenByTrigger: false,
};
```

#### Limitations

- Templates are **not** available on `cardMedia` pages.  
  Custom PageItems can still be used.  
  For `cardMedia` the search path for datapoints is fixed and cannot be changed.

- For roles the spelling must be **exact** (e.g. `indicator.lowbat`).

### Available templates

The following overview shows common templates and their use cases:

| Template                  | Description                          |
|----------------------------|-------------------------------------|
| `text.clock`              | digital clock                       |
| `text.battery.low`        | battery indicator (low)             |
| `text.battery`            | battery indicator (general)         |
| `text.window.isOpen`      | window open                         |
| `text.window.isClose`     | window closed                       |
| `text.temperature`        | temperature display                 |
| `text.door.isOpen`        | door open                           |
| `text.gate.isOpen`        | gate open                           |
| `text.motion`             | motion detection                    |
| `text.info`               | info text                           |
| `text.warning`            | warning indicator                   |
| `text.wlan`               | Wi-Fi status                        |
| `text.shutter.navigation` | shutter control (navigation)        |
| `text.lock`               | lock state                          |
| `text.isOnline`           | online/offline status               |

In addition there are templates for special **use cases** (e.g. `text.sainlogic.windarrow`, `text.custom.windarrow`, `text.hmip.windcombo`).

There are further templates that can be used depending on the **use case**.  
The naming follows the intended area of use (e.g. `button`, `light`, `shutter`).  

A complete overview can be provided on request.

### Advanced customization (for experts)

Templates can be fully customized – e.g. color, icon or even the associated datapoints.  
However, this should **only be done by experienced users** and after consultation, as such changes can easily lead to errors.  

Example: changing the color of the clock (`text.clock`):

```ts
// Example 1: fixed color (const)
native: {
    template: 'text.clock',
    dpInit: '',
    data: {
        icon: {
            true: {
                color: { type: 'const', constVal: Red },
            },
        },
    },
},
```

```ts
// Example 2: dynamic color from a state (RGB JSON string)
native: {
    template: 'text.battery.low',
    dpInit: 'hm-rpc.1.Battery-Device.0.LOW_BAT',
    data: {
        icon: {
            true: {
                color: { type: 'state', dp: '0_userdata.0.visuals.batteryColorRGB' },
            },
        },
    },
},
```

```ts
// Example 3: dynamic color via trigger (RGB JSON string)
native: {
    template: 'text.battery.low',
    dpInit: 'hm-rpc.1.Battery-Device.0.LOW_BAT',
    data: {
        icon: {
            true: {
                color: { type: 'triggered', dp: '0_userdata.0.visuals.triggeredBatteryColor' },
            },
        },
    },
},
```

### Important notes

1. There are **no type definitions** for the `native` block in the configuration script.  
   The reason: this directly touches the adapter-internal configuration, which is complex and may still change.  

2. All described options work in principle.  
   However, it may happen that certain options are not yet built into the configuration script.  
   Adding them usually takes a few minutes – just let us know if something is missing or does not work as expected.

---

## Note: ack behavior of datapoints

In **0_userdata.0** and **alias.0** the adapter reacts to every change (`ack=true` or `ack=false`) of a subscribed datapoint. Otherwise the following applies:
- **Outside** the adapter namespace (`nspanel-lovelace-ui.0`) the adapter reacts to `ack=true` and sets datapoints with `ack=false`.
- **Inside** the adapter namespace the adapter reacts to `ack=false` and sets datapoints with `ack=true`.

> **Color themes:** Color themes for PageItems are maintained in the admin on the 2nd page below the table – see [User color theme](en-ColorThemes).
