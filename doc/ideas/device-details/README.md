# Gerät mit Details

Stand: 2026-11-22 – Konzept entschieden, Adapter und Admin im Branch `feat/device-details` umgesetzt; die Detailseite
ist eine normale **cardEntities**-Seite. cardEntities2 (5 Zeilen) gibt es nur als vorbereitete HMI-Seite, nicht im
Adapter, Admin oder Web-Panel.

## Ausgangslage

Ein Nutzer möchte viele „unwichtige“ Gerätedaten auf dem Panel sehen: Temperatur, WLAN-Qualität, Batterie,
Spannung, Strom, Leistung, Firmware usw. Mit den festen Alias-Kanälen müsste er dafür jeden Wert einzeln
konfigurieren. Die festen Kanäle bleiben, wie sie sind. Für den Kleinkram kommt ein generischer Weg dazu.

## Idee in einem Satz

Ein neues Page-Item zeigt ein beliebiges Gerät (Channel oder Device im Objektbaum). Ein kurzer Tipp schaltet es oder
öffnet sein Popup, ein langer Druck öffnet eine automatisch erzeugte Detailseite mit allen gewählten Werten des
Geräts.

## Bedienung am Panel

| Seite | Kurz | Detailseite |
|---|---|---|
| cardGrid / cardGrid2 / cardGrid3 | wie bisher (`buttonPress2`) | Long-Press (`buttonPress3`, gibt es schon) |
| cardEntities | rechte Schaltfläche (Schalter usw.) wie bisher | Tipp links auf Icon/Bezeichnung → `buttonPress3` (HMI-Änderung 1) |

- Auf den Grid-Seiten fällt ein nicht behandelter Long-Press weiterhin auf den Kurz-Druck zurück. Dort kann ein
  Long-Press auch einfach „der Finger lag zu lange“ sein.
- Auf cardEntities tippt man die linke Fläche bewusst an. Ohne Long-Press-Behandlung passiert dort
  **nichts**, kein Rückfall auf den Kurz-Druck.
- Long-Press wird für cardEntities im Adapter freigegeben (Admin, Skript-Konvertierung). Bis zur neuen HMI kommt auf
  cardEntities nur nichts an.

## Die Detailseite

- Seitentyp **cardEntities** mit deren Zeilenzahl (eu/us-l 4, us-p 5, web-l 4, web-p 8), echte Bedienelemente, zur
  Laufzeit erzeugt (Vorbild: temporäre Seite des Sonos-/Squeezebox-Speakers in
  `src/lib/pages/pageItem.ts`). Die Konfiguration der Seite ist nicht editierbar, die Seite selbst kann schalten.
- Überschrift = Name des Geräts.
- **Klassisch blätterbar** (`scrollPresentation: 'classic'`, `PageMenu.getOptions`).
- Zurück führt zur Seite, von der aus sie geöffnet wurde.
- States nur abonnieren, solange die Detailseite sichtbar ist (ein Shelly RGBW hat 182 States).

### Zeilen

| State | Zeilentyp auf cardEntities | Bedienung |
|---|---|---|
| boolean, `write: true` | `switch` | Schalter rechts (`OnOff`) schaltet |
| boolean, nur lesbar | `text`, An/Aus (übersetzt) | nichts |
| `read: false` (Button) | `button` („drücken“) | Knopf rechts (`button`) schreibt `true` |
| number/string, `write: true`, mit `common.states` | `input_sel`, zeigt den (übersetzten) Text des aktuellen Werts | Tipp öffnet `popupInSel` mit den Texten, die Auswahl schreibt den Schlüssel (number als Zahl) |
| number/string mit `common.states`, nur lesbar | `text`, (übersetzter) Text des Werts, ohne Einheit | nichts |
| number (auch `write: true`) | `text`, Wert mit Einheit | nichts – Zahlen werden nicht per Slider bearbeitet |
| string | `text`, nur lesbar | nichts |

`common.states` zählt als Objekt oder Array mit mindestens einem Eintrag (`hasCommonStatesList`). Die alte
String-Form `"0:aus;1:an"` wird wie überall zur Laufzeit (`StatesController.getCommonStates`) nicht ausgewertet: so
ein State ist eine normale Wert-/Textzeile.

Ein Tipp links (Icon/Name) sendet auf diesen Zeilen `buttonPress3` und tut nichts.

- Es wird nichts automatisch ausgeblendet. Was erscheint, bestimmt allein die Filterliste.
- Icon aus der Maske bzw. Rolle (Thermometer, Blitz, WLAN, Batterie …), Name übersetzt über `getTranslation`.
- Nicht pro Zeile einstellbar (erste Version): Icon und Farbe.

#### Batterie-Füllstand: Icon nach Wert

Der Maskeneintrag `battery` (Rolle `value.battery`, Zahl in Prozent) zeigt kein festes Icon, sondern eines nach dem
Füllstand. Dafür wird das Lese-Skript des vorhandenen Batterie-Templates wiederverwendet (`BATTERY_ICON_READ` in
`src/lib/templates/text.ts`, dieselbe Konstante nutzt `text.battery`): das Icon der Zeile ist ein `triggered`-Datenpunkt
auf dem State mit diesem Skript (`deviceDetailRowIcon`), es wird also bei jeder Wertänderung neu gesendet.

| Wert (auf Zehner gerundet) | Icon |
|---|---|
| unter 5 | `battery-outline` |
| 5 bis unter 15 | `battery-10` |
| 15 bis unter 25 | `battery-20` |
| … je 10 weiter … | `battery-30` … `battery-80` |
| 85 bis unter 95 | `battery-90` |
| ab 95 (und ohne Zahlenwert) | `battery` |

- Gilt für jede Zeile, deren Eintrag `battery` ist und deren State eine Zahl ist: Detailseite, auf der Geräteseite
  info-, value-, progress- und status-Slots. Ein State ohne Schlüssel mit Rolle `value.battery` (z. B. ein
  benutzerdefinierter Datenpunkt, `custom: 'state'`) wird über die allgemeine Maske genauso erkannt.
- Die Farbe bleibt die der Gruppe (Energie) – sie hängt nicht vom Wert ab. Wer das will, setzt im „…“-Dialog des Slots
  einen Farbverlauf.
- Ein eigenes Icon des Slots (`trueIcon`, das ältere `icon` eines status-Slots) hat Vorrang: dann gibt es keine Stufen.
- Keine Ladeerkennung, `batteryVoltage` und `lowBattery` behalten ihr festes Icon. Der Wert wird als Prozent gelesen,
  `common.min/max` zählen nicht.

### Zweite Namenszeile

- Haben mehrere angehakte Zeilen einer Detailseite denselben angezeigten Namen (Shelly Plus 1PM: `Relay0.temperatureC`
  und `Ext.temperature100C` … `104C` heißen alle „Temperatur“), bekommt jede davon eine zweite Namenszeile. Zeilen
  ohne Dublette bekommen keine.
- Automatischer Text (`deviceDetailSubNames`, Entscheidung 2026-11-22): innerhalb einer Gruppe gleichnamiger Zeilen
  werden die IDs unterhalb des Geräts verglichen, und nur die Unterschiede werden der Zusatz.
  - Zerlegung (`deviceDetailSubNameTokens`): jeder Ordner-Teil (alles vor dem letzten Punkt, an `.` getrennt) bleibt
    ein Teil; die End-ID wird in Buchstaben- und Ziffernfolgen zerlegt, auch an CamelCase-Grenzen
    (Groß-/Kleinschreibung bleibt, `_`, `-` usw. trennen nur). `Ext.temperature100C` → `Ext`, `temperature`, `100`,
    `C`; `Relay0.temperatureC` → `Relay0`, `temperature`, `C`.
  - Teile, die in allen Zeilen der Gruppe vorkommen, fallen weg; die übrigen in Originalreihenfolge mit Leerzeichen
    verbunden sind der Zusatz.
  - Ist ein Zusatz danach leer oder in der Gruppe nicht eindeutig, bekommen die betroffenen Zeilen die volle ID
    unterhalb des Geräts.
  - Beispiele: `Ext.temperature100C` / `Ext.temperature101C` → „100“ / „101“; `Ext.temperature100C` /
    `Ext.temperature100F` → „C“ / „F“; `Relay0.temperatureC` / `Ext.temperature100C` / `Ext.temperature101C` →
    „Relay0“ / „Ext 100“ / „Ext 101“; `Relay0.Power` / `Relay1.Power` → „Relay0“ / „Relay1“.
  - Zeilen ohne Dublette haben als automatischen Text (nur Platzhalter, nicht angezeigt) die ID unterhalb des Geräts.
- Admin: in der Filterliste bei jeder angehakten Dublette ein Feld „2. Zeile“ mit dem automatischen Text als Platzhalter;
  ein eigener Text wird im Eintrag gespeichert (`DeviceDetailEntryConfig.subName`) und gilt immer, auch ohne Dublette.
  Das Feld erscheint nur bei Dubletten und bei Zeilen mit eigenem Text (damit er sichtbar und löschbar bleibt) – bei
  einem Shelly mit 78 States bleibt die Liste sonst übersichtlich.
- **Panel: einzeilig angehängt.** Das Namensfeld `tEntity1..4` von cardEntities ist auf eu und us-l nur 30 px hoch
  (Font 0 = 24 px, `isbr=0`, 184 px breit) – zwei Zeilen (CR LF) passen nicht, und zu hoher Text wird von der Nextion
  gar nicht gezeichnet. Entscheidung 2026-11-22: keine HMI-Änderung dafür. Der Adapter hängt den Text von
  `deviceDetailSubNames` deshalb mit Leerzeichen an den Namen an (`deviceDetailRowNames`: „Temperatur Relay0“,
  „Temperatur Ext 100“), gleiche Basisnamen und gleiche Dubletten-Erkennung wie die Filterliste. Ein eigener Text
  (`subName`, geht über `deviceDetailsRuntimeOf` in die Laufzeit) wird auch ohne Dublette angehängt. Das Web-Panel
  zeigt denselben Namen.
- **Kürzen, damit der Zusatz sichtbar bleibt** (Entscheidung 2026-11-22, `deviceDetailNameWithSuffix`): Passt
  „Name Zusatz“ nicht ins Namensfeld des Modells, kürzt der Adapter nur den Namen und setzt das Auslassungszeichen
  selbst; der Zusatz bleibt vollständig, ein Leerzeichen dazwischen bleibt. Font 0 hat kein „…“ (HMI 6.1.1/6.2.0),
  daher „...“ wie bei `fitText`; Leerzeichen vor den Punkten fallen weg. Gemessen mit den Zeichenbreiten aus
  `text-width.ts` (Font 0), Feld je Modell (`DEVICE_DETAIL_NAME_FIELD`):

  | Modell | Feld | Grund |
  |---|---|---|
  | eu, us-l | 184 px, 1 Zeile | `tEntity` 184 × 30 px, `isbr=0` |
  | us-p | 115 px, 2 Zeilen | `tEntity` 115 × 53 px, `isbr=1`: die Nextion bricht zeichenweise um; der Adapter prüft, ob der Text zeichenweise umbrochen in zwei Zeilen passt (kein CR LF) |
  | web-l | 184 px, 1 Zeile (eu-Tabellen) | bildet eu nach; das Web-Panel hat mehr Platz, dort wird nie gekürzt |
  | web-p | 115 px, **1 Zeile** (us-p-Tabellen) | bildet us-p nach, bricht den Namen aber nicht um (`nowrap`); 115 px Font 0 (24 px) ≈ 86 px bei den 18 px des Web-Panels, das passt in dessen Namensfeld (121 px bei Textzeilen) auch mit breiterer Ersatzschrift |

  - Beispiele (echte Ergebnisse): eu/us-l/us-p/web-l: „Temperatur 100“ (134 px), „Temperatur Ext 100“ (165 px) und
    „Temperatur Relay0“ (159 px) passen ungekürzt; „Luftfeuchtigkeit Ext 100“ (203 px) → eu „Luftfeuchti... Ext 100“,
    us-p ungekürzt (zwei Zeilen). web-p: „Temper... 100“, „Te... Ext 100“, „Tem... Relay0“.
  - Grenzfall: passt vor Zusatz und „...“ nicht einmal ein Zeichen des Namens, zeigt die Zeile nur den Zusatz
    (eu: „Signalstärke“ + „Wohnzimmer Decke“ → „Wohnzimmer Decke“). Ist der Zusatz allein schon breiter als das Feld,
    schneidet ihn das Feld wie bisher am Ende ab (kein Kürzen durch den Adapter).
  - Zeilen ohne Zusatz werden nicht gekürzt, das Feld schneidet sie wie jede andere cardEntities-Zeile ab.

### Farben

- An/Aus nutzt die vorhandenen Theme-Farben für aktiv/inaktiv.
- Werte: wenige **neue Theme-Keys pro Gruppe**, nicht pro Eintrag: Energie (V/A/W/Wh), Klima (Temperatur/Feuchte),
  Verbindung (WLAN/Erreichbarkeit/IP), Info (Firmware/Version/Text). Hat ein Template schon einen passenden Key
  (z. B. Temperatur), wird der wiederverwendet.
- Die Maske ordnet jeden Eintrag einer Gruppe zu.

## Auswahl des Geräts

- Wählbar sind nur Objekte vom Typ `device` oder `channel`, nie Instanz oder Adapter-Wurzel (kein `shelly.0`).
- Eingesammelt wird das Gerät selbst plus **höchstens ein Unterordner** (`Relay0.Power`, `:1.STATE`).
- Für bekannte Adapter legt eine Maske fest, auf welcher Ebene ein Gerät liegt.

## Masken (bekannte Adapter)

Eine Maske beschreibt die Einträge der Filterliste. Jeder Eintrag hat einen lesbaren Namen (Volt, Ampere, Watt,
WLAN, Firmware …), eine Farbgruppe, ein Icon und eine **Regel im Template-Stil**: erst nach `role`, und wo die Rolle
nicht trägt nach End-ID (`dp`), wie die Einträge in `src/lib/templates/`. Beispiele aus dem echten ioBroker:

| Eintrag | Regel |
|---|---|
| Spannung | `role: value.voltage` |
| WLAN | `role: value`, `dp: .rssi` (Shelly) / `role: value.rssi` (Sonoff, HomeMatic) |
| Firmware | `role: state`, `dp: .version` (Shelly) / `role: info.firmware` (Sonoff, WLED) |
| Temperatur | `role: value.temperature`, `dp: .temperatureC` (Shelly liefert jede Temperatur als °C- und °F-Paar) |

Für unbekannte Adapter gibt es eine allgemeine Maske, die nur nach Rolle zuordnet.

### Befund aus dem produktiven ioBroker (allObjects.json, 2026-11-21)

- Geräte liegen bei shelly, sonoff, zigbee2mqtt, hm-rpc und tuya auf Ebene 3 (`<adapter>.0.<gerät>`), darunter
  höchstens ein Unterordner. WLED geht bis 4 Ebenen tief, matter/homekit-controller tiefer.
- 53–99 % der States haben generische Rollen (`state`, `value`, `text`, `level`). Nur nach Rolle geht es daher nicht.
- Shelly Plus 1PM: 78 States, viele davon Konfiguration (Mqtt, Sys, Limits, AutoTimer) und 5 meist leere
  `Ext.temperature`-Plätze (je °C und °F).

## Admin

- **Admin-only**, kein Skript-Weg.
- Eigener Page-Item-Typ neben „Datenpunkt“ und „Template“. Dort wählt man den Channel/das Device.
- Kurz-Klick: wahlweise einen State als An/Aus oder ein Popup (z. B. Licht).
- Ein Button öffnet die **Filterliste**:
  - Einträge der Maske (bzw. der allgemeinen Maske) plus die gefundenen States, hinter denen nur ein State steht.
  - Je Eintrag ein Häkchen. Der Nutzer sieht den **gefundenen State**, nicht die Regel (Rolle/End-ID) dahinter, und
    kann den State austauschen – auch bei bekannten Adaptern.
  - Bei unbekannten Adaptern kann er zusätzlich States aussuchen und Einträgen zuordnen. Die Rolle schlägt die
    Zuordnung vor.
  - **Reihenfolge per Drag & Drop**. Sie gilt auch für die Detailseite.
- **Häkchen pro Item gespeichert, Vorbelegung pro Adapter gelernt**: Ein neues Item bekommt als Vorbelegung, was der
  Nutzer bei diesem Adapter (Shelly, zigbee2mqtt …) zuletzt angehakt hat.
- Die Objektliste holt der Admin per `sendTo` vom Adapter.

## HMI-Änderungen

1. **cardEntities** (und die vorbereitete cardEntities2), `m0`–`m3` / `m0`–`m4` (Icon/Bezeichnung): Typen ohne Popup senden
   `event,buttonPress3,<entn>,button` (vorher nichts, bei `text` `buttonPress2`). Umgesetzt mit
   `HMI/tools/entities2_five_rows.py`.
2. Vorbereitete Seite **cardEntities2** = cardEntities mit 5 Zeilen (`pageType~cardEntities2`, `entityUpd` mit einer Zeile
   mehr, Zeile 5 = Felder 38–43). Ersetzt die frühere Idee, cardSchedule für die Detailseite zu ändern (Typ `number`
   mit Wert, Tipp öffnet `popupSlider`) – das entfällt, **cardSchedule bleibt unverändert**.

3. Geräteseiten **cardDevice1–3** (Steuern / Fortschritt / Werte): Protokoll, Elementarten und Geometrie in
   [device-page-hmi.md](device-page-hmi.md), Werkzeug `HMI/tools/card_device.py`.

### cardEntities2 ist nicht im Adapter

- cardEntities2 existiert nur in der HMI (Werkzeug `HMI/tools/entities2_five_rows.py`). Adapter, Admin und Web-Panel
  kennen die Seitenart vorerst nicht: keine Seitenart im Admin, keine Versionsweiche nach TFT-Version, die Detailseite
  ist cardEntities.

## Umsetzung (feat/device-details)

- **Item-Typ:** eigener Typ „Gerät mit Details“ im Page-Item-Dialog (Auswahl „Art des Items“ oben: Standard / Gerät mit
  Details), nur auf cardGrid/cardGrid2/cardGrid3 und cardEntities. Kurz-Tipp:
  - „State des Geräts“: Auswahl aus den schreibbaren boolean-States des Geräts (vorbelegt mit dem State des
    Masken-Eintrags `switch`); ein schaltbarer State wird umgeschaltet, ein Taster (`read: false`) bekommt `true`.
    Gespeichert als benutzerdefinierter Knopf (`type: 'custom'`, `channelId` = State).
  - „Keine“: Kurz-Tipp tut nichts, nur der Long-Press öffnet die Details (Laufzeit-Item vom Typ `text`). Vorauswahl,
    wenn ein neues Gerät keinen `switch`-State hat.
  - „Navigation“: Kurz-Tipp öffnet eine Zielseite (gespeichert als Navigations-Item mit `targetPage`).
  - „Popup eines Alias-Kanals“: das Popup braucht die Rollen eines Alias-Kanals, der Kanal wird nur in diesem Fall gewählt;
    gespeichert als Standard-Item (`channelId` = Kanal).
  - „Geräteseite öffnen“ (`shortPress: 'devicePage'`): der Kurz-Tipp öffnet, was sonst der Long-Press öffnet – siehe
    Abschnitt Geräteseite, „Kurz-Tipp öffnet die Geräteseite“.
  - Ohne eigenen Namen zeigen „Keine“ und „Navigation“ den Namen des Geräts.
  - Gespeichert in `AdminPageItemConfig.device` (`deviceId`, `shortPress`, `entries` = angehakte Zeilen in Reihenfolge).
- **Gerät:** nur `device`/`channel`, nie Instanz, Adapter-Wurzel oder Info-Kanal (`<adapter>.<n>.info`); bekannte
  Adapter legen die Ebene fest (3). sendTo `getDeviceDetails` liefert die States (Gerät + höchstens ein Unterordner).
  Ohne Antwort (Adapter aus) oder bei gelöschtem Gerät bleibt ein Item speicherbar.
- **Masken:** `src/lib/types/deviceDetails.ts` – shelly (Gen1 und Gen2), sonoff, zigbee2mqtt, hm-rpc, dazu die
  allgemeine Maske nur nach Rolle. Zeilennamen: Übersetzungsschlüssel `deviceDetail_<key>`.
- **Gelernte Vorbelegung:** eigenes natives Attribut `deviceDetailsLearned` (Adapter → Einträge in Reihenfolge). Es
  ändert sich nur, wenn der Nutzer im Dialog die Filterliste des Geräts übernommen hat und sich beim Speichern des Items
  Häkchen oder Reihenfolge ändern; nur vorbelegte Einträge (gelernt, Maske, Adapter ohne Antwort) lehren nichts. Es
  bleibt beim Löschen von Items erhalten. „Nichts angehakt“ ist eine gültige Vorbelegung.
- Die Filterliste zeigt genau die Einträge des Items (leer = nichts angehakt); gelernte Vorbelegung bzw. Maske kommen
  schon mit der Antwort des Adapters in die Einträge. Mehrere Antworten für dasselbe Gerät (Tab und erneutes Anzeigen
  nach Wechsel der Art) wendet der Dialog nacheinander auf den jeweils neuesten Stand an (`setState`-Updater, Gerät
  der Einträge im State).
- **Theme-Keys:** `deviceEnergy`, `deviceConnection`, `deviceInfo` (neu, Farbgruppe „Zustände“), Klima nutzt
  `temperature`; An/Aus `activated`/`deactivated`.
- **Detailseite:** cardEntities, Seiten-ID `dd_<Seite>`, Zeilen mit Rolle `deviceDetail`. Zwei sich überschneidende Long-Presses
  öffnen nur die letzte Seite; die alte Seite wird erst nach dem Wechsel gelöscht.
- Zeilen: `switch`/`button`/`input_sel`/`text` mit den Feldformaten von cardEntities (kein eigenes Format, kein
  `popupSlider` vom Adapter, kein Slider für Zahlen); `input_sel` nutzt den vorhandenen Weg über `popupInSel`
  (`PageItem.getListFromStates` / `setListCommand`).
- cardEntities: ein unbehandelter `buttonPress3` fällt nicht auf den Kurz-Druck zurück.
- **Filterliste:** angehakte Einträge stehen oben in ihrer gespeicherten Reihenfolge, darunter die nicht angehakten.
  Anhaken setzt einen Eintrag ans Ende der angehakten, Abhaken an den Anfang der nicht angehakten
  (`tickDeviceDetailRow`); Verschieben bleibt im eigenen Block (`tickedDeviceDetailRowsFirst`).
- **Radiobuttons im Page-Item-Dialog** (Art des Items, Kurz-Tipp): Umschalten verliert nichts – die Felder der
  verlassenen Option (State, Kanal, Zielseite, Gerät mit Filterliste) werden bis zum Schließen gemerkt und kommen beim
  Zurückschalten wieder (`src-admin/src/itemOptionStash.ts`). Der Dialog hält immer nur die Felder der gewählten
  Option; Übernehmen speichert nur diese, Abbrechen verwirft alles.

## Geräteseite

Stand: 2026-11-23 – Adapter und Admin im Branch `feat/device-page` (Web-Panel folgt). HMI-Seiten und Feldmaße:
[device-page-hmi.md](device-page-hmi.md) (Branch `feat/device-page-hmi`).

Optional öffnet der Long-Press statt der Detailseite eine **Geräteseite** (cardDevice1/2/3): großes Geräte-Icon
(main), feste Slots, eine breite Statuszeile und unten rechts ein „i“, das die Detailseite öffnet. Die Seite ist
generisch (Waschmaschine, Saugroboter, Rasenmäher, Pkw …), Icons und Farben kommen vom Adapter.

### Konfiguration

`AdminPageItemConfig.device.devicePage` (`DevicePageConfig` in `src/lib/types/deviceDetails.ts`); fehlt das Feld,
bleibt alles wie bisher.

```ts
devicePage?: {
    layout: 1 | 2 | 3;                         // cardDevice1 / cardDevice2 / cardDevice3
    slots: (DevicePageSlotRef | null)[];       // ein Eintrag je Slot des Layouts, null = leer
    showInfo: boolean;                         // „i“ zur Detailseite
    icon?: string;                             // MDI-Name des großen Icons, fehlt = Icon des Items
    status?: DevicePageStatusRef;              // State der Statuszeile, fehlt = leere Zeile
}
// DevicePageStateRef = DeviceDetailEntryConfig & { icon?: string }:
//   { key: Masken-Eintrag ('' = ohne), id: State, subName?: eigener Zusatz, icon?: älteres Icon der status-Slots }
// DevicePageSlotRef = DevicePageStateRef & DevicePageSlotLook & { custom?: 'state' | 'channel' }:
//   ohne custom        = State des Geräts (wie bisher)
//   custom: 'state'    = benutzerdefinierter Datenpunkt (beliebiger State, key '')
//   custom: 'channel'  = Alias-Kanal (id = Kanal, key '')
//   mit custom darf id '' sein (gewählt, noch nichts eingetragen) – der Slot bleibt dann leer
// DevicePageSlotLook („Einstellungen des Elements“, Feldnamen wie AdminPageItemConfig), alles optional:
//   trueIcon?, falseIcon?: MDI-Name; trueColor?, falseColor?: '#rrggbb';
//   scale?: IconColorElement (Farbverlauf); longPress?: State-ID, die ein Long-Press schreibt
// DevicePageStatusRef = DevicePageStateRef & { custom?: true }:
//   custom: true = benutzerdefinierter Datenpunkt (beliebiger State, auch außerhalb des Geräts, key ''),
//   id darf dann '' sein (gewählt, aber noch nichts eingetragen); ohne custom = State des Geräts wie bisher
```

- Verweisform wie die Zeilen der Detailseite: Icon, Name und Farbgruppe kommen aus der Maske (`key`), der State aus
  `id`. Ein Slot darf jeden State des Geräts zeigen, er muss nicht für die Detailseite angehakt sein.
- Normalisierung `devicePageConfigOf`: unbekanntes Layout → 1, Slots auf die Länge des Layouts gekürzt/mit `null`
  aufgefüllt (ungültige oder ohne State → `null`), `showInfo` nur bei `false` aus, leeres Icon/leerer Status entfällt.
  Ein gespeichertes Layout 1 von vor den Status-Icons (6 Slots) bekommt so die Status-Slots leer dazu. Das ältere
  `icon` eines Verweises bleibt nur auf einem `status`-Slot (getrimmt, leer entfällt), Statuszeile und andere Slots
  verlieren es. Beim Layoutwechsel (`fitDevicePageSlots`) bleiben die Slots nach Position, nichts wird neu geraten
  (auch dort fällt das ältere Icon weg, wenn der Slot keine `status`-Art mehr ist).
- Slots mit `custom`: `id` getrimmt, `key` immer `''`, bleiben auch mit leerer `id` gespeichert; die Laufzeit
  (`deviceDetailsRuntimeOf`) macht daraus einen leeren Slot. Unbekannte Werte von `custom` gelten als State des Geräts.
- Einstellungen des Elements (`DevicePageSlotLook`): bleiben auf jeder Slot-Art und beim Layoutwechsel erhalten; Icons
  getrimmt, Farben nur als `#rrggbb`, `scale` nur wenn gültig (`isIconColorScaleElement`). Das ältere `icon` gilt als
  Icon für beide Zustände, solange `trueIcon`/`falseIcon` fehlen (`devicePageSlotLookOf`); sind sie gesetzt, entfällt es.
- Statuszeile mit `custom: true`: bleibt auch mit leerer `id` gespeichert (die Auswahl im Admin springt nicht auf
  „leer“ zurück), die `id` wird getrimmt, `key` ist immer `''`. Zur Laufzeit gibt es mit leerer `id` keine Statuszeile
  (`deviceDetailsRuntimeOf` lässt `status` weg). Der Adapter liest nur `id` und `common` des States – ob er unter
  `deviceId` liegt, spielt keine Rolle; ein nicht vorhandener State wird wie ein fehlender Slot gemeldet (warn), die
  Zeile bleibt leer.
- Laufzeit (`deviceDetailsRuntimeOf` → `DeviceDetailsRuntime.devicePage`, `DevicePageRuntime`): zusätzlich der Kurz-Tipp
  des Items; `showInfo` nur, wenn das Gerät angehakte Detail-Einträge hat.
- Vorbelegung (`defaultDevicePageConfig` / `defaultDevicePageSlots`): nur die `info`-/`value`-Slots der Reihe nach aus
  den angehakten Einträgen; `button`, `switch`, `progress`, `status` und die Statuszeile bleiben leer – nicht raten.

### Layouts und Slot-Arten

Zentrale Tabelle `DEVICE_PAGE_LAYOUTS`, Feldbreiten `DEVICE_PAGE_FIELDS` (beide geteilt mit Admin/Web):

| Layout | Slots |
|---|---|
| 1 „Steuern“ | info, info, button, button, button, button, status, status, status, status |
| 2 „Fortschritt“ | value, progress, info, info, info, button |
| 3 „Werte“ | info × 6, switch, switch |

| Art | zulässige States (`devicePageSlotAccepts`) | Element | Feld 6 | Tipp |
|---|---|---|---|---|
| info | alle | Textzeile der Detailseite (nur lesbar); schreibbar mit `common.states` → `input_sel` | Wert mit Einheit / Text aus `common.states` / An-Aus | `input_sel` öffnet popupInSel, sonst nichts |
| value | alle | `text` | Wert wie die Textzeile (keine eigene Dauer-Formatierung) | keiner |
| progress | number | `text` (Rolle `devicePageProgress`), Feld 4 = Balkenfarbe (Farbgruppe) | ganze Zahl 0–100: über `common.min/max` skaliert, ohne direkt, begrenzt (`devicePageProgressPercent`) | keiner |
| button | `read: false` oder schreibbarer boolean | `button` | wie cardGrid (`1`/`0`) | `read: false` schreibt `true`, boolean wird umgeschaltet |
| switch | schreibbarer boolean | `switch` | `0`/`1` | `OnOff` wie cardEntities |
| status | alle | `text`, nur Icon (Feld 3) und Farbe (Feld 4) wie die Info-Zeile desselben States (boolean: Farbe aktiviert/deaktiviert), eigenes Icon `icon` ersetzt es; Batterie-Füllstand: Icon nach Wert (siehe „Batterie-Füllstand: Icon nach Wert“); Name (Feld 5) leer | leer | keiner |

- **Status-Icons (Layout 1):** die Anzahl folgt nur aus `DEVICE_PAGE_LAYOUTS[1]` (HMI: 2×2-Raster rechts neben main).
  Sind alle leer, zeigt die HMI die Seite wie bisher (Info-Zeilen breit); ist mindestens einer belegt
  (`devicePageHasStatusIcons`), stehen alle Rasterzellen (leere als leere Zelle) und die Info-Zeilen werden schmal.
  Die Feldbreiten dafür stehen in `DEVICE_PAGE_FIELDS[1].slotsWithStatus` (info: Name 86 px, Wert 110 px; sonst 164/110),
  `devicePageSlotFields(layout, kind, withStatusIcons)` wählt die passende Angabe.
- Die Namen der Slots (Dubletten-Zusatz) werden nur unter den Slots mit Namen bestimmt – ein Status-Icon zählt nicht mit.
- `PageDevice` leert Feld 5/6 jedes `status`-Elements zusätzlich (`devicePageStatusIconElement`), leer → `~~~~~`.

Ein State, der nicht (mehr) existiert oder nicht zur Art passt, lässt den Slot leer (Warnung im Log).

### Benutzerdefinierte Slots

Jeder Slot kann statt eines States des Geräts etwas Eigenes zeigen (`custom`); Anordnung und Art der Slots bleiben fest.

- **Datenpunkt** (`custom: 'state'`): ein beliebiger State, auch außerhalb des Geräts. Er verhält sich wie ein
  Geräte-State ohne Masken-Eintrag: Name aus `common.name`, Icon/Einheit/Format nach Typ und Rolle, zulässig nach
  `devicePageSlotAccepts` (Tabelle oben). Der Adapter liest nur `id` und `common`.
- **Alias-Kanal** (`custom: 'channel'`): der Kanal wird über die vorhandene Kette zum normalen Page-Item
  (`devicePageChannelAdminItem` → `adminPageItemToScriptItem` → `ConfigManager.getPageItemConfig`, Seitenart
  `cardGrid`) – Icon, Farben, Name, Tipp und Popup wie auf einer Grid-Seite. Gebaut wird beim Konfigurieren des Items
  (`devicePageChannels` in `convertAdminPageItemToPageItemConfig`), abgelegt am Laufzeit-Item als
  `devicePageChannels` (Slot-Index → `{ role, item }`); die Geräteseite selbst entsteht weiter erst beim Öffnen. Ein
  Kanal, den es nicht gibt, dessen Rolle nicht zum Slot passt oder den der ConfigManager ablehnt (fehlende
  Datenpunkte), lässt den Slot leer und steht in den Meldungen der Konvertierung (beim Start als Warnung im Log,
  siehe „Meldungen der Konvertierung“); das Item bleibt gültig.
- **Navigation** (`custom: 'navigation'`): kein State, nur Icon, Name und Zielseite – siehe „Navigation aus einem
  Slot“.

Welche Rolle in welche Slot-Art darf (`DEVICE_PAGE_CHANNEL_ROLES` / `devicePageSlotAcceptsChannel`): Alle Slots lassen
sich wie eine cardGrid-Zelle antippen (HMI ab `device5`), die Art begrenzt nur, was Feld 6 zeigen kann.

| Rolle des Kanals | Typ des Elements | info / value: Feld 6 | progress | button | switch | status | Tipp |
|---|---|---|---|---|---|---|---|
| socket, light | `switch` (kein Popup) | An / Aus (übersetzt) | – | `0`/`1` | `0`/`1` | ja | schaltet um; switch-Slot `OnOff` |
| dimmer, hue, rgb, rgbSingle, ct | `light` | An / Aus | – | `0`/`1` | `0`/`1` | ja | schaltet um, Halten → popupLight; switch-Slot `OnOff` |
| level.mode.fan | `fan` | An / Aus | – | `0`/`1` | `0`/`1` | ja | schaltet um, Halten → popupFan; switch-Slot `OnOff` |
| slider, volume | `number` | die Zahl (ohne `\|min\|max`) | 0–100 aus `Wert\|min\|max` | leer | – | ja | Halten → popupSlider |
| select | `input_sel` | Text der Auswahl | – | leer | – | ja | popupInSel sofort |
| level.timer | `timer` | Zeit / Text | – | leer | – | ja | popupTimer sofort |
| blind, gate, lock | `shutter`/`shutter2` | nur info: leer (nie die Icon-Liste des Popups); value nicht zulässig | – | leer | – | ja | popupShutter sofort |
| button | `button` | nur info: leer; value nicht zulässig | – | `0`/`1` | – | ja | schreibt `true` |
| temperature, humidity, thermostat, airCondition, motion, door, window, info, warning (auch `value.*`) | `text` | Wert mit Einheit bzw. Text | – | `0`/`1` oder leer | – | ja | keiner |

- `media`, `timeTable`, `sensor.alarm.flood`: nie (brauchen eine eigene Seite bzw. ein Template).
- **Feld 6** passt `PageDevice` beim Senden an die Slot-Art an (`devicePageChannelElement`, nur für Kanal-Slots –
  `cardDeviceDataItemOptions.channelSlots`): die HMI zeichnet je Slot-Art und kennt den Typ nicht.
- **Steckdose / einfaches Licht:** `getPageItemPayload` macht die Rollen `light` und `socket` jetzt auch auf den
  Geräteseiten zum Typ `switch` (`isCardDeviceType`, wie auf den Grid-Seiten) – sonst öffnete ein gehaltenes einfaches
  Licht popupLight. Der Kanal `socket` ist ohnehin ein `switch`-Item.
- **Text-Items** (Sensoren) zeigen in info/value/status ihr Icon, nicht wie auf cardGrid den Wert an Stelle des Icons;
  der Wert steht in Feld 6. Ein Text-Item ohne Werttext (thermostat) bekommt den Wert seines Icon-Texts als `entity2`
  (`devicePageChannelSlotItem`). Sonst bleibt das Item des Kanals unverändert.
- Der Name eines Kanal-Slots kommt vom Kanal; er zählt nicht bei den Dubletten-Zusätzen der State-Slots mit.

### Einstellungen des Elements

`DevicePageSlotLook` je Slot, im Admin hinter dem „…“-Knopf der Slot-Zeile. Die Felder heißen wie beim
Standard-Page-Item und nutzen dessen Bausteine.

- **Icon und Farbe für true / false** (`trueIcon`, `falseIcon`, `trueColor`, `falseColor`): ersetzen Icon/Farbe aus
  Maske bzw. Art (`withDevicePageSlotLook`), nur was gesetzt ist. Eine Zahl oder ein Text kennt kein false und zeigt
  Icon und Farbe von true (wie ohne Einstellung). Ein eigenes Icon ersetzt auch das Stufen-Icon des
  Batterie-Füllstands, eine eigene Farbe allein lässt die Stufen stehen. Beispiel „ein Knopf für go/pause“: button-Slot mit lesbarem,
  schreibbarem boolean, `trueIcon: 'pause'`, `falseIcon: 'play'` – der Tipp schaltet um (das tat er schon vorher:
  `entity1.value` → `onDeviceDetailTap` → `setStateFlip`; nur `read: false` schreibt `true`), Icon und Farbe folgen
  dem State.
- **Farbverlauf** (`scale`): `icon.scale` des Items; ein Zahlen-State bekommt dafür den State als `entity1`, die Farbe
  läuft zwischen false- und true-Farbe. Beim progress-Slot ist das die Balkenfarbe.
- **Long-Press** (`longPress`): State-ID; ein Knopf-Item setzt ihn auf `true`, ein Schalter-Item schaltet ihn um
  (vorhandener Weg `data.longPress` → `onCommandLongPress`). Nur wo das Element ein Knopf oder Schalter ist
  (`devicePageSlotTakesLongPress`): State in einem button- oder switch-Slot, Kanal mit Rolle `button` oder `socket`
  (der ConfigManager erlaubt `longPress` nur für die Typen button/switch).
- **Alias-Kanäle** bekommen die Felder über die Kette (`trueIcon`/`falseIcon`/`trueColor`/`falseColor`/`scale`/
  `longPress` des Admin-Items) – sie überschreiben die Vorgaben der Rolle.
- Status-Slots: das ältere Feld `icon` gilt weiter als Icon für beide Zustände, bis im Dialog Icons gesetzt werden.
- Andocken weiterer Einstellungen: ein Feld in `DevicePageSlotLook` (+ `DEVICE_PAGE_SLOT_LOOK_FIELDS` für Texte), ein
  Abschnitt in `DevicePageSlotDialog` (`renderLook` / `renderActions`), Anwenden in `withDevicePageSlotLook` (States)
  bzw. `devicePageChannelAdminItem` (Kanäle).
- **Kurzer Tipp** (`isNavigation`, `targetPage`): siehe „Navigation aus einem Slot“.

### Navigation aus einem Slot

Von der Geräteseite kommt man auf eine andere Seite (z. B. die Raumauswahl des Saugroboters) auf zwei Wegen. Die
Felder heißen wie beim Standard-Page-Item (`isNavigation`, `targetPage`), die Seitenauswahl ist dieselbe
(`TargetPageSelect`, aus `ChannelConfigDialog` ausgelagert).

1. **Kurzer Tipp eines Slots** – im „…“-Dialog der Abschnitt „Kurzer Tipp“: „Standard“ (wie bisher) oder
   „Navigation“ mit Zielseite. Gespeichert am Slot: `isNavigation: true`, `targetPage: '<Seite>'` (die Wahl bleibt
   auch ohne Zielseite stehen, dann gilt Standard). Der Tipp öffnet dann nur noch die Seite – ein Knopf drückt
   nicht mehr, ein An/Aus-Wert schaltet nicht mehr. Icon, Farbe, Name und Wert des Slots bleiben.
   - Geht für States des Geräts und eigene Datenpunkte in jeder Slot-Art; beim switch-Slot navigiert der Tipp auf
     Icon/Name, der Schalter selbst (`OnOff`) schaltet weiter.
   - Ein info-Slot mit Auswahl (`input_sel`) wird mit Navigation als Text gezeigt (`readOnly: 'all'`), sonst käme
     sein Popup dem Tipp zuvor.
   - **Alias-Kanäle:** nur wo der kurze Tipp den Adapter erreicht (`devicePageChannelTakesNavigation`). Rollladen,
     Tor, Schloss, Auswahl und Timer (Typen `shutter`, `input_sel`, `timer`) öffnen ihr Popup in der HMI sofort beim
     Berühren – dort hat das Popup Vorrang, der Admin bietet „Kurzer Tipp“ nicht an, ein trotzdem gespeichertes Ziel
     wird ignoriert. Licht, Ventilator und Regler öffnen ihr Popup erst beim Halten: der kurze Tipp navigiert, das
     Halten öffnet weiter das Popup.
   - Der Kanal bleibt dabei das Page-Item seiner Rolle (Wert, Schalter, Popup): `isNavigation` wird **nicht** in die
     Kette `devicePageChannelAdminItem` → `adminPageItemToScriptItem` gegeben (ein `navigate`-Item wäre ein reiner
     Knopf ohne Wert und ohne `OnOff`). Stattdessen trägt das Element das Ziel (`devicePageTarget`).
2. **Navigations-Platz ohne State** – „Benutzerdefiniert“ → dritte Wahl **Navigation** (neben Datenpunkt und Kanal):
   `{ key: '', id: '', custom: 'navigation', targetPage, name?, trueIcon?, trueColor? }`. Zeigt Icon und Name, der
   Tipp springt zur Zielseite. `name` leer = Name der Zielseite; Icon/Farbe über „…“ (nur eine Spalte, kein
   Farbverlauf), sonst `gesture-tap-button` in der Farbe der Gruppe Info. Angeboten in info-, button- und
   status-Slots (`devicePageSlotAcceptsNavigation`); value, progress und switch brauchen einen Wert – der Admin
   blendet die Wahl dort aus, ein dort gespeicherter Platz ist rot markiert und bleibt am Panel leer. Ohne Zielseite
   bleibt der Slot leer.

**Adapter:** `devicePageSlotItem` / `devicePageNavigationSlotItem` / `devicePageElements` setzen am Page-Item
`devicePageTarget` (Name der Zielseite). Für die HMI ändert sich nichts: ein Navigations-Platz ist ein `text`-Element
mit Icon und Name (Feld 6 leer), das wie jeder Slot `buttonPress2,<id>,button` sendet. `PageItem.onCommand('button')`
prüft `devicePageTarget` zuerst und ruft `navigation.setTargetPageByName(target)` – derselbe Weg wie `setNavi` eines
Navigations-Items auf cardGrid (versteckte Seite → „Seite gesperrt“, `///screensaver` → Screensaver).

**Zielseite fehlt:** Ist das Ziel kein Navigationsknoten dieses Panels (`Navigation.hasTarget`, Seite dem Panel nicht
zugeordnet oder gelöscht), passiert beim Tipp nichts; das Log bekommt einmal je Panel und Ziel eine Warnung
(`reportMissingDevicePageTarget`). Der Admin markiert eine Zielseite rot („Zielseite nicht gefunden“), die nicht in
der Seitenliste des Dialogs steht (`devicePageTargetProblem`; Screensaver und die Seite des Items selbst gelten als
bekannt). Die Seitenliste des Dialogs ist nicht nach Panel getrennt – ob die Seite dem Panel zugeordnet ist, zeigt
erst die Warnung zur Laufzeit.

**Rückweg:** Es gibt keinen Mechanismus „zurück zur aufrufenden Seite“ für beliebige Ziele. Detailseite und
Geräteseite hängen als erzeugte Unterseiten (`directParentPage`) an der Seite des Items, deshalb führt ihr Pfeil dorthin
zurück; eine Zielseite ist dagegen eine normale Seite der Navigation. Nach dem Sprung steht die Navigation auf dem
Knoten der Zielseite, ihre Pfeile sind die dort eingerichteten (prev / parent / home / next). Zur Geräteseite kommt
man nur wieder über das Item (Long-Press bzw. kurzer Tipp). Wer von der Zielseite zurück zur Seite mit dem Geräte-Item
will, trägt diese als parent der Zielseite ein. Die verlassene Geräteseite bleibt bis zum nächsten Öffnen als
Unterseite der Item-Seite bestehen (wie bisher beim Verlassen über den Screensaver).

### Meldungen der Konvertierung

`convertAdminPageItemToPageItemConfig` gibt neben `messages` jetzt `unloggedMessages` zurück: die Meldungen, die noch
niemand geloggt hat – heute die ausgelassenen Kanal-Slots einer Geräteseite (`devicePageChannels`). Die Meldungen des
ConfigManagers stehen schon selbst im Log und werden nicht doppelt ausgegeben. `AdminConfiguration` loggt sie beim
Aufbau der Seiten als `warn` mit Seite und Item (`Page '<Seite>', page item <n>: …`). Eine Seite, die mehreren Panels
zugeordnet ist, wird je Panel umgewandelt – derselbe Text wird innerhalb von 60 s nur einmal geloggt
(`isNewItemMessage`).

### Long-Press auf der Geräteseite

Die HMI ab `device5` und das Web-Panel senden aus main und allen Slots `buttonPress3`. `PageDevice.onButtonPress3` gibt ihn an das
Page-Item des Slots (`onCommandLongPress`), main und das info-Icon haben keinen Long-Press. Ohne Aktion passiert
nichts – ein Long-Press gilt nie als Tipp (die Seite meldet ihn immer als behandelt). Ältere Test-HMIs senden kein
`buttonPress3` aus den Slots.

### Kurz-Tipp öffnet die Geräteseite

`shortPress: 'devicePage'`: der Kurz-Tipp des Items öffnet dasselbe wie der Long-Press (`PageItem.openDeviceOf`:
Geräteseite, wo das Panel sie hat, sonst die Detailseite). Der Long-Press bleibt unverändert.

- Nur mit Geräteseite: das Admin bietet die Auswahl nur dann an und speichert sonst `none` (`shortPressToSave`); ohne
  `devicePage` baut der Adapter das Item wie `none` (Text, Tipp ohne Wirkung).
- Laufzeit-Item: ein `button` ohne State mit Icon und Name des Items (ohne eigenen Namen der Name des Geräts) –
  ein Knopf, damit der Tipp auf jeder Seitenart als `buttonPress2,<id>,button` ankommt.
- main auf der Geräteseite: wie bei „Navigation“ und „Popup“ ein Text mit Icon und Gerätenamen, ohne Aktion.

### Protokoll

```
pageType~cardDevice<1|2|3>
entityUpd~<heading>~<navigation wie cardGrid>~<main>~<slot 1>~…~<slot N>~<info>
```

Beispiel Layout 1 (N = 10) mit zwei Status-Icons (Slot 7 Tür als boolean an, Slot 9 mit eigenem Icon), Slots 8/10 leer
(Zeilenumbrüche nur zur Lesbarkeit):

```
entityUpd~Saugroboter~<nav>~button~dp_3?0~<icon>~<farbe>~Robbi~Reinigt Wohnzimmer
~text~dp_3?1~<icon>~<farbe>~Akku~80 %~text~dp_3?2~<icon>~<farbe>~Fläche~34 m²
~button~dp_3?3~<icon>~<farbe>~Start~1~…~button~dp_3?6~<icon>~<farbe>~Suchen~1
~text~dp_3?7~<icon door>~<aktiviert>~~~~~~~~~text~dp_3?9~<icon air-filter>~<farbe der Gruppe>~~~~~~~~
~button~dp_3?11~<information-outline>~<deviceInfo>~~1
```

- Jedes Element hat die 6 Felder einer cardGrid-Zelle `type~intName~icon~iconColor~displayName~optionalValue`, leere
  Elemente `~~~~~` (wie leere cardGrid-Zellen, die HMI blendet sie aus). Überschrift = Name des Geräts.
- **main** = das Geräte-Item: Icon `devicePage.icon`, sonst das des Items; Farbe wie auf der Ursprungsseite. Name
  immer der des Geräts (dieselbe Quelle wie die Überschrift), bei jeder Kurz-Tipp-Art – die Kachel auf der
  Ursprungsseite behält ihren Namen. Kurz-Tipp „State des Geräts“ → das Item selbst (Tipp schaltet / drückt), „Keine“
  → `text`. „Navigation“, „Popup eines Alias-Kanals“ und „Geräteseite öffnen“ → `text` mit Icon und An/Aus des Items
  und dem Gerätenamen, ohne Aktion.
- **Feld 6 von main = Statuszeile**: der State `devicePage.status` wie eine Textzeile der Detailseite (Text aus
  `common.states` übersetzt, sonst Wert mit Einheit, boolean An/Aus übersetzt), sonst leer. Auch ohne main wird die
  Statuszeile gesendet (`~~~~~<status>`). Ein zu langer Text wird geteilt – siehe „Statuszeile: Teilen und Wechsel“.
- Namen und Werte (Felder 5 und 6 von main, Slots und info) begrenzt der Adapter auf die Textpuffer der HMI:
  **31 Byte**, an einer Zeichengrenze, ohne „...“ (`devicePageClampElement`, `DEVICE_PAGE_TEXT_MAX_BYTES`). In der
  Breite schneidet weiter die HMI an der Feldgrenze ab (Slot-Namen bekommen den Dubletten-Zusatz ungekürzt angehängt).
- **info**: `button` mit Icon `information-outline` in der Farbe `deviceInfo`, ohne Namen; Tipp
  `buttonPress2,<intName>,button` öffnet die Detailseite.
- Long-Press (`buttonPress3`): siehe „Long-Press auf der Geräteseite“ – nie ein Tipp.

### Statuszeile: Teilen und Wechsel

Ein Statustext, der nicht in die Zeile passt, wird in Abschnitte geteilt; die Statuszeile zeigt sie nacheinander,
Wechsel alle 3 Sekunden, endlos im Kreis. Die Zeile ist nie leer. (Der Lauftext der HMI ist verworfen: das
Nextion-Objekt beginnt leer rechts außerhalb, läuft ganz hinaus und ruckelt.)

**Teilen** – `splitDevicePageStatus` (Zeilenumbrüche werden Leerzeichen, `~` entfällt):

1. Passt der Text in die Zeile – ≤ 390 px in Font 0 (`text-width.ts`, `DEVICE_PAGE_FIELDS[layout].status`) **und**
   ≤ 63 Byte (`DEVICE_PAGE_STATUS_MAX_BYTES`, der Puffer von `tStatus`) –, bleibt er ein Abschnitt, unverändert.
2. Sonst nimmt jeder Abschnitt so viel, wie in Breite **und** Byte passt, und endet an der letzten Trennstelle davor:
   an einem Leerzeichen (es entfällt) oder hinter Komma, Punkt, Semikolon oder Gedankenstrich (`–`, `—`) – nicht
   in einer Zahl (`1,5`, `23.5` bleiben ganz). Gibt es keine Trennstelle, wird das Wort hart an der Zeichengrenze
   geteilt (nie in einem Mehrbyte-Zeichen).
3. Höchstens **3 Abschnitte** (`DEVICE_PAGE_STATUS_MAX_PARTS`). Was nach dem dritten übrig wäre, entfällt; der
   dritte endet dann mit der Ellipse (`…`, wenn Font 0 das Zeichen hat, sonst `...` – die Logik von `fitText`).

| Statustext | Abschnitte |
|---|---|
| `Schleudern, noch 23 min` | `Schleudern, noch 23 min` |
| `Fehler: Wassertank leer, bitte nachfüllen und die Tür der Maschine schließen` | `Fehler: Wassertank leer, bitte nachfüllen und` · `die Tür der Maschine schließen` |
| `Reinigung läuft, Wohnzimmer und Küche fertig, noch 23 min bis zur Rückkehr an die Ladestation` | `Reinigung läuft, Wohnzimmer und Küche` · `fertig, noch 23 min bis zur Rückkehr an die` · `Ladestation` |
| 200 × `a` | 39 × `a` · 39 × `a` · 37 × `a` + `...` |
| 200 × `ü` | 31 × `ü` (62 Byte) · 31 × `ü` · 30 × `ü` + `...` (63 Byte) |

**Wechsel** – `PageDevice`:

- Das `entityUpd` trägt in Feld 6 von main immer den **gerade gezeigten** Abschnitt (beim Öffnen der Seite und nach
  einer Textänderung den ersten).
- Bei mehr als einem Abschnitt läuft ein Adapter-Intervall (`adapter.setInterval`, `DEVICE_PAGE_STATUS_INTERVAL_MS`
  = 3000 ms) und schickt jeweils den nächsten Abschnitt mit der Kurz-Nachricht **`devStatus~<text>`**
  (`DEVICE_PAGE_STATUS_COMMAND`, `devicePageStatusMessage`). Die HMI setzt damit nur `tStatus`, nichts sonst.
- **Start:** mit dem ersten `entityUpd` eines Texts, der mehr als einen Abschnitt hat.
- **Neustart:** ein **anderer** Statustext wird neu geteilt, beginnt mit Abschnitt 1 (das `entityUpd` geht sofort
  hinaus) und das Intervall startet neu. Ein `entityUpd` aus anderem Grund (State eines Slots) lässt Abschnitt und
  Intervall unberührt.
- **Stopp:** nur noch ein Abschnitt, Seite ausgeblendet (`onVisibilityChange(false)`), Seite gelöscht, Adapter-Unload.
  Nach dem Ausblenden beginnt die Seite beim nächsten Anzeigen wieder mit Abschnitt 1.
- **Pause:** solange auf der Seite ein Popup offen ist (`sleep`), sendet das Intervall nichts und bleibt beim
  Abschnitt stehen.
- `devStatus` geht am Duplikatfilter von `sendToPanel` vorbei (`sendToPanelClass`): der Filter vergleicht weiter mit
  dem letzten `entityUpd`.

**Länge der Nachricht** (`devicePagePayload`): Das `entityUpd` darf höchstens so lang sein wie der Empfangspuffer der
Seite (`DEVICE_PAGE_RECEIVE_BYTES`: Layout 1 = 943, Layout 2 = 875, Layout 3 = 1019 Byte) und nie länger als die
1017 Byte, die das Display annimmt (`devicePageMaxPayloadBytes`: 943 / 875 / 1017). Ist es länger, gibt nur die
Statuszeile nach: der gezeigte Abschnitt wird um den Überhang kürzer (mit „...“), notfalls bis leer. Weil Namen und
Werte auf 31 Byte begrenzt sind, reicht das für jede Nachricht, die der Adapter baut (Test „the longest message“).
Eine Versionsweiche gibt es nicht: was `CARD_DEVICE_MIN_TFT` erfüllt, kennt `devStatus`.

### Web-Panel

`src-web/src/cards/cardDevice`: die drei Seiten in der Geometrie der eu-HMI.

- **Statuszeile:** Feld 6 von main, ein stehender Text, an der Feldgrenze abgeschnitten (keine eigenen „…“),
  Ausrichtung wie in der HMI (auf allen drei Layouts mittig). `devStatus~<text>` ersetzt nur diesen Text (`handleCommand` in
  `parse.ts`, verteilt vom `default`-Zweig des `PanelStore`); alles andere der Seite bleibt.
- **Tipp und Long-Press** wie in der HMI (`deviceTouch`, Tabelle „Ereignisse beim Antippen“ in
  [device-page-hmi.md](device-page-hmi.md)): main und **jede** Slot-Art sind eine Grid-Zelle – dieselbe Tippfläche
  (`Pressable`) und dieselbe Entscheidung (`tileTouch`) wie die Kachel von cardGrid, mit dem Timer der Geräteseite
  (500 ms).

  | Platz | kurzer Tipp | 500 ms gehalten |
  |---|---|---|
  | main, info, value, progress, button, status, Icon+Name eines switch-Slots | `buttonPress2,<id>,button` | `buttonPress3,<id>,button` beim Loslassen |
  | … mit Typ `shutter`, `shutter2`, `input_sel`, `timer` | Popup | Popup |
  | … mit Typ `light`, `light2`, `fan`, `number` | `buttonPress2,<id>,button` | Popup nach 500 ms |
  | … Typ `text` ohne ID (außer im button-Slot), leeres Element | nichts | nichts |
  | Schalter eines switch-Slots | `buttonPress2,<id>,OnOff,<0\|1>` | – |
  | info-Icon | `buttonPress2,<id>,button` | wie kurz |
  | Statuszeile | nichts | nichts |

- Tippflächen wie die Hotspots der HMI: value 110/67 226×110, progress 10/179 429×42, Icon+Name des Schalters
  161×34, Status-Zelle die ganze Zelle. main, info und button werden beim Drücken blasser (Knöpfe der HMI); value,
  progress, status und Schalter-Icon/-Name zeigen wie in der HMI keinen Press-Effekt.
- Popup aus einer Status-Zelle ohne Überschrift, aus dem progress-Slot ohne Icon (wie die HMI).
- Abweichung: `shutter`/`shutter2`/`input_sel`/`timer` öffnen ihr Popup beim Loslassen, die HMI schon beim Berühren.

### Admin

- Page-Item-Dialog, Abschnitt „Long-Press öffnet“: Detailseite (Vorgabe) / Geräteseite. Umschalten verliert nichts
  (Stash wie bei den anderen Radiobuttons, `src-admin/src/devicePageConfig.ts`), gespeichert wird `devicePage` nur bei
  „Geräteseite“ (normalisiert mit `devicePageConfigOf`). Die erste Geräteseite ist `defaultDevicePageConfig`.
- Layout mit schematischer Vorschau (MUI-Boxen nach der Geometrie der HMI, nummerierte Slots,
  `devicePagePreviewAreas`), Haupt-Icon (IconSelect), Statuszeile (alle States), je Slot die States nach
  `devicePageSlotAccepts`, „i-Icon anzeigen“.
- Statuszeile: die Auswahl beginnt mit „leer“ und „Benutzerdefinierter Datenpunkt“, danach die States des Geräts.
  Bei „Benutzerdefinierter Datenpunkt“ erscheint darunter der `EntitySelector` (Textfeld + Objekt-Browser, nur States)
  für eine beliebige ID, z. B. `0_userdata.0.…`. Gespeichert als `status: { key: '', id, custom: true }`
  (`devicePageStatusOf`, `customDevicePageStatus`); ein eigener Datenpunkt steht nie in der Liste der Geräte-States und
  wird nie als „nicht im Gerät gefunden“ markiert.
- Slots: die Auswahl jedes Slots beginnt mit „leer“ und „Benutzerdefiniert“, danach die States des Geräts
  (`devicePageSlotOf`, `devicePageSlotSelectValue`). Bei „Benutzerdefiniert“ erscheinen darunter die Wahl
  Datenpunkt / Alias-Kanal und der `EntitySelector`: für einen Datenpunkt alle States, für einen Kanal die Kanäle,
  deren Rolle zur Slot-Art passt (Auswahl eines States darunter wird auf den Kanal gekürzt – die Logik des
  Page-Item-Dialogs, ausgelagert nach `src-admin/src/channelSelection.ts` und von `ChannelConfigDialog` weiter
  benutzt). Die Section liest das Objekt der eingetragenen ID und markiert den Slot rot: „Datenpunkt/Kanal nicht
  gefunden“ bzw. „passt nicht zu diesem Slot“ (`devicePageCustomProblem`) – gespeichert bleibt er trotzdem.
- „…“-Knopf jeder belegten Slot-Zeile: Dialog „Einstellungen des Elements“ (`DevicePageSlotDialog`): Icon und Farbe
  für true/false (IconSelect und Farbfelder wie im Page-Item-Dialog), „Farbverlauf …“ (der `ChannelColorDialog` des
  Page-Items) und – wo möglich – der Long-Press-Datenpunkt. Der Knopf ist grün, wenn etwas gesetzt ist
  (`devicePageSlotHasLook`). Übernehmen ersetzt alle Einstellungen des Slots (`withDevicePageSlotLook`); wählt man
  danach etwas anderes für den Slot, bleiben sie, ein geleerter Slot verliert sie (`withDevicePageSlot`).
- Status-Slots (Layout 1): Art „Status-Icon“; das eigene Icon steht jetzt im „…“-Dialog (kein eigener Icon-Wähler
  mehr in der Zeile). Hinweis unter den Slots, dass die Info-Zeilen schmaler werden. Die Vorschau zeichnet das Raster
  (2 Spalten, Zeilen = Anzahl/2) und die schmalen Info-Zeilen nur, wenn mindestens ein Status-Slot belegt ist.
- Kurz-Tipp: zusätzliche Auswahl „Geräteseite öffnen“, nur wählbar mit „Long-Press öffnet: Geräteseite“; wechselt man
  zurück auf die Detailseite, springt der Kurz-Tipp auf „Keine“.
- Ein gewählter State wird als Verweis gespeichert: gleicher State behält seinen Verweis, ein angehakter Eintrag der
  Filterliste gibt `key` und `subName`, sonst der Masken-Eintrag des States. Ein gespeicherter State, den das Gerät nicht
  (mehr) hat oder der nicht zum Slot passt, bleibt markiert stehen; ohne Antwort des Adapters bleibt alles, wie es ist.
- Anleitung und Prüftabelle: `doc/Pictures/device-page/README.md`.

### Navigation und Lebensdauer

- Long-Press auf das Item der Seite `<P>` → Geräteseite `dp_<P>` (`directParentPage` = P). Zurück → P.
- „i“ → Detailseite `dd_<P>` unter der Geräteseite. Zurück → Geräteseite → Zurück → P.
- Wie die Detailseite: zur Laufzeit erzeugt, nicht editierbar, States nur abonniert solange sichtbar, eine neue
  Geräte-/Detailseite ersetzt die alte erst nach dem Wechsel, von zwei überlappenden Long-Presses gewinnt der letzte.

### Rückfall auf die Detailseite

`supportsCardDevice`: nur Modell `eu` und `web-l`; ein Web-Panel (web-l, Web-Klon eines eu-Panels) immer, ein
Hardware-Panel ab `CARD_DEVICE_MIN_TFT` (vorerst `6.2.0` wie popupNotify3 – **zum Release anheben**). us-l, us-p,
web-p und ältere oder unbekannte TFT öffnen die Detailseite wie bisher.

## Offen

- Detailseite mit echten Geräten am Panel prüfen (Schalter, Knopf, Auswahl-Popup, Textwerte).
- Web-Panel: der Tipp links auf Icon/Name sendet dort noch `buttonPress2` (button/switch) statt
  `buttonPress3` wie die neue TFT.
- Länge der übersetzten Zeilennamen auf dem Panel prüfen (z. B. fr, pl, ru).
