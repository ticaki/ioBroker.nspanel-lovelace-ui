# Page Thermo2  
  
Die PageThermo hat ein neues Design bekommen und zusätzliche Funktionen. Sie kann jetzt mehrere Heizkreise verwalten und zusätzlich zu den Datenpunkten des Thermostats normale PageItems aufnehmen, damit ist sie in Ihrer Konfiguratiion offener.

> **Eingerichtet wird die Seite im Admin**, im Tab *PageConfig*:
> [Thermostat – Konfiguration im Admin](PageThermo2-Admin). Dort stehen der Editor, der Heizkreis-Dialog
> und alle Felder mit Bild. **Diese Seite beschreibt den zweiten Weg: die Konfiguration per Skript** —
> und was davon am Panel ankommt.

## Konfiguration der PageThermo2 im Adapter
Diese unterscheitet sich von der Skriptkonfiguration, daher eine komplette Beschreibung.
Struktur:
- [Aussehen](#aussehen)
- [Feature](#feature)
- [Probleme](#bekannte-probleme)
- [Konfiguration](#konfiguration)
    - [Alias](#alias)
    - [Direkt über Datenpunkte](#direkt-über-datenpunkte)
    - [Gemeinsame Optionen](#gemeinsame-eigenschaften)
- [PageItemerweiterung](#pageitemerweiterung) 

### Aussehen: 
 <img alt='Thermo2WithDP' src='../Pictures/PageThermo2/Thermo2MitDatenpunkten.png'>

### Feature:

- bis zu 8 Heizkreise möglich (z.B. Heizung/Klimaanlage oder Küche/Wohnzimmer/...) — mehr verwirft der Adapter mit einer Warnung („only 8 are supported")
- beliebig viele Pageitems (mit Blätterfunktion); **am Panel kommen acht je Seite an** — vier links, vier rechts
- die Reihenfolge dieser acht Flächen legt `sortOrder` fest: `V` (Vorgabe, senkrecht), `H` (waagerecht), dazu `HM`, `VM`, `HB` und `VB`
- Pageitems können einem Heizkreis zu geordnet werden (automatisch erzeugt werden bei mehreren Heizkreisen immer einem zugewiesen)
- Überschriften sind per Heizkreis
- Die Zeilen ober und unterhalb der Einstelltemperatur sind frei definierbar mit icon, wert, unit

> **Der Platz zwischen − und + ist kein Pageitem.** Dort steht fest der Modustext. Der Editor im Admin
> bietet zwar neun Plätze je Seite an, der Adapter sendet aber nur acht Pageitems (`pageThermo2.ts`,
> `maxItems = 8`) — ein Item auf dem neunten Platz erreicht das Panel nie, und die Blätterung im Editor
> läuft gegen die des Panels.

### Bekannte Probleme
- leichtes Flackern auf Grund der hübschen Optik - das wird bleiben
- Mode und Modeset könnten noch inkonsequent sein - in arbeit

### Konfiguration
Eine komplette Seite sieht im Skript z.B. so aus 

```typescript
    const ThermoNew: PageType = {
        type: 'cardThermo2',
        uniqueName:'main',
        heading: 'egal wird eh nicht angezeigt',
        thermoItems:[
            {name: 'test1', id:'0_userdata.0.Einzelne_Geräte.Thermostat'},
            {name: 'test2', modeList:['aus','kaputt', 'falsch'], modeId:'0_userdata.0.Einzelne_Geräte.Thermostat.MODE' ,iconHeatCycle:'home', iconHeatCycleOffColor:Red, thermoId1:'0_userdata.0.Einzelne_Geräte.Thermostat.ACTUAL', set:'0_userdata.0.Einzelne_Geräte.Thermostat.SET', thermoId2:'0_userdata.0.Einzelne_Geräte.Thermostat.HUMIDITY'}],
        items:[
            {id: 'alias.0.Licht.lights.Gerät_1', filter: 0},
            {id: 'alias.0.Licht.lights.Gerät_2', filter: 0},
            {id: '0_userdata.0.Einzelne_Geräte.dimmer'},
            {id: 'alias.0.NSPanel.allgemein.hue', },
            {navigate: true, targetPage: 'fahrplanrouten'},
            {id: 'alias.0.NSPanel.allgemein.shutter', filter: 1},
            {id: 'alias.0.NSPanel.allgemein.shutter', filter: 1},
            {id: 'alias.0.NSPanel.allgemein.shutter', filter: 1}
            ],
    }
```

#### Alias
Wie gewohnt kann man Aliase (siehe [Tabelle](ALIAS)) verwenden. Der Kanal muss die Rolle **thermostat** oder **airCondition** haben, jede andere lehnt der Adapter ab. Die Rolle **airCondition** erzeugt 2 Heizkreise — der zweite benutzt **`SET2`**; fehlt dieser Datenpunkt, fällt der Kühlkreis weg. Die wird eingestellt durch `name2`, `iconHeatCycle2`, `iconHeatCycleOnColor2` und `iconHeatCycleOffColor2`. Viele der optionalen Datenpunkte sind drin und werden Heizkreis bezogen als Pageitems hinzugefügt. Fehlende bitte reklamieren.
```typescript
    const Thermo2New: PageType = {
        type: 'cardThermo2',
        uniqueName:'Seitenname für interne Verwendung - Pflicht',
        heading: 'egal wird eh nicht angezeigt',
        thermoItems:[
            {
                name: 'Das hier ist die Überschrift', 
                id:'0_userdata.0.Einzelne_Geräte.Thermostat', // das hier ist der Channel, Device oder Folder
            },
        ],
        items:[],
    }
```
- `thermoItems` enthält Objekte ('{}') die die Heizkreise beschreiben minimum 1 (Liste bzw. Array)
  - `id` ist der Channel. (Zeichenkette)
  - `name` ist die Überschrift die angezeigt wird. (Zeichenkette) Ohne dieses wird geschaut, ob was im `common.name` des Channel steht.
  - `name2` ist die Überschrift, die für eine `airCondition` verwendet wird.
  - `iconHeatCycle2`: Überschreibt das Zahlenicon in den PageItems (außen herum) **ausschließlich für airCondition**
  - `iconHeatCycleOnColor2`: Überschreibt die Farbe für aktiviert in den PageItems (außen herum)  **ausschließlich für airCondition**
  - `iconHeatCycleOffColor2`: Überschreibt die Farbe für deaktiviert in den PageItems (außen herum)  **ausschließlich für airCondition**

Der Datenpunkt **MODE** hat sich verändert, daher bitte unten bei [modeList](#modelist) lesen

#### Direkt über Datenpunkte
Das ist mit Alias nicht mischbar, darf aber natürlich auf die Datenpunkte eines angelegten Channels verweisen. 
```typescript
const Thermo2New: PageType = {
        type: 'cardThermo2',
        uniqueName:'Seitenname für interne Verwendung - Pflicht',
        heading: 'egal wird eh nicht angezeigt',
        thermoItems:[
            {
                name: 'Das hier ist die Überschrift', 
                set:'0_userdata.0.Einzelne_Geräte.Thermostat.SET', // Der Einstellwert der Heizung
                thermoId1:'0_userdata.0.Einzelne_Geräte.Thermostat.ACTUAL', // Aktuelle Raumtemperatur (oberer Wert in der Anzeige)
                thermoId2:'0_userdata.0.Einzelne_Geräte.Thermostat.HUMIDITY', // Aktuelle Luftfeuchtigkeit (unterer Wert in der Anzeige)
                modeId:'0_userdata.0.Einzelne_Geräte.Thermostat.MODE', // Textfeld unterhalb der Werte - kein Zeichenkettendatenpunkt 
            }
        ],
        items:[],
    }
```
- `thermoItems` enthält Objekte ('{}') die die Heizkreise beschreiben minimum 1 (Liste bzw. Array)
  - `name` ist die Überschrift die angezeigt wird. (Zeichenkette)
  - `set` ist der Einstellwert der Heizung — **er muss existieren und beschreibbar sein**, sonst überspringt der Adapter den ganzen Heizkreis und meldet *invalid SET datapoint. Not exists or not writeable!*
  - `thermoId1` Aktuelle Raumtemperatur (oberer Wert in der Anzeige)
  - `thermoid2` Aktuelle Luftfeuchtigkeit (unterer Wert in der Anzeige)
  - `modeId` Siehe beschreibung unten zu `modeList`

#### Gemeinsame Eigenschaften

<img alt='Thermo2_1' src='../Pictures/PageThermo2/Thermo2_1.png'>
<img alt='Thermo2_2' src='../Pictures/PageThermo2/Thermo2_2.png'>

Hier sind die Eigenschaften beschrieben die zusätzlich zu `name`, `id` bzw. `name`, `set` angegeben werden können und was sie bedeuten:

```typescript
        icon?: AllIcons | '';
        icon2?: AllIcons | '';
        iconHeatCycle?: AllIcons | ''; 
        iconHeatCycleOnColor?: RGB;
        iconHeatCycleOffColor?: RGB;     
        name?: string;
        minValue?: number;
        maxValue?: number;
        stepValue?: number;
        power: string;   // nicht optional
        unit: string;    // nicht optional
        unit2?: string;
        onColor?: RGB;
        onColor2?: RGB;
        modeList?: string[];
```

**icon:** Überschreibt das Standardicon in der 1. Textzeile (Temperatur)
**onColor:** Überschreibt die Farbe  der 1. Textzeile (Temperatur)
**unit:** Überschreibt die Einheit — **im Skript für beide Wertzeilen** (Temperatur und Luftfeuchte) 

**icon2:** wie oben für Zeile 3 (Luftfeuchtigkeit)
**onColor2:**  wie oben für Zeile 3 (Luftfeuchtigkeit)
**unit2:** Überschreibt die Einheit der 3. Textzeile (Luftfeuchtigkeit) — **wirkt nur in der Admin-Konfiguration**, der Skriptweg liest das Feld nicht

**iconHeatCycle:** Überschreibt das Zahlenicon in den PageItems (außen herum)
**iconHeatCycleOnColor:** Überschreibt die Farbe für aktiviert in den PageItems (außen herum) 
**iconHeatCycleOffColor:** Überschreibt die Farbe für deaktiviert in den PageItems (außen herum) 

**minValue:** minimale Einstellbare Temperatur (Default: 15) *im Admin einstellbar ob 10 = 1 °C oder 10 = 10 °C*
**maxValue:** maximal einstellbare Temperatur (Default: 28) *im Admin einstellbar*
**stepValue:** Schritte für +/-. Eine eingetragene 0.1 bedeutet Schritte von 0.1 (Default: 0.5)  *im Admin einstellbar*

**power:** Datenpunkt für Ein/Aus. **Gibt es ihn, hat er Vorrang**; fehlt er, leitet der Adapter den Zustand aus `MODESET` beziehungsweise `modeId` ab (eine 0 bedeutet dort „aus").

*im Admin einstellbar*: Es gibts auf der Seite `NSPanel-Einstellungen` ganz unten eine Option, ob man es kompatible zum Skript haben möchte oder natürlich.

### modeList 
**modeList:** Das denke ich ist noch nicht final und braucht deutlich mehr Text :)
`modeId` bzw. 'MODE' und `MODESET` arbeiten auf die dieselbe Weise. Der Datenpunkt sollte vom Type `number` sein und kann im Object `common.states` verwenden - dann arbeiten das `common.states` für `modeList`.
**Welche Liste gewinnt, hängt vom Weg ab:** Beim **Alias** zählen zuerst die `common.states` des
Datenpunkts, danach `modeList`, zuletzt die Standardliste. Bei **direkt angegebenen Datenpunkten** ist es
umgekehrt: `modeList` zuerst, dann `common.states`, dann die Standardliste.  
  
Standard Modelist
```typescript
['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN', 'DRY']
```
Im Datenpunkt steht z.B. eine 0 dann wird `OFF` angezeigt, steht dort eine 3 wird `HEAT` angezeigt (die Texte werden übersetzt).  
Wenn das in den `common.states` des Datenpunktes genauso steht, gilt dort das gleich. Ebenso in der modeList.  

Im Skript sieht dass dann etwas regional angepasst so aus:
```typescript
modeList: ["Aus'm", "Automat", "Kühl'n", "Heiz'n", "Sparn", "Puste", "Trockn"],
```


Im Alias heißen die beiden Datenpunkte **`MODE`** (Rolle `value.mode.thermostat`, nur lesend) und
**`MODESET`** (Rolle `level.mode.thermostat`, beschreibbar) — Datenpunkte namens *TargetMode* oder
*CurrentMode* gibt es nicht. Ist `MODE` nicht angegeben, tritt `MODESET` an seine Stelle.

> Ein `MODE` vom Typ `string` ist vorgesehen, greift aber in der Praxis kaum: Der Adapter prüft dafür den
> Typ des **Kanalobjekts** statt den des Modus-Datenpunkts, und Kanäle haben meist gar keinen Typ.

### PageItemerweiterung
Für die Pageitems gibt es eine neue Eigenschaft die aktuell aber nur für die cardThermo2 von belang ist:
```typescript
items:[
    {id: 'alias.0.Licht.lights.Gerät_1', filter: 0},
],
```
`filter:` Ist es definiert, wird das Pageitem nur angezeigt, wenn der entsprechende Heizkreis aktiv ist. Zählung beginnt bei 0 (number). 
**Wenn eine airCondition per 'id' hinzugefügt wird erhöht sich der index nach der airCondition um 1.**

Der Adapter unterstützt jetzt auch Platzhalter PageItems - durch `id:'delete'` oder `id:'empty'` werden diese definiert.

> **Platzhalter ignorieren `filter`.** Sie erscheinen in **jedem** Heizkreis — wer in einem Kreis eine Lücke
> braucht, baut sie damit auch in alle anderen ein.


Schlußanmerkung - die Rollen für aircondition können sich noch ändern - die scheinen sich von thermostat zu unterscheiden also besser da nachgucken in der Alias-Tabelle.  
