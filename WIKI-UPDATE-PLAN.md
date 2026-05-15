# Wiki-Update-Plan: nspanel-lovelace-ui Dokumentation

## Worum es geht

Das GitHub-Wiki (https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki) enthält ca. 38 Seiten Dokumentation, von denen rund 7 reine Stubs sind und mehrere weitere als "iA" (in Arbeit) markiert sind. Ziel ist es:

1. Alle Stub-Seiten zu schreiben
2. Bestehende Seiten auf Vollständigkeit und Korrektheit gegen den Quellcode zu prüfen
3. Das Konfigurationsskript **wahrheitsgemäß und vollständig** zu dokumentieren
4. Die **Admin-UI** (eine Teilmenge der Skriptoptionen) vollständig zu dokumentieren
5. Alles **zweisprachig** (Deutsch primär, Englisch sekundär) unter `docs/` im Repo abzulegen

Die fertigen `docs/`-Dateien werden nach Review per PR in das Wiki-Repo übertragen.

---

## Für Claude: So geht es weiter

Dieser Plan beschreibt das Vorgehen **phase-weise**. Jede Phase ist eine eigene Konversation. Die Phasen können unabhängig voneinander begonnen werden — starte immer mit dem git pull des Wikis.

**Zu Beginn jeder Session:**
```bash
cd /home/tim/ioBroker.nspanel-lovelace-ui.wiki && git pull
```

**Die Wahrheitsquellen (in dieser Priorität):**
1. `src/lib/types/config-manager.d.ts` — TypeScript-Typen des Konfigurationsskripts (1088 Z.)
2. `src/lib/adapter-config.d.ts` — TypeScript-Typen der Admin-Konfiguration (317 Z.)
3. `admin/jsonConfig.json5` — Admin-UI Felder (3365 Z.)
4. `/home/tim/ioBroker.nspanel-lovelace-ui.wiki/*.md` — Aktueller Wiki-Stand (38 Seiten)
5. `script/globalPageConfig.ts` — Beispielskript (8026 Z., illustrativ, nicht normativ)

**NICHT als Quelle verwenden:** Der `doc/`-Ordner im Repo (total veraltet, wird in Phase 0 gelöscht).

---

## ⚠️ Qualitätsanforderungen — unbedingt lesen

### Vollständigkeit

Jede Dokumentationsseite muss **alle** relevanten Optionen, Parameter und Verhaltensweisen beschreiben. Eine knappe Übersicht reicht nicht — Nutzer sollen die Seite lesen können ohne in den Quellcode schauen zu müssen. Konkret:

- Alle UI-Felder eines Admin-Tabs → alle dokumentieren (Name, Typ, Standard, Beschreibung)
- Alle Konfig-Keys eines Skript-Abschnitts → alle dokumentieren mit Typ, Standardwert, Auswirkung
- Interaktionen zwischen Feldern (z. B. "nur aktiv wenn X = true") → explizit beschreiben
- Einschränkungen und Sonderfälle (z. B. "nur Expertenmodus", "Adapter muss laufen") → als Hinweis

### Code muss geprüft werden

**Vor dem Schreiben immer den zugehörigen Quellcode lesen** — nicht nur den bestehenden Wiki-Text übernehmen. Der Wiki-Text kann veraltet, unvollständig oder falsch sein.

- **Admin-Tabs:** Quellcode der React-Komponente lesen (`src-admin/src/*.tsx`) + i18n-Dateien (`admin/custom/i18n/de.json`, `en.json`)
- **Skript-Optionen:** TypeScript-Interface in `src/lib/types/config-manager.d.ts` lesen — jedes Feld prüfen
- **Verhalten:** Implementierung in `src/lib/` nachvollziehen wenn unklar was eine Option bewirkt
- **Kommentare im Code** (`// TODO`, `// Beta`, `// experimental`) → als Hinweis in die Doku übernehmen

### Fehler die zu vermeiden sind

- Felder dokumentieren die gar nicht existieren (aus altem Wiki-Text übernommen)
- Felder weglassen die im Code existieren aber im Wiki fehlen
- Falschen Standardwert angeben (immer aus Code ablesen, nicht raten)
- Beschreibung aus dem Label-Key ableiten statt aus dem tatsächlichen Verhalten
- Kommentierte (`/* ... */`) oder deaktivierte Features als aktiv dokumentieren

---

## Ordnerstruktur und Konventionen

```
docs/
├── de/          # Deutsch (Primär) — selbe Dateinamen wie im Wiki
│   ├── _Sidebar.md
│   ├── Home.md
│   └── *.md
├── en/          # Englisch — selbe Dateinamen; beim Wiki-Push mit "en-" Präfix versehen
│   ├── _Sidebar.md
│   └── *.md
└── STATUS.md    # Fortschrittstabelle: welche Seiten fertig / iA / Stub
```

**Link-Format (GitHub-wiki-kompatibel, kein `.md`, kein Pfadpräfix):**
- In `docs/de/*.md`: `[Linktext](Dateiname-ohne-Endung)` z.B. `[ScriptConfig](ScriptConfig)`
- In `docs/en/*.md`: `[Linktext](en-Dateiname-ohne-Endung)` z.B. `[ScriptConfig](en-ScriptConfig)`
- Bilder: `![alt](Pictures/ordner/datei.png)` — Pfad relativ zum Wiki-Root

**Bilder-Platzhalter (für fehlende Screenshots):**

Überall wo ein Screenshot sinnvoll ist aber noch nicht existiert, folgendes Muster verwenden:

```markdown
> 🖼️ **Bild fehlt:** Kurze Beschreibung was zu sehen sein soll
> Pfad: `Pictures/seitenname/beschreibung.png`
> *Optionaler Hinweis für den Entwickler.*

![Alt-Text](Pictures/seitenname/beschreibung.png)
```

- Der `> 🖼️`-Block ist für Reviewer sichtbar und zeigt klar wo ein Bild fehlt
- Die `![...](...)`-Zeile danach ist bereits der finale Markdown — der Entwickler erstellt das Bild, legt es im Wiki-Repo unter `Pictures/` ab und entfernt den Platzhalter-Block
- Bildpfade: `Pictures/<seitenname-lowercase>/<beschreibung-kebabcase>.png`
- Gleiche Bilder in DE und EN verwenden (nur ein Ordner `Pictures/`, kein `de/` oder `en/` Unterordner)

---

## Status der Wiki-Seiten (Stand 2025-05-13)

### Reine Stubs (< 100 Bytes, inhaltsleer):
| Wiki-Datei | Bytes | Priorität |
|-----------|-------|-----------|
| `globelSettings.md` | 23 | HOCH (iA in Sidebar) |
| `Developer.md` | 11 | HOCH (iA in Sidebar) |
| `Navigation.md` | 21 | HOCH (iA in Sidebar) |
| `cardAlarm.md` | 94 | MITTEL |
| `User-NSPanel-Funktionalität.md` | 9 | NIEDRIG |
| `pageUnlock.md` | 80 | NIEDRIG (warte auf Tests) |
| `kommt-noch.md` | 59 | NIEDRIG (Platzhalter) |

### Klein aber mit echtem Inhalt (könnten trotzdem unvollständig sein):
| Wiki-Datei | Bytes | Hinweis |
|-----------|-------|---------|
| `naviFlow.md` | 319 | Minimal, iA in Sidebar |
| `symbolOverview.md` | 377 | Minimal |
| `tasmotatools.md` | 614 | Prüfen |
| `Maintain.md` | 1024 | Prüfen |
| `General.md` | 1520 | Dokumentiert MQTT-Einstellungen |
| `NSPanelsetting.md` | 1732 | Prüfen |

### Große Seiten (wahrscheinlich vorhanden, aber auf Korrektheit prüfen):
| Wiki-Datei | KB | Thema |
|-----------|-----|-------|
| `screensaver.md` | 56 | Screensaver-Konfiguration |
| `ScriptConfig.md` | 34 | Konfigurationsskript-Referenz |
| `Developer-Templates.md` | 14 | Template-System |
| `ALIAS.md` | 14 | Alias-Tabelle |
| `GlobalPages.md` | 22 | Globale Seiten |

**Hinweis: "Grundlagen Seitenerstellung" und "PageItems erstellen" in der Sidebar sind Anker (`#seiten-konfiguration`, `#pageitems`) innerhalb von `ScriptConfig.md` — keine separaten Dateien.**

---

## Phase 0 — Setup (1 Session)

**Aufgaben:**
1. Branch anlegen: `git checkout -b docs/wiki-update`
2. Den veralteten `doc/`-Ordner im Repo löschen: `git rm -r doc/`
3. `docs/de/` und `docs/en/` anlegen
4. Alle Dateien aus `/home/tim/ioBroker.nspanel-lovelace-ui.wiki/*.md` **unverändert** nach `docs/de/` kopieren (1:1-Baseline)
5. `docs/en/_Sidebar.md` und `docs/en/Home.md` als Stubs anlegen
6. `docs/STATUS.md` anlegen (Tabelle mit allen Wiki-Seiten + Status: fertig/iA/stub)
7. **Erster Commit (Baseline):** `"docs: add wiki baseline to docs/de/ (unmodified)"` — dieser Commit ist der Referenzpunkt für alle späteren Änderungen; alle folgenden Edits sind als Diff sichtbar
8. Alle nachfolgenden Phasen arbeiten auf diesem Branch weiter; am Ende → Pull Request

---

## Phase 1 — Admin-UI: Stub-Seiten (3 Sessions)

### Phase 1.1 — globelSettings.md (Global Settings Tab)
**Lesen:**
- `admin/jsonConfig.json5` Zeilen 21–900 (selektiv, ~300 relevante Zeilen)
- `src/lib/adapter-config.d.ts` relevante Felder

**Schreiben:**
- `docs/de/globelSettings.md` — vollständige Dokumentation aller Felder (Name, Typ, Pflicht?, Beschreibung, Standardwert)
- `docs/en/globelSettings.md` — englische Version

---

### Phase 1.2 — Developer.md (Developer-Tab in Admin)
**Lesen:**
- `admin/jsonConfig.json5` Zeilen 3104–3300

**Schreiben:**
- `docs/de/Developer.md`, `docs/en/Developer.md`

---

### Phase 1.3 — Navigation.md + naviFlow.md
**Lesen:**
- `admin/jsonConfig.json5` Zeilen 2935–3300

**Schreiben:**
- `docs/de/Navigation.md` (Navigation Overview, war Stub)
- `docs/de/naviFlow.md` (aktualisiert, war 319 B)
- `docs/en/Navigation.md`, `docs/en/naviFlow.md`

---

## Phase 2 — Admin-UI: Bestehende Seiten prüfen (1–2 Sessions)

**Lesen:**
- Jede bestehende kleine Admin-Seite aus dem Wiki
- Entsprechende Abschnitte aus `admin/jsonConfig.json5`

**Aufgabe:** Vollständigkeit prüfen, fehlende Felder ergänzen, EN-Versionen erstellen

**Seiten:** `Maintain.md`, `tasmotatools.md`, `NSPanelsetting.md`, `General.md`, `symbolOverview.md`

---

## Phase 3 — Skript: ScriptConfig.md Überprüfung (2–3 Sessions)

**Strategie:** `config-manager.d.ts` (1088 Z.) ist die normative Typreferenz. `ScriptConfig.md` (34 KB) dagegen halten.

### Phase 3.1 — Einleitung + Seitenkonfiguration + optionale Parameter
**Lesen:**
- `docs/de/ScriptConfig.md` (aus Wiki, Zeilen 1–200)
- `src/lib/types/config-manager.d.ts` Zeilen 1–400

**Prüfen:** Sind alle Felder von `PageType` und `globalPagesConfig` dokumentiert?

---

### Phase 3.2 — PageItems + HardwareButton
**Lesen:**
- `docs/de/ScriptConfig.md` Zeilen 200–Ende
- `src/lib/types/config-manager.d.ts` Zeilen 400–750

---

### Phase 3.3 — ScriptConfig EN-Version
**Aufgabe:** `docs/en/ScriptConfig.md` erstellen basierend auf der verifizierten deutschen Version

---

## Phase 4 — Skript: GlobalPages.md prüfen (1 Session)

**Lesen:**
- `docs/de/GlobalPages.md` (22 KB)
- `config-manager.d.ts` `PageTypeGlobal`, `globalPagesConfig`

**Output:** `docs/de/GlobalPages.md` (ggf. ergänzt), `docs/en/GlobalPages.md`

---

## Phase 5 — Standard Pages: cardAlarm + Prüfungen (2 Sessions)

### Phase 5.1 — cardAlarm.md (Stub → komplett)
**Lesen:**
- `config-manager.d.ts` PageAlarm-Typ
- `admin/jsonConfig.json5` Alarm-Abschnitt (falls vorhanden)

**Output:** `docs/de/cardAlarm.md`, `docs/en/cardAlarm.md`

### Phase 5.2 — Übrige Standard Pages prüfen
**Seiten:** `PagePower.md`, `PageMedia.md`, `PageThermo2.md`, `PageChart.md`, `PageConfig.md`, `cardGrid.md`
**Aufgabe:** Vergleich mit TypeScript-Typen, Lücken ergänzen, EN-Versionen

---

## Phase 6 — Screensaver: Überprüfung (2 Sessions)

Da `screensaver.md` 56 KB hat, in zwei Hälften aufteilen:

### Phase 6.1 — screensaver.md erste Hälfte (Zeilen 1–800)
**Quelle:** `config-manager.d.ts` Screensaver-Typen

### Phase 6.2 — screensaver.md zweite Hälfte + EN
**Output:** `docs/de/screensaver.md` (geprüft), `docs/en/screensaver.md`

---

## Phase 7 — Developer-Docs (1–2 Sessions)

**Seiten:** `Developer-Templates.md` (14 KB), `ALIAS.md` (14 KB), `Developer-News-(Latest).md`
**Aufgabe:** Auf Aktualität prüfen, EN-Versionen

---

## Workflow: Commit + PR nach jeder Phase

Der Branch `docs/wiki-update` hat einen offenen **Entwurfs-PR** (#685). Nach dem Abschluss jeder Phase müssen die Änderungen committet, gepusht **und der PR-Eingangspost aktualisiert** werden.

```bash
# Nach jeder abgeschlossenen Phase ausführen:
git add docs/
git commit -m "docs(phase X.Y): kurze Beschreibung"
git push

# PR-Beschreibung aktualisieren (Phasentabelle im PR-Body):
gh pr edit 685 --body "$(cat <<'EOF'
## Zusammenfassung
... (aktualisierter Text mit neuen ✅-Einträgen)
EOF
)"
```

**Wichtig:**
- Branch muss `docs/wiki-update` sein (`git branch` prüfen)
- `docs/STATUS.md` in jedem Commit mitaktualisieren (Status auf ✅ setzen)
- Commit-Message nennt die Phase: `docs(phase 1.1): globelSettings Admin-Tab dokumentiert`
- **PR-Eingangspost (#685) nach jedem Phasenabschluss aktualisieren** — die Phasentabelle im PR-Body muss den neuen Status widerspiegeln (⏳ → ✅). Dazu `gh pr edit 685 --body "..."` verwenden oder den PR-Body direkt auf GitHub bearbeiten.

---

## Phase 8 — Abschluss: Sidebar + Links + PR für Merge vorbereiten

**Aufgaben:**
1. `docs/de/_Sidebar.md` finalisieren — alle "iA"-Markierungen entfernen wo fertig
2. `docs/en/_Sidebar.md` vervollständigen
3. `docs/STATUS.md` aktualisieren
4. Alle Links prüfen: `grep -rn '\](' docs/de/ | grep '\.md)' | grep -v '#'` (Links MIT .md = falsch)
5. Verwaiste Seiten finden: Dateien die in keinem Link vorkommen
6. PR-Status von "Entwurf" auf "Bereit zum Review" setzen: `gh pr ready`

**Nach PR-Merge:**
- Dateien aus `docs/de/` in das Wiki-Repo kopieren (flat)
- Dateien aus `docs/en/` mit `en-`-Präfix in das Wiki-Repo kopieren
- `git push` im Wiki-Repo (`/home/tim/ioBroker.nspanel-lovelace-ui.wiki/`)

---

## Verifikations-Kommandos

```bash
# Wie viele Admin-Felder gibt es?
grep -c '"label"' admin/jsonConfig.json5

# Wie viele TypeScript-Interface-Felder hat der Skript-Config-Typ?
grep -E "^\s+[a-zA-Z].*\??: " src/lib/types/config-manager.d.ts | wc -l

# Links in docs/ prüfen (dürfen kein .md enthalten und keinen Pfad):
grep -rn '\](.*\.md)' docs/

# Alle Seiten ohne EN-Version finden:
diff <(ls docs/de/*.md | xargs -I{} basename {}) <(ls docs/en/*.md | xargs -I{} basename {})
```

---

## Wichtige Pfade

| Pfad | Inhalt |
|------|--------|
| `/home/tim/ioBroker.nspanel-lovelace-ui.wiki/` | GitHub-Wiki Clone (Quelle) |
| `docs/de/` | Neue deutsche Docs (Ziel) |
| `docs/en/` | Neue englische Docs (Ziel) |
| `admin/jsonConfig.json5` | Admin-UI Felder |
| `src/lib/types/config-manager.d.ts` | Script-Config TypeScript-Typen |
| `src/lib/adapter-config.d.ts` | Admin-Config TypeScript-Typen |
| `script/globalPageConfig.ts` | Beispielskript (illustrativ) |
