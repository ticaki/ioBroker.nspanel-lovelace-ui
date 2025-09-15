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
- Initialize PageItems with proper templates and call `await pageItem.init()`.
- Use StatesController for state access for panels.
- Use direct state access for accessed user settings from class Panels or Controller.
- Handle PageItem color themes consistently across all device types.
- Implement proper cleanup in page/pageItem `delete()` methods.
- Use appropriate page types (PageGrid, PageMenu, PageMedia) for different UI layouts.

**Don’t**
- Don’t write states in tight loops without debounce.
- Don’t act on states with `ack===true` in `stateChange`.
- Don’t block the event loop (no `while(true)`; no sync I/O).
- Don’t introduce new deps casually; prefer stdlib or existing utils.
- Don't ignore MQTT connection failures.
- Don't modify panel firmware without proper validation.
- Don't use StatesController for direct user settings that are rarely accessed.
- Don't create PageItems without proper template configuration.
- Don't forget to call `page.delete()` when removing pages.
- Don't mix page types (don't use PageGrid for media controls).
- Don't ignore PageItem type constraints (light, shutter, button, etc.).
- Don't cache state values without respecting the StatesController timespan.

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
- PageItem creation with template:
  ```ts
  const pageItem = new PageItem(
    { id: 'light1', name: 'Living Room Light', adapter: this, panel, dpInit: [] },
    lightTemplate
  );
  await pageItem.init();
  ```
- DataItem with state subscription:
  ```ts
  const dataItem = new Dataitem(this, {
    type: 'triggered',
    mode: 'auto',
    role: 'level.brightness',
    dp: 'hue.0.Livingroom.Lamp.level'
  }, page, statesController);
  ```
- Page configuration:
  ```ts
  const pageGrid = new PageGrid(panelConfig, {
    config: { card: 'cardGrid', items: pageItems },
    items: { card: 'cardGrid', items: itemConfigs }
  });
  await pageGrid.init();
  ```
- StatesController for frequently accessed states:
  ```ts
  // Use for states read by multiple panels
  const state = await statesController.getState('hue.0.livingroom.temperature');
  ```
- Direct state access for user settings:
  ```ts
  // Use for rarely accessed direct user settings
  const dimState = await this.getStateAsync('panels.panel1.cmd.dim.delay');
  ```
- Color handling for Dataitems:
  ```ts
  const onColor = Color.getColorFromDefaultOrReturn(config.colorOn || Color.activated);
  const offColor = Color.getColorFromDefaultOrReturn(config.colorOff || Color.deactivated);
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

## NSPanel Deep Architecture & Page System

### PageItem System (Device Types)
- **PageItem class** (`/src/lib/pages/pageItem.ts`): Base class for all interactive elements on NSPanel screens.
- **Device type templates** (`/src/lib/templates/`): Define behavior for different device types:
  - `light.ts`: Light controls (on/off, dimmer, RGB, hue, brightness sliders)
  - `shutter.ts`: Blind/shutter controls (position, up/down, stop)
  - `button.ts`: Interactive buttons with customizable actions
  - `text.ts`, `number.ts`: Input elements
- **PageItem types**: `'light' | 'shutter' | 'delete' (special type for removing items, not a physical device) | 'text' | 'button' | 'switch' | 'number' | 'input_sel' | 'timer' | 'fan'`
- **State mapping**: PageItems map to ioBroker states via `DataItem` objects with type definitions:
  - `triggered`: React to state changes with specific roles (`level.brightness`, `switch`, etc.)
  - `const`: Static values
  - `internal`: Internal adapter states
- **Color handling**: PageItems have configurable `defaultOnColor`/`defaultOffColor` and support theme-based coloring.

### Page Types & Navigation
- **PageMenu** (`pageMenu.ts`): Base class for scrollable menu pages with navigation arrows.
  - Supports pagination with `step` and `maxItems` properties
  - Handles auto-scrolling and user navigation
  - Arrow controls: `iconLeft/Right`, `iconLeftP/RightP` for different states
- **PageGrid** (`pageGrid.ts`): Grid layout for device controls, extends PageMenu.
  - Card types: `cardGrid` (6 items), `cardGrid2` (8-9 items), `cardGrid3` (4 items)
  - Different layouts based on panel model (`us-p` vs standard)
- **PageMedia** (`pageMedia.ts`): Media player controls with service integration.
  - Supports: Alexa, Spotify, MPD, Sonos
  - Handles: play/pause, volume, track info, artist scrolling
  - Service-specific tools in `/pages/tools/` directory
- **PageEntities** (`pageEntities.ts`): Entity list view for cardEntities (4-5 items).
- **Specialized pages**: PageChart, PageThermo, PageAlarm, PageSchedule, etc.

### Internal State Management
- **StatesController** (`/src/lib/controller/states-controller.ts`): Central state management system.
  - Manages subscriptions to ioBroker states with caching (`timespan` parameter)
  - `triggerDB`: Tracks state changes and triggers affected pages
  - `stateDB`: Local state cache with timestamps
  - `objectDatabase`: Object definitions cache
  - Handles internal states (prefixed with `///`) vs external states
- **DataItem** (`/src/lib/classes/data-item.ts`): Wrapper for individual state access.
  - Compiles read/write functions with user-defined transformations
  - Type validation and role-based behavior
  - Color processing and value transformation
  - Integration with `StatesController` for cached access
- **Panel states structure**:
  - `panels.{panelName}.info.*`: Panel connection, firmware version, model
  - `panels.{panelName}.cmd.*`: Commands (buzzer, TFT updates, navigation)
  - `panels.{panelName}.pages.*`: Page-specific states and data

### Page Item Configuration & Templates
- **Template system**: Predefined device configurations in `/src/lib/templates/`
- **Role-based mapping**: Device templates define roles (`rgbSingle`, `blind`, `text.list`)
- **Data structure**: Each template defines `icon`, `entity1`, `text`, `dimmer`, etc.
- **Dynamic configuration**: PageItems can be configured via external scripts or admin interface
- **Popup handling**: PageItems support popup dialogs for detailed control (light color picker, shutter position)

### Event Handling & Updates
- **Message flow**: MQTT → Controller → Panel → Page → PageItem → State update
- **Update throttling**: Pages have `minUpdateInterval` to prevent excessive updates
- **Event types**: `entityUpd`, button clicks, navigation events
- **Trigger system**: Pages subscribe to relevant states via StatesController
- **Auto-refresh**: Pages can have auto-loop functionality for dynamic content

### Page Configuration Patterns
- **Card-based config**: Each page type has specific configuration schema
- **External script config**: Pages can be configured via OnMessage handler
- **Multi-panel support**: Same page types can run on different panels with different configs
- **Navigation integration**: Pages register with panel navigation system
- **State synchronization**: Page states sync with ioBroker object tree

## Translation Guidelines
- All user-facing strings must have translations in `/admin/i18n/*/translations.json`.
- At minimum, English (`en`) translations are required.
- Follow existing translation key patterns.
- Card/popup names should be consistent with Lovelace UI terminology.