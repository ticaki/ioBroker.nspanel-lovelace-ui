# Copilot Instructions (NSPanel Lovelace UI Adapter)

## Overview
- Purpose: ioBroker adapter for NSPanel Lovelace UI - custom firmware for Sonoff NSPanel touchscreen devices in Lovelace UI design.
- Runtime: Node.js (>= 20). Uses `@iobroker/adapter-core`.
- Entry: `build/main.js` (TypeScript only).
- Config UI: `/admin/` (JSON config), translations in `/admin/i18n/`.
- Metadata: `io-package.json` (states/objects/common), `package.json` (deps/scripts).
- Integration: MQTT communication with Tasmota firmware, external script configuration via OnMessage handler.
- Communication: Keep messages concise; the maintainer prefers short, direct instructions and wants to avoid long explanatory text.

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
- Dependencies: Includes `mqtt`, `aedes` (MQTT broker), `colord`, `node-forge`.

## NSPanel-Specific Architecture
### MQTT Integration
- Built-in MQTT server using `aedes` for local panel communication.
- MQTT client for connecting to external brokers.
- Panel topics: `{panelTopic}/cmnd/`, `{panelTopic}/tele/`, `{panelTopic}/stat/`.
- TFT firmware updates via MQTT commands.




## Admin React (./src-admin) rules

These are mandatory rules for any changes that affect the Admin/React frontend located in `./src-admin`.

1. Use class-based components only
  - All React components under `./src-admin` must be implemented as ES6 classes (no hooks / functional components).

2. All user-visible strings must be translated
  - Any string that can be seen by the user must be passed through the i18n layer (e.g. `I18n.t('key')`).

3. Minimum languages: English and German
  - New or changed translation keys must be added at least to `src-admin/src/i18n/en.json` and `src-admin/src/i18n/de.json`.

4. Build & verify after agent activity
  - After any automated agent change that touches `./src-admin` run the admin build from the repo root and verify output:

```bash
npm run build:admin
```

 - The agent must report the build result and at least check the admin bundle finished without errors.

5. Function return types are not optional
  - Public and internal functions must declare non-optional return types. Avoid `undefined` as an expected success return value.

6. Minimize `as` casting
  - Avoid `as` type casts. Prefer proper typing, type guards, discriminated unions or small helper functions to narrow types.

7. Class template example
  - Classes should follow this pattern (example):

```ts

type NavigationAssignmentPanelProps = {
    /** ... add additional prop fields here ... */
};

interface NavigationAssignmentPanelState extends ConfigGenericState {
    /** ... add additional state fields here ... */
}
```instructions
# Copilot instructions — ioBroker NSPanel Lovelace UI

This file gives short, actionable rules for automated coding agents working on this repository.

Quick start
- Build adapter (TypeScript -> build): `npm run build`
- Build admin UI: `npm run build:admin` (must be run after changes in `src-admin`)
- Run tests: `npm test` (unit + package tests)
- Lint: `npm run lint`

Quick verification / install steps (recommended for automated edits)
- Install root deps and admin UI deps before build (safe default):
  1. Install root deps: `npm ci` (or `npm install` if you need latest installs)
  2. Install admin deps: `npm --prefix src-admin ci` (or `npm --prefix src-admin install`)
  3. Build adapter: `npm run build`
  4. Build admin UI: `npm run build:admin`

When an agent modifies `src-admin`, run the exact sequence above and report both build outputs. If `npm run build:admin` fails, include the admin build stderr and stop — do not commit UI changes that don't build.

Where to look first
- Adapter entry: `src/main.ts` -> compiled to `build/main.js`.
- Core logic & pages: `src/lib/` (pages/, templates/, controller/, classes/).
- Admin UI: `src-admin/` (React class components, i18n under `src-admin/src/i18n`).
- Configs & metadata: `admin/jsonConfig.json5`, `io-package.json`, `package.json`.

Must-follow project rules (automated edits)
- TypeScript-only. Avoid introducing JS files. Keep strict types; avoid `any` unless justified.
- Admin UI: use class-based React components (no hooks). All user-visible strings must use i18n (`I18n.t('key')`).
- New/changed admin translations: update `src-admin/src/i18n/en.json` and `src-admin/src/i18n/de.json`.
- After any automated change to `src-admin`, run `npm run build:admin` and report build success/failure.

Adapter lifecycle & state rules
- Implement adapter lifecycle handlers: `on('ready')`, `on('stateChange')` (ignore `ack===true`), `on('message')`, `on('unload')`.
- Use adapter timers (`adapter.setTimeout/adapter.setInterval`) instead of global timers.
- Set `info.connection` based on MQTT/adapter connectivity.
- Create/extend objects before first state write. Use `setStateAsync(id, value, true)` when acknowledging panel updates.

MQTT / Tasmota integration
- Local broker (aedes) is used for panel communication; external brokers supported via mqtt client.
- Panel topics convention: `{panelTopic}/cmnd/`, `{panelTopic}/tele/`, `{panelTopic}/stat/`.

Key patterns & files to reference in edits
- PageItem system: `src/lib/pages/pageItem.ts` and templates in `src/lib/templates/` (light.ts, shutter.ts, button.ts, text.ts).
- State caching & subscriptions: `src/lib/controller/states-controller.ts` and `src/lib/classes/data-item.ts`.
- Config manager / external scripts: `src/main.ts` (OnMessage 'ScriptConfig').

Coding style & CI
- ESLint + Prettier enforced; prefer semicolons and single quotes. Run `npm run lint` before PRs.
- Add a short bullet under `## Changelog` in `README.md` for every fix/feature (format: `- (author) ...`).

Safety & reviewers
- When changing German docs under `doc/de/` request `@tt-tom17` as reviewer and mention them in the PR description.

Examples (copy-paste friendly)
- Set connection state:
  ```ts
  await this.setStateAsync('info.connection', true, true);
  ```
- Handle ScriptConfig message (in `src/main.ts`):
  ```ts
  case 'ScriptConfig':
    await new ConfigManager(this).setScriptConfig(obj.message);
    break;
  ```

If a change contradicts the NSPanel Wiki or documented behaviour, note this in the PR description.
``` 