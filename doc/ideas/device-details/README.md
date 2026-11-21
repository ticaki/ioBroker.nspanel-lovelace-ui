# Gerät mit Details

Stand: 2026-11-21 – Konzept entschieden, Adapter und Admin im Branch `feat/device-details` umgesetzt (nicht am Panel
getestet), die zwei HMI-Änderungen stehen aus.

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
- Auf cardEntities tippt man die linke Fläche bewusst an. Ohne Long-Press-Behandlung passiert dort **nichts**, kein
  Rückfall auf den Kurz-Druck.
- Long-Press wird für cardEntities im Adapter freigegeben (Admin, Skript-Konvertierung). Bis zur neuen HMI kommt dort
  nur noch nichts an.

## Die Detailseite

- Seitentyp **cardSchedule**, zur Laufzeit erzeugt (Vorbild: temporäre Seite des Sonos-/Squeezebox-Speakers in
  `src/lib/pages/pageItem.ts`). Die Konfiguration der Seite ist nicht editierbar, die Seite selbst kann schalten.
- Überschrift = Name des Geräts.
- **Klassisch blätterbar** (`scrollPresentation: 'classic'`, `PageMenu.getOptions`).
- Zurück führt zur Seite, von der aus sie geöffnet wurde.
- States nur abonnieren, solange die Detailseite sichtbar ist (ein Shelly RGBW hat 182 States).

### Zeilen

| State | Anzeige | Tipp links (`buttonPress2`) |
|---|---|---|
| boolean, `write: true` | An/Aus (übersetzt) | schaltet um |
| boolean, nur lesbar | An/Aus | nichts |
| `read: false` (Button) | Name, wie ein Schalter | schreibt `true` |
| number, `write: true` | Typ `number`, Wert mit Einheit (HMI-Änderung 2) | öffnet `popupSlider` (min/max/step aus `common`) |
| number, nur lesbar | Wert mit Einheit | nichts |
| string | Text, nur lesbar | nichts |

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

## Vorgemerkte HMI-Änderungen

Der Adapter wird so gebaut, als wären beide schon drin. Getestet wird zunächst mit cardGrid.

1. **cardEntities**, `m0`–`m3` (Icon/Bezeichnung): Typen ohne Popup senden `event,buttonPress3,<entn>,button`.
   Heute senden sie nichts (bei `text` `buttonPress2`).
2. **cardSchedule**, Typ `number`: Wert anzeigen (heute nur bei `text`), Tipp öffnet `popupSlider` (heute
   `buttonPress2,<entn>,button`). Bis dahin kann der Adapter das Popup per `pageType~popupSlider~…` selbst öffnen.

## Umsetzung (feat/device-details)

- **Item-Typ:** eigener Typ „Gerät mit Details“ im Page-Item-Dialog (Auswahl „Art des Items“ oben: Standard / Gerät mit
  Details), nur auf cardGrid/cardGrid2/cardGrid3 und cardEntities. Kurz-Tipp:
  - „State des Geräts an/aus“: Auswahl aus den schreibbaren boolean-States des Geräts (vorbelegt mit dem State des
    Masken-Eintrags `switch`); gespeichert als benutzerdefinierter Knopf (`type: 'custom'`, `channelId` = State).
  - „Popup eines Alias-Kanals“: das Popup braucht die Rollen eines Alias-Kanals, der Kanal wird nur in diesem Fall gewählt;
    gespeichert als Standard-Item (`channelId` = Kanal).
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
- **Detailseite:** Seiten-ID `dd_<Seite>`, Zeilen mit Rolle `deviceDetail`. Zwei sich überschneidende Long-Presses
  öffnen nur die letzte Seite; die alte Seite wird erst nach dem Wechsel gelöscht.
- **Feldformat für HMI-Änderung 2:** schreibbare Zahl als `number~<id>~<Icon>~<Farbe>~<Name>~<Wert mit Einheit>`
  (statt `wert|min|max` wie auf cardEntities); min/max/step kommen mit `popupSlider`.
- cardEntities: ein unbehandelter `buttonPress3` fällt nicht mehr auf den Kurz-Druck zurück.

## Offen

- HMI-Änderung 1 (cardEntities `m0`–`m3` → `buttonPress3`) und 2 (cardSchedule `number`).
- `popupSlider` per `pageType~popupSlider~<Name>~<id>~<Icon>` vom Adapter geöffnet: ungetestet. Öffnet die HMI das
  Popup nicht, bleibt die Detailseite schlafend, bis man wegnavigiert.
- Darstellung der Zeilentypen `button` („drücken“) und `text` mit an/aus auf cardSchedule nicht am Panel geprüft.
- Geräte ohne schreibbaren boolean-State (reine Sensoren) haben im Typ „Gerät mit Details“ nur den Weg über ein Popup –
  ein Kurz-Tipp ohne Aktion ist nicht vorgesehen.
- Länge der übersetzten Zeilennamen auf dem Panel prüfen (z. B. fr, pl, ru).
