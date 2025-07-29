# Table of contents
* [Remarks](#feature-remarks)
* [motion](#motion)
* [timeTable](#timetable)
* [dimmer](#dimmer)
* [ct](#ct)
* [window](#window)
* [humidity](#humidity)
* [value.humidity](#valuehumidity)
* [hue](#hue)
* [info](#info)
* [blind](#blind)
* [airCondition](#aircondition)
* [socket](#socket)
* [light](#light)
* [volume](#volume)
* [rgb](#rgb)
* [rgbSingle](#rgbsingle)
* [slider](#slider)
* [button](#button)
* [select](#select)
* [temperature](#temperature)
* [value.temperature](#valuetemperature)
* [thermostat](#thermostat)
* [level.timer](#leveltimer)
* [gate](#gate)
* [door](#door)
* [level.mode.fan](#levelmodefan)
* [lock](#lock)
* [warning](#warning)
* [sensor.alarm.flood](#sensoralarmflood)
## Remarks

 -(not fully implemented) Crossed out DPs can be called whatever you want, only use the name if you have questions in issues or in the forum. 
### motion
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **motion** | ~~ACTUAL~~ | boolean| sensor.motion  | X |  |  | 
### timeTable
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **timeTable** | ~~noNeed~~ | string| state  |  |  | Just use the template for this - ask TT-Tom :) | 
### dimmer
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **dimmer** | ~~SET~~ | number| level.dimmer  | X | X |  | 
| **"** | ~~ACTUAL~~ | number| value.dimmer, level.dimmer  |  |  |  | 
| **"** | ~~ON_SET~~ | boolean| switch.light  | X | X |  | 
| **"** | ~~ON_ACTUAL~~ | boolean| sensor.light, switch.light  |  |  |  | 
### ct
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **ct** | ~~DIMMER~~ | number| level.dimmer  | X | X |  | 
| **"** | ~~ON~~ | boolean| switch.light  | X | X |  | 
| **"** | ~~ON_ACTUAL~~ | boolean| sensor.light, switch.light  |  |  |  | 
| **"** | ~~TEMPERATURE~~ | number| level.color.temperature  | X | X |  | 
### window
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **window** | ~~ACTUAL~~ | boolean| sensor.window  | X |  |  | 
| **"** | ~~COLORDEC~~ | number| state  |  |  |  | 
| **"** | ~~BUTTONTEXT~~ | string| state, text  |  |  |  | 
### humidity
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **humidity** | ~~ACTUAL~~ | number| value.humidity  | X |  |  | 
### value.humidity
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **value.humidity** | ~~ACTUAL~~ | number| value.humidity  | X |  |  | 
### hue
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **hue** | ~~DIMMER~~ | number| level.dimmer  | X | X |  | 
| **"** | ~~ON~~ | boolean| switch.light  | X | X |  | 
| **"** | ~~ON_ACTUAL~~ | boolean| sensor.light, switch.light  |  |  |  | 
| **"** | ~~TEMPERATURE~~ | number| level.color.temperature  |  | X |  | 
| **"** | ~~HUE~~ | number| level.color.hue  | X | X |  | 
### info
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **info** | ACTUAL | string, number, boolean, mixed| state  | X |  |  | 
| **"** | COLORDEC | number| value.rgb  |  |  |  | 
| **"** | BUTTONTEXT | string| text  |  |  |  | 
| **"** | USERICON | string| state  |  |  |  | 
### blind
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **blind** | ~~ACTUAL~~ | number| value.blind, level.blind  |  |  |  | 
| **"** | ~~SET~~ | number| level.blind  | X | X |  | 
| **"** | ~~CLOSE~~ | boolean| button.close.blind  | X | X |  | 
| **"** | ~~OPEN~~ | boolean| button.open.blind  | X | X |  | 
| **"** | ~~STOP~~ | boolean| button.stop.blind  | X | X |  | 
| **"** | ~~TILT_ACTUAL~~ | number| level.tilt, value.tilt  |  |  |  | 
| **"** | ~~TILT_SET~~ | number| level.tilt  |  | X |  | 
| **"** | ~~TILT_CLOSE~~ | boolean| button.close.tilt  |  | X |  | 
| **"** | ~~TILT_OPEN~~ | boolean| button.open.tilt  |  | X |  | 
| **"** | ~~TILT_STOP~~ | boolean| button.stop.tilt  |  | X |  | 
### airCondition
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **airCondition** | ~~ACTUAL~~ | number| value.temperature  |  |  |  | 
| **"** | SET | number| level.temperature  | X | X |  | 
| **"** | SET2 | number| level.temperature  |  | X |  | 
| **"** | ~~BOOST~~ | boolean| switch.mode.boost, switch.boost  |  | X |  | 
| **"** | ~~ERROR~~ | boolean| indicator.error  |  |  |  | 
| **"** | ~~HUMIDITY~~ | number| value.humidity  |  |  |  | 
| **"** | ~~MAINTAIN~~ | boolean| indicator.maintenance  |  |  |  | 
| **"** | ~~MODE~~ | number| level.mode.airconditioner  |  | X | 0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more | 
| **"** | ~~POWER~~ | boolean| switch  |  | X | use MODE for on/off | 
| **"** | ~~SPEED~~ | number| level.mode.fan  |  | X |  | 
| **"** | ~~SWING~~ | boolean| switch.mode.swing  |  | X |  | 
| **"** | ~~UNREACH~~ | boolean| indicator.maintenance  |  |  |  | 
### socket
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **socket** | ~~ACTUAL~~ | boolean| sensor.switch  |  |  |  | 
| **"** | ~~SET~~ | boolean| switch  | X | X |  | 
| **"** | ~~COLORDEC~~ | number| state  |  |  |  | 
| **"** | ~~BUTTONTEXT~~ | string| state, text  |  |  |  | 
### light
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **light** | ~~ON_ACTUAL~~ | boolean| switch.light, sensor.light  | X |  |  | 
| **"** | ~~SET~~ | boolean| switch.light  | X | X |  | 
| **"** | ~~COLORDEC~~ | number| state  |  |  |  | 
| **"** | ~~BUTTONTEXT~~ | string| text  |  |  |  | 
### volume
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **volume** | ~~ACTUAL~~ | number| value.volume, level.volume  |  |  |  | 
| **"** | ~~SET~~ | number| level.volume  | X | X |  | 
| **"** | ~~MUTE~~ | boolean| media.mute  |  | X |  | 
### rgb
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **rgb** | ~~RED~~ | number| level.color.red  | X | X |  | 
| **"** | ~~GREEN~~ | number| level.color.green  | X | X |  | 
| **"** | ~~BLUE~~ | number| level.color.blue  | X | X |  | 
| **"** | ~~ON_ACTUAL~~ | boolean| sensor.light, switch.light  |  |  |  | 
| **"** | ~~ON~~ | boolean| switch.light  | X | X |  | 
| **"** | ~~DIMMER~~ | number| level.dimmer  |  | X |  | 
| **"** | ~~TEMPERATURE~~ | number| level.color.temperature  |  | X |  | 
| **"** | ~~WHITE~~ | number| level.color.white  |  | X |  | 
### rgbSingle
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **rgbSingle** | ~~RGB~~ | string| level.color.rgb  | X | X |  | 
| **"** | ~~ON~~ | boolean| switch.light  | X | X |  | 
| **"** | ~~DIMMER~~ | number| level.dimmer  |  | X |  | 
| **"** | ~~TEMPERATURE~~ | number| level.color.temperature  |  | X |  | 
| **"** | ~~ON_ACTUAL~~ | boolean| sensor.light, switch.light  |  |  |  | 
### slider
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **slider** | ~~SET~~ | number| level  | X | X |  | 
| **"** | ~~ACTUAL~~ | number| value, level  |  |  |  | 
### button
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **button** | ~~SET~~ | boolean| button  | X | X |  | 
### select
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **select** | ~~ACTUAL~~ | number| value.mode.select, level.mode.select  | X |  |  | 
| **"** | ~~SET~~ | number| level.mode.select  | X | X |  | 
### temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **temperature** | ~~ACTUAL~~ | number| value.temperature  | X |  |  | 
### value.temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **value.temperature** | ~~ACTUAL~~ | number| value.temperature  | X |  |  | 
### thermostat
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **thermostat** | ~~ACTUAL~~ | number| value.temperature  |  |  |  | 
| **"** | ~~SET~~ | number| level.temperature  | X | X |  | 
| **"** | ~~MODE~~ | number| level.mode.thermostat  |  | X |  | 
| **"** | ~~BOOST~~ | boolean| switch.mode.boost, switch.boost  |  | X |  | 
| **"** | ~~ERROR~~ | boolean| indicator.error  |  |  |  | 
| **"** | ~~LOWBAT~~ | boolean| indicator.maintenance.lowbat  |  |  |  | 
| **"** | ~~UNREACH~~ | boolean| indicator.maintenance.unreach  |  |  |  | 
| **"** | ~~HUMIDITY~~ | number| value.humidity  |  |  |  | 
| **"** | ~~MAINTAIN~~ | boolean| indicator.maintenance  |  |  |  | 
| **"** | ~~PARTY~~ | boolean| switch.mode.party  |  |  |  | 
| **"** | ~~POWER~~ | boolean| switch.power  |  | X |  | 
| **"** | VACATION | boolean| state  |  |  |  | 
| **"** | ~~WINDOWOPEN~~ | boolean| state, sensor.window  |  |  |  | 
| **"** | ~~WORKING~~ | boolean| indicator.working  |  |  |  | 
| **"** | USERICON | string| state  |  |  |  | 
### level.timer
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **level.timer** | ~~ACTUAL~~ | number| value.timer, level.timer, date  |  |  | Das wird angezeigt - date in hh:mm, timer in mm:ss | 
| **"** | ~~SET~~ | number| level.timer, date  |  | X | Hier wird ein geänderter Wert hingeschrieben | 
| **"** | ~~STATE~~ | boolean| button  |  | X | wenn die oberen nicht benutzt wird hier getriggert wenn ein interner Timer endet. | 
| **"** | ~~STATUS~~ | number| level.mode  |  | X | 0: OFF , 1: PAUSE, 2: ON/RUNNING | 
### gate
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **gate** | ~~ACTUAL~~ | boolean| switch.gate  | X |  |  | 
### door
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **door** | ~~ACTUAL~~ | boolean| sensor.door  | X |  |  | 
| **"** | ~~COLORDEC~~ | number| state  |  |  |  | 
| **"** | ~~BUTTONTEXT~~ | string| state, text  |  |  |  | 
### level.mode.fan
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **level.mode.fan** | ~~ACTUAL~~ | boolean| state  |  |  |  | 
| **"** | ~~MODE~~ | number| level.mode.fan  |  | X |  | 
| **"** | ~~SET~~ | boolean| switch  | X | X |  | 
| **"** | ~~SPEED~~ | number| level.speed  | X | X |  | 
### lock
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **lock** | ~~ACTUAL~~ | boolean| switch.lock, state  |  |  |  | 
| **"** | ~~OPEN~~ | boolean| button  |  | X |  | 
| **"** | ~~SET~~ | boolean| switch.lock  | X | X |  | 
### warning
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **warning** | ~~INFO~~ | string| weather.title  | X |  |  | 
| **"** | ~~LEVEL~~ | number| value.warning  | X |  |  | 
| **"** | ~~TITLE~~ | string| weather.title.short  | X |  |  | 
### sensor.alarm.flood
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **sensor.alarm.flood** | ~~ACTUAL~~ | boolean| sensor.alarm.flood  | X |  |  | 
