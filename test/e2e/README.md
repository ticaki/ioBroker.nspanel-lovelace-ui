# E2E-Test (lokal)

End-to-End-Test des Adapters mit einem virtuellen NSPanel (MQTT) und einem virtuellen Web-Panel (WebSocket).
Läuft **nur lokal** – nicht Teil von `npm test` und nicht in der GitHub-CI.

## Starten

```bash
npm run build          # der Test installiert das gebaute build/ (npm pack), nicht src/
npm run test:e2e
```

- Einzelne Szenarien: `npm run test:e2e -- --grep "02 Navigation"` (die Suite startet Adapter und Panels immer,
  die Szenarien sind auch einzeln lauffähig).
- Adapter-Log ausführlicher: `E2E_LOGLEVEL=debug npm run test:e2e`.
- Alle Payloads beider Panels mitschreiben: `E2E_DUMP=1 npm run test:e2e` → `<tmp>/nspanel-e2e-<hash>/payloads.log`
  (hilfreich beim Schreiben neuer Assertions).

- Snapshots nach einer gewollten Änderung neu aufnehmen: `UPDATE_SNAPSHOTS=1 npm run test:e2e` (siehe
  [Snapshots](#snapshots)).

Laufzeit etwa 3 Minuten (der erste Lauf länger: `@iobroker/testing` installiert js-controller 6.0.11 per npm).

## Was passiert

1. `@iobroker/testing` (`tests.integration`, wie `test/integration.js`) legt eine frische js-controller-Instanz mit
   eigenen Datenbanken an. Arbeitsverzeichnis: `<os.tmpdir()>/nspanel-e2e-<hash des Adapterpfads>/` – getrennt von
   `npm run test:integration` und von Läufen in anderen Worktrees.
2. Alle Ports (Objects-/States-DB, MQTT-Broker und Web-Panel-Server des Adapters) vergibt das Betriebssystem frei
   (`lib/env.js`), es kollidiert nichts mit einem laufenden Dev-Server oder einem zweiten Testlauf.
3. `fixtures/config.js` schreibt die Admin-Konfiguration (`system.adapter.nspanel-lovelace-ui.0.native`: Panel-Tabelle,
   `pageConfig`, `screensaverConfig`, MQTT-Broker, Web-Server) und die Test-States `0_userdata.0.e2e.*`
   (Kanäle mit Rollen wie in `ALIAS.md`: socket, dimmer, blind). Beide Panels nutzen kein Skript (`noScript`).
   Der Screensaver belegt alle Bereiche (favorit, 2× left, 4× bottom, alternate, 2 Indikatoren) mit
   unterscheidbaren Werten, Überschriften, Icons und Farben – ein verschobenes Feld oder ein vertauschter Slot fällt auf.
4. Der Adapter startet, `lib/virtual-nspanel.js` meldet sich als Tasmota/Berry/Display am Broker an,
   `lib/virtual-webpanel.js` verbindet sich per WebSocket mit `/ws/<topic>`. Beide warten auf die Startseite.
5. Die Szenarien in `scenarios/` laufen in dieser Reihenfolge in **einer** Adapter-Sitzung.

## Virtuelle Panels

|                 | NSPanel (`VirtualNSPanel`)                                                                                       | Web-Panel (`VirtualWebPanel`)                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| empfängt        | `<topic>/cmnd/CustomSend`                                                                                        | `cmd`-Frames                                                                  |
| quittiert       | `stat/RESULT {"CustomSend":"Done"}`, bei `pageType~` zusätzlich `event,renderCurrentPage` (alter Modus ohne CRC) | `ack {seq}`, bei `pageType~` zusätzlich `recv event,renderCurrentPage,<card>` |
| Startup         | antwortet auf `pageType~pageStartup` mit `event,startup,55,<model>,<tft>`                                        | `event,startup` nach `hello` und auf `pageType~pageStartup`                   |
| Tasmota         | `STATUS0`, `POWER1/2`, `GetDriverVersion` (Generation 11) werden beantwortet                                     | –                                                                             |
| Display-Timeout | aus; Tests senden `event,sleepReached` selbst. `autoSleep = true` simuliert `timeout~<s>`                        | –                                                                             |

Beide sammeln alle Payloads (`PayloadLog`): `mark()` merkt die Position, `waitFor(prädikat, { since, timeout, what })`
wartet auf eine passende Payload danach (Standard-Timeout 10 s, danach Fehler mit `what` und den letzten Payloads),
`settle()` wartet, bis die Sendewarteschlange des Adapters leer ist.

**Auf die erwartete Nachricht warten, nicht nur auf Ruhe.** `settle()` und die Ruhezeit des Snapshots sehen nur, dass
gerade nichts kommt – eine Nachricht, die der Adapter etwas später schickt (Drosselung, State-Rundlauf), fehlt dann
manchmal im Snapshot oder kommt erst nach dem nächsten Schritt (z. B. nach `bExit`). Jede Payload, die ein Schritt
auslöst und die im Snapshot stehen soll, wartet der Schritt per `waitFor` mit Prädikat auf den konkreten Inhalt ab
(nicht nur auf den Typ), bevor er die nächste Aktion schickt oder endet:

```js
const mark = await press(panel, buttonPress(lightId, 'brightnessSlider', 55));
await ctx.waitForValue(IDS.lightDimmer, 55); // der State allein reicht nicht
await panel.waitFor(p => detailOf(lightId)(p) && parseLightDetail(p).brightness === '55', {
    since: mark,
    what: 'entityUpdateDetail light brightness 55',
});
```

Nicht pauschal länger warten (`settle(3000)`): das macht den Test langsamer und nur seltener rot.

## Neues Szenario anlegen

1. Datei `scenarios/NN-name.js` anlegen:

    ```js
    module.exports = ctx => {
        describe('NN Name', () => {
            before(async () => {
                await toMainPage(ctx.nspanel, ctx.config.HEADLINES.main); // definierter Ausgangspunkt
            });
            step('macht etwas', async () => {
                const item = lastItem(ctx.nspanel, ctx.config.HEADLINES.main, ctx.config.NAMES.socket);
                const mark = await press(ctx.nspanel, buttonPress(item.id, 'OnOff', 1));
                await ctx.waitForValue(ctx.config.IDS.socketSet, true);
                await ctx.nspanel.waitFor(
                    menuItemAt(ctx.config.HEADLINES.main, 0, ctx.config.NAMES.socket, i => i.value === '1'),
                    { since: mark },
                );
            });
            protocolCheck(ctx); // letzter Test des Szenarios: Strukturprüfung aller Payloads
        });
    };
    ```

2. In `index.js` in die Liste `scenarios` eintragen.
3. Neue States/Seiten in `fixtures/config.js` ergänzen (`OBJECTS`, `STATES`, `PAGE_CONFIG`, `SCREENSAVER_CONFIG`).

Regeln: Assertions **positionsgenau** auf einzelne Felder (`lib/protocol.js`: `parseMenuUpdate`,
`parseWeatherUpdate`, `parseLightDetail`, `parseShutterDetail`; `lib/steps.js`: `menuItemAt`, `expectScreensaver`) oder
State-Werte, keine Regex/`include` über ganze Payloads. Jede Aktion über `press()` (wartet die Touch-Sperre des
Adapters nach einem `pageType` ab). Jedes Szenario beginnt mit `toMainPage()`, damit es nicht vom Vorgänger abhängt.
Tests mit `step()` statt `it()` anlegen (Snapshot). Ein echter Adapterfehler wird nicht im Test umgangen, sondern als
`it.skip` mit Kommentar markiert.

## Strukturprüfung (Validator)

`lib/payload-validator.js` prüft **jede** Payload, die eines der virtuellen Panels empfängt (Aufruf in
`PayloadLog.record`), gegen das HMI-Protokoll. Der Validator merkt sich die aktuelle Seite (letztes `pageType`) und die
Item-Typen der letzten `entityUpd`. Geprüft werden Feldanzahl und typisierte Felder an festen Positionen:

| Nachricht                                                            | Prüfung                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pageType~`                                                          | bekannte Seite; Screensaver `pageType~<seite>~~<4 Farben mit ?>`, sonst genau 1 Feld                                                                                                                                                                   |
| `entityUpd~`                                                         | Feldzahl 2 + 12 + 6 × Items der Seite (eu: cardGrid 6, cardEntities 4, …); Navigation `button`/`bXxx`/Glyph/Farbe; Items: bekannter Typ, ID, Icon = ein Glyph, Farbe 0–65535, Wert je Typ (0/1, `icon\|icon\|icon\|enable…`)                           |
| `entityUpdateDetail~`                                                | auf `popupNotify` 15 und `popupNotify3` 11 Felder (Glyph, Farben, Font 0/2/3, Text ≤ 199 Byte mit CR LF); sonst nach Typ des Items: popupLight 11 Felder, popupShutter2 22 Felder, jeweils Glyph/Farbe/enable-disable/Zahl an ihrer Stelle; unbekannte ID = Fehler                                                                                                     |
| `weatherUpdate~`                                                     | nur auf Screensaver-Seiten; 6 Felder je Slot, Slotzahl je Seite/Modus (standard 5, alternate 6 mit leerem 5. Slot, advanced 15, easyview 4, tiles 12); Typ immer leer, ID nur bei Indikatoren, Icon = Glyph (tiles-Indikator mit `¬n`), Farbe zum Icon |
| `color~`                                                             | 16 Farben                                                                                                                                                                                                                                              |
| `dimmode~`, `timeout~`, `statusUpdate~`, `time~`, `date~`, `notify~` | Feldzahl und Zahlen-/Farbfelder                                                                                                                                                                                                                        |

Die Slot- und Item-Zahlen stammen aus `HMI/Readme.md`, `ScreenSaverConst` (definition.ts) und `MENU_MAX_ITEMS`
(tools.ts), nur für das Modell eu. Jedes Szenario endet mit `protocolCheck(ctx)` (Test „Protocol › every payload …“),
der alle Verstöße seit der letzten Prüfung als Fehler meldet – auch Payloads, die kein Test gezielt ansieht.

## Snapshots

Jeder `step()` vergleicht nach seiner Aktion den **Endzustand** beider Panels mit
`__snapshots__/e2e.snap.json`: je Panel die **letzte** Payload jedes Nachrichtentyps, die im Schritt kam (nicht die
Abfolge – Drosselung und Bündelung des Adapters machen Anzahl und Reihenfolge nicht deterministisch), dazu die Werte
der Test-States `0_userdata.0.e2e.*`. Vor dem Abschluss wartet der Schritt 1,2 s Ruhe ab (länger als die
Screensaver-Drosselung von 1 s).

- Normalisiert: `time~` und `date~` fehlen ganz (Inhalt und Zeitpunkt hängen an der Uhr), die Helligkeiten von
  `dimmode~` (Tag/Nacht) werden `<dim>`, Icon-Glyphen stehen als `{U+E50E}` im Snapshot. Ein `dimmode~`, das
  zwischen xx:00:00 und xx:00:10 ankommt, fehlt: der Adapter schickt es zur vollen Stunde an alle Panels
  (`minuteLoop`, `minute === 0`), egal welcher Schritt gerade läuft. Alle anderen `dimmode~` bleiben im Vergleich.
- Name = Titelpfad unter `E2E` (`05 Screensaver ⇄ page › …`), ein einzelner Schritt per `--grep` vergleicht mit
  demselben Eintrag. „Snapshot › has no stale entries“ prüft nur bei einem vollen Lauf.
- Fehlt ein Eintrag, schlägt der Schritt mit Hinweis fehl.
- **Nach einer gewollten Änderung:** `UPDATE_SNAPSHOTS=1 npm run test:e2e` schreibt die Datei neu (bei `--grep` nur
  die gelaufenen Einträge). Den Diff der Datei **vor dem Commit lesen**: blindes Neuaufnehmen segnet Fehler ab. Der
  Validator und die gezielten Assertions bleiben die zweite Absicherung, sie laufen auch im Update-Modus.

## Mutationsprobe

Ob die Prüfungen greifen, zeigt ein absichtlicher Fehler im Adapter (`src/` ändern, `npm run build`, voller Lauf,
danach `git checkout src/` und wieder `npm run build` – sonst bleibt der Fehler in `build/`). Stand 2026-11-17:

| Mutation                                                                      | rot: gezielt | rot: Validator (`Protocol`) | rot: Snapshot |
| ----------------------------------------------------------------------------- | ------------ | --------------------------- | ------------- |
| a) `weatherUpdate~~…` (Tilde vor den Slots, screensaver.ts)                   | 9 (05, 06)   | 5 (02–06)                   | 4             |
| b) `entityUpd~…~~<items>` (Tilde vor den Items, pageMenu.ts `getMessage`)     | 22 (01–04)   | 6 (alle)                    | 7             |
| c) leeres Feld nach dem Icon im popupLight-`entityUpdateDetail` (pageItem.ts) | 4 (04)       | 1 (04)                      | 2             |
| d) Icon und Farbe des shutter2-Items vertauscht (pageItem.ts)                 | 1 (01)       | 6 (alle)                    | 27            |

Ein Schritt, dessen gezielte Prüfung schon fehlschlägt, kommt nicht mehr zum Snapshot-Vergleich – die Spalten
ergänzen sich. Neue Prüfungen gegen eine ähnliche Mutation gegenprüfen.

## Dateien

| Datei                                               | Inhalt                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `index.js`                                          | Einstieg, `tests.integration` mit einer Suite für alle Szenarien                      |
| `mocharc.e2e.json`                                  | Mocha-Konfiguration (`npm run test:e2e`)                                              |
| `fixtures/config.js`                                | Admin-Konfiguration und Test-States                                                   |
| `lib/env.js`                                        | freie Ports, eigenes Temp-Verzeichnis                                                 |
| `lib/context.js`                                    | Harness, Panels, State-Helfer (`setState`, `waitForValue`, `panelState`)              |
| `lib/virtual-nspanel.js`, `lib/virtual-webpanel.js` | die virtuellen Panels                                                                 |
| `lib/payload-log.js`                                | Aufzeichnung und `waitFor`                                                            |
| `lib/protocol.js`                                   | Parser für Payloads (positionsgenau), Event-Strings, `icon()`, `color565()`           |
| `lib/payload-validator.js`                          | Strukturprüfung jeder Payload                                                         |
| `lib/snapshot.js`                                   | `step()`, Snapshot-Vergleich, `UPDATE_SNAPSHOTS`                                      |
| `lib/steps.js`                                      | `press`, `toMainPage`, `lastItem`, `menuItemAt`, `expectScreensaver`, `protocolCheck` |
| `__snapshots__/e2e.snap.json`                       | Snapshots der Schritte                                                                |
| `scenarios/*.js`                                    | die Szenarien                                                                         |
