# cardDevice1: Status-Raster bis 8×2 (16 Icons) – Analyse

Stand 2026-11-28. **Umgesetzt** in HMI (`device13`), Adapter, Admin und Web-Panel – siehe „Umsetzung“ direkt unten;
die Abschnitte 1–10 sind die Analyse davor und an den markierten Stellen überholt. Es baut auf zwei Dokumenten auf:
[../hmi-type-number.md](../hmi-type-number.md) (Typzahl 0–9, `entn` txt_maxl 7) und
[status-grid-4x2.md](status-grid-4x2.md) (Vorstufe 4×2).

**Grundlage:**

- Die Geometrie stammt aus `/home/tim/device-page-hmi/nspanel-*v6.2.0.device12.HMI`.
- Die RAM-Werte stammen aus `/mnt/projekte/{eu,us-l,us-p}.txt`.
- Die Textbreiten stammen aus `src/lib/const/font-widths.ts` (zi-Tabellen, Font 0, in EU/us-l/us-p gleich).

**Am Panel gemessen (ns_panel4, 2026-11-28):**

- `x`, `w` und `h` lassen sich zur Laufzeit nicht ändern. Zuweisungen liefern 0x1C bzw. 0x1A, Lesen per `get` geht.
  Jede Geometrie braucht daher eigene Objekte, umgeschaltet wird per `vis`.
- Ein Text wird exakt an der Feldkante abgeschnitten.
- `covx` liest die führenden Ziffern; leerer Text und Text ohne führende Ziffer ergeben 0.
- Die gemeinsame Rahmenkante zweier Zellen bleibt stehen, wenn die rechte Nachbarspalte per `vis 0` ausgeblendet wird
  (Abschnitt 5: die Annahme, dass sie verschwindet, ist widerlegt).
- RAM EU `device13` (Editor): cardDevice1 **3216** (368 frei), cardDevice2 **2492** (1092 frei), cardDevice3 **3328**
  (256 frei). us-l und us-p `device13` sind noch **nicht kompiliert und nicht getestet**.

**`device14` (2026-11-28):** Satz B und C von cardDevice1 (EU, us-l) 6 px weiter rechts – das Icon stand mit dem
Abstand der Raster-Icons hinter dem Raster und sah aus wie eine weitere Spalte. Name B 49 → **43 px**, Wert C 87 →
**81 px**, rechte Kante unverändert (Abschnitt „Info-Zeilen je Stufe“; [device-page-hmi.md, „device14“](device-page-hmi.md#device14-satz-bc-6-px-nach-rechts)).

## Umsetzung in der HMI: device13 (2026-11-28)

Umgesetzt mit `HMI/tools/card_device.py` in `/home/tim/device-page-hmi/nspanel-*v6.2.0.device13.HMI` (EU, us-l, us-p),
beschrieben in [device-page-hmi.md, „device13“](device-page-hmi.md#device13-typzahl-status-raster-devicons). Adapter,
Admin und Web-Panel (Abschnitte 7, 9 „Folgearbeiten“ und 10) sind ebenfalls umgesetzt (Commits `d8e972acd`,
`47e906c74`, `7ce3a53fb`): Konfiguration `statusStage` und `statusSlots` (eigene Liste, übersteht den Layoutwechsel),
Admin-Auswahl „Status-Icons“ und „Plätze der Status-Icons“ mit Vorschau je Stufe, Ausblenden statt Löschen im Admin
und im Config-Manager (`buildDevicePage`), `devIcons` und Typzahl im Adapter (`PageDevice` schickt `devIcons` nach
jedem `entityUpd`, bei reiner Status-Änderung nur `devIcons`) und im Web-Panel für alle fünf Modelle. Nutzer-Doku:
[doc/de/deviceDetails.md, „Status-Icons“](../../de/deviceDetails.md#status-icons).

**Umgesetzt:** ✅

- ✅ Typ als Zahl auf cardDevice1–3 (`covx`, ohne Namenskette), `vLPType` für tmLP (Abschnitt 6).
- ✅ `entn*` txt_maxl 7, `nent1/2` 11.
- ✅ Stufe in Feld 6 von info (Entscheidung 3), cardDevice1 Sätze A/B/C/keiner (Abschnitt 1), cardDevice3 Kachel 1/2
  aus (Abschnitt 9).
- ✅ `devIcons` mit 16 bzw. 8 Zellen, gemeinsamer Generator-Baustein (`icons_lines`, `columns_lines`, `cap_lines`).
- ✅ Tippen, Long-Press, Drück-Feedback, Blinken für alle Zellen und die Icons der Sätze B/C; vaLPCell-Nummern wie in
  Abschnitt 6 bzw. 9 (us-p cardDevice1: Satz C auf 24/25, es gibt keinen Satz B).
- ✅ us-p cardDevice1 Variante P2, us-p cardDevice3 Abstand 36.
- ✅ Geometrie in `device-page-geometry.json` (zuerst als `.next.json`), Vorschau je Stufe in `doc/Pictures/device-page/next/`.

**Abweichungen und Ergänzungen:**

1. **Leere Zellen (offene Frage, von Tim entschieden):** Es werden nur so viele Spalten gezeigt, wie belegt sind
   (höchster belegter Index, cardDevice1 ⌈i/2⌉, cardDevice3 i), höchstens die Spalten der Stufe. Die HMI rechnet
   die Spaltenzahl also doch (Abschnitt 4 „entfällt“ gilt nicht mehr): `sys2` = höchster belegter Index,
   `sys2=(sys2+1)/2`. Eine halb belegte letzte Spalte behält ihre leere Zelle mit Rahmen. Info-Zeilen und Kacheln
   folgen nur der Stufe.
2. **Feldpositionen:** `entityUpd` von cardDevice1 hat 6 Slots, info liegt bei 56–61, die Stufe in Feld 61
   (cardDevice3: info 68–73, Stufe 73). Größtfall 639 Byte, `strCommand` **703** wie in Abschnitt 3 (cardDevice3: 959
   statt 955, weil das Stufenfeld die 869 Byte + 10 % über 955 hebt).
3. **Spaltenwechsel:** Nur Spalten, die sich ändern, werden geschaltet (Zahlvariable `vCols`), damit kein `vis 0` auf
   eine schon ausgeblendete Spalte die Sätze B/C übermalt. Je Seite eine Zahlvariable mehr als in Abschnitt 3.
4. **Stufe auf cardDevice1** steht in der neuen Zahlvariable `vStage` (wie auf cardDevice3), `vStatus` ist entfallen.
5. **Keine Namenskette:** Der Typ wird nur per `covx` gelesen (Tim, 2026-11-28: die Geräteseite ist noch nicht
   veröffentlicht). Auch das info-Icon wird per `covx` geprüft und ist bei 0 ausgeblendet.
6. **us-p cardDevice1:** P2 hat in der Analyse keine Stufen. Umgesetzt „wie EU sinngemäß“: Stufe 0 die vollen Zeilen
   wie bisher (Satz A, an der Stelle des Rasters), Stufe 1 und 2 Satz C rechts vom Haupt-Icon (Icon 166, Wert 204
   w 106, y 76/120 bzw. 80/124), Stufe 3 keine Info-Zeilen. Raster 8 × 2 bei x 10 + 37·c, y 188/228, h 41.
7. **Popup-Überschrift aus Satz B/C:** der volle Name der Zeile (`tEntity1/2`), nicht der gekürzte.
8. **Wert in Stufe B:** `tValue1/2` leitet in Stufe 1 an das Icon von Satz B weiter (`if(vStage.val==1) click
   bEntityB1` …), sonst an `bEntity1/2` (Abschnitt 6 ließ das offen).
9. **RAM** (Schätzung des Werkzeugs, global 436): cardDevice1 EU/us-l 3045, us-p 2969, cardDevice3 3229,
   cardDevice2 2456. Abschnitt 3 rechnete für EU ≈ 324 frei, die Prognose aus der device10-Messung war ≈ 408.
   **Gemessen** (EU `device13`): cardDevice1 3216 (**368 frei**), cardDevice2 2492, cardDevice3 3328 (**256 frei**,
   Abschnitt 9 rechnete ≈ 212). us-l und us-p: offen (nicht kompiliert).
10. **Ignorierte Slots im Adapter, Layoutwechsel** (Abschnitt 10): umgesetzt wie beschrieben – übersprungene Slots
    werden Leer-Items an ihrer Stelle; die Status-Plätze sind eine eigene Liste `statusSlots` (höchstens 16) neben
    `slots` und überstehen jeden Layoutwechsel. Die gespeicherte Stufe bleibt beim Layoutwechsel; ein Layout, das sie
    nicht hat, nimmt seine größte (`devicePageStageOf`: 6–8 Spalten auf Layout 3 = 5–8).

## Entscheidungen Tim 2026-11-28

Diese Entscheidungen gehen den Abschnitten unten vor. Diese sind daran angepasst. Was dort noch von Laufzeit-Stufen
spricht, ist durch die feste Stufe ersetzt.

1. **Stufen auf cardDevice1:** A = 0 Spalten, B = 1–3, C = 4–5, D = 6–8. In Stufe D gibt es keine Info-Zeilen. Die
   Info-Zeilen verschwinden also schon ab 6 Spalten, damit der Wert in C breiter bleibt (C neu: Wert **87 px**, seit
   `device14` 81 px, Abschnitt 1).
2. **Die Stufe ist eine Admin-Einstellung, kein Laufzeitwert.**

   | Seite | Auswahl im Admin |
   |---|---|
   | cardDevice1 | keine Status-Icons, 1–3, 4–5, 6–8 Spalten (= 6, 10, 16 Status-Plätze) |
   | cardDevice3 | keine Status-Icons, 1–4 (ersetzt Kachel 1), 5–8 (ersetzt Kachel 1 und 2) |

   Folgen:
   - Die Admin-Vorschau zeigt das Layout der gewählten Stufe. Es gibt nur so viele Status-Plätze, wie die Stufe höchstens
     fasst.
   - Was die Stufe überdeckt, gibt es in dieser Stufe **statisch** nicht:
     - cardDevice1 Stufe D: die info-Slots 1 und 2
     - cardDevice1 Stufen B/C: die Info-Zeilen nur in der schmalen Form (B mit kurzem Namen, C ohne Namen)
     - cardDevice3: Kachel 1 bzw. die Kacheln 1 und 2

     Das ist Variante W, aber zur Konfigurationszeit: Zur Laufzeit taucht nichts auf und verschwindet nichts.
     **Variante N (Nachrücken) entfällt.**
   - Sind weniger Icons belegt, als die Stufe fasst (z. B. 1 Icon in Stufe 6–8), richtet sich das Layout trotzdem nach
     der Stufe. Die Info-Zeilen bleiben weg, das Raster behält seine Spalten.
   - ~~**Offene Frage an Tim:** Bleiben leere Zellen der Stufe mit Rahmen stehen, oder werden sie ausgeblendet?~~
     Entschieden: nur belegte Spalten, siehe „Umsetzung“ Punkt 1.
3. **Wie die HMI die Stufe erfährt:** über **Feld 6 (optionalValue) des Info-Elements in `entityUpd`**, als Zahl 0–3
   (cardDevice1: 0 = keine/A, 1 = B, 2 = C, 3 = D) bzw. 0–2 (cardDevice3). Begründung:
   - **Das Feld ist frei.** Die HMI liest vom Info-Element heute nur Typ, ID, Icon und Farbe (cardDevice1 Felder 80–83,
     cardDevice3 68–71). Feld 6 wird nie gelesen. Es braucht also kein neues Feld, und die Feldpositionen bleiben gleich.
   - **Bei den Web-Modellen gibt es keine Kollision.** Dort folgen die Extra-Slots hinter Info. Ein neues Feld am Ende von
     `entityUpd` würde mit ihnen zusammenstoßen.
   - **Die Reihenfolge der Nachrichten spielt keine Rolle.** `entityUpd` zeichnet die Info-Zeilen bzw. Kacheln und kennt
     die Stufe genau in diesem Moment. Beim Öffnen kommt `entityUpd` zuerst, `devIcons` füllt danach nur die Zellen. Es
     gibt kein kurzes Aufblitzen der Stufe A.
   - **Leer:** Ein leeres Feld ergibt per `covx` 0, das ist Stufe A bzw. keine Icons.
   - **Kosten:** 1 Byte je `entityUpd`, kein zusätzliches RAM. Die Stufe steht in `vStatus` (cardDevice1, gibt es schon)
     bzw. in der einen neuen Zahlvariable von cardDevice3. *(Umsetzung: auf beiden Seiten in `vStage`, `vStatus`
     ist entfallen.)*
   - **Die HMI rät nicht.** Sie zählt keine belegten Zellen. Die Spaltenzahl folgt aus der Stufe (B → 3, C → 5, D → 8
     Spalten; cardDevice3 → 4 bzw. 8). *(Überholt: Die Info-Zeilen und Kacheln folgen nur der Stufe, die **gezeigten
     Spalten** aber der höchsten belegten Zelle, höchstens die der Stufe – „Umsetzung“ Punkt 1.)*
   - **Die Alternative wäre** ein erstes Feld in `devIcons`. Dann müsste `devIcons` vor `entityUpd` kommen, oder
     `entityUpd` würde zuerst mit der falschen Stufe zeichnen. Außerdem gäbe es ohne Icons (Stufe „keine“) gar kein
     `devIcons`.
4. **Ignorieren statt Löschen:** Status-Slots, die die gewählte Stufe nicht zeigt (auch alle bei „keine Status-Icons“),
   und info-Slots bzw. Kacheln, die die Stufe überdeckt, behandelt der Adapter wie leer. Das betrifft cardDevice1 die
   Info-Zeilen 1/2 in Stufe 6–8 sowie cardDevice3 Kachel 1 bzw. die Kacheln 1 und 2.
   - Die Belegung bleibt gespeichert, die HMI bekommt sie nicht.
   - Wird die Stufe wieder größer, sind die alten Belegungen wieder da.
   - Der Admin blendet solche Felder aus, er löscht sie nicht.
   - **Ort:** Der Config-Manager überspringt sie beim Bauen der Geräteseite (`buildDevicePage`, derselbe Weg wie
     `media-<id>` und `generatedPageIds`). Sie werden nicht ausgewertet: kein Page-Item, keine Abos, kein Payload. An
     ihrer Stelle steht ein Leer-Item, damit die Positionen fest bleiben.
   - Die Folgen sind in Abschnitt 10 beschrieben.

## Vorgaben (Tim)

- **Raster:** 16 feste Zellen, 0–8 Spalten in 1×2-Schritten, die Spalten werden per `vis` gezeigt.
  - Der Adapter füllt spaltenweise und lückenlos: oben, unten, dann die nächste Spalte.
  - Spaltenzahl = ⌈n/2⌉.
  - ~~Vorschlag, von Tim noch nicht bestätigt:~~ **Entschieden und umgesetzt:** Leere Spalten werden ausgeblendet. Eine
    leere Zelle in der letzten Spalte behält ihren Rahmen.
- **Info-Zeilen 1–2 in vier Stufen:**

  | Stufe | Spalten | Info-Zeilen |
  |---|---|---|
  | A | 0 | wie heute „breit“ |
  | B | 1–3 | Icon, Name schmal, Wert 110 |
  | C | ~~4–6~~ **4–5** (Entscheidung 1) | Icon und Wert, kein Name |
  | D | ~~7–8~~ **6–8** | ausgeblendet |

  Der heutige schmale Satz (`bEntityS*`, `tEntityS*`, `tValueS*`) entfällt.
- **Nachricht:** Die Status-Icons kommen per eigener Kurz-Nachricht `devIcons~…` mit 16 Elementen. `entityUpd` verliert
  die 4 Status-Slots.

## 1. Geometrie EU und us-l

### Raster

Das Raster hat Abstand 37 und w 38, Nachbarn überlappen 1 px. Rahmen: `style 1`, `borderw 1`, `borderc 14823`.
Die Zeilen liegen bei y 71 und y 115, jeweils h 45, wie heute.

| Spalte | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| EU x | 124 | 161 | 198 | 235 | 272 | 309 | 346 | 383 |
| EU rechte Kante (x+w) | 162 | 199 | 236 | 273 | 310 | 347 | 384 | **421** |
| us-l x (+15) | 139 | 176 | 213 | 250 | 287 | 324 | 361 | 398 |
| us-l rechte Kante | 177 | 214 | 251 | 288 | 325 | 362 | 399 | **436** |

Mit 8 Spalten endet das Raster bei 421 (EU) bzw. 436 (us-l). Das liegt innerhalb des Randes 440/455 und des
sichtbaren Bereichs (EU bis 449, us-l 15–464).

### Info-Zeilen je Stufe

Die Zeilen liegen bei y 80 und y 124, das Icon jeweils 4 px höher (y 76/120, h 34), die Texte haben h 26. Das Icon steht
seit `device14` **11 px** hinter der Rasterkante (in `device13` 5 px wie beim früheren schmalen Satz – Rasterende 199,
Icon 204, Name 242 –, das sah aus wie eine weitere Spalte), der Text 2 px hinter dem Icon.

| Stufe | Rasterende | Icon x (w 36) | Name x / w | Wert x / w | EU-Objekte |
|---|---|---|---|---|---|
| A | – | 126 | 164 / 164 | 330 / 110 | bEntity1/2, tEntity1/2, tValue1/2 (heute) |
| B | 236 (Spalte 3) | 247 | 285 / **43** | 330 / 110 | neu: Icon + Name; **Wert = tValue1/2** (deckungsgleich mit A) |
| C (neu, 4–5 Spalten) | 310 (Spalte 5) | 321 | – | 359 / **81** (bis 440) | neu: Icon + Wert |
| C′ (Variante, nicht umgesetzt) | 310 | 321 | – | 359 / **90** (bis 449, Rand des Sichtbaren) | wie C |
| D (6–8 Spalten) | 347 / 384 / 421 | – | – | – | alles aus |

Die frühere Stufe C mit 4–6 Spalten hatte Icon 352 und Wert 390/50 bzw. 387/53 und ist entfallen. Ein gemeinsames
Wertfeld mit A/B (tValue1/2 bei 330) geht in C nicht: Zwischen der Rasterkante 310 und x 330 sind nur 20 px frei, das Icon
braucht 36.

Für us-l sind alle x um +15 verschoben: A 141/179/345, B 262/300/345, C Icon 336 und Wert 374/81 (bis 455), C′ bis 464
(w 90). Die Breiten sind gleich.

### Was in die Felder passt

Breiten in Font 0 (EU = us-l):

| Text | px | Text | px |
|---|---|---|---|
| `80%` | 35 | `21,5°C` | **54** |
| `100%` | 45 | `21,5 °C` | 59 |
| `230V` | 41 | `-61dBm` | **65** |
| `1234W` | 56 | `-61 dBm` | 70 |
| `Ein` / `Aus` | 26 / 31 | `offen` | 46 |
| `Licht` / `Akku` / `Strom` | 41 / 42 / 51 | `Batterie` | 68 |

- **Name in B (43 px, `device13` 49 px):** etwa 4 Zeichen (a–z im Mittel 9,5 px, i 5, A 11, W 16). Es passen `Licht`
  (41) und `Akku` (42), seit `device14` nicht mehr `offen` (46); `Strom` (51) und `Batterie` passen nicht.
- **Wert in C (81 px, `device13` 87 px):** Es passen `80%` (35), `100%` (45), `21,5°C` (54), `21,5 °C` (59), `-61dBm` (65),
  `-61 dBm` (70), `1234 W` (61) und `12,3kWh` (72); `12,34 kWh` (87) passt seit `device14` nicht mehr. Das sind etwa
  8 Zeichen.
- **Frühere Stufe C mit 50/53 px (entfallen):** Dort passten `21,5°C` und `-61dBm` nicht.
- **Abschneiden:** Ein zu langer Wert wird an der Feldkante abgeschnitten (am Panel bestätigt). Bei rechtsbündigem Wert
  (`xcen 2`) ist noch zu prüfen, welche Seite fehlt (Prüfliste, offen).

## 2. us-p (Vorschlag – umgesetzt ist P2, siehe „Umsetzung“ Punkt 6)

Heute liegt das Raster rechts vom Haupt-Icon (bMain x 10–160, y 70–156):

- tStat 2×2 mit je 72×57, x 166 und 237, y 70 und 126.
- Die Info-Zeilen liegen darunter (y 190/230: Icon 10, Name 48 w 156, Wert 206 w 104).
- Darunter folgen die vier Knöpfe (y 272–438) und die Statuszeile (y 447).

Rechts vom Haupt-Icon sind 144 px Platz. Dort gibt es keine Stufen für die Info-Zeilen, weil sie den Platz nicht teilen.

- **P1: höchstens 4×2 (8 Icons) rechts vom Haupt-Icon.**
  - Geometrie: Zellen x = 166 + 36·c (c 0–3: 166, 202, 238, 274), w 37, rechte Kante 310. Die Zeilen bleiben bei y 70
    und 126, h 57.
  - Die Info-Zeilen bleiben wie heute ohne Stufen.
  - Der Adapter schickt dieselben 16 Elemente, die HMI zeigt nur 1–8. Alternativ schickt der Adapter je Modell nur 8.
- **P2: 8×2 in voller Breite an der Stelle der Info-Zeilen, Info-Zeilen rechts vom Haupt-Icon.**
  - Raster: x = 10 + 37·c (c 0–7: 10 … 269), w 38, rechte Kante 307. Zeilen bei y 188 und y 228, h 41. Das endet bei 269,
    vor den Knöpfen ab 272.
  - Info-Zeilen fest rechts vom Haupt-Icon: Icon x 166 w 36 (y 76/120), Wert x 204 w 106 (y 80/124). Es gibt keinen
    Namen und keine Stufen.
  - Nachteil: us-p zeigt keine Info-Namen mehr.

**Folgen der Entscheidungen für us-p:**

- Die neuen Stufen (C = 4–5, D = 6–8) ändern an P1 und P2 keine Geometrie, denn auf us-p teilen sich Raster und
  Info-Zeilen den Platz nicht.
- Bei **P2** fasst das Raster alle 16 Plätze. Die Stufe bestimmt nur die Zahl der Spalten.
- Bei **P1** fasst das Raster höchstens 8 Plätze (4 Spalten). Stufe C (10 Plätze) und D (16 Plätze) gehen dort nicht
  ganz auf: us-p würde nur die ersten 8 zeigen.

  Die Stufe ist eine Einstellung der Seite, nicht des Modells. Mit P1 müsste der Admin für us-p-Panels deshalb darauf
  hinweisen oder die Stufen begrenzen. Dieser Punkt spricht für P2.

## 3. RAM

*(Prognose; gemessen ist EU `device13` cardDevice1 3216, also 368 frei – siehe oben. us-l/us-p offen.)*

Rechenmodell:

| Element | Kosten |
|---|---|
| Icon-Knopf (txt_maxl 7) | 10 + 8 = 18 |
| Text mit txt_maxl 31 / 15 / 11 | 10 + 32 = 42 / 26 / 22 |
| Status-Zelle (Text txt_maxl 7 + Typzahl 8 + entn 7 = 16) | 42 |
| Zahlvariable | 8 |
| strCommand | ceil((txt_maxl + 1) / 4) · 4 |

Code kostet kein RAM.

**Puffergrößen, günstig gewählt:**

- **Name B mit txt_maxl 15:** 43 px fassen höchstens 8 Zeichen (`i` 5 px). 15 Byte reichen auch mit Umlauten
  (2 Byte je Umlaut).
- **Wert C (81 px, `device13` 87) mit txt_maxl 19:** 81 px fassen höchstens 16 schmale Zeichen (`i`, `,` je 5 px). `21,5°C` sind
  7 Byte (° hat 2 Byte). txt_maxl 15 (26 statt 30 Byte) reicht für alle realen Werte, schneidet aber eher als die Kante.
- **Kürzen:** Die Texte werden beim Kopieren aus tEntity1/tValue1 auf txt_maxl gekürzt. Das betrifft nur, was ohnehin
  hinter der Feldkante läge.

**strCommand:** `entityUpd` ohne die 4 Status-Slots (Haupt-Element, 6 Slots, Info, Typzahl, ID 7; berechnet mit
`card_device.message_len`):

- längste echte Nachricht 638 Byte, mit Stufenfeld 639 Byte, mit vollen Puffern 745 Byte
- nötig ist txt_maxl **703** (+10 %, 4k−1), heute 943, also **−240 Byte**
- soll auch der Fall mit vollen Puffern sicher passen: 747, also −196

`devIcons` braucht im Größtfall 392 Byte (Abschnitt 4) und passt damit in strCommand.

**Bilanz** (Ausgang: gemessen frei plus 324 aus Typzahl und `entn` 7 = EU 576, us-l 600, us-p 832):

| Posten | EU / us-l | us-p P1 | us-p P2 |
|---|---|---|---|
| S-Satz weg (2 × (18 + 42 + 42)) | +204 | – (hat keinen) | – |
| Zellen mehr | 12 × 42 = −504 | 4 × 42 = −168 | 12 × 42 = −504 |
| Satz B: 2 × (Icon 18 + Name 26) | −88 | – | – |
| Satz C (neu): 2 × (Icon 18 + Wert txt_maxl 19 = 30) | −96 | – | – |
| Zahlspeicher tmLP | −8 | −8 | −8 |
| Stufe (in `vStatus`, gibt es schon) | 0 | 0 | 0 |
| strCommand 943 → 703 | +240 | +240 | +240 |
| **Summe** | **−252** | **+64** | **−272** |
| **frei danach** | **EU ≈ 324, us-l ≈ 348** | **≈ 896** | **≈ 560** |

Weitere Rechenfälle:

- Die frühere Stufe C mit 50 px und Wert txt_maxl 11 kam auf EU ≈ 340 und us-l ≈ 364.
- **Wert C mit txt_maxl 15:** +8, also EU ≈ 332.
- **Name B und Wert C mit txt_maxl 31:** zusammen −48 mehr, also EU ≈ 276 und us-l ≈ 300.
- **strCommand bleibt bei 943:** EU ≈ 84 und us-l ≈ 108. Die Verkleinerung von strCommand trägt also wesentlich.
- **Genauigkeit:** etwa ±50 Byte, maßgeblich ist der Editor-Wert.

## 4. Format von `devIcons`

```
devIcons~<type1>~<id1>~<icon1>~<color1>~<type2>~<id2>~…~<type16>~<id16>~<icon16>~<color16>
```

**Aufbau:**

- Es gibt 4 Felder je Element, ohne Name und Wert, wie heute `devicePageStatusIconElement` die Felder 5 und 6 leert.
- Element i liegt in Feld 1 + 4·(i−1) bis 4·i.
- Die Reihenfolge ist spaltenweise: i = 2c−1 oben, i = 2c unten.
- Ein leeres Element ist `0~~~`, oder `~~~` (leerer Typ ergibt ebenfalls 0).

**Länge:**

- Größtfall: Typ 1 + ID 7 + Icon 7 (Glyph mit 4 Byte UTF-8 + `¬<font>` mit 3 Byte) + Farbe 5 + 3 `~` = 23 Byte je
  Element. Gesamt 9 + 16 · 23 + 15 = **392 Byte**.
- Mit Icon ohne Font-Suffix: 344 Byte.
- Beides liegt weit unter strCommand 703 und unter 1017.

**Parser in tmSerial**, Zweig `if(tInstruction.txt=="devIcons")`, je Element k = 1…16:

1. `spstr` Typ → `tTmp`, dann `covx tTmp.txt,typeK.val,0,0`.
2. `spstr` ID → `entnK`.
3. `typeK.val==0`: dann `tStatK.txt=""` (die Zelle behält ihren Rahmen). Sonst `spstr` Icon → `tStatK.txt`, dazu das
   `¬`-Font-Suffix wie heute (`icon_lines`), dann `spstr` Farbe → `tTmp`, `covx` → `tStatK.pco`.
4. ~~Werden leere Zellen ausgeblendet (offene Frage an Tim), schaltet jede Zelle per `vis` nach ihrem Typ.~~
   **Umgesetzt:** einzelne Zellen werden nicht ausgeblendet, sondern ganze Spalten (siehe unten).

Nach Entscheidung 3 kommt die Stufe nicht aus `devIcons`. ~~Es gibt deshalb weder einen höchsten belegten Index noch eine
Spaltenrechnung.~~ **Umgesetzt:** Weil nur belegte Spalten erscheinen, rechnet `devIcons` doch den höchsten belegten
Index (`sys2`, cardDevice1 `sys2=(sys2+1)/2`) und zeigt höchstens die Spalten der Stufe (`vCols`, nur Spalten, die sich
ändern). Der Adapter schickt die belegten Plätze lückenlos vorn, leere hinten.

**`entityUpd`:**

- Es liest die Stufe aus Feld 6 des Info-Elements (`spstr` → `tTmp`, `covx` → `vStatus`, *umgesetzt: `vStage`*). Leer
  ergibt 0.
- Daraus folgen die Spalten des Rasters. Für Spalte c gilt: `vis` 1, wenn c ≤ 3 / 5 / 8 in Stufe 1 / 2 / 3, sonst
  `vis` 0. Erst alle aus, dann alle an, siehe Abschnitt 5.
- Ebenso folgt daraus der Satz der Info-Zeilen: 0 → A, 1 → B, 2 → C, 3 → D (aus). Leere Info-Elemente (Typ 0) bleiben in
  jedem Satz aus.
- Es kopiert die Texte der Info-Zeilen 1–2 in den Satz der Stufe, wie heute `narrow_show`: Icon-Text, Font und pco nach
  bEntityB/C, der Name nach tEntityB, der Wert nach tValueC.
- Die Stufe ändert sich nur mit der Konfiguration. Beim Laden der Seite ist `vStatus` 0, mit dem ersten `entityUpd` steht
  sie fest.

**Wann der Adapter sendet:**

- Beim Öffnen und bei jedem vollständigen Update schickt er `entityUpd` und gleich danach `devIcons`. Es sind zwei
  Nachrichten, jede wird einzeln mit `event,ack,<crc>` quittiert.
- Ändert sich nur ein Status-State, reicht `devIcons` allein. Dafür müsste `PageDevice` die zuletzt gesendeten Texte
  beider Nachrichten vergleichen. Heute baut `update()` bei jedem Trigger alles neu, das ist eine Umsetzungsfrage.
  **Umgesetzt:** `PageDevice.update()` schickt `devIcons` nach jedem gesendeten `entityUpd`; ist das `entityUpd`
  unverändert, nur `devIcons`, und das nur, wenn es sich geändert hat.
- `devStatus` (Statuszeile) bleibt unverändert.

## 5. Rahmen beim Ausblenden

**Belegt im Repo** (indirekt):

- `screensaver5.py:315` und `screensaver5_usp.py:163` halten fest: Das Neuzeichnen eines Textobjekts löscht den Teil
  eines überlappenden Nachbarn.
- `card_device.py:74` (heutiges 2×2) lebt davon, dass die gemeinsame 1-px-Kante von beiden Zellen in derselben Farbe
  gezeichnet wird („no drawing, nothing to redraw“).

**Folgerung (Annahme, nicht gemessen):** `vis` 0 auf Spalte c+1 übermalt deren Rechteck mit dem Seitenhintergrund. Dazu
gehört die gemeinsame Kante bei x = 124 + 37·c. Der rechte Rahmen der letzten sichtbaren Spalte fehlt dann, bis diese
Zelle neu gezeichnet wird.

**Am Panel bestätigt (2026-11-28): Die Annahme trifft nicht zu** – die Rahmenkante bleibt nach `vis 0` der Nachbarspalte
stehen. Die Reihenfolge „erst ausblenden, dann einblenden“ und `vCols` (nur Spalten schalten, die sich ändern) sind
trotzdem umgesetzt, damit kein `vis 0` die Sätze B/C übermalt.

**Mögliche Abhilfe im Code:** Erst alle zu versteckenden Spalten `vis` 0 schalten, dann die sichtbaren `vis` 1. Ob
`vis` 1 auf ein schon sichtbares Objekt neu zeichnet, ist offen, sonst `ref tStatK` der letzten Spalte. Ob das nötig
ist, gehört auf die Prüfliste.

Mit der festen Stufe (Entscheidung 2) ändern sich die Spalten nur beim Laden der Seite. Das Risiko besteht nur noch
in zwei Fällen:

- beim ersten `entityUpd`,
- falls leere Zellen einzeln ausgeblendet werden (offene Frage). *(Entschieden: es werden ganze Spalten nach der
  Belegung ausgeblendet; die Spalten ändern sich also auch, wenn sich die Belegung ändert.)*

Das Icon von Satz C (x 321, `device13` 315) liegt hinter Spalte 5 (bis 310), Spalte 6 ab 309 ist in C immer aus. Trotzdem erst die
Spalten schalten, dann die Info-Sätze.

## 6. Tippen und Long-Press der 16 Zellen

Alles läuft wie heute bei tStat7–10, nur mit der Typzahl:

- **down:**
  - `if(typeK.val!=0)`: Drück-Feedback `tStatK.bco=14823`, `tmLP.en=1`, `vaLPCell` setzen.
  - Ist `typeK.val==1` und `entnK.txt==""`, wird `vaLPCell=0`. Laut hmi-type-number.md A schickt der Adapter das nie.
  - Den Typ in den tmLP-Zahlspeicher legen.
  - `pageIcons.tTmp1=""`, `tTmp2=entnK`, `tTmp3=tStatK.txt`, `tempIconColor=tStatK.pco`.
  - `if(typeK.val==2…5) page popupShutter/popupShutter2/popupInSel/popupTimer`
- **tmLP:** Werte 6–9 öffnen popupLight, popupLight2, popupFan bzw. popupSlider, dazu das Blinken der Zelle über
  `vaLPCell`.
- **up:** Blinken und Feedback zurücksetzen, dann bei `typeK.val!=0` `buttonPress2/3,<entnK>,button` senden.
- **tc0 up:** setzt bco aller Zellen und den `vaLPCell`-Zustand zurück, wie heute.

**vaLPCell-Nummern** (nur intern, Vorschlag – so umgesetzt, us-p: Satz C auf 24/25; Tabelle in device-page-hmi.md):

| Nummer | Objekt |
|---|---|
| 1 | Haupt-Element |
| 2–7 | bEntity1–6 |
| 8–23 | Zellen 1–16 (Zelle i = 7 + i, spaltenweise) |
| 24/25 | Icons Satz B |
| 26/27 | Icons Satz C |

Die heutigen Nummern 12/13 (S-Satz) entfallen.

**Zum Code:**

- Die Rücksetzkette `if(vaLPCell.val==N)` steht heute in jedem `up` und in `tc0` und wächst von 13 auf 27 Einträge.
  Das kostet kein RAM, macht aber das Kompilat größer (Prüfliste).
- Die Icons von B und C brauchen dieselbe Logik wie bEntity1/2: entweder eigene Code-Kopien wie heute der S-Satz oder
  `click bEntity1,1/0` auf das versteckte Objekt. Ob `click` auf ein `vis` 0-Objekt dessen Ereignis ausführt, ist zu
  prüfen.
- Der Wert-Text des Satzes C leitet wie heute tValue1 per `click` an sein Icon weiter.

## 7. Folgearbeiten (nur Liste) – umgesetzt

Alle Punkte sind umgesetzt (`HMI/Readme.md`: Abschnitt „cardDevice1, cardDevice2, cardDevice3“) bis auf die eigene
**Versionsgrenze** für `devIcons` und die Typzahl (entfällt, die Geräteseite ist unveröffentlicht;
`CARD_DEVICE_MIN_TFT` wird zum Release angehoben). Ob leere Plätze aufrücken, ist entschieden: ja, lückenlos.

- **Adapter**
  - `src/lib/types/deviceDetails.ts`:
    - `DEVICE_PAGE_LAYOUTS[1]` ohne die 4 `status`-Slots. Die 16 Status-Plätze werden ein eigener Teil der
      Konfiguration oder des Layouts.
    - `DEVICE_PAGE_EXTRA_SLOTS[1]`
    - `DEVICE_PAGE_RECEIVE_BYTES[1]` = 703
    - Feldbreiten je Stufe und Modell
  - `src/lib/pages/device-page.ts`:
    - `buildDevicePage`: Items für 16 Status-Plätze als fester Block, Nummerierung, Info und Status hinter den Slots.
      Slots außerhalb der Stufe in der Schleife (`device-page.ts:1201`) als `null` behandeln, das ergibt ein Leer-Item an
      ihrer Stelle (Abschnitt 10).
    - Stufe als Feld 6 des Info-Elements in `entityUpd`
    - `devicePageSlotItemIndex`, `devicePageOfModel`
    - neuer Baustein `devIcons` neben `devicePageStatusMessage`
    - Reihenfolge der Status-Plätze spaltenweise. Ob leere Plätze aufrücken, hängt an der offenen Frage zu leeren Zellen.
    - Versionsgrenze für `devIcons` und die Typzahl neben `CARD_DEVICE_MIN_TFT`
  - `src/lib/pages/pageDevice.ts`: `update()` schickt `entityUpd` und `devIcons`, bei reiner Status-Änderung nur
    `devIcons`. Long-Press und Tippen der neuen Element-Nummern.
  - Tests: `device-page*.test.ts`, `hmi-id-length.test.ts`.
- **Admin**
  - `src-admin/src/devicePageConfig.ts` (+ Test), `components/DevicePageSection.tsx`:
    - Stufen-Auswahl für cardDevice1 (keine / 1–3 / 4–5 / 6–8) und cardDevice3 (keine / 1–4 / 5–8)
    - Status-Plätze je Stufe (cardDevice1 6/10/16, cardDevice3 4/8)
    - Felder, die die Stufe nicht zeigt, ausblenden, nicht löschen. Das sind überzählige Status-Plätze, die info-Slots 1/2
      von cardDevice1 in Stufe 6–8 und die Kacheln 1 bzw. 1+2 von cardDevice3.
    - Vorschau je Stufe mit den Satz-Breiten aus Abschnitt 1
  - Übersetzungen (`admin/i18n/*/translations.json`) für die Stufen-Auswahl und die Hinweise
  - Übersetzungen der neuen Texte in `admin/i18n/*/translations.json`
- **Web-Panel**
  - `src-web/src/cards/cardDevice/`: `layout.ts` (Slotarten, Extras), `parse.ts` (`devIcons` wie `devStatus`, kürzeres
    `entityUpd`, `LEGACY_SLOTS_1`), `geometryHmi.ts` (Raster und Sätze A–D je Modell, us-p nach P1/P2), `geometryWeb.ts`,
    `CardDevice.tsx` (16 Zellen, Stufenwahl)
  - Tests in `cardDevice/*.test.ts`
- **HMI-Werkzeug**
  - `HMI/tools/card_device.py`: `LAYOUTS`/`LAYOUTS_PORTRAIT`, 16 Zellen, Sätze B/C, S-Satz weg, `devIcons`-Zweig,
    `vis`-Logik, vaLPCell, strCommand-Größe, RAM-Ausgabe
  - neues Skript oder Erweiterung je Modell
- **Geometrie-Datei:** `doc/ideas/device-details/device-page-geometry.json` (wird per `--geometry` geschrieben)
- **Doku**
  - `doc/ideas/device-details/device-page-hmi.md` (Felder, Art je Slot, Ereignisse)
  - `HMI/Readme.md` (neue Nachricht `devIcons`)
  - Changelog

## 8. Simulator-Prüfliste für Tim

Stand 2026-11-28: Punkte 1, 4 und 9 (EU) sind am Panel bestätigt, Punkt 5 entfällt; die übrigen sind offen. Für us-l
und us-p ist noch nichts kompiliert oder geprüft.

1. ✅ **Rahmen:** Spalte c+1 per `vis` 0 ausblenden. Bleibt die rechte 1-px-Kante der Spalte c stehen? **Ja, am Panel
   bestätigt.** (Wenn nicht: Hilft die Reihenfolge erst `vis` 0, dann `vis` 1, und zeichnet `vis` 1 auf ein schon
   sichtbares Objekt neu? Sonst `ref`.)
2. **Info-Satz C bei 7→6 Spalten:** Wird das Icon (x 352) angeschnitten, wenn Spalte 7 nach dem Satz C umgeschaltet wird?
3. **Breiten:** `21,5°C` in 50, 53 und 59 px. `80%`, `-61dBm` und `Strom` im Namensfeld B (49 px). Welche Seite fehlt
   bei rechtsbündigem Wert?
4. ✅ **`covx`:** `"0"`, `""` und `"1"` in die Zahlvariable `typeK` (siehe hmi-type-number.md E). **Am Panel gemessen:**
   führende Ziffern, ohne Ziffer bzw. leer → 0.
5. ~~**Spaltenzahl:** `sys0=k+1` und `sys0=sys0/2` ergeben die richtige Spaltenzahl (Ganzzahldivision) für k = 0, 1, 2,
   15, 16.~~ Entfällt in dieser Form; umgesetzt ist `sys2=(sys2+1)/2` aus dem höchsten belegten Index (Prüfpunkt 5 in
   device-page-hmi.md, „device13 im Editor und am Panel prüfen“).
6. **Stufen:** `vStage` (statt `vStatus`) bleibt zwischen `entityUpd` und `devIcons` erhalten. Ein `entityUpd` danach
   zeigt die richtige Stufe. Ohne `devIcons` bleibt das Raster leer.
7. **`click`:** Löst `click bEntity1,1` bei `vis` 0 den down-Code aus (für die Icons von B/C)?
8. **Tippen und Long-Press:** für alle 16 Zellen, mit Feedback, Blinken (vaLPCell 8–23), Popups der Typen 2–9 und
   Senden mit `entnK`.
9. **Kompilat:** RAM von cardDevice1 in EU, us-l und us-p gegen Abschnitt 3. Größe des Codes (Rücksetzketten mit 27
   Einträgen in jedem `up`). ✅ **EU kompiliert:** cardDevice1 3216 (368 frei). us-l und us-p offen.
10. **Zwei Nachrichten:** `entityUpd` und `devIcons` direkt nacheinander. Beide werden quittiert, kein Puffer läuft
    über, `devIcons` mit 392 Byte kommt ganz an.

## 9. cardDevice3 „Werte“: Status-Icons x×1 in der ersten Kachelreihe

**Umgesetzt** (`device13`, Adapter, Admin, Web-Panel). Die Abschnitte unten sind die Analyse davor; was dort als
offene Frage steht, ist entschieden (nur belegte Spalten, siehe „Umsetzung“ Punkt 1). Die Geometrie stammt aus den
device12-HMIs. cardDevice3 hat 6 info-Kacheln im Raster
2×3 und darunter die Schalter 7 und 8.

### Prüfung „nichts muss verschoben werden“

Die Aussage stimmt.

- **Platz:** In der ersten Kachelreihe liegt nichts außer den Kacheln 1 und 2.
  - Darüber enden Pfeile, `mSpecial` und Überschrift bei y 66.
  - Links endet bMain (EU x 10–109) vor x 114.
  - Darunter beginnt Kachel 3 bei y 119.

  Die Zellen bekommen feste Lagen, die Kacheln 1 und 2 werden nur per `vis` aus- bzw. eingeschaltet. Einen weiteren
  Zeilensatz braucht es nicht.
- **Einschränkung:** Der `entityUpd`-Parser schaltet heute jede nicht leere Kachel mit `vis` 1 ein. Er darf eine Kachel,
  deren Fläche das Raster belegt, nicht wieder einblenden. Nach den Entscheidungen 2–4 ist das doppelt abgesichert:
  - Der Adapter schickt für die überdeckten Kacheln das leere Element (Entscheidung 4). Der heutige Parser blendet sie dann
    selbst aus.
  - `entityUpd` bringt die Stufe in Feld 6 des Info-Elements mit (Entscheidung 3). Der Parser kann das `vis` 1 der
    Kacheln 1/2 daran knüpfen, auch gegen einen Adapter, der die Kachel doch füllt.

  Beides steht in derselben Nachricht, `entityUpd` und `devIcons` können also nicht auseinanderlaufen.

### Geometrie

Die Zellen sind wie auf cardDevice1 Textobjekte mit 1-px-Rahmen (`style 1`, `borderw 1`, `borderc 14823`) und Font 1
(Glyph 32 px). Nachbarn überlappen 1 px. Das Icon ist zentriert (`xcen 1`, `ycen 1`). Die Zellenhöhe entspricht der
Kachelreihe, damit oben und unten bündig mit den Kacheln abgeschlossen wird.

| Modell | Kachel 1 | Kachel 2 | Zellen-Zeile | Abstand / w | Zellen je Fläche | Raster mit 4 / 8 Zellen |
|---|---|---|---|---|---|---|
| EU | x 114–275 (162 px) | x 277–438 | y 67, h 52 (bis 118) | 37 / 38 | **4** (5 bräuchten 186 px) | x 114–262 / 114–411 |
| us-l | x 129–290 | x 292–453 | y 67, h 52 | 37 / 38 | 4 | x 129–277 / 129–426 |
| us-p | x 10–157 (148 px) | x 162–309 | y 182, h 51 (bis 232) | **36 / 37** | 4 | x 10–154 / 10–298 |

Erläuterungen:

- **us-p:** Mit Abstand 37 wäre 4 × 37 + 1 = 149 px nötig, die Kachel ist aber nur 148 px breit, also 1 px zu wenig.
  Mit Abstand 36 und w 37 (Zelle ≥ 32 px) passen 4 je Fläche. Für 8 über beide Flächen ginge auch Abstand 37 (10–306).
  Einheitlich mit 36 ist einfacher. Ein weiterer Vorschlag ist nicht nötig.
- **Spalten 5–8:** Das Raster läuft ohne Lücke hinter Spalte 4 weiter (EU 262 → 411). Rechts bleiben in der zweiten
  Fläche etwa 27 px (EU) frei. Es richtet sich also nicht nach dem Anfang von Kachel 2 (277), denn sonst entstünden zwei
  getrennte Rahmen mit 15 px Lücke. Will man die Reihe ganz füllen, gibt es eine Variante:
  - EU/us-l mit Abstand 40 und w 41 über 114–435 bzw. 129–450.
  - Dann passen in Kachel 1 aber nur 4 × 40 + 1 = 161 px statt 162. Das geht noch, die Zellen 1–4 hätten dann eine
    andere Breite als bei 1–4 Icons, man bräuchte also zwei Zellsätze.

  Ein durchgehendes Raster mit Abstand 37 bzw. 36 braucht nur **einen** Satz mit 8 Zellen.
- **Wachstum (entschieden):** Die Flächenwahl ist die Admin-Stufe (Entscheidung 2), nicht die Zahl der Icons. Die Stufe
  „1–4“ zeigt höchstens die Spalten 1–4, „5–8“ höchstens die Spalten 1–8. ~~Ob leere Zellen darin mit Rahmen stehen
  bleiben oder ausgeblendet werden, ist die offene Frage an Tim.~~ Entschieden: es erscheinen nur die Spalten bis zur
  höchsten belegten Zelle. Der Rahmen-Prüfpunkt aus Abschnitt 5 ist am Panel bestätigt.
- **Flächenwahl:**

  | Stufe (Admin) | Kacheln aus | Raster |
  |---|---|---|
  | keine Status-Icons | keine | aus |
  | 1–4 | Kachel 1 | Spalten 1–4 |
  | 5–8 | Kachel 1 und 2 | Spalten 1–8 |

### Was mit den info-Slots 1 und 2 passiert (entschieden)

Es gilt Variante W zur Konfigurationszeit (Entscheidungen 2 und 4):

- In Stufe 1–4 gibt es Slot 1 nicht, in Stufe 5–8 die Slots 1 und 2 nicht. Das gilt statisch, es gibt kein Auftauchen
  oder Verschwinden zur Laufzeit.
- Die Belegung bleibt gespeichert. Der Adapter ignoriert sie (Abschnitt 10), der Admin blendet die Felder aus.
- Die übrigen Kacheln behalten ihre Slots.

Variante N (Nachrücken) entfällt.

### RAM (cardDevice3)

Ausgang ist der gemessene Stand plus 268 aus Typzahl und `entn` 7 (hmi-type-number.md C): **EU 500, us-l 524, us-p 524
frei**.

| Posten | EU | us-l | us-p |
|---|---|---|---|
| 8 Zellen × (Text txt_maxl 7 = 18 + Typzahl 8 + entn 7 = 16) | −336 | −336 | −336 |
| Zahlspeicher tmLP | −8 | −8 | −8 |
| Stufe (cardDevice3 hat kein `vStatus`) | −8 | −8 | −8 |
| strCommand 1019 → 955 (siehe unten) | +64 | +64 | +64 |
| **frei danach** | **≈ 212** | **≈ 236** | **≈ 236** |
| ohne Verkleinerung von strCommand | ≈ 148 | ≈ 172 | ≈ 172 |
| **gemessen** (`device13`, strCommand 959) | **3328, 256 frei** | offen | offen |

**strCommand:**

- Heute ist txt_maxl 1019. Die längste echte Nachricht war 994 Byte, mit Reserve lag sie über 1019 und wurde gekappt.
- Mit Typzahl und ID 7 wird die längste echte Nachricht 868 Byte lang, mit vollen Puffern 1005 (beides unter 1017).
  Nötig sind dann txt_maxl **955** (+10 %, 4k−1).
- `entityUpd` bleibt bei 8 Slots. Das Stufenfeld (Feld 6 von Info) kostet 1 Byte, an txt_maxl 955 ändert sich nichts.
- **devIcons** mit 8 Elementen: 9 + 8 · 23 + 7 = **200 Byte** im Größtfall.

### devIcons und gemeinsamer Parser-Code

Das Format ist dasselbe wie auf cardDevice1 (`devIcons~` + Elemente zu je `type~id~icon~color`). cardDevice3 liest nur
die Elemente 1–8. Der Adapter schickt für cardDevice3 8 Elemente, für cardDevice1 16.

**Gemeinsamer Generator-Baustein**, zum Beispiel eine Funktion in `card_device.py` mit den Parametern Seite, Anzahl der
Zellen N, Zeilen je Spalte R (cardDevice1 2, cardDevice3 1) und Zellnamen:

1. Je Element k = 1…N: `spstr` Typ → `tTmp`, `covx` → `typeK.val`, `spstr` ID → `entnK`. Bei Typ 0 wird
   `cellK.txt=""` gesetzt. Sonst folgen Icon mit `¬`-Font-Suffix (`icon_lines`) und die Farbe per `covx` → `cellK.pco`.
   ~~Werden leere Zellen ausgeblendet (offene Frage), folgt `vis` je Zelle nach dem Typ.~~ Umgesetzt: Spalten bis zur
   höchsten belegten Zelle (cardDevice3 eine Zelle je Spalte).

**Im `entityUpd`-Parser (gemeinsamer Baustein, Stufe aus Feld 6 von Info):**

1. Spalten der Stufe schalten: erst alle Spalten jenseits der Stufe `vis` 0, dann die der Stufe `vis` 1. Die
   Reihenfolge ist wegen der Rahmen so.
   - cardDevice1: Stufe 1/2/3 → 3/5/8 Spalten
   - cardDevice3: Stufe 1/2 → 4/8 Spalten
2. Danach seitenspezifisch:
   - cardDevice1 wählt den Info-Satz A–D.
   - cardDevice3 schaltet Kachel 1 bzw. die Kacheln 1 und 2 aus und blendet sie bei Stufe > 0 nicht wieder ein.

~~Einen höchsten belegten Index oder eine Spaltenrechnung gibt es nicht mehr.~~ Überholt: `devIcons` rechnet den höchsten
belegten Index (siehe Abschnitt 4).

**Tippen und Long-Press:** wie auf cardDevice1 (Abschnitt 6). Die vaLPCell-Nummern auf cardDevice3 sind heute 1–9, die
Zellen bekommen **10–17**.

### Prüfpunkte am Simulator (cardDevice3)

1. Zellen in EU und us-l mit Abstand 37 und in us-p mit Abstand 36: Rahmen, Kanten zu bMain (x 110/114) und zu Kachel 3
   (y 118/119). Ist das Icon in h 52 bzw. 51 vertikal mittig?
2. Stufen „keine“, 1–4 und 5–8 nacheinander (Konfigurationswechsel, Seite neu laden): Kachel 1 und 2 verschwinden und
   kommen zurück, ohne Reste. Ein `entityUpd` mit einer gefüllten Kachel 1 blendet sie bei Stufe > 0 nicht wieder ein.
3. ✅ Ausblenden der Nachbarzelle: bleibt der rechte Rahmen stehen (wie Abschnitt 5, Punkt 1)? **Ja, am Panel bestätigt.**
4. Tippen und Long-Press der Zellen 10–17 mit Feedback, Blinken und Popups. Unter einer ausgeblendeten Kachel löst nichts
   aus.
5. RAM von cardDevice3 in allen drei Modellen gegen die Tabelle oben. Kommt `strCommand` mit 955 bei der längsten
   Nachricht ganz an? (**EU gemessen:** 3328, 256 frei, `strCommand` umgesetzt mit 959; us-l/us-p offen.)

### Folgearbeiten (cardDevice3) – umgesetzt (ohne eigene Versionsgrenze)

- **Adapter**
  - `deviceDetails.ts` (Layout 3: 8 optionale Status-Plätze, `DEVICE_PAGE_RECEIVE_BYTES[3]` = 955)
  - `device-page.ts` (Items, `devIcons` mit 8 Elementen, Stufe in Feld 6 von Info, überdeckte Kacheln ignorieren,
    Versionsgrenze)
  - `pageDevice.ts` (Senden, Long-Press der neuen Element-Nummern)
  - Tests
- **Admin:** `devicePageConfig.ts`, `DevicePageSection.tsx`:
  - Stufen-Auswahl „keine / 1–4 / 5–8“
  - Status-Plätze je Stufe (4 bzw. 8)
  - Kachel 1 bzw. 1 und 2 ausblenden, nicht löschen
  - Vorschau je Stufe
  - Übersetzungen
- **Web-Panel:** `cardDevice/layout.ts`, `parse.ts` (`devIcons` auch für Layout 3), `geometryHmi.ts` (Zellen je Modell,
  Kachel 1/2 ausblenden), `CardDevice.tsx`, Tests.
- **HMI-Werkzeug:** `card_device.py` (gemeinsamer `devIcons`-Baustein, 8 Zellen auf cardDevice3, Kachel-Logik im Parser,
  vaLPCell 10–17, strCommand, RAM).
- **Geometrie-Datei und Doku:** `device-page-geometry.json`, `device-page-hmi.md`, `HMI/Readme.md`, Changelog.

## 10. Ignorierte Slots im Adapter (Entscheidung 4)

*Umgesetzt wie beschrieben (`buildDevicePage`, `devicePageSlotHiddenByStage`, Status-Plätze als eigene Liste
`statusSlots`). Zeilennummern Stand der Analyse.*

Tim legt fest: Nicht angezeigte Slots überspringt schon der Config-Manager beim Bauen der Geräteseite, auf demselben Weg,
auf dem die Media-Unterseiten `media-<id>` entstehen (`generatedPageIds`). Sie werden gar nicht erst ausgewertet: kein
Page-Item, keine Abos, kein Payload.

### Wo die Slot-Liste entsteht

1. **Aufruf:** `src/lib/configuration/admin.ts:365/467/722` → `convertAdminPageItemToPageItemConfig`
   (`src/main.ts:3843`).
2. **Normalisieren:** Für ein Geräte-Item liest `src/main.ts:3904` `deviceDetailsRuntimeOf(preItem.device)`
   (`src/lib/types/deviceDetails.ts:1733`). Das normalisiert die gespeicherte Seite mit `devicePageConfigOf`
   (`deviceDetails.ts:1201`): Slots in der Länge des Layouts, Extra-Slots nur wenn gespeichert.
3. **Bauen:** `src/main.ts:3911` ruft `buildDevicePage` (`src/lib/pages/device-page.ts:1169`) auf. Die Slot-Schleife
   steht in **`device-page.ts:1201`** (`for (let i = 0; i < kinds.length; i++)`, `const ref = page.slots[i] ?? null`).
   Dort entstehen:
   - Navigations-Slots (`devicePageNavigationSlotItem`)
   - Alias-Kanäle (`devicePageChannelSlot`, das Objekt wird gelesen, `channelSlots.push(i)`)
   - State-Slots (`readCommon` liest das Objekt, danach `devicePageSlotItem`)

   Info und Status werden danach angehängt (`device-page.ts:1256` ff.). Der Config-Manager (`manager.getPageItemConfig`)
   wird pro Slot über `pageItemOf` aufgerufen. Danach trägt der Admin die Seite als erzeugte Seite ein.
4. **Wo gefiltert wird:** in **`buildDevicePage`**. Am Anfang der Schleife wird `ref` für jeden Slot, den die Stufe nicht
   zeigt, als `null` behandelt. Info und Status werden ebenso behandelt. Gefiltert werden:
   - Status-Plätze über der Kapazität der Stufe (cardDevice1 6/10/16, cardDevice3 4/8, bei „keine“ alle)
   - die info-Slots 1/2 von cardDevice1 in Stufe 6–8
   - die Kacheln 1 bzw. 1+2 von cardDevice3

   **Nicht** in `devicePageConfigOf` filtern: Der Admin nutzt die Funktion auch beim Speichern
   (`src-admin/src/devicePageConfig.ts:104`, `ChannelConfigDialog.tsx:1699`). Dort würden die Belegungen gelöscht statt
   nur übergangen.

   Ein `null`-Slot wird zu `EMPTY_DEVICE_PAGE_ITEM` (`device-page.ts:1099`, `{ type: 'empty', data: undefined }`). Das
   ist ein PageItem ohne Daten, also ohne States, ohne Abos und ohne Objekt-Lesen. `PageDevice.itemAt` gibt dafür
   `undefined` zurück, der Payload bekommt `~~~~~`.

### Was an festen Indizes hängt und wie die Positionen fest bleiben

| Was | hängt an | bei fehlendem Slot |
|---|---|---|
| ID `<Seite>?<n>` | Position im Array `pageItems` (`Page.createPageItems`, `Page.ts:411`) | würde verrutschen, deshalb **Leer-Item an der Stelle** statt Weglassen |
| Payload-Reihenfolge | `PageDevice.update()` geht über die Slot-Indizes (`devicePageSlotItemIndex`) | Leer-Item ergibt `~~~~~` an derselben Stelle |
| `channelSlots` | Slot-Index, nur gefüllte Kanal-Slots werden eingetragen | ein ignorierter Kanal-Slot wird nicht eingetragen, die Indizes der übrigen bleiben |
| Extra-Slots (webExtras) | `devicePageSlotItemIndex`: Extras ab N + 3, mit N = `DEVICE_PAGE_LAYOUTS[layout].length` | N muss pro Layout **fest** sein |
| Long-Press `onButtonPress3` | Bereiche `1…slotCount` und `firstExtra…` | ein Leer-Item hat keine Aktion |

Zu den Extra-Slots: N darf nicht von der Stufe abhängen. Sonst verschieben sich Info, Status und die Extras zwischen den
Stufen. Für die Status-Plätze heißt das: Ein **fester Block in der Größe der höchsten Stufe** (cardDevice1 16,
cardDevice3 8) an fester Stelle, zum Beispiel hinter den Extras. Plätze über der Stufe sind Leer-Items, `devIcons`
schickt für sie `0~~~` oder lässt sie weg (Länge 6/10/16 bzw. 4/8).

Fazit: Positionen bleiben fest, wenn der Config-Manager **übersprungene Slots durch Leer-Items an ihrer Stelle ersetzt**,
statt sie wegzulassen. Das ist schon das heutige Muster für leere Slots. Die IDs der sichtbaren Elemente ändern sich
mit der Stufe dann nicht.

### Long-Press-, Navigations- und Alias-Kanal-Slots, die ignoriert werden

- **Long-Press:** Es gibt kein Page-Item, also keine Aktion. Die HMI bekommt das Element nicht und kann nichts senden.
- **Navigation:**
  - Es gibt kein Item mit `setNavi`, also keine Navigation.
  - Ob der Admin in der Navigationsansicht Kanten aus Navigations-Slots der Geräteseite zeichnet, habe ich nicht im
    Detail geprüft. Wenn ja, müsste er ausgeblendete Slots ebenso übergehen.
  - Die Zielseite bleibt bestehen, sie wird nur von hier aus nicht erreicht.
- **Alias-Kanal:**
  - `devicePageChannelSlot` liest das Kanalobjekt nicht.
  - Ein Fehler wie „missing channel“ wird für einen ausgeblendeten Slot nicht gemeldet.
  - Der Slot steht nicht in `channelSlots`.

### Export der Panel-Konfiguration

Der Export (PR #848, `src/lib/types/panelConfigExport.ts`) schreibt die gespeicherte Admin-Konfiguration der Items. Die
ausgeblendeten Belegungen stehen also mit drin, denn sie sind gespeichert. Ein Import bringt sie wieder mit, und ein
späteres Vergrößern der Stufe zeigt sie wieder.

Ob der Export Geräteseiten vorher normalisiert, habe ich nicht im Detail geprüft. Auch eine Normalisierung mit
`devicePageConfigOf` würde nicht nach Stufe filtern, solange dort nicht gefiltert wird (siehe oben).

### Layoutwechsel

- **Heute:** `fitDevicePageSlots` (`deviceDetails.ts:949`) behält die Slots nach Position und kürzt auf das Ziel-Layout.
  Das ist der bekannte offene Punkt „Layoutwechsel verschiebt/verliert Zusatz-Slots“ (`doc/de/deviceDetails.md:282/451`):
  - Layout 1 → 2 → 1 verliert die Status-Icons 7–10.
  - Der Wechsel auf Layout 1 verliert den dritten Extra-Slot.
- **Mit Stufen:** Eine Stufe gehört zu cardDevice1 bzw. cardDevice3, Layout 2 hat keine. Liegen die Status-Plätze
  weiter in `slots[]`, verliert jeder Wechsel über Layout 2 sie ebenso.
- **Wenn die Status-Plätze getrennt gespeichert werden** (eigene Liste neben `slots`, mit fester Länge 16), überleben sie
  einen Layoutwechsel. Layout 3 zeigt dann die ersten 8, Layout 2 keine.
- Zwischen Layout 1 und 3 ist offen, ob die Stufe übernommen oder zurückgesetzt wird (1–3/4–5/6–8 gegenüber 1–4/5–8).
- Das ist nur beschrieben, nicht entschieden.

**Entschieden und umgesetzt:** Die Status-Plätze sind eine eigene Liste `statusSlots` (höchstens 16) und überleben jeden
Layoutwechsel; Layout 3 zeigt die ersten 8, Layout 2 keine. Die gespeicherte Stufe `statusStage` bleibt; ein Layout,
das sie nicht hat, nimmt seine größte (`devicePageStageOf`). Zurück auf Layout 1 gelten wieder Stufe und Plätze wie
gespeichert.
