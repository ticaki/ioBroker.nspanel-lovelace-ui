# Claude Instructions – NSPanel Lovelace UI

## Admin React (`./src-admin`) – Pflichtregeln

1. **Nur class-based Components** – keine Hooks, keine funktionalen Komponenten.

2. **Alle sichtbaren Strings müssen übersetzt sein** via i18n.
   - Übersetzungen (auch für die Admin-React-UI): `./admin/i18n/*/translations.json` – der Admin-Build
     (`build:admin`) mergt sie nach `admin/custom/i18n/*.json`.
   - `./src-admin/src/i18n/*.json` enthält nur eine Handvoll Basis-Keys – neue Keys **nicht** dort anlegen.
   - Mindestens Englisch **und** Deutsch bei neuen Keys, möglichst alle 11 Sprachen.

3. **Return-Typen sind Pflicht** – öffentliche und interne Methoden müssen explizite Rückgabetypen haben.

4. **`as`-Casts minimieren** – stattdessen Type Guards, Discriminated Unions oder Helper-Funktionen.

5. **MUI v6 `slotProps` API verwenden** – nicht die veralteten Props:
   ```tsx
   // Richtig
   <TextField slotProps={{ input: { sx: { ... } }, inputLabel: { shrink: true } }} />

   // Falsch (deprecated)
   <TextField InputProps={{ sx: { ... } }} InputLabelProps={{ shrink: true }} />
   ```

## TypeScript (Adapter-Code `./src/`)

- Nur TypeScript, kein JS. Strict mode.
- Kein `any` ohne triftigen Grund.
- Logging: `adapter.log.*` – kein `console.*` im Produktivcode.
- Adapter-Timer nutzen (`adapter.setTimeout/setInterval`), keine globalen.

## E2E-Test vor dem Push (Pflicht bei Codeänderungen)

Bevor eine Änderung gepusht wird, die **Adapter- oder Web-Panel-Code berührt** (`src/`, `src-web/`,
`package.json`/Abhängigkeiten, Tests), muss der lokale End-to-End-Test grün sein:
```
npm run build
npm run test:e2e
```
Nicht nötig bei reinen Änderungen an Doku (`*.md`, `doc/`), HMI-Dateien, Bildern, Übersetzungen ohne Codebezug o. Ä.,
ebenso bei reinen Änderungen am Admin (`src-admin/`, `admin/custom/`, `admin/i18n/`), solange kein geteilter Code unter
`src/` (z. B. `src/lib/types/`) mitgeändert wird – der E2E-Test lädt das Admin-Bundle nicht.
Der Test läuft nur lokal (nicht in der CI); Details in `test/e2e/README.md`. Schlägt er fehl: nicht pushen, Ursache klären.
Weicht nur ein Snapshot wegen einer **gewollten** Änderung ab: `UPDATE_SNAPSHOTS=1 npm run test:e2e`, den Diff von
`test/e2e/__snapshots__/e2e.snap.json` Eintrag für Eintrag prüfen und mitcommitten – nie blind neu aufnehmen.

## Changelog

Jede für den Endnutzer relevante Änderung bekommt einen kurzen Eintrag in `README.md` unter `## Changelog` → `### **WORK IN PROGRESS**`:
```
- (author) short description
```
