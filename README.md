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


Entwickleränderungen / Erklärung

**Nicht installieren wenn da oben bei Tests failed steht**

Immer wenn ich Zeit und lust habe Dokumentiere ich hier Sachen.

Gab lange nix, daher ist der alte Kram nicht unbedingt stimming.
**Solange das hier einfach nur Fortschritte aufzählt, ist oben neuer als unten**

Fragen gerne im [Forum](https://forum.iobroker.net/topic/80055/alphatest-nspanel-lovelace-ui-v0-1-1)

---

Das hat sich im Skript geändert button1 und button2 gibts nicht mehr - für mehr siehe beispiel skript
```(typescript)
    /**
     * Represents the configuration for a button function.
     * This type can be one of the following modes:
     * - 'page': Navigates to a specified page.
     * - 'switch': Toggles the state of a datapoint.
     * - 'button': Triggers a button datapoint with a true value.
     * - null: Represents no configuration.
     */
        buttonLeft: ConfigButtonFunction;
        /**
     * Represents the configuration for a button function.
     * This type can be one of the following modes:
     * - 'page': Navigates to a specified page.
     * - 'switch': Toggles the state of a datapoint.
     * - 'button': Triggers a button datapoint with a true value.
     * - null: Represents no configuration.
     */
        buttonRight: ConfigButtonFunction;
```



---

Wir haben die Möglichkeit eingefügt, die Bildschirmschonerroation über States zu aktiviern.  
`0=off`, `min=3s`, `max=3600s`   
Damit können aktuell überall mehr Items hinzufügt werden und diese dann im Intwrvall rotiert lassen. 

---

Der Adapter reagiert in **0_userdata.0** und **alias.0** auf jede Änderung (`ack=true` oder `ack=false`) eines abonnierten Datenpunktes. Ansonsten gilt nachfolgendes:
- Auserhalb vom Adapter namespace(`nspanel-lovelace-ui.0`) reagiert dieser Adapter auf `ack=true` und setzt Datenpunkte mit `ack=false`
- Innerhalb des Adapter namespace reagiert dieser Adapter auf `ack=false` und setzt Datenpunkte mit `ack=true`

Beim Farbscalieren `colorScale` gibt es diese unteren Zusatzoptionen
```(typescrpit)
/**
* The color mix mode. Default is 'mixed'.
* ‘mixed’: the target colour is achieved by scaling between the two RGB colours.
* 'cie': the target colour is achieved by mixing according to the CIE colour table. 
* 'hue': the target colour is calculated by scaling via colour, saturation and brightness.
*/
mode?: 'mixed' | 'hue' | 'cie';
/**
* The logarithm scaling to max, min or leave undefined for linear scaling.
*/
log10?: 'max' | 'min';
```

---
  
## Aktuelle Version  

Mit der aktuellen Version 0.1.12 sind schon ein paar Test möglich.

[Hier eine kurze Anleitung zur Installation und Startconfig](INSTALLATION.md)

Bei Fragen fragen - Discord, Forum, hier, Telegram, Teams alles vorhanden :)

[Alias Tabelle](ALIAS.md)

## Konvertierung der Skriptkonfiguration in Adapterkonfig

### Cards
- [x] cardChart
- [x] cardLChart
- [x] cardEntities
- [x] cardGrid
- [x] cardGrid2
- [x] cardGrid3
- [x] cardThermo
- [ ] cardMedia
- [x] cardUnlock
- [x] cardQR
- [ ] cardAlarm
- [x] cardPower

### PageItems
- [x] light
- [x] socket
- [x] dimmer
- [x] hue
- [x] rgb
- [x] rgbSingle
- [x] ct
- [x] blind
- [x] door
- [x] window
- [x] volumeGroup
- [x] volume
- [x] info
- [x] humidity
- [x] temperature
- [x] value.temperature
- [x] value.humidity
- [x] thermostat
- [ ] warning
- [ ] cie
- [x] gate
- [x] motion
- [x] buttonSensor
- [x] button
- [ ] value.time
- [ ] level.timer
- [ ] value.alarmtime
- [ ] level.mode.fan
- [x] lock
- [ ] slider
- [ ] switch.mode.wlan
- [ ] media
- [x] timeTable
- [ ] airCondition

### PageItems Navigation
- [x] light
- [x] socket
- [x] dimmer
- [x] hue
- [x] rgb
- [x] rgbSingle
- [x] ct
- [x] blind
- [x] door
- [x] window
- [x] volumeGroup
- [x] volume
- [x] info
- [x] humidity
- [x] temperature
- [x] value.temperature
- [x] value.humidity
- [x] thermostat
- [ ] warning
- [ ] cie
- [x] gate
- [x] motion
- [x] buttonSensor
- [x] button
- [ ] value.time
- [ ] level.timer
- [ ] value.alarmtime
- [ ] level.mode.fan
- [x] lock
- [ ] slider
- [ ] switch.mode.wlan
- [ ] media
- [x] timeTable
- [ ] airCondition



## Eingebaut:
- cardChart
- cardLChart
- cardMedia 
- cardGrid/2
- cardEntities
- cardPower
- cardThermo
- screensaver
- cardMedia
- alle Popups und PageItems

## Erklärungen

### Icons:
#### Dateneingang:
Zu Icon.x.color: (nix was mit Licht zu tun hat.)
Eingabe geht über folgende common Eigenschaftenmöglichkeiten
- type: number
  - decimal
- type: string
  - stringify Json: {r:0,g:0,b:0} oder {red:0,green:0,blue:0}
  - hexcolor - 7 Stellen beginned mit #
  - css color names (role: level.color.name) https://www.tutorialrepublic.com/css-reference/css-color-names.php
  - hsl: "hsl(0, 50%, 50%)" (role: level.color.name)

#### Funktion
##### IconEntryType
Sollte alle Icons betreffen abgesehen vom Screensaver zum aktuellen Zeitpunkt.

- true: ist der default wert sollte immer angegeben werden 
- false: optional der Wert für boolean false
- text: optional wird auf einer cardGrid/2 angezeigt anstelle des Icons
- scale: siehe unten

##### IconScaleElement
scale bekommt eine eigenen Punkt: das object besteht aus folgenden typen: `{val_min: number, val_max: number, val_best?: number, log10?: 'max' | 'min';}` um es zu verwenden muß icon.true.color und icon.false.color definiert sein. Value bezeichnet einen Wert der häufig von entity1 kommt.
- wenn nur val_min definiert ist bedeutet val_min >= Value das die Farbe bei true gewählt wird.
- wenn nur val_max definiert ist bedeutet val_max <= Value das die Farbe bei true gewählt wird.
- wenn val_max und val_min definiert sind, wird die Farbe von false (val_min) zu true (val_max) interpoliert
- val_max und val_min werden getauscht, ebenso die Farben für true und false, wenn max < min ist. Falls min und max gleich sind wird die Farbe von true zurückgegeben.
- wenn zusätzlich val_best definiert ist, ist val_best die Farbe von true und wird jeweils in die Richtungen von val_min/max zu false interpoliert
- wenn zusätzlich log10 definiert ist, wird bei `max` ein log10() 1 false, 10 true ausgeführt, bei `min` (10-value) -> 10 false, 1 true. 

### ValueEntryType

besteht aus diesen Typen: `{value: string | number |boolean; decimal?: number;factor?: number; unit?: string; minScale?: number; maxScale?: number; set?: string | number |boolean; } | undefined;` 

Wenn *** verlangert wird
- boolean läd Value und doppelt verneint es.
- number wird als nummer geladen oder konvertiert dann * `factor` und mit `minScale` und `maxScale` auf 0-100 skaliert.
- string wird 
  - mit `type==number` als nummer geladen und `decimal` angewendet 
  - oder als String 
  - `unit` wird in beiden Fällen hinzugefügt.


Beim Schreiben:
- erst wird `set`versucht, wenn negativ dann `value`

Sind natürlich alles Dataitems

### PageItems
#### vormalig CreateEntity()

##### light
- entity1 ist der Schalter
- icon (entity1)
- iconColor: Leuchtmittelfarbe kommt von dem definierten RGB Wert oder von CT (kelvin/mired) oder von IconEntryType entweder  scaliert mit dimmer oder entity1 
- dimmer ist ein Zahlenwert 
- colorMode kann die Eigenschaft undefined | 'hue' | 'ct' haben und bestimmt welcher Modus für das Icon verwendet werden soll.
- headline ist die Item Beschreibung 

##### shutter
- entity1 ist das level muß eine Zahl sein 0-100
- icon & iconColor (IconEntryType)(entity1)
- headline ist die Item Beschreibung  
- valueList ist ein array mit 3 oder 6 Einträgen die die Iconbezeichnung enthält - '' für disable. Felder werden ebenfalls disabled wenn keine Befehlsstate gefunden wird.

##### number
- entity1 ist das level muß eine Zahl sein 0-100
- text.true ist die Bezeichnung
- icon & iconColor wie shutter

##### text
- entity1 kann zahl,boolean sein. Falls es nicht klappt wird von true ausgegangen.
- entity2 oder text1 ist der text rechts in cardEntites
- text.true ist die Bezeichnung
- icon & iconColor wie shutter

##### button
- entity1 bestimmt den button Status oder true
- icon & iconColor wie shutter
- setValue1 schaltet den angegebenen State um (optional)
- setValue2 schaltet den angegebenen State auf false (optional)
- setNavi springt zur angegebenen NavigationsID

##### input_sel
- entityInSel als nummer oder boolean oder undefined
- Icon/Color wie gehabt
- headline ist die Beschreibung
- text ist der text rechts in entities

##### fan
- entity1 ist der Schalter
- icon...
- headline die Beschreibung

##### timer
- im moment nur die interne Version komplett eingebaut
- entity1 noch zu verstreichende Sekunden oder interner Zähler
- icon...
- text alternativer text für die anzeige rechts in entitiys standard ist Zeit.



## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
- (ticaki) fixed Tempcolor & dimmer
- (ticaki) Show service menu navigation even if there is only one page in pages

### 0.1.12 (2025-05-04)  
- (tt-tom17) added cardChart/cardLChart inkl. admin

### 0.1.11 (2025-04-12)
- (ticaki) Admin overview revised
- (ticaki) inSel could not be left fixed
- (ticaki) Missing navigation of a page is reported
- (tt-tom17) Page Power improved

### 0.1.10 (2025-04-08)
- (ticaki) refactoring startup
- (ticaki) added configuration script tools in admin
- (ticaki) added/fixed some pageitems
- (ticaki) added maintain in admin
- (ticaki) added navigation in admin
- (tt-tom17) added cardPower incl. admin

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
