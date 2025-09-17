<!-- TODO: Translate from German to Italiano -->

# Erläuterungen zum Konfig - Script für den Adapter

Es gibt in dem Script drei Bereiche:  
- [Seiten-Konfiguration](#seiten-konfiguration)
```typescript
        /***********************************************************************
         **                                                                   **
         **                       Page Configuration                          **
         **                                                                   **
         ***********************************************************************/
```  
  
- [Screensaver-Konfiguration](#screensaver)
``` typescript
        /***********************************************************************
         **                                                                   **
         **                    Screensaver Configuration                      **
         **                                                                   **
         ***********************************************************************/
```
  
- Codebereich  
Änderungen im Codebereich sind vom User nicht nötig. Sollten für das Script Updates zur Verfügung stehen, können diese über die [Maintain Seite](Maintain) des Admin eingespielt werden.
```typescript
    /**
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     *  END STOP END STOP END - No more configuration - END STOP END STOP END       *
     ********************************************************************************
     *  For a update copy and paste the code below from orginal file.               *
     * ******************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     */
```  

## Seiten-Konfiguration   
  
Die Konfiguration der Seiten gleich fast der wie im Panel-Script. Es gibt ein paar wichtige Punkte die sich von dem Panel_Script unterscheiden.  
- Jede Seite braucht die Eigenschaft `uniqueName` -> Das ist ein eindeutiger Name für die Seite.   
- Die Hauptseite muß als `uniqueName` **main** haben  
- `next`, `prev`, `home`, `parent` müssen **Strings** sein, die auf einen der `uniqueName` verweist.
- Seiten die in `pages` eingetragen werden, werden im Kreis miteinander verlinkt, alle anderen Seiten die verwendet werden sollen müssen in `subPages` aufgeführt sein. 
- Die erste Zeile hat sich auch etwas geändert. Aus `let main: Pagetype ={` wird `const main: ScriptConfig.PageGrid = {` Die Page hinter `ScriptConfig` gleicht dem type `cardxxx`. Hier im Beispiel PageGrid = cardGrid.  
- `button1` und `button2` ***haben eine neue Konfiguration*** mehr dazu [hier](#hardwarebutton-config)


Hier ein Beispiel für eine Hauptseite   
```typescript
const main: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'main',
    heading: 'Wohnzimmer',
    useColor: true,
    items: [
        // hier kommen die PageItems rein
    ]
};
```
  
Hier eine Subpage  
```typescript
   const lichttest: ScriptConfig.PageEntities = {
        type: 'cardEntities',
        heading: 'Lichttest',
        uniqueName: 'lichttest',
        home: 'main',
        prev: 'gate',
        useColor: true,
        items: [
            // hier kommen die PageItems rein
        ]
    };
```  
  
* `const NameDerSeite:` -> Das Wort _NameDerSeite_ ist hier ein Platzhalter. Man gibt der Seite hier einen eindeutigen Namen, allerdings bitte ohne Leerzeichen bei mehreren Worten und vermeide Sonderzeichen.  
* `'type':` -> Der Typ der Seite, wie zuvor schon beschrieben. PageType und type haben immer den gleichen Postfix. Bei type ist es aber CardType statt PageType. Folglich haben wir hier in Hochkomma eingefasst 'cardEntities' oder 'cardGrid', etc.  
* `'heading':` -> Der Seitenname oder auch Überschrift, der auf der Seite auf dem NSPanel oben in der Mitte dargestellt wird. Er ist in Hochkommas zu fassen.   
* `'items':` ->  Hier wird der eigentliche Inhalt der Seite eingetragen. Pro dazustellendem Element erfasst man hier ein sogenanntes `PageItem` welches dann die darzustellenden Parameter erhält.  

---  
## Optionale Parameter  

        useColor?: boolean;
        subPage?: boolean;
        parent?: string;
        parentIcon?: string;
        parentIconColor?: RGB;
        prev?: string;
        prevIcon?: string;
        prevIconColor?: RGB;
        next?: string;
        nextIcon?: string;
        nextIconColor?: RGB;
        home?: string;
        homeIcon?: string;
        homeIconColor?: RGB;
        hiddenByTrigger?: boolean;
        alwaysOnDisplay?: boolean;

Bevor wir aber zur Erstellung der **PageItem** kommen, noch optionale Parameter, die man hier setzen kann:  
* `'subPage':` -> Wird, sofern man mit Unterseite arbeiten möchte, auf `true` gesetzt. Die Seite muss dann / nur im Bereich `subPages` eingetragen werden.    
* `next, prev, home, parent:` -> Wird `'subPage': true` definiert, dann kann man mit **next, prev, home, parent, parent** den Namen der der Seite definieren für die Navigation. Dies hat Auswirkung auf die Steuerung und die Blätterpfeile oben auf der Seite.  
* `nexticon, nexticoncolor, usw.` -> damit könnne die Icon für die Navigation bzw die Farbe der Icon angepasst werden. Standard sind sie Weiss und Pfeile, `home` zeigt ein Haus als Iocn.
* `'hiddenByTrigger':` -> Wird optional definiert um Top-Level-Seiten (Level 0) mit Hilfe des boolschen Datenpunktes (true/false) `nspanel-lovelace-ui.0.panels.XX_XX_XX_XX_XX.cmd.hideCards` zur Laufzeit auszublenden. Bei `subPage`-Seiten (Level 1-n) wird die Subpage zur Laufzeit nicht ausgeblendet, jedoch der Menüpunkt zum nächsthöheren Level deaktiviert. HideCards können auch über die Serviceseiten im Panel aktiviert werden.
* `alwaysOnDisplay` -> Damit bleibt die Seite permanent sichtbar und springt nicht in den Screensaver zurück. Um in den Screensaver zu kommen muss man eine Seite wählen, die diesen Parameter nicht besitzt.   

## weitere Parameter für die Navigation auf der Seite  

Wenn mehr PageItems auf der Seite definiert sind als angezeigt werden können, kann man durch die Seite blättern. Dafür gibt es mehere Optionen und Einschränkungen. 
* **in den Seiten der Entities** -> cardEntities und cardSchedule erfolgt das Blättern über den rechten oberen Pfeil, der solange nach unten zeigt, wie es Einträge gibt. Auf der letzten Seite wechselt der Pfeil in die Richtung `rechts`.  
* **bei Seiten mit Griditems** -> alle cardGrid, cradThermo2, cardMedia welche selbstdefinierte PageItems aufnehmen können. Für diese Seiten gibt es den Paramter `scrollPresentation` **classic** oder **arrow**  
    * **classic** blättert die Seiten genau so wie bei den Entities mit dem Pfeil rechts oben.
    * **arrow** erzeugt in der Seite auf dem letzten Platz einen Pfeil, durch klick auf diesem wird geblättert. Der Pfeil oben rechts für die Navigation bleibt in seiner Funktion bestehen, womit man damit ohne durch die ganze Seite zu blätten auf die nächste Seite kommt.  
  
Zusätzlich gibt es das **automatische Blättern**. Dabei muss der Parameter `scrollPresentation` auf **auto** gesetzt werden und der Parameter `srollAutoTiming` kann mit einen Wert in Sekunden angegeben werden, Standard sind 15sek.  

---  

Dann gibt es noch die Standard Seiten PageQR, PageChart, PagePower und PageAlarm. Sie haben eine einfache Config, da sie in der WebUI des Adapter konfiguriert werden. Der `uniqueName` muss dabei dem in der Adapter-config entsprechen. Bei der PageChart muss zum `uniqueName` auch der card`type` passen.  Mehr zu diesen Thema in den [speziellen Wiki Seiten.](Pages)
```typescript
    const wlandaten: ScriptConfig.PageQR = {
        uniqueName: 'wlandaten',
        type: 'cardQR'
    };

    const stromChart: ScriptConfig.PageChart = {
        uniqueName: 'strom',
        type: 'cardChart' // Balkenchart
    };

    const temperatur: ScriptConfig.PageChart = {
        uniqueName: 'temperatur',
        type: 'cardLChart' // Linienchart
    };

    const powerGrid: ScriptConfig.PagePower ={
        uniqueName: 'powerpage',
        type: 'cardPower'
    };
```  

## PageItems    
Die PageItems gleichen die vom Script, wobei der Adapter vieles aus den Objekten Channel und State auslesen kann. Deshalb reicht beim Adapter nur der Parameter `id` aus, um das pageItem zu erstellen. Vorausgesetzt der Channel und die States darunter sind richtig eingestellt, was die Rollen betrifft bzw. min/max oder der Type (number/string/usw.).  
Für ein pageItem, was als Navigation genutzt werden soll, muss zusätzlich die Parameter `navigate: true` sowie `targetPage: 'uniqueName der Seite wohin gesprungen wird'` angegeben werden.  
  
```typescript
        { id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.room'},
        
        { navigate: true, icon:'home', name:'Haus', targetPage: 'MenuGrid'},
```

Wenn alles eingestellt ist, Skript starten und auf die Rückmeldung warten, das Skript beendet sich selbst.

Dabei bedeutet die Phrase: `not implemented yet!` das wir es noch nicht eingebaut haben und `not supported` das wir das auch nicht werden ;)

## Hardwarebutton Config  
Es gibt vier Modis für die Button. 
- page -> navigiert zu einer Seite
- switch -> toggelt einen Datenpunkt zwischen true/false
- button -> setzt ein Button-Datenpunkt kurz auf true
- null -> Button ohne Funktion

Hier Beispiele mit dem linken Button, der rechte Button heißt `buttonRight`.  

```typescript
    buttonLeft: {
    mode: 'page',
    page: 'main' // uniqueName der Seite als String 
    }

    buttonLeft: {
    mode: 'switch',
    state: 'alias.0.Licht.switch' // Datenpunkt vom Type boolean z.B. ein Schalter 
    }

    buttonLeft: {
    mode: 'button',
    state: 'alias.0.Rollo.up' // Datenpunkt vom Type boolean und Rolle Button z.B. ein Taster vom Rollo  
    }

    buttonLeft: null
```  
---
## Screensaver  
  
Beim Screensaver lassen sich mehere Layouts auswählen. Diese werden über die Serviceseiten aktiviert. Im Script, was vom Adapter automatisch angelegt wird, sind schon diverse Einträge für alle Layouts hinterlegt. Diese müssen nur etwas angepasst werden, gleichen aber im Großen und Ganzem dem Script. Weitere Details zum Screensaver in einem [eigenen Kapitel.](screensaver) 

---

## Templates  

## Einleitung

Templates bieten eine einfache Möglichkeit, häufig verwendete Anzeige- und Steuerungselemente in **PageItems** zu integrieren. 
Ein Template wird als Objekt im `items`-Array einer Seite eingebunden und stellt automatisch die passende Visualisierung und Logik bereit.

## Verwendung

Ein Template wird über das Attribut `native.template` definiert. 
Über `dpInit` wird die Datenpunkt-ID angegeben, an die das Template gebunden ist.

Beispiel für eine Uhr (digitale Anzeige):

```ts
{ native: { template: 'text.clock', dpInit: '' } },
```

Beispiel für Batterieanzeige (niedriger Batteriestand, mit `indicator.lowbat`-Role):

```ts
{ native: { template: 'text.battery.low', dpInit: 'hm-rpc.1.0000DYXSDSDEF71111B7.0.LOW_BAT' } },
```

### Navigationserweiterung

Alle Templates unterstützen zusätzlich die Attribute `navigate` und `targetpage`. Damit kann beim Auslösen eine andere Seite geöffnet werden.  
Falls notwendig, muss `type: 'button'` ergänzt werden.

```ts
{
  navigate: true,
  targetpage: 'zielseite',
  native: { template: 'text.battery.low', dpInit: '', type: 'button' },
},
```

## Beispiele

### Grid mit Template

Templates können in **cardGrid**-Seiten genutzt werden:

```ts
const subgrid1: PageType = {
  uniqueName: 'media2',
  heading: 'Grid 1',
  items: [
    { native: { template: 'text.battery.low', dpInit: '0_userdata.0' } },
  ],
  type: 'cardGrid',
  home: 'hidden',
  parent: 'cardGrid1',
  hiddenByTrigger: false,
};
```

### Einschränkungen

- Templates stehen in `cardMedia`-Seiten **nicht** zur Verfügung.  
  Benutzerdefinierte PageItems können jedoch weiterhin genutzt werden.  
  Bei `cardMedia` ist der Suchpfad für Datenpunkte fest vorgegeben und nicht veränderbar.

- Bei Rollen muss die Schreibweise **exakt** stimmen (z. B. `indicator.lowbat`).

## Verfügbare Templates

Die folgende Übersicht zeigt gängige Templates und ihre Einsatzbereiche:

| Template                  | Beschreibung                         |
|----------------------------|-------------------------------------|
| `text.clock`              | Digitale Uhr                        |
| `text.battery.low`        | Batterieanzeige (niedrig)            |
| `text.battery`            | Batterieanzeige allgemein            |
| `text.window.isOpen`      | Fenster offen                       |
| `text.window.isClose`     | Fenster geschlossen                 |
| `text.temperature`        | Temperaturanzeige                   |
| `text.door.isOpen`        | Tür offen                           |
| `text.gate.isOpen`        | Tor offen                           |
| `text.motion`             | Bewegungserkennung                  |
| `text.info`               | Infotext                            |
| `text.warning`            | Warnanzeige                         |
| `text.wlan`               | WLAN-Status                         |
| `text.shutter.navigation` | Rollladensteuerung (Navigation)      |
| `text.lock`               | Schlosszustand                      |
| `text.isOnline`           | Online-/Offline-Status              |

Zusätzlich existieren Templates für spezielle **Anwendungsfälle** (z. B. `text.sainlogic.windarrow`, `text.custom.windarrow`, `text.hmip.windcombo`).

Es gibt noch weitere Templates, die je nach **Anwendungsfall** genutzt werden können.  
Die Benennung orientiert sich am vorgesehenen Einsatzgebiet (z. B. `button`, `light`, `shutter`).  

Eine vollständige Übersicht kann bei Bedarf bereitgestellt werden.

## Erweiterte Anpassungen (für Experten)

Templates können vollständig angepasst werden – etwa Farbe, Icon oder auch die zugehörigen Datenpunkte.  
Dies sollte jedoch **nur von erfahrenen Anwendern** und nach Rücksprache erfolgen, da solche Änderungen leicht zu Fehlern führen können.  

Ein Beispiel: Änderung der Farbe der Uhr (`text.clock`) :

```ts
// Beispiel 1: Feste Farbe (const)
native: {
    template: 'text.clock',
    dpInit: '',
    data: {
        icon: {
            true: {
                color: { type: 'const', constVal: Red },
            },
        },
    },
},
```

```ts
// Beispiel 2: Dynamische Farbe aus einem State (RGB JSON-String)
native: {
    template: 'text.battery.low',
    dpInit: 'hm-rpc.1.Battery-Device.0.LOW_BAT',
    data: {
        icon: {
            true: {
                color: { type: 'state', dp: '0_userdata.0.visuals.batteryColorRGB' },
            },
        },
    },
},
```

```ts
// Beispiel 3: Dynamische Farbe per Trigger (RGB JSON-String)
native: {
    template: 'text.battery.low',
    dpInit: 'hm-rpc.1.Battery-Device.0.LOW_BAT',
    data: {
        icon: {
            true: {
                color: { type: 'triggered', dp: '0_userdata.0.visuals.triggeredBatteryColor' },
            },
        },
    },
},
```

## Wichtige Hinweise zum Schluss

1. Für den Block `native` existieren **keine Typdefinitionen** im Konfigurationsskript.  
   Der Grund: Hier wird direkt die adapterinterne Konfiguration berührt, die aufwendig ist und sich teilweise noch ändern kann.  

2. Alle beschriebenen Möglichkeiten funktionieren grundsätzlich.  
   Es kann jedoch vorkommen, dass bestimmte Optionen noch nicht im Konfigurationsskript eingebaut sind.  
   Das Hinzufügen ist meist in wenigen Minuten erledigt – bitte einfach Bescheid sagen, wenn etwas fehlt oder nicht wie erwartet funktioniert.

  
---
  
**AB HIER NUR ABLAGE damit nichts verloren geht :)**  
  

- Farbthemen hingefügt - werden immer weiter auf die Items verteilt - findet man im Admin 2. Seite unter der Tabelle
- Scrollarten auswählbar gemacht im Skript scrollPresentation: 'classic' das ist default, das scrollen greift auf die Navigationsicons zu.  
- scrollPresentation: 'arrow' das fügt ein pageitem mit der Pfeiloptik hinzu und man kann im Kreis blättern. Ist eine Eigenschaft von Page.  

Der Adapter reagiert in **0_userdata.0** und **alias.0** auf jede Änderung (`ack=true` oder `ack=false`) eines abonnierten Datenpunktes. Ansonsten gilt nachfolgendes:
- Auserhalb vom Adapter namespace(`nspanel-lovelace-ui.0`) reagiert dieser Adapter auf `ack=true` und setzt Datenpunkte mit `ack=false`
- Innerhalb des Adapter namespace reagiert dieser Adapter auf `ack=false` und setzt Datenpunkte mit `ack=true`

Beim Farbscalieren `colorScale` gibt es diese unteren Zusatzoptionen
```typescript
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

**aus dem Script WIKI**  

# Seiten-Konfiguration:
  
## Basisseite
Der Rahmen einer Seite  besteht aus einem Frame wie folgend:  
```typescript  
let NameDerSeite: PageType =
{
    'type': 'cardType',
    'heading': 'Seiten Überschrift',
    'useColor': true,
    'items': []
};  
```  
  
* `let NameDerSeite:` -> Das Wort _NameDerSeite_ ist hier ein Platzhalter. Man gibt der Seite hier einen eindeutigen Namen, allerdings bitte ohne Leerzeichen bei mehreren Worten und vermeide Sonderzeichen. Dieser Name muss im weiteren Verlauf des Skriptes noch einmal aufgeführt werden (Wichtig für die Darstellung und Navigation).  
* `PageType = ` -> Der Seitentyp wird durch die Types im Script automatisch gesetzt
* `'type':` -> Der Typ der Seite, wie zuvor schon beschrieben. PageType und type haben immer den gleichen Postfix. Bei type ist es aber CardType statt PageType. Folglich haben wir hier in Hochkomma eingefasst 'cardEntities' oder 'cardGrid', etc.  
* `'heading':` -> Der Seitenname oder auch Überschrift, der auf der Seite auf dem NSPanel oben in der Mitte dargestellt wird. Er ist in Hochkommas zu fassen.  
* `'useColor':` -> Wird in der Regel mit `true` angegeben, sofern "useColor" durch in der gewünschten Seite unterstützt wird. 
* `'items':` ->  Hier wird der eigentliche Inhalt der Seite eingetragen. Pro dazustellendem Element erfasst man hier ein sogenanntes `PageItem` welches dann die darzustellenden Parameter erhält.  
  
Bis hier her haben wir eine leere Seite erstellt. Wenn Page/Card Type festgelegt, der Seite einen Namen und eine Überschrift definiert ist, kann der erste Test durchgeführt werden.  
Als Zwischen-Test kann man den definierten `NameDerSeite` im Skript unter **pages** hinzufügen,
```typescript
export const config: Config = {
    // Seiteneinteilung / Page division
    // Hauptseiten / Mainpages
    pages: [
      NameDerSeite, // hinter dem Doppelslash kannst Du noch eine interne Info eintragen
      NSPanel_Service, //Auto-Alias Service Page
    ],
    // Unterseiten / Subpages
    subPages: [
// hier findet ihr die Serviceseiten wieder
    ]
    
```
das Skript neu starten und dann auf dem NSPanel schauen, ob die neue Seite (ohne Inhalt) schon angezeigt wird.  
  
## Optionale Parameter  
```typescript
        uniqueName: string;
        heading: string;
        items: PageItem[];
        useColor?: boolean;
        subPage?: boolean;
        parent?: string;
        parentIcon?: string;
        parentIconColor?: RGB;
        prev?: string;
        prevIcon?: string;
        prevIconColor?: RGB;
        next?: string;
        nextIcon?: string;
        nextIconColor?: RGB;
        home?: string;
        homeIcon?: string;
        homeIconColor?: RGB;
        hiddenByTrigger?: boolean;
        alwaysOnDisplay?: boolean;

type PageMenuBaseConfig = {
        /**
         * Defines how many items are scrolled at once.
         * - `"page"`: Scroll by a full page (all visible items).
         * - `"half"`: Scroll by half a page (only supported by certain card types).
         */
        scrollType?: 'page' | 'half';

        /**
         * Filters which items are shown.
         * - `"true"`: Show only items whose primary entity resolves to `true`.
         * - `"false"`: Show only items whose primary entity resolves to `false`.
         * - `number`: Show only items matching the given numeric filter value.
         */
        filterType?: 'true' | 'false' | number;
    } & (
            /**
             * Standard scroll presentations.
             * - `"classic"`: Windowed paging with optional `"half"`/`"page"` stride.
             * - `"arrow"`: Fixed number of slots, last slot can show a paging arrow.
             * Defaults to `"classic"`.
             */
            {scrollPresentation?: 'classic' | 'arrow'}

            | {
                /**
                 * Special mode that behaves like `"classic"`,
                 * including `"half"`/`"page"` support.  
                 * Pages automatically advance after a fixed interval.
                 */
                scrollPresentation: 'auto';

                /**
                 * Interval (in seconds) to automatically advance to the next page.  
                 * Always required in `"auto"` mode.  
                 * Defaults to `15` seconds if not specified.
                 */
                scrollAutoTiming: number;
            }
        );
```
  

Bevor wir aber zur Erstellung der **PageItem** kommen, noch optionale Parameter, die man hier setzen kann:  
* `'subPage':` -> Wird, sofern man mit Unterseite arbeiten möchte, auf `true` gesetzt. Die Seite muss dann / nur im Bereich `subPages` eingetragen werden.    
* `'parent':` -> Wird `'subPage': true` definiert, dann kann man mit **parent** den Namen der höher gelegenen Seite definieren. Dies hat Auswirkung auf die Steuerung und die Blätterpfeile oben auf der Seite.  
* `'hiddenByTrigger':` -> Wird optional definiert um Top-Level-Seiten (Level 0) mit Hilfe des boolschen Datenpunktes (true/false) `0_userdata.0.NSPanel.X.Config.hiddenCards` zur Laufzeit auszublenden. Bei `subPage`-Seiten (Level 1-n) wird die Subpage zur Laufzeit nicht ausgeblendet, jedoch der Menüpunkt zum nächsthöheren Level deaktiviert.

Es gibt noch weitere optionale Parameter, jedoch gehören die Alle zum Thema Navigation. Hierzu gibt es [hier](https://github.com/joBr99/nspanel-lovelace-ui/wiki/ioBroker-Navigation) in der Wiki eine Beschreibung, so dass wir an dieser Stelle nicht noch einmal darauf eingehen möchten.
  
## Seiteninhalt - PageItem - definieren  
Das `PageItem` -  wenn man es mal frei übersetzt , das Seiten-Gegenstand definiert einen auf der Seite sichtbaren Wert / Schalter. Was ein **PageItem** relativ immer mit sich bringt, ist eine **ID**, ein **Name** und eine **Farbdefinition**.  
```typescript  
{ id: 'alias.0.NSPanel_1.Luftreiniger', name: 'Luftreiniger', icon: 'power', icon2: 'power',offColor: MSRed, onColor: MSGreen},
```
Das `PageItem` wird mit `{},` declariert. Innerhalb der geschweiften Klammern folgt die weitere Konfiguration:  
 
### Mindestangaben:
* `id` :  Pfad zum Alias, der verwendet wird, in Hochkomma eingefasst
* `name` :  Text der als Label auf dem Display zu einem PageItem dargestellt wird, in Hochkomma eingefasst
  
> [!IMPORTANT]  
> * `name` ist kein muss, wenn der Alias richtig konfiguriert ist. Dann wird der Name aus dem `common.name.de` gezogen.  
> * Wie man Aliase definiert und welche Möglichkeiten es gibt, dafür haben wir hier in der Wiki seperate Kapitel, schaut da einfach mal rein
  
### **Optionale / spezifische Angaben**:  
  
#### Angaben für icon-Farbe:  
* `offColor` :  Farbe für ausgeschaltet
* `onColor` :  Farbe für eingeschaltet
* `useColor` :  wird mit  `true` oder `false` angegeben und verwendet bei `true` die definierten Config-Parameter **defaultOnColor** und **defaultOffColor**, sofern keine `onColor` oder `offColor` im `<PageItem>` als Parameter definiert sind  
* `colorScale` :  Colorscale ist ein Farbverlauf von Rot über Gelb nach Grün mit einem Bereich von 0 bis 10.
  * `val_min` -> Rot
  * `val_max` -> Grün
  * in Verbindung mit `val_best`, ist `val_best` Grün und `val_min` und `val_max` Rot  
  
> [!IMPORTANT]  
> Sofern keine icon-Farbe definiert wird, gibt es eine Default Farbkombination. Kann unter **defaultColor** (**defaultOnColor** & **defaultOffColor**) in der Konfiguration festgelegt werden.  
  
#### Angaben für Label:
* `prefixName` : Erweiterung für `name`. Setzt einen Text als Prefix vor  `name`
* `suffixName` : Erweiterung für `name`. Setzt einen Text als Postfix nach  `name` 
* `buttonText` : ersetzt den Standard Text “PRESS” auf der cardEntities 
* `fontSize` : Auf der **cardGrid(2)** kann man mit diesem Attribut die Schriftgröße auf  einen Wert zw. **0** und **5** gesetzt werden. Wird begleitet vom Attribut `useValue` mit dem Wert `true`:    
  * **Font 0** - Default - Size 24 (No Icons, Support for various special chars from different langs)
  * **Font 1** - Size 32 (Icons and limited chars)  
  * **Font 2** - Size 32 (No Icons, Support for various special chars from different langs)  
  * **Font 3** - Size 48 (Icons and limited chars)  
  * **Font 4** - Size 80 (Icons and limited chars)  
  * **Font 5** - Size 128 (ascii only)  
  
#### Definition Icons:
* `icon` : Ein Icon für den An-Status
* `icon2` : Ein Icon für den Aus-Status. `icon2` wird nicht bei allen Alias unterstützt
 
> [!NOTE]  
> Die Icon-Namen müssen aus der [Icondatei](https://htmlpreview.github.io/?https://github.com/jobr99/Generate-HASP-Fonts/blob/master/cheatsheet.html) stammen. `icon` bzw. `icon2` übersteuern ein Icon welches per Default vom Alias kommt. Bei vielen Alias ist es nicht notwendig ein `icon(2)` zu definieren. Die Option steht einem aber jederzeit zur Verfügung.  
  
#### Einheiten - Werte - Diverses:
* `unit` :  in Hochkomma gesetzte Einheit (z.B. °C) gilt nicht für alle Alias Rollen
* `useValue` :  muss auf `true`, wenn `fontSize` genutzt wird
* `minValue` :  legt den Startwert für den Slider fest
* `maxValue` :  legt den Endwert für den Slider fest
* `modeList` :  Ermöglicht ein **InSelPopup** für die Auswahl weiterer Werte. Wird in `[``, ``, ``]` gefasst und enthält eine kommaseparierte Liste an Werten 
* `inSel_ChoiceState` : definiert, ob ein ausgewählter Wert auf einem **InSelPopup** einen Fokus erhält. Wird mit `true` oder `false`angegeben
* `monobutton` : wenn als Schalter ein echter Hardware-Taster verbaut ist, wird immer _true/false_ für einen Umschaltvorgang gesendet. In dem Fall wird ein Taster emuliert und es ist `true` zu setzen. Andernfalls wird ein Schalter emuliert nud es ist `false` zu setzen. 
  
#### Angaben für Licht:  
* `interpolateColor` :  wird mit  `true` oder `false` angegeben und errechnet bei `true` die aktuelle Farbe des Leuchtmittels  
* `colormode` :  wird bei ALIAS RBG verwendet, um XY-Farbwerte zu errechnen und zu benutzen. Wert ist per default “rgb” und bei Verwendung von XY Farbübersetzungen: “xy”
  
  #### Angaben für PopupLight  
  * `minValueBrightness` :  legt den Startwert für den Slider Helligkeit fest
  * `maxValueBrightness` :  legt den Endwert für den Slider Helligkeit fest
  * `minValueColorTemp` :  legt den Startwert für den Slider Farbtemperatur fest
  * `maxValueColorTemp` :  legt den Endwert für den Slider Farbtemperatur fest
  
#### Angabe für Rolladen (PopupShutter)
* `secondRow` : gehört zur popupPage Shutter (Text für die zweite Zeile)  
* `minValueLevel` : definiert die kleinste Position (Down)
* `maxValueLevel` : definiert die größte Position (Up)
* `minValueTilt` :  definiert die - kleinste Lamellenposition-Stellung
* `maxValueTilt` :  definiert die - größte Lamellenposition-Stellung  
  
#### Angaben für Navigation und Subpages:  
* `navigate` :  Ersetzt `id` und wird mit `true` gesetzt und benötigt den Parameter **targetPage**. Öffnet eine Subpage
* `targetPage` :  Zielseite die geöffnet wird, wenn man eine in navigate definierte SubPage öffnen will  
  
#### **CardChart** spezifische Angabe:  
* `yAxis` :  name der y-Achse
* `yAxisTicks` :  Werte-Skala der yAchse Wird in `[``, ``, ``]` gefasst und enthält eine kommaseparierte Liste an Werten
* `onColor` : Farbe der Balken
  
#### **CardAlarm** spezifische Angabe:  
* `autoCreateALias` :  NSPanel-Script erstellt die Datenpunkte unter 0_userdata.0 und alias.0 automatisch, wenn Wert = `true`
  
#### **CardUnlock** spezifische Angabe:  
* `autoCreateALias` :  NSPanel-Script erstellt die Datenpunkte unter 0_userdata.0 und alias.0 automatisch, wenn Wert = `true`
  
#### **CardQR** spezifische Angabe:  
* `hidePassword` :  versteckt das WLAN Passwort auf der **PageQR**
* `autoCreateALias` :  NSPanel-Script erstellt die Datenpunkte unter 0_userdata.0 und alias.0 automatisch, wenn Wert = `true`
  
#### **CardMedia** spezifische Konfiguration:
* `adapterPlayerInstance` :  legt die Adapter-Instanz für die Adapter alexa2, spotify-premium, sonos, squeezeboxrpc, chromecast oder volumio fest
* `mediaDevice` :  bei alexa2 die Seriennummer des Echos, bei sonos die IP, bei squeezeboxrpc der erstellte Devicename
* `speakerList` :  bei alexa2 schaltbare Device-Namen, bei spotify-premium auswählbare Device-Namen
* `playList` :  nur für alexa2 und spotify-premium
* `equalizerList` :  kann verwendet werden, wenn Das Device (z.B. Amazon Echo oder Sonos HTTP API) und der Adapter des Devices eine Equalizer-Funktionalität bereit stellt
* `repeatList` : `['off','context','track']` bei spotify-premium Instanz
* `colorMediaIcon` :  Farbe für Player-Icon
* `colorMediaArtist` :  Farbe für Song-Interpreten
* `colorMediaTitle` :  Farbe für Song-Titel (Track)
* `crossfade` : Ersetzt die Seek-Funktion im Logo des Sonos-Players
* `alwaysOnDisplay` : Lässt den Media-Player geöffnet, bis eine weitere Seite navigiert wird
* `autoCreateALias` :  NSPanel-Script erstellt den Alias automatisch unter **alias.0** , wenn Wert = `true`
  
#### **CardThermo** spezifische Konfiguration:  
* `stepValue` :  Schrittweite für die Veränderung der Solltemperatur. Wird mit zusätzlich `minValue` und `maxValue` konfiguriert
* `iconArray` :  Wenn die Standard Icon im unteren Teil der PageThermo ersetzt werden sollen. Schreibweise wie bei `modeList`  
  
  #### Angaben für PopupThermo  
   * `popupThermoMode1` :  Popup, falls definiert, wird mit Hilfe der 3 Punkte unter der Setpoint-Temperaturein Popup (oberste Zeile) eingeblendet, welches Werte zur Steuerung von zusätzlichen Zuständen annehmen kann
   * `popupThermoMode2` : Popup, falls definiert, wird mit Hilfe der 3 Punkte unter der Setpoint-Temperaturein Popup (mittlere Zeile) eingeblendet, welches Werte zur Steuerung von zusätzlichen Zuständen annehmen kann 
   * `popupThermoMode3` :  Popup, falls definiert, wird mit Hilfe der 3 Punkte unter der Setpoint-Temperaturein Popup (unterste Zeile) eingeblendet, welches Werte zur Steuerung von zusätzlichen Zuständen annehmen kann
   * `popUpThermoName` :  Überschriften-Liste (Array) der in dem cardThermo
   * `setThermoAlias` :  ALIAS Liste (Array) welches die gewählten Zustände zurückgibt (numerisch)
  
* `icon` : definiert das Icon des Popup-Fensters
* `setThermoDestTemp2` : mit einem zusätzlichen ALIAS-Datenpunkt (ACTUAL2) kann eine 2. Setpoint-Temperatur visualisiert werden.  
  
## Basisseite mit PageItem
  
Wenn man nun ein oder je nach gewähltem Page Type mehrere `PageItems` aufgebaut hat und diese dem Punkte `items : []` hinzugefügt hat, erhält man eine Seite mit - nennen wir es etwas sichtbares.  
```typescript  
let name: PageType =  
{
    'type': 'cardType',
    'heading': 'Seiten Überschrift',
    'useColor': true,
    'items': [
        { id: 'alias.0.NSPanel_1.Luftreiniger', name: 'Luftreiniger', icon: 'power', icon2: 'power',offColor: MSRed, onColor: MSGreen},
    ]
}; 
```  
Wir haben weiter oben ja den Test mit der Basisseite gemacht, welche uns eine leere Seite auf dem NSPanel dargestellt hat. Nun, mit einem `PageItem` erhält man eine Anzeige.  
  
> Testet Eure `PageItems` Eintrag für Eintrag. Dies macht es bei der eventuellen Fehlersuche einfacher.
  
Bedient Euch gerne an den nachfolgend aufgelisteten Beispielen aus unserer Entwicklung. Mit den vorgefertigten `PageItem` aus den Beispielen habt Ihr es mit unter einfacher eure eigenen Seiten zu bauen. Mit der Zeit wird es dann immer mehr an eigenem, was man den Pages des NSPanels hinzufügt.
  
***  
  


---