# Gerät mit Details

Stand: 2026-11-22 – Konzept entschieden, Adapter und Admin im Branch `feat/device-details` umgesetzt; die Detailseite
ist eine **cardEntities2**-Seite (neue TFT mit 5 Zeilen und Tipp links → `buttonPress3`, am Testpanel geflasht).

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
| cardEntities / cardEntities2 | rechte Schaltfläche (Schalter usw.) wie bisher | Tipp links auf Icon/Bezeichnung → `buttonPress3` (HMI-Änderung 1) |

- Auf den Grid-Seiten fällt ein nicht behandelter Long-Press weiterhin auf den Kurz-Druck zurück. Dort kann ein
  Long-Press auch einfach „der Finger lag zu lange“ sein.
- Auf cardEntities und cardEntities2 tippt man die linke Fläche bewusst an. Ohne Long-Press-Behandlung passiert dort
  **nichts**, kein Rückfall auf den Kurz-Druck.
- Long-Press wird für cardEntities im Adapter freigegeben (Admin, Skript-Konvertierung), für cardEntities2 im Admin
  (die Seite gibt es im Skript nicht). Bis zur neuen HMI kommt auf cardEntities nur nichts an.

## Die Detailseite

- Seitentyp **cardEntities2** (5 Zeilen, echte Bedienelemente wie cardEntities), zur Laufzeit erzeugt (Vorbild: temporäre Seite des Sonos-/Squeezebox-Speakers in
  `src/lib/pages/pageItem.ts`). Die Konfiguration der Seite ist nicht editierbar, die Seite selbst kann schalten.
- Überschrift = Name des Geräts.
- **Klassisch blätterbar** (`scrollPresentation: 'classic'`, `PageMenu.getOptions`).
- Zurück führt zur Seite, von der aus sie geöffnet wurde.
- States nur abonnieren, solange die Detailseite sichtbar ist (ein Shelly RGBW hat 182 States).

### Zeilen

| State | Zeilentyp auf cardEntities2 | Bedienung |
|---|---|---|
| boolean, `write: true` | `switch` | Schalter rechts (`OnOff`) schaltet |
| boolean, nur lesbar | `text`, An/Aus (übersetzt) | nichts |
| `read: false` (Button) | `button` („drücken“) | Knopf rechts (`button`) schreibt `true` |
| number, `write: true` | `number`, Feld `wert\|min\|max` wie cardEntities (min/max aus `common`, sonst 0/100) | Slider (`number-set`) schreibt den Wert |
| number, nur lesbar | `text`, Wert mit Einheit | nichts |
| string | `text`, nur lesbar | nichts |

Ein Tipp links (Icon/Name) sendet auf diesen Zeilen `buttonPress3` und tut nichts.

- Es wird nichts automatisch ausgeblendet. Was erscheint, bestimmt allein die Filterliste.
- Icon aus der Maske bzw. Rolle (Thermometer, Blitz, WLAN, Batterie …), Name übersetzt über `getTranslation`.
- Nicht pro Zeile einstellbar (erste Version): Icon und Farbe.

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

1. **cardEntities** und **cardEntities2**, `m0`–`m3` / `m0`–`m4` (Icon/Bezeichnung): Typen ohne Popup senden
   `event,buttonPress3,<entn>,button` (vorher nichts, bei `text` `buttonPress2`). Umgesetzt mit
   `HMI/tools/entities2_five_rows.py`.
2. Neue Seite **cardEntities2** = cardEntities mit 5 Zeilen (`pageType~cardEntities2`, `entityUpd` mit einer Zeile
   mehr, Zeile 5 = Felder 38–43). Ersetzt die frühere Idee, cardSchedule für die Detailseite zu ändern (Typ `number`
   mit Wert, Tipp öffnet `popupSlider`) – das entfällt, **cardSchedule bleibt unverändert**.

### TFT-Abhängigkeit von cardEntities2

- Der Adapter kennt die TFT-Version aus `event,startup,<version>,<model>` (`info.nspanel.displayVersion`) und
  vergleicht sie wie bei den 6.2.0-Funktionen (`Panel.meetsVersion`, `isVersionGreaterOrEqual`).
- cardEntities2 gilt ab **TFT 6.2.1** (`CARD_ENTITIES2_MIN_VERSION` in `src/lib/const/tools.ts`, „nächste TFT nach
  6.2.0“) und nur für eu; Web-Panels (web-l, web-p, eu) haben die Seite immer.
- Ältere TFT, unbekannte Version und us-l/us-p: die Seite wird als **cardEntities** geladen
  (`pageType~cardEntities`) und hat deren Zeilenzahl (eu/us-l 4, us-p 5). Entscheidung in `hmiMenuCard`, angewandt
  in `PageEntities.getPageTypePayload` und `PageMenu.maxItems` (neu berechnet beim Sichtbarwerden, dann ist die
  Version bekannt).
- Wichtig: Die TFT mit cardEntities2 muss sich mit Version **≥ 6.2.1** melden, sonst zeigt der Adapter cardEntities.

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
- **Detailseite:** cardEntities2, Seiten-ID `dd_<Seite>`, Zeilen mit Rolle `deviceDetail`. Zwei sich überschneidende Long-Presses
  öffnen nur die letzte Seite; die alte Seite wird erst nach dem Wechsel gelöscht.
- Zeilen: `switch`/`button`/`number`/`text` mit den Feldformaten von cardEntities (kein eigenes Format mehr, kein
  `popupSlider` vom Adapter).
- cardEntities und cardEntities2: ein unbehandelter `buttonPress3` fällt nicht auf den Kurz-Druck zurück.
- **cardEntities2 als Seitenart:** im Admin wählbar (Listenkarten), 5 Einträge pro Seite, klassisch blätterbar,
  Long-Press und „Gerät mit Details“ erlaubt; nicht im Skript-Weg.

## Offen

- Detailseite mit echten Geräten am Panel prüfen (Schalter, Knopf, Slider, Textwerte).
- Der Slider schreibt ganze Zahlen (`number-set` wie auf cardEntities); Nachkommastellen/`step` gehen dabei verloren.
- Web-Panel: der Tipp links auf Icon/Name sendet dort noch `buttonPress2` (number/button/switch) statt
  `buttonPress3` wie die neue TFT.
- us-l/us-p: cardEntities2 (5 Zeilen) fehlt in der HMI.
- Länge der übersetzten Zeilennamen auf dem Panel prüfen (z. B. fr, pl, ru).
