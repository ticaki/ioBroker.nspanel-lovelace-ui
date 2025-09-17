<!-- TODO: Translate from German to Українська -->

# Table of contents
* [Remarks](#remarks)
* [airCondition](#aircondition)
* [blind](#blind)
* [button](#button)
* [ct](#ct)
* [dimmer](#dimmer)
* [door](#door)
* [gate](#gate)
* [hue](#hue)
* [humidity](#humidity)
* [info](#info)
* [level.mode.fan](#levelmodefan)
* [level.timer](#leveltimer)
* [light](#light)
* [lock](#lock)
* [media](#media)
* [motion](#motion)
* [rgb](#rgb)
* [rgbSingle](#rgbsingle)
* [select](#select)
* [sensor.alarm.flood](#sensoralarmflood)
* [slider](#slider)
* [socket](#socket)
* [temperature](#temperature)
* [thermostat](#thermostat)
* [timeTable](#timetable)
* [value.humidity](#valuehumidity)
* [value.temperature](#valuetemperature)
* [volume](#volume)
* [warning](#warning)
* [window](#window)


## Remarks

- (not fully implemented) Crossed out DPs can be named arbitrarily. Use the struck key only for questions in issues or in the forum.


### airCondition
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **airCondition** | ~~ACTUAL~~ | number | value.temperature |  |  |  |
| " | ~~BOOST~~ | boolean | switch.mode.boost, switch.boost |  | X |  |
| " | ~~ERROR~~ | boolean | indicator.error |  |  |  |
| " | ~~HUMIDITY~~ | number | value.humidity |  |  |  |
| " | ~~MAINTAIN~~ | boolean | indicator.maintenance |  |  |  |
| " | ~~MODE~~ | number, string | value.mode.airconditioner |  |  | 0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet - |
| " | ~~MODESET~~ | number | level.mode.airconditioner |  | X | 0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more. |
| " | ~~POWER~~ | boolean | switch |  | X | use MODE for on/off |
| " | SET | number | level.temperature | X | X |  |
| " | SET2 | number | level.temperature |  | X |  |
| " | ~~SPEED~~ | number | level.mode.fan |  | X |  |
| " | ~~SWING~~ | number | level.mode.swing |  | X |  |
| " | ~~SWING2~~ | boolean | switch.mode.swing |  | X |  |
| " | ~~UNREACH~~ | boolean | indicator.maintenance.unreach |  |  |  |

### blind
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **blind** | ~~ACTUAL~~ | number | value.blind, level.blind |  |  |  |
| " | ~~CLOSE~~ | boolean | button.close.blind | X | X |  |
| " | ~~OPEN~~ | boolean | button.open.blind | X | X |  |
| " | ~~SET~~ | number | level.blind | X | X |  |
| " | ~~STOP~~ | boolean | button.stop.blind | X | X |  |
| " | ~~TILT_ACTUAL~~ | number | level.tilt, value.tilt |  |  |  |
| " | ~~TILT_CLOSE~~ | boolean | button.close.tilt |  | X |  |
| " | ~~TILT_OPEN~~ | boolean | button.open.tilt |  | X |  |
| " | ~~TILT_SET~~ | number | level.tilt |  | X |  |
| " | ~~TILT_STOP~~ | boolean | button.stop.tilt |  | X |  |

### button
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **button** | ~~SET~~ | boolean | button | X | X |  |

### ct
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **ct** | ~~DIMMER~~ | number | level.dimmer | X | X |  |
| " | ~~ON~~ | boolean | switch.light | X | X |  |
| " | ~~ON_ACTUAL~~ | boolean | sensor.light, switch.light |  |  |  |
| " | ~~TEMPERATURE~~ | number | level.color.temperature | X | X |  |

### dimmer
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **dimmer** | ~~ACTUAL~~ | number | value.dimmer, level.dimmer |  |  |  |
| " | ~~ON_ACTUAL~~ | boolean | sensor.light, switch.light |  |  |  |
| " | ~~ON_SET~~ | boolean | switch.light | X | X |  |
| " | ~~SET~~ | number | level.dimmer | X | X |  |

### door
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **door** | ~~ACTUAL~~ | boolean | sensor.door | X |  |  |
| " | ~~BUTTONTEXT~~ | string | state, text |  |  |  |

### gate
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **gate** | ~~ACTUAL~~ | number | value.blind |  |  |  |
| " | ~~SET~~ | boolean | switch.gate | X | X |  |
| " | ~~STOP~~ | boolean | button.stop |  | X |  |

### hue
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **hue** | ~~DIMMER~~ | number | level.dimmer | X | X |  |
| " | ~~HUE~~ | number | level.color.hue | X | X |  |
| " | ~~ON~~ | boolean | switch.light | X | X |  |
| " | ~~ON_ACTUAL~~ | boolean | sensor.light, switch.light |  |  |  |
| " | ~~TEMPERATURE~~ | number | level.color.temperature |  | X |  |

### humidity
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **humidity** | ~~ACTUAL~~ | number | value.humidity | X |  |  |

### info
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **info** | ACTUAL | string, number, boolean, mixed | state | X |  |  |
| " | BUTTONTEXT | string | text |  |  |  |
| " | COLORDEC | number | value.rgb |  |  |  |
| " | USERICON | string | state |  |  |  |

### level.mode.fan
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **level.mode.fan** | ~~ACTUAL~~ | boolean | sensor.switch, state |  |  |  |
| " | ~~MODE~~ | number | level.mode.fan |  | X |  |
| " | ~~SET~~ | boolean | switch | X | X |  |
| " | ~~SPEED~~ | number | level.speed | X | X |  |

### level.timer
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **level.timer** | ~~ACTUAL~~ | number | value.timer, level.timer, date |  |  | Das wird angezeigt - date in hh:mm, timer in mm:ss |
| " | ~~SET~~ | number | level.timer, date |  | X | Hier wird ein geänderter Wert hingeschrieben |
| " | ~~STATE~~ | boolean | button |  | X | wenn die oberen nicht benutzt wird hier getriggert wenn ein interner Timer endet. |
| " | ~~STATUS~~ | number | level.mode |  | X | 0: OFF , 1: PAUSE, 2: ON/RUNNING |

### light
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **light** | ~~BUTTONTEXT~~ | string | text |  |  |  |
| " | ~~ON_ACTUAL~~ | boolean | sensor.light, switch.light | X |  |  |
| " | ~~SET~~ | boolean | switch.light | X | X |  |

### lock
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **lock** | ~~ACTUAL~~ | boolean | state |  |  |  |
| " | ~~OPEN~~ | boolean | button |  | X |  |
| " | ~~SET~~ | boolean | switch.lock | X | X |  |

### media
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **media** | ~~STATE~~ | boolean | media.state | X |  | True if playing, false if paused/stopped. If the media device supports more states, use read funtion to convert it to true/false. |

### motion
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **motion** | ~~ACTUAL~~ | boolean | sensor.motion | X |  |  |

### rgb
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **rgb** | ~~BLUE~~ | number | level.color.blue | X | X |  |
| " | ~~DIMMER~~ | number | level.dimmer |  | X |  |
| " | ~~GREEN~~ | number | level.color.green | X | X |  |
| " | ~~ON~~ | boolean | switch.light | X | X |  |
| " | ~~ON_ACTUAL~~ | boolean | sensor.light, switch.light |  |  |  |
| " | ~~RED~~ | number | level.color.red | X | X |  |
| " | ~~TEMPERATURE~~ | number | level.color.temperature |  | X |  |

### rgbSingle
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **rgbSingle** | ~~DIMMER~~ | number | level.dimmer |  | X |  |
| " | ~~ON~~ | boolean | switch.light | X | X |  |
| " | ~~ON_ACTUAL~~ | boolean | sensor.light, switch.light |  |  |  |
| " | ~~RGB~~ | string | level.color.rgb | X | X |  |
| " | ~~TEMPERATURE~~ | number | level.color.temperature |  | X |  |

### select
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **select** | ~~ACTUAL~~ | number | value.mode.select | X |  |  |
| " | ~~SET~~ | number | level.mode.select | X | X |  |

### sensor.alarm.flood
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **sensor.alarm.flood** | ~~ACTUAL~~ | boolean | sensor.alarm.flood | X |  |  |

### slider
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **slider** | ACTUAL | number | value, level |  |  |  |
| " | ACTUAL2 | number | value, level |  |  |  |
| " | ACTUAL3 | number | value, level |  |  |  |
| " | SET | number | level | X | X |  |
| " | SET2 | number | level |  | X |  |
| " | SET3 | number | level |  | X |  |

### socket
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **socket** | ~~ACTUAL~~ | boolean | sensor.switch |  |  |  |
| " | ~~BUTTONTEXT~~ | string | state, text |  |  |  |
| " | ~~SET~~ | boolean | switch | X | X |  |

### temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **temperature** | ~~ACTUAL~~ | number | value.temperature | X |  |  |

### thermostat
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **thermostat** | ~~ACTUAL~~ | number | value.temperature |  |  |  |
| " | ~~BOOST~~ | boolean | switch.mode.boost, switch.boost |  | X |  |
| " | ~~ERROR~~ | boolean | indicator.error |  |  | Not supported in cardThermo2 |
| " | ~~HUMIDITY~~ | number | value.humidity |  |  |  |
| " | ~~LOWBAT~~ | boolean | indicator.maintenance.lowbat |  |  |  |
| " | ~~MAINTAIN~~ | boolean | indicator.maintenance |  |  | Not supported in cardThermo2 |
| " | ~~MODE~~ | number, string | value.mode.thermostat |  |  | 0: OFF, 1: AUTO, 2: COOL, 3: HEAT, 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more.  (alternative type: 'string' for direct display) iif missed pick ModeSet - |
| " | ~~MODESET~~ | number | level.mode.thermostat |  | X | 0: OFF, 1: COOL, 2: HEAT, 3: AUTO,//soweit eingebaut 4: ECO, 5: FAN_ONLY, 6: DRY - depend on array in common.states - check wiki for more. |
| " | ~~PARTY~~ | boolean | switch.mode.party |  |  | Not supported in cardThermo2 |
| " | ~~POWER~~ | boolean | switch.power |  | X |  |
| " | ~~SET~~ | number | level.temperature | X | X |  |
| " | ~~UNREACH~~ | boolean | indicator.maintenance.unreach |  |  |  |
| " | USERICON | string | state |  |  | Not supported in cardThermo2 |
| " | VACATION | boolean | state |  |  | Not supported in cardThermo2 |
| " | ~~WINDOWOPEN~~ | boolean | sensor.window |  |  |  |
| " | ~~WORKING~~ | boolean | indicator.working |  |  | Not supported in cardThermo2 |

### timeTable
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **timeTable** | ~~noNeed~~ | string | state |  |  | Just use the template for this - ask TT-Tom :) |

### value.humidity
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **value.humidity** | ~~ACTUAL~~ | number | value.humidity | X |  |  |

### value.temperature
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **value.temperature** | ~~ACTUAL~~ | number | value.temperature | X |  |  |

### volume
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **volume** | ~~ACTUAL~~ | number | value.volume, level.volume |  |  |  |
| " | ~~MUTE~~ | boolean | media.mute |  | X |  |
| " | ~~SET~~ | number | level.volume | X | X |  |

### warning
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **warning** | ~~INFO~~ | string | weather.title | X |  |  |
| " | ~~LEVEL~~ | number | value.warning | X |  |  |
| " | ~~TITLE~~ | string | weather.title.short | X |  |  |

### window
| Channel role | State ID | common.type | common.role | required | common.write | description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **window** | ~~ACTUAL~~ | boolean | sensor.window | X |  |  |
| " | ~~BUTTONTEXT~~ | string | state, text |  |  |  |
