# Prompt: Doku für den langen Druck auf Screensaver-Indikatoren

Diese Datei ist ein fertiger Prompt für Claude. Er ergänzt die Nutzerdoku um den langen Druck auf Indikatoren des
Bildschirmschoners und um das geänderte Verhalten beim kurzen Tipp mit TFT 6.0.9. Kompletten Text unterhalb der Linie an
Claude geben, im Repository dieses Adapters mit dem aktuellen Stand von `main`.

---

Du pflegst die Nutzerdokumentation des ioBroker-Adapters `nspanel-lovelace-ui` unter `doc/de` und `doc/en`.
Daraus baut `script/build-doc-page.ts` die GitHub-Pages-Seite. Arbeite zwei zusammenhängende Änderungen an den
Indikatoren des Bildschirmschoners ein. Nutzer sollen sie ohne Blick in den Code im Admin einrichten und in eigenen
Skripten nutzen können.

1. **Kurzer Tipp mit TFT 6.0.9:** Der Tipp auf einen Indikator zählt zusammen mit den Tipps auf den Hintergrund. Ein
   Indikator, der keine Taste ist, verlässt den Bildschirmschoner nicht mehr sofort, sondern wirkt wie ein Tipp auf den
   Hintergrund.
2. **Langer Druck (neu):** Ein Indikator kann eine eigene **Aktion bei langem Drücken** bekommen. Jeder lange Druck
   schreibt einen eigenen State.

Es geht nur um die Konfiguration und das Verhalten im Adapter, nicht um das Bauen der HMI.

## So gehst du vor

1. **Aufbau lesen.** Lies `doc/de/_Sidebar.md`, `doc/en/_Sidebar.md`, `doc/de/screensaver.md` und
   `doc/en/screensaver.md` vollständig, dazu `doc/de/WebPanel.md` und `doc/en/WebPanel.md`. Lies außerdem den Docstring
   von `HMI/tools/indicator_long_press.py`, dort steht, was die TFT sendet.
2. **Ablage.** Ergänze `screensaver.md` in beiden Sprachen, vor allem Abschnitt **8. Indikatoren und Tasten**. Lege keine
   neue Seite an, außer es gibt dafür einen zwingenden Grund, den du am Ende nennst.
3. **Am Code prüfen.** Die Angaben unten sind der Stand beim Schreiben dieses Prompts. Prüfe sie gegen den Code, bevor du
   sie übernimmst. Stimmen Prompt und Code nicht überein, gilt der Code, und du nennst die Abweichung am Ende.
   Dialogtexte entnimmst du `admin/i18n/de/translations.json` und `admin/i18n/en/translations.json`, damit sie wörtlich
   stimmen. Wichtige Stellen:
   - `src/lib/controller/panel.ts`: Zweig für `buttonPress2` / `buttonPress3` einer Kachel, `onScreensaverTouch`.
   - `src/lib/pages/screensaver.ts`: `isIndicatorKey`, `onIndicatorTap`, `hasIndicatorLongPress`, `onIndicatorLongPress`,
     `writeIndicatorButton`.
   - `src/lib/pages/pageItem.ts`: `onCommandLongPress`, `longPressMode`.
   - `src/lib/classes/config-manager.ts`: `getScreensaverIndicatorAction` und `getScreensaverIndicatorLongPress`.
   - `src/lib/types/adminShareConfig.ts`: `ScreensaverItemAction`, `ScreensaverItemLongPressAction`.
   - `src/lib/types/config-manager.d.ts`: `ScreenSaverIndicatorAction`, `ScreenSaverIndicatorLongPress`.
   - `src/lib/const/definition.ts`: `buttons.indicator`, `buttons.indicatorLong`.
   - `src-admin/src/components/ScreensaverItemDialog.tsx`, `src-admin/src/components/ScreensaverEditor.tsx`.
   - `src-web/src/cards/screensaver/interaction.ts`.
   - `json/version.json`.
4. **Nach weiteren Änderungen suchen.** Dieser Prompt kann älter sein als der Code. Suche deshalb selbst nach Änderungen
   an Indikatoren und Screensaver, die hier fehlen, und arbeite sie mit ein:
   - Liste die Commits seit diesem Prompt:
     `git log --oneline "$(git log -1 --format=%H -- doc/prompt_doku-indikator-long-press.md)"..HEAD -- src/lib/pages/screensaver.ts src/lib/pages/pageItem.ts src/lib/controller/panel.ts src/lib/classes/config-manager.ts src/lib/const/definition.ts src/lib/types/adminShareConfig.ts src-admin/src/components/ScreensaverEditor.tsx src-admin/src/components/ScreensaverItemDialog.tsx src-web/src/cards/screensaver HMI/tools json/version.json`.
     Lies bei allem, was den Screensaver betrifft, auch den Diff. Lies auch den Commit
     `feat(screensaver): icon font for tiles indicators and tap counter on indicator taps (#849)`, der den Tipp-Zähler
     eingeführt hat.
   - Lies in `README.md` unter `## Changelog` den Abschnitt `WORK IN PROGRESS` und die Einträge der Versionen danach auf
     Indikator, long press, tap, `indicatorLong`, TFT 6.0.8 und 6.0.9.
   - Vergleiche die Schlüssel `screensaver_item_action*` und `screensaver_item_longPress*` in
     `admin/i18n/de/translations.json` mit dieser Doku. Ein Dialogfeld oder eine Option, die in `screensaver.md` fehlt,
     gehört geprüft.
   - Nimm auf, was Nutzer beim Einrichten wissen müssen. Liste am Ende alle so gefundenen Punkte auf, auch die, die du
     bewusst nicht aufgenommen hast, mit Begründung.
5. **Schreiben.** Stil der bestehenden Seiten: sachlich, kurze Absätze, Tabellen für Felder, Backticks für Datenpunkte
   und IDs, kein Marketing. Deutsch und Englisch gleichwertig, gleiche Gliederung. Beschreibe, was der Nutzer tut und
   was dann passiert.
6. **Bilder.** Du kannst keine Screenshots vom Admin oder Panel erstellen. Erfinde keine Bildpfade. Nenne am Ende die
   Stellen, an denen ein Bild fehlt, mit Vorschlag für den Inhalt.
7. **Prüfen.** Führe `npx tsx script/build-doc-page.ts _site --strict` aus. Tote Links und Anker müssen behoben sein.
   Lösche danach `_site`, falls es nicht ignoriert wird, und ändere außerhalb von `doc/de` und `doc/en` nichts.
8. **Abschluss.** Nicht committen. Nenne die geänderten Dateien, die Bildstellen, jede Abweichung zwischen Prompt und
   Code, die zusätzlich gefundenen Änderungen und die offenen Fragen. Was du nicht prüfen konntest, nennst du
   ausdrücklich.

## Was geändert werden muss

Die Abschnittsnummern beziehen sich auf `screensaver.md`.

| Stelle | Änderung |
|---|---|
| Abschnitt 8, Tabelle der Aktionen, Zeile **keine** | „Tipp führt zur Hauptseite“ stimmt mit TFT 6.0.9 nicht mehr, siehe „Kurzer Tipp“ unten. Altes und neues Verhalten trennen. |
| Abschnitt 8, Absatz zur Option **Indikatoren wirken als Tasten** | Ergänzen, was mit TFT 6.0.9 bei ausgeschalteter Option passiert. |
| Abschnitt 8, Absatz **Ein Druck, ein Ereignis** | TFT 6.0.9 ergänzen: Tipp beim Loslassen, langer Druck nach 500 ms. |
| Abschnitt 8, neuer Unterabschnitt | **Aktion bei langem Drücken** mit dem Inhalt unten. |
| Abschnitt 8, Absatz **Ein State je Indikator** | `buttons.indicatorLong-N` ergänzen. |
| Abschnitt 1 oder 2 (Rahmen der Indikatoren im Panelbild) | Nur prüfen: Der Rahmen zeigt beim Schreiben dieses Prompts nur die Aktion des kurzen Drucks. Falls das noch so ist, kurz erwähnen. |
| Abschnitt [Kacheln](#16-kacheln) und Fallstricke | Voraussetzung TFT 6.0.9 nennen, falls dort TFT-Versionen stehen. |
| `WebPanel.md` | Nur ergänzen, wenn die Seite die Bedienung des Bildschirmschoners beschreibt: Das Web-Panel kennt den langen Druck auch. |

Die Nummerierung der Abschnitte soll stimmig bleiben. Prüfe Anker, auf die andere Seiten verlinken, bevor du Überschriften
oder Nummern änderst.

## Inhalt

### Voraussetzung

Der Tipp-Zähler und der lange Druck brauchen die TFT 6.0.9 (`HMI/nspanel-v6.0.9.HMI`, `HMI/us-l/…`, `HMI/us-p/…`). Sie
gelten für die Indikatoren von `screensaver5` (Version **Kacheln**) und `screensaver2` (Version **Advanced**), auf `eu`,
`us-l` und `us-p`. Mit einer älteren TFT verhalten sich die Indikatoren wie bisher, ein langer Druck kommt dort nicht an.

Kläre in `json/version.json`, ob 6.0.9 schon als `tft` oder `tft-beta` veröffentlicht ist. Beim Schreiben dieses Prompts
war sie es noch nicht. Stelle nichts als Tatsache dar, was du nicht belegen kannst, und nenne es sonst als offene Frage.

### Kurzer Tipp (TFT 6.0.9)

- Die TFT meldet den Tipp erst beim **Loslassen** und schickt die Zahl der Tipps mit. Tipps auf Indikatoren und auf den
  Hintergrund zählen gemeinsam, zum Beispiel für den Doppelklick zur Hauptseite.
- Ist der Indikator eine **Taste**, läuft wie bisher seine Aktion. Eine Taste ist er, wenn er eine **Aktion beim Drücken**
  hat. Mit der Option **Indikatoren wirken als Tasten** zählt auch ein Indikator mit einem beschreibbaren Datenpunkt, den
  er umschalten kann, als Taste. Ein Rollladen ist nie eine Taste ohne eigene Aktion. Die genaue Regel steht in
  `isIndicatorKey`.
- Ist er **keine Taste**, wirkt der Tipp wie ein Tipp auf den Hintergrund des Bildschirmschoners: Doppelklick-Einstellung,
  Timer-Tipp, Benachrichtigung, Gesten. Er verlässt den Bildschirmschoner also nicht mehr sofort.
- `buttons.indicator-N` wird bei jedem Tipp geschrieben, wie bisher.
- Eine Wischgeste, die auf einer Kachel beginnt, sendet nur die Geste.

### Aktion bei langem Drücken (neu)

Im Item-Dialog eines Indikators steht unter der **Aktion beim Drücken** ein zweiter Block **Aktion bei langem Drücken**.
Er erscheint nur auf Indikator-Plätzen, für Datenpunkte wie für Templates.

| Auswahl | Wirkung |
|---|---|
| **keine** | Ein langer Druck wirkt wie ein kurzer Tipp (siehe oben). |
| **Taste (schreibt true)** | schreibt `true` in den gewählten Datenpunkt. |
| **Schalter (wechselt)** | kippt den gewählten Datenpunkt zwischen `true` und `false`. |
| **Seite öffnen** | öffnet die gewählte Seite der Instanz. |

- **Werte zum Umschalten** gibt es beim langen Druck nicht.
- Taste und Schalter brauchen einen beschreibbaren Datenpunkt. Sonst warnt der Dialog und lässt nicht übernehmen, wie bei
  der Aktion des kurzen Drucks. Ist der Datenpunkt zur Laufzeit nicht vorhanden oder nicht beschreibbar, schreibt der
  Adapter eine Warnung ins Log, und der lange Druck wirkt wie ein kurzer.
- Hinweistext im Dialog: `screensaver_item_longPress_hint`.
- Der lange Druck löst nach **500 ms** aus, noch während der Finger liegt. Das Loslassen sendet danach nichts mehr. Ist
  eine Aktion eingestellt, läuft **nur** sie, nicht die Aktion des kurzen Drucks.
- Prüfe im Code, ob die Aktion bei langem Drücken die Option **Indikatoren wirken als Tasten** braucht. Beim Schreiben
  dieses Prompts brauchte sie die Option nicht.
- Im Konfigurationsskript heißen die Felder `ScreensaverEntityLongPressButton`, `ScreensaverEntityLongPressSwitch` und
  `ScreensaverEntityLongPressNaviToPage`. Gibt es mehrere, gilt dieselbe Reihenfolge wie beim kurzen Druck: Taste,
  Schalter, Seite. Nimm das nur auf, wenn die Seite die Skriptfelder des kurzen Drucks auch nennt. Prüfe außerdem, ob die
  Skriptvorlagen (`script/example_sendTo_script_iobroker.ts`, `script/globalPageConfig.ts`) die Felder inzwischen
  enthalten.

Beispiel für den Text: Ein Indikator **Licht** schaltet beim kurzen Tipp das Licht (Aktion **Schalter**) und öffnet beim
langen Druck die Seite mit allen Lampen (Aktion bei langem Drücken **Seite öffnen**).

### States

- `panels.<Panel>.buttons.indicatorLong-1`, `-2`, … zählen in derselben Reihenfolge wie `buttons.indicator-N`, also in
  der Reihenfolge der Items im Bereich **Indikatoren**. Rolle, Typ und Name stehen in `definition.ts`
  (`buttons.indicatorLong`).
- **Jeder** lange Druck schreibt `true` in `indicatorLong-N`, auch ohne eingestellte Aktion. Ohne Aktion wird zusätzlich
  `indicator-N` geschrieben, weil der lange Druck dann wie ein Tipp wirkt. Prüfe das im Code
  (`onIndicatorLongPress`, `onIndicatorTap`) und beschreibe es für Skript-Nutzer klar.

### Web-Panel

Die Indikator-Kacheln im Web-Panel senden nach 500 ms gedrückt ebenfalls einen langen Druck. Anders als am echten Panel
bricht eine Bewegung ab etwa 20 px den langen Druck ab (`LONG_PRESS_MOVE_PX` in `interaction.ts`). Nimm das nur auf, wenn
`WebPanel.md` die Bedienung so genau beschreibt.

### Getestet

Am 2026-11-09 mit TFT 6.0.9 auf zwei EU-Panels getestet: Kacheln und Advanced, eingestellter Schalter, eingestellte Seite
und der Rückfall auf den kurzen Tipp ohne Aktion. Nicht am Panel getestet: `us-l`, `us-p`, die Aktion **Taste** beim
langen Druck und die ausgeschaltete Option **Indikatoren wirken als Tasten**. Das ist nur eine Info für dich, nicht für
die Doku.
