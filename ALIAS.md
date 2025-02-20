| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| motion | ACTUAL | boolean| sensor.motion  | X |  |  | 
| cie | CIE | number| level.color.cie  | X |  |  | 
| " | DIMMER | boolean| level.dimmer  | X |  |  | 
| " | ON | boolean| switch.light  | X |  |  | 
| " | ON_ACTUAL | boolean| state.light  | X |  |  | 
| " | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| dimmer | SET | number| level.dimmer  | X |  |  | 
| " | ACTUAL | number| value.dimmer  | X |  |  | 
| " | ON_SET | boolean| switch.light  | X |  |  | 
| " | ON_ACTUAL | boolean| switch.light  | X |  |  | 
| timeTable | ACTUAL | string| state  | X |  |  | 
| " | VEHICLE | string| state  | X |  |  | 
| " | DIRECTION | string| state  | X |  |  | 
| " | DELAY | boolean| state  | X |  |  | 
| ct | DIMMER | number| level.dimmer  | X |  |  | 
| " | ON | boolean| switch.light  | X |  |  | 
| " | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| window | ACTUAL | boolean| sensor.window  | X |  |  | 
| humidity | ACTUAL | number| value.humidity  | X |  |  | 
| hue | DIMMER | number| level.dimmer  | X |  |  | 
| " | ON | boolean| switch.light  | X |  |  | 
| " | ON_ACTUAL | boolean| state.light  | X |  |  | 
| " | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| " | HUE | number| level.color.hue  |  |  |  | 
| info | ACTUAL | string| state  | X |  |  | 
| blind | ACTUAL | number| value.blind  | X |  |  | 
| " | SET | number| level.blind  | X | X |  | 
| " | CLOSE | boolean| button.close.blind  | X |  |  | 
| " | OPEN | boolean| button.open.blind  | X |  |  | 
| " | STOP | boolean| button.stop.blind  | X |  |  | 
| " | TILT_ACTUAL | number| value.tilt  |  |  |  | 
| " | TILT_SET | number| level.tilt  |  |  |  | 
| " | TILT_CLOSE | boolean| button.close.tilt  |  |  |  | 
| " | TILT_OPEN | boolean| button.open.tilt  |  |  |  | 
| " | TILT_STOP | boolean| button.stop.tilt  |  |  |  | 
| airCondition | ACTUAL | number| value.temperature  | X |  |  | 
| " | SET | number| level.temperature  | X | X |  | 
| " | SET2 | number| level.temperature  | X | X |  | 
| " | AUTO | boolean| state  |  |  |  | 
| " | COOL | boolean| state  |  |  |  | 
| " | BOOST | boolean| switch.boost  |  |  |  | 
| " | ERROR | boolean| indicator.error  |  |  |  | 
| " | HEAT | boolean| state  |  |  |  | 
| " | HUMINITY | number| value.humidity  |  |  |  | 
| " | MAINTAIN | boolean| indicator.maintainance  |  |  |  | 
| " | MODE | number| level.mode.aircondition  | X |  |  | 
| " | OFF | boolean| state  | X |  |  | 
| " | POWER | boolean| state  |  |  |  | 
| " | SPEED | number| level.mode.fan  |  |  |  | 
| " | SWING | boolean| switch.mode.swing  |  |  |  | 
| " | UNREACH | boolean| indicator.maintainance  |  |  |  | 
| socket | ACTUAL | boolean| switch  |  |  |  | 
| " | SET | boolean| switch  | X |  |  | 
| light | ACTUAL | boolean| switch.light  |  |  |  | 
| " | SET | boolean| switch.light  | X |  |  | 
| volume | ACTUAL | number| value.volume  | X |  |  | 
| " | SET | number| level.volume  | X |  |  | 
| " | MUTE | boolean| media.mute  | X |  |  | 
| rgb | RED | number| level.color.red  | X |  |  | 
| " | GREEN | number| level.color.green  | X |  |  | 
| " | BLUE | number| level.color.blue  | X |  |  | 
| " | ON_ACTUAL | boolean| state.light  | X |  |  | 
| " | ON | boolean| switch.light  | X |  |  | 
| " | DIMMER | number| level.dimmer  | X |  |  | 
| " | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| " | WHITE | number| level.color.white  |  |  |  | 
| rbgSingle | RGB | number| level.color.rgb  | X |  |  | 
| " | ON | boolean| switch.light  | X |  |  | 
| " | DIMMER | number| level.dimmer  | X |  |  | 
| " | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| " | ON_ACTUAL | boolean| state.light  | X |  |  | 
| slider | SET | number| level  | X |  |  | 
| " | ACTUAL | number| value  | X |  |  | 
| button | SET | boolean| button  | X |  |  | 
| buttonSensor | ACTUAL | boolean| state  | X |  |  | 
| temperature | ACTUAL | number| value.temperature  | X |  |  | 
| " | SECOND | number| value.humidity  |  |  |  | 
| value.temperature | ACTUAL | number| value.temperature  | X |  |  | 
| " | SECOND | number| value.humidity  |  |  |  | 
| thermostat | ACTUAL | number| value.temperature  | X |  |  | 
| " | SET | number| level.temperature  | X |  |  | 
| " | MODE | number| level.mode.thermostat  | X |  |  | 
| " | BOOST | boolean| state  |  |  |  | 
| " | AUTOMATIC | boolean| state  | X |  |  | 
| " | ERROR | boolean| indicator.error  |  |  |  | 
| " | LOWBAT | boolean| indicator.maintainance  |  |  |  | 
| " | MANUAL | boolean| state  |  |  |  | 
| " | UNREACH | boolean| indicator.maintainance  |  |  |  | 
| " | HUMINITY | number| value.humidity  |  |  |  | 
| " | MAINTAIN | boolean| indicator.maintainance  |  |  |  | 
| " | PARTY | boolean| state  |  |  |  | 
| " | POWER | boolean| state  |  |  |  | 
| " | VACATION | boolean| state  |  |  |  | 
| " | WINDOWOPEN | boolean| state  |  |  |  | 
| " | WORKING | boolean| state  |  |  |  | 
| level.timer | ACTUAL | number| timestamp  | X |  |  | 
| " | SET | string| state  | X |  |  | 
| gate | ACTUAL | boolean| switch.gate  | X |  |  | 
| " | SET | boolean| switch.gate  | X |  |  | 
| " | STOP | boolean| button.stop  | X |  |  | 
| door | ACTUAL | boolean| sensor.door  | X |  |  | 
| level.mode.fan | ACTUAL | boolean| state  | X |  |  | 
| " | MODE | number| state  | X |  |  | 
| " | SET | boolean| state  | X |  |  | 
| " | SPEED | number| state  | X |  |  | 
| lock | ACTUAL | boolean| state  | X |  |  | 
| " | OPEN | boolean| button  | X |  |  | 
| " | SET | boolean| switch.lock  | X |  |  | 
| warning | INFO | string| weather.title  | X |  |  | 
| " | LEVEL | number| value.warning  | X |  |  | 
| " | TITLE | string| weather.title.short  | X |  |  | 
| weatherforecast | ICON | string| weather.icon.forecast  | X |  |  | 
| " | TEMP | number| value.temperature  | X |  |  | 
| WIFI | ACTUAL | string| state  | X |  |  | 
