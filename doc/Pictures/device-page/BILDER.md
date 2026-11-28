# Bildliste: Gerät mit Details und Geräteseite

Alle Bilder, die die Nutzer-Doku ([doc/de/deviceDetails.md](../../de/deviceDetails.md),
[doc/en/deviceDetails.md](../../en/deviceDetails.md)) und die [README dieses Ordners](README.md) verwenden.

Stand: 2026-11-24, nach der Integration (Geräteseite auf allen fünf Modellen). Ergänzt 2026-11-28: Status-Icons
und Stufen (TFT `device13`), siehe [Stufen der Status-Icons](#stufen-der-status-icons-2026-11-28).

## Überblick

| Wer | Was | Anzahl | Stand |
|---|---|---|---|
| automatisch (Puppeteer, Web-Panel) | Geräteseiten je Modell und die Detailseite | 23 (eu 5, us-l 3, us-p 3, web-l 6, web-p 6) | **aufgenommen und angesehen** |
| automatisch (Puppeteer, Web-Panel) | Stufen der Status-Icons (cardDevice1 4, cardDevice3 3 je Modell) | 21 (eu 7, us-p 7, web-l 7) | **aufgenommen und angesehen** (2026-11-28) |
| automatisch (Puppeteer, Admin) | Dialoge | 9 (2 vorhanden, 3 neu aufgenommen, 4 neu) | **aufgenommen und angesehen** |
| **Tim (echte Hardware)** | – | **0 – die Liste ist leer**, siehe [Hardware-Fotos](#hardware-fotos-tim) | – |

Das Web-Panel zeichnet jedes Modell: die Hardware-Modelle eu, us-l und us-p wie die HMI, dazu web-l und web-p.
Deshalb kommen alle Panel-Bilder aus dem Web-Panel. Dass die Web-Bilder der HMI entsprechen, zeigt der
[Abgleich Web ↔ HMI](#abgleich-web--hmi) gegen Tims echte Aufnahmen.

Entfallen sind `web-cardDevice1.png`, `web-cardDevice1-plain.png`, `web-cardDevice2.png` und `web-cardDevice3.png`
(eu mit den Beispieldaten des HMI-Werkzeugs): `eu-cardDevice*.png` ersetzen sie, es gibt nur noch eine
Beispielbelegung.

## Referenzbelegung

Alle Panel-Bilder zeigen dieselben drei Geräte – belegt wie in Tims Aufnahmen der EU-HMI vom 2026-11-23, mit den
Icons, die der Adapter von sich aus wählt, und Einheiten ohne Leerzeichen, wie der Adapter sie schreibt.

| Kürzel | Seite | Belegung |
|---|---|---|
| **R1** | cardDevice1 mit Status-Icons | Überschrift „Robbi“; links Pfeil hoch, rechts kein Pfeil. Haupt-Icon `robot-vacuum` (cyan), Name „Robbi“. Slot 1 Info: Batterie-Icon nach Füllstand (hellgelb), „Batterie“, „80%“. Slot 2 Info: Icon „123“ (`numeric`), „Fläche“, „34m²“. Knöpfe 3–6: „Starten“ (`gesture-tap-button`), „Pause“ (`pause`), „Laden“, „Suchen“ (`gesture-tap-button`), alle cyan. Vier Status-Icons (Stufe 1–3 Spalten, per `devIcons`): `wifi` (cyan), `trash-can` (grau), `air-filter` (weiß), `alert` (grau). Statuszeile „Reinigt Wohnzimmer, noch 12 min (Wischen)“. i-Icon. |
| **R1p** | cardDevice1 ohne Status-Icons | wie R1, Stufe „keine Status-Icons“. |
| **R2** | cardDevice2 | Überschrift und Gerätename „Waschmaschine“; Haupt-Icon `washing-machine` (cyan). Slot 1 großer Wert „1:23“, Name „Restzeit“, kleines Icon `information-outline`. Slot 2 Balken „Fortschritt“, 62 %, weiß. Slot 3 „Programm“ / „Baumwolle“ (`format-list-bulleted`). Slot 4 „Temperatur“ / „60°C“ (`thermometer`). Slot 5 „Schleudern“ / „1400U/min“ (`numeric`). Slot 6 Knopf „Pause“ (`toggle-switch`, grau). Statuszeile „Schleudern, noch 23 min - Fertig um 14:35“. i-Icon. |
| **R3** | cardDevice3 | Überschrift und Gerätename „ID.3“; Haupt-Icon `car` (cyan). Slots 1–6: „Batterie“ / „78%“, „Reichweite“ / „312km“, „Temperatur“ / „21,5°C“, „Verriegelt“ / „an“ (`toggle-switch`, cyan), „Ladeleistung“ / „11kW“, „Kilometer“ / „23456km“. Schalter 7 „Klima“ an, Schalter 8 „Laden“ an. Statuszeile „Lädt an Wallbox, 11 kW - voll um 17:40“. i-Icon. |
| **R4** | Detailseite (cardEntities) | Überschrift „Robbi“; links Pfeil hoch, rechts Pfeil runter (blättern). Zeilen: „Batterie“ / „80%“, „Signal“ / „-58dBm“ (`wifi`, cyan), „Firmware“ / „4.3.2“ (`chip`), „Fläche“ / „34m²“ (`numeric`). |
| **+X** | Web-Panel-Elemente (web-l, web-p) | Layout 1: Knöpfe „Zone“, „Leeren“. Layout 2: Info „Wasser“ / „48l“, Knöpfe „Stopp“, „Später“. Layout 3: Infos „Reifen“ / „2,4bar“, „Außen“ / „8,5°C“, Schalter „Heizung“ aus. |

Auf us-p und web-p ist die Statuszeile 262 px breit; der Adapter teilt die drei Statustexte dort
(`splitDevicePageStatus`), die Bilder zeigen den ersten Abschnitt: „Reinigt Wohnzimmer, noch 12“, „Schleudern, noch
23 min -“, „Lädt an Wallbox, 11 kW - voll“.

Gegenüber Tims Aufnahmen weicht die Belegung der Doku-Bilder an drei Stellen bewusst ab, weil der Adapter heute
anders sendet: das Batterie-Icon folgt dem Füllstand (in den Aufnahmen die volle Batterie), unter dem Haupt-Icon
von cardDevice2 steht der Gerätename (in der Aufnahme „Pause“), und der Knopf „Pause“ von R1p hat das Pause-Icon
(in der Aufnahme 160356 das Tipp-Icon). Für den Abgleich wurden die Seiten zusätzlich genau wie in den Aufnahmen
gerendert (nicht im Repo).

## Aufnahmeweg

Format: **PNG**, Bühne in Originalgröße (1 Pixel = 1 Panel-Pixel): eu und us-l 480 × 320, us-p 320 × 480, web-l
640 × 320, web-p 320 × 640. Nur die Bühne, ohne Hardware-Tasten und ohne Browser-Rand.

### Web-Panel (statisch gerendert)

`src-web/scripts/screenshot.mjs` spielt eine Liste von Panel-Nachrichten in das Web-Panel ein
(`/demo?mock=1&model=<Modell>`) und speichert die Bühne. Es braucht einen laufenden Vite-Server in `src-web` und ein
global installiertes Puppeteer.

```bash
cd src-web
npm start &                                   # Vite, Port 4174
node scripts/screenshot.mjs --in scripts/examples/ref-cardDevice1.txt \
     --out ../doc/Pictures/device-page/eu-cardDevice1.png --model eu --scale 1
```

`--model eu|us-l|us-p|web-l|web-p` wählt das Modell, `--scale 1` die Originalgröße (Vorgabe wäre 2x).

> **Schrift prüfen.** Das Web-Panel zeichnet mit Noto Sans aus `@fontsource/noto-sans`. Ist `node_modules` nur ein
> Symlink (Worktree), verweigert Vite die Schriftdateien mit 403 (`server.fs.strict`) und die Seite fällt
> **stillschweigend auf Arial/Liberation Sans** zurück – die Bilder sehen dann anders aus und viele Texte sind
> 4–9 % schmaler. So waren die ersten `web-l-*`/`web-p-*`-Bilder entstanden. Abhilfe: Vite mit einer eigenen
> Konfiguration starten, die `server: { fs: { strict: false } }` setzt (`npx vite --config <datei>`), und im
> Browser prüfen: `document.fonts.check("24px 'Noto Sans'")` muss `true` sein.

Eingabedateien mit der Referenzbelegung (`src-web/scripts/examples/`):

| Eingabedatei | Bild(er) | Modell |
|---|---|---|
| `ref-cardDevice1.txt`, `ref-cardDevice2.txt`, `ref-cardDevice3.txt` | `eu-cardDevice<n>.png` · `us-l-cardDevice<n>.png` · `web-l-cardDevice<n>-plain.png` | eu · us-l · web-l |
| `ref-cardDevice1-plain.txt` | `eu-cardDevice1-plain.png` | eu |
| `ref-cardDevice<n>-extras.txt` | `web-l-cardDevice<n>.png` | web-l |
| `ref-portrait-cardDevice<n>.txt` | `us-p-cardDevice<n>.png` · `web-p-cardDevice<n>-plain.png` | us-p · web-p |
| `ref-portrait-cardDevice<n>-extras.txt` | `web-p-cardDevice<n>.png` | web-p |
| `ref-cardEntities-detail.txt` | `eu-detail-page.png` | eu |

Dateinamen: bei eu heißt `-plain` „ohne Status-Icons“, bei web-l und web-p „ohne Web-Panel-Elemente“ (so hatte der
Web-Panel-Zweig die Dateien benannt; die Namen ohne Zusatz zeigen dort die voll belegte Seite). Ein Hardware-Modell
liest die Zusatz-Elemente hinter dem i-Icon nicht; eine Nachricht ohne sie zeigt ein Web-Modell ohne Zusatz-Elemente.

Die älteren Beispiele `cardDevice*.txt`, `us-p-cardDevice*.txt`, `web-l-cardDevice*.txt` und
`web-p-cardDevice*.txt` (Beispieldaten des HMI-Werkzeugs) bleiben für die Tests des Web-Panels. Die Kommentare in
`web-l-cardDevice*.txt` und `web-p-cardDevice*.txt` nennen noch die gleichnamigen Bilder – diese Bilder zeigen
jetzt die Referenzbelegung.

### Admin (Dev-Server, Puppeteer)

Wie die vorhandenen `admin-*.png` (Commit `d4a0d7761`): Admin des Dev-Servers `http://localhost:8081/`, nach dem
Laden `location.hash = '#tab-instances/config/system.adapter.nspanel-lovelace-ui.0'`, Tab **PageConfig**, Seite
`devicepage_test`, Item anklicken. Helles Standard-Thema, Sprache Deutsch, Fensterbreite 1500 px. Ausschnitte:

- ganzer Dialog: `.MuiDialog-paper` (bei zwei offenen Dialogen `.MuiDialog-root:last-of-type .MuiDialog-paper`),
- Bereich der Geräteseite: `[data-dd="device-page-section"]`, Statuszeile `[data-dd="device-page-status"]` /
  `[data-dd="device-page-status-custom"]`, Slot-Zeilen `[data-dd="device-page-slot"]`,
  `[data-dd="device-page-slot-custom"]`, „…“-Knopf `[data-dd="device-page-slot-settings"]`, Web-Panel-Elemente
  `[data-dd="device-page-web-extras"]`.

Die Testdaten des Dev-Servers (`0_userdata.0.devicepage.robot`, `.washer`, `.car`, Seite `devicepage_test`) stehen
nur in den Notizen, nicht im Repo.

## Web-Panel-Aufnahmen

„Doku“ = `doc/de/deviceDetails.md` und `doc/en/deviceDetails.md`. Alle Bilder: Screenshot Web-Panel, automatisch
(Puppeteer), aufgenommen und einzeln angesehen am 2026-11-24.

| Dateiname | Modell | Was zu sehen ist | Verwendet in | erledigt |
|---|---|---|---|---|
| `eu-cardDevice1.png` | eu | cardDevice1, **R1** (vier Status-Icons, schmale Info-Zeilen) | Doku Einstieg, §5 Status-Icons, §6, §8 EU; README; Abgleich 1 | ☑ |
| `eu-cardDevice1-plain.png` | eu | cardDevice1, **R1p** (ohne Status-Icons, breite Info-Zeilen) | Doku §5 Status-Icons; README; Abgleich 2 | ☑ |
| `eu-cardDevice2.png` | eu | cardDevice2, **R2**, Balken bei 62 %; der Gerätename unter dem Icon ist an der Feldgrenze abgeschnitten | Doku §6, §8 EU, §10; README; Abgleich 3 | ☑ |
| `eu-cardDevice3.png` | eu | cardDevice3, **R3**, beide Schalter an | Doku §6, §8 EU; README; Abgleich 4 | ☑ |
| `eu-detail-page.png` | eu | Detailseite, **R4** | Doku §3; README; Abgleich 5 | ☑ |
| `us-l-cardDevice1.png` | us-l | cardDevice1, **R1**, Inhalt 15 px weiter rechts | Doku §8 US-Querformat; README | ☑ |
| `us-l-cardDevice2.png` | us-l | cardDevice2, **R2** | Doku §8 US-Querformat; README | ☑ |
| `us-l-cardDevice3.png` | us-l | cardDevice3, **R3** | Doku §8 US-Querformat; README | ☑ |
| `us-p-cardDevice1.png` | us-p | cardDevice1 hochkant, **R1**: Haupt-Icon oben links, Info-Zeilen (Satz C) daneben, darunter vier Status-Icons in zwei Spalten, Knöpfe 2×2 (neu aufgenommen 2026-11-28) | Doku §8 US-Hochformat; README | ☑ |
| `us-p-cardDevice2.png` | us-p | cardDevice2 hochkant, **R2**: Infos als Zeilen, Knopf über die volle Breite | Doku §8 US-Hochformat; README | ☑ |
| `us-p-cardDevice3.png` | us-p | cardDevice3 hochkant, **R3**: Haupt-Icon mittig, Schalter als Zeilen | Doku §8 US-Hochformat; README | ☑ |
| `web-l-cardDevice1-plain.png` | web-l | cardDevice1, **R1**, ohne Web-Panel-Elemente: vier Knöpfe über 640 px | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice2-plain.png` | web-l | cardDevice2, **R2**, ohne Web-Panel-Elemente | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice3-plain.png` | web-l | cardDevice3, **R3**, ohne Web-Panel-Elemente | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice1.png` | web-l | cardDevice1, **R1 +X**: sechs Knöpfe in einer Reihe | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice2.png` | web-l | cardDevice2, **R2 +X**: drei Knöpfe oben rechts, vier Info-Kacheln | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice3.png` | web-l | cardDevice3, **R3 +X**: acht Info-Kacheln in drei Spalten, drei Schalter | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice1-plain.png` | web-p | cardDevice1, **R1**, ohne Web-Panel-Elemente: zwei Knopfreihen | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice2-plain.png` | web-p | cardDevice2, **R2**, ohne Web-Panel-Elemente | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice3-plain.png` | web-p | cardDevice3, **R3**, ohne Web-Panel-Elemente | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice1.png` | web-p | cardDevice1, **R1 +X**: drei Knopfreihen | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice2.png` | web-p | cardDevice2, **R2 +X**: vier Info-Zeilen, drei Knöpfe in einer Reihe | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice3.png` | web-p | cardDevice3, **R3 +X**: vier Kachelreihen, drei Schalterzeilen | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |

## Stufen der Status-Icons (2026-11-28)

Seit TFT `device13` kommen die Status-Icons per `devIcons~…`, die Stufe steht in Feld 6 des info-Elements, die Typen
sind Zahlen. Alle Eingabedateien unter `src-web/scripts/examples/` sind auf dieses Protokoll umgestellt (cardDevice1
ohne die Slots 7–10; wo die alte Datei Status-Icons hatte, folgt eine `devIcons`-Zeile, Stufe 1). Die Bilder mit
cardDevice1 (`eu-`, `us-l-`, `us-p-cardDevice1.png`, `web-l-` und `web-p-cardDevice1[-plain].png`) sind damit neu
aufgenommen; `eu-cardDevice1-plain.png` ist unverändert (gleiche Pixel). Die übrigen Bilder sind gleich geblieben.

**Belegung je Stufe** (Eingabedateien `ref-cardDevice<n>-stage<s>.txt` für eu und web-l,
`ref-portrait-cardDevice<n>-stage<s>.txt` für us-p; erzeugt aus **R1p** bzw. **R3**):

| Seite | Stufe | Status-Icons (Reihenfolge = spaltenweise im Raster) | Was die Stufe verdeckt |
|---|---|---|---|
| cardDevice1 | 0 (keine) | – | – |
| | 1 (1–3 Spalten) | 5: `wifi` cyan, `trash-can` grau, `air-filter` weiß, `alert` grau, `battery-charging` grün | – (Info-Zeilen Satz B: kurzer Name) |
| | 2 (4–5 Spalten) | 9: dazu `water` cyan, `brush` weiß, `lock` grau, `fan` cyan | – (Satz C: kein Name) |
| | 3 (6–8 Spalten) | 14: dazu `map-marker` weiß, `home-import-outline` grau, `weather-night` grau, `volume-high` weiß, `update` grau | Info-Zeilen 1 und 2 (der Adapter schickt sie leer) |
| cardDevice3 | 0 (keine) | – | – |
| | 1 (1–4) | 4: `car-door-lock` cyan, `ev-plug-type2` grün, `snowflake` cyan, `car-tire-alert` gelb | Kachel 1 (Batterie) |
| | 2 (5–8) | 7: dazu `car-light-high` grau, `map-marker` weiß, `car-battery` grün | Kacheln 1 und 2 (Batterie, Reichweite) |

Die halb belegte letzte Spalte (5 bzw. 9 Icons) zeigt das leere Kästchen mit Rahmen, und 14 Icons in Stufe 3 zeigen,
dass nur die belegten Spalten erscheinen.

**Aufnahme:** wie oben mit `scripts/screenshot.mjs --scale 1 --buttons 0`, Vite mit eigener Konfiguration
(`server.fs.strict: false`, Port 4374, nicht im Repo); vorher geprüft: `document.fonts.check("24px 'Noto Sans'")`
ist `true` nach dem Laden der Schrift, keine Antwort 403.

| Dateiname | Modell | Was zu sehen ist | Verwendet in | erledigt |
|---|---|---|---|---|
| `eu-cardDevice1-stage0.png` … `-stage3.png` | eu | cardDevice1 in den Stufen 0–3 | Doku §5 Status-Icons | ☑ |
| `eu-cardDevice3-stage0.png` … `-stage2.png` | eu | cardDevice3 in den Stufen 0–2 | Doku §5 Status-Icons | ☑ |
| `us-p-cardDevice1-stage0.png` … `-stage3.png` | us-p | cardDevice1 hochkant (Variante P2): Raster unter dem Haupt-Icon, Satz C rechts daneben | Doku §5 Status-Icons | ☑ |
| `us-p-cardDevice3-stage0.png` … `-stage2.png` | us-p | cardDevice3 hochkant, Raster in der ersten Kachelreihe | Doku §5 Status-Icons | ☑ |
| `web-l-cardDevice1-stage0.png` … `-stage3.png` | web-l | cardDevice1 auf Smartphone quer: Raster wie eu, Info-Zeilen bis zum rechten Rand | Doku §5 Status-Icons | ☑ |
| `web-l-cardDevice3-stage0.png` … `-stage2.png` | web-l | cardDevice3 auf Smartphone quer | Doku §5 Status-Icons | ☑ |

Abgleich mit den HMI-Vorschauen `next/hmi-[<modell>-]cardDevice1-stage0..3.png` und `…cardDevice3-stage0..2.png`
(Beispieldaten des Werkzeugs): Raster, Sätze A/B/C und ausgeblendete Kacheln liegen an denselben Stellen.

## Admin-Aufnahmen

Alle: Screenshot Admin, automatisch (Puppeteer, Admin), aufgenommen am Dev-Server (2026-11-24); die Doku bindet sie
ein. `admin-filterlist.png` zeigt ein nachgebautes Shelly 2.5 („Wohnzimmer-Rollladen“,
`shelly.0.SHSW-25#A1B2C3D4E5F6#1`), `admin-slot-custom.png` und `admin-web-extra.png` die Zielseite
`devicepage_rooms`.

| Dateiname | Was zu sehen sein soll | Verwendet in | Stand |
|---|---|---|---|
| `admin-device-item.png` | Pageitem-Konfiguration, Art **Gerät mit Details**, Gerät `0_userdata.0.devicepage.robot` („Robbi – … Einträge angehakt“), Kurzer Tipp, Knopf Filterliste, **Long-Press öffnet: Detailseite** (kein Geräteseiten-Bereich) | Doku Schnellstart 1 | ☑ |
| `admin-filterlist.png` | Dialog **Filterliste** eines Geräts mit Maske und gleichnamigen Zeilen (z. B. Shelly mit mehreren Temperaturen): angehakte oben, Spalten Eintrag/State, Feld **2. Zeile** sichtbar | Doku §3 | ☑ |
| `admin-shortpress.png` | **vorhanden, bleibt:** Kurzer Tipp mit „Geräteseite öffnen“, Filterliste-Knopf, Long-Press öffnet: Geräteseite | Doku §2; README | ☑ |
| `admin-overview.png` | **vorhanden, neu aufnehmen:** ganzer Dialog mit Geräteseite Layout 1, alle zehn Slots belegt, Haupt-Icon, Statuszeile, darunter das Häkchen „Web-Panel-Elemente (web-l / web-p)“ (aus) und „i-Icon anzeigen“. Das alte Bild zeigt noch den Hinweis „nur auf EU-Panels und Web-Panels im Querformat“ | Doku Schnellstart 2, §5; README | ☑ |
| `admin-status-custom.png` | **vorhanden, bleibt:** Statuszeile „Benutzerdefinierter Datenpunkt“ mit ID-Feld | Doku §5 Statuszeile; README | ☑ |
| `admin-slot-custom.png` | **vorhanden, neu aufnehmen** (die Wahl heißt jetzt „Kanal“, dazu „Navigation“): Slots mit Benutzerdefiniert → Datenpunkt, → Kanal, → **Navigation** mit Zielseite und ein Datenpunkt mit „passt nicht zu diesem Slot“ | Doku §5 Benutzerdefiniert; README | ☑ |
| `admin-slot-dialog.png` | **vorhanden, neu aufnehmen** (zeigt noch den früheren kleinen Dialog): „…“ eines **Knopf**-Slots = Pageitem-Konfiguration ohne Kanalauswahl, Titel mit „4 Knopf“, Name, Icon `pause`/`play` und Farben für wahr/unwahr, Langer Druck | Doku §5 Einstellungen des Elements; README | ☑ |
| `admin-slot-dialog-status.png` | „…“ eines **Status-Icon**-Slots: kleiner Dialog „Einstellungen des Elements“ mit Icon/Farbe, „Farbverlauf …“ und „Kurzer Tipp“ | Doku §5 Einstellungen des Elements | ☑ |
| `admin-web-extra.png` | Bereich der Geräteseite mit **gesetztem Häkchen** „Web-Panel-Elemente (web-l / web-p)“: darunter die zusätzlichen Slots (am besten Layout 2: 7 Info-Zeile, 8–9 Knopf) | Doku §5 Zusätzliche Elemente | ☑ |

Die Kommentare `<!-- BILD FOLGT … -->` / `<!-- BILD NEU AUFNEHMEN … -->` in der Doku sind entfernt.

## Hardware-Fotos (Tim)

**Keine.** Jedes Bild der Doku kommt aus dem Web-Panel oder dem Admin:

- Aussehen je Modell und Layout: Web-Panel mit dem jeweiligen Modell.
- Blinken beim langen Druck: zeigt nur die HMI, das Web-Panel nicht. Die Doku beschreibt es im Text; ein Standbild
  würde es ohnehin nicht zeigen, deshalb ist kein Foto eingeplant.
- Wechselnder Statustext: ein Ablauf, im Text beschrieben.

## Abgleich Web ↔ HMI

Durchgeführt am 2026-11-24. Referenzen sind Tims echte Aufnahmen der EU-HMI (Nextion-Simulator) in der Wurzel von
`/mnt/projekte/` (nur lesbar). Verglichen wurde jeweils eine Web-Aufnahme des Modells **eu** in Originalgröße, die
genau die Nachricht der Aufnahme nachbildet (gleiche Texte, Icons, Farben), mit Noto Sans.

**Verfahren:** Die Aufnahmen haben teils einen Fensterrand. Der Versatz des Panel-Inhalts wurde je Bild bestimmt
(grauer Rand links/oben) und an der Lage des i-Icons gegengeprüft – es liegt danach in allen fünf Bildern an
derselben Stelle. Dann wurde für jedes Element in seinem Feld (Maße aus
[device-page-hmi.md](../../ideas/device-details/device-page-hmi.md)) das Rechteck der hellen Pixel in beiden
Bildern gemessen und verglichen (links / oben / rechts / unten in Pixeln, Web minus HMI), dazu die häufigste Farbe.

| # | Referenz | Größe, Versatz | Web-Aufnahme | Ergebnis |
|---|---|---|---|---|
| 1 | `Screenshot 2026-11-23 202151.png` | 481 × 326, 0 / 1 | cardDevice1 mit Status-Icons (R1) | **deckt sich.** Rahmen des Status-Rasters deckungsgleich (x 124–198, y 71–159). Haupt-Icon ±0…1. Texte: linke Kante ±1, Breite 0…+1 px („Batterie“ 64 → 65, „Starten“ 58 → 59), Unterkante gleich. Icons der Info-Zeilen, Knöpfe und des Rasters 1–2 px weiter rechts bzw. größer. Statuszeile: HMI linksbündig (x 12–386), Web mittig (19–391). |
| 2 | `Screenshot 2026-11-23 160356.png` | 479 × 319, 1 / 1 | cardDevice1 ohne Status-Icons (R1p) | **deckt sich.** Kein Raster, Info-Zeilen breit: Icon x 136 / 137, Name ab x 166 / 165, Wert endet x 437 / 438. Sonst wie 1. |
| 3 | `Screenshot 2026-11-23 160338.png` | 481 × 320, 0 / 0 | cardDevice2 (R2) | **deckt sich.** Rahmen des Balkens deckungsgleich (x 10–438, y 207–220), Füllung endet bei x 274 / 275. Statuszeile in beiden mittig: x 28–381 / 27–382. Info-Kacheln: Namen ±0…2, rechtsbündige Werte enden ±0…1. Großer Wert „1:23“: linke Kante gleich, 4 px breiter (109 → 113). Überschrift 3 px breiter. |
| 4 | `Screenshot 2026-11-23 160313.png` | 480 × 320, 2 / 2 (Ausschnitt verschoben) | cardDevice3 (R3) | **deckt sich.** Beide Schalter deckungsgleich. Kacheln: Namen beginnen ±1, enden gleich; Werte enden ±0…1; Icons 1–2 px weiter rechts. Statuszeile: HMI linksbündig (x 12–332), Web mittig (45–365). |
| 5 | `Screenshot 2026-11-23 202318.png` | 488 × 326, 7 / 4 | Detailseite (R4) | **deckt sich bis auf wenige Pixel.** Überschrift und Pfeile ±1. Icons 1–2 px weiter links, Namen 1–2 px weiter links, Werte enden 2–4 px weiter links. Werte in beiden weiß. |

**Abweichungen und ihre Ursache:**

| Abweichung | Größe | Ursache | Fehler des Web-Panels? |
|---|---|---|---|
| Statuszeile auf cardDevice1 und cardDevice3 links statt mittig | 7 bzw. 33 px | Aufnahmen von Test-HMIs vor `device9`; seitdem ist die Zeile auf allen drei Seiten mittig | nein |
| Batterie-Icon: volle Batterie statt Füllstand; Name unter dem Haupt-Icon von cardDevice2 „Pause“; Knopf „Pause“ in 160356 mit Tipp-Icon | Inhalt | älterer Stand von Adapter und Testdaten | nein |
| Textfarbe: HMI (205, 255, 255), Web weiß (255, 255, 255). Betrifft Überschrift, Namen, Werte, Statuszeile und den Rahmen des Balkens (die HMI zeichnet ihn in der Textfarbe) | Farbe | Das Web-Panel zeichnet den Text aller Karten weiß. In `doc/web-panel/PLAN.md` als bekannt vermerkt („HMI-Textfarbe hat einen Cyan-Stich … nicht übernommen“) | bekannte Abweichung aller Karten, nicht der Geräteseite |
| Icons 1–2 px weiter rechts und 1–2 px breiter (z. B. Glyphe 23 → 24 px) | 1–2 px | Icon-Schrift im Browser gegen die gerasterten Nextion-Schriften | gering, nicht behoben |
| Großer Wert „1:23“ 4 px breiter, Überschrift „Waschmaschine“ 3 px breiter | 3–4 px | Noto Sans im Browser gegen Nextion-Font 4 bzw. 2 | gering |
| Detailseite: Werte enden 2–4 px, Icons und Namen 1–2 px weiter links | 1–4 px | cardEntities des Web-Panels, nicht die Geräteseite | gering |
| Übrige Farben (Cyan, Grau, Hellgelb, Schalter-Blau, Pfeil-Blau) | ≤ 3 je Kanal | Rundung RGB565 → RGB | nein |

**Nicht prüfbar mit diesen Aufnahmen:** das **Abschneiden an der Feldgrenze** – in keiner Aufnahme ist ein Text
länger als sein Feld. Das Web-Panel schneidet an der Feldgrenze ab (zu sehen in `eu-cardDevice2.png`: der
Gerätename „Waschmaschine“ im 96 px breiten Feld unter dem Haupt-Icon, sichtbar ist der Anfang „Waschmasc“). Ob die
HMI einen zu langen **mittig** ausgerichteten Text ebenso am Anfang beginnen lässt, ist am Panel anzusehen
(README, Bildtabelle). Ebenfalls ohne echte Referenz: us-l und us-p – dort vergleicht der Test
`src-web/src/cards/cardDevice/geometry.test.ts` jede Box mit `device-page-geometry.json` der HMI.

**Bekannter Unterschied us-l:** Das Web-Panel verschiebt auf us-l nur den Inhalt der Karte um 15 px, die Kopfzeile
(Pfeile, Überschrift) zeichnet es wie auf eu; auf der echten us-l-HMI sitzt auch sie 15 px weiter rechts
(`doc/web-panel/SMARTPHONE.md`, „Geräteseiten“). Das gilt für alle Karten des Web-Panels.

`/mnt/projekte/nspanel emu/cardDevice3-neu.png` (Status-Icon-Spalte auf Layout 3) ist ein Entwurf und kein
Zielstand: Status-Icons gibt es nur auf Layout 1.

## Bilder, die nur Entwickler-Dokumente verwenden

`hmi-cardDevice*.png`, `hmi-us-l-cardDevice*.png`, `hmi-us-p-cardDevice*.png` – Vorschauen des Werkzeugs
`HMI/tools/card_device.py` (`--preview doc/Pictures/device-page`), eingebunden in
`doc/ideas/device-details/device-page-hmi.md`. Die Nutzer-Doku verwendet sie nicht (ihre Beispieldaten zeigen
Einheiten mit Leerzeichen, der Adapter schreibt sie ohne).
