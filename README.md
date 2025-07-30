![Logo](admin/nspanel-lovelace-ui.png)
# ioBroker.nspanel-lovelace-ui

[![NPM version](https://img.shields.io/npm/v/iobroker.nspanel-lovelace-ui.svg)](https://www.npmjs.com/package/iobroker.nspanel-lovelace-ui)
[![Downloads](https://img.shields.io/npm/dm/iobroker.nspanel-lovelace-ui.svg)](https://www.npmjs.com/package/iobroker.nspanel-lovelace-ui)
![Number of Installations](https://iobroker.live/badges/nspanel-lovelace-ui-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/nspanel-lovelace-ui-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.nspanel-lovelace-ui.png?downloads=true)](https://nodei.co/npm/iobroker.nspanel-lovelace-ui/)

**Tests:** ![Test and Release](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/workflows/Test%20and%20Release/badge.svg)

[![Übersetzungsstatus](https://weblate.iobroker.net/widgets/adapters/-/nspanel-lovelace-ui/287x66-grey.png)](https://weblate.iobroker.net/projects/adapters/nspanel-lovelace-ui/)

## nspanel-lovelace-ui adapter for ioBroker

NsPanel Lovelace UI is a Firmware for the nextion screen inside of NSPanel in the Design of Lovelace UI Design.

### Short Description  
The NSPanel Lovelace UI is an alternative user interface for the Sonoff NSPanel, specifically designed for integration with iobroker. It typically relies on Tasmota (firmware) and MQTT (messaging protocol) to provide custom controls and displays directly on the NSPanel's small touchscreen.

### What is the NSPanel?  
The Sonoff NSPanel is a smart wall switch with:  
* two physical relay switches  
* a 3.5-inch touchscreen  
* temperature and brightness sensors  

It was originally developed for the eWeLink app, but can be integrated much more powerfully with ioBroker using alternative firmware  

### What does the "NSPanel Lovelace UI" do?  

With this custom UI, you can:  
* Display Lovelace-like Cards on the NSPanel  
* Display sensor values ​​(e.g., temperature, humidity)  
* Control scenes and automations  
* Control lights, thermostats, and other devices directly on the screen  

---

### Installation & Questions
Adapter Wiki: https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki  
Adapter Community (ioBroker Forum): [Forum](https://forum.iobroker.net/topic/80055/alphatest-nspanel-lovelace-ui-v0-1-1)

---

## The following HMI components are already integrated into the NSPanel adapter:

### HMI Cards
- [x] screensaver
- [x] screensaver2
- [x] screensaver3
- [x] cardChart
- [x] cardLChart
- [ ] cardLChart2 (new - in progress)
- [x] cardEntities
- [x] cardSchedule
- [x] cardGrid
- [x] cardGrid2
- [x] cardGrid3
- [x] cardThermo
- [ ] cardMedia
- [x] cardUnlock
- [x] cardQR
- [ ] cardAlarm
- [x] cardPower

### HMI Popups
- [x] popupInSel
- [x] popupFan
- [x] popupThermo
- [x] popupNotify
- [x] popupShutter
- [x] popupShutter2
- [x] popupLight
- [x] popupLight2
- [x] popupTimer
- [ ] popupSlider
- [ ] popupColor (new - in progress)

---

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
- (ticaki) Admin option added for how shutter positions are interpreted.

### 0.2.3 (2025-07-27)
- (ticaki) openweathermap added as standard weather adapter
- (ticaki) Some adjustments due to updated firmware
- (ticaki) Some improvements

### 0.2.2 (2025-07-19) 
- (tt-tom17) improved PageQR 
- (ticaki) BREAKING: alias def changed
- (ticaki) actual-set handling changed
- (tt-tom17) popupFan added

### 0.2.1 (2025-06-30)
- (ticaki) Modified script version comparison

### 0.2.0 (2025-06-30)
- (tt-tom17) Additional options added to the service pages
- (ticaki) light2 added
- (ticaki) popupShutter2 added
- (ticaki) fixed Tempcolor & dimmer
- (ticaki) Show service menu navigation even if there is only one page in pages

### 0.1.12 (2025-05-04)  
- (tt-tom17) added cardChart/cardLChart inkl. admin

### 0.1.11 (2025-04-12)
- (ticaki) Admin overview revised
- (ticaki) inSel could not be left fixed
- (ticaki) Missing navigation of a page is reported
- (tt-tom17) PagePower improved

### 0.1.10 (2025-04-08)
- (ticaki) refactoring startup
- (ticaki) added configuration script tools in admin
- (ticaki) added/fixed some pageitems
- (ticaki) added maintain in admin
- (ticaki) added navigation in admin
- (tt-tom17) added PagePower incl. admin

### 0.1.9 (2025-03-21)
- (ticaki) added: tasmota web ui user & password Fixes #164
- (ticaki) BREAKING: Internal server use TLS - New tasmota config for internal server.
- (tt-tom17) added servicepage items
- (ticaki) added lock
- (ticaki) cardThermo with input_sel
- (ticaki) Added: Admin option to fix wrong common.type=state in alias.0 to common.type=mixed
- (ticaki) Required data points are found via role, type etc. The designation only plays a role in rare cases.

### 0.1.8 (2025-03-10)
- (ticaki) added: hw-buttons with actions
- (ticaki) fixed: screensaver trigger
- (ticaki) check if port is free for mqtt server
- (ticaki) check and tweak role info
- (ticaki) fixed: entities and grid icons/text
- (ticaki) tools for tasmota added to admin
- (ticaki) tweak panel response time 
- (ticaki) 'switch' added
- (tt-tom17) completed servicepages

### 0.1.7 (2025-03-06)
- (ticaki) cardGrid Number values -> Show an icon if user has defined one, otherwise number
- (ticaki) fixes #143
- (ticaki) fixes #147
- (ticaki) fixes #146
- (ticaki) fixes #144
- (ticaki) fixes #148

### 0.1.6 (2025-03-05)
 - (ticaki) fixes #140
 - (ticaki) fixes #141

### 0.1.5 (2025-03-03)
- (ticaki) fixes [#135](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues/135)
- (ticaki) fixes #133
- (ticaki) Configuration is reconfigured at every start. If this fails, the saved conversion is used.
- (ticaki) The raw version and a converted version are saved when the configuration is transferred.
- (ticaki) parent added to navigation
- (ticaki) cardQR added

### 0.1.4 (2025-03-03)
- (ticaki) fixes #131

### 0.1.3 (2025-03-02)
- (ticaki) Data point generation changed
- (ticaki) Dimming mode (data points) completed
- (ticaki) Screensaver double-click added

### 0.1.2 (2025-02-27)
- (ticaki) fixed nav service right
- (ticaki) screensaver rotation time added
- (ticaki) grid scrolling improved
- (ticaki) Feedback from the script improved
- (Kuckuckmann:) new adapter logo

### 0.1.1 (2025-02-27)
- (ticaki) fixed color fading
- (ticaki) fixed config script
- (ticaki) added message for missing states

### 0.1.0 (2025-02-25)
- (ticaki) alot changes

### 0.1.0-preAlpha.0 (2024-03-09)
- (ticaki) alot :)

### 0.0.4-preAlpha.3 (2024-02-20)
- (ticaki) testversion

### 0.0.4-preAlpha.2 (2024-02-12)
- (ticaki) Add button flip to cardThermo

### 0.0.4-preAlpha.1 (2024-02-12)
- (ticaki) cardThermo, script config

### 0.0.4-preAlpha.0 (2024-02-01)
- (ticaki) admin save - still deep alpha

### 0.0.3-preAlpha.0 (2024-02-01)
- (ticaki) alot - still dont install this

### 0.0.2-JustPlaceholder.0 (2024-01-05)
* (ticaki) initial release

## License
MIT License

Copyright (c) 2024-2025 ticaki <github@renopoint.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
