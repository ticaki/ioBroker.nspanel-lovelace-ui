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
  
Die Konfiguration der Seiten gleicht fast der im Panel-Script. Es gibt ein paar wichtige Punkte, die sich vom Panel-Script unterscheiden.  
- Jede Seite braucht die Eigenschaft `uniqueName` -> Das ist ein eindeutiger Name für die Seite.   
- Die Hauptseite muss als `uniqueName` **main** haben.  
- `next`, `prev`, `home`, `parent` müssen **Strings** sein, die auf einen der `uniqueName` verweisen.
- Seiten, die in `pages` eingetragen werden, werden im Kreis miteinander verlinkt; alle anderen Seiten, die verwendet werden sollen, müssen in `subPages` aufgeführt sein. 
- Die erste Zeile hat sich ebenfalls geändert. Aus `let main: Pagetype = {` wird `const main: ScriptConfig.PageGrid = {`. Der Typ hinter `ScriptConfig.` gehört zum `type` `cardXxx`. Hier im Beispiel `PageGrid` = `cardGrid`. Die Zuordnung aller Seitentypen zeigt die Tabelle unten.  
- Die Hardware-Tasten heißen im Adapter-Script `buttonLeft` und `buttonRight` (früher `button1`/`button2`) und ***haben eine neue Konfiguration*** – mehr dazu [hier](#hardwarebutton-config).

### Verfügbare Seitentypen

`type` (in Hochkommas) und der `ScriptConfig.`-Typ haben denselben Postfix. Folgende Kombinationen sind gültig:

| `type` | `ScriptConfig`-Typ | Blättern/Filtern¹ | Hinweis |
|--------|--------------------|:----------------:|---------|
| `cardEntities` | `PageEntities` | ✅ | Listen-Layout |
| `cardSchedule` | `PageSchedule` | ✅ | Zeitschaltplan |
| `cardGrid` | `PageGrid` | ✅ | 6 Kacheln |
| `cardGrid2` | `PageGrid2` | ✅ | 8 Kacheln, `fontSize` möglich |
| `cardGrid3` | `PageGrid3` | ✅ | 4 Kacheln |
| `cardThermo` | `PageThermo` | – | genau **ein** Thermostat-Item |
| `cardThermo2` | `PageThermo2` | ✅ | mehrere Thermostate (`thermoItems`) |
| `cardMedia` | `PageMedia` | ✅ | Media-Player, keine Templates |
| `cardChart` | `PageChart` | – | Balkendiagramm, über Admin konfiguriert |
| `cardLChart` | `PageChart` | – | Liniendiagramm, über Admin konfiguriert |
| `cardPower` | `PagePower` | – | über Admin konfiguriert |
| `cardAlarm` | `PageAlarm` | – | genau **ein** Item |
| `cardUnlock` | `PageUnlock` | – | genau **ein** Item |
| `cardQR` | `PageQR` | – | über Admin konfiguriert |

¹ Spalte „Blättern/Filtern" = unterstützt die Parameter aus dem Abschnitt [weitere Parameter für die Navigation auf der Seite](#weitere-parameter-für-die-navigation-auf-der-seite) (`scrollPresentation`, `scrollType`, `filterType`). Details zu den einzelnen Seitentypen unter [Pages](Pages).


Hier ein Beispiel für eine Hauptseite   
```typescript
const main: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'main',
    heading: 'Wohnzimmer',
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
        subPage: true,
        items: [
            // hier kommen die PageItems rein
        ]
    };
```  
  
* `const NameDerSeite:` -> Das Wort _NameDerSeite_ ist hier ein Platzhalter. Man gibt der Seite hier einen eindeutigen Namen, allerdings bitte ohne Leerzeichen bei mehreren Worten und vermeide Sonderzeichen.  
* `'type':` -> Der Typ der Seite, wie zuvor schon beschrieben. PageType und type haben immer den gleichen Postfix. Bei type ist es aber CardType statt PageType. Folglich haben wir hier in Hochkomma eingefasst 'cardEntities' oder 'cardGrid', etc.  
* `'heading':` -> Der Seitenname oder auch Überschrift, der auf der Seite auf dem NSPanel oben in der Mitte dargestellt wird. Er ist in Hochkommas zu fassen.   
* `'items':` ->  Hier wird der eigentliche Inhalt der Seite eingetragen. Pro dazustellendem Element erfasst man hier ein sogenanntes `PageItem`, welches dann die darzustellenden Parameter erhält.  

### Seite testen

Sobald Page-/Card-Typ, Name und Überschrift definiert sind, kann ein erster Test erfolgen. Dazu trägt man die definierte Seite (hier `NameDerSeite`) im Skript unter `pages` (Hauptseiten) bzw. `subPages` (Unterseiten) ein:

```typescript
export const config: Config = {
    // Seiteneinteilung / Page division
    // Hauptseiten / Mainpages
    pages: [
      NameDerSeite, // hinter dem Doppelslash kannst Du noch eine interne Info eintragen
      NSPanel_Service, // Auto-Alias Service Page
    ],
    // Unterseiten / Subpages
    subPages: [
      // hier findet ihr die Serviceseiten wieder
    ],
    // ...
};
```

Danach das Skript neu starten und auf dem NSPanel prüfen, ob die neue (noch leere) Seite angezeigt wird.

---  
## Optionale Parameter  

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
        alwaysOnDisplay?: boolean | 'action' | null;
        // useColor?: boolean;   // auf Seitenebene ohne Funktion (veraltet)

Bevor wir aber zur Erstellung der **PageItem** kommen, noch optionale Parameter, die man hier setzen kann:  
* `'subPage':` -> Wird, sofern man mit einer Unterseite arbeiten möchte, auf `true` gesetzt. Die Seite muss dann nur im Bereich `subPages` eingetragen werden.    
* `next, prev, home, parent:` -> Mit **next, prev, home, parent** definiert man über den `uniqueName` die Ziel-Seite für die Navigation. Dies hat Auswirkung auf die Steuerung und die Blätterpfeile oben auf der Seite.  
* `nextIcon, nextIconColor, usw.` -> Damit können das Icon für die Navigation bzw. die Farbe des Icons angepasst werden. Standard sind weiße Pfeile, `home` zeigt ein Haus als Icon. Pro Richtung gibt es ein `*Icon` (Icon-Name aus der Icon-Liste) und ein `*IconColor` (RGB).
* `'hiddenByTrigger':` -> Wird optional definiert, um Top-Level-Seiten (Level 0) mithilfe des booleschen Datenpunktes (true/false) `nspanel-lovelace-ui.0.panels.XX_XX_XX_XX_XX.cmd.hideCards` zur Laufzeit auszublenden. Bei `subPage`-Seiten (Level 1-n) wird die Subpage zur Laufzeit nicht ausgeblendet, jedoch der Menüpunkt zum nächsthöheren Level deaktiviert. HideCards können auch über die Serviceseiten im Panel aktiviert werden.
* `alwaysOnDisplay` -> Steuert das Verhalten gegenüber dem Screensaver:
  * `true` -> Die Seite bleibt **permanent** sichtbar und springt nicht in den Screensaver zurück. Um in den Screensaver zu gelangen, muss man eine Seite wählen, die diesen Parameter nicht besitzt.
  * `'action'` -> Die Seite bleibt sichtbar, solange Aktivität (z. B. eine Wertänderung) stattfindet. Nach Ablauf des normalen Screensaver-Timeouts ohne Aktivität springt das Panel doch in den Screensaver zurück.
  * weggelassen / `false` / `null` -> Standardverhalten, der Screensaver greift normal.
* `useColor` -> Auf **Seitenebene veraltet** und ohne Wirkung (der Adapter wertet ihn dort nicht aus). Bei vielen Seitentypen existiert das Feld gar nicht mehr. Die Farbsteuerung erfolgt pro **PageItem** (siehe `useColor` bei den PageItem-Parametern).

## weitere Parameter für die Navigation auf der Seite  

Wenn mehr PageItems auf einer Seite definiert sind, als gleichzeitig angezeigt werden können, kann man durch die Seite blättern. Diese Blätter- und Filteroptionen (`scrollPresentation`, `scrollType`, `filterType`, `scrollAutoTiming`) stehen bei den Seitentypen **cardEntities, cardSchedule, cardGrid, cardGrid2, cardGrid3, cardThermo2** und **cardMedia** zur Verfügung (Spalte „Blättern/Filtern" in der Tabelle oben).

### Blätter-Darstellung – `scrollPresentation`

* **classic** (Standard) -> Blättert seitenweise über den rechten oberen Pfeil. Der Pfeil zeigt nach unten, solange es weitere Einträge gibt; auf der letzten Seite wechselt er in Richtung `rechts`.  
* **arrow** -> Erzeugt auf dem letzten Platz der Seite ein zusätzliches Pfeil-PageItem; durch Klick darauf wird im Kreis geblättert. Der Pfeil oben rechts für die Navigation bleibt in seiner Funktion bestehen, sodass man auch ohne durch die ganze Seite zu blättern auf die nächste Seite kommt.  
* **auto** -> **Automatisches Blättern**. Verhält sich wie `classic`, blättert aber selbsttätig nach einem festen Intervall weiter. Das Intervall wird mit `scrollAutoTiming` in Sekunden angegeben (Standard: 15 Sekunden).

### Schrittweite – `scrollType`

Legt fest, wie viele Items pro Blättervorgang weitergeschoben werden:
* **page** (Standard) -> blättert um eine volle Seite (alle sichtbaren Items).
* **half** -> blättert um eine halbe Seite. Wird nur von bestimmten Kartentypen unterstützt.

### Filtern – `filterType`

Blendet abhängig vom primären Wert eines Items nur einen Teil der Items ein:
* **'true'** -> zeigt nur Items, deren primäre Entität `true` ergibt.
* **'false'** -> zeigt nur Items, deren primäre Entität `false` ergibt.
* **`number`** (Zahl) -> zeigt nur Items, die dem angegebenen Zahlenwert entsprechen.

---  

Dann gibt es noch die Standard-Seiten `cardQR`, `cardChart`/`cardLChart`, `cardPower`, `cardAlarm` und `cardUnlock`. Sie haben im Skript eine einfache Config, da sie überwiegend in der Admin-Oberfläche des Adapters konfiguriert werden. Der `uniqueName` muss dabei dem in der Adapter-Konfiguration entsprechen. Bei der PageChart muss zum `uniqueName` auch der `type` passen (`cardChart` = Balken, `cardLChart` = Linie). Mehr zu diesem Thema auf den [speziellen Wiki-Seiten](Pages).
```typescript
    const stromChart: ScriptConfig.PageChart = {
        uniqueName: 'strom',
        type: 'cardChart' // Balkenchart
    };

    const temperatur: ScriptConfig.PageChart = {
        uniqueName: 'temperatur',
        type: 'cardLChart' // Linienchart
    };

    const powerGrid: ScriptConfig.PagePower = {
        uniqueName: 'powerpage',
        type: 'cardPower'
    };
```  

## PageItems    

Die PageItems gleichen denen aus dem Panel-Script, wobei der Adapter vieles aus den Objekten **Channel** und **State** ausliest. Deshalb reicht oft nur der Parameter `id`, um ein PageItem zu erstellen – vorausgesetzt, der Channel und die darunterliegenden States sind bezüglich Rolle, min/max bzw. Typ (number/string/…) korrekt eingestellt.

Ein PageItem wird als Objekt `{ … },` deklariert und dem `items`-Array einer Seite hinzugefügt. Was es fast immer mitbringt, ist eine **`id`**, ein **`name`** und eine **Farbdefinition**:

```typescript
{ id: 'alias.0.NSPanel_1.Luftreiniger', name: 'Luftreiniger', icon: 'power', icon2: 'power', offColor: MSRed, onColor: MSGreen },
```

Für ein PageItem, das zur **Navigation** dient, gibt man statt einer `id` die Parameter `navigate: true` und `targetPage: '<uniqueName der Zielseite>'` an:

```typescript
{ navigate: true, icon: 'home', name: 'Haus', targetPage: 'MenuGrid' },
```

Wenn alles eingestellt ist, das Skript starten und auf die Rückmeldung warten – das Skript beendet sich selbst. Dabei bedeutet `not implemented yet!`, dass etwas noch nicht eingebaut ist, und `not supported`, dass es nicht eingebaut wird. ;)

### Drei Arten von PageItems

| Art | Erkennungsmerkmal | Beschreibung |
|-----|-------------------|--------------|
| **Standard** | `id` oder `navigate`/`targetPage` | Der Normalfall. Der Adapter liest Rolle und Werte aus dem Alias bzw. Channel. |
| **Custom** | `type: 'custom'` + `id` | Reduzierter Satz an Optionen (`id`, `name`, `icon`/`icon2`, `onColor`/`offColor`, `colorScale`, `fontSize`, `buttonText`, `navigate`/`targetPage`/`targetPageLongPress`/`longPress`), keine automatische Rollenauswertung. |
| **Native** | `native: { … }` | Adapterinterne Roh-Konfiguration ohne Typprüfung (z. B. für Templates, siehe [Templates](#templates)). Optional mit `navigate`/`targetPage`. |

### Mindestangaben (Standard-PageItem)
* `id` :  Pfad zum Alias/Datenpunkt, in Hochkomma eingefasst
* `name` :  Text, der als Label auf dem Display dargestellt wird, in Hochkomma eingefasst

> [!IMPORTANT]  
> * `name` ist kein Muss, wenn der Alias richtig konfiguriert ist – dann wird der Name aus `common.name.de` gezogen.  
> * Wie man Aliase definiert und welche Möglichkeiten es gibt, dafür gibt es im Wiki separate Kapitel.

### Optionale / spezifische Angaben

#### Sichtbarkeit & Status
* `enabled` : `false` = Item dauerhaft deaktiviert (nicht anwählbar). Existiert ein Datenpunkt `<id>.ENABLED`, steuert dieser die Aktivierung zur Laufzeit.
* `filter` : numerischer Filterwert; greift zusammen mit dem `filterType` der Seite (siehe [Filtern](#filtern--filtertype)).
* `role` : überschreibt die automatisch erkannte Rolle des Items (nur in Sonderfällen nötig).

#### Icon-Farbe
* `offColor` :  Farbe für ausgeschaltet (RGB)
* `onColor` :  Farbe für eingeschaltet (RGB; bei CardChart außerdem die Balkenfarbe)
* `useColor` :  `true`/`false`. Bei `true` werden die Config-Parameter **defaultOnColor**/**defaultOffColor** verwendet, sofern keine `onColor`/`offColor` im PageItem gesetzt sind.
* `colorScale` :  Farbskala bzw. Icon-Auswahl abhängig vom Wert (siehe [Farbskala – colorScale](#farbskala--colorscale)).

> [!IMPORTANT]  
> Ohne icon-Farbe greift eine Default-Kombination. Sie kann über **defaultColor** (**defaultOnColor** & **defaultOffColor**) in der Konfiguration festgelegt werden.

#### Label & Text
* `prefixName` / `suffixName` : Text vor bzw. nach `name`.
* `prefixValue` / `suffixValue` : Text vor bzw. nach dem **Wert**.
* `buttonText` : ersetzt den Standardtext „PRESS" (z. B. auf cardEntities).
* `buttonTextOff` : abweichender Button-Text für den Aus-Zustand.
* `fontSize` : Schriftgröße **0–5** (vor allem **cardGrid2**), in Verbindung mit `useValue: true`:
  * **0** – Default – Größe 24 (keine Icons, viele Sonderzeichen)
  * **1** – Größe 32 (Icons, eingeschränkte Zeichen)
  * **2** – Größe 32 (keine Icons, viele Sonderzeichen)
  * **3** – Größe 48 (Icons, eingeschränkte Zeichen)
  * **4** – Größe 80 (Icons, eingeschränkte Zeichen)
  * **5** – Größe 128 (nur ASCII)

#### Icons
* `icon` : Icon für den An-/True-Status
* `icon2` : Icon für den Aus-/False-Status (nicht bei allen Aliasen unterstützt)
* `icon3` : zusätzliches Icon, z. B. bei Rollläden für „teilweise geöffnet"

> [!NOTE]  
> Icon-Namen müssen aus der [Icon-Datei](https://htmlpreview.github.io/?https://github.com/jobr99/Generate-HASP-Fonts/blob/master/cheatsheet.html) stammen. `icon`/`icon2` übersteuern ein per Default vom Alias geliefertes Icon. Bei vielen Aliasen ist kein `icon`/`icon2` nötig.

#### Werte & Einheiten
* `unit` : Einheit (z. B. °C) – gilt nicht für alle Alias-Rollen
* `useValue` : muss `true` sein, wenn `fontSize` genutzt wird
* `minValue` / `maxValue` : Start-/Endwert für den Slider
* `stepValue` : Schrittweite
* `modeList` : Werteliste für ein **InSelPopup** (Array von Strings)
* `inSel_Alias` : Alias-Datenpunkt für die InSel-Auswahl
* `inSel_ChoiceState` : *(veraltet)* Fokus eines gewählten Werts im InSelPopup
* `monobutton` : `true`, wenn ein echter Hardware-Taster verbaut ist (Taster wird emuliert); `false` emuliert einen Schalter.
* `customIcons` : benutzerdefinierte Icon-Liste (Sonderfälle)
* `actionStringArray` : benutzerdefinierte Action-Strings (Sonderfälle)
* `useValueConditions` : *(Experten)* String-Ausdruck zur bedingten Wertanzeige

#### Navigation, Langdruck & Subpages
* `navigate` : `true` ersetzt `id` und benötigt `targetPage`; öffnet die Zielseite.
* `targetPage` : `uniqueName` der Zielseite (Kurzdruck).
* `targetPageLongPress` : Zielseite bei **Langdruck**.
* `longPress` : Datenpunkt/Aktion bei **Langdruck**. ⚠️ `longPress` und `targetPageLongPress` dürfen **nicht** gemeinsam in einem Item gesetzt werden.

#### Licht & Media-Steuerung
* `interpolateColor` : `true` errechnet die aktuelle Farbe des Leuchtmittels.
* `colormode` : bei ALIAS RGB – `'rgb'` (Default) oder `'xy'` (XY-Farbübersetzung).
* `asControl` : bei Media-Items – `true` = direkte Steuerung (Play/Pause), `false` = Navigation zur Media-Seite.

##### PopupLight
* `minValueBrightness` / `maxValueBrightness` : Slider-Grenzen Helligkeit
* `minValueColorTemp` / `maxValueColorTemp` : Slider-Grenzen Farbtemperatur

#### Rollladen (PopupShutter)
* `secondRow` : Text für die zweite Zeile
* `minValueLevel` / `maxValueLevel` : kleinste (Down) / größte (Up) Position
* `minValueTilt` / `maxValueTilt` : kleinste / größte Lamellenstellung
* `shutterType` : Typ des Rollladens
* `shutterIcons` : eigene Icon-Definitionen (bis zu 3)
* `sliderItems` : eigene Slider-Definitionen (bis zu 3)

#### role `button` – Bestätigung
* `confirm` : Bestätigungsdialog vor dem Auslösen – entweder ein Text (String) oder ein Objekt `{ text?, icon?, color? }`.

#### CardChart-spezifisch
* `yAxis` : Name der y-Achse
* `yAxisTicks` : Werte-Skala der y-Achse (Array von Zahlen oder String)
* `xAxisDecorationId` : Datenpunkt für die Beschriftung der x-Achse
* `onColor` : Farbe der Balken

#### CardAlarm / CardUnlock / CardQR-spezifisch
* `autoCreateALias` : Das NSPanel-Skript erstellt die Datenpunkte unter `0_userdata.0` und `alias.0` automatisch, wenn `true`.
* `hidePassword` : *(CardQR)* versteckt das WLAN-Passwort auf der PageQR.

#### CardThermo-spezifisch
* `stepValue` : Schrittweite der Solltemperatur (zusammen mit `minValue`/`maxValue`)
* `iconArray` : Ersatz für die Standard-Icons im unteren Teil (Schreibweise wie `modeList`)
* `setThermoDestTemp2` : zweite Setpoint-Temperatur über zusätzlichen ALIAS-Datenpunkt (ACTUAL2)
* `icon` : Icon des Popup-Fensters

##### PopupThermo
* `popupThermoMode1` / `popupThermoMode2` / `popupThermoMode3` : Popups (obere / mittlere / untere Zeile), die über die 3 Punkte unter der Setpoint-Temperatur eingeblendet werden und Werte zur Steuerung zusätzlicher Zustände annehmen.
* `popUpThermoName` : Überschriften-Liste (Array)
* `setThermoAlias` : ALIAS-Liste (Array), die die gewählten Zustände numerisch zurückgibt

#### CardMedia (`media`-Objekt)
Eine `cardMedia`-Seite wird nicht über normale PageItems, sondern über ihr `media`-Objekt konfiguriert; die Player-Instanz ergibt sich aus dessen `id`. Wichtige Felder:
* `id` : Media-Datenpunkt (Ordner/Device/Channel) – bestimmt zugleich die Player-Instanz
* `mediaDevice` : alexa2 = Echo-Seriennummer, sonos = IP, squeezeboxrpc = Devicename
* `speakerList` : schaltbare/auswählbare Device-Namen
* `playList` : nur alexa2 und spotify-premium
* `favoriteList` : Whitelist anzuzeigender Playlists
* `equalizerList` : falls Device + Adapter eine Equalizer-Funktion bieten
* `repeatList` : z. B. `['off','context','track']` (spotify-premium)
* `volumePresets` : Lautstärke-Presets als `"name?wert"` (z. B. `["leise?5","laut?95"]`)
* `colorMediaIcon` / `colorMediaArtist` / `colorMediaTitle` : Farben für Icon / Interpret / Titel
* `minValue` / `maxValue` : Lautstärke-Grenzen

Vollständige Beschreibung auf der Seite [PageMedia](PageMedia).

### Farbskala – `colorScale`

`colorScale` färbt ein Icon abhängig von einem Wert ein. Es gibt zwei Varianten:

**Farbverlauf** (`val_min`/`val_max`):
```typescript
colorScale: {
    val_min: 0,        // Wert für die „min"-Farbe (Standard: Rot)
    val_max: 10,       // Wert für die „max"-Farbe (Standard: Grün)
    // val_best: 5,    // optional: Optimalwert; val_min/val_max werden dann Rot, val_best Grün
    // color_best: { red: 0, green: 255, blue: 0 }, // nur wirksam, wenn val_best gesetzt ist
    // mode: 'mixed',  // Mischmodus (Standard: 'mixed')
    // log10: 'max',   // optional logarithmische Skalierung ('max'/'min'), sonst linear
}
```

`mode` bestimmt die Farbmischung:
* `mixed` (Standard) – lineare Interpolation zwischen zwei RGB-Farben
* `cie` – Mischung über die CIE-Farbtabelle
* `hue` – Skalierung über Farbton/Sättigung/Helligkeit
* `triGrad` – dreifarbiger Verlauf Rot→Gelb→Grün (ignoriert eigene Farben)
* `triGradAnchor` – wie `triGrad`, verankert Gelb an `val_best`
* `quadriGrad` – vierfarbiger Verlauf Rot→Gelb→Grün→Blau (ignoriert eigene Farben)
* `quadriGradAnchor` – wie `quadriGrad`, verankert Grün an `val_best`

**Icon-Auswahl** – statt einer Farbe wird abhängig vom Wert ein anderes Icon gewählt:
```typescript
colorScale: { valIcon_min: 0, valIcon_max: 100 /*, valIcon_best: 50 */ }
```

## Basisseite mit PageItem

Wenn man ein oder – je nach Seitentyp – mehrere `PageItems` aufgebaut und dem `items`-Array hinzugefügt hat, erhält man eine Seite mit sichtbarem Inhalt:

```typescript
const name: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    heading: 'Seiten Überschrift',
    uniqueName: 'wohnzimmer',
    items: [
        { id: 'alias.0.NSPanel_1.Luftreiniger', name: 'Luftreiniger', icon: 'power', icon2: 'power', offColor: MSRed, onColor: MSGreen },
    ],
};
```

> Testet eure `PageItems` Eintrag für Eintrag – das erleichtert die Fehlersuche.

## Hardwarebutton Config  
Die beiden Hardware-Tasten unterhalb des Displays werden im `config`-Objekt über `buttonLeft` und `buttonRight` konfiguriert. Es gibt folgende Modi:

| `mode` | Wirkung | Zusätzliche Felder |
|--------|---------|--------------------|
| `'page'` | navigiert zu einer Seite | `page` (uniqueName der Zielseite) |
| `'switch'` | toggelt einen Datenpunkt zwischen `true`/`false` | `state` (boolescher Datenpunkt) |
| `'button'` | setzt einen Button-Datenpunkt kurz auf `true`; er bleibt `true`, nur der Zeitstempel ändert sich | `state` |
| `'buttonOnDelayOff'` | sofort `true`, nach Ablauf von `delay` zurück auf `false` | `state`, `delay` |
| `'buttonOffDelayOn'` | sofort `false`, nach Ablauf von `delay` zurück auf `true` | `state`, `delay` |
| `'buttonDelayOn'` | nach Ablauf von `delay` auf `true` | `state`, `delay` |
| `'buttonDelayOff'` | nach Ablauf von `delay` auf `false` | `state`, `delay` |
| `null` | Taste ohne Funktion | – |

* `delay` (nur bei den `button…Delay…`-Modi): Verzögerung in Sekunden. Standard 0,25 s, gültiger Bereich 0,001 bis 2147483 (~24 Tage).

Beispiele (für `buttonLeft`; die rechte Taste heißt `buttonRight`):

```typescript
// Zu einer Seite navigieren (page = uniqueName der Seite)
buttonLeft: { mode: 'page', page: 'main' },

// Boolean-Datenpunkt umschalten (z. B. ein Schalter)
buttonRight: { mode: 'switch', state: 'alias.0.Licht.switch' },

// Taster: setzt kurz true (z. B. Rollo-Taster, Rolle Button)
buttonLeft: { mode: 'button', state: 'alias.0.Rollo.up' },

// 30 s lang true, dann automatisch false
buttonRight: { mode: 'buttonOnDelayOff', delay: 30, state: 'alias.0.relais' },

// nach 600 s auf false setzen
buttonLeft: { mode: 'buttonDelayOff', delay: 600, state: 'alias.0.relais' },

// Taste ohne Funktion
buttonLeft: null,
```  
---
## Screensaver  
  
Beim Screensaver lassen sich mehere Layouts auswählen. Diese werden über die Serviceseiten aktiviert. Im Script, was vom Adapter automatisch angelegt wird, sind schon diverse Einträge für alle Layouts hinterlegt. Diese müssen nur etwas angepasst werden, gleichen aber im Großen und Ganzem dem Script. Weitere Details zum Screensaver in einem [eigenen Kapitel.](screensaver) 

---

## Templates  

### Einleitung

Templates bieten eine einfache Möglichkeit, häufig verwendete Anzeige- und Steuerungselemente in **PageItems** zu integrieren. 
Ein Template wird als Objekt im `items`-Array einer Seite eingebunden und stellt automatisch die passende Visualisierung und Logik bereit.

### Verwendung

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

#### Navigationserweiterung

Alle Templates unterstützen zusätzlich die Attribute `navigate` und `targetPage`. Damit kann beim Auslösen eine andere Seite geöffnet werden.  
Falls notwendig, muss `type: 'button'` ergänzt werden.

```ts
{
  navigate: true,
  targetPage: 'zielseite',
  native: { template: 'text.battery.low', dpInit: '', type: 'button' },
},
```

### Beispiele

#### Grid mit Template

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

#### Einschränkungen

- Templates stehen in `cardMedia`-Seiten **nicht** zur Verfügung.  
  Benutzerdefinierte PageItems können jedoch weiterhin genutzt werden.  
  Bei `cardMedia` ist der Suchpfad für Datenpunkte fest vorgegeben und nicht veränderbar.

- Bei Rollen muss die Schreibweise **exakt** stimmen (z. B. `indicator.lowbat`).

### Verfügbare Templates

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

### Erweiterte Anpassungen (für Experten)

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

### Wichtige Hinweise zum Schluss

1. Für den Block `native` existieren **keine Typdefinitionen** im Konfigurationsskript.  
   Der Grund: Hier wird direkt die adapterinterne Konfiguration berührt, die aufwendig ist und sich teilweise noch ändern kann.  

2. Alle beschriebenen Möglichkeiten funktionieren grundsätzlich.  
   Es kann jedoch vorkommen, dass bestimmte Optionen noch nicht im Konfigurationsskript eingebaut sind.  
   Das Hinzufügen ist meist in wenigen Minuten erledigt – bitte einfach Bescheid sagen, wenn etwas fehlt oder nicht wie erwartet funktioniert.

---

## Hinweis: ack-Verhalten der Datenpunkte

Der Adapter reagiert in **0_userdata.0** und **alias.0** auf jede Änderung (`ack=true` oder `ack=false`) eines abonnierten Datenpunktes. Ansonsten gilt:
- **Außerhalb** des Adapter-Namespace (`nspanel-lovelace-ui.0`) reagiert der Adapter auf `ack=true` und setzt Datenpunkte mit `ack=false`.
- **Innerhalb** des Adapter-Namespace reagiert der Adapter auf `ack=false` und setzt Datenpunkte mit `ack=true`.

> **Farbthemen:** Die Farbthemen für PageItems werden im Admin auf der 2. Seite unter der Tabelle gepflegt – siehe [User Farbthema](ColorThemes).
