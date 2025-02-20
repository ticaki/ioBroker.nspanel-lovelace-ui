| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :--- | :--- | :--- | :--- | --- | --- | :--- |  
| motion | ACTUAL | boolean| sensor.motion  | X |  |  | 
| cie | CIE | number| level.color.cie  | X |  |  | 
| cie | DIMMER | boolean| level.dimmer  | X |  |  | 
| cie | ON | boolean| switch.light  | X |  |  | 
| cie | ON_ACTUAL | boolean| state.light  | X |  |  | 
| cie | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| dimmer | SET | number| level.dimmer  | X |  |  | 
| dimmer | ACTUAL | number| value.dimmer  | X |  |  | 
| dimmer | ON_SET | boolean| switch.light  | X |  |  | 
| dimmer | ON_ACTUAL | boolean| switch.light  | X |  |  | 
| timeTable | ACTUAL | string| state  | X |  |  | 
| timeTable | VEHICLE | string| state  | X |  |  | 
| timeTable | DIRECTION | string| state  | X |  |  | 
| timeTable | DELAY | boolean| state  | X |  |  | 
| ct | DIMMER | number| level.dimmer  | X |  |  | 
| ct | ON | boolean| switch.light  | X |  |  | 
| ct | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| window | ACTUAL | boolean| sensor.window  | X |  |  | 
| humidity | ACTUAL | number| value.humidity  | X |  |  | 
| hue | DIMMER | number| level.dimmer  | X |  |  | 
| hue | ON | boolean| switch.light  | X |  |  | 
| hue | ON_ACTUAL | boolean| state.light  | X |  |  | 
| hue | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| hue | HUE | number| level.color.hue  |  |  |  | 
| info | ACTUAL | string| state  | X |  |  | 
| blind | ACTUAL | number| value.blind  | X |  |  | 
| blind | SET | number| level.blind  | X | X |  | 
| blind | CLOSE | boolean| button.close.blind  | X |  |  | 
| blind | OPEN | boolean| button.open.blind  | X |  |  | 
| blind | STOP | boolean| button.stop.blind  | X |  |  | 
| blind | TILT_ACTUAL | number| value.tilt  |  |  |  | 
| blind | TILT_SET | number| level.tilt  |  |  |  | 
| blind | TILT_CLOSE | boolean| button.close.tilt  |  |  |  | 
| blind | TILT_OPEN | boolean| button.open.tilt  |  |  |  | 
| blind | TILT_STOP | boolean| button.stop.tilt  |  |  |  | 
| airCondition | ACTUAL | number| value.temperature  | X |  |  | 
| airCondition | SET | number| level.temperature  | X | X |  | 
| airCondition | SET2 | number| level.temperature  | X | X |  | 
| airCondition | AUTO | boolean| state  |  |  |  | 
| airCondition | COOL | boolean| state  |  |  |  | 
| airCondition | BOOST | boolean| switch.boost  |  |  |  | 
| airCondition | ERROR | boolean| indicator.error  |  |  |  | 
| airCondition | HEAT | boolean| state  |  |  |  | 
| airCondition | HUMINITY | number| value.humidity  |  |  |  | 
| airCondition | MAINTAIN | boolean| indicator.maintainance  |  |  |  | 
| airCondition | MODE | number| level.mode.aircondition  | X |  |  | 
| airCondition | OFF | boolean| state  | X |  |  | 
| airCondition | POWER | boolean| state  |  |  |  | 
| airCondition | SPEED | number| level.mode.fan  |  |  |  | 
| airCondition | SWING | boolean| switch.mode.swing  |  |  |  | 
| airCondition | UNREACH | boolean| indicator.maintainance  |  |  |  | 
| socket | ACTUAL | boolean| switch  |  |  |  | 
| socket | SET | boolean| switch  | X |  |  | 
| light | ACTUAL | boolean| switch.light  |  |  |  | 
| light | SET | boolean| switch.light  | X |  |  | 
| volume | ACTUAL | number| value.volume  | X |  |  | 
| volume | SET | number| level.volume  | X |  |  | 
| volume | MUTE | boolean| media.mute  | X |  |  | 
| rgb | RED | number| level.color.red  | X |  |  | 
| rgb | GREEN | number| level.color.green  | X |  |  | 
| rgb | BLUE | number| level.color.blue  | X |  |  | 
| rgb | ON_ACTUAL | boolean| state.light  | X |  |  | 
| rgb | ON | boolean| switch.light  | X |  |  | 
| rgb | DIMMER | number| level.dimmer  | X |  |  | 
| rgb | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| rgb | WHITE | number| level.color.white  |  |  |  | 
| rbgSingle | RGB | number| level.color.rgb  | X |  |  | 
| rbgSingle | ON | boolean| switch.light  | X |  |  | 
| rbgSingle | DIMMER | number| level.dimmer  | X |  |  | 
| rbgSingle | TEMPERATURE | number| level.color.temperature  | X |  |  | 
| rbgSingle | ON_ACTUAL | boolean| state.light  | X |  |  | 
| slider | SET | number| level  | X |  |  | 
| slider | ACTUAL | number| value  | X |  |  | 
| button | SET | boolean| button  | X |  |  | 
| buttonSensor | ACTUAL | boolean| state  | X |  |  | 
| temperature | ACTUAL | number| value.temperature  | X |  |  | 
| temperature | SECOND | number| value.humidity  |  |  |  | 
| value.temperature | ACTUAL | number| value.temperature  | X |  |  | 
| value.temperature | SECOND | number| value.humidity  |  |  |  | 
| thermostat | ACTUAL | number| value.temperature  | X |  |  | 
| thermostat | SET | number| level.temperature  | X |  |  | 
| thermostat | MODE | number| level.mode.thermostat  | X |  |  | 
| thermostat | BOOST | boolean| state  |  |  |  | 
| thermostat | AUTOMATIC | boolean| state  | X |  |  | 
| thermostat | ERROR | boolean| indicator.error  |  |  |  | 
| thermostat | LOWBAT | boolean| indicator.maintainance  |  |  |  | 
| thermostat | MANUAL | boolean| state  |  |  |  | 
| thermostat | UNREACH | boolean| indicator.maintainance  |  |  |  | 
| thermostat | HUMINITY | number| value.humidity  |  |  |  | 
| thermostat | MAINTAIN | boolean| indicator.maintainance  |  |  |  | 
| thermostat | PARTY | boolean| state  |  |  |  | 
| thermostat | POWER | boolean| state  |  |  |  | 
| thermostat | VACATION | boolean| state  |  |  |  | 
| thermostat | WINDOWOPEN | boolean| state  |  |  |  | 
| thermostat | WORKING | boolean| state  |  |  |  | 
| level.timer | ACTUAL | number| timestamp  | X |  |  | 
| level.timer | SET | string| state  | X |  |  | 
| gate | ACTUAL | boolean| switch.gate  | X |  |  | 
| gate | SET | boolean| switch.gate  | X |  |  | 
| gate | STOP | boolean| button.stop  | X |  |  | 
| door | ACTUAL | boolean| sensor.door  | X |  |  | 
| level.mode.fan | ACTUAL | boolean| state  | X |  |  | 
| level.mode.fan | MODE | number| state  | X |  |  | 
| level.mode.fan | SET | boolean| state  | X |  |  | 
| level.mode.fan | SPEED | number| state  | X |  |  | 
| lock | ACTUAL | boolean| state  | X |  |  | 
| lock | OPEN | boolean| button  | X |  |  | 
| lock | SET | boolean| switch.lock  | X |  |  | 
| warning | INFO | string| weather.title  | X |  |  | 
| warning | LEVEL | number| value.warning  | X |  |  | 
| warning | TITLE | string| weather.title.short  | X |  |  | 
| weatherforecast | ICON | string| weather.icon.forecast  | X |  |  | 
| weatherforecast | TEMP | number| value.temperature  | X |  |  | 
| WIFI | ACTUAL | string| state  | X |  |  | 
