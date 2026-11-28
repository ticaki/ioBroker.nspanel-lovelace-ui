# Bildliste: Gerät mit Details und Geräteseite

Alle Bilder, die die Nutzer-Doku ([doc/de/deviceDetails.md](../../de/deviceDetails.md),
[doc/en/deviceDetails.md](../../en/deviceDetails.md)) und die [README dieses Ordners](README.md) verwenden. Die
Admin-Bilder der Status-Icon-Stufen liegen in [../device-page-stages/](../device-page-stages/README.md).

Stand: 2026-11-28 – Geräteseite auf allen fünf Modellen, Status-Icons in Stufen (TFT `device14`: Info-Sätze B und C
von cardDevice1 6 px weiter rechts als in `device13`, siehe
[Stufen der Status-Icons](#stufen-der-status-icons-2026-11-28)); die Nutzer-Doku zeigt die Admin-Bedienung der Stufen
mit den Bildern aus `../device-page-stages/` und das EU-Panel und das US-Hochformat je Icon-Anzahl mit Tims Aufnahmen
der echten HMI (`hmi/`, siehe [Aufnahmen der echten HMI](#aufnahmen-der-echten-hmi-device14-2026-11-28)).

## Überblick

| Wer | Was | Anzahl | Stand |
|---|---|---|---|
| automatisch (Puppeteer, Web-Panel) | Geräteseiten je Modell und die Detailseite | 23 (eu 5, us-l 3, us-p 3, web-l 6, web-p 6) | **aufgenommen und angesehen** |
| automatisch (Puppeteer, Web-Panel) | Stufen der Status-Icons (cardDevice1 4, cardDevice3 3 je Modell) | 21 (eu 7, us-p 7, web-l 7) | **aufgenommen und angesehen** (2026-11-28; eu und web-l `cardDevice1-stage1/2` für `device14` neu aufgenommen) |
| automatisch (Puppeteer, Admin) | Dialoge | 8 (`admin-overview.png` mit dem früheren 2×2-Raster ist gelöscht, ersetzt durch `../device-page-stages/layout3-stage0.png`) | **aufgenommen und angesehen** |
| automatisch (Puppeteer, Admin) | Stufen der Status-Icons im Dialog (`../device-page-stages/`) | 11 | **aufgenommen und angesehen** (2026-11-28, mit bereinigten Testdaten neu aufgenommen, ohne rote Hinweise), Prüftabelle in [../device-page-stages/README.md](../device-page-stages/README.md) |
| **Tim (Nextion-Simulator, echte HMI `device14` EU und us-p)** | Status-Icons je Anzahl: cardDevice1 mit 0, 2 … 16, cardDevice3 mit 0–8 Icons (`hmi/`, us-p mit Präfix `us-p-`) | 36 (eu 18, us-p 18) | **aufgenommen** (2026-11-28) **und angesehen**, [Abgleich](#device14-stufen-gegen-die-echte-hmi-2026-11-28) |
| **Tim (echte Hardware)** | – | **0 – die Liste ist leer**, siehe [Hardware-Fotos](#hardware-fotos-tim) | – |

Das Web-Panel zeichnet jedes Modell: die Hardware-Modelle eu, us-l und us-p wie die HMI, dazu web-l und web-p.
Deshalb kommen die Panel-Bilder aus dem Web-Panel – mit einer Ausnahme: die Übersicht je Icon-Anzahl in der
Nutzer-Doku (Abschnitt „Die Stufe“) zeigt Tims Aufnahmen der echten EU- und us-p-HMI aus `hmi/`. Dass die Web-Bilder der HMI
entsprechen, zeigt der [Abgleich Web ↔ HMI](#abgleich-web--hmi) gegen Tims echte Aufnahmen.

Entfallen sind `web-cardDevice1.png`, `web-cardDevice1-plain.png`, `web-cardDevice2.png` und `web-cardDevice3.png`
(eu mit den Beispieldaten des HMI-Werkzeugs): `eu-cardDevice*.png` ersetzen sie, es gibt nur noch eine
Beispielbelegung.

## Referenzbelegung

Alle Panel-Bilder zeigen dieselben drei Geräte – belegt wie in Tims Aufnahmen der EU-HMI vom 2026-11-23, mit den
Icons, die der Adapter von sich aus wählt, und Einheiten ohne Leerzeichen, wie der Adapter sie schreibt.

| Kürzel | Seite | Belegung |
|---|---|---|
| **R1** | cardDevice1 mit Status-Icons | Überschrift „Robbi“; links Pfeil hoch, rechts kein Pfeil. Haupt-Icon `robot-vacuum` (cyan), Name „Robbi“. Slot 1 Info: Batterie-Icon nach Füllstand (hellgelb), „Batterie“, „80%“. Slot 2 Info: Icon „123“ (`numeric`), „Fläche“, „34m²“. Knöpfe 3–6: „Starten“ (`gesture-tap-button`), „Pause“ (`pause`), „Laden“, „Suchen“ (`gesture-tap-button`), alle cyan. Stufe 1–3 Spalten mit vier Status-Icons (per `devIcons`, spaltenweise): `wifi` (cyan), `trash-can` (grau), `air-filter` (weiß), `alert` (grau) – zwei Spalten, die Info-Zeilen mit kurzem Namen (eu: „Batte“, „Fläch“; us-p: nur Icon und Wert). Statuszeile „Reinigt Wohnzimmer, noch 12 min (Wischen)“. i-Icon. |
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
(Puppeteer), aufgenommen und einzeln angesehen am 2026-11-24; die Bilder mit cardDevice1 neu aufgenommen am
2026-11-28 (Protokoll `device13`, siehe unten) und die Bilder mit Satz B oder C auf eu, us-l und web-l noch einmal
für `device14` (Satz B/C 6 px weiter rechts, siehe [Stufen der Status-Icons](#stufen-der-status-icons-2026-11-28)).

| Dateiname | Modell | Was zu sehen ist | Verwendet in | erledigt |
|---|---|---|---|---|
| `eu-cardDevice1.png` | eu | cardDevice1, **R1** (Stufe 1–3 Spalten: vier Status-Icons in zwei Spalten, Info-Zeilen mit kurzem Namen; neu aufgenommen 2026-11-28, für `device14` erneut) | Doku Einstieg, §6, §8 EU; README; Abgleich 1 (gegen den Stand von 2026-11-24) | ☑ |
| `eu-cardDevice1-plain.png` | eu | cardDevice1, **R1p** (ohne Status-Icons, breite Info-Zeilen) | README; Abgleich 2 | ☑ |
| `eu-cardDevice2.png` | eu | cardDevice2, **R2**, Balken bei 62 %; der Gerätename unter dem Icon ist an der Feldgrenze abgeschnitten | Doku §6, §8 EU, §10; README; Abgleich 3 | ☑ |
| `eu-cardDevice3.png` | eu | cardDevice3, **R3**, beide Schalter an | Doku §6, §8 EU; README; Abgleich 4 | ☑ |
| `eu-detail-page.png` | eu | Detailseite, **R4** | Doku §3; README; Abgleich 5 | ☑ |
| `us-l-cardDevice1.png` | us-l | cardDevice1, **R1**, Inhalt 15 px weiter rechts (neu aufgenommen 2026-11-28, für `device14` erneut) | Doku §8 US-Querformat; README | ☑ |
| `us-l-cardDevice2.png` | us-l | cardDevice2, **R2** | Doku §8 US-Querformat; README | ☑ |
| `us-l-cardDevice3.png` | us-l | cardDevice3, **R3** | Doku §8 US-Querformat; README | ☑ |
| `us-p-cardDevice1.png` | us-p | cardDevice1 hochkant, **R1**: Haupt-Icon oben links, Info-Zeilen (Satz C) daneben, darunter vier Status-Icons in zwei Spalten, Knöpfe 2×2 (neu aufgenommen 2026-11-28) | Doku §8 US-Hochformat; README | ☑ |
| `us-p-cardDevice2.png` | us-p | cardDevice2 hochkant, **R2**: Infos als Zeilen, Knopf über die volle Breite | Doku §8 US-Hochformat; README | ☑ |
| `us-p-cardDevice3.png` | us-p | cardDevice3 hochkant, **R3**: Haupt-Icon mittig, Schalter als Zeilen | Doku §8 US-Hochformat; README | ☑ |
| `web-l-cardDevice1-plain.png` | web-l | cardDevice1, **R1**, ohne Web-Panel-Elemente: vier Knöpfe über 640 px (neu aufgenommen 2026-11-28, für `device14` erneut) | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice2-plain.png` | web-l | cardDevice2, **R2**, ohne Web-Panel-Elemente | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice3-plain.png` | web-l | cardDevice3, **R3**, ohne Web-Panel-Elemente | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice1.png` | web-l | cardDevice1, **R1 +X**: sechs Knöpfe in einer Reihe (neu aufgenommen 2026-11-28, für `device14` erneut) | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice2.png` | web-l | cardDevice2, **R2 +X**: drei Knöpfe oben rechts, vier Info-Kacheln | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-l-cardDevice3.png` | web-l | cardDevice3, **R3 +X**: acht Info-Kacheln in drei Spalten, drei Schalter | Doku §8 Smartphone quer; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice1-plain.png` | web-p | cardDevice1, **R1**, ohne Web-Panel-Elemente: zwei Knopfreihen (neu aufgenommen 2026-11-28) | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice2-plain.png` | web-p | cardDevice2, **R2**, ohne Web-Panel-Elemente | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice3-plain.png` | web-p | cardDevice3, **R3**, ohne Web-Panel-Elemente | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice1.png` | web-p | cardDevice1, **R1 +X**: Raster unter dem Haupt-Icon, drei Knopfreihen (neu aufgenommen 2026-11-28) | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice2.png` | web-p | cardDevice2, **R2 +X**: vier Info-Zeilen, drei Knöpfe in einer Reihe | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |
| `web-p-cardDevice3.png` | web-p | cardDevice3, **R3 +X**: vier Kachelreihen, drei Schalterzeilen | Doku §8 Smartphone hochkant; README; SMARTPHONE.md | ☑ |

## Stufen der Status-Icons (2026-11-28)

Seit TFT `device13` kommen die Status-Icons per `devIcons~…`, die Stufe steht in Feld 6 des info-Elements, die Typen
sind Zahlen. Alle Eingabedateien unter `src-web/scripts/examples/` sind auf dieses Protokoll umgestellt (cardDevice1
ohne die Slots 7–10; wo die alte Datei Status-Icons hatte, folgt eine `devIcons`-Zeile, Stufe 1). Die Bilder mit
cardDevice1 (`eu-`, `us-l-`, `us-p-cardDevice1.png`, `web-l-` und `web-p-cardDevice1[-plain].png`) sind damit neu
aufgenommen; `eu-cardDevice1-plain.png` ist unverändert (gleiche Pixel). Die übrigen Bilder sind gleich geblieben.

**`device14` (2026-11-28):** Die Info-Sätze B und C von cardDevice1 beginnen 6 px weiter rechts (eu Icon B x 247,
C x 321; us-l 262 / 336; Name B 43 px, Wert C 81 px breit; web-l ebenso, us-p unverändert). Neu aufgenommen sind
deshalb die acht Bilder, die cardDevice1 mit Satz B oder C auf eu, us-l oder web-l zeigen: `eu-cardDevice1.png`,
`us-l-cardDevice1.png`, `web-l-cardDevice1-plain.png` (alle aus `ref-cardDevice1.txt`, Stufe 1), `web-l-cardDevice1.png`
(`ref-cardDevice1-extras.txt`), `eu-` und `web-l-cardDevice1-stage1.png` / `-stage2.png`
(`ref-cardDevice1-stage1/2.txt`). Vorher/nachher per Pixelvergleich: die Unterschiede liegen nur in den Info-Zeilen
(eu y 83–144, x 248–327 in Satz B bzw. 322–350 in Satz C; us-l 15 px weiter rechts; web-l Satz B bis x 351). Zur
Gegenprobe mit aufgenommen und pixelgleich geblieben: `eu-cardDevice1-plain.png`, `eu-`/`web-l-cardDevice1-stage0.png`
und `-stage3.png`, `eu-cardDevice2.png`, `eu-cardDevice3-stage1.png` – damit ist auch die Schrift (Noto Sans) dieselbe
wie bei den bisherigen Aufnahmen. us-p und web-p sind nicht neu aufgenommen.

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
ist `true` nach dem Laden der Schrift, keine Antwort 403. Für `device14` (2026-11-28): Vite mit der Konfiguration des
Repos auf Port 4374 (`node_modules` von `src-web` ist ein echtes Verzeichnis, kein Symlink), ebenso geprüft –
`document.fonts.check` `true` nach dem Laden, keine Antwort 403 außer `favicon.ico` (404) – und durch die pixelgleichen
Gegenproben oben bestätigt.

| Dateiname | Modell | Was zu sehen ist | Verwendet in | erledigt |
|---|---|---|---|---|
| `eu-cardDevice1-stage0.png` … `-stage3.png` | eu | cardDevice1 in den Stufen 0–3 (`-stage1`/`-stage2` für `device14` neu aufgenommen) | README; Abgleich device14. Seit 2026-11-28 nicht mehr in der Doku – dort stehen die Aufnahmen der echten HMI (`hmi/cardDevice1-icons-*.png`) | ☑ |
| `eu-cardDevice3-stage0.png` … `-stage2.png` | eu | cardDevice3 in den Stufen 0–2 | README; Abgleich device14. Seit 2026-11-28 nicht mehr in der Doku – dort stehen die Aufnahmen der echten HMI (`hmi/cardDevice3-icons-*.png`) | ☑ |
| `us-p-cardDevice1-stage0.png` … `-stage3.png` | us-p | cardDevice1 hochkant (Variante P2): Raster unter dem Haupt-Icon, Satz C rechts daneben | README; Abgleich device14. Seit 2026-11-28 nicht mehr in der Doku – dort stehen die Aufnahmen der echten HMI (`hmi/us-p-cardDevice1-icons-*.png`) | ☑ |
| `us-p-cardDevice3-stage0.png` … `-stage2.png` | us-p | cardDevice3 hochkant, Raster in der ersten Kachelreihe | README; Abgleich device14. Seit 2026-11-28 nicht mehr in der Doku – dort stehen die Aufnahmen der echten HMI (`hmi/us-p-cardDevice3-icons-*.png`) | ☑ |
| `web-l-cardDevice1-stage0.png` … `-stage3.png` | web-l | cardDevice1 auf Smartphone quer: Raster wie eu, Info-Zeilen bis zum rechten Rand (`-stage1`/`-stage2` für `device14` neu aufgenommen) | Doku §5 Status-Icons; README | ☑ |
| `web-l-cardDevice3-stage0.png` … `-stage2.png` | web-l | cardDevice3 auf Smartphone quer | Doku §5 Status-Icons; README | ☑ |

Abgleich mit den HMI-Vorschauen `next/hmi-[<modell>-]cardDevice1-stage0..3.png` und `…cardDevice3-stage0..2.png`
(Beispieldaten des Werkzeugs): Raster, Sätze A/B/C und ausgeblendete Kacheln liegen an denselben Stellen. Für eu
und us-p zusätzlich gegen die echte HMI geprüft: [device14: Stufen gegen die echte HMI](#device14-stufen-gegen-die-echte-hmi-2026-11-28).

## Aufnahmen der echten HMI (device14, 2026-11-28)

Tim hat die HMI mit dem TFT-Stand `device14` im Nextion-Simulator laufen lassen, als EU (480 × 320) und als
US-Hochformat (320 × 480), und je Icon-Anzahl eine Aufnahme gemacht (Quelle
`/mnt/projekte/nextion-vm/screenshots/device14-eu-robbi-icons-NN.png`, `device14-eu-id3-icons-N.png`,
`device14-us-p-robbi-icons-NN.png`, `device14-us-p-id3-icons-N.png`, hierher kopiert und umbenannt; die Übersichten
`device14-*-uebersicht-*.png` dort zeigen alle Bilder einer Reihe nebeneinander). Sie ersetzen die EU-Aufnahmen von
`device13` (Quelle damals `hmi-robbi-icons-NN.png`, `hmi-id3-icons-N.png`): geändert haben sich nur
`cardDevice1-icons-02.png` … `-10.png` (Satz B/C 6 px weiter rechts); `cardDevice1-icons-00.png`, `-12.png` … `-16.png`
und alle `cardDevice3-icons-*.png` sind byte-gleich mit den `device13`-Aufnahmen. Die us-p-Bilder sind neu. Belegung wie die Referenz: Grundbelegung aus
`src-web/scripts/examples/ref-cardDevice1-stage0.txt` (**R1p**) bzw. `ref-cardDevice3-stage0.txt` (**R3**), die
Status-Icons in der Reihenfolge der stage3- bzw. stage2-Referenz (siehe [Belegung je Stufe](#stufen-der-status-icons-2026-11-28)),
spaltenweise im Raster. Wo die Referenz weniger Icons hat, beginnt die Liste von vorn bzw. geht weiter:
cardDevice1 mit 16 Icons zeigt auf den Plätzen 15/16 noch einmal `wifi` (cyan) und `trash-can` (grau),
cardDevice3 mit 8 Icons auf Platz 8 `wifi` (cyan).

| Dateiname | Seite | Icons | Stufe | Was zu sehen ist | Verwendet in | erledigt |
|---|---|---|---|---|---|---|
| `hmi/cardDevice1-icons-00.png` | cardDevice1 | 0 | keine | Satz A: Info-Zeilen mit Icon, Name und Wert in voller Breite | Doku §5 „Die Stufe“; README | ☑ |
| `hmi/cardDevice1-icons-02.png`, `-04.png`, `-06.png` | cardDevice1 | 2 / 4 / 6 | 1–3 Spalten | 1 / 2 / 3 Spalten; Satz B: Icon, Name an der Feldgrenze abgeschnitten („Batte“, „Fläch“), Wert | Doku §5 „Die Stufe“; README | ☑ |
| `hmi/cardDevice1-icons-08.png`, `-10.png` | cardDevice1 | 8 / 10 | 4–5 Spalten | 4 / 5 Spalten; Satz C: nur Icon und Wert | Doku §5 „Die Stufe“; README | ☑ |
| `hmi/cardDevice1-icons-12.png`, `-14.png`, `-16.png` | cardDevice1 | 12 / 14 / 16 | 6–8 Spalten | 6 / 7 / 8 Spalten, keine Info-Zeilen | Doku §5 „Die Stufe“; README | ☑ |
| `hmi/cardDevice3-icons-0.png` | cardDevice3 | 0 | keine | sechs Info-Kacheln | Doku §5 „Die Stufe“; README | ☑ |
| `hmi/cardDevice3-icons-1.png` … `-4.png` | cardDevice3 | 1–4 | 1–4 | 1–4 Zellen an der Stelle von Kachel 1 (Batterie), Kachel 2 (Reichweite) bleibt | Doku §5 „Die Stufe“; README | ☑ |
| `hmi/cardDevice3-icons-5.png` … `-8.png` | cardDevice3 | 5–8 | 5–8 | 5–8 Zellen an der Stelle der Kacheln 1 und 2 | Doku §5 „Die Stufe“; README | ☑ |
| `hmi/us-p-cardDevice1-icons-00.png` | cardDevice1 us-p | 0 | keine | Satz A unter dem Haupt-Icon: Icon, Name und Wert in voller Breite | Doku §5 „Die Stufe“ (eingeklappt); README | ☑ |
| `hmi/us-p-cardDevice1-icons-02.png`, `-04.png`, `-06.png` | cardDevice1 us-p | 2 / 4 / 6 | 1–3 Spalten | Raster unter dem Haupt-Icon (1 / 2 / 3 Spalten); Info-Zeilen rechts neben dem Haupt-Icon nur mit Icon und Wert | Doku §5 „Die Stufe“ (eingeklappt); README | ☑ |
| `hmi/us-p-cardDevice1-icons-08.png`, `-10.png` | cardDevice1 us-p | 8 / 10 | 4–5 Spalten | 4 / 5 Spalten unter dem Haupt-Icon; Info-Zeilen wie bei 1–3 Spalten | Doku §5 „Die Stufe“ (eingeklappt); README | ☑ |
| `hmi/us-p-cardDevice1-icons-12.png`, `-14.png`, `-16.png` | cardDevice1 us-p | 12 / 14 / 16 | 6–8 Spalten | 6 / 7 / 8 Spalten über die volle Breite, keine Info-Zeilen | Doku §5 „Die Stufe“ (eingeklappt); README | ☑ |
| `hmi/us-p-cardDevice3-icons-0.png` | cardDevice3 us-p | 0 | keine | sechs Info-Kacheln in drei Reihen | Doku §5 „Die Stufe“ (eingeklappt); README | ☑ |
| `hmi/us-p-cardDevice3-icons-1.png` … `-4.png` | cardDevice3 us-p | 1–4 | 1–4 | 1–4 Zellen an der Stelle von Kachel 1 (Batterie), Kachel 2 (Reichweite) bleibt | Doku §5 „Die Stufe“ (eingeklappt); README | ☑ |
| `hmi/us-p-cardDevice3-icons-5.png` … `-8.png` | cardDevice3 us-p | 5–8 | 5–8 | 5–8 Zellen über die erste Kachelreihe (Kacheln 1 und 2) | Doku §5 „Die Stufe“ (eingeklappt); README | ☑ |

In jeder Aufnahme erscheinen nur die belegten Spalten bzw. Zellen, jede mit Rahmen, und die rechte Rahmenkante der
letzten Spalte ist geschlossen. Eine halb belegte letzte Spalte zeigen diese Aufnahmen nicht (cardDevice1 nur mit
gerader Anzahl, cardDevice3 hat eine Zeile).

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
| `admin-status-custom.png` | **vorhanden, bleibt:** Statuszeile „Benutzerdefinierter Datenpunkt“ mit ID-Feld | Doku §5 Statuszeile; README | ☑ |
| `admin-slot-custom.png` | **vorhanden, neu aufnehmen** (die Wahl heißt jetzt „Kanal“, dazu „Navigation“): Slots mit Benutzerdefiniert → Datenpunkt, → Kanal, → **Navigation** mit Zielseite und ein Datenpunkt mit „passt nicht zu diesem Slot“ | Doku §5 Benutzerdefiniert; README | ☑ |
| `admin-slot-dialog.png` | **vorhanden, neu aufnehmen** (zeigt noch den früheren kleinen Dialog): „…“ eines **Knopf**-Slots = Pageitem-Konfiguration ohne Kanalauswahl, Titel mit „4 Knopf“, Name, Icon `pause`/`play` und Farben für wahr/unwahr, Langer Druck | Doku §5 Einstellungen des Elements; README | ☑ |
| `admin-slot-dialog-status.png` | „…“ eines **Platzes der Status-Icons** (Titel „8 Status-Icon“): kleiner Dialog „Einstellungen des Elements“ mit Icon/Farbe, „Farbverlauf …“ und „Kurzer Tipp“ | Doku §5 Einstellungen des Elements; README | ☑ |
| `admin-web-extra.png` | Bereich der Geräteseite mit **gesetztem Häkchen** „Web-Panel-Elemente (web-l / web-p)“: darunter die zusätzlichen Slots (am besten Layout 2: 7 Info-Zeile, 8–9 Knopf) | Doku §5 Zusätzliche Elemente | ☑ |

Die Kommentare `<!-- BILD FOLGT … -->` / `<!-- BILD NEU AUFNEHMEN … -->` in der Doku sind entfernt.

## Hardware-Fotos (Tim)

**Keine.** Jedes Bild der Doku kommt aus dem Web-Panel, dem Admin oder – für die Übersicht je Icon-Anzahl – aus
Tims Aufnahmen der EU-HMI im Nextion-Simulator (`hmi/`):

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

`/mnt/projekte/nspanel emu/cardDevice3-neu.png` (Status-Icon-Spalte auf Layout 3) war ein Entwurf. Umgesetzt ist
auf Layout 3 eine Reihe mit bis zu 8 Status-Icons an der Stelle der Kacheln 1 und 2 (siehe
[Stufen der Status-Icons](#stufen-der-status-icons-2026-11-28)).

Der Abgleich oben stammt vom 2026-11-24 (TFT `device10`/`device12`, 2×2-Raster auf cardDevice1). Für
`device13`/`device14` (Raster bis 8×2, Stufen) folgt der Abgleich gegen die echte HMI im nächsten Abschnitt, für eu
und us-p; us-l hat noch keine Aufnahme der echten HMI.

### device14: Stufen gegen die echte HMI (2026-11-28)

Verglichen: die Web-Bilder je Stufe mit Tims Aufnahmen aus `hmi/` (eu 480 × 320, us-p 320 × 480, ohne Versatz).
Gemessen per Skript (Node, `pngjs`): Rechteck der hellen Pixel je Element (x links–rechts / y oben, Web / HMI),
Rahmenlinien als Spalten bzw. Zeilen mit grauen Pixeln, dazu je Paar ein Differenzbild der hellen Pixel
(nur angesehen, nicht im Repo).

Gleiche Icon-Anzahl gibt es für 0 und 14 Icons (cardDevice1), für 4 Icons (`eu-cardDevice1.png` gegen
`hmi/cardDevice1-icons-04.png`) und für alle Stufen von cardDevice3. Die Web-Bilder mit 5 und 9 Icons sind gegen die
HMI-Aufnahme mit derselben Spaltenzahl verglichen (6 bzw. 10 Icons): dort ist die letzte Zelle belegt (`water` bzw.
`map-marker`), im Web-Bild leer mit Rahmen. Für eu sind Satz B und C zusätzlich mit Web-Aufnahmen von genau 6 und 10
Icons gemessen (wie die Stufen-Eingaben, um das 6. bzw. 10. Icon der stage3-Reihenfolge ergänzt; nicht im Repo) – sie
ergeben in den Info-Zeilen dieselben Werte wie die Stufenbilder.

**eu** – die `device14`-Aufnahmen 00, 12–16 und alle von cardDevice3 sind byte-gleich mit denen von `device13`, die
Web-Bilder dazu (`eu-cardDevice1-stage0/3.png`, `eu-cardDevice3-stage*.png`) sind nicht neu aufgenommen (`device14`
ändert nur Satz B/C; die Gegenproben `eu-cardDevice1-stage0/3.png` und `eu-cardDevice3-stage1.png` sind pixelgleich);
das Ergebnis des `device13`-Abgleichs gilt für sie weiter. Neu gemessen sind die Paare mit Satz B und C:

| Web | HMI | Icons Web / HMI | Ergebnis |
|---|---|---|---|
| `eu-cardDevice1-stage0.png` | `hmi/cardDevice1-icons-00.png` | 0 / 0 | **deckt sich** (unverändert seit `device13`). Kein Raster, Satz A: Name ab x 165 / 166, Wert endet bei x 438 / 437. |
| `eu-cardDevice1.png` | `hmi/cardDevice1-icons-04.png` | 4 / 4 | **deckt sich.** Rahmen deckungsgleich: Linien x 124, 161, 198, y 71, 115, 159. Satz B: Icon Zeile 1 x 259–271 / 257–270, Zeile 2 („123“) 254–276 / 253–274; Name x 287–327 / 287–326 – beide an derselben Feldgrenze abgeschnitten („Batte“, „Fläch“); Wert endet 438 / 437 bzw. 438 / 438. |
| `eu-cardDevice1-stage1.png` | `hmi/cardDevice1-icons-06.png` | 5 / 6 | **deckt sich.** Rahmen deckungsgleich: Linien x 124, 161, 198, 235, y 71, 115, 159. Satz B wie bei 4 Icons (Icon 259–271 / 257–270, Name 287–327 / 287–326, Wert endet 438 / 437). |
| `eu-cardDevice1-stage2.png` | `hmi/cardDevice1-icons-10.png` | 9 / 10 | **deckt sich.** Rahmen deckungsgleich: Linien x 124 … 309 im Abstand 37, y 71, 115, 159. Satz C: Icon Zeile 1 x 333–345 / 331–344, Zeile 2 328–350 / 327–348; Wert endet 438 / 437 bzw. 438 / 438, kein Name. |
| `eu-cardDevice1-stage3.png` | `hmi/cardDevice1-icons-14.png` | 14 / 14 | **deckt sich** (unverändert seit `device13`). Sieben Spalten, Rahmen bis x 383 deckungsgleich, keine Info-Zeilen. |
| `eu-cardDevice3-stage0.png` … `-stage2.png` | `hmi/cardDevice3-icons-0.png`, `-4.png`, `-7.png` | 0 / 4 / 7 | **deckt sich** (unverändert seit `device13`). Rahmen deckungsgleich (Linien x 114, 151, 188, 225, 262 … 373, y 67, 118); Kachel 1 bzw. 1 und 2 fehlen in beiden. |

Gegenüber `device13` liegen Satz B und C in Web und HMI gleichermaßen 6 px weiter rechts (Icon B vorher
253–265 / 251–264, Icon C 327–339 / 325–338); der Name von Satz B beginnt jetzt bei x 287 (vorher 280 / 281) und
endet weiter an x 327, ist also schmaler – „Batte“ statt „Batter“, „Fläch“ statt „Fläche“. Zwischen Raster und
Info-Icon sind damit 22 px Abstand (3 Spalten: Linie x 235, Icon ab 257 HMI) statt vorher 16 px.

**us-p** (erstmals gegen die echte HMI):

| Web | HMI | Icons Web / HMI | Ergebnis |
|---|---|---|---|
| `us-p-cardDevice1-stage0.png` | `hmi/us-p-cardDevice1-icons-00.png` | 0 / 0 | **deckt sich.** Satz A unter dem Haupt-Icon: Icon x 22–34 / 20–33 bzw. 19–39 / 18–37, Name ab x 50 / 50, Wert endet 308 / 308. |
| `us-p-cardDevice1-stage1.png` | `hmi/us-p-cardDevice1-icons-06.png` | 5 / 6 | **deckt sich.** Rahmen deckungsgleich: Linien x 10, 47, 84, 121, y 188, 228, 268. Info-Zeilen rechts neben dem Haupt-Icon, nur Icon und Wert: Icon x 178–190 / 176–189 bzw. 173–195 / 172–193, Wert endet 308 / 307 bzw. 308 / 308. |
| `us-p-cardDevice1-stage2.png` | `hmi/us-p-cardDevice1-icons-10.png` | 9 / 10 | **deckt sich.** Rahmen deckungsgleich: Linien x 10 … 195 im Abstand 37, y 188, 228, 268; Info-Zeilen wie bei 1–3 Spalten (gleiche Messwerte). |
| `us-p-cardDevice1-stage3.png` | `hmi/us-p-cardDevice1-icons-14.png` | 14 / 14 | **deckt sich.** Sieben Spalten, Linien x 10 … 269, y 188, 228, 268 deckungsgleich, keine Info-Zeilen. |
| `us-p-cardDevice3-stage0.png` | `hmi/us-p-cardDevice3-icons-0.png` | 0 / 0 | **deckt sich.** Sechs Kacheln in drei Reihen; im Differenzbild nur Kanten von 1–2 px. |
| `us-p-cardDevice3-stage1.png` | `hmi/us-p-cardDevice3-icons-4.png` | 4 / 4 | **deckt sich.** Rahmen deckungsgleich: Linien x 10, 46, 82, 118, 154, y 182, 232; Kachel 1 fehlt in beiden, Kachel 2 („Reichweite“) steht. |
| `us-p-cardDevice3-stage2.png` | `hmi/us-p-cardDevice3-icons-7.png` | 7 / 7 | **deckt sich.** Rahmen deckungsgleich: Linien x 10 … 262 im Abstand 36, y 182, 232; Kacheln 1 und 2 fehlen in beiden. |

Auf us-p sind die Status-Icons im Raster, die Info-Icons und die Knopf-Icons im Web 1–2 px weiter rechts, die
Knopfbeschriftungen 1–2 px – wie auf eu.

**Abweichungen** (sichtbar, aber klein; gemessen auf eu beim `device13`-Abgleich; in den neu gemessenen eu- und
us-p-Paaren bestätigt: Icons 1–2 px weiter rechts, „34m²“ beginnt bei x 397 / 399 (us-p 267 / 269); i-Icon und Schalter
auf us-p nur im Differenzbild angesehen, nicht vermessen):

| Abweichung | Größe | Bemerkung |
|---|---|---|
| Icons im Raster, in den Info-Zeilen, in den Kacheln und die Knopf-Icons liegen im Web 1–2 px weiter rechts (z. B. `wifi` x 131–155 / 130–153, Knopf „Starten“ 44–80 / 43–78) | 1–2 px | wie im Abgleich vom 2026-11-24 (Icon-Schrift im Browser) |
| Wert „34m²“: im Web reicht die hochgestellte 2 höher (oben y 128 / 131), der Wert beginnt 2 px weiter links (397 / 399) | 2–3 px | Hochzahl in Noto Sans gegen die Nextion-Schrift |
| Werte „23456km“ und „312km“ (cardDevice3) beginnen im Web 2 px weiter links, enden gleich | 2 px | Schriftbreite |
| i-Icon im Web 1–2 px weiter rechts (x 411–433 / 409–432) | 1–2 px | – |
| Schalter „Klima“/„Laden“: Fläche und Farbe gleich (x 176–220 bzw. 392–436); im Knopf zeichnet das Web-Panel ein „I“ mit Serifen (Querstriche oben und unten, hellgrau 208), die HMI einen schlichten senkrechten Strich (grau 189) | Form | sichtbar beim genauen Hinsehen |
| Textfarbe: HMI (205, 255, 255), Web weiß | Farbe | bekannt, siehe oben |
| Texte im Web oft 1 px höher (Oberkante, z. B. Knopfbeschriftungen y 250 / 251) | 1 px | Kantenglättung |

Keine Abweichung: Rahmen des Rasters (Lage und Farbe (58, 61, 58) / (57, 60, 57), Rundung), Spaltenzahl je
Icon-Anzahl, welche Info-Sätze bzw. Kacheln erscheinen, Abschneiden des Namens in Satz B an x 327 (eu), Statuszeile in
beiden mittig (eu: cardDevice1 x 19–391 / 18–392, cardDevice3 x 45–365 / 45–365), Überschrift, Pfeil, Haupt-Icon und
Gerätename unter dem Haupt-Icon ±1.

## Bilder, die nur Entwickler-Dokumente verwenden

`hmi-cardDevice*.png`, `hmi-us-l-cardDevice*.png`, `hmi-us-p-cardDevice*.png` – Vorschauen des Werkzeugs
`HMI/tools/card_device.py` (`--preview doc/Pictures/device-page`) für `device12` (2×2-Raster), eingebunden in
`doc/ideas/device-details/device-page-hmi.md`. Die Nutzer-Doku verwendet sie nicht (ihre Beispieldaten zeigen
Einheiten mit Leerzeichen, der Adapter schreibt sie ohne).

`next/` – Vorschauen für `device14` (bis auf Satz B/C von cardDevice1 eu/us-l = `device13`; `--preview doc/Pictures/device-page/next`), je Modell eu (ohne Präfix), us-l und
us-p, beschrieben in [device-page-hmi.md, „device13“](../../ideas/device-details/device-page-hmi.md#device13-typzahl-status-raster-devicons):

| Modell | cardDevice1 | cardDevice2 | cardDevice3 |
|---|---|---|---|
| eu | `next/hmi-cardDevice1-stage0.png`, `-stage1.png`, `-stage2.png`, `-stage3.png` | `next/hmi-cardDevice2.png` | `next/hmi-cardDevice3-stage0.png`, `-stage1.png`, `-stage2.png` |
| us-l | `next/hmi-us-l-cardDevice1-stage0.png` … `-stage3.png` | `next/hmi-us-l-cardDevice2.png` | `next/hmi-us-l-cardDevice3-stage0.png` … `-stage2.png` |
| us-p | `next/hmi-us-p-cardDevice1-stage0.png` … `-stage3.png` | `next/hmi-us-p-cardDevice2.png` | `next/hmi-us-p-cardDevice3-stage0.png` … `-stage2.png` |
