# Prompt: Admin und Doku verlinken (Hilfe-Icons „?“)

Diese Datei ist ein Prompt für Claude. Sie beschreibt, wie der Admin (`src-admin/src`) mit der Nutzerdoku
(`doc/de`, `doc/en`) verlinkt ist. Lies sie vollständig, bevor du im Admin Felder, Dialoge oder Editoren
anlegst oder änderst, und bevor du Überschriften in der Doku umbenennst, verschiebst oder einfügst.
Beide Seiten hängen über die Überschriften zusammen, und ein Test schlägt fehl, sobald sie auseinanderlaufen.

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
| `src-admin/src/components/DocHelp.tsx` | `DocHelp` (das ?), `DocButton` (Button für die ganze Seite), `withDocLanguage` (gibt die Systemsprache weiter) |
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
import { DocButton, DocHelp } from './DocHelp'; // aus src-admin/src/components
<Typography>{this.getText('screensaver_item_color')}<DocHelp topic="screensaver.itemColor" /></Typography>
<DocButton topic="screensaver.page" />
<DocHelp topic={cardDocTopic(entry.card)} /> // ein Topic-Objekt geht auch
```

`DocHelp` stoppt die Weitergabe des Klicks. Ein ? in einem Checkbox-Label, einem Akkordeon-Kopf oder einem
Menüeintrag schaltet deshalb nichts mit um.

## 3. Regeln für neue Links

1. **Nur dort, wo die Doku einen passenden Abschnitt hat.** Die Überschrift muss genau diese Einstellung
   erklären. Ein Unterabschnitt ist besser als ein Link auf die ganze Seite.
2. **Ruhig bleiben, aber reichlich:** Mehr als 5 ? pro Ansicht sind erlaubt. Kein ? in Zeilen, die sich
   wiederholen, also nicht in Listen, Tabellenzeilen, je Panel-Kachel, je Slot oder je Knoten im
   Navigationsgraphen. Dann lieber ein ? an der Überschrift der Liste.
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
