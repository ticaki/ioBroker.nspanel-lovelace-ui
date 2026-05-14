# VSCode-Debugging für ioBroker-Adapter mit `dev-server`

Setup, um Breakpoints in TypeScript-Quellen zu setzen, während der Adapter über
`@iobroker/dev-server` läuft. Funktioniert auch über VSCode Remote-SSH.

## TL;DR

1. Im Terminal: `dev-server watch -n` starten (`-n` = `--noStart`, dev-server
   synct nur und startet den Adapter NICHT selbst).
2. In VSCode F5 → "Launch Adapter (dev-server watch -n)".
3. Der Adapter pausiert auf der ersten Zeile, einmal Continue (F5) drücken.
4. Breakpoints in `src/*.ts` greifen.

## launch.json

Drop-in Snippet für diesen Adapter. Port 9230 ist frei wählbar, muss aber in
beiden Settings identisch sein.

```jsonc
{
    "configurations": [
        {
            "name": "Launch Adapter (dev-server watch -n)",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/.dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/build/main.js",
            "args": ["--debug", "0"],
            "cwd": "${workspaceFolder}/.dev-server/default",
            "console": "internalConsole",
            "outputCapture": "std",
            "attachSimplePort": 9230,
            "runtimeArgs": ["--inspect-brk=9230"],
            "sourceMaps": true,
            "outFiles": [
                "${workspaceFolder}/.dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/build/**/*.js"
            ],
            "resolveSourceMapLocations": [
                "${workspaceFolder}/**",
                "${workspaceFolder}/.dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/build/**"
            ]
        }
    ],
    "version": "0.2.0"
}
```

`package.json#main` bei diesem Adapter ist `build/main.js`, daher passen die
Pfade. Falls das jemals geändert wird, müssen `program`/`outFiles` mitgezogen
werden.

## Warum diese Settings — die Stolperfallen

Drei nicht-offensichtliche Fallen, in genau dieser Reihenfolge entdeckt:

### 1. `cwd` muss das dev-server-Profilverzeichnis sein, NICHT das Adapterverzeichnis

`dev-server watch -n` gibt selbst die Anleitung aus:

> You can now start the adapter manually by running
>     `node node_modules/iobroker.nspanel-lovelace-ui/build/main.js --debug 0`
> from within `<profileDir>`

Das `cwd` ist also `${workspaceFolder}/.dev-server/default` (nicht
`.../node_modules/iobroker.nspanel-lovelace-ui`). Aus diesem cwd findet der
Adapter das js-controller-Setup, die Redis-Ports der Profile-Instanz usw.

### 2. `resolveSourceMapLocations` darf node_modules NICHT generell ausschließen

Default-Verhalten von vscode-js-debug: `**/node_modules/**` ausschließen. Aber
die laufende `main.js` liegt unter
`.dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/build/` — also
genau in einem `node_modules`-Pfad. Mit Default-Excludes wird die Sourcemap dort
gar nicht erst geladen → grauer Breakpoint.

Lösung: explizit den Build-Ordner whitelisten.

### 3. `console: integratedTerminal` startet KEINEN Inspector — Trace-Diagnose

Die wichtigste Falle. Im Trace-Log (`trace: true` setzen, Logfile unter
`~/.vscode-server/data/logs/.../ms-vscode.js-debug/*.json` öffnen) sieht man
das tatsächlich gestartete Kommando:

```
/usr/bin/node --experimental-network-inspection ./node_modules/iobroker.nspanel-lovelace-ui/build/main.js --debug 0
```

Es fehlt **`--inspect-brk`**! vscode-js-debug versucht in moderneren Versionen
einen Bootloader-Mode via `NODE_OPTIONS=--require .../bootloader.js` und einen
IPC-Socket unter `/tmp/node-cdp.*.sock`. In manchen Setups (insbesondere VSCode
Remote-SSH, Node 22, vscode-js-debug 1.117+) verbindet sich der Bootloader
nicht zurück — es kommen **null** `Debugger.scriptParsed`-Events, der Inspector
ist nie attached, alle Breakpoints bleiben unverbunden.

Lösung: Bootloader umgehen, expliziten Inspector-Port erzwingen:

```jsonc
"console": "internalConsole",
"outputCapture": "std",
"attachSimplePort": 9230,
"runtimeArgs": ["--inspect-brk=9230"]
```

`outputCapture: "std"` sorgt dafür, dass Adapter-stdout/stderr in die VSCode
Debug Console gespiegelt werden (inkl. ANSI-Farben).

## Diagnose-Checkliste, falls Breakpoints grau bleiben

In dieser Reihenfolge prüfen:

1. **Sourcemap auflösen**: stimmt der absolute Pfad?
   ```bash
   node -e '
     const fs = require("fs"), path = require("path");
     const p = ".dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/build/main.js.map";
     const m = JSON.parse(fs.readFileSync(p, "utf8"));
     console.log("sourceRoot:", m.sourceRoot);
     console.log("sources:", m.sources.slice(0, 3));
     m.sources.slice(0, 3).forEach(s => console.log("  ->", path.resolve(path.dirname(p), m.sourceRoot || ".", s)));
   '
   ```
   Erwartet: absolute Pfade zeigen auf `${workspaceFolder}/src/*.ts`.

2. **Source-Drift**: stimmt `sourcesContent` exakt mit dem Workspace-File überein?
   ```bash
   node -e '
     const fs = require("fs");
     const m = JSON.parse(fs.readFileSync(".dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/build/main.js.map", "utf8"));
     console.log("identical:", fs.readFileSync("src/main.ts","utf8") === m.sourcesContent[0]);
   '
   ```
   Wenn `false`: nach jedem TS-Edit `npm run build` laufen lassen, dev-server
   synct dann automatisch.

3. **Inspector-Attach**: `trace: true` setzen, F5, dann den ausgegebenen
   Logfile-Pfad öffnen. Suche nach `runtime.cdp.*` oder `scriptParsed`. Wenn
   nichts auftaucht: Inspector nicht attached → Stolperfalle 3.

## Zusätzlicher Workflow: Auto-Restart bei TS-Änderungen

`dev-server watch -n` synct die Build-Dateien automatisch ins Profil. Aber:
der über VSCode gelaunchte Adapter-Prozess startet sich nicht von selbst neu,
wenn die Files synchronisiert werden. Nach einem TS-Edit:

1. `npm run build` (oder `tsc --watch` parallel laufen lassen)
2. dev-server synct in `.dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/build/`
3. Im VSCode Debug-Panel: Stop + F5 (oder Restart-Button)

Wer Auto-Restart will, kann statt `dev-server watch -n` das normale
`dev-server watch` nehmen (ohne `-n`). Das startet den Adapter selbst mit
nodemon und `--inspect`. Dann statt Launch-Config die "Attach to remote
(dev-server watch)"-Config (Port 9229) verwenden. Nachteil: Initial-Pause via
`--inspect-brk` geht nicht; dafür Auto-Reload.

## Hinweise zu diesem Adapter

- `package.json#files` ist eine Allowlist und enthält `agent/` nicht — der
  Ordner wird also automatisch nicht ins npm-Package gepackt.
- Port 9230 ist gewählt, weil js-controller im dev-server 9228 nutzt und der
  Default-Inspect 9229 ist. Alles ≥ 9230 ist sicher; falls belegt, in
  `attachSimplePort` und `runtimeArgs` konsistent ändern.
