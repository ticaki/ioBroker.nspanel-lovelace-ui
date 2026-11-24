# Bildliste: Gerät mit Details und Geräteseite

Alle Bilder, die die Nutzer-Doku ([doc/de/deviceDetails.md](../../de/deviceDetails.md),
[doc/en/deviceDetails.md](../../en/deviceDetails.md)) und die [README dieses Ordners](README.md) verwenden – mit
endgültigem Dateinamen. Die Doku bindet sie schon ein; fehlende Dateien sind dort mit `<!-- BILD FOLGT … -->` markiert.

Stand: 2026-11-24, **vor** der Integration der Layouts für us-l, us-p, web-l und web-p. Aufgenommen wird erst danach.

## Überblick

| Wer | Was | Anzahl |
|---|---|---|
| automatisch (Puppeteer, Web-Panel) | Geräteseiten und Detailseite je Modell | 27 (23 neu, 4 vorhandene neu aufnehmen) |
| automatisch (Puppeteer, Admin) | Dialoge | 9 (4 neu, 3 vorhandene neu aufnehmen, 2 bleiben) |
| **Tim (echte Hardware)** | – | **0 – die Liste ist leer**, siehe [Hardware-Fotos](#hardware-fotos-tim) |

Das Web-Panel zeichnet jedes Modell: die Hardware-Modelle eu, us-l und us-p wie die HMI, dazu web-l und web-p.
Deshalb kommen alle Panel-Bilder aus dem Web-Panel. Dass die Web-Bilder der HMI entsprechen, sichert der
[Abgleich Web ↔ HMI](#abgleich-web--hmi) gegen Tims echte Aufnahmen.

## Vorbereitung

- **Testdaten:** Laut Notizen liegen im Dev-Server die Geräte `0_userdata.0.devicepage.robot`, `.washer` und `.car`
  und die Seite `devicepage_test` (zugewiesen an `emu_topic` und `test_webl`). **Im Repo ist das nirgends
  dokumentiert** und es gibt kein Skript, das sie anlegt – belegt ist nur `0_userdata.0.devicepage.robot` („Robbi“,
  14 Einträge angehakt) im vorhandenen Bild `admin-overview.png` und die Belegung in Tims Aufnahmen (unten). Vor dem
  Aufnehmen prüfen, dass Geräte und Seite noch da sind und zu den Referenzbelegungen passen.
- **Web-Panels je Modell:** Für die Aufnahmen im Mock-Modus (Weg A) ist kein Panel nötig. Für den Live-Weg (B) und
  die Admin-Bilder braucht der Dev-Server Web-Panels mit den Modellen eu, us-l, us-p, web-l und web-p, denen
  `devicepage_test` zugewiesen ist (vorhanden laut Notizen: `emu_topic` = eu, `test_webl` = web-l, `webtest` = web-p).
- **Zusatz-Elemente:** Für die Bilder `…-extra.png` das Häkchen für die zusätzlichen Elemente setzen und die
  Zusatz-Plätze belegen (siehe Tabelle).

### Referenzbelegung

Alle neuen Panel-Bilder zeigen dieselben drei Geräte – genau so belegt wie in Tims Aufnahmen vom 2026-11-23
(`/mnt/projekte/Screenshot 2026-11-23 ….png`, nur lesbar), damit der Abgleich Bild gegen Bild geht. Icons sind die,
die der Adapter von sich aus wählt (MDI-Namen nach Augenschein – maßgeblich ist das Referenzbild).

| Kürzel | Seite | Belegung |
|---|---|---|
| **R1** | cardDevice1 mit Status-Icons | Überschrift „Robbi“; links Pfeil hoch, rechts kein Pfeil. Haupt-Icon `robot-vacuum` (cyan), Name „Robbi“. Slot 1 Info: Batterie-Icon (Füllstand, hellgelb), „Batterie“, „80%“. Slot 2 Info: Icon „123“, „Fläche“, „34m²“. Knöpfe 3–6: „Starten“ (Tipp-Icon), „Pause“ (`pause`), „Laden“ (Tipp-Icon), „Suchen“ (Tipp-Icon), alle cyan. Status-Icons 7–10: `wifi` (cyan), Papierkorb (grau), `air-filter` (weiß), Warndreieck (grau). Statuszeile „Reinigt Wohnzimmer, noch 12 min (Wischen)“. i-Icon. |
| **R1p** | cardDevice1 ohne Status-Icons | wie R1, aber Slots 7–10 leer (Info-Zeilen breit) und Knopf „Pause“ mit dem Tipp-Icon. |
| **R2** | cardDevice2 | Überschrift „Waschmaschine“; links Pfeil hoch. Haupt-Icon `washing-machine` (cyan). Slot 1 großer Wert „1:23“, Name „Restzeit“, kleines Icon `information-outline`. Slot 2 Balken „Fortschritt“, 62 %, weiß gefüllt. Slot 3 „Programm“ / „Baumwolle“ (Listen-Icon). Slot 4 „Temperatur“ / „60°C“ (Thermometer). Slot 5 „Schleudern“ / „1400U/min“ (Icon „123“). Slot 6 Knopf „Pause“ (Schalter-Icon aus, grau). Statuszeile „Schleudern, noch 23 min - Fertig um 14:35“. i-Icon. |
| **R3** | cardDevice3 | Überschrift „ID.3“; links Pfeil hoch. Haupt-Icon `car` (cyan), Name „ID.3“. Slots 1–6: „Batterie“ / „78%“ (Batterie-Icon), „Reichweite“ / „312km“ („123“), „Temperatur“ / „21,5°C“ (Thermometer), „Verriegelt“ / „an“ (Schalter-Icon, cyan), „Ladeleistung“ / „11kW“ („123“), „Kilometer“ / „23456km“ („123“). Schalter 7 „Klima“ an, Schalter 8 „Laden“ an. Statuszeile „Lädt an Wallbox, 11 kW - voll um 17:40“. i-Icon. |
| **R4** | Detailseite (cardEntities) | Überschrift „Robbi“; links Pfeil hoch, rechts Pfeil runter (blättern). Zeilen: „Batterie“ / „80%“ (Batterie-Icon), „Signal“ / „-58dBm“ (`wifi`, cyan), „Firmware“ / „4.3.2“ (Chip-Icon), „Fläche“ / „34m²“ („123“). |

Die vier vorhandenen Bilder `web-cardDevice*.png` zeigen eine **andere** Belegung (Beispieldaten des HMI-Werkzeugs:
„Saugroboter“ mit Start/Pause/Dock/Suchen und eigenen Icons, „Waschküche“, „Auto“). Sie bleiben so – die Doku zeigt
damit, wie eine Seite mit eigenen Icons aussieht – und werden nur neu aufgenommen, weil die Statuszeile inzwischen
auf allen drei Seiten mittig steht.

## Aufnahmeweg

Format: **PNG**, Bühne in Originalgröße (1 Pixel = 1 Panel-Pixel) wie die vorhandenen Bilder – eu und us-l
480 × 320, us-p 320 × 480, web-l 640 × 320, web-p 320 × 640. Nur die Bühne, ohne Hardware-Tasten und ohne
Browser-Rand. Je Modell alle Bilder in einem Durchgang.

### A – Web-Panel im Mock-Modus (Regelfall für alle Panel-Bilder)

So sind die vorhandenen `web-cardDevice*.png` entstanden: `src-web/scripts/screenshot.mjs` spielt eine Liste von
Panel-Nachrichten in das Web-Panel ein (`/demo?mock=1&model=<Modell>`) und speichert die Bühne.

```bash
cd src-web
npm start &                                   # Vite auf Port 4174, bleibt laufen
node scripts/screenshot.mjs --in scripts/examples/cardDevice1.txt \
     --out ../doc/Pictures/device-page/web-cardDevice1.png --model eu --scale 1
```

- `--model eu|us-l|us-p|web-l|web-p` wählt das Modell, `--scale 1` die Originalgröße (Vorgabe wäre 2x).
- Braucht ein global installiertes Puppeteer (`npm root -g`) und `node_modules` in `src-web`.
- Vorhandene Eingabedateien: `src-web/scripts/examples/cardDevice1.txt`, `cardDevice1-plain.txt`,
  `cardDevice2.txt`, `cardDevice3.txt` (Beispieldaten des HMI-Werkzeugs → `web-cardDevice*.png`).
- **Was noch fehlt** (nicht in diesem Auftrag angelegt, weil es `src-web/` ändert):
  1. Eingabedateien mit der Referenzbelegung R1, R1p, R2, R3 (Vorschlag: `cardDevice1-ref.txt`,
     `cardDevice1-ref-plain.txt`, `cardDevice2-ref.txt`, `cardDevice3-ref.txt`) und R4 (`cardEntities-device-ref.txt`,
     `pageType~cardEntities`). Am genauesten: die Nachrichten übernehmen, die der Adapter im Dev-Server für
     `devicepage_test` wirklich sendet (Debug-Log bzw. WebSocket-Frames des Web-Panels) – dann stimmen Icons,
     Farben und Einheiten ohne Leerzeichen von selbst. R1p und der Gerätename von R2 von Hand anpassen.
  2. Je Layout eine Eingabedatei mit den Zusatz-Elementen für web-l/web-p (`…-ref-extra.txt`).
  3. Prüfen, ob dieselbe Nachricht für alle Modelle gilt (Hardware-Modelle ohne, web-l/web-p mit Zusatz-Elementen)
     oder ob der Adapter je Modell anders sendet – dann je Modell eine Datei.

### B – Web-Panel live am Dev-Server (zum Gegenprüfen und als Quelle der Nachrichten)

Web-Panel unter `http://localhost:8090/<Topic>` öffnen, Viewport = Bühne des Modells, das Geräte-Item halten
(Puppeteer: Zeiger 600 ms drücken, loslassen) oder – einfacher – den kurzen Tipp „Geräteseite öffnen“ nutzen, dann
`[data-stage]` als Ausschnitt speichern. Die Detailseite über das „i“ der Geräteseite öffnen. Nur dieser Weg zeigt,
was der Adapter wirklich sendet (wechselnder Statustext, Einheiten, Kürzen).

### C – Admin (Dev-Server, Puppeteer)

Wie die vorhandenen `admin-*.png` (Commit `d4a0d7761`): Admin des Dev-Servers `http://localhost:8081/`, nach dem
Laden `location.hash = '#tab-instances/config/system.adapter.nspanel-lovelace-ui.0'`, Tab **PageConfig**, Seite
`devicepage_test`, Item anklicken. Helles Standard-Thema, Sprache Deutsch, Fensterbreite 1500 px. Ausschnitte:

- ganzer Dialog: `.MuiDialog-paper` (bei zwei offenen Dialogen `.MuiDialog-root:last-of-type .MuiDialog-paper`),
- Bereich der Geräteseite: `[data-dd="device-page-section"]`, Statuszeile `[data-dd="device-page-status"]` /
  `[data-dd="device-page-status-custom"]`, Slot-Zeilen `[data-dd="device-page-slot"]`,
  `[data-dd="device-page-slot-custom"]`, „…“-Knopf `[data-dd="device-page-slot-settings"]`.

Vor `npm run build:admin` den Dev-Server stoppen; danach neu starten und warten, bis der Admin erreichbar ist.

## Web-Panel-Aufnahmen

Sortiert nach Modell – je Modell ein Durchgang. „Doku“ = `doc/de/deviceDetails.md` und `doc/en/deviceDetails.md`.

| Dateiname | Art | Modell/Panel | Was zu sehen sein soll | Wer | Verwendet in | erledigt |
|---|---|---|---|---|---|---|
| `eu-cardDevice1.png` | Screenshot Web-Panel | eu | cardDevice1, Belegung **R1** (vier Status-Icons, schmale Info-Zeilen) | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku §8 EU; Abgleich 1 | ☐ |
| `eu-cardDevice1-plain.png` | Screenshot Web-Panel | eu | cardDevice1, Belegung **R1p** (ohne Status-Icons, breite Info-Zeilen) | automatisch (Puppeteer, Web-Panel, Modell eu) | nur Abgleich 2 und README | ☐ |
| `eu-cardDevice2.png` | Screenshot Web-Panel | eu | cardDevice2, Belegung **R2**, Balken bei 62 % | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku §8 EU; Abgleich 3 | ☐ |
| `eu-cardDevice3.png` | Screenshot Web-Panel | eu | cardDevice3, Belegung **R3**, beide Schalter an | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku §8 EU; Abgleich 4 | ☐ |
| `eu-detail-page.png` | Screenshot Web-Panel | eu | Detailseite, Belegung **R4** (vier Zeilen) | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku §3; Abgleich 5 | ☐ |
| `web-cardDevice1.png` | Screenshot Web-Panel | eu | **vorhanden, neu aufnehmen** (Statuszeile jetzt mittig): `examples/cardDevice1.txt`, „Saugroboter“ mit eigenen Icons und vier Status-Icons | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku Einstieg, §5 Status-Icons, §6 Layout 1; README | ☐ |
| `web-cardDevice1-plain.png` | Screenshot Web-Panel | eu | **vorhanden, neu aufnehmen**: `examples/cardDevice1-plain.txt`, dasselbe ohne Status-Icons | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku §5 Status-Icons; README | ☐ |
| `web-cardDevice2.png` | Screenshot Web-Panel | eu | **vorhanden, neu aufnehmen** (zur Kontrolle, sollte gleich bleiben): `examples/cardDevice2.txt`, „Waschküche“ | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku §6 Layout 2; README | ☐ |
| `web-cardDevice3.png` | Screenshot Web-Panel | eu | **vorhanden, neu aufnehmen** (Statuszeile jetzt mittig): `examples/cardDevice3.txt`, „Auto“ | automatisch (Puppeteer, Web-Panel, Modell eu) | Doku §6 Layout 3; README | ☐ |
| `us-l-cardDevice1.png` | Screenshot Web-Panel | us-l | cardDevice1, Belegung **R1** | automatisch (Puppeteer, Web-Panel, Modell us-l) | Doku §8 US-Querformat | ☐ |
| `us-l-cardDevice2.png` | Screenshot Web-Panel | us-l | cardDevice2, Belegung **R2** | automatisch (Puppeteer, Web-Panel, Modell us-l) | Doku §8 US-Querformat | ☐ |
| `us-l-cardDevice3.png` | Screenshot Web-Panel | us-l | cardDevice3, Belegung **R3** | automatisch (Puppeteer, Web-Panel, Modell us-l) | Doku §8 US-Querformat | ☐ |
| `us-p-cardDevice1.png` | Screenshot Web-Panel | us-p | cardDevice1 hochkant, Belegung **R1**: Haupt-Icon oben links, 2×2-Status-Icons daneben, Info-Zeilen volle Breite, Knöpfe 2×2, Statuszeile unten | automatisch (Puppeteer, Web-Panel, Modell us-p) | Doku §8 US-Hochformat | ☐ |
| `us-p-cardDevice2.png` | Screenshot Web-Panel | us-p | cardDevice2 hochkant, Belegung **R2** | automatisch (Puppeteer, Web-Panel, Modell us-p) | Doku §8 US-Hochformat | ☐ |
| `us-p-cardDevice3.png` | Screenshot Web-Panel | us-p | cardDevice3 hochkant, Belegung **R3** | automatisch (Puppeteer, Web-Panel, Modell us-p) | Doku §8 US-Hochformat | ☐ |
| `web-l-cardDevice1.png` | Screenshot Web-Panel | web-l | cardDevice1 auf voller Bühne 640 × 320, Belegung **R1**, **ohne** Zusatz-Elemente | automatisch (Puppeteer, Web-Panel, Modell web-l) | Doku §8 Smartphone quer | ☐ |
| `web-l-cardDevice2.png` | Screenshot Web-Panel | web-l | cardDevice2, Belegung **R2**, ohne Zusatz-Elemente | automatisch (Puppeteer, Web-Panel, Modell web-l) | Doku §8 Smartphone quer | ☐ |
| `web-l-cardDevice3.png` | Screenshot Web-Panel | web-l | cardDevice3, Belegung **R3**, ohne Zusatz-Elemente | automatisch (Puppeteer, Web-Panel, Modell web-l) | Doku §8 Smartphone quer | ☐ |
| `web-l-cardDevice1-extra.png` | Screenshot Web-Panel | web-l | cardDevice1, **R1 + 2 Knöpfe** (6 Knöpfe belegt) | automatisch (Puppeteer, Web-Panel, Modell web-l) | Doku §8 Smartphone quer | ☐ |
| `web-l-cardDevice2-extra.png` | Screenshot Web-Panel | web-l | cardDevice2, **R2 + 1 Info-Zeile + 2 Knöpfe** (4 Infos, 3 Knöpfe) | automatisch (Puppeteer, Web-Panel, Modell web-l) | Doku §8 Smartphone quer | ☐ |
| `web-l-cardDevice3-extra.png` | Screenshot Web-Panel | web-l | cardDevice3, **R3 + 2 Info-Zeilen + 1 Schalter** (8 Infos, 3 Schalter) | automatisch (Puppeteer, Web-Panel, Modell web-l) | Doku §8 Smartphone quer | ☐ |
| `web-p-cardDevice1.png` | Screenshot Web-Panel | web-p | cardDevice1 auf voller Bühne 320 × 640, Belegung **R1**, ohne Zusatz-Elemente | automatisch (Puppeteer, Web-Panel, Modell web-p) | Doku §8 Smartphone hochkant | ☐ |
| `web-p-cardDevice2.png` | Screenshot Web-Panel | web-p | cardDevice2, Belegung **R2**, ohne Zusatz-Elemente | automatisch (Puppeteer, Web-Panel, Modell web-p) | Doku §8 Smartphone hochkant | ☐ |
| `web-p-cardDevice3.png` | Screenshot Web-Panel | web-p | cardDevice3, Belegung **R3**, ohne Zusatz-Elemente | automatisch (Puppeteer, Web-Panel, Modell web-p) | Doku §8 Smartphone hochkant | ☐ |
| `web-p-cardDevice1-extra.png` | Screenshot Web-Panel | web-p | cardDevice1, **R1 + 2 Knöpfe** | automatisch (Puppeteer, Web-Panel, Modell web-p) | Doku §8 Smartphone hochkant | ☐ |
| `web-p-cardDevice2-extra.png` | Screenshot Web-Panel | web-p | cardDevice2, **R2 + 1 Info-Zeile + 2 Knöpfe** | automatisch (Puppeteer, Web-Panel, Modell web-p) | Doku §8 Smartphone hochkant | ☐ |
| `web-p-cardDevice3-extra.png` | Screenshot Web-Panel | web-p | cardDevice3, **R3 + 2 Info-Zeilen + 1 Schalter** | automatisch (Puppeteer, Web-Panel, Modell web-p) | Doku §8 Smartphone hochkant | ☐ |

Womit die Zusatz-Plätze belegt werden (Texte, Icons), wird beim Aufnehmen festgelegt und hier nachgetragen –
web-l und web-p bekommen dieselbe Belegung.

## Admin-Aufnahmen

| Dateiname | Art | Modell/Panel | Was zu sehen sein soll | Wer | Verwendet in | erledigt |
|---|---|---|---|---|---|---|
| `admin-device-item.png` | Screenshot Admin | – | Pageitem-Konfiguration, Art **Gerät mit Details**, Gerät `0_userdata.0.devicepage.robot` („Robbi – … Einträge angehakt“), Kurzer Tipp, Knopf Filterliste, **Long-Press öffnet: Detailseite** (kein Geräteseiten-Bereich) | automatisch (Puppeteer, Admin) | Doku Schnellstart 1 | ☐ |
| `admin-filterlist.png` | Screenshot Admin | – | Dialog **Filterliste** eines Geräts mit Maske und gleichnamigen Zeilen (z. B. Shelly mit mehreren Temperaturen): angehakte oben, Spalten Eintrag/State, Feld **2. Zeile** sichtbar | automatisch (Puppeteer, Admin) | Doku §3 | ☐ |
| `admin-shortpress.png` | Screenshot Admin | – | **vorhanden, bleibt:** Kurzer Tipp mit „Geräteseite öffnen“, Filterliste-Knopf, Long-Press öffnet: Geräteseite | – | Doku §2; README | ☑ |
| `admin-overview.png` | Screenshot Admin | – | **vorhanden, nach der Integration neu aufnehmen:** ganzer Dialog mit Geräteseite Layout 1, alle zehn Slots belegt, Haupt-Icon, Statuszeile, i-Icon. Das heutige Bild zeigt noch den alten Hinweis „nur auf EU-Panels und Web-Panels im Querformat“ und kein Häkchen für die Zusatz-Elemente | automatisch (Puppeteer, Admin) | Doku Schnellstart 2, §5; README | ☐ |
| `admin-status-custom.png` | Screenshot Admin | – | **vorhanden, bleibt:** Statuszeile „Benutzerdefinierter Datenpunkt“ mit ID-Feld | – | Doku §5 Statuszeile; README | ☑ |
| `admin-slot-custom.png` | Screenshot Admin | – | **vorhanden, neu aufnehmen** (die Wahl heißt jetzt „Kanal“, dazu „Navigation“): Slots mit Benutzerdefiniert → Datenpunkt, → Kanal, → **Navigation** mit Zielseite und ein Datenpunkt mit „passt nicht zu diesem Slot“ | automatisch (Puppeteer, Admin) | Doku §5 Benutzerdefiniert; README | ☐ |
| `admin-slot-dialog.png` | Screenshot Admin | – | **vorhanden, neu aufnehmen** (zeigt noch den früheren kleinen Dialog): „…“ eines **Knopf**-Slots = Pageitem-Konfiguration ohne Kanalauswahl, Titel mit „4 Knopf“, Name, Icon `pause`/`play` und Farben für wahr/unwahr, Langer Druck | automatisch (Puppeteer, Admin) | Doku §5 Einstellungen des Elements; README | ☐ |
| `admin-slot-dialog-status.png` | Screenshot Admin | – | „…“ eines **Status-Icon**-Slots: kleiner Dialog „Einstellungen des Elements – 8 Status-Icon“ mit Icon/Farbe, „Farbverlauf …“ und „Kurzer Tipp“ | automatisch (Puppeteer, Admin) | Doku §5 Einstellungen des Elements; README | ☐ |
| `admin-web-extra.png` | Screenshot Admin | – | Bereich der Geräteseite mit **gesetztem Häkchen** für die zusätzlichen Elemente: die Zusatz-Plätze stehen unter „Slots“ (Layout 2, damit Info-Zeile und Knöpfe zu sehen sind) | automatisch (Puppeteer, Admin) | Doku §5 Zusätzliche Elemente; README | ☐ |

## Hardware-Fotos (Tim)

**Keine.** Jedes Bild der Doku lässt sich aus dem Web-Panel oder dem Admin aufnehmen:

- Aussehen je Modell und Layout: Web-Panel mit dem jeweiligen Modell.
- Blinken beim langen Druck und wechselnder Statustext: Abläufe, die ein Standbild nicht zeigt – die Doku
  beschreibt sie nur im Text, ein Bild ist nicht eingeplant.
- Popups: vorhandene Doku ([pagePopup](../../de/pagePopup.md), Bilder unter `doc/Pictures/webpanel/`).

Sollte der Abgleich unten eine Abweichung zeigen, die sich im Web-Panel nicht beheben lässt, kommt hier eine Zeile
mit Begründung dazu.

## Abgleich Web ↔ HMI

Maßgebliche Referenzen sind Tims echte Aufnahmen der EU-HMI (Nextion-Simulator/Display) in der Wurzel von
`/mnt/projekte/` (nur lesbar, nicht hineinschreiben). Geprüft wird jeweils die Web-Aufnahme des Modells **eu** mit
derselben Belegung.

| # | Referenz | Größe | Inhalt | Web-Aufnahme |
|---|---|---|---|---|
| 1 | `Screenshot 2026-11-23 202151.png` | 481 × 326 (Fensterrand) | cardDevice1 „Robbi“ mit Status-Icons (R1) | `eu-cardDevice1.png` |
| 2 | `Screenshot 2026-11-23 160356.png` | 479 × 319 | cardDevice1 „Robbi“ ohne Status-Icons (R1p) | `eu-cardDevice1-plain.png` |
| 3 | `Screenshot 2026-11-23 160338.png` | 481 × 320 | cardDevice2 „Waschmaschine“ (R2) | `eu-cardDevice2.png` |
| 4 | `Screenshot 2026-11-23 160313.png` | 480 × 320 | cardDevice3 „ID.3“ (R3) | `eu-cardDevice3.png` |
| 5 | `Screenshot 2026-11-23 202318.png` | 488 × 326 (Fensterrand) | Detailseite „Robbi“ (R4) | `eu-detail-page.png` |

**Vor dem Vergleich:** Die Referenzen sind nicht alle 480 × 320 (Fensterrand, ein Pixel zu viel oder zu wenig).
Zuerst den Versatz bestimmen (z. B. an der linken Kante des Haupt-Icons und der Grundlinie der Überschrift) und auf
480 × 320 zuschneiden bzw. ausrichten; erst dann Bild gegen Bild legen.

**Worauf geprüft wird:**

| Punkt | Was genau |
|---|---|
| Positionen | Lage jedes Elements auf ±1 px: Haupt-Icon und Name, Icon-Spalten, linke Kante der Namen, rechte Kante der rechtsbündigen Werte, Raster der Status-Icons (Linien und Icon-Mitte), Knopfreihe, Balken (Rahmen 429 × 14 ab x 10 / y 207), Schalter, Statuszeile, i-Icon, Pfeile und Überschrift. |
| Schriftgrößen | Höhe der Großbuchstaben/Ziffern je Schrift: Namen und Werte (24 px), Überschrift, großer Wert „1:23“ (80 px fett), kleine und große Icons. Laufweite: Endet „Reinigt Wohnzimmer, noch 12 min (Wischen)“ an derselben Stelle? |
| Abschneiden an Feldgrenzen | Text, der nicht passt, endet an derselben Pixelspalte wie in der HMI, ohne „…“: in den Referenzen passt alles – zusätzlich mit längeren Namen prüfen (z. B. Gerätename „Waschmaschine“ unter dem Haupt-Icon von cardDevice2, Info-Namen in R1 mit Status-Icons). |
| Farben | Textfarbe, Cyan der aktiven Icons, Grau der inaktiven, Hellgelb des Batterie-Icons, Weiß der „123“-Icons, Rasterlinien der Status-Icons, Balkenfüllung und -rahmen, Schalterbilder, Blau des Pfeils. |
| Sichtbarkeit | Leere Slots sind unsichtbar; ohne Status-Icons kein Raster und breite Info-Zeilen (Referenz 2 gegen 1). |

**Bekannte Unterschiede der Referenzen zum heutigen Stand** (kein Fehler des Web-Panels):

- Die Referenzen stammen von Test-HMIs vor `device9`: Auf cardDevice1 und cardDevice3 steht die Statuszeile dort
  **links**, heute auf allen drei Seiten **mittig**.
- Referenz 3 zeigt unter dem Haupt-Icon „Pause“ (damals der Name des Items); heute steht dort immer der Name des
  Geräts.
- Referenz 2 ist älter als die Status-Icons: Der Knopf „Pause“ hat dort noch das Tipp-Icon.

**Ergänzend** (nur Skript-Vorschauen, keine echten Aufnahmen): `hmi-cardDevice1.png`, `hmi-cardDevice1-plain.png`,
`hmi-cardDevice2.png`, `hmi-cardDevice3.png` in diesem Ordner (maßstabsgetreu aus den Projektfonts, vom Werkzeug
`HMI/tools/card_device.py`) gegen `web-cardDevice1.png`, `web-cardDevice1-plain.png`, `web-cardDevice2.png`,
`web-cardDevice3.png` – gleiche Beispieldaten. Kopien älterer Vorschauen liegen unter
`/mnt/projekte/nspanel emu/preview_cardDevice*.png`.

`/mnt/projekte/nspanel emu/cardDevice3-neu.png` (2026-11-24) zeigt cardDevice3 mit einer **Spalte aus fünf
Status-Icons am rechten Rand** und schmaleren Info-Kacheln. Das steht in keinem der Ideen-Dokumente und nicht in
der Doku – vor dem Aufnehmen klären, ob das der Zielstand von Layout 3 ist (dann ändern sich R3, Doku §5
„Status-Icons“ und §6).

Sollen Referenzbilder in die Doku, werden sie beim Aufnehmen hierher kopiert (jetzt nicht).

## Bilder, die nur Entwickler-Dokumente verwenden

`hmi-cardDevice1.png`, `hmi-cardDevice1-plain.png`, `hmi-cardDevice2.png`, `hmi-cardDevice3.png` – eingebunden in
`doc/ideas/device-details/device-page-hmi.md`; `card_device.py --preview doc/Pictures/device-page` erzeugt sie neu.
Die Nutzer-Doku verwendet sie nicht (ihre Beispieldaten zeigen Einheiten mit Leerzeichen, der Adapter schreibt sie
ohne).
