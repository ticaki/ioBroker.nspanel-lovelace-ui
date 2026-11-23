# Geräteseite in der HMI: cardDevice1, cardDevice2, cardDevice3 (EU)

Drei neue Seiten für **ein** Gerät (Saugroboter, Waschmaschine, Pkw …): großes Geräte-Icon, feste Anzahl Slots mit
festen Elementarten, Statuszeile unten, info-Icon unten rechts. Gebaut mit `HMI/tools/card_device.py`, Vorschau unter
`doc/Pictures/device-page/hmi-cardDevice{1,2,3}.png`. Nur EU; us-l und us-p sind nicht angepasst.

## Bauen

```
PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/swipe_release_fix.py /mnt/projekte/nspanel-v6.2.0.entities5.HMI /tmp/swipe.HMI
PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/card_device.py /tmp/swipe.HMI nspanel-v6.2.0.device1.HMI --preview doc/Pictures/device-page
```

- Basis: `nspanel-v6.2.0.entities5.HMI` (= `HMI/nspanel-v6.2.0.HMI` + `entities2_five_rows.py`, geprüft: nur cardEntities,
  cardEntities2 und die pageType-Einträge unterscheiden sich). Dort fehlte `swipe_release_fix.py` (#934, keine HMI
  hatte ihn bisher). Er läuft deshalb vorher, die neuen Seiten erben ihn von cardGrid.
- Jede Seite ist eine frische Kopie von cardGrid: Kopfzeile, Pfeile samt Long-Press/Blinken, Swipe-Streifen,
  tmSerial (Empfang, Quittung/CRC, pageType-Umschalter), Sleep-Timer und renderCurrentPage bleiben unverändert.
  Entfernt sind die sechs Zellen (`bEntity1–6`, `tEntity1–6`) und `LPState`.
- Die Seiten werden **hinten** an die Seitenliste von main.HMI angehängt (Abschnitte 37/38/39.pa). Keine bestehende
  Seiten-ID verschiebt sich.
- Jede Seite mit tmSerial bekommt `if(tId.txt=="cardDevice<n>") page cardDevice<n>` hinter dem cardGrid3-Zweig
  (36 Seiten; pageTest hat keinen Umschalter, wie bisher).
- Idempotent: Läuft das Werkzeug auf seiner eigenen Ausgabe, baut es die drei Seiten in ihren Abschnitten neu und
  ändert sonst nichts (geprüft).

## Protokoll

```
pageType~cardDevice1          (bzw. cardDevice2 / cardDevice3)
entityUpd~<heading>~<prev: 6 Felder>~<next: 6 Felder>~<main>~<slot 1>~…~<slot N>~<info>
```

- Überschrift und Navigation (Felder 1–13) genau wie cardGrid.
- Jedes Element hat 6 Felder wie eine cardGrid-Zelle: `type~intName~icon~iconColor~displayName~optionalValue`.
- Element e (main = 0, Slot k = k, info = N+1) beginnt bei Feld **14 + 6·e**:

| Seite | N | main | Slots | info |
|---|---|---|---|---|
| cardDevice1 „Steuern“ | 6 | 14–19 | 20–55 | 56–61 |
| cardDevice2 „Fortschritt“ | 6 | 14–19 | 20–55 | 56–61 |
| cardDevice3 „Werte“ | 8 | 14–19 | 20–67 | 68–73 |

- Typ leer oder `delete` blendet ein Element komplett aus.
- Icons und Farben kommen nur vom Adapter. Ein Icon darf wie bei cardGrid auf `¬<Font-ID>` enden (setzt die Schrift).

### Art je Slot

| Seite | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 | Slot 6 | Slot 7 | Slot 8 |
|---|---|---|---|---|---|---|---|---|
| cardDevice1 | info | info | button | button | button | button | – | – |
| cardDevice2 | value | progress | info | info | info | button | – | – |
| cardDevice3 | info | info | info | info | info | info | switch | switch |

### Elementarten

| Art | Darstellung | Tipp |
|---|---|---|
| main | Icon Font 4 (Bold 80, Icon 66 px) in iconColor, Name (Feld 5) darunter. **Feld 6 → Statuszeile** | wie eine cardGrid-Zelle des Typs, bei `text` nichts |
| info | Icon Font 1 in iconColor, Name Font 0, Wert (Feld 6) Font 0 rechtsbündig | wie eine cardGrid-Zelle des Typs, bei `text` nichts |
| value | Feld 6 in Font 4, Name Font 0 darunter, kleines Icon Font 1 daneben (leeres Icon-Feld = kein Icon) | keiner |
| progress | Name Font 0 darüber, Balken über die volle Breite; Feld 6 = ganze Zahl 0–100 (wird begrenzt), Füllung in iconColor, Rahmen in der Textfarbe | keiner |
| button | Icon Font 3 in iconColor, Name Font 0 darunter | genau wie eine cardGrid-Zelle (auch `text` sendet) |
| switch | Icon Font 1, Name Font 0, Schalter `btOnOff` (Kopie von cardEntities, Bilder 1/2 bzw. 10/11 bei schwarzem Hintergrund); Zustand aus Feld 6 `0`/`1` | `event,buttonPress2,<intName>,OnOff,<0\|1>` wie cardEntities |
| info-Icon | Icon Font 1 in iconColor unten rechts; Name/Wert werden nicht genutzt | `event,buttonPress2,<intName>,button` |

- „Wie eine cardGrid-Zelle“: `shutter`, `shutter2`, `input_sel`, `timer` öffnen ihr Popup sofort beim Berühren,
  `light`, `light2`, `fan`, `number` nach 500 ms Halten (tmLP wie cardGrid); beim Loslassen kommt
  `event,buttonPress2,<intName>,button`. Es gibt **kein `buttonPress3`** auf diesen Seiten.
- Bei info, button und main leiten Name und Wert ihren Tipp an das Icon weiter (`click <Icon>,1/0`), die ganze
  Zeile/Kachel ist also bedienbar.
- **Statuszeile** `tStatus`: Feld 6 von main, immer (auch wenn main ausgeblendet ist), einzeilig, Font 0, normale
  Textfarbe. Leeres Feld = leere Zeile.
- **value-Schrift:** Font 4 (NotoSans Bold 80) enthält Ziffern, `:`, `%`, `°`, `,`, `.`, `-`, `/`, Leerzeichen,
  Buchstaben inkl. ä/ö/ü – aber **kein `€`**. Vorschub: Ziffer 33 px, `:` 17 px, `%` 53 px, `°` 25 px, Leerzeichen 15 px.

## Feldbreiten für den Adapter (Kürzen)

Font 0 ist 24 px hoch; die Breite eines Texts liefert `src/lib/const/text-width.ts` (Font 0).

| Seite | main-Name | Statuszeile | Slot-Name | Slot-Wert |
|---|---|---|---|---|
| cardDevice1 | 110 px | 390 px, 1 Zeile, links | info: 164 px; button: 104 px | info: 110 px (rechtsbündig) |
| cardDevice2 | 96 px | 390 px, 1 Zeile, mittig | value: 190 px; progress: 429 px; info: 104 px; button: 100 px | value: 190 px **Font 4**; info: 104 px |
| cardDevice3 | 100 px | 390 px, 1 Zeile, links | info: 125 px; switch: 125 px | info: 125 px |

Für zwei Statuszeilen (≥ 60 px Höhe) war in keinem Layout Platz: überall **eine** Zeile, 390 px.

## Geometrie

Kopfzeile wie cardGrid (`bPrev` 9/16 50×50, `tHeading` 65/26 320×30 Font 2, `bNext` 391/16 50×50). Inhalt
x 10–439 (die Swipe-Streifen liegen bei x < 9 und x ≥ 440), y 67–287; Statuszeile y 289–318, info-Icon
x 404–439 / y 288–319. Ausrichtung: links = xcen 0, mittig = 1, rechts = 2; alle Texte ycen 1, isbr 0.

### cardDevice1 „Steuern“ (Saugroboter, Rasenmäher)

![cardDevice1](../../Pictures/device-page/hmi-cardDevice1.png)

| Objekt | x | y | w | h | Font | Ausrichtung | txt_maxl |
|---|---|---|---|---|---|---|---|
| bMain | 10 | 68 | 110 | 86 | 4 | mittig | 10 |
| tMainName | 10 | 156 | 110 | 26 | 0 | mittig | 31 |
| bEntity1 (info) | 126 | 76 | 36 | 34 | 1 | mittig | 10 |
| tEntity1 | 164 | 80 | 164 | 26 | 0 | links | 31 |
| tValue1 | 330 | 80 | 110 | 26 | 0 | rechts | 31 |
| bEntity2 (info) | 126 | 120 | 36 | 34 | 1 | mittig | 10 |
| tEntity2 | 164 | 124 | 164 | 26 | 0 | links | 31 |
| tValue2 | 330 | 124 | 110 | 26 | 0 | rechts | 31 |
| bEntity3–6 (button) | 10 / 118 / 226 / 334 | 190 | 104 | 52 | 3 | mittig | 10 |
| tEntity3–6 | 10 / 118 / 226 / 334 | 244 | 104 | 26 | 0 | mittig | 31 |
| tStatus | 10 | 289 | 390 | 30 | 0 | links | 63 |
| bInfo | 404 | 288 | 36 | 32 | 1 | mittig | 10 |

### cardDevice2 „Fortschritt“ (Waschmaschine, Trockner, Geschirrspüler)

![cardDevice2](../../Pictures/device-page/hmi-cardDevice2.png)

| Objekt | x | y | w | h | Font | Ausrichtung | txt_maxl |
|---|---|---|---|---|---|---|---|
| bMain | 10 | 67 | 96 | 82 | 4 | mittig | 10 |
| tMainName | 10 | 151 | 96 | 26 | 0 | mittig | 31 |
| tIcon1 (value, Icon) | 110 | 90 | 34 | 36 | 1 | mittig | 10 |
| tValue1 (value) | 146 | 67 | 190 | 82 | 4 | links | 31 |
| tEntity1 | 146 | 151 | 190 | 26 | 0 | links | 31 |
| tEntity2 (progress, Name) | 10 | 179 | 429 | 26 | 0 | links | 31 |
| Balken slot 2 (gezeichnet) | 10 | 207 | 429 | 14 | – | Rahmen 1 px, Füllung innen 427 × 12 | – |
| bEntity3–5 (info) | 10 / 154 / 298 | 228 | 34 | 48 | 1 | mittig | 10 |
| tEntity3–5 | 46 / 190 / 334 | 226 | 104 | 25 | 0 | links | 31 |
| tValue3–5 | 46 / 190 / 334 | 252 | 104 | 25 | 0 | rechts | 31 |
| bEntity6 (button) | 340 | 67 | 100 | 50 | 3 | mittig | 10 |
| tEntity6 | 340 | 119 | 100 | 26 | 0 | mittig | 31 |
| tStatus | 10 | 289 | 390 | 30 | 0 | mittig | 63 |
| bInfo | 404 | 288 | 36 | 32 | 1 | mittig | 10 |

Die info-Slots 3–5 sind hier schmale Kacheln (Name oben, Wert rechtsbündig darunter): drei volle Zeilen à 32 px
passten unter Icon, Wert und Balken nicht mehr über die Statuszeile.

### cardDevice3 „Werte“ (Pkw, Sensorik)

![cardDevice3](../../Pictures/device-page/hmi-cardDevice3.png)

| Objekt | x | y | w | h | Font | Ausrichtung | txt_maxl |
|---|---|---|---|---|---|---|---|
| bMain | 10 | 67 | 100 | 82 | 4 | mittig | 10 |
| tMainName | 10 | 151 | 100 | 26 | 0 | mittig | 31 |
| bEntity1–6 (info) | 114 / 277 (Spalte) | 69 / 121 / 173 (Zeile) | 34 | 48 | 1 | mittig | 10 |
| tEntity1–6 | 150 / 313 | 67 / 119 / 171 | 125 | 25 | 0 | links | 31 |
| tValue1–6 | 150 / 313 | 93 / 145 / 197 | 125 | 25 | 0 | rechts | 31 |
| tIcon7 / tIcon8 (switch) | 10 / 226 | 236 | 34 | 34 | 1 | mittig | 10 |
| tEntity7 / tEntity8 | 46 / 262 | 240 | 125 | 26 | 0 | links | 31 |
| btOnOff7 / btOnOff8 | 173 / 389 | 228 | 50 | 50 | Bild 1/2 | – | 3 |
| tStatus | 10 | 289 | 390 | 30 | 0 | links | 63 |
| bInfo | 404 | 288 | 36 | 32 | 1 | mittig | 10 |

Slot-Reihenfolge der info-Kacheln: zeilenweise, Slot 1 links oben, Slot 2 rechts oben, Slot 3 links Mitte …

## Puffer und RAM

- IDs (`entn*`, `entnMain`, `entnInfo`) 23 wie cardEntities2 (Adapter-IDs `<Seitenindex>?<n>`), Namen 31, Werte 31,
  Status 63, Icons 10, Typen 10, `tSend` 63 (längstes Ereignis `event,buttonPress2,` + ID + `,OnOff,1` = 50),
  `strCommand` 1019 (= Empfangspuffer des Displays; ein längeres `entityUpd` kommt ohnehin nicht an, die Nutzlast
  bleibt ≤ 1017 Byte).
- Schätzung wie `entities2_five_rows.py`: 9 + 7 je Objekt + Σ ceil((txt_maxl+1)/4)·4, global 436:

| Seite | Objekte | Seite | mit global | Grenze 3584 |
|---|---|---|---|---|
| cardDevice1 | 56 | 2406 | 2842 | 742 frei |
| cardDevice2 | 57 | 2465 | 2901 | 683 frei |
| cardDevice3 | 70 | 2800 | 3236 | 348 frei |

## Im Nextion-Editor prüfen

1. `nspanel-v6.2.0.device1.HMI` öffnen – keine Meldung „resource file damaged“ (Prüfsummen sind per `Hmi.check()`
   geprüft).
2. Kompilieren: keine Fehler in den Seiten cardDevice1–3 (Code ist nur Klartext, nicht kompiliert getestet).
   Besonders: `fill`/`draw` mit `defaultBcoColor`/`defaultFontColor`/`sys2` im tmSerial von cardDevice2,
   `click`-Weiterleitung der Texte, `btOnOff7/8` auf cardDevice3.
3. RAM-Anzeige des Editors je Seite mit der Tabelle oben vergleichen.
4. Am Panel: `pageType~cardDevice1` und ein `entityUpd` mit allen Elementen; Tipp auf info/button/main/Schalter/info-Icon,
   Popups (input_sel sofort, light nach Halten), ausgeblendete Elemente (`delete`), Balken bei 0/50/100 und nach
   Rückkehr aus einem Popup (der Adapter schickt nach renderCurrentPage neu).

## Bekannte Unsicherheiten / Abweichungen

- **Kein Nextion-Progress-Bar-Objekt:** Keine HMI-Datei des Projekts (alle Versionen, EU/us-l/us-p) enthält eine
  Fortschrittsanzeige, die sich als Vorlage kopieren ließe; ein Objekt ohne Vorlage zu erfinden riskiert eine defekte
  Projektdatei. Der Balken wird deshalb mit `draw`/`fill` gezeichnet (wie die Diagramme auf cardPChart/cardLChart).
  Er verschwindet bei einem Neuzeichnen der Seite, bis das nächste `entityUpd` kommt (nach `renderCurrentPage` schickt
  der Adapter ohnehin neu). Soll es ein echtes Objekt sein: im Editor eine Progress Bar auf eine Seite legen, dann kann
  das Werkzeug sie als Vorlage nehmen.
- Langes Halten auf info/button/main: die Popups von light/light2/fan/number öffnen wie auf cardGrid nach 500 ms;
  ohne Popup sendet auch langes Halten nur `buttonPress2`.
- Die Statuszeile hat nur eine Zeile (für zwei war kein Platz).
- Kompilierung, RAM-Wert des Editors und Verhalten am Panel sind ungeprüft.
