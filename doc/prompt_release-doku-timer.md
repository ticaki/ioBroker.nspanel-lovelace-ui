# Prompt: Doku-Ergänzung Timer und Screensaver-Templates

Diese Datei ist ein fertiger Prompt für Claude. Er wird bei der Release ausgeführt und ergänzt die
Nutzerdoku um die Timer-Funktionen und die Template-Auswahl. Kompletten Text unterhalb der Linie an Claude geben,
im Repository dieses Adapters mit dem Stand, der veröffentlicht wird.

---

Du pflegst die Nutzerdokumentation des ioBroker-Adapters `nspanel-lovelace-ui` unter `doc/de` und `doc/en`.
Daraus baut `script/build-doc-page.ts` die GitHub-Pages-Seite. Arbeite die unten beschriebenen Funktionen in die
Doku ein. Nutzer sollen sie ohne Blick in den Code einrichten können.

## So gehst du vor

1. **Aufbau lesen.** Lies `doc/de/_Sidebar.md`, `doc/en/_Sidebar.md`, `doc/de/screensaver.md`, `doc/de/pagePopup.md`,
   `doc/de/PageConfig-Dialoge.md`, `doc/de/ALIAS.md`, `doc/de/User-NSPanel-Funktionalität.md` und `doc/de/Pages.md`
   vollständig. Schau dir an, wie Seiten gegliedert sind und wo Dialoge beschrieben stehen.
2. **Ablage entscheiden.** Ergänze vorhandene Seiten, wenn das Thema dort hingehört. Lege eine neue Seite nur an, wenn
   sie sonst keinen sinnvollen Platz hat, und trage sie dann in beide `_Sidebar.md` ein. Vorschlag, nicht Vorgabe:
   Timer auf der Uhrzeit in `screensaver.md` (Abschnitt Uhrzeit und Datum), Templates dort im Abschnitt zu Templates,
   `popupTimer` als eigene Seite oder Abschnitt, verlinkt aus `pagePopup.md` und `PageConfig-Dialoge.md`,
   Datenpunkte in `ALIAS.md`.
3. **Am Code prüfen.** Die Angaben unten beschreiben den getesteten Stand. Prüfe sie gegen den Code, bevor du sie
   übernimmst, vor allem nach späteren Änderungen. Stimmen Prompt und Code nicht überein, gilt der Code, und du
   nennst die Abweichung am Ende. Dialogtexte entnimmst du `admin/i18n/de/translations.json` und
   `admin/i18n/en/translations.json`, damit sie wörtlich stimmen.
   Wichtige Stellen: `src/lib/pages/pageItem.ts`, `src/lib/pages/screensaver.ts`, `src/lib/pages/screensaver-timer.ts`,
   `src/lib/types/adminShareConfig.ts`, `src-admin/src/components/ScreensaverEditor.tsx`,
   `src-admin/src/components/ChannelConfigDialog.tsx`, `src-admin/src/components/TemplateSelector.tsx`.
4. **Schreiben.** Stil der bestehenden Seiten: sachlich, kurze Absätze, Tabellen für Felder, Backticks für Datenpunkte
   und IDs, kein Marketing. Deutsch und Englisch gleichwertig, gleiche Gliederung. Beschreibe, was der Nutzer tut und
   was dann passiert. Interne Begriffe aus dem Code und die interne Item-ID gehören nicht in die Admin-Anleitung.
5. **Bilder.** Du kannst keine Screenshots vom Admin oder Panel erstellen. Erfinde keine Bildpfade. Nenne am Ende die
   Stellen, an denen ein Bild fehlt, mit Vorschlag für den Inhalt.
6. **Prüfen.** Führe `npx tsx script/build-doc-page.ts _site --strict` aus. Tote Links und Anker müssen behoben sein.
   Lösche danach `_site`, falls es nicht ignoriert wird, und ändere außerhalb von `doc/de` und `doc/en` nichts.
7. **Abschluss.** Nicht committen. Nenne die geänderten Dateien, die Bildstellen und jede Abweichung zwischen Prompt und
   Code. Was du nicht prüfen konntest, nennst du ausdrücklich.

## 1. Timer auf der Uhrzeit des Screensavers

**Weg:** Tab `Screensaver` → Screensaver wählen → Klick auf die Uhrzeit → **Timer anzeigen**. Gilt für alle
Screensaver-Modi.

**Quelle des Timers:** **Datenpunkte oder Slot-Muster** oder **Pageitem mit Timer-Popup**.

### Datenpunkte

Immer zwei: **An/Aus-Datenpunkt** und **Daten-Datenpunkt**. Nur solange An/Aus wahr ist, gibt es einen Timer. Ist er
falsch, gilt der Timer als erledigt, egal was in den Daten steht, und es gibt keinen Alarm.

| Daten-Wert | Bedeutung |
|---|---|
| Zahl ab `1e11` | Endzeit in Unix-Millisekunden (`targetTs`) |
| Zahl ab `1e9` | Endzeit in Unix-Sekunden |
| kleinere Zahl über 0 | verbleibende Sekunden eines herunterzählenden States, bei `common.unit` = `ms` Millisekunden |
| Text | ISO-Datum oder `HH:MM`, liegt die Zeit in der Vergangenheit, gilt der nächste Tag |
| leer, anderer Text | kein Timer |

**Wert 0 bei wahrem An/Aus:** Ein seit dem Adapterstart gelaufener Timer bleibt abgelaufen. Mit `common.unit` `s`,
`sec` oder `ms` oder der Rolle `value.timer` oder `level.timer` heißt 0 abgelaufen, auch direkt nach einem Adapterstart.
Sonst heißt 0 „noch kein Timer“, und es bleibt bei der Uhrzeit.

### Slots

Spezialfall unter **Erweitert** für Timer mit festem Pfad und wechselnder Belegung. Zwei Muster mit genau einem `*` und
einem Pfad davor, sie ersetzen die beiden Datenpunkte:

```text
javascript.0.timer.global.*.aktiv
javascript.0.timer.global.*.targetTs
```

An/Aus und Daten gehören zusammen, wenn der `*`-Teil gleich ist. Angezeigt wird ein abgelaufener aktiver Slot, sonst der
laufende Slot mit der kürzesten Restzeit. Später entstehende Slots werden erkannt.

### Pageitem als Quelle

Auswählbar sind Items mit Timer-Popup, die einen Countdown zeigen: interne Timer und externe Timer mit `STATUS`, auf den
Seiten der Panels dieses Screensavers. Nicht auswählbar sind Wecker, reine Anzeigen und Items mit **Timer aus dem
Screensaver verwenden**. Das Item arbeitet auch, wenn seine Seite nie geöffnet wurde.

- Einträge erscheinen als `Seite - Itemname`, bei gleichen Namen mit Position.
- Ältere Items werden erst auswählbar, nachdem eine Seite geändert und gespeichert wurde. Der Dialog weist darauf hin.
- Der Bezug bleibt beim Umsortieren und Umbenennen. Items lassen sich nicht zwischen Seiten verschieben, nur kopieren,
  die Kopie ist ein neues Item. Wird das Item gelöscht, zeigt das Panel die Uhrzeit, das Log warnt einmal, und der
  Dialog meldet den verlorenen Bezug.

**Kein Kreis:** Ein Screensaver kann nicht ein Item als Quelle nutzen, das selbst den Timer dieses Screensavers nutzt.
Der Dialog verhindert das, und zur Laufzeit gilt: Uhrzeit, eine Warnung im Log, und das Item hat keine Tasten. Erlaubt
ist Item A nutzt den Screensaver, und der Screensaver nutzt ein anderes Item B.

### Anzeige am Panel

Die Restzeit steht in Minuten, damit sie sich nicht mit der Uhrzeit verwechseln lässt:

| Restzeit | Anzeige |
|---|---|
| unter 1000 Minuten | eine Nachkommastelle, immer Punkt, aufgerundet auf 6 s: 90 s → `1.5`, 7 s → `0.2`, letzte 6 s → `0.1`, 125 min 30 s → `125.5` |
| ab 1000 Minuten | aufgerundete ganze Minuten, `1234`, höchstens `9999` |
| abgelaufen | `0.0` |

| Zustand | Zeit | Infoicon |
|---|---|---|
| läuft | Orange | `timer-sand` in Orange |
| pausiert (nur Pageitem-Quelle) | stehende Zeit in Orange | `timer-pause` |
| abgelaufen | `0.0` in Rot | `timer-alert` in Rot |
| weggetippt | normale Uhrzeit und Farbe | bleibt |

- Das Infoicon hat Vorrang vor dem eigenen Infoicon und den Update-Symbolen.
- Es gibt keine AM/PM-Angabe, auch nicht im 12-Stunden-Format.
- Die Seite `screensaver2` (Advanced) kennt den `color`-Befehl nicht, Zeit und Infoicon behalten dort ihre Farbe.
- Der Punkt braucht auf dem Modus Tiles (`screensaver5`) die aktuelle TFT, Version im Code und in `json/version.json`
  prüfen und nennen.

**Abgelaufen:** bleibt, bis An/Aus falsch wird. Ein Datenwechsel beendet den Alarm nicht, außer die neuen Daten liegen in
der Zukunft.

**Tippen:** Der erste Tipp auf einen angezeigten Timer schaltet auf die normale Uhrzeit, auch ohne Doppelklick und vor
dem Wegtippen einer Benachrichtigung. Er löst weder Geste noch Seitenwechsel aus. Das HMI zählt die Tipps weiter, bis das
Display abdunkelt: Bei aktivem Doppelklick führt deshalb der nächste Tipp zur Hauptseite, sobald er mehr als eine Sekunde
später kommt. Der Timer erscheint wieder beim nächsten Start des Screensavers und bei einem neuen Timer.

## 2. Timer-Popup (`popupTimer`)

Ein Item mit Channel-Rolle `level.timer` zeigt in der Liste Name und Zeit und öffnet beim Antippen das Popup. Der Name
kommt aus dem Item, sonst aus dem Channel, zuletzt steht dort „Timer“. Auch der interne Timer braucht einen Channel dieser
Rolle.

| Betriebsart | Erkennung | Wer zählt |
|---|---|---|
| Intern | kein `ACTUAL` | Adapter |
| Extern | `ACTUAL` mit Rolle `value.timer` oder `level.timer`, oder Einheit `s`, `sec`, `ms` | externes Skript |
| Wecker | `ACTUAL` mit Rolle `date`, oder sonstige Rolle ohne Zeiteinheit | niemand, feste Uhrzeit |
| Zeitanzeige | nichts beschreibbar und kein `STATUS` | nur Anzeige |
| Vom Screensaver | Checkbox **Timer aus dem Screensaver verwenden** | wie Screensaver |

Ein Channel nur mit `SET` ist ein interner Timer, außer `SET` hat die Rolle `date`, dann ist es ein Wecker.

### Datenpunkte

| Datenpunkt | Bedeutung |
|---|---|
| `ACTUAL` | Hauptwert, wird angezeigt. Extern Sekunden, bei `common.unit` = `ms` Millisekunden. Wecker Unix-ms einer Uhrzeit, angezeigt als lokale `HH:MM` |
| `SET` | Ziel für Änderungen, gleiche Einheit. Ohne `SET` wird in `ACTUAL` geschrieben, falls beschreibbar. Wecker: nächster Zeitpunkt dieser Uhrzeit als Unix-ms |
| `STATUS` | 0 aus, 1 Pause, 2 läuft. Nötig für Start, Pause und An/Aus bei extern und Wecker |
| `STATE` | wird `true` bei internem Ablauf und bei Fertig, nie bei Abbrechen oder Löschen |

### Interner Timer von außen

| Schreiben | Wirkung |
|---|---|
| `SET` > 0, Timer steht oder pausiert | stellt die Zeit, kein Start |
| `SET` > 0, Timer läuft | neue Restzeit, läuft weiter |
| `SET` = 0 | wie Abbrechen |
| `STATUS` = 2 | Start oder Weiter, bei Zähler 0 aus `SET` |
| `STATUS` = 1 | Pause, falls er läuft |
| `STATUS` = 0 | Abbrechen, kein `STATE` |

Der Adapter spiegelt seine Zustandswechsel in `STATUS`. Beim Ablauf bleibt `STATUS` auf 2, bis **Fertig** gedrückt wird.
Die Restzeit eines internen Timers ist von außen nicht lesbar. Nach einem Adapter-Neustart ist ein interner Timer weg.

### Tasten

| Betriebsart und Zustand | Tasten | Bearbeitbar |
|---|---|---|
| Intern, keine Zeit | Start | ja |
| Intern, Zeit gesetzt, nicht gestartet | Start, Abbrechen | ja |
| Intern, läuft | Pause, Abbrechen, Fertig | nein |
| Intern, pausiert | Weiter, Abbrechen (nach Bearbeiten: Start) | ja |
| Intern, abgelaufen | Fertig, Anzeige `00:00` | nein |
| Extern, `STATUS` 0 | Start, Löschen | wenn beschreibbar |
| Extern, `STATUS` 1 | Weiter, Löschen | wenn beschreibbar |
| Extern, `STATUS` 2, Rest > 0 | Pause, Abbrechen, Fertig | nein |
| Extern, `STATUS` 2, Rest 0 | Fertig, Anzeige `00:00` | nein |
| Extern ohne `STATUS` | Löschen, falls beschreibbar | wenn beschreibbar |
| Wecker, aus | An (schreibt 2) | wenn beschreibbar |
| Wecker, an | Aus (schreibt 1) | nein |
| Wecker ohne `STATUS` | keine | wenn beschreibbar |
| Vom Screensaver, kein Timer | Start | wenn ein freier Slot beschreibbar ist |
| Vom Screensaver, läuft oder pausiert | Abbrechen | nein |
| Vom Screensaver, abgelaufen | Fertig | nein |
| Vom Screensaver, nicht beschreibbar | keine | nein |

Das Schließen des Bearbeitens startet nichts. Bei extern und Wecker wird die Zeit sofort geschrieben, bei intern und
Vom Screensaver erst gemerkt.

### Vom Screensaver

Checkbox im Item-Dialog, nur bei Rolle `level.timer`. Item und Popup zeigen denselben Timer wie der Screensaver dieses
Panels, auch wenn er dort weggetippt ist, bei Slots den dort gewählten. Die Datenpunkte des Channels werden nicht
verwendet. Die Checkbox ist gesperrt, wenn dieser Screensaver genau dieses Item als Quelle nutzt.

**Start** schreibt zuerst die Daten, dann An/Aus. Der Datenwert richtet sich nach dem State: Restzeit bei Einheit `s`,
`sec`, `ms` oder Rolle `value.timer`, `level.timer`, ISO-Datum bei `common.type` `string`, sonst Endzeit in Unix-ms. Bei
Slots nimmt Start den niedrigsten Slot mit An/Aus ungleich wahr, gibt es keinen, ist kein Start möglich. Abbrechen und
Fertig setzen An/Aus des angezeigten Slots auf falsch. Pause gibt es hier nicht. Ohne vollständigen Screensaver-Timer warnt
das Log einmal, und das Item hat keine Tasten.

### Anzeige und Grenzen

- Liste `HH:MM:SS`, Wecker `HH:MM`. Popup Minuten:Sekunden, höchstens `99:59`, Wecker Stunde:Minute.
- Die Eingabe ist auf `59:59` begrenzt.
- Die Liste zählt bei laufendem Timer in 2-Sekunden-Schritten, das offene Popup jede Sekunde. Das ist Absicht, sonst
  staut sich die Kommunikation zum Panel.
- Das Popup bleibt bei laufendem Timer offen, und das Panel dunkelt nicht ab, weil die Updates den Schlaf-Zähler
  zurücksetzen. Das ist gewollt.
- Von außen geschriebene Werte wirken nur, wenn sie bestätigt sind (`ack`) oder aus `0_userdata` oder `alias` stammen.

### Skriptkonfiguration

`useScreensaverTimer?: boolean` nutzt den Timer des Screensavers. `itemId?: string` wird nur gebraucht, wenn ein
Screensaver das Item als Quelle nutzt, und muss je Instanz eindeutig sein. Der Screensaver-Timer selbst wird nur im Admin
eingestellt. Im Admin vergibt der Adapter die ID selbst, sie wird dort nicht gezeigt, also dort nicht erklären.

## 3. Templates auf Screensaver-Plätzen

Im Item-Dialog des Screensavers mit der Quelle **Template**:

- Die Liste bietet je Platz nur passende Templates an.
- Liegen die Daten unter einer Adapter-Instanz, zum Beispiel `text.battery.bydhvs` unter `bydhvs.0`, schlägt der Dialog die
  Instanzen vor. So eine Instanz existiert oft nicht als eigenes Objekt, das Feld ist trotzdem richtig ausgefüllt.
- Templates mit Optionen zeigen eigene Felder, zum Beispiel **SOC-Untergrenze** und **SOC-Obergrenze** bei
  `text.battery.bydhvs`. Negatives `Power` bedeutet dort Laden.
- Auf einem Indikator-Platz macht **Aktion beim Drücken** das Icon zur Taste, zum Beispiel mit **Seite öffnen** zur
  Power-Seite. Die Aktion wirkt nur mit der Option **Indikatoren wirken als Tasten**.
- Im Editor heißt so ein Eintrag nach dem Template, zum Beispiel `battery bydhvs`.

Skript-Beispiel:

```typescript
{
    type: 'template',
    template: 'text.battery.bydhvs',
    dpInit: 'bydhvs.0',
    readOptions: { min: 5 },
    modeScr: 'indicator',
    ScreensaverEntityNaviToPage: 'cardPower_Haus',
},
```

Gehört das Skript-Beispiel nach dem Doku-Umbau nicht mehr auf die Admin-Seite, ordne es dort ein, wo Skriptkonfiguration
heute beschrieben ist, oder lass es weg und nenne das am Ende.

## 4. Screensaver sofort anzeigen

Der Screensaver lässt sich jetzt ohne Ablauf des Timeouts aufrufen, mit demselben Verhalten wie bei dessen Ablauf.

- **Pageitem:** Im Item-Dialog steht in der Auswahl der Zielseite (auch beim langen Druck) der Eintrag **Screensaver**.
- **Navigation einer Seite:** prev, next, parent und home bieten ebenfalls **Screensaver** an. Der Pfeil auf dem Panel
  zeigt dafür das Icon `power-sleep`. Im Navigation Flow erscheint ein eigener Knoten, sobald etwas dorthin führt.
- **Datenpunkt:** `panels.<Panel>.cmd.screenSaver.activate` (Rolle `button`) auf `true` setzen.
- **Skript:** `targetPage`, `prev`, `next`, `parent` und `home` mit dem Wert `///screensaver`.

Grenzen: Als Start- oder Hauptseite gibt es das Ziel nicht. Auf dem Screensaver selbst wird es nicht angeboten.

**Doppeltipp auf einen Navigationspfeil:** Ein zweiter schneller Tipp kann ankommen, bevor die neue Seite fertig gezeichnet
ist, und wirkt dann auf das Symbol an derselben Stelle der neuen Seite. Führt dieses Symbol zum Screensaver, wirkt es, als
hätte er sich von selbst aktiviert. Beobachtet auf ns_panel4 mit 0,26 s zwischen zwei Tipps. Prüfe im Code, ob
`src/lib/controller/panel.ts` oder `src/lib/classes/navigation.ts` solche Tipps inzwischen abfängt. Falls ja, lass den
Hinweis weg. Falls nein, nenne ihn als kurzen Hinweis bei der Navigation zum Screensaver.

## 5. Allgemein

Zwischen zwei Updates einer Seite liegt jetzt mindestens 1 s. Die erste Änderung geht sofort raus, nur Folgeänderungen
warten. Das braucht nur erwähnt zu werden, falls die Doku heute Reaktionszeiten nennt.
