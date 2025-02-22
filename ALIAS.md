# Table of contents
* [motion](#motion)
* [cie](#cie)
* [dimmer](#dimmer)
* [timeTable](#timeTable)
* [ct](#ct)
* [window](#window)
* [humidity](#humidity)
* [hue](#hue)
* [info](#info)
* [blind](#blind)
* [airCondition](#airCondition)
* [socket](#socket)
* [light](#light)
* [volume](#volume)
* [rgb](#rgb)
* [rbgSingle](#rbgSingle)
* [slider](#slider)
* [button](#button)
* [buttonSensor](#buttonSensor)
* [temperature](#temperature)
* [value.temperature](#value.temperature)
* [thermostat](#thermostat)
* [level.timer](#level.timer)
* [gate](#gate)
* [door](#door)
* [level.mode.fan](#level.mode.fan)
* [lock](#lock)
* [warning](#warning)
* [weatherforecast](#weatherforecast)
* [WIFI](#WIFI)
## motion
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **motion** | ACTUAL | boolean| sensor.motion  | X |  |  | 
## cie
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **cie** | CIE | string| level.color.cie  | X | X |  | 
| **"** | DIMMER | boolean| level.dimmer  | X | X |  | 
| **"** | ON | boolean| switch.light  | X | X |  | 
| **"** | ON_ACTUAL | boolean| sensor.light  | X |  |  | 
| **"** | TEMPERATURE | number| level.color.temperature  | X | X |  | 
## dimmer
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **dimmer** | SET | number| level.dimmer  | X | X |  | 
| **"** | ACTUAL | number| value.dimmer  | X |  |  | 
| **"** | ON_SET | boolean| switch.light  | X | X |  | 
| **"** | ON_ACTUAL | boolean| sensor.light  | X |  |  | 
## timeTable
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **timeTable** | ACTUAL | string| state  | X |  |  | 
| **"** | VEHICLE | string| state  | X |  |  | 
| **"** | DIRECTION | string| state  | X |  |  | 
| **"** | DELAY | boolean| state  | X |  |  | 
## ct
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **ct** | DIMMER | number| level.dimmer  | X | X |  | 
| **"** | ON | boolean| switch.light  | X | X |  | 
| **"** | ON_ACTUAL | boolean| sensor.light  | X |  |  | 
| **"** | TEMPERATURE | number| level.color.temperature  | X | X |  | 
## window
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **window** | ACTUAL | boolean| sensor.window  | X |  |  | 
## humidity
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **humidity** | ACTUAL | number| value.humidity  | X |  |  | 
## hue
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **hue** | DIMMER | number| level.dimmer  | X | X |  | 
| **"** | ON | boolean| switch.light  | X | X |  | 
| **"** | ON_ACTUAL | boolean| sensor.light  | X |  |  | 
| **"** | TEMPERATURE | number| level.color.temperature  | X | X |  | 
| **"** | HUE | number| level.color.hue  |  | X |  | 
## info
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **info** | ACTUAL | string| state  | X |  |  | 
## blind
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **blind** | ACTUAL | number| value.blind  | X |  |  | 
| **"** | SET | number| level.blind  | X | X |  | 
| **"** | CLOSE | boolean| button.close.blind  | X | X |  | 
| **"** | OPEN | boolean| button.open.blind  | X | X |  | 
| **"** | STOP | boolean| button.stop.blind  | X | X |  | 
| **"** | TILT_ACTUAL | number| value.tilt  |  |  |  | 
| **"** | TILT_SET | number| level.tilt  |  | X |  | 
| **"** | TILT_CLOSE | boolean| button.close.tilt  |  | X |  | 
| **"** | TILT_OPEN | boolean| button.open.tilt  |  | X |  | 
| **"** | TILT_STOP | boolean| button.stop.tilt  |  | X |  | 
## airCondition
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **airCondition** | ACTUAL | number| value.temperature  | X |  |  | 
| **"** | SET | number| level.temperature  | X | X |  | 
| **"** | SET2 | number| level.temperature  | X | X |  | 
| **"** | AUTO | boolean| state  |  |  |  | 
| **"** | COOL | boolean| state  |  |  |  | 
| **"** | BOOST | boolean| switch.boost  |  | X |  | 
| **"** | ERROR | boolean| indicator.error  |  |  |  | 
| **"** | HEAT | boolean| state  |  |  |  | 
| **"** | HUMINITY | number| value.humidity  |  |  |  | 
| **"** | MAINTAIN | boolean| indicator.maintainance  |  |  |  | 
| **"** | MODE | number| level.mode.aircondition  | X | X |  | 
| **"** | OFF | boolean| state  | X |  |  | 
| **"** | POWER | boolean| switch.power  |  | X |  | 
| **"** | SPEED | number| level.mode.fan  |  | X |  | 
| **"** | SWING | boolean| switch.mode.swing  |  | X |  | 
| **"** | UNREACH | boolean| indicator.maintainance  |  |  |  | 
## socket
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **socket** | ACTUAL | boolean| switch  |  |  |  | 
| **"** | SET | boolean| switch  | X | X |  | 
## light
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **light** | ACTUAL | boolean| sensor.light  |  |  |  | 
| **"** | SET | boolean| switch.light  | X | X |  | 
## volume
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **volume** | ACTUAL | number| value.volume  | X |  |  | 
| **"** | SET | number| level.volume  | X | X |  | 
| **"** | MUTE | boolean| media.mute  | X | X |  | 
## rgb
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **rgb** | RED | number| level.color.red  | X | X |  | 
| **"** | GREEN | number| level.color.green  | X | X |  | 
| **"** | BLUE | number| level.color.blue  | X | X |  | 
| **"** | ON_ACTUAL | boolean| sensor.light  | X |  |  | 
| **"** | ON | boolean| switch.light  | X | X |  | 
| **"** | DIMMER | number| level.dimmer  | X | X |  | 
| **"** | TEMPERATURE | number| level.color.temperature  | X | X |  | 
| **"** | WHITE | number| level.color.white  |  | X |  | 
## rbgSingle
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **rbgSingle** | RGB | string| level.color.rgb  | X | X |  | 
| **"** | ON | boolean| switch.light  | X | X |  | 
| **"** | DIMMER | number| level.dimmer  | X | X |  | 
| **"** | TEMPERATURE | number| level.color.temperature  | X | X |  | 
| **"** | ON_ACTUAL | boolean| sensor.light  | X |  |  | 
## slider
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **slider** | SET | number| level  | X | X |  | 
| **"** | ACTUAL | number| value  | X |  |  | 
## button
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **button** | SET | boolean| button  | X | X |  | 
## buttonSensor
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **buttonSensor** | ACTUAL | boolean| button.press  | X |  |  | 
## temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **temperature** | ACTUAL | number| value.temperature  | X |  |  | 
| **"** | SECOND | number| value.humidity  |  |  |  | 
## value.temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **value.temperature** | ACTUAL | number| value.temperature  | X |  |  | 
| **"** | SECOND | number| value.humidity  |  |  |  | 
## thermostat
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **thermostat** | ACTUAL | number| value.temperature  | X |  |  | 
| **"** | SET | number| level.temperature  | X | X |  | 
| **"** | MODE | number| level.mode.thermostat  | X | X |  | 
| **"** | BOOST | boolean| state  |  |  |  | 
| **"** | AUTOMATIC | boolean| state  | X |  |  | 
| **"** | ERROR | boolean| indicator.error  |  |  |  | 
| **"** | LOWBAT | boolean| indicator.maintainance  |  |  |  | 
| **"** | MANUAL | boolean| state  |  |  |  | 
| **"** | UNREACH | boolean| indicator.maintainance  |  |  |  | 
| **"** | HUMINITY | number| value.humidity  |  |  |  | 
| **"** | MAINTAIN | boolean| indicator.maintainance  |  |  |  | 
| **"** | PARTY | boolean| state  |  |  |  | 
| **"** | POWER | boolean| switch.power  |  | X |  | 
| **"** | VACATION | boolean| state  |  |  |  | 
| **"** | WINDOWOPEN | boolean| state  |  |  |  | 
| **"** | WORKING | boolean| state  |  |  |  | 
## level.timer
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **level.timer** | ACTUAL | number| timestamp  | X |  |  | 
| **"** | STATE | string| state  | X |  |  | 
## gate
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **gate** | ACTUAL | boolean| switch.gate  | X |  |  | 
## door
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **door** | ACTUAL | boolean| sensor.door  | X |  |  | 
## level.mode.fan
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **level.mode.fan** | ACTUAL | boolean| state  | X |  |  | 
| **"** | MODE | number| state  | X | X |  | 
| **"** | SET | boolean| state  | X | X |  | 
| **"** | SPEED | number| state  | X | X |  | 
## lock
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **lock** | ACTUAL | boolean| state  | X |  |  | 
| **"** | OPEN | boolean| state  | X |  |  | 
| **"** | SET | boolean| switch.lock  | X | X |  | 
## warning
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **warning** | INFO | string| weather.title  | X |  |  | 
| **"** | LEVEL | number| value.warning  | X |  |  | 
| **"** | TITLE | string| weather.title.short  | X |  |  | 
## weatherforecast
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **weatherforecast** | ICON | string| weather.icon.forecast  | X |  |  | 
| **"** | TEMP | number| value.temperature  | X |  |  | 
## WIFI
| Channel role | State ID | common.type | common.role | required | common.write | description |  
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
| **WIFI** | ACTUAL | string| state  | X |  |  | 
| **"** | SWITCH | boolean| switch  |  | X |  | 
