# Elementtyp als Zahl statt Text (HMI-RAM) – Analyse

> **Umgesetzt (2026-11-28)** für die Geräteseiten cardDevice1–3: HMI `device13` (EU, us-l, us-p; gebaut mit
> `HMI/tools/card_device.py`, siehe [device-details/device-page-hmi.md, „device13“](device-details/device-page-hmi.md#device13-typzahl-status-raster-devicons)),
> Adapter (`devicePageTypeNumber` / `devicePageNumberedElement` in `src/lib/pages/device-page.ts`) und Web-Panel
> (`src-web/src/cards/cardDevice/parse.ts` führt die Zahl auf die Typnamen zurück). Typzahl 0–9 wie unten, `entn*`
> txt_maxl 7, `nent1/2` txt_maxl 11, tmLP liest den Typ aus der neuen Zahlvariable `vLPType`. Am Panel gemessen:
> `covx` liest die führenden Ziffern, leerer Text und Text ohne führende Ziffer ergeben 0. RAM gemessen (EU
> `device13`): cardDevice1 3216 (368 frei), cardDevice2 2492, cardDevice3 3328 (256 frei); us-l und us-p `device13`
> sind noch nicht kompiliert und nicht getestet. Abweichungen von der Analyse sind unten mit **Umsetzung:** markiert.
> Die anderen Seiten (Abschnitt D) sind nicht umgestellt.

Stand 2026-11-28, Branch `feat/device-page`. Das ist nur eine Analyse, es wurde kein Code und keine HMI geändert.
Grundlage sind die HMIs `/home/tim/device-page-hmi/nspanel-*v6.2.0.device12.HMI` (gelesen mit `HMI/tools/hmi.py` und
`pagefile.py`, nur die lebenden Sektionen) und die Editor-Ausgaben `/mnt/projekte/{eu,us-l,us-p}.txt`.

## Tims Entscheidungen (Vorgabe)

1. Der Typ wird als Zahl mit festen Werten 0–9 übertragen.
2. Der HMI-Eingang je Element ist `covx tTmp.txt,type<k>.val,0,0`. `type<k>` wird eine Zahlvariable. (Eine
   Vergleichskette für Typnamen war als Rückfall vorgesehen; sie entfällt, weil die Geräteseite noch nicht
   veröffentlicht ist und Text-Payloads nicht mehr vorkommen – Tim, 2026-11-28.)
3. Der Adapter baut die Zahl nur für cardDevice1–3 und erst ab der TFT-Version, die sie versteht. Die Versionsgrenze ist
   nötig, weil die Seite sonst nicht funktioniert.
   **Umsetzung:** Der Adapter schickt die Zahl auf cardDevice1–3 immer, an jedes Modell (auch web-l/web-p). Eine eigene
   Versionsgrenze gibt es nicht, weil die Geräteseite noch nicht veröffentlicht ist; Hardware-Panels bekommen die
   Geräteseite nur ab `CARD_DEVICE_MIN_TFT` (6.3.0).
4. `entn` der Geräteseiten bekommt txt_maxl 7 (Puffer 8). Laut Korrektur gilt die ID-Grenze `999?999`, also höchstens
   7 Zeichen.

### Vorgeschlagene Zuordnung (aus dem HMI-Code abgeleitet)

| Zahl | Typnamen | was die Geräteseite macht |
|---|---|---|
| 0 | `delete`, `""` | Element versteckt, Tippen tut nichts (Statusicons, mSlot) |
| 1 | `text`, `button`, `switch` und jeder andere Name | nur senden (`buttonPress2/3,<id>,button`) |
| 2 | `shutter` | Tippen → `popupShutter` |
| 3 | `shutter2` | Tippen → `popupShutter2` |
| 4 | `input_sel` | Tippen → `popupInSel` |
| 5 | `timer` | Tippen → `popupTimer` |
| 6 | `light` | Long-Press → `popupLight` |
| 7 | `light2` | Long-Press → `popupLight2` |
| 8 | `fan` | Long-Press → `popupFan` |
| 9 | `number` | Long-Press → `popupSlider` |

Die Reihenfolge innerhalb der Gruppen folgt der Reihenfolge der `if`-Blöcke im HMI-Code (down: shutter, shutter2,
input_sel, timer; tmLP: light, light2, fan, number).

## A. Geräteseiten cardDevice1–3

### Variablen je Seite

Die Zahlen gelten für EU, us-l und us-p gleich.

| Seite | `type<k>` (String, txt_maxl 10) | `entn*` (txt_maxl 23) | `nent1/2` (txt_maxl 23) |
|---|---|---|---|
| cardDevice1 | 11: typeMain, type1–10 | 12: entnMain, entn1–10, entnInfo | 2 |
| cardDevice2 | 7: typeMain, type1–6 | 8: entnMain, entn1–6, entnInfo | 2 |
| cardDevice3 | 9: typeMain, type1–8 | 10: entnMain, entn1–8, entnInfo | 2 |

Für Info und die beiden Navigationspfeile gibt es keine `type`-Variable. Ihr Typ landet nur kurz in `tTmp`.

### Wo der Typ gelesen wird

Die folgenden Stellen sind auf allen drei Seiten und in allen drei Modellen gleich. Einzige Ausnahme: us-p cardDevice1
hat die schmalen Kopien `bEntityS1`/`bEntityS2` nicht.

1. **tmSerial `entityUpd` (Parser):**
   - Für jedes Element mit eigener Variable gilt:
     `spstr strCommand.txt,type<k>.txt,"~",<feld>` und danach `if(type<k>.txt=="delete"||type<k>.txt=="")`.
     Das entscheidet über Verstecken oder Anzeigen. Andere Typnamen vergleicht der Parser nicht.
   - Navigation links/rechts (Feld 2/8) und Info (Feld 80 in cardDevice1) lesen den Typ in `tTmp`. Auch dort gibt es nur
     den Vergleich `delete`/`""`.
   - `tTmp` dient außerdem als Hilfsvariable für das `¬`-Fontsuffix und die Farbfelder. Dort ist es kein Typ-Träger.
2. **down eines Elements** (bMain, bEntity*, bEntityS*, tStat7–10 in cardDevice1, mSlot* in cardDevice2/3):
   - `if(type<k>.txt=="text"&&entn<k>.txt=="")` setzt `vaLPCell=0`, das Element blinkt dann nicht.
   - `tTmp.txt=type<k>.txt` übergibt den Typ an tmLP.
   - Vier `if(type<k>.txt=="shutter"|"shutter2"|"input_sel"|"timer") page popup…` öffnen das Popup beim Tippen.
   - tStat* und mSlot* prüfen davor zusätzlich `type<k>!="delete"&&type<k>!=""`.
3. **up eines Elements:**
   - `if(type<k>.txt!="text"||entn<k>.txt!="")` umschließt das Senden.
   - tStat* und mSlot* prüfen zusätzlich `!="delete"&&!=""`.
   - Die Knopf-Slots machen keinen `text`-Vergleich und senden immer: cardDevice1 bEntity3–6, cardDevice2 bEntity6.
4. **tmLP timer:** Vier Vergleiche auf **`tTmp.txt`** (`light`, `light2`, `fan`, `number`) mit `page popup…`.
5. **tc0, load:** Beide lesen keinen Typ. tc0 setzt nur Farben zurück (vaLPCell, tStat-bco).

Insgesamt kommen nur diese Namen vor: `""`, `delete`, `text`, `shutter`, `shutter2`, `input_sel`, `timer`, `light`,
`light2`, `fan`, `number`. Weitere Typnamen werden nirgends verglichen:

- cardDevice2 hat keinen Vergleich für `value` oder `progress`.
- cardDevice3 hat keinen Vergleich für `switch`.
- Die Darstellung hängt am Slot (Objektart), nicht am Typ.

**Wird der Typ gesendet oder an ein Popup weitergegeben?** Nein.

- `tSend` enthält nur `entn` (`event,buttonPress2|3,<entn>,button`).
- An Popups gehen `pageIcons.tTmp1` = Name, `tTmp2` = entn, `tTmp3` = Icontext und `tempIconColor`, aber kein Typ.
- `pageIcons.tTmp1=tTmp.txt` im `pageType`-Zweig ist das zweite Feld von `pageType~` (die Entity-ID), nicht der Typ.

**Reichen 0–9?** Für die Geräteseiten ja. Der einzige Vergleich außerhalb der 0–9-Gruppen ist `text` in
„text ohne ID sendet nicht und blinkt nicht“. Der Adapter schickt auf Geräteseiten nie ein Element mit leerer ID:

- Jedes Page-Item hat die ID `<Seite>?<n>`.
- Ein leeres Item ist `~~~~~`, also Typ `""` und damit 0 (siehe B).

Mit `text` → 1 wird `type==1&&entn==""` deshalb gleichwertig zu `entn==""`. Dieselbe Bedingung steht im Web-Panel
(`deviceTouch`). Ein eigener Wert für `text` ist nicht nötig.

**Folge für tmLP:** tmLP liest den Typ heute aus `tTmp`. Diese Variable überschreibt tmSerial bei jedem `entityUpd`,
also auch während der Finger liegt. Wird der Typ eine Zahl, braucht tmLP einen Zahl-Träger. Dafür gibt es zwei Wege:

- eine neue lokale Zahlvariable (≈ +8 Byte),
- tmLP sucht den Typ über `vaLPCell` (Zelle 1–13), dann ohne neue Variable.

Der heutige `tTmp`-Weg hat dasselbe Überschreib-Risiko schon jetzt. Das ist ein Befund, kein Auftrag.

**Umsetzung:** eine neue Zahlvariable `vLPType` je Seite; `down` schreibt den Typ hinein, tmLP öffnet die Popups 6–9
daraus.

**covx und leere Elemente:** `covx` ergibt 0 für leeren Text, für `"0"` und für jeden Text ohne führende Ziffer (am
Panel gemessen). Ein leeres Element (`~~~~~`) und die Zahl 0 sind damit gleichwertig: ausgeblendet.

## B. Element-IDs im Adapter

- **ID aller Elemente:** `PageItem.getPageItemPayload()` setzt `message.intNameEntity = this.id`
  (`src/lib/pages/pageItem.ts:415`). `this.id` ist `${page.id}?${index}`, gesetzt in `Page.createPageItems()`
  (`src/lib/classes/Page.ts:411`) und `getPageItemAt()` (`:448`). `page.id` ist `String(a)`, also die Position in
  `options.pages` einschließlich der angehängten Systemseiten (`src/lib/controller/panel.ts:602`).
- **Geräteseite:** `buildDevicePage()` (`src/lib/pages/device-page.ts:1169`, aufgerufen nur aus `src/main.ts:3911`, also
  nur aus Admin-Geräte-Items; Zeilennummern Stand der Analyse) legt die Items so an:
  `[main, slot1 … slotN, info, status, extra1 … extraE]`. **Umsetzung:** seit `device13`
  `[main, slot1 … slotN, info, status, Status-Icon 1 … M, extra1 … extraE]` mit M = 16 (Layout 1), 0 (Layout 2),
  8 (Layout 3) und N = 6 / 6 / 8 (`devicePageSlotItemIndex`, `devicePageStatusItemIndex`). Jedes davon ist ein normales
  Page-Item mit `<Seite>?<n>`:
  - main: `devicePageMainItem`
  - Slots mit State: `devicePageSlotItem`
  - Alias-Kanal: das Item aus dem Config-Manager, Feld 2 bleibt unverändert, `devicePageChannelElement` ändert nur Feld 6
  - Navigations-Slot `custom: navigation`: Item vom Typ `text` mit `setNavi`
  - Status-Icons: `devicePageStatusIconElement` behält die Felder 1–4
  - Info: `devicePageInfoItem`

  Ein leerer Slot wird zum Element `~~~~~` (`DEVICE_PAGE_EMPTY_ELEMENT`). Das Status-Item (n = N+2) wird nicht als
  Element gesendet, sein Wert steht in Feld 6 von main.
- **Größtes n:**

  | Layout | Items | n auf EU/us-l/us-p | n auf web-l/web-p (webExtras) |
  |---|---|---|---|
  | 1 | 15 | 0–11 | bis 14 |
  | 2 | 12 | 0–7 | bis 11 |
  | 3 | 14 | 0–9 | bis 13 |

  Die HMI-Modelle bekommen keine Extra-Slots (`devicePageOfModel`). n ist dort also immer höchstens zweistellig.

  **Umsetzung (`device13`):** Layout 1 hat 27 Items (gesendet n 0–7 in `entityUpd`, 9–24 in `devIcons`, auf
  web-l/web-p dazu 25–26), Layout 2 unverändert, Layout 3 22 Items (0–9 und 11–18, auf web-l/web-p bis 21). Das
  größte n ist 26, `999?26` hat 6 Zeichen und passt in `entn` mit txt_maxl 7.
- **Seitenindex > 999?** Das ginge nur mit etwa 975 oder mehr konfigurierten Seiten, einschließlich der erzeugten Geräte-,
  Detail- und Media-Unterseiten und der rund 20 Systemseiten. Der Nutzer mit 240 Seiten liegt weit darunter.
  `999?14` hat 6 Zeichen und passt.
- **n > 999?** Das geht auf Geräteseiten nicht, weil die Item-Zahl fest ist (höchstens 15). Auf anderen Seiten entsteht
  n nur durch die Zahl der konfigurierten Items, ebenso beim Screensaver: seine Items heißen `<ss-Index>?<n>` und landen
  nie auf einer Geräteseite. Dreistellig wird n nur bei mehr als 999 Items auf einer Seite.
  `src/lib/classes/hmi-id-length.test.ts` prüft schon 250 Items und Seitenindex 1999 gegen 23 Zeichen.
- **Längere IDs auf einer Geräteseite?** Keine gefunden.
  - Skripte können keine `cardDevice*`-Seite anlegen, ein Skript-Typ dafür existiert nicht.
  - `additionalId` (`pageItem.ts:828/872`, hängt Text an die ID) setzt nur `pageMenu.ts:89` für den Pfeil
    (`-NextPageArrow`), auf Geräteseiten nicht.
  - `mainId`/`subId` in `tools.getItemMesssage` setzt niemand.
  - `navigate.*`-IDs kommen nur über Skript-Items auf anderen Seiten.
- **Navigationspfeile (nent1/nent2, nicht Teil der Entscheidung):** `Navigation.buildNavigationString`
  (`src/lib/classes/navigation.ts:502`) schickt `bSubPrev`, `bSubNext`, `bUp` oder `bHome`, also höchstens 8 Zeichen.
- **Wo Feld 1 entsteht:**
  - Allgemein in `getPageItemPayload()`: `tools.getItemMesssage` (`src/lib/const/tools.ts:1082`) und das direkte
    `getPayloadRemoveTilde(entry.type, …)` für text/button/switch (`pageItem.ts:869`).
  - Für die Geräteseite laufen alle Elemente in `PageDevice.update()` (`src/lib/pages/pageDevice.ts:187`) durch die
    Funktionen in `device-page.ts`:
    - main über `devicePageMainElement` (`:311`) in `devicePagePayload` (`:366`),
    - Slots über `slotElement` → `devicePageChannelElement` (`:651`, liest `fields[0]` als Namen) → `devicePageClampElement`
      (`:327`) oder `devicePageStatusIconElement` (`:454`, prüft `!fields[0]`),
    - Info über `devicePageClampElement`.

  Der spätere `switch(type)` gehört **hinter** diese Funktionen, zum Beispiel als ein Schritt in `devicePagePayload` über
  main und alle Elemente. Davor arbeiten mehrere Funktionen noch mit dem Typnamen.
- **Versionsgrenze:**
  - Heute gilt `CARD_DEVICE_MIN_TFT = '6.3.0'` mit `supportsCardDevice()` (`device-page.ts:78/112`). Pro Panel gibt es
    `Panel.meetsVersion()` (`panel.ts:422`).
  - Web-Panels melden die TFT-Version, die ihnen der Adapter im `hello` gibt
    (`src/lib/web/virtual-panel-manager.ts:520`):
    - web-l/web-p bekommen `1.0.0` und damit weiter Text,
    - Web-Klone von EU/us-l/us-p bekommen die neueste verfügbare TFT und damit die Zahl (siehe F).

    **Umsetzung:** keine Versionsweiche für die Zahl (siehe Entscheidung 3); alle Modelle bekommen sie.

## C. RAM-Ersparnis

Rechenmodell:

- `type<k>` String txt_maxl 10 = 8 + 12 = 20 Byte, als Zahlvariable 8 Byte. Ersparnis **12 Byte je Variable**.
- `entn` 23 → 7: Puffer 24 → 8. Ersparnis **16 Byte je Variable**.

Code kostet kein RAM. Ausgang sind die gemessenen Editor-Werte (Limit 3584).

**Gemessen nach der Umsetzung** (EU `device13`, mit Status-Raster und Stufen, nicht nur Typzahl und `entn` 7):
cardDevice1 3216 (368 frei), cardDevice2 2492 (1092 frei), cardDevice3 3328 (256 frei). us-l und us-p `device13` sind
noch nicht kompiliert – ihre Werte sind offen.

| Modell | Seite | belegt heute | frei heute | type (Anzahl × 12) | entn (Anzahl × 16) | Ersparnis | frei danach |
|---|---|---|---|---|---|---|---|
| EU | cardDevice1 | 3332 | 252 | 11 × 12 = 132 | 12 × 16 = 192 | 324 | **≈ 576** |
| EU | cardDevice2 | 2824 | 760 | 7 × 12 = 84 | 8 × 16 = 128 | 212 | ≈ 972 |
| EU | cardDevice3 | 3352 | 232 | 9 × 12 = 108 | 10 × 16 = 160 | 268 | **≈ 500** |
| us-l | cardDevice1 | 3308 | 276 | 132 | 192 | 324 | ≈ 600 |
| us-l | cardDevice2 | 2800 | 784 | 84 | 128 | 212 | ≈ 996 |
| us-l | cardDevice3 | 3328 | 256 | 108 | 160 | 268 | ≈ 524 |
| us-p | cardDevice1 | 3076 | 508 | 132 | 192 | 324 | ≈ 832 |
| us-p | cardDevice2 | 2800 | 784 | 84 | 128 | 212 | ≈ 996 |
| us-p | cardDevice3 | 3328 | 256 | 108 | 160 | 268 | ≈ 524 |

Hinweise:

- Eine zusätzliche Zahlvariable als tmLP-Träger kostet etwa 8 Byte.
- Die Genauigkeit liegt bei etwa ±4 Byte je Variable, je nachdem, was eine Zahlvariable wirklich kostet. Maßgeblich ist
  der Editor-Wert.
- nent1/nent2 sind nicht eingerechnet. Sie bräuchten höchstens 8 Zeichen, mit txt_maxl 11 wären das 2 × 12 = 24 Byte.

## D. Andere Seiten (Überblick)

`type<k>`-String-Variablen haben diese Seiten. Popups, Screensaver, cardThermo, cardPower, cardAlarm und die Charts
haben keine.

| Seite | type-Vars (EU / us-l / us-p) | verglichene Typnamen | wann | grobe Ersparnis (× 12) |
|---|---|---|---|---|
| cardEntities | 4 / 4 / 6 | delete, "", shutter, shutter2, light, light2, switch, fan, text, timer, button, input_sel, number | **beim Zeichnen je Element** (6 if-Blöcke, 13 Vergleiche) + Tippen | 48 / 48 / 72 |
| cardEntities2 (nur EU) | 5 (txt_maxl 11) | wie cardEntities | Zeichnen je Element + Tippen | 60 |
| cardSchedule | 6 | delete, "", text (Zeichnen); shutter … number, text (Tippen) | Zeichnen 1–2 Vergleiche, Rest beim Tippen | 72 |
| cardGrid / cardGrid3 | 6 | delete, "" (Zeichnen); shutter, shutter2, input_sel, timer, light, light2, fan, number (Tippen/tmLP) | nur Tippen | 72 |
| cardGrid2 | 8 / 8 / 9 | wie cardGrid | nur Tippen | 96 / 96 / 108 |
| cardThermo2 | 9 | delete, "" (Zeichnen); shutter, shutter2, input_sel, timer, light, light2, fan, number (Tippen) | nur Tippen | 108 |
| cardMedia | 6 | delete, ""; shutter, shutter2, input_sel, **media_pl**, **slider**, number, timer, light, light2, fan | Tippen | 72 |
| cardQR | 2 | delete, "", light, switch, text, button | Zeichnen | 24 |

Die `entn`-Puffer dieser Seiten (64 bzw. 80 bei cardGrid/cardEntities/cardSchedule, 40 bei cardThermo2) bleiben laut
Entscheidung 4 unverändert.

**Knapp nach den Editor-Ausgaben (> 3400):**

- EU: cardSchedule 3452, cardThermo2 3436, popupInSel 3500, popupTimer 3500, popupThermo 3580
- us-l: cardThermo2 3412, popupInSel 3524, popupTimer 3476, popupThermo 3556
- us-p: **cardEntities 3548**, cardThermo2 3412, popupInSel 3524, popupTimer 3476, popupThermo 3556

Die Popups haben keine `type`-Variablen. Für sie bringt die Typ-Zahl nichts.

**Reichen 0–9 dort?**

- **cardGrid 1–3, cardThermo2, cardSchedule:** ja. Sie unterscheiden dieselben Gruppen wie die Geräteseite. cardSchedule
  prüft beim Zeichnen zusätzlich `text`, und dafür gilt dieselbe Frage wie in A, ob 1 reicht.
- **cardEntities/cardEntities2:** nein. Sie zeichnen je Typ andere Zeilen:
  - shutter/shutter2 → Pfeile
  - light/light2/**switch**/fan → Schalter
  - **text**/timer → Text
  - **button**/input_sel → Knopf
  - number → Slider

  switch, text und button liegen in 0–9 alle auf 1, werden aber verschieden gezeichnet. Das braucht mindestens zwei
  weitere Werte, etwa 10 = switch und 11 = button (text bleibt 1).
- **cardQR:** braucht ebenfalls getrennte Werte für switch, text und button.
- **cardMedia:** braucht zusätzlich Werte für `media_pl` und `slider`.

## E. Nextion-Fakten, vor dem Bau am Simulator prüfen

**Belegt:**

- `covx tTmp.txt,<var>.val,0,0` (Text → Zahl in eine Variable) läuft auf echten Panels:
  `indicator_long_press_mask.py`, `notify_blink.py`, `display_ack.py`.
- Mehrfachbedingungen mit `&&` oder `||` stehen im bestehenden HMI-Code, zum Beispiel
  `if(type7.txt!="delete"&&type7.txt!="")` und `if(type1.txt=="light"||type1.txt=="light2"||…)`.
- Die Nextion-Doku (Instruction Set, `if`) sagt wörtlich:
  - „Conditions can be joined by &&s or by ||s but not both.“
  - „Conditions are non-complex. No evaluations within the condition“
  - Auswertung strikt von links nach rechts, ohne Klammern.

  Damit ist `if(type1.val>=2&&type1.val<=5)` zulässig, eine Mischung wie `…&&…||…` aber nicht.
  `indicator_long_press_mask.py` hält dazu fest: „if() takes no expressions, hence sys0“.

**Inzwischen am Panel gemessen (2026-11-28):** `covx` liest die führenden Ziffern; leerer Text und Text ohne führende
Ziffer (`shutter`, `delete`) ergeben 0. Damit sind ein leeres Element und Typ 0 gleichwertig. Der folgende Absatz ist
der Stand vor der Messung.

**Nicht belegt (Annahme):** was `covx` bei nicht-numerischem Text liefert. Die Nextion-Doku sagt nur „text must be text
ASCII representation of an integer value“ und nichts zu leerem Text, `shutter` oder `12abc`. Es gibt nur Hinweise:

- Das Web-Panel bildet `covx` in `src-web/src/cards/cardChart/parse.ts:64` als „führende Ganzzahl, sonst 0, leer → 0“
  nach. Das ist eine Annahme aus dem Web-Panel-PR, keine Messung.
- `indicator_long_press_mask.py` prüft leer **vor** `covx` und setzt dann selbst 0. Das spricht dafür, dass man sich
  darauf bisher nicht verlassen hat.

**Prüfpunkte für den Simulator:**

1. ~~`covx` mit `"shutter"`, `"delete"`, `""`, `"input_sel"`, `"0"`, `"1"` und `"12abc"` in eine Zahlvariable, die vorher
   auf 7 stand.~~ **Erledigt (am Panel gemessen):** führende Ziffern werden gelesen, Text ohne führende Ziffer und
   leerer Text ergeben 0.
2. `if(type1.val>=2&&type1.val<=5)` ist richtig für 1, 2, 5, 6.
3. `if(type1.val==0||type1.val==1)` und Vergleiche einer Zahlvariable mit einer Konstanten in down/up/tmLP.
4. `spstr` in eine Variable, die jetzt Zahl ist, muss wegfallen. Der Weg ist `spstr` → `tTmp` → `covx`, und `tTmp`
   (txt_maxl 10) muss `input_sel` (9 Zeichen) fassen.
5. entn txt_maxl 7: `999?999` (7 Zeichen) kommt ganz an. Bei 8 Zeichen wird abgeschnitten, was nur für den Test zählt.
6. Ein langer Druck, während ein `entityUpd` eintrifft, öffnet weiter das richtige Long-Press-Popup (Typ-Träger für tmLP).
7. Die RAM-Werte der drei Seiten in allen drei Modellen aus dem Editor gegen die Tabelle in C. **EU gemessen** (siehe C),
   us-l und us-p offen.

## F. Web-Panel

- Das Web-Panel bekommt denselben `entityUpd`-Text wie die HMI. Er wird pro Panel im Adapter gebaut, auch für einen
  Web-Klon (eigene Panel-Instanz). Web-Modelle bekommen zusätzlich die Extra-Slots hinter Info.
- Den Typ wertet `src-web/src/cards/cardDevice/CardDevice.tsx` aus:
  - `deviceTouch()`: `""`/`delete` → nichts; `POPUP_ON_TOUCH` (shutter, shutter2, input_sel, timer) → Popup über
    `popupForType()` aus `cardEntities/shared/entityTypes.ts`; `text` ohne ID außerhalb von Knopf-Slots → nichts; sonst
    `tileTouch()` aus cardGrid.
  - `POPUP_ON_HOLD` (light, light2, fan, number) für `longPressOnRelease`.

  Die Darstellung hängt am Slot, nicht am Typ (`parse.ts`, `layout.ts`).
- **Mit einer Typzahl** müsste das Web-Panel beim Parsen von cardDevice die Zahl auf die Namen zurückführen, die es
  braucht: 0 → `""`, 2–9 → die festen Namen, 1 → ein „sendet nur“-Typ. Text muss es weiter verstehen, denn
  web-l/web-p bekommen wegen TFT `1.0.0` Text.
  **Umsetzung:** `parse.ts` führt die Zahl auf die Namen zurück und versteht weiter Typnamen; der Adapter schickt allen
  Modellen, auch web-l/web-p, die Zahl.
- Web-Klone von EU/us-l/us-p melden die neueste verfügbare TFT und bekommen deshalb die Zahl.
- Für 1 kann das Web-Panel switch, button und text nicht mehr unterscheiden. Auf der Geräteseite braucht es das nicht,
  weil die Darstellung am Slot hängt und der Adapter nie ein Element ohne ID schickt.

## Anhang: Status-Raster 4×2 auf cardDevice1

*(Überholt: umgesetzt ist das Raster bis 8×2.)* Die Rechnung zum Status-Raster mit 0–4 Spalten (Geometrie, Namens- und Wertbreiten, RAM-Varianten, strCommand bei 14
Slots, Folgearbeiten) steht in [device-details/status-grid-4x2.md](device-details/status-grid-4x2.md). Sie baut auf den
Einsparungen aus Abschnitt C auf.

Die Fortsetzung bis 8×2 (16 Icons, eigene Nachricht `devIcons`) steht in
[device-details/status-grid-8x2.md](device-details/status-grid-8x2.md).
