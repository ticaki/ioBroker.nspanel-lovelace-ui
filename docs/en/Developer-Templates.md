# Developer-Templates

> Collection of battle-tested template snippets for the configuration script. The full list of available templates lives in the code under `src/lib/templates/` (`card.ts`, `text.ts`, `light.ts`, `shutter.ts`, `button.ts`, `script.ts`). For **brightsky**, **openweathermap** and **pirate-weather** there are templates analogous to the `accuweather` examples below — naming scheme e.g. `text.brightsky.bot2values`, `text.openweathermap.sunriseset`, `text.pirate-weather.windspeed`.

# Content

[Screensaver](#screensaver)
* [Screensaver - Changing Sunset/Sunrise in one Icon](#screensaver---changing-sunsetsunrise-in-one-icon)
* [Screensaver - accuweather.0. Bottom Icons](#screensaver---accuweather0-forecast)
* [Screensaver - daswetter.0. Bottom Icons](#screensaver---daswetter0-forecast)

[Entities](#entities)
* [BYD HVS battery storage](#bydhvs)
* [deConz — Ikea Fyrtur](#deconz---ikea-fyrtur)
* [deConz — Battery Load (%)](#deconz---battery-load)
* [deconz — window isopen](#deconz--window-isopen)
* [general — button iconLeftSize](#general---button-iconleftsize)
* [general — button iconRightSize](#general---button-iconrightsize)
* [generic — Shutter](#generic---shutter)
* [shelly — rgbw2](#shelly---rgbw2)
* [shelly — shutter — 2PM](#shelly---shutter---2pm)
* [zigbee2mqtt — battery Load](#zigbee2mqtt---battery-load)
* [zigbee2mqtt — temperature](#zigbee2mqtt---temperature)

[cardEntities](#cardentities)
* [Waste Calendar](#waste-calendar)

[cardSchedules](#cardschedules)
* [Fahrplan adapter — Template](#fahrplan-adapter---template)

[cardMedia](#cardmedia)
* [spotify-premium.0. — Template](#spotify-premium0---template)

[cardThermo](#cardthermo)
* [hmip.0. — Template](#hmip0---template)

[Popup](#popup)
* [popupTimer — Countdown](#popuptimer---countdown)


---

# Screensaver
## Screensaver - Changing Sunset/Sunrise in one Icon

```typeScript
        // Bottom entity — Sunrise / sunset alternating
        {
            template: 'text.accuweather.sunriseset',
            dpInit: '/^accuweather\.0.Daily.+/',
            modeScr: 'bottom',
            data: {
                icon: {
                    true: {
                        value: undefined,
                        color: {
                            type: 'const',
                            constVal: Color.MSYellow,
                        },
                    },
                    false: {
                        value: undefined,
                        color: {
                            type: 'const',
                            constVal: Color.MSYellow,
                        },
                    },
                },
                text: {
                    true: {
                        value: {
                            type: 'const',
                            constVal: 'sunriseToken',
                        },
                        prefix: undefined,
                        suffix: undefined,
                    },
                    false: {
                        value: {
                            type: 'const',
                            constVal: 'sunsetToken',
                        },
                        prefix: undefined,
                        suffix: undefined,
                    },
                },
            },
        },
```
[back](#content)

## Screensaver - accuweather.0. Forecast

```typeScript
        // Bottom 1 — accuWeather.0. forecast day 1
        { template: 'text.accuweather.bot2values', dpInit: '/^accuweather\\.0.+?d1$/', modeScr: 'bottom' },
        // Bottom 2 — accuWeather.0. forecast day 2
        { template: 'text.accuweather.bot2values', dpInit: '/^accuweather\\.0.+?d2$/', modeScr: 'bottom' },
        // Bottom 3 — accuWeather.0. forecast day 3
        { template: 'text.accuweather.bot2values', dpInit: '/^accuweather\\.0.+?d3$/', modeScr: 'bottom' },
        // Bottom 4 — accuWeather.0. forecast day 4
        { template: 'text.accuweather.bot2values', dpInit: '/^accuweather\\.0.+?d4$/', modeScr: 'bottom' },
        // Bottom 5 — accuWeather.0. forecast day 5
        { template: 'text.accuweather.bot2values', dpInit: '/^accuweather\\.0.+?d5$/', modeScr: 'bottom' },
```
[back](#content)

## Screensaver - daswetter.0. Forecast

Replace once a proper template exists.
```typeScript
        // Bottom 6 — daswetter.0. forecast day 6
        {
            role: '2values',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity1: {
                    value: { type: 'triggered', dp: 'daswetter.0.NextDays.Location_1.Day_6.Minimale_Temperatur_value' },
                    decimal: { type: 'const', constVal: 0 },
                    factor: undefined,
                    unit: { type: 'const', constVal: '° ' },
                },
                entity2: {
                    value: { type: 'triggered', dp: 'daswetter.0.NextDays.Location_1.Day_6.Maximale_Temperatur_value' },
                    decimal: { type: 'const', constVal: 0 },
                    factor: undefined,
                    unit: { type: 'const', constVal: '°' },
                },
                icon: {
                    true: {
                        value: {
                            type: 'triggered',
                            dp: 'daswetter.0.NextDays.Location_1.Day_6.Wetter_Symbol_id',
                            read: `{
                                switch (val) {
                                    case 1:  return 'weather-sunny';
                                    case 2:
                                    case 3:  return 'weather-partly-cloudy';
                                    case 4:  return 'weather-cloudy';
                                    case 5:
                                    case 6:
                                    case 8:
                                    case 9:  return 'weather-partly-rainy';
                                    case 7:  return 'weather-rainy';
                                    case 10: return 'weather-pouring';
                                    case 11:
                                    case 12: return 'weather-partly-lightning';
                                    case 13: return 'weather-lightning';
                                    case 14:
                                    case 15:
                                    case 16: return 'weather-hail';
                                    case 17:
                                    case 18: return 'weather-partly-snowy';
                                    case 19: return 'weather-snowy';
                                    case 20:
                                    case 21: return 'weather-partly-snowy-rainy';
                                    case 22: return 'weather-snowy-rainy';
                                    default: return 'alert-circle-outline';
                                }
                            }`,
                        },
                        color: {
                            type: 'triggered',
                            dp: 'daswetter.0.NextDays.Location_1.Day_6.Wetter_Symbol_id',
                            read: `{
                                switch (val) {
                                    case 1:  return Color.swSunny;
                                    case 2:
                                    case 3:  return Color.swPartlycloudy;
                                    case 4:  return Color.swCloudy;
                                    case 5:
                                    case 6:
                                    case 7:
                                    case 8:
                                    case 9:  return Color.swRainy;
                                    case 10: return Color.swPouring;
                                    case 11:
                                    case 12: return Color.swLightningRainy;
                                    case 13: return Color.swLightning;
                                    case 14:
                                    case 15:
                                    case 16: return Color.swHail;
                                    case 17:
                                    case 18:
                                    case 19: return Color.swSnowy;
                                    case 20:
                                    case 21:
                                    case 22: return Color.swSnowyRainy;
                                    default: return Color.White;
                                }
                            }`,
                        },
                    },
                    false: { value: undefined, color: undefined },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'triggered',
                        dp: 'daswetter.0.NextDays.Location_1.Day_6.Tag_value',
                        read: `{ return (val).substring(0,2); }`,
                    },
                    false: undefined,
                },
            },
        },
```
[back](#content)

---

# Entities

## bydhvs

```typescript
        {
            dpInit: 'bydhvs',
            template: 'text.battery.bydhvs',
        },
```
[back](#content)

## deConz - IKEA Fyrtur

```typescript
        // Ikea Fyrtur shutter — template
        {
            role: '',
            type: 'shutter',
            dpInit: 'deconz.0.Lights.37',
            data: {
                icon: {
                    true:  { value: { type: 'const', constVal: 'window-shutter-open' }, color: { type: 'const', constVal: Color.Green } },
                    false: { value: { type: 'const', constVal: 'window-shutter'      }, color: { type: 'const', constVal: Color.HMIOff } },
                    scale: undefined, maxBri: undefined, minBri: undefined,
                },
                entity1: {
                    value: { mode: 'auto', role: 'level.value', type: 'triggered', dp: '.lift' },
                    decimal: undefined, factor: undefined, unit: undefined,
                    minScale: { type: 'const', constVal: 1 },
                    maxScale: { type: 'const', constVal: 78 },
                },
                entity2: undefined,
                text:    { true: { type: 'const', constVal: 'Office' }, false: undefined },
                headline:{ type: 'const', constVal: 'IKEA Fyrtur' },
                text1:   { true: { type: 'const', constVal: 'Shutter position' }, false: undefined },
                text2:   undefined,
                up:   { mode: 'auto', role: 'level.value', type: 'triggered', dp: '.lift', write: 'return 1' },
                down: { mode: 'auto', role: 'level.value', type: 'triggered', dp: '.lift', write: 'return 78' },
                stop: { type: 'state', dp: '.stop', mode: 'auto', role: ['button'] },
            },
        },
```
[back](#content)

## deConz - Battery Load
```typeScript
        {
            type: 'text',
            dpInit: 'deconz.0.Sensors.3',
            template: 'text.battery',
            data: {
                icon: {
                    true:  { color: { type: 'const', constVal: Color.MSGreen } },
                    false: { color: { type: 'const', constVal: Color.MSRed   } },
                },
            },
        },
```
[back](#content)

## deConz - window isOpen

```typeScript
        // deConz — window sensor
        {
            type: 'text',
            dpInit: 'deconz.0.Sensors.3',
            template: 'text.window.isOpen',
            data: {
                icon: {
                    true:  { color: { type: 'const', constVal: Color.MSRed   } },
                    false: { color: { type: 'const', constVal: Color.MSGreen } },
                },
            },
        },
```
[back](#content)

## general - button iconLeftSize
```typescript
        {
            role: 'text.list',
            type: 'button',
            template: 'button.iconLeftSize',
            dpInit: '',
        },
```
[back](#content)

## general - button iconRightSize
```typescript
        {
            role: 'text.list',
            type: 'button',
            template: 'button.iconRightSize',
            dpInit: '',
        },
```
[back](#content)

## generic - Shutter

```typescript
        {
            template: 'generic.shutter',
            dpInit: '0_userdata.0.shutter_test',
            data: {
                icon: {
                    true: {
                        value: { type: 'const', constVal: 'window-open' },
                        color: { type: 'const', constVal: 'aqua', role: 'level.color.name' },
                    },
                    false: null,
                },
            },
        },
```
[back](#content)

## shelly - rgbw2

```typescript
        {
            role: 'rgbSingle',
            type: 'light',
            dpInit: 'shelly.0.SHCB-1#3494546EE3C9#1',
            template: 'light.shelly.rgbw2',
        },
```
[back](#content)

## shelly - shutter - 2PM
```typescript
        {
            type: 'shutter',
            dpInit: '0_userdata.0.shelly.0.SHSW-25#C45BBE5FC53F#1',
            template: 'shutter.shelly.2PM',
        },
```
[back](#content)

## zigbee2mqtt - battery Load
```typescript
        {
            type: 'text',
            dpInit: 'zigbee2mqtt.0.0x00158d00041fdbcb',
            template: 'text.temperature',
        },
```
[back](#content)

## zigbee2mqtt - temperature
```typescript
        {
            type: 'text',
            dpInit: 'zigbee2mqtt.0.0x00158d00041fdbcb',
            template: 'text.temperature',
        },
```
[back](#content)

---

# cardEntities

## Waste Calendar

```typeScript
const pageAbfall: pages.PageBaseConfig = {
    card: 'cardEntities',
    dpInit: '0_userdata.0.Abfallkalender',
    uniqueID: 'abfall1',
    template: 'entities.waste-calendar',
};
```
[back](#content)

---
# cardSchedules

## Fahrplan adapter - Template

### Departure timetable
With this template up to 10 departures can be displayed on a page. The departures can be paged through.

```typeScript
const pageDeparture: pages.PageBaseConfig = {
    card: 'cardEntities',
    dpInit: 'fahrplan.0.DepartureTimetable0',
    uniqueID: 'Abfahrt ',
    template: 'entities.fahrplan.departure-timetable',
};
```
[back](#content)

### Routes

```typescript
const pageDeparture: pages.PageBaseConfig = {
    card: 'cardEntities',
    dpInit: 'fahrplan.0.0',
    uniqueID: 'Abfahrt ',
    template: 'entities.fahrplan.routes',
};
```
[back](#content)

---

# cardMedia

## spotify-premium.0. - Template

```typeScript
const pageMediaSpotifyPremium: pages.PageBaseConfig = {
    template: 'media.spotify-premium',
    dpInit: 'spotify-premium.0',
    alwaysOn: 'always',
    uniqueID: 'media3',
    card: 'cardMedia',
};
```
[back](#content)

---

# cardThermo

## hmip.0. - Template
To use the template, the room must be assigned to the device under `devices` in the HmIP adapter objects. The template only supports a single device, so pick wall thermostat **or** valve as appropriate.
Under `groups` you have to find the device that holds all states. Assign the same room to it.
It is enough to do the assignment at the top device level.

### Wall thermostat

```typeScript
const pageThermoThermostat: pages.PageBaseConfig = {
    card: 'cardThermo',
    template: 'thermo.hmip.wallthermostat',
    alwaysOn: 'always',
    uniqueID: 'thermo1',
    enums: ['enum.rooms.living_room'],
    dpInit: '',
};
```
[back](#content)

### Valve

```typeScript
const pageThermoThermostat: pages.PageBaseConfig = {
    card: 'cardThermo',
    template: 'thermo.hmip.valve',
    alwaysOn: 'always',
    uniqueID: 'thermo',
    enums: ['enum.rooms.office'],
    dpInit: '',
};
```
[back](#content)

---

# Popup
## popupTimer - Countdown

```typeScript
        {
            role: 'timer',
            type: 'timer',
            dpInit: '',
            data: {
                icon: {
                    true:  { value: { type: 'const', constVal: 'timer' }, color: { type: 'const', constVal: Color.MSRed   } },
                    false: { value: undefined,                              color: { type: 'const', constVal: Color.MSGreen } },
                },
                entity1: { value: { type: 'const', constVal: true } },
                headline: { type: 'const', constVal: 'Timer' },
                setValue1: { type: 'state', dp: '0_userdata.0.example_state' },
            },
        },
```
[back](#content)
