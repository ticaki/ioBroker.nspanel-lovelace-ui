# Claude Instructions – NSPanel Lovelace UI

## Admin React (`./src-admin`) – Pflichtregeln

1. **Nur class-based Components** – keine Hooks, keine funktionalen Komponenten.

2. **Alle sichtbaren Strings müssen übersetzt sein** via i18n.
   - Übersetzungsdateien für Admin: `./src-admin/src/i18n/en.json` und `./src-admin/src/i18n/de.json`
   - Adapter-Übersetzungen: `./admin/i18n/*/translations.json`
   - Mindestens Englisch **und** Deutsch bei neuen Keys.

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

## Changelog

Jede für den Endnutzer relevante Änderung bekommt einen kurzen Eintrag in `README.md` unter `## Changelog` → `### **WORK IN PROGRESS**`:
```
- (author) short description
```
