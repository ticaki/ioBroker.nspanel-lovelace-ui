# NSPanel-Simulator

Eigenständiges Modul, das aus Sicht des `ioBroker.nspanel-lovelace-ui`-Adapters
wie ein frisches NSPanel aussieht — über die bestehende `nsPanelInit`-sendTo-API.

## Was wird simuliert

- **Tasmota-HTTP-API** (`/cm?cmnd=...`) — antwortet auf `status 5`, `status 0`,
  `status 10`, `Backlog`, `MqttHost`/`MqttPort`/`MqttUser`/`MqttPassword`,
  `FullTopic`, `FriendlyName1`, `Hostname`, `MqttClient`, `SetOption*`,
  `WebLog`, `Module`, `Timezone`, `template`, `AdcParam`,
  `GetDriverVersion`, `Restart 1`. `FlashNextion*` wird verworfen.
- **Tasmota-MQTT-Befehle** — `Rule3`, `POWER1/2`, `STATUS0/10`, `Buzzer`,
  `Backlog` (rekursiv), `GetDriverVersion`, `Ping`.
- **Berry/Display** — `cmnd/<topic>/CustomSend` mit Payloads wie
  `pageType~pageStartup`, `dimmode~...`, `entityUpd~...` werden quittiert
  (`Done` + `renderCurrentPage`); Page/Dim/Timeout-State wird gehalten.
- **Bootevent** — `event,startup,<displayVersion>,<model>` per
  `tele/<topic>/RESULT`.

## Was nicht simuliert wird (Phase 1)

- TFT-Flashing / Nextion-UART-Protokoll (Backlog `FlashNextion*` wird
  ignoriert)
- Aktive Touch-/Sleep-Events (kommt in Phase 2)

## Quickstart

```bash
cd simulator
npm install
npm start -- --http-port 9080
```

In einem zweiten Schritt — mit dem Adapter (z. B. `nspanel-lovelace-ui.0`)
lauffähig im ioBroker:

```bash
iobroker sendTo nspanel-lovelace-ui.0 nsPanelInit '{
  "tasmotaIP": "127.0.0.1:9080",
  "mqttIp": "127.0.0.1",
  "mqttServer": "true",
  "internalServerIp": "127.0.0.1",
  "mqttPort": 1883,
  "mqttUsername": "nspanel",
  "mqttPassword": "test",
  "tasmotaTopic": "nspanel-sim",
  "tasmotaName": "NSPanel-Sim",
  "model": "eu"
}'
```

Der Sim:
1. nimmt die Backlog-Befehle entgegen
2. speichert MQTT-Host/User/Password/FullTopic in `state.json`
3. startet auf `Restart 1` einen MQTT-Connect mit den gelernten Daten
4. veröffentlicht LWT, INFO1, STATE und schließlich
   `event,startup,10,eu` — der Adapter erkennt damit das Panel als online.

Beim 2. Lauf wird `state.json` wiederverwendet und der Sim verbindet sich
direkt — kein erneutes `nsPanelInit` nötig.

## Konfiguration

Präzedenz: CLI-Flags > ENV > `config.json` > Defaults.

| Feld              | CLI-Flag             | Default                         |
|-------------------|----------------------|---------------------------------|
| `httpListenIp`    | `--http-ip`          | `127.0.0.1`                     |
| `httpListenPort`  | `--http-port`        | `9080`                          |
| `topic`           | `--topic`            | `` (gelernt aus FullTopic)      |
| `model`           | `--model`            | `eu`                            |
| `firmwareVersion` | `--fw`               | `14.4.1(release-nspanel)`       |
| `displayVersion`  | `--display-version`  | `10` (Berry-Generation)         |
| `mac`             | `--mac`              | random `AA:BB:CC:xx:xx:xx`      |
| `simulatedIp`     | `--sim-ip`           | `127.0.0.1`                     |
| `ackDelayMs`      | `--ack-delay-ms`     | `30`                            |
| `statePath`       | `--state`            | `./state.json`                  |
| `logLevel`        | `--log-level`        | `info`                          |

## Tests

```bash
npm test
```

Smoke-Test fährt einen In-Process-aedes-MQTT-Broker hoch, startet den Sim
und simuliert die `nsPanelInit`-HTTP-Sequenz.
