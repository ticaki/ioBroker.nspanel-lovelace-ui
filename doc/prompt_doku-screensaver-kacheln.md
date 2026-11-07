# Prompt: Doku für den Screensaver-Modus Kacheln (screensaver5)

Diese Datei ist ein fertiger Prompt für Claude. Er ergänzt die Nutzerdoku um die Konfiguration des Screensaver-Modus
Kacheln im Adapter. Kompletten Text unterhalb der Linie an Claude geben, im Repository dieses Adapters mit dem aktuellen
Stand von `main`.

---

Du pflegst die Nutzerdokumentation des ioBroker-Adapters `nspanel-lovelace-ui` unter `doc/de` und `doc/en`.
Daraus baut `script/build-doc-page.ts` die GitHub-Pages-Seite. Arbeite den Screensaver-Modus Kacheln ein. Nutzer sollen
ihn ohne Blick in den Code im Admin einrichten können.

Ausgangslage: Der Modus heißt in der Konfiguration `tiles`, im Admin „Kacheln“ (de) bzw. „Tiles“ (en), und läuft auf der
HMI-Seite `screensaver5`. `doc/de/screensaver.md` und `doc/en/screensaver.md` erwähnen ihn bisher nirgends. Beide
beschreiben noch vier Versionen. Es geht nur um die Konfiguration im Adapter, nicht um das Bauen der HMI.

## So gehst du vor

1. **Aufbau lesen.** Lies `doc/de/_Sidebar.md`, `doc/en/_Sidebar.md`, `doc/de/screensaver.md`, `doc/en/screensaver.md`,
   `doc/de/NSPanel-flashen.md` und `doc/de/WebPanel.md` vollständig, dazu den Abschnitt `screensaver5 page (Tiles)` in
   `HMI/Readme.md`.
2. **Ablage.** Ergänze `screensaver.md` in beiden Sprachen an den Stellen unten. Lege keine neue Seite an, außer es gibt
   dafür einen zwingenden Grund, den du am Ende nennst.
3. **Am Code prüfen.** Die Angaben unten sind der Stand beim Schreiben dieses Prompts. Prüfe sie gegen den Code, bevor du
   sie übernimmst. Stimmen Prompt und Code nicht überein, gilt der Code, und du nennst die Abweichung am Ende.
   Dialogtexte entnimmst du `admin/i18n/de/translations.json` und `admin/i18n/en/translations.json`, damit sie wörtlich
   stimmen. Wichtige Stellen: `src/lib/types/adminShareConfig.ts` (Plätze je Bereich, `screensaverItemFields`),
   `src/lib/const/definition.ts`, `src/lib/pages/screensaver.ts`, `src/lib/classes/config-manager.ts`,
   `src-admin/src/components/ScreensaverEditor.tsx`, `src-admin/src/components/ScreensaverItemDialog.tsx`,
   `HMI/tools/screensaver5.py`, `json/version.json`.
4. **Nach weiteren Änderungen suchen.** Dieser Prompt kann älter sein als der Code. Suche deshalb selbst nach Änderungen
   am Modus und am Screensaver, die hier fehlen, und arbeite sie mit ein:
   - Liste die Commits seit diesem Prompt:
     `git log --oneline "$(git log -1 --format=%H -- doc/prompt_doku-screensaver-kacheln.md)"..HEAD -- src/lib/pages/screensaver.ts src/lib/pages/pageItem.ts src/lib/classes/config-manager.ts src/lib/const/definition.ts src/lib/types/adminShareConfig.ts src-admin/src/components/ScreensaverEditor.tsx src-admin/src/components/ScreensaverItemDialog.tsx HMI/tools json/version.json`.
     Lies bei allem, was den Screensaver betrifft, auch den Diff.
   - Lies in `README.md` unter `## Changelog` den Abschnitt `WORK IN PROGRESS` und die Einträge der Versionen ab dem
     Eintrag „new mode tiles“ auf Screensaver, Kacheln, Tiles und `screensaver5`.
   - Vergleiche `screensaver_*` in `admin/i18n/de/translations.json` mit dieser Doku: Ein Dialogfeld oder eine Option, die
     in `screensaver.md` fehlt, gehört geprüft, auch wenn sie nicht nur Kacheln betrifft.
   - Nimm auf, was Nutzer beim Einrichten wissen müssen. Liste am Ende alle so gefundenen Punkte auf, auch die, die du
     bewusst nicht aufgenommen hast, mit Begründung.
5. **Schreiben.** Stil der bestehenden Seiten: sachlich, kurze Absätze, Tabellen für Felder, Backticks für Datenpunkte
   und IDs, kein Marketing. Deutsch und Englisch gleichwertig, gleiche Gliederung. Beschreibe, was der Nutzer tut und
   was dann passiert.
6. **Bilder.** Du kannst keine Screenshots vom Admin oder Panel erstellen. Erfinde keine Bildpfade. Nenne am Ende die
   Stellen, an denen ein Bild fehlt, mit Vorschlag für den Inhalt.
7. **Prüfen.** Führe `npx tsx script/build-doc-page.ts _site --strict` aus. Tote Links und Anker müssen behoben sein.
   Lösche danach `_site`, falls es nicht ignoriert wird, und ändere außerhalb von `doc/de` und `doc/en` nichts.
8. **Abschluss.** Nicht committen. Nenne die geänderten Dateien, die Bildstellen, jede Abweichung zwischen Prompt und Code,
   die zusätzlich gefundenen Änderungen und die offenen Fragen aus dem Abschnitt „Voraussetzung“. Was du nicht prüfen konntest, nennst du ausdrücklich.

## Was geändert werden muss

Die Abschnittsnummern beziehen sich auf `screensaver.md`.

| Stelle | Änderung |
|---|---|
| Abschnitt 2, Zeile **Version** | Kacheln ergänzen, Card `screensaver5` nennen |
| Abschnitt 2, Zeile **Zwei Statussymbole** | Lage bei Kacheln ergänzen: zwei Farbbalken am unteren Rand |
| Abschnitt 3, Tabelle der Plätze | Zeile für Kacheln ergänzen, siehe unten |
| Abschnitt 8 | Beginnt mit „Die Indikatoren (Version Advanced)“: Kacheln ergänzen |
| Abschnitt 9 | Ergänzen, was bei Kacheln von einem Statussymbol sichtbar ist |
| Neuer Abschnitt | Eigener Abschnitt zu Kacheln mit dem Inhalt unten, in beiden Inhaltsverzeichnissen eingetragen |
| Fallstricke | Voraussetzung TFT und die Grenzen unten |

Die Nummerierung der Abschnitte soll stimmig bleiben. Prüfe Anker, auf die andere Seiten verlinken, bevor du Überschriften
oder Nummern änderst.

## Inhalt

### Voraussetzung

Der Modus braucht eine TFT mit der Seite `screensaver5`. Die offizielle `nspanel-v6.0.7.HMI` hat diese Seite nicht, sie
steckt in den Projektdateien (`HMI/nspanel-v6.0.7.screensaver5.HMI`, `HMI/us-l/…`, `HMI/us-p/…`). Eine Seite
`screensaver4` der offiziellen HMI 6.0.7 ist eine davon unabhängige Animation und hat mit dem Modus nichts zu tun.

Kläre im Code und in `json/version.json`, welche TFT-Version der Nutzer braucht und wie er sie bekommt. `json/version.json`
nannte beim Schreiben `tft` 5.1.1 und `tft-beta` 6.0.7. Stelle nichts als Tatsache dar, was du nicht belegen kannst.
Nenne am Ende als offene Frage, falls nicht belegbar:

- Welche veröffentlichte TFT enthält `screensaver5`, und reicht dafür der normale Update-Weg?
- Was zeigt das Panel, wenn der Modus gewählt ist, die TFT die Seite aber nicht hat?

### Einrichten

Tab `Screensaver` → Eintrag wählen oder anlegen → **Version** auf **Kacheln** → Panels zuweisen → Plätze belegen. Wie in
den anderen Versionen bestimmt das Modell des ersten gewählten Panels die Zahl der Plätze.

### Plätze

| Modell | Favorit | Alternate | Links | Unten | Indikatoren | Statussymbole |
|---|---|---|---|---|---|---|
| `eu`, `us-l` | – | – | – | 5 | 7 | 2 |
| `us-p` | – | – | – | 4 | 8 | 2 |

Für die Tabelle in Abschnitt 3: **Kacheln** | – | – | – | 5 (`us-p`: 4) | 7 (`us-p`: 8) | 2.

### Aufbau auf dem Panel

| `eu`, `us-l` (Querformat, 5 Spalten) | `us-p` (Hochformat, 4 Spalten) |
|---|---|
| Indikatoren 1 bis 5 | Indikatoren 1 bis 4 |
| Indikator 6, Uhrzeit mit Infosymbol, Datum, Indikator 7 | Uhrzeit mit Infosymbol |
| | Datum |
| | Indikatoren 5 bis 8 |
| Werte unten 1 bis 5 | Werte unten 1 bis 4 |
| zwei Statusbalken | zwei Statusbalken |

Die Reihenfolge der Items im Bereich **Indikatoren** bestimmt den Platz. Auf `eu` und `us-l` sind die Plätze 6 und 7 die
Felder links und rechts neben der Uhr.

### Indikatoren

- Ein Indikator zeigt nur sein Symbol, ohne Text und Wert. Die ganze Kachel ist die Tippfläche.
- Abschnitt 8 gilt unverändert: Aktion beim Drücken, Option **Indikatoren wirken als Tasten**, die States
  `panels.<Panel>.buttons.indicator-N`.
- Prüfe, ob die Aktion **Werte zum Umschalten** schon im Code ist (`kind: 'cycle'` in `ScreensaverItemAction`,
  `src/lib/const/screensaver-cycle.ts`). Falls ja, ergänze sie in der Aktionstabelle von Abschnitt 8 und in dessen
  Text zur Rahmenfarbe (orange). Sie gilt für alle Versionen mit Indikatoren. Jeder Druck schreibt den nächsten Wert der
  Liste, nach dem letzten kommt wieder der erste. Die Reihenfolge zählt und ist verschiebbar, ein einzelner Wert ist
  erlaubt. Beschreibe, was passiert, wenn der aktuelle Wert nicht in der Liste steht, und wie der Text je nach Typ des
  Datenpunkts zum Wert wird.

Beispiel für den Text: Ein Zahlen-Datenpunkt `0_userdata.0.scene` als Indikator mit einer Icon-Liste (ein Symbol je Wert).
Die Aktion **Werte zum Umschalten** mit `-1`, `0`, `1` schaltet die Szenen der Reihe nach durch, das Symbol folgt dem Wert.
Nimm das Beispiel nur auf, wenn die Aktion im Code vorhanden ist.

### Werte unten

Name, Symbol und Wert wie in den anderen Versionen. Eine Benachrichtigung (`notify`) überdeckt diese Zeile.

### Statussymbole

`mrIcon1` und `mrIcon2` erscheinen hier nicht als Symbole, sondern als zwei Farbbalken am unteren Rand. Sichtbar ist nur die
Farbe (**Farbe an** / **Farbe aus**). Symbol, Wert und Einheit zeigt das Panel in diesem Modus nicht. Ein Statussymbol ohne
Datenpunkt ergibt laut HMI-Doku einen schwarzen Balken, prüfe das im Code.

### Uhrzeit

Größere Uhr als in den anderen Versionen. Das Infosymbol steht links neben der Uhrzeit. Der Timer auf der Uhrzeit
(Abschnitt 10) funktioniert auch hier, prüfe das in `src/lib/pages/screensaver.ts`.

### Rollladen

Ein Rollladen kann als Indikator und unten verwendet werden, unter anderem hier. Ohne eigenes Symbol folgt das Symbol der
Position (5 Symbole von zu bis offen), unten steht die Position in %. Ein Tipp öffnet kein Popup und bewegt den Rollladen
nie, auf einem Indikator läuft nur die gewählte Aktion. Die Texte stehen in `screensaver_item_blindPosition` und
`screensaver_item_blindPositionIcons`.

### Versionswechsel und Grenzen

- Items in Bereichen, die Kacheln nicht hat (Favorit, Alternate, Links), bleiben beim Wechsel erhalten und werden gemeldet
  (Abschnitt 3). Das betrifft Standard, Alternate und Advanced.
- Bei einer Adapterversion, die den Modus nicht kennt (Downgrade), läuft der Screensaver als Standard. Das Log nennt das, die
  gespeicherte Konfiguration bleibt unverändert, und nach einem Upgrade gilt der Modus wieder.
- Der Modus lässt sich auch im Betrieb umschalten: Der Datenpunkt der Screensaver-Layouts bietet `tiles` an
  (`src/lib/templates/system-templates.ts`, Liste `standard?alternate?advanced?easyview?tiles`). Ermittle den genauen
  Datenpunkt und prüfe, ob er in `doc/de/ALIAS.md` oder der Screensaver-Seite schon beschrieben ist, und ergänze dort nur,
  was fehlt.
- Das Web-Panel zeichnet den Modus ebenfalls. Prüfe in `src-web` und `doc/web-panel/PLAN.md`, ob das auch für das Hochformat
  gilt, und nimm in `doc/de/WebPanel.md` nur auf, was du belegen kannst. Dort nur ergänzen, wenn die Seite Screensaver-Modi
  überhaupt aufzählt.
