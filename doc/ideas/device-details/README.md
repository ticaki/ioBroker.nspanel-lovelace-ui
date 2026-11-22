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

### Zweite Namenszeile

- Haben mehrere angehakte Zeilen einer Detailseite denselben angezeigten Namen (Shelly Plus 1PM: `Relay0.temperatureC`
  und `Ext.temperature100C` … `104C` heißen alle „Temperatur“), bekommt jede davon eine zweite Namenszeile. Zeilen
  ohne Dublette bekommen keine.
- Automatischer Text (`deviceDetailAutoSubName`): Unterordner + Ziffernfolgen der End-ID, mehrere Ziffernfolgen mit
  Leerzeichen getrennt; ohne Unterordner nur die Ziffern; ohne beides die End-ID. Beispiele: `Relay0.temperatureC` →
  „Relay0“, `Ext.temperature100C` → „Ext 100“, `temperature1` → „1“, `rssi` → „rssi“.
- Eindeutig (`deviceDetailSubNames`): ergeben zwei gleichnamige Zeilen denselben automatischen Text (z. B.
  `Ext.temperature100C` und `Ext.temperature100F`), bekommen diese stattdessen die ID unterhalb des Geräts.
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
  - Ohne eigenen Namen zeigen „Keine“ und „Navigation“ den Namen des Geräts.
  - Gespeichert in `AdminPageItemConfig.device` (`deviceId`, `shortPress`, `entries` = angehakte Zeilen in Reihenfolge).
- **Gerät:** nur `device`/`channel`, nie Instanz, Adapter-Wurzel oder Info-Kanal (`<adapter>.<n>.info`); bekannte
  Adapter legen die Ebene fest (3). sendTo `getDeviceDetails` liefert die States (Gerät + höchstens ein Unterordner).
  Ohne Antwort (Adapter aus) oder bei gelöschtem Gerät bleibt ein Item speicherbar.
- **Masken:** `src/lib/types/deviceDetails.ts` – shelly (Gen1 und Gen2), sonoff, zigbee2mqtt, hm-rpc, dazu die
  allgemeine Maske nur nach Rolle. Zeilennamen: Übersetzungsschlüssel `deviceDetail_<key>`.
- **Gelernte Vorbelegung:** eigenes natives Attribut `deviceDetailsLearned` (Adapter → Einträge in Reihenfolge). Es
  ändert sich nur, wenn sich beim Speichern eines Items Häkchen oder Reihenfolge ändern, und bleibt beim Löschen von
  Items erhalten. „Nichts angehakt“ ist eine gültige Vorbelegung.
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

## Offen

- Detailseite mit echten Geräten am Panel prüfen (Schalter, Knopf, Auswahl-Popup, Textwerte).
- Web-Panel: der Tipp links auf Icon/Name sendet dort noch `buttonPress2` (button/switch) statt
  `buttonPress3` wie die neue TFT.
- Länge der übersetzten Zeilennamen auf dem Panel prüfen (z. B. fr, pl, ru).
