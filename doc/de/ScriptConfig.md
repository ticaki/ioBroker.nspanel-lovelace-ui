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

**Hinweis zu Global Pages**: Für mehrere NSPanels können Sie Seiten zentral definieren und wiederverwenden. Siehe die detaillierte Dokumentation: [Global Pages & Global Link](GlobalPages)

**Hinweis zur Admin-Konfiguration**: Seiten, Bildschirmschoner und Hardware-Buttons lassen sich auch ohne Skript im Admin anlegen. Eine bestehende Skript-Konfiguration kann per Knopfdruck in den Admin übernommen werden, siehe [Skript in den Admin übernehmen](#skript-in-den-admin-übernehmen).
  
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
- Die Hauptseite sollte als `uniqueName` **main** haben. Fehlt sie, legt der Adapter selbst eine leere Hauptseite an; eine im Admin unter `main` angelegte Seite überschreibt die Hauptseite aus dem Skript.  
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

Dann gibt es noch die Standard Seiten PageQR, PageChart, PagePower und PageAlarm. Sie haben eine einfache Config, da sie in der WebUI des Adapter konfiguriert werden. Der `uniqueName` muss dabei dem in der Adapter-config entsprechen. Chart-Seiten werden inzwischen komplett im Tab `PageConfig` angelegt; der Verweis im Script funktioniert nur noch für Seiten, die aus der alten Tabelle `PageChart` übernommen wurden, und ist veraltet (siehe [PageChart](PageChart)). Dasselbe gilt für Power-Seiten und die alte Tabelle `PagePower` (siehe [PagePower](PagePower)).  Mehr zu diesen Thema in den [speziellen Wiki Seiten.](Pages)
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

## Skript in den Admin übernehmen

Seiten, Bildschirmschoner und Hardware-Buttons lassen sich im Admin ohne Skript konfigurieren (Tabs `PageConfig`, `Screensaver`, Panel-Kachel unter `NSPanelsetting`). Wer ein bestehendes Skript hat, muss das nicht von Hand abtippen: Auf der [Maintain-Seite](Maintain#skript-in-den-admin-übernehmen) gibt es pro Panel den Knopf **Skript in Admin übernehmen**. Der Adapter zeigt zuerst eine Vorschau, was er übernehmen kann und was nicht (mit Grund), und ändert erst nach Bestätigung etwas. Der Ablauf im Admin ist dort beschrieben; hier steht, was dabei mit dem Skript passiert und welche Seiten sich übernehmen lassen.

Grundlage ist nicht der Quelltext, sondern die Konfiguration, die das Skript zuletzt per `sendTo` an den Adapter geschickt hat. Das Skript muss also mindestens einmal gelaufen sein. Ein Skript mit mehreren Panels (`panelTopic: ['…', '…']`) wird abgelehnt, weil der Umbau für ein Panel den anderen die Seiten nehmen würde – vorher in ein Skript je Panel aufteilen.

### Grundregel: nur ganze Seiten

Eine Seite wird nur übernommen, wenn der Admin-Editor **alles** an ihr ausdrücken kann – Seitentyp, jedes Element, jedes Feld. Kann er ein Detail nicht abbilden, bleibt die **ganze** Seite im Skript, und die Vorschau nennt Grund und Stelle (z. B. `items[3].confirm: not available in the admin`). Es gibt keine Teilübernahme: Nach der Übernahme verhält sich das Panel genauso wie vorher, nur dass die Seite jetzt aus dem Admin kommt.

### Was aus welchem Seitentyp wird

| Seitentyp im Skript | Ergebnis |
|---|---|
| `cardGrid`, `cardGrid2`, `cardGrid3`, `cardEntities`, `cardSchedule` | **Übernommen** als Menüseite im Tab `PageConfig` (gleiche Card) |
| `cardThermo2` | **Übernommen** als Thermostat-Seite |
| `cardThermo` (klassisch) | **Übernommen** als Seite „Thermostat (klassisch)“, siehe [PageThermo-Admin](PageThermo-Admin): `heading` (fehlt es oder ist es leer, wird die Überschrift `thermostat` übernommen – die zeigt das Panel dann auch beim Skript), `items[0].id`, `unit`, `minValue`/`maxValue`/`stepValue` (unverändert). Alle anderen Felder des Items (`popupThermoMode1..3`, `popUpThermoName`, `setThermoAlias`, `setThermoDestTemp2`, Symbole, Farben …) und weitere Items liest der Adapter nie – sie fallen ohne Meldung weg. |
| `cardMedia` | **Übernommen** als Media-Player-Seite |
| `cardPower`, `cardChart`, `cardLChart` | **Nur Navigation**: Der Admin-Eintrag existiert bereits (aus den alten Tabellen übernommen, siehe [PagePower](PagePower) / [PageChart](PageChart)). Die Navigation der Skript-Seite wird dem Eintrag für dieses Panel zugewiesen, der Verweis im Skript entfernt. Hat der Eintrag im Admin schon eine eigene Navigation, ist der Verweis tot und wird nur aus dem Skript entfernt. Gibt es keinen passenden Eintrag, bleibt die Seite im Skript. |
| `cardQR`, `cardAlarm`, `cardUnlock` | **Nur aus dem Skript entfernt**: Diese Seiten werden ausschließlich im Admin konfiguriert, der Verweis im Skript hat keine Funktion mehr. |
| Native Seiten (ohne `type`) | **Übersprungen** |
| Seiten des [globalen Skripts](GlobalPages) | **Wie Panelseiten**, siehe [Seiten des globalen Skripts](#seiten-des-globalen-skripts) |
| Jede Seite, deren `uniqueName` im Admin schon vergeben ist | **Übersprungen** (`nameExists`). Ausnahme Startseite: Ist `main` im Admin durch eine Seite belegt, die dieses Panel nicht abdeckt, wird die Skript-Startseite als `main_<Panelname>` mit dem Flag „Startseite“ angelegt – das Panel sieht sie weiterhin als `main`. Gibt es auch diesen Namen schon, wird sie übersprungen. |

Zusätzlich:
- **Screensaver**: Alle Bereiche (`favorit`, `alternate`, `left`, `bottom`, `indicator`), die beiden Statussymbole (`mrIcon1`/`mrIcon2`), die Benachrichtigungen (`notifyScreensaverEntity`), `screensaverSwipe`/`screensaverIndicatorButtons`, `weatherEntity` und `weatherAddDefaultItems` werden ein Screensaver-Eintrag im Tab `Screensaver` mit dem Namen des Panels. Lässt sich ein einzelnes Element nicht abbilden, wird der ganze Screensaver übersprungen. Existiert für das Panel im Admin schon ein Screensaver-Eintrag, bleibt der Skript-Screensaver unangetastet (er ist dann ohnehin ohne Wirkung). Ein Screensaver ohne Elemente und mit Standardeinstellungen ist „nichts zu tun“.
- **Hardware-Buttons** (`buttonLeft`/`buttonRight`): werden in die Panel-Kachel übernommen, aber nur, wenn der Button dort noch nicht konfiguriert ist – ein im Admin gesetzter Button gewinnt ohnehin über das Skript.

### Seiten des globalen Skripts

Seiten aus dem globalen Skript werden **pro Panel** mit übernommen, denn ihre Verlinkung hängt vom Panel ab. Der Adapter mischt das globale Skript dafür genau so ein wie beim Start des Panels: `{ globalLink: 'x' }` in `pages`/`subPages` wird zur globalen Seite `x` (mit `uniqueName: 'y'` umbenannt zu einem eigenen Admin-Eintrag `y`, ein `heading` am Link überschreibt die Überschrift), Seiten, die eine verlinkte Seite per `next` nachzieht, stehen an der Stelle im Ring, an der der Adapter sie einfügt, und die globalen Unterseiten, die kein Link benutzt, bekommt jedes Panel. Für diese Seiten gelten dieselben Regeln wie für Seiten des Panelskripts; Navigationsangaben (`navigation`) und `nativePageItems` des globalen Skripts sind genauso Hindernisse. Eine Seite, deren Umbenennung Navigationskopien mit Zufallsnamen erzeugt (`…_copy_nav_…`), bleibt im Skript.

Das **globale Skript selbst wird nie geändert.** Aus dem Panelskript verschwinden nur die übernommenen `{ globalLink }`-Einträge; globale Unterseiten, die das Panel nicht verlinkt, haben dort nichts zu entfernen. Nach der Übernahme ersetzt die Admin-Seite die gleichnamige Seite des globalen Skripts, weil sie diesem Panel ausdrücklich zugewiesen ist (Position und Links des Navigationsknotens bleiben erhalten); Seiten aus dem eigenen Panelskript gewinnen weiterhin gegen Admin-Seiten.

Gibt es im Admin schon eine Seite mit dem Namen (z. B. weil ein anderes Panel dieselbe globale Seite übernommen hat):

- **gleicher Inhalt**: Dem Eintrag wird nur dieses Panel mit seinen Links zugewiesen, ohne Meldung.
- **anderer Inhalt**: Die Vorschau listet die Seite unter **Seiten des globalen Skripts, die vom Admin abweichen** (mit den abweichenden Feldern), und man wählt pro Seite: **Admin-Stand behalten** (Vorgabe, das Panel wird zugewiesen), **Skriptstand übernehmen** (der Inhalt des Eintrags wird ersetzt, alle bestehenden Zuweisungen bleiben, dieses Panel kommt dazu – das ändert die Seite auch auf den anderen zugewiesenen Panels) oder **Überspringen** (nichts ändern, die Seite bleibt für dieses Panel im Skript). Jede Änderung der Auswahl aktualisiert die Vorschau.

Ist der Admin-Eintrag diesem Panel bereits zugewiesen, hat die globale Seite nichts mehr zu übernehmen; ein Link im Panelskript wird dann nur noch entfernt.

Hinweis: Eine vom Adapter vor dieser Version gespeicherte Skript-Konfiguration enthält die globalen Seiten schon eingemischt, ohne ihre Herkunft. Damit die Übernahme sie als globale Seiten erkennt, das Panelskript einmal neu starten.

### Häufige Gründe fürs Überspringen

Die Vorschau zeigt einen Grund und meist ein Detail mit dem betroffenen Feld. Die häufigsten:

| Grund | Bedeutung |
|---|---|
| `itemNotSupported` | Ein PageItem hat ein Feld, das der Admin-Editor nicht kennt. Dazu gehören u. a. `confirm`, `sliderItems`, `stepValue`, `buttonText`/`buttonTextOff`, `minValueLevel`/`maxValueLevel`, `minValueTilt`/`maxValueTilt`, `role`, `enabled`, `icon1`/`icon3`, `onColor2`/`unit2`, `colorScale.color_best` – und jedes Item mit `native` (also auch alle [Templates](#templates)). Ebenfalls: `fontSize` außerhalb 0–5, `navigate: true` ohne `targetPage`, ein Item ohne `id` und ohne Navigation, `useValueConditions` ohne Text bzw. `minValue`/`maxValue` ohne Zahl. `useValueConditions` (Bedingung, wann der Wert statt des Icons gezeigt wird), `minValue`/`maxValue` (Bereich des Lautstärke-Sliders bei Rolle `volume`), `secondRow` (zweite Zeile bei Rolle `blind`), `minValueBrightness`/`maxValueBrightness` und `colormode` (Rollen `dimmer`, `ct`, `rgb`, `rgbSingle`, `hue`) sowie `minValueColorTemp`/`maxValueColorTemp` (Rollen `ct`, `rgb`, `rgbSingle`, `hue`) werden übernommen – der Item-Dialog des Admin bietet die Felder an. Weil der Adapter die Bereichsfelder nur auswertet, wenn sie ungleich 0 sind, entfällt ein Wert `0` ohne Meldung; `colormode` wertet er nur als gesetzt/nicht gesetzt aus (`rgb` und `xy` wirken gleich), im Admin ist es deshalb ein Schalter. |
| `fieldNotSupported` | Ein Feld der Seite selbst ist nicht abbildbar: ein leeres `heading` oder ein `heading`, das wie eine Datenpunkt-Id aussieht, eine Seite, die im `navigation`-Array des Skripts übersteuert wird, `scrollType`/`scrollPresentation`, die die Card im Admin nicht anbietet, bei `cardThermo2` ein `power`-Datenpunkt oder nicht-positive `minValue`/`maxValue`/`stepValue`, bei `cardThermo` ein fehlendes `items[0]`, ein `items[0]` ohne `id` (oder mit `navigate`/`native`), eine leere oder nicht-textuelle `unit`, ein `minValue`/`maxValue`/`stepValue`, das keine Zahl ist, bei `cardMedia` Namen in `speakerList`/`playList`/`favoriteList` mit Leerzeichen am Rand oder leere Namen (eine leere Liste gilt wie ein fehlendes Feld, doppelte Namen werden zusammengefasst), `volumePresets` nicht im Format `Name?Wert` oder außerhalb des Lautstärkebereichs. Texte, die der Admin trimmen würde (führende/abschließende Leerzeichen), gelten ebenfalls als nicht abbildbar, weil das Panel sonst etwas anderes zeigen würde. |
| `unsupportedPageType` | Native Seiten, `globalLink`. |
| `nameExists` | Im Admin gibt es schon eine Seite mit diesem `uniqueName` – oder eine Seite aus `subPages` trägt den Namen einer Seite aus `pages` (die ignoriert der Adapter ohnehin). |
| `adminEntryMissing` | Ein `cardPower`/`cardChart`-Verweis, zu dem es keinen Admin-Eintrag gibt. |
| `adminOnly`, `adminAlreadyNavigated` | Kein Überspringen im eigentlichen Sinn: Der Verweis im Skript ist tot und wird nur entfernt (siehe Tabelle oben). |
| `screensaverExists`, `screensaverItemNotSupported`, `screensaverEmpty` | Der Screensaver bleibt im Skript: Es gibt schon einen Admin-Eintrag für das Panel, ein Element ist nicht abbildbar (Detail nennt es, z. B. `left[2].ScreensaverEntityOffColor: null …`, `nativePageItems`, mehr als ein Favorit), oder es gibt nichts zu übernehmen. |
| `buttonConfigured`, `buttonNotSupported` | Der Button ist im Admin schon gesetzt, bzw. der Wert im Skript ist keine gültige Button-Aktion (unbekannter `mode`, falscher Typ). Ein leerer Template-Button (`{ mode: 'switch', state: '' }` – bekannter `mode`, aber `state` bzw. `page` leer oder fehlend) gilt wie `null` als nicht konfiguriert: er wird weder übernommen noch gemeldet, das Skript bleibt an der Stelle unverändert. |

Felder, die der Adapter beim Einlesen des Skripts ohnehin nie auswertet (u. a. `useColor`, `interpolateColor`, `monobutton`, `popupVersion`, `iconArray`, `customIcons`, `shutterType`, `autoCreateALias`, `hidePassword`, `yAxis`/`yAxisTicks`, bei Seiten `subPage`, `filterType` sowie die Navigations-Icons und -Farben `prevIcon`, `nextIcon`, `homeIcon`, `parentIcon` und `…IconColor` – die Pfeile kommen auf beiden Wegen fest aus der Navigation), verhindern die Übernahme nicht – sie entfallen stillschweigend, am Panel ändert sich dadurch nichts.

Zur Navigation: Seiten aus `pages` bekommen ihre Navigation wie im Skript aus der Reihenfolge im Ring (eigene `prev`/`next`-Angaben zählen dort nicht), Seiten aus `subPages` aus ihren Feldern `prev`, `next`, `home`, `parent`; eine Unterseite ohne jede Angabe bekommt `home: main`. Die Zuweisung landet im Admin-Eintrag nur für dieses Panel.

Übersprungene Seiten bleiben einfach im Skript und funktionieren weiter wie bisher. Wer sie trotzdem in den Admin haben will, legt sie dort von Hand an (ggf. ohne das nicht abbildbare Feld) und entfernt sie dann aus dem Skript.

### Was mit dem Skript passiert

Nur wenn mindestens eine Seite, der Screensaver oder ein Button übernommen (oder ein toter Verweis entfernt) wird, fasst der Adapter das Skript an – und zwar in dieser Reihenfolge:

1. **Backup.** Eine deaktivierte Kopie des Skripts wird als `<Skript-Id>_1_backup` angelegt (Name `<Skriptname> backup 1`). Vorhandene Backups rücken nach: `_1_backup` → `_2_backup`, `_2` → `_3`, `_3` → `_4`; was dabei über 4 käme, wird gelöscht. Es bleiben also höchstens vier Backups pro Skript. Nur das neue `_1_backup` ist deaktiviert – nachgerückte Backups behalten ihren Aktiv-Status (wer ein Backup bewusst aktiviert hat, behält es laufend). Der Dialog nennt die Backup-Id und die nachgerückten/gelöschten Backups.
2. **Seiten entfernen.** Die übernommenen (und toten) Seiten werden aus den Arrays `pages: [ … ]` und `subPages: [ … ]` des `config`-Objekts gestrichen. Die zugehörige Definition (`const xyz: ScriptConfig.PageGrid = { … uniqueName: '…' … };`) wird auskommentiert – als Blockkommentar mit der Markerzeile `NSPanel: converted to the admin page configuration on YYYY-MM-DD`. Das passiert **nur**, wenn der Bezeichner sonst nirgends im Code vorkommt; wird er noch irgendwo verwendet (z. B. in einer Funktion oder einem anderen Array), bleibt die Definition stehen und der Dialog meldet es.
3. **Screensaver leeren.** Die Arrays `favoritScreensaverEntity`, `alternateScreensaverEntity`, `leftScreensaverEntity`, `bottomScreensaverEntity`, `indicatorScreensaverEntity` und `notifyScreensaverEntity` werden zu `[]`, `mrIcon1ScreensaverEntity`/`mrIcon2ScreensaverEntity` zu `undefined`, `screensaverSwipe` und `screensaverIndicatorButtons` werden aus `advancedOptions` entfernt – jeweils mit dem Marker `NSPanel: moved to the admin screensaver on YYYY-MM-DD`.
4. **Buttons.** Übernommene `buttonLeft`/`buttonRight` werden `null`, Marker `NSPanel: moved to the admin panel configuration on YYYY-MM-DD`.

Der Adapter versteht den Quelltext dabei nicht – er erkennt nur Strings, Kommentare und Klammern und sucht die Stellen anhand des `config`-Objekts. Alles, was er nicht eindeutig findet, lässt er **unverändert** und meldet es im Dialog unter **Im Skript-Quelltext nicht geändert (bitte von Hand prüfen)**. Die Admin-Einträge werden trotzdem angelegt und die beim Adapter gespeicherte Konfiguration trotzdem bereinigt – das Backup schützt davor, dass etwas verloren geht.

Typische Meldungen, die man danach von Hand abarbeitet:
- `pages is not an array literal - left unchanged` – im Skript steht z. B. `pages: allPages` statt eines Array-Literals. Die Seiten wurden im Admin angelegt, das Skript ist unverändert. **Wichtig:** Bei gleichem `uniqueName` gewinnt beim Adapterstart die Skript-Seite über die Admin-Seite (Ausnahmen: die Hauptseite `main`, die Instanz-Option `adminOverridesScriptPages` und Seiten des globalen Skripts, wenn die Admin-Seite dem Panel ausdrücklich zugewiesen ist). Solche Seiten müssen also von Hand aus dem Skript entfernt werden, sonst gilt weiter die Skript-Version – die nächste Vorschau zeigt sie dann als `nameExists`.
- `page "xyz" not found in pages/subPages - nothing removed` – die Seite steht nicht (mehr) als Eintrag im Array, etwa weil sie per Spread oder Funktion dazukommt. Ebenfalls von Hand entfernen.
- `"xyz" (page "…") is still referenced in the script - definition kept` – der Array-Eintrag ist weg, aber die Definition wird noch woanders benutzt; prüfen, ob sie noch gebraucht wird.
- `config object not found - script left unchanged` – das `config`-Objekt wurde nicht erkannt (es muss `const config = { … }` heißen oder ein Objekt mit `panelTopic` und `pages` sein). Dann das Skript komplett von Hand bereinigen.
- `favoritScreensaverEntity is not an array literal - left unchanged`, `advancedOptions is not an object literal - left unchanged` – der Wert ist eine Variable statt eines Literals; von Hand leeren.

Existiert das Skript-Objekt nicht mehr (nur noch die vom Adapter gespeicherte Konfiguration), gibt es kein Backup und keine Änderung am Quelltext; nur die gespeicherte Konfiguration wird bereinigt.

Ausfallsicherheit: Bevor der Adapter irgendetwas schreibt, parkt er die anzulegenden Admin-Einträge in `native.pendingScriptConversion` seines Meta-Objekts. Scheitert später das Schreiben der Instanz-Konfiguration, meldet der Dialog „Teilweise ausgeführt“ – Backup und Skript-Bereinigung sind dann schon erfolgt, die Admin-Einträge holt der Adapter beim nächsten Start nach und entfernt den geparkten Plan wieder.

Nach der Übernahme startet der Adapter neu, und die Admin-Seite muss neu geladen werden (siehe [Maintain](Maintain#skript-in-den-admin-übernehmen)). Das bereinigte Skript kann man anschließend wieder starten – es schickt dann nur noch die verbliebenen Seiten. Wer alles übernommen hat, braucht das Skript nicht mehr: Ein Panel ohne Skript läuft komplett mit der Admin-Konfiguration.

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