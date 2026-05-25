# Screensaver Configuration

The screensaver is the view shown on the NSPanel when it is not actively being used. This documentation describes all options for configuring the screensaver in your configuration script.

## Table of Contents

<table>
<tr>
<td width="50%">

**Basics**
- [Screensaver Modes](#screensaver-modes)
  - [Advanced Mode (default)](#1-advanced-mode-default)
  - [Alternate Mode](#2-alternate-mode)
  - [Standard Mode](#3-standard-mode)
  - [Easy View Mode](#4-easy-view-mode)
- [Areas in Detail](#areas-in-detail)
- [MR Icons (relay symbols)](#mr-icons-relay-symbols)
- [Swipe Gestures](#swipe-gestures)
- [Icons for the NSPanel](#icons-for-the-nspanel)

**Configuration**
- [Configuration Types](#configuration-types)
  - [Script configuration](#1-script-configuration-type-script)
  - [Template configuration](#2-template-configuration-type-template)
  - [Native configuration](#3-native-configuration-type-native)
- [Configuration Areas](#configuration-areas)
  - [favoritScreensaverEntity](#favoritscreensaverentity)
  - [bottomScreensaverEntity](#bottomscreensaverentity)
  - [indicatorScreensaverEntity](#indicatorscreensaverentity)
  - [leftScreensaverEntity](#leftscreensaverentity)
  - [alternateScreensaverEntity](#alternatescreensaverentity)
  - [mrIcon1/2ScreensaverEntity](#mricon1screensaverentity-and-mricon2screensaverentity)
  - [Screensaver notifications](#screensaver-notifications)

</td>
<td width="50%">

**Advanced Configuration**
- [Script configuration parameters](#script-configuration-parameters)
- [Using color constants](#using-color-constants)
- [colorScale - advanced icon scaling](#colorScale---advanced-icon-scaling)

**Templates and Text Elements**
- [Template configuration](#template-configuration)
- [Weather templates](#weather-templates)
  - [Pirate Weather](#pirate-weather)
  - [OpenWeatherMap](#openweathermap)
  - [AccuWeather](#accuweather)
  - [BrightSky](#brightsky)
- [Additional text templates](#additional-text-templates)
  - [General templates](#general-templates)
  - [Windows & Doors templates](#windows--doors-templates)
  - [Motion & Security](#motion--security-templates)
  - [Network & Connectivity](#network--connectivity-templates)
  - [Special templates](#special-templates)

**Practical Examples**
- [Complete working examples for all modes](#complete-working-examples-for-all-modes)
  - [Advanced Mode - complete configuration](#advanced-mode---complete-configuration)
  - [Alternate Mode - configuration](#alternate-mode---configuration)
  - [Standard Mode - configuration](#standard-mode---configuration)
  - [Easy View Mode - configuration](#easy-view-mode---configuration)
- [Automatic weather elements](#automatic-weather-elements)

</td>
</tr>
</table>

## Screensaver Modes

The screensaver offers several modes with different layouts:

## 1 Advanced Mode default

<img alt='screensaverAdv' src='./Pictures/screensaver/screensaverAdv.png'>

- **Favorit area** (1 element): main area for important information (usually weather)
- **Left area** (3 elements): left-hand area for detailed information
- **Indicator area** (5 elements): status indicators for a quick overview
- **Bottom area** (6 elements): scrollable list of additional information
- **MR icons** (2 elements): switchable relay icons (mrIcon1 + mrIcon2)

## 2 Alternate Mode

<img alt='screensaverAlt' src='./Pictures/screensaver/screensaverAlt.png'>

- **Favorit area** (1 element): main area for important information
- **Alternate area** (1 element): alternative view for the main area
- **Bottom area** (3 elements): reduced lower information bar
- **MR icons** (2 elements): switchable relay icons

## 3 Standard Mode

<img alt='screensaverStd' src='./Pictures/screensaver/screensaverStd.png'>

- **Favorit area** (1 element): main area for important information
- **Bottom area** (4 elements): extended lower information bar
- **MR icons** (2 elements): switchable relay icons

## 4. Easy View Mode

<img alt='screensaverEsay' src='./Pictures/screensaver/screensaverEasy.png' width='70%'>

- **Bottom area** (3 elements): extra large font for better readability
- **No icons or texts**: simplified presentation without complex elements
- **No MR icons**: reduced functionality for simple operation
- **Update info**: this symbol is shown on all screensavers when an update for the TFT, Berry or adapter is available.

## Areas in Detail

## Swipe Gestures

**Important note**: Swipe gestures do NOT switch between different views; instead they output the detected gesture into a datapoint. This makes it possible to program custom actions for swipe movements.

The swipe feature can be enabled in the advanced options:
```typescript
advancedOptions: {
    screensaverSwipe: true  // Enables swipe gesture detection
}
```

## Icons for the NSPanel

**Available icons**: You can find all icons available for the NSPanel in the [NSPanel Icon Cheatsheet](https://docs.nspanel.pky.eu/icon-cheatsheet.html).

### Icon parameters:
- `ScreensaverEntityIconOn`: icon for the "on" state
- `ScreensaverEntityIconOff`: icon for the "off" state

### Icon examples:
```typescript
// Light icons
ScreensaverEntityIconOn: 'lightbulb-on',
ScreensaverEntityIconOff: 'lightbulb-off',

// Weather icons
ScreensaverEntityIconOn: 'weather-sunny',
ScreensaverEntityIconOff: 'weather-cloudy',

// Device icons
ScreensaverEntityIconOn: 'power-plug',
ScreensaverEntityIconOff: 'power-plug-off',

// Status icons
ScreensaverEntityIconOn: 'check-circle',
ScreensaverEntityIconOff: 'alert-circle-outline'
```

**Important note**: Use only icons from the [NSPanel Icon Cheatsheet](https://docs.nspanel.pky.eu/icon-cheatsheet.html). Other Material Design icons may not be displayed correctly.

## Configuration Types

There are three different ways to configure screensaver elements:

### 1. Script configuration (`type: 'script'`)

The most flexible method for manually configuring individual elements:

```typescript
{
    type: 'script',
    ScreensaverEntity: 'alias.0.Temperatur.ACTUAL',
    ScreensaverEntityIconOn: 'thermometer',
    ScreensaverEntityIconOff: 'thermometer-off',
    ScreensaverEntityText: 'Indoor temperature',
    ScreensaverEntityUnitText: '°C',
    ScreensaverEntityFactor: 1,
    ScreensaverEntityDecimalPlaces: 1,
    ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22}
}
```

### 2. Template configuration (`type: 'template'`)

Pre-built templates for common use cases:

```typescript
{
    type: 'template',
    template: 'text.pirate-weather.favorit',
    dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
    modeScr: 'favorit'
}
```

### 3. Native configuration (`type: 'native'`)

Direct configuration of the internal adapter structure (for experts):

```typescript
{
    type: 'native',
    native: {
        // Complex internal structure
        role: 'text',
        data: { /* ... */ }
    }
}
```

## Configuration Areas

### favoritScreensaverEntity

**Purpose**: Main area of the screensaver, typically for weather information

**Type**: Array with one element

**Examples**:

```typescript
favoritScreensaverEntity: [
    {
        type: 'template',
        template: 'text.pirate-weather.favorit',
        dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
        modeScr: 'favorit'
    }
]
```

**Available weather templates**:
- `text.pirate-weather.favorit`
- `text.openweathermap.favorit`
- `text.accuweather.favorit`
- `text.brightsky.favorit`

**For custom elements use the script configuration**

```typescript
favoritScreensaverEntity: [
    // Temperature
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Wetterstation.temperatur',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 1,
        ScreensaverEntityIconOn: 'thermometer',
        ScreensaverEntityText: 'Temperature',
        ScreensaverEntityUnitText: '°C',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22}
    }
]
```

### bottomScreensaverEntity

**Purpose**: Lower area for additional information; it scrolls through the configured elements

**Type**: Array with multiple elements

**Examples**:

```typescript
bottomScreensaverEntity: [
    // Wind speed
    {
        type: 'script',
        ScreensaverEntity: 'pirate-weather.0.weather.currently.windSpeed',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 1,
        ScreensaverEntityIconOn: 'weather-windy',
        ScreensaverEntityText: 'Wind',
        ScreensaverEntityUnitText: 'm/s',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 120}
    },
    // Humidity
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Wetter.Luftfeuchtigkeit',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 0,
        ScreensaverEntityIconOn: 'water-percent',
        ScreensaverEntityText: 'Humidity',
        ScreensaverEntityUnitText: '%',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 100, val_best: 60}
    },
    // Template for sunrise/sunset
    {
        type: 'template',
        template: 'text.pirate-weather.sunriseset',
        dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.+/`,
        modeScr: 'bottom'
    }
]
```

### indicatorScreensaverEntity

**Purpose**: Small indicator icons for a quick status overview (Advanced screensaver only)

**Type**: Array with up to 5 elements (may contain `null` or `undefined`)

**Examples**:

```typescript
indicatorScreensaverEntity: [
    // Window status
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Status.offene_Fenster',
        ScreensaverEntityIconOn: 'window-open-variant',
        ScreensaverEntityIconOff: 'window-closed-variant',
        ScreensaverEntityText: 'Windows',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
    },
    // Light status
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Status.Licht_an',
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: 'lightbulb-outline',
        ScreensaverEntityText: 'Light',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
    },
    // Placeholder for the third indicator
    null,
    // Door lock status
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Sicherheit.Türschloss',
        ScreensaverEntityIconOn: 'lock',
        ScreensaverEntityIconOff: 'lock-open',
        ScreensaverEntityText: 'Door lock',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 1}
    }
]
```

### leftScreensaverEntity

**Purpose**: Left-hand area for detailed information (Advanced screensaver only)

**Type**: Array with up to 3 elements

**Examples**:

```typescript
leftScreensaverEntity: [
    // Temperature
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Sensoren.Innentemperatur',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 1,
        ScreensaverEntityIconOn: 'thermometer',
        ScreensaverEntityText: 'Temperature',
        ScreensaverEntityUnitText: '°C',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22}
    },
    // Energy consumption
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Energie.Tagesverbrauch',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 1,
        ScreensaverEntityIconOn: 'flash',
        ScreensaverEntityText: 'Energy',
        ScreensaverEntityUnitText: 'kWh',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 50}
    },
    // Waste collection with date format
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Abfall.naechster_Termin',
        ScreensaverEntityDateFormat: {year: 'numeric', month: '2-digit', day: '2-digit'},
        ScreensaverEntityIconOn: 'trash-can',
        ScreensaverEntityText: 'Waste',
        ScreensaverEntityIconColor: 'alias.0.Abfall.farbe'
    }
]
```

### alternateScreensaverEntity

**Purpose**: Alternative view for the main area (Advanced screensaver only)

**Type**: Array (toggles between the favorit and the alternate view)

### mrIcon1ScreensaverEntity and mrIcon2ScreensaverEntity

**Purpose**: Icons for the two relay outputs of the NSPanel

**Type**: Object (not an array)

### Example configuration for MR icons:

```typescript
// Direct relay link
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',
    ScreensaverEntityIconOn: 'lightbulb-on',
    ScreensaverEntityIconOff: 'lightbulb-off',
    ScreensaverEntityText: 'Light',
    ScreensaverEntityIconColor: {
        val_min: 0,
        val_max: 1,
        val_best: 1
    }
}

// External device control with status value
mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'hue.0.Wohnzimmer.Lampe.on',
    ScreensaverEntityValue: 'hue.0.Wohnzimmer.Lampe.level',
    ScreensaverEntityIconOn: 'ceiling-light',
    ScreensaverEntityIconOff: 'ceiling-light-outline',
    ScreensaverEntityText: 'Dimmer',
    ScreensaverEntityUnitText: '%'
}
```


The MR icons are **display elements only** in the upper / lower area of the screensaver, used to visualize status information. They are available in all screensaver modes except Easy View. To hide an icon, set the respective entity to `null`.
```typescript
mrIcon1ScreensaverEntity: null
```


### Properties of the MR icons:
- **Status display only**: the icons only show the current state and have **no control function**
- **Hardware buttons**: the physical buttons below the display can be configured independently, [more info here](en-ScriptConfig#hardware-button-configuration)
- **Visual status**: color changes based on the on/off state of the linked states
- **Flexible binding**: can be linked to any ioBroker state (not only NSPanel relays)
- **Configurable icons**: different symbols depending on the use case (light, socket, etc.)
- **Extended display**: an additional value can be shown for status displays
- **Detach function**: the icons can be configured completely independently of the hardware buttons

### How it works:
- **Display**: the icons only show the current status of the linked states
- **Hardware buttons**: the buttons below the display are separate controls
- **Configuration**: the icon configuration only affects the visual presentation, not the button function

### MR icon areas:
- **mrIcon1ScreensaverEntity**: left symbol
- **mrIcon2ScreensaverEntity**: right symbol
---


## Screensaver Notifications

### Overview
There are several ways to show a heading with text on the screensaver.
The following two variants are **equivalent** and overwrite each other.
In addition, they also overwrite the new option described further below.

[Example image below](#example-display)

---

#### Variant 1: Via datapoints

**Datapoints used:**

```ts
.cmd.screenSaver.headingNotification
.cmd.screenSaver.textNotification
.cmd.screenSaver.activateNotification
```

- `heading`: heading
- `text`: text below it
- `activate`: turn the display on or off

The notification stays visible for as long as `activate = true`.

---

#### Variant 2: Via the script/JavaScript adapter

Notifications can also be sent to the screensaver via `sendTo()`.
Note: the parameter **panel** was renamed to **topic** (breaking change).

```ts
sendTo('nspanel-lovelace-ui.0', 'screensaverNotify', {
    topic: 'nspanel/ns_panel6', // previously 'panel'
    heading: 'Test heading',
    text: 'Test text Test text Test text Test text',
    enabled: false,
})
```

- `enabled` corresponds to `activate`:
  - `true` → display active
  - `false` → display deactivated

---

### New option: multiple notifications with conditions

A new option lets you define multiple notifications and show them depending on conditions.
For this, an array is created in the script:

```ts
notifyScreensaverEntity: [],
```

##### Example

```ts
notifyScreensaverEntity: [
    { // visible when the state is true (overwrites the previous one)
        type: 'script',
        Enabled: '0_userdata.0.NotityficationTest',
        Headline: 'test2',
        Text: 'text2',
        Priority: 2
    },
    { // visible when the number > 9 (overwrites all previous ones)
        type: 'script',
        HeadlinePrefix: 'High number: ',
        Headline: '0_userdata.0.number',
        TextPrefix: 'The datapoint contains the number ',
        Text: '0_userdata.0.number',
        TextSuffix: '. You cannot count that far. Ask your mom!',
        Enabled: '0_userdata.0.number',
        VisibleCondition: 'val > 9',
        Priority: 1
    }
],
```

---

### Notes

- All properties such as **Headline** and **Text** can be datapoints.
- **Enabled**: a datapoint that is checked for `true` or `false`. Multiple datapoints can also be provided as an array `[string, string, ...]`.
- **VisibleCondition**: allows direct conditions without having to create an extra alias.
- **HeadlineIcon**: adds an icon in front of the headline text and can be provided as a datapoint.
- **Priority**: lower number = higher priority (a higher-priority notification overrides lower-priority ones).

---

#### Example display

This is what it looks like when the number is **10**:

 <img alt='screensaverNotify' src='./Pictures/screensaver/screensaverNotify.png' width='50%'>

 ---


## Script Configuration Parameters

### Basic parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `ScreensaverEntity` | string \| null | Main data source for the element | `'alias.0.Temperatur.ACTUAL'` |
| `ScreensaverEntityText` | string | Display text for the element | `'Indoor temperature'` |
| `ScreensaverEntityUnitText` | string | Unit for the value | `'°C'`, `'%'`, `'kWh'` |

### Icon parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `ScreensaverEntityIconOn` | string | Icon for the "on" state | `'thermometer'` |
| `ScreensaverEntityIconOff` | string \| null | Icon for the "off" state | `'thermometer-off'` |
| `ScreensaverEntityIconSelect` | Array | Icons based on the value | `[{value: 0, icon: 'weather-sunny'}, {value: 50, icon: 'weather-cloudy'}]` |

### Color parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `ScreensaverEntityOnColor` | RGB object/constant | Color for the "on" state | `On` or `{red: 255, green: 0, blue: 0}` |
| `ScreensaverEntityOffColor` | RGB object/constant | Color for the "off" state | `Off` or `{red: 0, green: 0, blue: 255}` |
| `ScreensaverEntityIconColor` | IconScale \| string | Dynamic color scale or state ID | `{val_min: 0, val_max: 100}` |

### Value parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `ScreensaverEntityFactor` | number | Multiplication factor for values | `1`, `0.1`, `1000` |
| `ScreensaverEntityDecimalPlaces` | number | Number of decimal places | `0`, `1`, `2` |
| `ScreensaverEntityValue` | string | Additional value (for mrIcon) | `'alias.0.Helligkeit'` |
| `ScreensaverEntityValueUnit` | string | Unit for the additional value | `'%'` |
| `ScreensaverEntityValueDecimalPlace` | number | Decimal places for the additional value | `0` |

> The `ScreensaverEntityValue*` parameters only exist for MR icons (`mrIcon1/2ScreensaverEntity`), not for regular script elements.

### Formatting parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `ScreensaverEntityDateFormat` | DateFormat | Format for date display | `{year: 'numeric', month: '2-digit', day: '2-digit'}` |

### Advanced parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `ScreensaverEntityEnabled` | boolean \| string | Activation condition | `true`, `'alias.0.Active'` |
| `ScreensaverEntityVisibleCondition` | string | JavaScript condition for visibility | `'val > 0'` |

## Color Scale Configuration

### Simple color scale

```typescript
ScreensaverEntityIconColor: {
    val_min: 0,      // minimum value
    val_max: 100,    // maximum value
    val_best: 50     // optimum value (gets a special color)
}
```

### Extended color scale

```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    val_best: 22,
    color_best: {red: 0, green: 255, blue: 0},  // color for the optimum value
    mode: 'cie',                                // 'mixed', 'hue', or 'cie'
    log10: 'min'                                // logarithmic scaling
}
```

## Using Color Constants

Instead of defining colors as JSON objects, you can use the color constants available in the script. This makes the configuration clearer and less error-prone:

```typescript
// Example with color constants (recommended)
ScreensaverEntityOnColor: On,      // predefined yellow color
ScreensaverEntityOffColor: Off,    // predefined orange color

// Instead of JSON definitions
ScreensaverEntityOnColor: {red: 253, green: 216, blue: 53},  // manual
ScreensaverEntityOffColor: {red: 253, green: 128, blue: 0}   // manual
```

#### Available color constants:

**Standard UI colors:**
- `On`, `Off` - recommended on/off colors (yellow/orange)
- `HMIOff`, `HMIOn` - original entity colors (blue)
- `HMIDark` - background color (dark gray)

**Basic colors:**
- `Red`, `Green`, `Blue`, `Yellow`, `White`, `Black`, `Gray`
- `Cyan`, `Magenta`, `DarkBlue`

**Status colors:**
- `MSRed`, `MSYellow`, `MSGreen` - Material Design colors
- `BatteryFull`, `BatteryEmpty` - for battery level displays

**Menu colors:**
- `Menu`, `MenuLowInd`, `MenuHighInd`

**Color scale (gradient):**
- `colorScale0` to `colorScale10` - gradient from green through yellow to red

**Weather colors:**
- `swClearNight`, `swCloudy`, `swFog`, `swRainy`, `swSunny`, etc.

#### Examples with color constants:

```typescript
// MR icon with color constants
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',
    ScreensaverEntityIconOn: 'lightbulb',
    ScreensaverEntityOnColor: On,      // yellow for the on state
    ScreensaverEntityOffColor: HMIOff  // blue for the off state
}

// Temperature display with gradient colors
{
    type: 'script',
    ScreensaverEntity: 'sensor.temperature',
    ScreensaverEntityIconColor: {
        val_min: 0,
        val_max: 35,
        color_best: MSGreen  // Material Design green as the optimum color
    }
}
```

The color constants are defined at the end of the example script and are available in all configuration areas.

## colorScale - advanced icon scaling

The color scale enables an advanced configuration of icon coloring with various modes and options.

> **Important:** For screensaver elements this scale object is passed in the **`ScreensaverEntityIconColor`** field (a standalone `colorScale` field only exists on PageItems, not in the screensaver). The examples below therefore use `ScreensaverEntityIconColor: { … }` directly.

#### Available modes:

**1. Standard mode (no mode parameter)**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    val_best: 50    // optional: optimum value for special highlighting
}
```
- Linear color interpolation between the minimum and maximum value
- Automatic color selection based on the value range

**2. TriGrad mode (three-color gradient)**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    mode: 'triGrad'
}
```
- **Standard gradient**: creates a continuous transition through three colors: green → yellow → red
- **Use case**: ideal for warning levels, battery states, or power displays
- **Default behavior**:
  - Low values (0-33%): green (good)
  - Mid values (34-66%): yellow (medium/warning)
  - High values (67-100%): red (critical/bad)

**Special case with val_best:**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    val_best: 50,
    mode: 'triGrad'
}
```
- **Special behavior**: when val_best is used the gradient becomes: **red → yellow → green → yellow → red**
- **Meaning**:
  - val_min (0) and val_max (100): red (critical at both extremes)
  - val_best (50): green (optimal in the middle range)
  - In between: yellow (transition ranges)

**3. TriGradAnchor mode (three-color gradient with anchor point)**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    val_best: 50,
    mode: 'triGradAnchor'
}
```
- **Gradient**: three-stage transition with a defined optimum point
- **Use case**: for values where a middle range is optimal (e.g. humidity)
- **Behavior**:
  - At val_best (50): green (optimal)
  - Toward the extremes: through yellow to red (suboptimal to critical)
  - Symmetric gradient around the anchor point

**4. QuadriGrad mode (four-color gradient)**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    mode: 'quadriGrad'
}
```
- **Gradient**: four-stage transition (red → yellow → green → blue), ignores custom colors
- **Use case**: value ranges with four gradations, without a fixed optimum point
- **Note**: without `val_best` it is distributed linearly across the four colors

**5. QuadriGradAnchor mode (four-color gradient with anchor point)**
```typescript
ScreensaverEntityIconColor: {
    val_min: -10,
    val_max: 40,
    val_best: 22,
    mode: 'quadriGradAnchor'
}
```
- **Gradient**: four-stage transition for an even more precise display
- **Use case**: especially suitable for temperature displays or complex measured values
- **Important**: with `quadriGradAnchor`, **val_best is the anchor point** (optimum); without `val_best` it behaves like `quadriGrad`
- **Behavior**:
  - At val_best (22°C): green (optimal)
  - Slight deviation: light green/yellow (acceptable)
  - Larger deviation: orange (warning)
  - Extreme values: red (critically cold/hot)

**6. Mixed mode**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    mode: 'mixed'
}
```
- Combines different color algorithms
- Advanced color mixing for complex displays

**7. Hue mode**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 360,
    mode: 'hue'
}
```
- Hue-based scaling across the color wheel
- Ideal for color value displays (Hue lamps)

**8. CIE mode**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 1,
    mode: 'cie'
}
```
- CIE color space-based scaling
- Scientifically accurate color representation

#### Logarithmic scaling:

```typescript
ScreensaverEntityIconColor: {
    val_min: 1,
    val_max: 1000,
    log10: 'max'    // only 'min' or 'max'
}
```

**Options for log10:**
- `'min'`: logarithmic scaling toward the minimum
- `'max'`: logarithmic scaling toward the maximum

> Only the values `'min'` and `'max'` exist. Other values (e.g. `'center'`) are discarded by the adapter.

#### Examples for various use cases:

**Temperature display:**
```typescript
ScreensaverEntityIconColor: {
    val_min: -10,
    val_max: 35,
    val_best: 22,
    mode: 'quadriGradAnchor'
}
```

**Wind speed:**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 120,
    mode: 'triGrad',
    log10: 'max'
}
```

**Battery level:**
```typescript
ScreensaverEntityIconColor: {
    val_min: 10,
    val_max: 100,
    val_best: 80,
    mode: 'triGradAnchor'
}
```

#### Combination examples for complex scenarios:

**Humidity with optimum range (40-60%):**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    val_best: 50,        // optimum at 50%
    mode: 'quadriGradAnchor'
}
```

**Power consumption with logarithmic scaling:**
```typescript
ScreensaverEntityIconColor: {
    val_min: 1,
    val_max: 5000,
    mode: 'triGrad',
    log10: 'max'        // logarithmic scaling for large value ranges
}
```

**Complex temperature range with precise gradation:**
```typescript
ScreensaverEntityIconColor: {
    val_min: -20,
    val_max: 45,
    val_best: 21,        // ideal room temperature
    mode: 'quadriGradAnchor',
    color_best: {red: 0, green: 255, blue: 0}  // explicit green coloring at the optimum
}
```

**Internet speed with hue gradient:**
```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,        // 100 Mbit/s
    mode: 'hue',         // color-wheel gradient from red to green
    log10: 'min'         // emphasize low speeds
}
```

### Color modes

- **mixed**: linear interpolation between two RGB colors (default)
- **hue**: hue-based scaling
- **cie**: CIE color table for more natural transitions

## Template Configuration

## Weather Templates

Weather templates are specialized template configurations that **require the `dpInit` parameter**. This parameter defines the regex pattern for automatically detecting the corresponding weather states.

### Important note
**All weather templates only work with a correct `dpInit` configuration!** The `dpInit` parameter must be adapted to the respective weather adapter and its state structure.

#### Pirate Weather

**Available templates:**
- `text.pirate-weather.favorit` - main weather display (for the favorit area)
- `text.pirate-weather.sunriseset` - sunrise/sunset
- `text.pirate-weather.windspeed` - wind speed
- `text.pirate-weather.windgust` - gusts
- `text.pirate-weather.winddirection` - wind direction
- `text.pirate-weather.uvindex` - UV index
- `text.pirate-weather.bot2values` - forecast days
- `text.pirate-weather.hourlyweather` - hourly forecast

**Example configurations:**

```typescript
// Favorit weather for the main display
favoritScreensaverEntity: [
    {
        type: 'template',
        template: 'text.pirate-weather.favorit',
        dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
        modeScr: 'favorit'
    }
]

// Weather forecast for the bottom area (day 1-3)
bottomScreensaverEntity: [
    {
        type: 'template',
        template: 'text.pirate-weather.bot2values',
        dpInit: `/^pirate-weather\\.0.+?\\.daily\\.01/`,  // day 1
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.pirate-weather.bot2values',
        dpInit: `/^pirate-weather\\.0.+?\\.daily\\.02/`,  // day 2
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.pirate-weather.sunriseset',
        dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.+/`,
        modeScr: 'bottom'
    }
]
```

#### OpenWeatherMap

**Available templates:**
- `text.openweathermap.favorit`
- `text.openweathermap.sunriseset`
- `text.openweathermap.windspeed`
- `text.openweathermap.windgust`
- `text.openweathermap.winddirection`
- `text.openweathermap.bot2values`

**Example configuration:**

```typescript
// OpenWeatherMap main weather
favoritScreensaverEntity: [
    {
        type: 'template',
        template: 'text.openweathermap.favorit',
        dpInit: `/^openweathermap\\.0.+/`,
        modeScr: 'favorit'
    }
]

// Daily forecasts
bottomScreensaverEntity: [
    {
        type: 'template',
        template: 'text.openweathermap.bot2values',
        dpInit: `/^openweathermap\\.0.+?day0/`,  // today
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.openweathermap.windspeed',
        dpInit: `/^openweathermap\\.0./`,
        modeScr: 'bottom'
    }
]
```

#### AccuWeather
- `text.accuweather.favorit`
- `text.accuweather.sunriseset`
- `text.accuweather.windspeed`
- `text.accuweather.windgust`
- `text.accuweather.winddirection`
- `text.accuweather.uvindex`
- `text.accuweather.bot2values`

#### BrightSky
- `text.brightsky.favorit`
- `text.brightsky.sunriseset`
- `text.brightsky.windspeed`
- `text.brightsky.windgust`
- `text.brightsky.winddirection`
- `text.brightsky.solar`
- `text.brightsky.bot2values`

**BrightSky example:**

```typescript
bottomScreensaverEntity: [
    {
        type: 'template',
        template: 'text.brightsky.sunriseset',
        dpInit: `/^brightsky\\.0\\.daily\\.00.+/`,
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.brightsky.solar',
        dpInit: `/^brightsky\\.0\\.current./`,
        modeScr: 'bottom'
    }
]
```

### Automatic weather element integration

Instead of configuring all weather templates manually, you can use the automatic integration:

```typescript
const config: ScriptConfig.Config = {
    weatherEntity: 'pirate-weather.0.',  // base weather adapter
    weatherAddDefaultItems: true,        // add all standard elements

    // OR selective activation:
    weatherAddDefaultItems: {
        sunriseSet: true,
        forecastDay1: true,
        forecastDay2: true,
        forecastDay3: false,
        windSpeed: true,
        windGust: true,
        windDirection: true,
        uvIndex: true,
        solar: true  // BrightSky only
    }
}
```

> `weatherAddDefaultItems` additionally supports `forecastDay4`, `forecastDay5` and `forecastDay6` (if the adapter provides those days).

## Additional Text Templates

In addition to the weather templates, there are further pre-built templates for various device categories:

### General templates

**`text.clock`**
- **Use**: current time
- **States**: internal time source (`///time`)
- **Role**: `text`
- **CommonType**: `string`
- **Regexp**: internal time variable

**`text.temperature`**
- **Use**: temperature display with color scale
- **States**: searches for states with role `value.temperature`
- **Role**: `value.temperature`
- **CommonType**: `number`
- **Regexp**: none specific (uses role-based search)
- **Features**: automatic color scale based on temperature values

**`text.battery`**
- **Use**: battery level with dynamic icons
- **States**: battery status and charge state
- **Role**: `value.battery`, `value.power` (for charge status)
- **CommonType**: `number`, `boolean`
- **Features**:
  - automatic icon selection based on the fill level
  - distinction between charging/discharging
  - percentage display with unit

**`text.battery.low`**
- **Use**: battery warning at a low level
- **Role**: `indicator.lowbat`
- **CommonType**: `boolean`
- **Features**: red warning at a low battery level

### Windows & Doors templates

**`text.window.isOpen`**
- **Use**: window status (open/closed)
- **Role**: `sensor.window`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: green icon for open windows, red for closed windows

**`text.window.isClose`**
- **Use**: inverted window status
- **Role**: `sensor.window`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: inverted logic of `text.window.isOpen`

**`text.door.isOpen`**
- **Use**: door status
- **Role**: `sensor.door`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: door-specific icons

**`text.gate.isOpen`**
- **Use**: gate/garage status
- **Role**: `sensor.door`, `switch.gate`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: garage/gate-specific icons

**`text.lock`**
- **Use**: lock status
- **Role**: `switch.lock`, `state`
- **CommonType**: `boolean`
- **Features**: open (cyan) / closed (green) color coding

### Motion & Security templates

**`text.motion`**
- **Use**: motion sensor
- **Role**: `sensor.motion`
- **CommonType**: `boolean`
- **Features**: activation display with color change

**`text.warning`**
- **Use**: warning messages with different levels
- **Role**: `value.warning`, `weather.title.short`, `weather.title`
- **CommonType**: `number`, `string`
- **Regexp**: `/\.LEVEL$/`, `/\.TITLE$/`, `/\.INFO$/`
- **Features**: 4-level color scale for warning levels

### Network & Connectivity templates

**`text.isOnline`**
- **Use**: internet/device connection
- **Role**: `indicator.reachable`
- **CommonType**: `boolean`
- **Features**: online (green) / offline (red) display

**`text.wlan`**
- **Use**: WLAN connection status
- **Features**: static WLAN icon with label

### Special templates

**`text.info`**
- **Use**: universal information display with custom values
- **Role**: `state`, `value.rgb`, `text`
- **Regexp**: `/\.ACTUAL$/`, `/\.USERICON$/`, `/\.COLORDEC$/`, `/\.BUTTONTEXT$/`
- **Features**:
  - custom icons via the `USERICON` state
  - custom colors via the `COLORDEC` state
  - dynamic texts via various text states

**`text.shutter.navigation`**
- **Use**: roller shutter/blind control
- **Role**: `blind`
- **Regexp**: `/\.ACTUAL$/`, `/\.TILT_ACTUAL$/`
- **Features**:
  - position and tilt display
  - different icons for states (open, closed, moving)

#### Adapter-specific templates

**`text.battery.bydhvs`** (BYD HVS battery storage)
- **Adapter**: `bydhvs`
- **Role**: `value.battery`, `value.power`
- **Regexp**: `/\.State\.SOC$/`, `/\.State\.Power$/`
- **Features**: BYD-specific battery display with charge/discharge status

**Wind templates (various adapters)**
- `text.sainlogic.windarrow` - SainLogic weather station with wind arrow
- `text.custom.windarrow` - universal wind arrow
- `text.hmip.windcombo` - HomeMatic IP wind display

**Sunrise/sunset templates**
- `text.openweathermap.sunriseset` - OpenWeatherMap sun times
- `text.accuweather.sunriseset` - AccuWeather sun times

**Timetable templates**
- `text.fahrplan.departure` - Deutsche Bahn departures
- `text.alias.fahrplan.departure` - alias version for timetables

### Template usage

The templates can be applied to specific adapter instances using the `dpInit` parameter:

```typescript
{
    type: 'template',
    template: 'text.battery',
    dpInit: `/^zigbee\\.0\\..*\\.battery$/`,  // all Zigbee battery states
    modeScr: 'indicator'
}
```

## Automatic Weather Elements

For automatically adding standard weather elements:

```typescript
const config: ScriptConfig.Config = {
    // ...other configuration

    weatherAddDefaultItems: true,  // all standard weather elements

    // OR selective activation:
    weatherAddDefaultItems: {
        sunriseSet: true,
        forecastDay1: true,
        forecastDay2: true,
        forecastDay3: false,
        windSpeed: true,
        windGust: true,
        windDirection: true,
        uvIndex: true,
        solar: true  // BrightSky only
    }
};
```

## Complete Working Examples for All Modes

## Advanced Mode - complete configuration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Living room NSPanel',
    panelTopic: 'nspanel-wohnzimmer',

    // Weather integration
    weatherEntity: 'pirate-weather.0.',

    // Favorit area (main weather)
    favoritScreensaverEntity: [{
        type: 'template',
        template: 'text.pirate-weather.favorit',
        dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
        modeScr: 'favorit'
    }],

    // Left area (3 elements)
    leftScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wohnzimmer.Temperatur',
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Indoor',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityIconColor: {val_min: 18, val_max: 26, val_best: 22}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wohnzimmer.Luftfeuchtigkeit',
            ScreensaverEntityIconOn: 'water-percent',
            ScreensaverEntityText: 'Humidity',
            ScreensaverEntityUnitText: '%',
            ScreensaverEntityIconColor: {val_min: 30, val_max: 70, val_best: 45}
        },
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'left'
        }
    ],

    // Indicator area (5 elements)
    indicatorScreensaverEntity: [
        {
            type: 'template',
            template: 'text.window.isOpen',
            dpInit: `/^alias\\.0\\.Wohnzimmer\\.Fenster.*$/`,
            modeScr: 'indicator'
        },
        {
            type: 'template',
            template: 'text.motion',
            dpInit: `/^zigbee\\.0\\..*\\.occupancy$/`,
            modeScr: 'indicator'
        },
        {
            type: 'template',
            template: 'text.battery.low',
            dpInit: `/^zigbee\\.0\\..*\\.battery_low$/`,
            modeScr: 'indicator'
        },
        {
            type: 'template',
            template: 'text.isOnline',
            dpInit: `/^alias\\.0\\.System\\.Internet$/`,
            modeScr: 'indicator'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Sicherheit.Status',
            ScreensaverEntityIconOn: 'shield-check',
            ScreensaverEntityIconOff: 'shield-alert',
            ScreensaverEntityText: 'Alarm'
        }
    ],

    // Bottom area (6 elements)
    bottomScreensaverEntity: [
        {
            type: 'template',
            template: 'text.pirate-weather.bot2values',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.01.*/`,
            modeScr: 'bottom'
        },
        {
            type: 'template',
            template: 'text.pirate-weather.bot2values',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.02.*/`,
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Energie.Verbrauch.Aktuell',
            ScreensaverEntityIconOn: 'flash',
            ScreensaverEntityText: 'Consumption',
            ScreensaverEntityUnitText: 'W',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 5000, mode: 'triGrad'}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Heizung.Vorlauftemperatur',
            ScreensaverEntityIconOn: 'radiator',
            ScreensaverEntityText: 'Heating',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityIconColor: {val_min: 20, val_max: 80, val_best: 45}
        },
        {
            type: 'template',
            template: 'text.pirate-weather.windspeed',
            dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\.windSpeed$/`,
            modeScr: 'bottom'
        },
        {
            type: 'template',
            template: 'text.pirate-weather.sunriseset',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.*/`,
            modeScr: 'bottom'
        }
    ],

    // MR icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'Relay.1',
        ScreensaverEntityIconOn: 'lightbulb-on',
        ScreensaverEntityIconOff: 'lightbulb-off',
        ScreensaverEntityText: 'Light',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 1}
    },

    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Wohnzimmer.Steckdose',
        ScreensaverEntityIconOn: 'power-plug',
        ScreensaverEntityIconOff: 'power-plug-off',
        ScreensaverEntityText: 'Socket'
    }
};
```

## Alternate Mode - configuration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Kitchen NSPanel',
    panelTopic: 'nspanel-kueche',

    // Favorit area
    favoritScreensaverEntity: [{
        type: 'template',
        template: 'text.openweathermap.favorit',
        dpInit: `/^openweathermap\\.0\\.forecast\\.current\\./`,
        modeScr: 'favorit'
    }],

    // Alternate area (alternative view)
    alternateScreensaverEntity: [{
        type: 'script',
        ScreensaverEntity: 'alias.0.Kueche.CO2',
        ScreensaverEntityIconOn: 'molecule-co2',
        ScreensaverEntityText: 'CO₂',
        ScreensaverEntityUnitText: 'ppm',
        ScreensaverEntityIconColor: {
            val_min: 400,
            val_max: 1200,
            val_best: 600,
            mode: 'triGradAnchor'
        }
    }],

    // Bottom area (only 3 elements)
    bottomScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Kueche.Temperatur',
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Kitchen',
            ScreensaverEntityUnitText: '°C'
        },
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Kueche.Helligkeit',
            ScreensaverEntityIconOn: 'brightness-6',
            ScreensaverEntityText: 'Light',
            ScreensaverEntityUnitText: 'lux'
        }
    ],

    // MR icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Kueche.Unterschrankbeleuchtung',
        ScreensaverEntityIconOn: 'led-strip',
        ScreensaverEntityIconOff: 'led-strip-variant-off',
        ScreensaverEntityText: 'LED'
    },

    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Kueche.Dunstabzug',
        ScreensaverEntityIconOn: 'fan',
        ScreensaverEntityIconOff: 'fan-off',
        ScreensaverEntityText: 'Fan'
    }
};
```

## Standard Mode - configuration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Hallway NSPanel',
    panelTopic: 'nspanel-flur',

    // Favorit area
    favoritScreensaverEntity: [{
        type: 'template',
        template: 'text.brightsky.favorit',
        dpInit: `/^brightsky\\.0\\.weather\\.current\\./`,
        modeScr: 'favorit'
    }],

    // Bottom area (4 elements)
    bottomScreensaverEntity: [
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Flur.Temperatur',
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Hallway',
            ScreensaverEntityUnitText: '°C'
        },
        {
            type: 'template',
            template: 'text.motion',
            dpInit: `/^zigbee\\.0\\.Flur_Bewegung\\.occupancy$/`,
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.System.Speicherplatz',
            ScreensaverEntityIconOn: 'harddisk',
            ScreensaverEntityText: 'Storage',
            ScreensaverEntityUnitText: '%',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 90, mode: 'triGrad'}
        }
    ],

    // MR icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Flur.Deckenlampe',
        ScreensaverEntityIconOn: 'ceiling-light',
        ScreensaverEntityIconOff: 'ceiling-light-outline',
        ScreensaverEntityText: 'Ceiling'
    },

    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Flur.Nachtlicht',
        ScreensaverEntityIconOn: 'lightbulb-night',
        ScreensaverEntityIconOff: 'lightbulb-night-outline',
        ScreensaverEntityText: 'Night'
    }
};
```

## Easy View Mode - configuration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Senior room NSPanel',
    panelTopic: 'nspanel-senior',

    // Easy View only has a bottom area with extra large font (3 elements)
    bottomScreensaverEntity: [
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wohnzimmer.Temperatur',
            ScreensaverEntityText: 'Temperature',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityDecimalPlaces: 0  // whole numbers for better readability
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wettervorhersage.Heute.Max',
            ScreensaverEntityText: 'Outdoor max',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityDecimalPlaces: 0
        }
    ]

    // NO mrIcon configuration - Easy View does not support MR icons
    // NO complex icons or color scaling - focus on simplicity
};
```

## Advanced Options

### Screensaver behavior

In the configuration script, additional options can be controlled via `advancedOptions`:

```typescript
const config: ScriptConfig.Config = {
    // ...other configuration

    advancedOptions: {
        screensaverSwipe: true,                // swipe between screensaver views
        screensaverIndicatorButtons: true,     // enable indicator buttons
        extraConfigLogging: false              // extended logging
    }
};
```

### Relay integration

The mrIcon elements can be linked directly to the NSPanel relays:

```typescript
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',  // direct reference to relay 1
    // ...further configuration
},

mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.2',  // direct reference to relay 2
    // ...further configuration
}
```

## Complete Example

Here is a complete screensaver configuration with all areas:

```typescript
const config: ScriptConfig.Config = {
    // ...other base configuration

    // Weather integration
    weatherEntity: 'pirate-weather.0.',
    weatherAddDefaultItems: {
        sunriseSet: true,
        forecastDay1: true,
        forecastDay2: true,
        windSpeed: true,
        windGust: true
    },

    // Main area - weather display
    favoritScreensaverEntity: [
        {
            type: 'template',
            template: 'text.pirate-weather.favorit',
            dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
            modeScr: 'favorit'
        }
    ],

    // Lower area - various information
    bottomScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wetter.Wind',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'weather-windy',
            ScreensaverEntityText: 'Wind',
            ScreensaverEntityUnitText: 'km/h',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 120}
        },
        {
            type: 'template',
            template: 'text.pirate-weather.sunriseset',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.+/`,
            modeScr: 'bottom'
        }
    ],

    // Indicator icons
    indicatorScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Status.Fenster_offen',
            ScreensaverEntityIconOn: 'window-open-variant',
            ScreensaverEntityIconOff: 'window-closed-variant',
            ScreensaverEntityText: 'Windows',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Status.Licht_an',
            ScreensaverEntityIconOn: 'lightbulb',
            ScreensaverEntityIconOff: 'lightbulb-outline',
            ScreensaverEntityText: 'Light',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
        },
        null,  // placeholder
        null,  // placeholder
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Sicherheit.Alarm',
            ScreensaverEntityIconOn: 'shield-check',
            ScreensaverEntityIconOff: 'shield-alert',
            ScreensaverEntityText: 'Alarm',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 0}
        }
    ],

    // Left area
    leftScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Sensoren.Temperatur_innen',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Temperature',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Energie.Verbrauch_heute',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'flash',
            ScreensaverEntityText: 'Energy',
            ScreensaverEntityUnitText: 'kWh',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 50}
        }
    ],

    // Alternative view (empty in this example)
    alternateScreensaverEntity: [],

    // Relay icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'Relay.1',
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: 'lightbulb-outline',
        ScreensaverEntityOnColor: Yellow,  // yellow for switched-on light
        ScreensaverEntityOffColor: HMIOff  // standard off color (blue)
    },

    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Licht.Flur',
        ScreensaverEntityIconOn: 'ceiling-light',
        ScreensaverEntityIconOff: 'ceiling-light-outline',
        ScreensaverEntityValue: 'alias.0.Licht.Flur.Helligkeit',
        ScreensaverEntityValueUnit: '%',
        ScreensaverEntityValueDecimalPlace: 0,
        ScreensaverEntityOnColor: On,    // recommended on color
        ScreensaverEntityOffColor: Gray  // gray color for the off state
    },

    // Advanced options
    advancedOptions: {
        screensaverSwipe: true,
        screensaverIndicatorButtons: true
    }
};
```

## Tips and Best Practices

### Performance optimization

1. **Limit the number of elements**: too many screensaver elements can affect performance
2. **Use templates**: templates are optimized and offer better performance than script configurations
3. **Avoid frequent updates**: choose data sources that are not updated too often

### Usability

1. **Consistent icons**: use similar icons for related functions
2. **Clear labels**: use short, understandable texts
3. **Sensible color coding**: use colors for quick status recognition

### Error handling

1. **Null values**: use `null` for optional elements instead of leaving them out
2. **Valid state IDs**: verify that all referenced states exist
3. **Correct types**: pay attention to the correct data types for parameters

### Maintenance

1. **Documentation**: comment complex configurations
2. **Modularity**: define recurring colors and values as constants
3. **Versioning**: document changes to the screensaver configuration

## Troubleshooting

### Common problems

**Problem**: a screensaver element is not displayed
- Check whether the state exists and provides valid data
- Verify the syntax of the configuration
- Check the adapter logs for error messages

**Problem**: colors are not displayed correctly
- Make sure RGB values are between 0 and 255
- Check the color scale parameters
- Verify that the referenced state provides numeric values

**Problem**: templates do not work
- Check whether the weather adapter is running and provides data
- Verify the instance number in the dpInit pattern
- Make sure the template is available for your weather adapter

**Problem**: icons are not displayed
- Use only valid Material Design icons
- Check the spelling of the icon names
- Consult the icon documentation for available icons

This documentation provides a complete overview of all screensaver configuration options. For further help, visit the [ioBroker forum](https://forum.iobroker.net/topic/80055/alphatest-nspanel-lovelace-ui) or the [GitHub Wiki](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki).
