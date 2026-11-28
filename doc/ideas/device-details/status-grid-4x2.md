# cardDevice1: Status-Raster 0×2 bis 4×2 – Rechnung

> **Überholt (2026-11-28).** Dieses Dokument ist die Vorstufe. Umgesetzt wurde stattdessen das Raster bis **8×2**
> (cardDevice1) bzw. **8×1** (cardDevice3) mit eigener Nachricht `devIcons`, siehe
> [status-grid-8x2.md](status-grid-8x2.md) und [device-page-hmi.md, „device13“](device-page-hmi.md#device13-typzahl-status-raster-devicons).
> Insbesondere gilt nicht mehr:
>
> - **Stufe aus der Belegung** (Spalten = ⌈belegt / 2⌉): Die Stufe ist eine Admin-Einstellung (keine / 1–3 / 4–5 / 6–8
>   Spalten), die HMI bekommt sie in Feld 6 des info-Elements. Nur die Zahl der **gezeigten** Spalten folgt der
>   Belegung (höchstens die der Stufe).
> - **Status-Slots 7–10 in `entityUpd`, 14 Slots:** `entityUpd` von cardDevice1 hat nur noch 6 Slots, die Status-Icons
>   kommen per `devIcons`.
> - **Sätze und Varianten V1–V4, Stufe 4 mit Name:** Umgesetzt sind die Sätze A (breit), B (1–3 Spalten, Name 49 px),
>   C (4–5 Spalten, nur Icon und Wert 87 px) und keine Info-Zeilen bei 6–8 Spalten; der schmale Satz `bEntityS/tEntityS/tValueS`
>   und `vStatus` sind entfallen.
> - **us-p rechts vom Haupt-Icon:** Umgesetzt ist Variante P2 (Raster 8×2 unter dem Haupt-Icon).
> - **RAM-Rechnung:** Gemessen (EU `device13`): cardDevice1 3216 (368 frei), cardDevice2 2492, cardDevice3 3328
>   (256 frei). us-l und us-p `device13` sind noch nicht kompiliert.
> - **`x`/`w`/`h` zur Laufzeit:** lassen sich nicht ändern (am Panel gemessen, 0x1C/0x1A); jede Geometrie braucht eigene
>   Objekte.
>
> Der Rest bleibt als Herleitung stehen.

Stand 2026-11-28. Das ist nur Rechnung und Beschreibung, es wurde nichts gebaut. Die RAM-Ausgangswerte und die
Einsparung durch Typ-Zahl und `entn` 7 stehen in [../hmi-type-number.md](../hmi-type-number.md) (Abschnitt C).

**Grundlage:**

- Die Geometrie stammt aus den HMIs `/home/tim/device-page-hmi/nspanel-*v6.2.0.device12.HMI`.
- Die Textbreiten stammen aus `src/lib/const/font-widths.ts` (erzeugt aus den zi-Tabellen, `textWidth`, Font 0).
- Font 0 ist in EU und us-l identisch: Ziffer 10 px, Kleinbuchstabe im Schnitt 9,6 px, Leerzeichen 5 px. Als Faustregel
  gilt **etwa 10 px je Zeichen**. Beispiele:

| Text | Breite |
|---|---|
| `Temperatur` | 99 px |
| `Batterie` | 68 px |
| `Leistung` | 73 px |
| `Ein` | 26 px |
| `21,5 °C` | 59 px |
| `100 %` | 50 px |
| `1234 W` | 61 px |
| `12,34 kWh` | 87 px |

## Stufen

*(Überholt: die Stufe ist eine Admin-Einstellung, siehe oben.)* Die Stufe ergibt sich aus den belegten Status-Slots:
Spalten = ⌈belegt / 2⌉.

| belegte Slots | Spalten |
|---|---|
| 0 | 0 |
| 1–2 | 1 |
| 3–4 | 2 |
| 5–6 | 3 |
| 7–8 | 4 |

Heute gibt es die Sätze „breit“ (0 Spalten) und „schmal“ (2 Spalten). Die HMI schaltet sie über `vStatus` per `vis` um.

## Geometrie

### EU

Die heutigen Werte des Rasters:

- tStat7 liegt bei x 124, tStat8 bei x 161, jeweils w 38.
- Die Zeilen liegen bei y 71 und y 115, h 45.

Spalte c (0–3) liegt bei x = 124 + 37·c, w 38. Damit enden die Spalten bei x 162, 199, 236 und 273.

Für die Info-Zeilen gilt heute:

- Icon-Knopf: w 36, x = Rasterende + 5. Stufe 2 ergibt 199 + 5 = 204, wie heute bEntityS1.
- Name: ab Icon + 38, rechtes Ende fest bei 328.
- Wert: ab x 330, w 110, bis x 440, rechtsbündig.

| Stufe | Raster bis | Icon x | Name x | Name w (Wert 110) | ≈ Zeichen Name |
|---|---|---|---|---|---|
| 0 (heute breit) | – | 126 | 164 | 164 | 16 |
| 1 | 162 | 167 | 205 | 123 | 12 |
| 2 (heute schmal) | 199 | 204 | 242 | 86 | 8 |
| 3 | 236 | 241 | 279 | 49 | 4–5 |
| 4 | 273 | 278 | 316 | **12** | 1 |

Bei 4 Spalten hat mit dem heutigen Wertfeld kein Name sinnvoll Platz. Für Name, 2 px Abstand und Wert bleiben
440 − 316 = **124 px**. Varianten für das Wertfeld der Stufe 4 (rechte Kante bleibt 440):

| Wert w (ab x) | Name w | ≈ Zeichen Wert | ≈ Zeichen Name | passt (Wert) | passt (Name) |
|---|---|---|---|---|---|
| 110 (330) | 12 | 11 | 1 | alles bis 31 Byte, abgeschnitten an der Kante | – |
| 80 (360) | 42 | 8 | 4 | `1234 W`, `21,5 °C`, nicht `12,34 kWh` | `Ein`, `Aus` |
| 70 (370) | 52 | 7 | 5 | `1234 W`, `21,5 °C` | `Licht` o. ä. |
| 60 (380) | 62 | 6 | 6 | `21,5 °C`, `100 %`, nicht `1234 W` | knapp unter `Batterie` (68) |
| 50 (390) | 72 | 5 | 7 | `100 %` | knapp unter `Leistung` (73) |

### us-l

us-l ist gegenüber EU um +15 px verschoben: das Raster beginnt bei x 139, der Wert bei 345 bis 455. Der sichtbare
Bereich reicht von x 15 bis 464. Alle Breiten und Zeichenzahlen sind wie bei EU.

### us-p

us-p ist anders gebaut:

- Das Raster liegt rechts vom Haupt-Icon (bMain x 10–160) bei x 166, heute mit 2 Spalten zu je 72 px
  (tStat7 166, tStat8 237).
- Die Zeilen liegen bei y 70 und y 126, h 57.
- Die Info-Zeilen liegen **unter** dem Haupt-Icon (y 190/230, Icon 10, Name 48 w 156, Wert 206 w 104).

Das Raster teilt sich den Platz deshalb nicht mit den Info-Zeilen. us-p braucht keine weiteren Info-Sätze und hat auch
heute keinen schmalen Satz.

Die EU-Teilung (Abstand 37, w 38) ergibt 166 + 3·37 + 38 = 315. Das geht über den Swipe-Streifen (ab x 311). Mit Abstand
36 und w 37 reicht das Raster von 166 bis 310 und passt genau. Die Zellen sind dann halb so breit wie heute (37 statt
72) bei gleicher Höhe. Das Icon in Font 1 (32 px) passt hinein.

## Gemeinsames Wertfeld

Heute gibt es tValue1/2 im breiten Satz und tValueS1/2 im schmalen Satz, beide bei x 330 w 110. tValueS liegt um 1 px
tiefer (y 81/125), wohl wegen der Editor-Warnung „Component overlap“ bei gleichen Rechtecken.

- **Stufen 0–3:** Das Wertfeld hat dieselbe Lage. Ein gemeinsames tValue1/2 für alle vier Stufen geht, tValueS1/2 würden
  dann wegfallen.
- **Stufe 4:** Mit einem schmaleren Wert geht das nur auf zwei Wegen:
  - Stufe 4 bekommt ein eigenes Wertpaar.
  - Alle Stufen nutzen das schmale Feld. Das kürzt den Wert auch dort, wo Platz wäre.
- **Prüfpunkt am Panel:** Wie schneidet die HMI einen rechtsbündigen Text ab, der zu breit ist (`xcen 2`, `isbr 0`)?
  Fällt der Anfang weg oder das Ende? (Am Panel bestätigt ist bisher nur, dass ein Text exakt an der Feldkante
  abgeschnitten wird; welche Seite bei rechtsbündigem Text fehlt, ist weiter offen.)

## RAM

Rechenmodell aus `HMI/tools/CLAUDE.md` und dem Auftrag:

| Element | Kosten |
|---|---|
| Icon-Knopf (txt_maxl 7) | 10 + 8 = 18 |
| Name oder Wert (txt_maxl 31) | 10 + 32 = 42 |
| Status-Zelle tStat (txt_maxl 7) | 18 |
| `type<k>` als Zahl | 8 |
| `entn` mit txt_maxl 7 | 8 + 8 = 16 |

Daraus folgt:

- **4 weitere Status-Slots** (Zelle, Typ, ID): 4 × (18 + 8 + 16) = **168**
- **Info-Satz (2 Zeilen):** mit eigenem Wert 2 × 102 = 204, ohne eigenen Wert 2 × 60 = 120
- **Gemeinsames Wertfeld:** tValueS1/2 entfallen, das sind −84.
- **Stufenvariable:** keine neue nötig. Die Spaltenzahl kann in `vStatus` stehen, das heute schon eine Zahlvariable ist.

Der Ausgangswert ist „frei nach Typ-Zahl + entn 7“: EU 576, us-l 600, us-p 832 (gemessen 252 / 276 / 508 plus 324).

| Variante | zusätzlich | EU frei | us-l frei |
|---|---|---|---|
| V1: eigener 1-Spalten-Satz, jeder Satz eigener Wert (wie heute) – neue Sätze 1, 3, 4 | 3 × 204 + 168 = 780 | **−204** (über dem Limit) | −180 |
| V2: ohne 1-Spalten-Satz (Stufe 1 nutzt den schmalen Satz), eigene Werte – neue Sätze 3, 4 | 2 × 204 + 168 = 576 | **0** (keine Reserve) | 24 |
| V3: eigener 1-Spalten-Satz, gemeinsamer Wert für 0–3, eigener Wert für 4 | −84 + 120 + 120 + 204 + 168 = 528 | **48** | 72 |
| V4: ohne 1-Spalten-Satz, gemeinsamer Wert für 0–3, eigener Wert für 4 | −84 + 120 + 204 + 168 = 408 | **168** | 192 |

Zur Einordnung:

- **us-p:** Dort entstehen keine Info-Sätze, nur die 4 Status-Slots (+168). Danach bleiben **664** frei.
- **Genauigkeit:** Die Schätzung liegt bei etwa ±50 Byte. Maßgeblich ist der Editor-Wert.
- **Was auf jede Zeile oben noch drauf- oder abgeht:**
  - Bei Stufe 0 ohne eigenen Satz (Stufe 1 = schmaler Satz) bleibt links neben dem Icon eine Lücke von 162 bis 204.
    Das ist eine optische Frage für den Test am Panel.
  - strCommand kann kleiner werden (siehe unten): 943 → 907, das bringt +36.
  - Ein Zahl-Träger für tmLP (siehe hmi-type-number.md, A) kostet −8.

## strCommand

Berechnet mit `card_device.message_len` (Adapterwerte, 10 % Reserve, 4k−1). Annahmen: Typzahl 1 Byte, ID 7 Byte,
Navigation weiter `button`/`bSubPrev` (6/8 Byte), Name und Wert je bis 31 Byte, ein Icon mit 4 Byte, Statusicons ohne
Name und Wert.

| Fall | längste echte Nachricht | alle Puffer voll | strCommand nötig |
|---|---|---|---|
| heute: 10 Slots, Text-Typen, ID 12 | 856 | 1152 | 943 (heute) |
| 14 Slots, Text-Typen, ID 12 | 980 | 1368 | 1019 |
| 10 Slots, Typzahl, ID 7 | 730 | 861 | 803 |
| **14 Slots, Typzahl, ID 7** | **822** | 977 | **907** |

Der neue Größtfall liegt mit 822 Byte unter 1017, auch mit voll gefüllten Puffern (977). Das heutige strCommand von 943
reicht. 907 würde ebenfalls reichen und 36 Byte sparen.

14 Slots mit Text-Typen kommen nicht vor: Die TFT, die 14 Slots hat, bekommt vom Adapter die Zahl.

## Was mitziehen müsste (nur Liste)

- **Adapter**
  - `src/lib/types/deviceDetails.ts`:
    - `DEVICE_PAGE_LAYOUTS[1]` bekommt 4 weitere `status`-Slots.
    - Die Layout-1-Einträge von `DEVICE_PAGE_EXTRA_SLOTS` müssen zur Reihenfolge passen, denn die Web-Extras stehen heute
      hinter Info.
    - `DEVICE_PAGE_RECEIVE_BYTES[1]`
    - die Feldbreiten je Modell (`DEVICE_PAGE_FIELDS_BY_MODEL` / `devicePageFields`), wenn die Namensbreite je Stufe
      gemessen oder angezeigt werden soll
  - `src/lib/pages/device-page.ts`:
    - `buildDevicePage`, `devicePageSlotItemIndex` und `devicePageOfModel`. Info und Status rücken auf n = N+1 und N+2,
      mit N = 14.
    - die neue TFT-Grenze neben `CARD_DEVICE_MIN_TFT`
  - `src/lib/pages/pageDevice.ts`: Die Slotzahl kommt aus `DEVICE_PAGE_LAYOUTS`, das Senden hängt nicht weiter dran.
  - **Kompatibilität:** Ein älterer Adapter schickt 10 Slots. Auf der neuen TFT läge Info dann an der Stelle von Slot 11
    (Feld 80 statt 104).
  - Tests: `device-page*.test.ts`, `hmi-id-length.test.ts`.
- **Admin**
  - `src-admin/src/devicePageConfig.ts` (+ Test): Slotliste von Layout 1
  - `src-admin/src/components/DevicePageSection.tsx`: Slots, Vorschau, Breiten
  - Übersetzungen für neue Slotnamen, falls nötig
- **Web-Panel**
  - `src-web/src/cards/cardDevice/layout.ts` (`DEVICE_SLOT_KINDS`, eigene Kopie von `deviceExtraKinds`)
  - `parse.ts` (`LEGACY_SLOTS_1`, Stelle von Info)
  - `geometryHmi.ts` (Tabellen je Modell, Raster und Info-Sätze je Stufe), `geometryWeb.ts`, `CardDevice.tsx`
    (Statuszellen, Stufenwahl)
  - Tests: `geometry.test.ts`, `parse.test.ts`, `CardDevice.test.ts`, `adapterTables.test.ts`
- **HMI-Werkzeug und Geometrie-Datei**
  - `HMI/tools/card_device.py` (`LAYOUTS`, `LAYOUTS_PORTRAIT`, Statuszellen, Info-Sätze, `vis`-Umschaltung, RAM-Ausgabe,
    strCommand-Größe)
  - `doc/ideas/device-details/device-page-geometry.json` (wird per `--geometry` geschrieben)
  - `doc/ideas/device-details/device-page-hmi.md` (Art je Slot, Felder)

## Weiterführung

Die Fortsetzung bis 8×2 (16 Icons, Nachricht `devIcons`, Info-Stufen A–D, us-p-Vorschläge) steht in
[status-grid-8x2.md](status-grid-8x2.md).
