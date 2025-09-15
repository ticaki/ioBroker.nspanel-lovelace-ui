# Copilot Instructions (NSPanel Lovelace UI Adapter)

## Overview
- Purpose: ioBroker adapter for NSPanel Lovelace UI - custom firmware for Sonoff NSPanel touchscreen devices in Lovelace UI design.
- Runtime: Node.js (>= 20). Uses `@iobroker/adapter-core`.
- Entry: `build/main.js` (TypeScript only).
- Config UI: `/admin/` (JSON config), translations in `/admin/i18n/`.
- Metadata: `io-package.json` (states/objects/common), `package.json` (deps/scripts).
- Integration: MQTT communication with Tasmota firmware, external script configuration via OnMessage handler.

## NSPanel Hardware & Firmware Context
- Hardware: Sonoff NSPanel - wall switch with 3.5" touchscreen, 2 relays, temperature/brightness sensors.
- Firmware: Tasmota (alternative firmware) enabling MQTT communication and custom screen interfaces.
- Display: Custom Nextion-like touchscreen interface using NSPanel Lovelace UI firmware.
- Network: Local MQTT broker integration for real-time device communication.

## Tech & Build
- Language: TypeScript only (no JS). Strict typing required.
- Package manager: npm.
- Build: `npm run build` (compiles TypeScript to `/build/`).
- Test: `@iobroker/testing`, mocha/chai/sinon.
- Lint/Format: ESLint + Prettier (keep semicolons, single quotes).
- Dependencies: Includes `mqtt`, `aedes` (MQTT broker), `axios`, `colord`, `node-forge`.

## NSPanel-Specific Architecture
### MQTT Integration
- Built-in MQTT server using `aedes` for local panel communication.
- MQTT client for connecting to external brokers.
- Panel topics: `{panelTopic}/cmnd/`, `{panelTopic}/tele/`, `{panelTopic}/stat/`.
- TFT firmware updates via MQTT commands.

### External Script Configuration  
- Configuration received through `OnMessage` handler in `main.ts` (command: 'ScriptConfig').
- External scripts send complete panel configurations via sendTo interface.
- ConfigManager class processes and validates external script configurations.
- Support for multiple panels with different configurations.

## Adapter Lifecycle (very important)
- Create adapter via `utils.adapter(...)`.
- Implement handlers:
  - `on('ready')`: initialize MQTT server/client, create/extend objects, process panel configurations, set `info.connection`.
  - `on('stateChange')`: react to user-writes, respect `ack` (only act when `ack === false`).
  - `on('message')`: handle external script configurations, TFT updates, weather entity requests.
  - `on('unload')`: clean up MQTT connections, timers/sockets (`clearTimeout/Interval`), HTTP servers.
- Use adapter timers (`adapter.setTimeout/adapter.setInterval`) — not global timers.
- MQTT connection status affects `info.connection` state.

## Objects/States & NSPanel Specifics
- Define objects in `io-package.json` (or extend programmatically).
- Use roles & types correctly (e.g., `value.temperature`, `switch`, `level.dimmer`).
- NSPanel-specific states:
  - Panel states: `panels.{panelName}.info.*` (connection, firmware, etc.)
  - Command states: `panels.{panelName}.cmd.*` (buzzer, tft commands, etc.)
  - Navigation states for card switching and screen control.
- State writes:
  - Use `setStateAsync(id, value, true)` for updates from NSPanel (ack=true).
  - Use `setForeignStateAsync` only when necessary across adapters.
  - Rate-limit MQTT message bursts; never block the event loop.
- Return `null` for “no result” where applicable (project policy).
- Handle boolean states correctly: return `false` instead of `null` if state exists but has no value.

## Logging & Errors
- Use `adapter.log.debug/info/warn/error`. No raw `console.*` in prod code.
- Wrap external I/O in try/catch; never swallow errors.
- Reject promises with Error, not strings.
- On connection changes, set `info.connection` true/false.

## Async Patterns
- Prefer `async/await`. Avoid unhandled promise rejections.
- Do not use long synchronous loops (no CPU blocking).
- For user-provided functions (e.g., compiled via `new Function`), compile once, cache, and sandbox if possible.

## Admin UI & NSPanel Configuration
- Read config from `adapter.config`.
- NSPanel admin uses JSON config format (`jsonConfig.json5`).
- Configuration options include:
  - MQTT server/client settings
  - Panel configurations (topic, IP, etc.)
  - Tasmota admin credentials
  - TFT firmware settings
- Validate required fields at startup; fail fast with clear `error` logs.
- External script configuration via OnMessage handler (command: 'ScriptConfig').
- i18n: Use `/admin/i18n/*/translations.json`. Keys must exist for English at least.

## Testing
- Use `@iobroker/testing` harness:
  - Unit tests for helpers in `/lib`.
  - Integration smoke test: adapter starts, creates mandatory states, sets `info.connection`.
- Mock timers with sinon when needed.

## CI & Scripts  
- `npm test` → runs lint + unit tests.
- `npm run build` → compiles TypeScript to `/build/` directory.
- `npm run lint` → ESLint with NSPanel-specific rules.
- Keep PRs focused; update changelog in `README.md` (not separate CHANGELOG.md).

## Style & Conventions
- Files: `/src/lib/*.ts`, `/admin/*`, `/test/*`.
- Main entry: `/src/main.ts`, compiled to `/build/main.js`.
- Naming: camelCase (vars), PascalCase (classes), UPPER_SNAKE (const).
- No magic numbers; extract to consts in `/src/lib/const/`.
- JSDoc on public functions (short form, matching existing style).
- Strict TypeScript - no `any` without good reason.

## Do / Don’t
**Do**
- Create all objects before first state write.
- Use `extendObjectAsync` to evolve schema.
- Guard network calls with timeouts & retries (backoff).
- Cleanly unsubscribe/close MQTT connections on unload.
- Handle MQTT reconnection gracefully.
- Validate panel configurations before processing.
- Use proper error handling for Tasmota HTTP requests.

**Don’t**
- Don’t write states in tight loops without debounce.
- Don’t act on states with `ack===true` in `stateChange`.
- Don’t block the event loop (no `while(true)`; no sync I/O).
- Don’t introduce new deps casually; prefer stdlib or existing utils.
- Don't ignore MQTT connection failures.
- Don't modify panel firmware without proper validation.

## Common Snippets (NSPanel-specific)
- Set connection:
  ```ts
  await this.setStateAsync('info.connection', true, true);
  ```
- MQTT message handling:
  ```ts
  if (message.topic.includes('/tele/')) {
    // Handle telemetry from NSPanel
  }
  ```
- External script config:
  ```ts
  case 'ScriptConfig': {
    const manager = new ConfigManager(this);
    const result = await manager.setScriptConfig(obj.message);
    // Process configuration...
  }
  ```
- Panel state update:
  ```ts
  await this.setStateAsync(`panels.${panelName}.info.connection`, true, true);
  ```

## NSPanel TypeScript Rules
- TypeScript-only (no JS). Strict mode enabled.
- Follow ioBroker adapter structure & lifecycle.
- Keep changes small and typed; avoid unnecessary abstractions.
- For every fix/feature, add a **short bullet point** to the `README.md` under the `## Changelog` section.
  - Use the existing format with `### **WORK IN PROGRESS**` and `- (author) ...`.
  - Author format: `- (ticaki)`, `- (copilot)`, `- (tt-tom17)`, etc.
- **IMPORTANT**: Any generated code or changes must note if something contradicts the [NSPanel Wiki](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki) or modifies existing documented behavior.

## Documentation References
- [ioBroker adapter development documentation](https://www.iobroker.net/#en/documentation/dev/adapterdev.md)
- [NSPanel Adapter Wiki](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki) - **Primary source for NSPanel-specific behavior**
- Hardware compatibility: Sonoff NSPanel with Tasmota firmware
- UI Design: Based on Home Assistant Lovelace UI principles

## Translation Guidelines
- All user-facing strings must have translations in `/admin/i18n/*/translations.json`.
- At minimum, English (`en`) translations are required.
- Follow existing translation key patterns.
- Card/popup names should be consistent with Lovelace UI terminology.