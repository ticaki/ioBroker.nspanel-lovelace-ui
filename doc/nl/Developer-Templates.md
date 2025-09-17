<!-- TODO: Translate from German to Nederlands -->

# Content

[Screensaver](#screensaver)  
* [Screensaver - Changing Sunset/Sunrise in one Icon](#screensaver---changing-sunsetsunrise-in-one-icon)  
* [Screensaver - accuweather.0. Bottom Icons](#screensaver---accuweather0-forecast)  
* [Screensaver - daswetter.0. Bottom Icons](#screensaver---daswetter0-forecast)  
  
[Entities](#entities)  
* [BYD HVS Solarspeicher](#bydhvs)
* [deConz - Ikea Fyrtur](#deconz---ikea-fyrtur)  
* [deConz - Battery Load (%)](#deconz---battery-load)
* [deconz - window isopen](#deconz--window-isopen)
* [general - button iconLetSize](#general---button-iconleftsize)
* [general - button iconRightSize](#general---button-iconrightsize)
* [generic - Shutter](#generic---shutter)
* [shelly - rgbw2](#shelly---rgbw2)
* [shelly - shutter - 2PM](#shelly---shutter---2pm)
* [zigbee2mqtt - battery Load](#zigbee2mqtt---battery-load)
* [zigbee2mqtt - temperature](#zigbee2mqtt---temperature)

[cardEntities](#cardentities)
* [Waste Calendar](#waste-calendar)
  
[cardSchedules](#cardschedules)  
* [Fahrplan Adapter - Template](#fahrplan-adapter---template)  

[cardMedia](#cardmedia) 
* [spotify-premium.0. - Template](#spotify-premium0---template)

[cardThermo](#cardthermo) 
* [hmip.0. - Template](#hmip.0.---Template)

[Popup](#popup)  
* [popupTimer - Countdown](#popuptimer---countdown)  


---

# Screensaver
## Screensaver - Changing Sunset/Sunrise in one Icon

```typeScript
        // Bottom Entity - Sonnenaufgang - Sonnenuntergang im Wechsel
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
        // Bottom 1 - accuWeather.0. Forecast Day 1
        {
            template: 'text.accuweather.bot2values',
            dpInit: '/^accuweather\\.0.+?d1$/',
            modeScr: 'bottom',
        },

        // Bottom 2 - accuWeather.0. Forecast Day 2
        {
            template: 'text.accuweather.bot2values',
            dpInit: '/^accuweather\\.0.+?d2$/',
            modeScr: 'bottom',
        },

        // Bottom 3 - accuWeather.0. Forecast Day 3
        {
            template: 'text.accuweather.bot2values',
            dpInit: '/^accuweather\\.0.+?d3$/',
            modeScr: 'bottom',
        },

        // Bottom 4 - accuWeather.0. Forecast Day 4
        {
            template: 'text.accuweather.bot2values',
            dpInit: '/^accuweather\\.0.+?d4$/',
            modeScr: 'bottom',
        },

        // Bottom 5 - accuWeather.0. Forecast Day 5
        {
            template: 'text.accuweather.bot2values',
            dpInit: '/^accuweather\\.0.+?d5$/',
            modeScr: 'bottom',
        },
```
[back](#content)  
  
## Screensaver - daswetter.0. Forecast

Ersetzen, wenn Template steht
```typeScript
        // Bottom 6 - daswetter.0. Forecast Day 6
        {
            role: '2values',
            dpInit: '',
            type: 'text',
            modeScr: 'bottom',
            data: {
                entity1: {
                    value: { type: 'triggered', dp: 'daswetter.0.NextDays.Location_1.Day_6.Minimale_Temperatur_value' },
                    decimal: {
                        type: 'const',
                        constVal: 0,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '° ',
                    },
                },
                entity2: {
                    value: { type: 'triggered', dp: 'daswetter.0.NextDays.Location_1.Day_6.Maximale_Temperatur_value' },
                    decimal: {
                        type: 'const',
                        constVal: 0,
                    },
                    factor: undefined,
                    unit: {
                        type: 'const',
                        constVal: '°',
                    },
                },
                icon: {
                    true: {
                        value: {
                            type: 'triggered',
                            dp: 'daswetter.0.NextDays.Location_1.Day_6.Wetter_Symbol_id',
                            read: `{
                                        switch (val) {
		                                    case 1:         // Sonnig
                                                return 'weather-sunny';  // sunny
 
			                                case 2:         // Teils bewölkt
                                            case 3:         // Bewölkt
                                                return 'weather-partly-cloudy';  // partlycloudy
				
                                            case 4:         // Bedeckt
                                                return 'weather-cloudy';  // cloudy
				
                                            case 5:        // Teils bewölkt mit leichtem Regen
                                            case 6:        // Bewölkt mit leichtem Regen
                                            case 8:        // Teils bewölkt mit mäßigem Regen
                                            case 9:        // Bewölkt mit mäßigem Regen
                                                return 'weather-partly-rainy';  // partly-rainy
				
                                            case 7:        // Bedeckt mit leichtem Regen
                                                return 'weather-rainy';  // rainy
				
		                                    case 10:        // Bedeckt mit mäßigem Regen
                                                return 'weather-pouring';  // pouring
				
                                            case 11:        // Teils bewölkt mit starken Regenschauern
                                            case 12:        // Bewölkt mit stürmischen Regenschauern
                                                return 'weather-partly-lightning';  // partlylightning
				
                                            case 13:        // Bedeckt mit stürmischen Regenschauern
                                                return 'weather-lightning';  // lightning
				
                                            case 14:        // Teils bewölkt mit stürmischen Regenschauern und Hagel
			                                case 15:        // Bewölkt mit stürmischen Regenschauern und Hagel
			                                case 16:        // Bedeckt mit stürmischen Regenschauern und Hagel
                                                return 'weather-hail';  // Hail
 
                                            case 17:        // Teils bewölkt mit Schnee
                                            case 18:        // Bewölkt mit Schnee
                                                return 'weather-partly-snowy';  // partlysnowy

                                            case 19:        // Bedeckt mit Schneeschauern
                                                return 'weather-snowy';  // snowy
 
                                            case 20:        // Teils bewölkt mit Schneeregen
                                            case 21:        // Bewölkt mit Schneeregen
                                                return 'weather-partly-snowy-rainy';
 
                                            case 22:        // Bedeckt mit Schneeregen
                                                return 'weather-snowy-rainy';  // snowy-rainy
 
                                            default:
                                                return 'alert-circle-outline';
                                        }
                                    }`,
                        },
                        color: {
                            type: 'triggered',
                            dp: 'daswetter.0.NextDays.Location_1.Day_6.Wetter_Symbol_id',
                            read: `{
                                        switch (val) {
                                            case 1:         // Sonnig
                                                return Color.swSunny;
 
                                            case 2:         // Teils bewölkt
                                            case 3:         // Bewölkt
                                                return Color.swPartlycloudy;
 
                                            case 4:         // Bedeckt
                                                return Color.swCloudy;
 
                                            case 5:        // Teils bewölkt mit leichtem Regen
                                            case 6:        // Bewölkt mit leichtem Regen
                                            case 8:        // Teils bewölkt mit mäßigem Regen
                                            case 9:        // Bewölkt mit mäßigem Regen
                                                return Color.swRainy;
 
                                            case 7:        // Bedeckt mit leichtem Regen
                                                return Color.swRainy;

                                            case 10:        // Bedeckt mit mäßigem Regen
                                                return Color.swPouring;
 
                                            case 11:        // Teils bewölkt mit starken Regenschauern
                                            case 12:        // Bewölkt mit stürmischen Regenschauern
                                                return Color.swLightningRainy;
 
                                            case 13:        // Bedeckt mit stürmischen Regenschauern
                                                return Color.swLightning;
 
                                            case 14:        // Teils bewölkt mit stürmischen Regenschauern und Hagel
			                                case 15:        // Bewölkt mit stürmischen Regenschauern und Hagel
			                                case 16:        // Bedeckt mit stürmischen Regenschauern und Hagel
                                                return Color.swHail;
 
                                            case 17:        // Teils bewölkt mit Schnee
                                            case 18:        // Bewölkt mit Schnee
                                                return Color.swSnowy;
 
                                            case 19:        // Bedeckt mit Schneeschauern
                                                return Color.swSnowy;
 
                                            case 20:        // Teils bewölkt mit Schneeregen
                                            case 21:        // Bewölkt mit Schneeregen
                                                return Color.swSnowyRainy;  // snowy-rainy
 
                                            case 22:        // Bedeckt mit Schneeregen
                                                return Color.swSnowyRainy;
 
                                            default:
                                                return Color.White;
                                        }
                                    }`,
                        },
                    },
                    false: {
                        value: undefined,
                        color: undefined
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                text: {
                    true: {
                        type: 'triggered',
                        dp: 'daswetter.0.NextDays.Location_1.Day_6.Tag_value',                        
                        read:  `{
                                    return (val).substring(0,2);
                                }`,
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
        // Ikea Fyrtur Rollo - Template
        {
            role: '',
            type: 'shutter',
            dpInit: 'deconz.0.Lights.37',
            data: {
                icon: {
                    true: {
                        value: { 
                            type: 'const', 
                            constVal: 'window-shutter-open' 
                        },
                        color: { 
                            type: 'const', 
                            constVal: Color.Green 
                        },
                    },
                    false: {
                        value: { 
                            type: 'const', 
                            constVal: 'window-shutter' 
                        },
                        color: { 
                            type: 'const', 
                            constVal: Color.HMIOff 
                        },
                    },
                    scale: undefined,
                    maxBri: undefined,
                    minBri: undefined,
                },
                // 1. slider
                entity1: {
                    // button
                    value: { 
                        mode: 'auto', 
                        role: 'level.value', 
                        type: 'triggered', 
                        dp: '.lift' 
                    },
                    decimal: undefined,
                    factor: undefined,
                    unit: undefined,
                    minScale: { 
                        type: 'const', 
                        constVal: 1 
                    },
                    maxScale: { 
                        type: 'const', 
                        constVal: 78 
                    },
                },
                // 2. slider
                entity2: undefined,
                text: {
                    true: {
                        type: 'const',
                        constVal: 'Büro',
                    },
                    false: undefined,
                },
                headline: {
                    type: 'const',
                    constVal: 'IKEA Fyrtur',
                },
                text1: {
                    true: {
                        type: 'const',
                        constVal: 'Rollo Position',
                    },
                    false: undefined,
                },
                text2: undefined,
                up: { 
                    mode: 'auto', 
                    role: 'level.value', 
                    type: 'triggered', 
                    dp: '.lift' , 
                    write: 'return 1'
                },
                down: { 
                    mode: 'auto', 
                    role: 'level.value', 
                    type: 'triggered', 
                    dp: '.lift' , 
                    write: 'return 78'
                },
                stop: {
                    type: 'state',
                    dp: '.stop',
                    mode: 'auto',
                    role: ['button'],
                },
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
            // Optional
            data: {
                icon: {
                    true: {
                        color: {
                            type: 'const',
                            constVal: Color.MSGreen,
                        },
                    },
                    false: {
                        color: {
                            type: 'const',
                            constVal: Color.MSRed,
                        },
                    },
                },
            },
        },
```
[back](#content)  
  
## deConz- window isOpen

```typeScript
        // deConz - Fenstersensor - sensor.open
        {
            type: 'text',
            dpInit: 'deconz.0.Sensors.3',
            template: 'text.window.isOpen',
            data: {
                icon: {
                    true: {
                        color: { type: 'const', constVal: Color.MSRed },
                    },
                    false: {
                        color: { type: 'const', constVal: Color.MSGreen },
                    },
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
  
## general - window isOpen

## general - window isClose

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

## Waste Calendar. 

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
    
## Fahrplan Adapter - Template  
  
### Anzeigetafel Abfahrten  
Mit dem Template können bis zu 10 Abfahrten auf einer Page angezeigt werden. Die Abfahrten lassen sich seitenweise durchblättern.  

```typeScript
const pageDeparture: pages.PageBaseConfig = {
    card: 'cardEntities',
    dpInit: 'fahrplan.0.DepartureTimetable0',
    uniqueID: 'Abfahrt ',
    template: 'entities.departure-timetable',
};
```
[back](#content)  
  
### Routen

```typescript
const pageDeparture: pages.PageBaseConfig = {
    card: 'cardEntities',
    dpInit: 'fahrplan.0.0',
    uniqueID: 'Abfahrt ',
    template: 'entities.departure-routes',
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
Um das Templates zu nutzen, muss in den Objekten vom HmIP Adapter unter `devices` dem Device der Raum zugewiesen werden. Das Template unterstützt nur ein Device, es muss auch beachtet werden, ob Wandthermostat oder Ventil genutzt wird. 
Unter `groups` muss das Device gesucht werden, welches alle States enhält. Diesem ist der selbe Raum zuzuweisen.  
Es reicht die Zweisung auf oberster Ebene durchzuführen (Device).

### Wandthermostat

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
  
### Ventil

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
                    true: {
                        value: {type: 'const', constVal: 'timer'},
                        color: {type: 'const', constVal: Color.MSRed},
                    },
                    false: {
                        value: undefined,
                        color: {type: 'const', constVal: Color.MSGreen},
                    },
                },
                entity1: {
                    value: {
                        type: 'const',
                        constVal: true,
                    },
                },
                headline: {type: 'const', constVal: 'Timer'},
                setValue1: {type: 'state', dp: '0_userdata.0.example_state'},
            },
        },
```
[back](#content)  
  