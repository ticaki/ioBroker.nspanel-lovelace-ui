# Prompt: Admin und Doku verlinken (Hilfe-Icons „?“)

Diese Datei ist ein Prompt für Claude. Sie beschreibt, wie der Admin (`src-admin/src`) mit der Nutzerdoku
(`doc/de`, `doc/en`) verlinkt ist. Lies sie vollständig, bevor du im Admin Felder, Dialoge oder Editoren
anlegst oder änderst, und bevor du Überschriften in der Doku umbenennst, verschiebst oder einfügst.
Beide Seiten hängen über die Überschriften zusammen, und ein Test schlägt fehl, sobald sie auseinanderlaufen.
Abschnitt 7 fasst die Regeln für die Nutzerdoku selbst zusammen (Aufbau, Überschriften, Links, Bilder, Quellen),
damit Maintainer und Doku-Pflege mit derselben Struktur arbeiten.

---

## 1. Worum es geht

Viele Einstellungen im Admin haben ein kleines, blasses **?**. Ein Tooltip zeigt den Titel des Doku-Abschnitts,
ein Klick öffnet die Doku in einem neuen Tab direkt an diesem Abschnitt. Editoren und Dialoge mit eigener,
ausführlicher Doku-Seite haben zusätzlich einen sichtbaren **Doku-Button**. Im Seiten-Editor (Tab PageConfig)
zeigt jeder Editor oben rechts im grauen Kasten „Eindeutige ID“ ein **Typ-Icon** der Karte und daneben das ? zur
Doku-Seite dieses Kartentyps. Die Seitenliste links zeigt dasselbe Typ-Icon vor jedem Eintrag, aber ohne ?.

Die Doku wird von `script/build-doc-page.ts` zur GitHub-Pages-Seite gebaut:
`https://ticaki.github.io/ioBroker.nspanel-lovelace-ui/<de|en>/<Seite>.html#<anker>`.

**Sprache:** Sie folgt der ioBroker-Systemsprache (`systemConfig.language`). Bei `de` zeigt der Link auf die
deutsche Doku, bei jeder anderen Sprache auf die englische. Die Admin-Sprache und die Browsersprache spielen
dafür keine Rolle.

## 2. Bausteine

| Datei | Aufgabe |
|---|---|
| `src-admin/src/components/DocHelp.tsx` | `DocHelp` (das ?, `size="tiny"` für die Kachel-Ecke), `DocButton` (Button für die ganze Seite), `DocTooltip` (Hilfe-Link im Tooltip eines Knopfes/Feldes in Kacheln, für Elemente mit eigenem Abschnitt), `DocPageThemeContext` (Seiten-Theme für Tooltips in Kacheln mit eigenem `ThemeProvider`), `withDocLanguage` (gibt die Systemsprache weiter) |
| `src-admin/src/docTopics/types.ts` | Typ `DocTopic = { page, de?, en? }` |
| `src-admin/src/docTopics/<bereich>.ts` | die Topics eines Admin-Bereichs: `screensaver`, `pages1`, `pages2`, `pageitems`, `dialogs`, `navigation`, `maintain` |
| `src-admin/src/docTopics/index.ts` | führt alle Bereiche zusammen (`DOC_TOPICS`, `DocTopicKey`), `docTopicUrl`, `cardDocTopic(card)` und `CARD_DOC_PAGES` für die Karten-Seiten |
| `src-admin/src/docTopics/pages1.ts` | zusätzlich `pageTypeDocTopic` für die Seitentyp-Auswahl |
| `src-admin/src/docLink.ts` | `DOC_BASE`, Sprachwahl (`setDocSystemLanguage`, `resolveDocLanguage`), `docPageUrl` |
| `src-admin/src/docAnchors.ts` | `slug()`: Überschrift → Anker. Dieselbe Logik nutzt `script/build-doc-page.ts`; deshalb steht die Datei auch im `paths`-Filter von `.github/workflows/pages.yml` |
| `src-admin/src/docTopics.test.ts` | prüft jedes Topic gegen `doc/de` und `doc/en` |
| `src-admin/src/components/CardTypeBadge.tsx` | `CardTypeBadge` (Typ-Icon + ? im ID-Kasten der Editoren), `CardTypeIcon` (Typ-Icon der Seitenliste), Zuordnung Kartentyp → MUI-Icon |
| `src-admin/src/Components.tsx` | jede Custom-Component ist in `withDocLanguage(...)` gehüllt |
| `admin/i18n/<sprache>/translations.json` | `docHelpTooltip` (Präfix des Tooltips), `docHelpOpenPage` (Text des Doku-Buttons), `page_type`, `page_type_*` (Typnamen) |

**Ein Topic:**

```ts
// src-admin/src/docTopics/screensaver.ts
'screensaver.itemColor': { page: 'screensaver', de: 'Farbe', en: 'Color' },
'screensaver.page': { page: 'screensaver' }, // ohne de/en: die ganze Seite
```

- `page` ist der Dateiname in `doc/de` und `doc/en` ohne `.md`.
- `de` und `en` sind die Überschriften **genau so, wie sie in der jeweiligen md-Datei stehen**: ohne die
  führenden `#` und ohne Markdown-Zeichen wie `*` oder Backticks. Entweder beide angeben oder keine.
- Aus der Überschrift entsteht per `slug()` der Anker. Die Überschrift ist also die Verbindung zwischen Admin
  und Doku, nicht ein frei gewählter Anker.
- Der Key beginnt mit dem Bereich (`screensaver.`, `pages1.` …), der Test prüft das.

**Im Admin:**

```tsx
import { DocButton, DocHelp, DocTooltip } from './DocHelp'; // aus src-admin/src/components
<Typography>{this.getText('screensaver_item_color')}<DocHelp topic="screensaver.itemColor" /></Typography>
<DocButton topic="screensaver.page" />
<DocHelp topic={cardDocTopic(entry.card)} /> // ein Topic-Objekt geht auch
// in einer Kachel: Link im Tooltip, beim grauen Knopf zusätzlich „Wenn ein Knopf grau bleibt“
<DocTooltip topic={disabled ? ['maintain.tftUpdate', 'maintain.greyButton'] : 'maintain.tftUpdate'} sx={{ flex: '0 0 auto' }}>
    <Button disabled={disabled}>…</Button>
</DocTooltip>
```

`DocHelp` und der Link in `DocTooltip` stoppen die Weitergabe des Klicks. Ein ? in einem Checkbox-Label, einem Akkordeon-Kopf oder einem
Menüeintrag schaltet deshalb nichts mit um.

## 3. Regeln für neue Links

1. **Nur dort, wo die Doku einen passenden Abschnitt hat.** Die Überschrift muss genau diese Einstellung
   erklären. Ein Unterabschnitt ist besser als ein Link auf die ganze Seite.
2. **Ruhig bleiben, aber reichlich:** Mehr als 5 ? pro Ansicht sind erlaubt. Kein ? in Zeilen, die sich
   wiederholen, also nicht in Listen, Tabellenzeilen, je Slot oder je Knoten im Navigationsgraphen. Hat die
   Liste eine eigene Überschrift, darf dort **ein** ? stehen, das genau diese Überschrift erklärt – kein
   Sammelplatz für die Hilfe der Listeneinträge.
   **Kacheln** (Panel-Kacheln in Maintain, Panelinfo, Panel-Übersicht): **Ein kleines ? pro Kachel in der oberen rechten
   Ecke** (`<DocHelp size="tiny" sx={{ position: 'absolute', top: '1px', right: '2px', m: 0 }} />`, Kachel mit
   `position: 'relative'`): Es sitzt im Innenabstand über den Symbolen der Kopfzeile, schiebt nichts nach unten
   und vergrößert die Kachel nicht. Ziel ist der allgemeine Kachel-Abschnitt der Ansicht (Übersicht
   „4. Die Panelkachel“, Maintain „2. Die Karte eines Panels“, Panelinfo „Was die Kachel zeigt“). Das ist
   ausdrücklich erlaubt. Elemente der Kachel, die **einen eigenen, abweichenden Abschnitt** haben (Updates,
   Versionsfelder, Übernahme, Export/Import, kein Skript, HW-Buttons, Temperaturoffset …), bekommen die Hilfe
   per `DocTooltip` in den Tooltip des Knopfes oder Feldes. **Nie derselbe Link mehrfach in einer Kachel:**
   Ein Element, das nur der allgemeine Kachel-Abschnitt erklärt, bekommt kein `DocTooltip`; sein eigener
   `title` bleibt, und in einem Tooltip mit mehreren Links fehlt der allgemeine.
   `DocTooltip`: ein optionaler Hinweistext (z. B. warum ein Knopf grau ist) und darunter je Topic ein Link
   „Hilfe: <Überschrift>“ mit kleinem Pfeil. Der Tooltip ist interaktiv (die Maus darf hinein), ein deaktivierter
   Knopf zeigt ihn dank des `span`-Wrappers trotzdem. Graue Knöpfe dürfen zusätzlich auf den Abschnitt „Wenn ein
   Knopf grau bleibt“ zeigen (`topic` als Liste). Auf Touch-Geräten öffnet ein **langer Druck** den Tooltip mit
   dem Link; `leaveTouchDelay={3000}` lässt danach 3 s Zeit zum Tippen. Kein eigenes Kontextmenü bauen. Ein
   vorhandenes `title` oder ein eigener Tooltip am Element wandert als `hint` in den `DocTooltip`, damit es nicht
   doppelt aufgeht.
   Der Tooltip von `DocTooltip` hat **Popover-Stil** (`background.paper`, `text.primary`, 2px Rand in
   `primary.main`, Schatten), nicht den grauen MUI-Tooltip: Auf dem grauen Tooltip hat die Linkfarbe des Themas
   keinen Kontrast (`primary.main` 1.6–3.6:1). Auf paper hat der Link die normale Linkfarbe (`primary.main`) und
   sieht aus wie jeder Link im Admin; im dunklen Thema ist paper dunkel. Der Link ist immer unterstrichen – er
   ist das einzige Klickziel im Tooltip. Keine feste Farbe setzen.
   **Immer in den Farben der Seite, nicht der Kachel:** Setzt eine Ansicht um ihre Kacheln einen eigenen
   `ThemeProvider` (Signalfarben in Maintain und Panelinfo, `getLightSurfaceTheme`), muss sie die Kacheln in
   `<DocPageThemeContext.Provider value={this.props.theme}>` hüllen. `DocTooltip` zeichnet den Inhalt dann mit
   dem Seiten-Theme; sonst bekäme er z. B. hellorange Fläche mit der Linkfarbe des dunklen Themas.
   Beispiel Panel-Übersicht: Das `?` neben „Web-Panel hinzufügen“ ist entfallen; der Knopf trägt `DocTooltip`,
   sein Flex-Verhalten (`flex: '1 1 0'`) liegt am Wrapper (`sx`), der Knopf selbst ist `fullWidth`.
   **Nie mehrere ? nebeneinander oder gesammelt in einer Ecke.** Jedes ? steht direkt an dem Element, das es
   erklärt (Überschrift, Label, Feld). Braucht ein Element mehrere Abschnitte, bekommt es ein `DocTooltip` mit
   mehreren Links statt mehrerer ?. (Anlass: Die Zeile mit drei ? über der Panel-Übersicht wirkte „wie in die
   Ecke gefegt, zusammenhanglos“ und ist entfallen.)
3. **Platzierung:** Inline neben eine Überschrift, einen Dialogtitel, ein Label oder ein Feld. Nie in das
   Label-Element eines TextField, das zerschneidet das Label. Kein Layout verschieben und keinen Umbruch erzeugen.
4. **Farbe aus dem Thema:** Keine feste Farbe setzen. DocHelp nutzt Theme-Farben mit Opacity 0.55, beim Hover 1.
   Das ist in allen Admin-Themen geprüft (light, dark, blue, colored, modernLight, modernDark).
5. **Neue Custom-Component in `Components.tsx`:** Sie mit `withDocLanguage(...)` umhüllen, sonst kennt sie
   die Systemsprache nicht.
6. **Neuer Kartentyp:** Ein Icon und ein Key `page_type_*` in `CardTypeBadge.tsx` eintragen (alle 11 Sprachen),
   die Seite in `CARD_DOC_PAGES` aufnehmen und `doc/de/<typ>.md` und `doc/en/<typ>.md` anlegen.
7. **DocHelp braucht keine neuen Übersetzungen.** Der Tooltip ist „<docHelpTooltip>: <Überschrift>“, die
   Überschrift kommt aus der Doku.
8. Es gelten die Admin-Regeln aus `CLAUDE.md`: class-based, explizite Rückgabetypen, keine `as`-Casts und kein
   `any`, MUI-`slotProps`.

## 4. Regeln für Änderungen an der Doku

- **Überschrift umbenannt:** Den Text im Topic (`de` bzw. `en`) mit ändern, sonst schlägt der Test fehl. Mit
  `grep -rn "<alte Überschrift>" src-admin/src/docTopics` findest du alle betroffenen Topics.
- **Überschrift eingefügt:** Doppelte Überschriften bekommen im Build `-1`, `-2` angehängt. Eine neue Überschrift
  kann diese Nummern verschieben. Doku-interne Links und Inhaltsverzeichnisse („Inhalt:“-Listen) prüfen.
- **Eine Admin-Einstellung ist nur als fetter Absatz oder Tabellenzeile beschrieben:** Für einen genauen Link
  eine Unterüberschrift (eine Ebene unter dem umgebenden Abschnitt) direkt vor dem Absatz einfügen, in `de`
  **und** `en` mit gleicher Gliederung. Den Text nicht umschreiben. Ein fettes Einleitungswort, das nur die
  Überschrift wiederholt, darf entfallen, wenn der Satz danach noch stimmt. Keine Überschriften-Flut: nur dort,
  wo ein Link sie braucht. Folgen auf den Absatz allgemeine Absätze, die dann unter die neue Überschrift
  rutschen würden, lieber auf den Oberabschnitt verlinken.
  Bewusst so belassen: „Werte zum Umschalten“ in `screensaver.md` verlinkt auf „8. Indikatoren und Tasten“.
- **Seite umbenannt oder gelöscht:** `page` in allen Topics anpassen und Links in `admin/jsonConfig.json5`
  prüfen (siehe Abschnitt 5).

## 5. Was der Test nicht abdeckt

- **`admin/jsonConfig.json5`** hat einige `staticLink`-Buttons (Farbthemen, Tasmota-Tools, Web-Panels) mit
  `href: ".../${_system.language === 'de' ? 'de' : 'en'}/<Seite>.html"`. Diese Links prüft kein Test. Wird eine
  dieser Seiten umbenannt, die Links von Hand anpassen.
- **Der optische Eindruck:** Ob ein ? sinnvoll sitzt und nichts überdeckt, zeigt nur ein Blick in den Admin
  (Dev-Server + Puppeteer, siehe unten).

## 6. Prüfen

```bash
cd src-admin && npx tsc --noEmit -p . && cd ..
npm run lint:admin
npx mocha --config test/mocharc.custom.json src-admin/src/docTopics.test.ts   # jedes Topic gegen die Doku
npx tsx script/build-doc-page.ts /tmp/claude-1000/docchk --strict             # tote Links/Anker in der Doku; danach löschen
npm run check && npm run test:ts
```

Ansehen im Admin:
- `npm run build:admin` **nur bei gestopptem Dev-Server**. `vite build` und `copy:custom` reißen einen
  laufenden Dev-Server mit.
- Danach `npm run dev -- -n`; das `--` ist Pflicht.
- Puppeteer: Admin unter `http://localhost:8081/`, das Thema per localStorage `App.themeName`. Die Hilfe-Links
  findest du mit dem Selektor `a[href^="https://ticaki.github.io/ioBroker.nspanel-lovelace-ui/"]`.

Bilder der Hilfe-Icons in allen Themen, eine kurze Nutzeranleitung und eine Prüftabelle liegen in
`doc/Pictures/adminHelpLinks/`.

## 7. Regeln für die Nutzerdoku (`doc/de`, `doc/en`)

Diese Regeln gelten für jede Änderung an `doc/de` und `doc/en` — egal, ob sie wegen eines Hilfe-Links, einer
neuen Funktion oder einer Korrektur passiert. Sie sind der gemeinsame Nenner von Maintainer und Doku-Pflege, damit
beide Seiten dieselbe Struktur vorfinden.

### Sprachen und Gliederung

- **DE und EN sind ein Paar:** gleicher Dateiname, gleiche Gliederung, gleiche Reihenfolge der Überschriften und
  Absätze. Beide im **selben Commit** ändern. Fehlt eine Seite in einer Sprache, entsteht sie mit — keine Stummel.
- Der deutsche Text ist die Vorlage, der englische eine Übersetzung mit denselben Fachbegriffen
  (Beschriftungen des Admin so, wie sie in `admin/i18n/<sprache>/translations.json` stehen).
- **Kein Fachjargon, wo ein Alltagswort reicht.** Beispiele aus früheren Durchgängen: Die farbigen Verbindungen
  im Navigation Flow heißen **Linie** (EN `line`), nicht „Kante“; **Knoten** darf bleiben, weil es so im Admin steht.
- Reine Doku-Änderungen bekommen **keinen Changelog-Eintrag** im README.

### Aufbau einer Seite

1. `# Titel` — bei Kartentypen `# <Karte> – Konfiguration im Admin`.
2. Ein bis drei Absätze Einleitung: Was die Seite/Funktion am Panel tut, wo sie im Admin angelegt wird, was sie
   **nicht** kann. Gibt es keinen Skriptweg, steht das hier mit der Meldung aus dem Log.
3. **„Inhalt:“-Liste** mit Ankern auf die nummerierten Abschnitte (Unterabschnitte eingerückt).
4. **Nummerierte Abschnitte** `## 1. …`, `## 2. …` in der Reihenfolge, in der der Nutzer im Admin arbeitet
   (anlegen → Felder → Besonderheiten → was am Panel passiert).
5. Zum Schluss **`## Fallstricke`** (EN `## Pitfalls`), ohne Nummer: je ein fetter Merksatz plus Erklärung.
   Bekannte Fehler und Abweichungen zwischen Oberfläche und Verhalten gehören hierhin, nicht in den Fließtext.

- **Ausnahme Einstieg:** Seiten, deren Thema Einsteigern schwerfällt, dürfen zwischen „Inhalt:“-Liste und `## 1.`
  einen unnummerierten Einstieg haben: Erklärung in Alltagssprache, Entscheidungshilfe „Ich möchte … → nimm …“ und
  Schnellstarts mit nummerierten Schritten. Die nummerierten Abschnitte danach bleiben der Nachschlageteil; ihre
  Nummern und Anker ändern sich dadurch nicht. Beispiel: `popupTimer.md`.

- **Felder als Tabelle** `| Feld | Bedeutung |` — die Spalte *Feld* trägt die Beschriftung aus dem Admin in
  Fettschrift. Was der Admin **nicht** anzeigt (Grenzen, Reihenfolge, Verhalten beim Speichern), steht in der
  Spalte *Bedeutung*, nicht in einer Fußnote.
- **Gleiche Dinge gleich bauen:** Mehrere Knöpfe oder Varianten derselben Art bekommen je einen Unterabschnitt mit
  identischem Aufbau (Beispiel `Maintain.md` Abschnitt 3: `### TASMOTA UPDATE`, `### TFT UPDATE`,
  `### BERRY UPDATE` — gemeinsame Einleitung davor, je Knopf: was passiert, Voraussetzungen, Fehlerfall).
- Hinweise, die der Nutzer übersehen würde, als Zitatblock `> **Merksatz.** Erklärung …`.
- **Der Admin ist der Weg.** Jede Karte, die der Admin kann, wird dort vollständig beschrieben — Klickweg **und** die
  wegunabhängigen Sacherklärungen (Darstellung am Panel, Grenzen, Rollen, Datenpunkte). Das Konfigurationsskript ist
  der zweite Weg für erfahrene Nutzer und wird nur grob beschrieben (Aufbau, Beispiele, keine Feldlisten). Admin und
  Skript nie als gleichwertig nebeneinanderstellen; was im Admin fehlt, wird als Issue gemeldet, nicht im Skript
  umgangen und auch nicht so dokumentiert.

### Überschriften, Anker, Nummern

- Überschriften sind **Verträge** (Abschnitt 4): Der Admin verlinkt auf ihren Wortlaut, der Anker entsteht per
  `slug()` daraus. Vor jedem Umbenennen `grep -rn "<Überschrift>" src-admin/src/docTopics doc/`.
- **Nummerierte Abschnitte nicht umnummerieren.** Neues kommt als Unterabschnitt (`###`) in den passenden
  Abschnitt oder als neuer Abschnitt **hinten** dran — sonst verschieben sich die Anker `#3-…`, auf die fremde Seiten
  und Topics zeigen. (`screensaver.md`: Kacheln wurden §16 hinter Timer §15 gehängt, nicht eingeschoben.)
- Unterüberschriften nur dort, wo ein Link sie braucht oder die Gliederung sie trägt; keine Überschriften-Flut.
- Ankerschreibweise: Kleinbuchstaben, Bindestriche, Umlaute bleiben (`#4-wlan-verschlüsselung-passwort-verstecktes-netz`),
  Satzzeichen fallen weg (`3. Tasmota, TFT und …` → `#3-tasmota-tft-und-…`). Doppelte Überschriften bekommen `-1`, `-2`.

### Links

- **Wiki-Stil ohne `.md`:** `[Screensaver](screensaver)`, mit Anker `[Items](screensaver#4-items-der-item-dialog)`.
  Dateinamen mit Klammern in spitzen Klammern: `[Developer News (Latest)](<Developer-News-(Latest)>)`.
- Seitenintern `[Text](#anker)`. Auf die Sprache der Zielseite muss nicht geachtet werden — der Build löst
  je Sprache auf.
- Eine Seite, die noch nicht existiert, wird **nicht** verlinkt (in `_Sidebar.md`: `*(folgt)*`; `iA` = Seite da,
  aber dünn). Keine toten Links, keine Platzhalterseiten.
- Externe Links nur auf stabile Ziele (GitHub-Repo, ioBroker-Doku), nie auf Forum-Uploads.
- Links in `admin/jsonConfig.json5` (`staticLink`) und in `src-admin/src/docTopics/*.ts` müssen beim Umbenennen
  einer Seite von Hand nachgezogen werden (Abschnitt 5).

### Bilder

- Ablage `doc/Pictures/<thema>/<nr>-<kurzname>.png` — ein Ordner je Seite/Thema (`maintain`, `developer`,
  `pageConfigDialoge`, `screensaverAdmin` …), fortlaufende Nummer, deutscher Kurzname. **PNG hat Vorrang.**
  **GIF nur für Animationen**, die ein Standbild nicht zeigen kann (Blinken, Farbwechsel, Ablauf) — als kurze Schleife
  mit wenigen Frames, Maß wie die Standbilder daneben. Alles andere bleibt PNG.
- **Ein Bild für beide Sprachen:** derselbe Pfad in DE und EN, nur der Alt-Text ist übersetzt.
  Einbinden mit `![Alt-Text](../Pictures/<thema>/<datei>.png)`; Roh-`<img>` nur, wenn die Breite begrenzt werden muss.
- Der Alt-Text beschreibt, **was zu sehen ist und warum** („Die Karte eines Panels mit dem Feld Berry-Treiber und
  dem Knopf BERRY UPDATE — hier der Emulator, bei dem der Knopf grau bleibt“), nicht nur den Dateinamen.
- Admin-Bilder sind **Ausschnitte**, keine Vollbilder: die Karte, der Dialog, der Kasten — mit etwas Rand
  (ca. 600–1300 px breit). Aufgenommen im hellen Standard-Thema, Fensterbreite 1500 px, Sprache Deutsch.
  Dialoge mit `.MuiDialog-paper` als Ausschnitt; bei zwei offenen Dialogen `.MuiDialog-root:last-of-type .MuiDialog-paper`.
- Bilder zeigen den **aktuellen** Admin — nach einem Umbau der Oberfläche die betroffenen Bilder neu aufnehmen,
  keine Bilder aus altem Wiki oder Forum übernehmen.
- `doc/Pictures/**` wird unverändert auf die Pages-Seite kopiert; Ordner nur mit Bildern füllen (eine README wie in
  `adminHelpLinks/` ist die Ausnahme für Prüftabellen).

### Quellen

Reihenfolge der Wahrheit: `src-admin/src/*.tsx` → `admin/jsonConfig.json5` → `src/lib/config-manager.d.ts` und
`adapter-config.d.ts` → `src/lib/pages/*.ts`, `src/main.ts` → README-Changelog → alter Wiki-/Forum-Text nur als
Rohmaterial. Jede Aussage über Verhalten (Grenzen, Reihenfolge, Fehlermeldungen) wird am Code geprüft, Meldungen
werden **wörtlich** aus `admin/i18n/de/translations.json` übernommen. Versionsangaben („seit 2.3.0“) aus dem Changelog.

### Prüfen und Commit

```bash
npx tsx script/build-doc-page.ts /tmp/docchk --strict && rm -rf /tmp/docchk   # tote Links und Anker in DE und EN
npx mocha --config test/mocharc.custom.json src-admin/src/docTopics.test.ts   # Überschriften, auf die der Admin zeigt
```

`--strict` prüft **keine Bildpfade** — neue Bilder einmal in der gebauten Seite oder per `ls` gegen den Pfad prüfen.
Commit-Betreff `docs(<Seite>): …`, DE und EN zusammen; Bilder im selben Commit wie der Text, der sie einbindet.
