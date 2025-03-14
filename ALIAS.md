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
* [buttonSensor](#buttonsensor)
* [temperature](#temperature)
* [value.temperature](#valuetemperature)
* [thermostat](#thermostat)
* [level.timer](#leveltimer)
* [gate](#gate)
* [door](#door)
* [level.mode.fan](#levelmodefan)
* [lock](#lock)
* [warning](#warning)
* [weatherforecast](#weatherforecast)
* [WIFI](#wifi)
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
| **airCondition** | ~~ACTUAL~~ | number| level.temperature, value.temperature  |  |  |  | 
| **"** | ~~SET~~ | number| level.temperature  | X | X |  | 
| **"** | ~~SET2~~ | number| level.temperature  |  | X |  | 
| **"** | ~~AUTO~~ | boolean| state  |  |  |  | 
| **"** | ~~COOL~~ | boolean| state  |  |  |  | 
| **"** | ~~BOOST~~ | boolean| switch.mode.boost  |  | X |  | 
| **"** | ~~ERROR~~ | boolean| indicator.error  |  |  |  | 
| **"** | ~~HEAT~~ | boolean| state  |  |  |  | 
| **"** | ~~HUMIDITY~~ | number| value.humidity  |  |  |  | 
| **"** | ~~MAINTAIN~~ | boolean| indicator.maintenance  |  |  |  | 
| **"** | ~~MODE~~ | number| level.mode.airconditioner  |  | X |  | 
| **"** | ~~OFF~~ | boolean| state  |  |  |  | 
| **"** | ~~POWER~~ | boolean| switch.power  |  | X |  | 
| **"** | ~~SPEED~~ | number| level.mode.fan  |  | X |  | 
| **"** | ~~SWING~~ | boolean| switch.mode.swing  |  | X |  | 
| **"** | ~~UNREACH~~ | boolean| indicator.maintenance  |  |  |  | 
### socket
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **socket** | ~~ACTUAL~~ | boolean| switch  | X |  |  | 
| **"** | ~~SET~~ | boolean| switch  |  | X |  | 
| **"** | ~~COLORDEC~~ | number| state  |  |  |  | 
| **"** | ~~BUTTONTEXT~~ | string| state, text  |  |  |  | 
### light
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **light** | ~~ACTUAL~~ | boolean| switch.light, sensor.light  | X |  |  | 
| **"** | ~~SET~~ | boolean| switch.light  |  | X |  | 
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
| **"** | ~~ON_ACTUAL~~ | boolean| sensor.light, switch.light  | X |  |  | 
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
### buttonSensor
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **buttonSensor** | ~~ACTUAL~~ | boolean| button.press  | X |  |  | 
### temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **temperature** | ~~ACTUAL~~ | number| value.temperature  | X |  |  | 
### value.temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **value.temperature** | ~~ACTUAL~~ | number| value.temperature  | X |  |  | 
| **"** | ~~USERICON~~ | string| state  |  |  |  | 
### thermostat
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **thermostat** | ~~ACTUAL~~ | number| value.temperature  |  |  |  | 
| **"** | ~~SET~~ | number| level.temperature  | X | X |  | 
| **"** | ~~MODE~~ | number| level.mode.thermostat  |  | X |  | 
| **"** | ~~BOOST~~ | boolean| switch.mode.boost  |  | X |  | 
| **"** | ~~AUTOMATIC~~ | boolean| state  |  |  |  | 
| **"** | ~~ERROR~~ | boolean| indicator.error  |  |  |  | 
| **"** | ~~LOWBAT~~ | boolean| indicator.maintenance.lowbat  |  |  |  | 
| **"** | ~~MANUAL~~ | boolean| state  |  |  |  | 
| **"** | ~~UNREACH~~ | boolean| indicator.maintenance.unreach  |  |  |  | 
| **"** | ~~HUMIDITY~~ | number| value.humidity  |  |  |  | 
| **"** | ~~MAINTAIN~~ | boolean| indicator.maintenance  |  |  |  | 
| **"** | ~~PARTY~~ | boolean| switch.mode.party  |  |  |  | 
| **"** | ~~POWER~~ | boolean| switch.power  |  | X |  | 
| **"** | ~~VACATION~~ | boolean| state  |  |  |  | 
| **"** | ~~WINDOWOPEN~~ | boolean| state, sensor.window  |  |  |  | 
| **"** | ~~WORKING~~ | boolean| indicator.working  |  |  |  | 
| **"** | ~~USERICON~~ | string| state  |  |  |  | 
### level.timer
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **level.timer** | ~~ACTUAL~~ | number| timestamp  | X | X |  | 
| **"** | ~~STATE~~ | string| state  | X | X |  | 
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
| **level.mode.fan** | ~~ACTUAL~~ | boolean| state  | X |  |  | 
| **"** | ~~MODE~~ | number| state  | X | X |  | 
| **"** | ~~SET~~ | boolean| state  | X | X |  | 
| **"** | ~~SPEED~~ | number| state  | X | X |  | 
### lock
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **lock** | ~~ACTUAL~~ | boolean| state  | X |  |  | 
| **"** | ~~OPEN~~ | boolean| state  |  |  |  | 
| **"** | ~~SET~~ | boolean| switch.lock  | X | X |  | 
### warning
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **warning** | ~~INFO~~ | string| weather.title  | X |  |  | 
| **"** | ~~LEVEL~~ | number| value.warning  | X |  |  | 
| **"** | ~~TITLE~~ | string| weather.title.short  | X |  |  | 
### weatherforecast
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **weatherforecast** | ~~ICON~~ | string| weather.icon.forecast  | X |  |  | 
| **"** | ~~TEMP~~ | number| value.temperature  | X |  |  | 
### WIFI
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **WIFI** | ~~ACTUAL~~ | string| state  | X |  |  | 
| **"** | ~~SWITCH~~ | boolean| switch  |  | X |  | 
