# Copilot Instructions (ioBroker Adapter)

## Overview
- Purpose: ioBroker adapter to integrate/bridge XYZ.
- Runtime: Node.js (LTS). Uses `@iobroker/adapter-core`.
- Entry: `main.js` (or `build/main.js` for TS).
- Config UI: `/admin/` (`admin.json`/`jsonConfig.json`), translations in `/admin/i18n`.
- Metadata: `io-package.json` (states/objects/common), `package.json` (deps/scripts).

## Tech & Build
- Language: JavaScript (or TypeScript with `tsconfig.json` + `npm run build`).
- Package manager: npm.
- Test: `@iobroker/testing`, mocha/chai/sinon.
- Lint/Format: ESLint + Prettier (keep semi, single quotes).

## Adapter Lifecycle (very important)
- Create adapter via `utils.adapter(...)`.
- Implement handlers:
  - `on('ready')`: create/extend objects, subscribe, connect to services, set `info.connection`.
  - `on('stateChange')`: react to user-writes, respect `ack` (only act when `ack === false`).
  - `on('unload')`: clean up timers/sockets (`clearTimeout/Interval`, close clients).
- Use adapter timers (`adapter.setTimeout/adapter.setInterval`) — not global timers.

## Objects/States
- Define objects in `io-package.json` (or extend programmatically).
- Use roles & types correctly (e.g., `value.temperature`, `switch`, `level.dimmer`).
- State writes:
  - Use `setStateAsync(id, value, true)` for updates from device (ack=true).
  - Use `setForeignStateAsync` only when necessary across adapters.
  - Rate-limit bursts; never block the event loop.
- Return `null` for “no result” where applicable (project policy).

## Logging & Errors
- Use `adapter.log.debug/info/warn/error`. No raw `console.*` in prod code.
- Wrap external I/O in try/catch; never swallow errors.
- Reject promises with Error, not strings.
- On connection changes, set `info.connection` true/false.

## Async Patterns
- Prefer `async/await`. Avoid unhandled promise rejections.
- Do not use long synchronous loops (no CPU blocking).
- For user-provided functions (e.g., compiled via `new Function`), compile once, cache, and sandbox if possible.

## Admin UI & Config
- Read config from `adapter.config`.
- Validate required fields at startup; fail fast with clear `error` logs.
- i18n: Use `/admin/i18n/*/translations.json`. Keys must exist for English at least.

## Testing
- Use `@iobroker/testing` harness:
  - Unit tests for helpers in `/lib`.
  - Integration smoke test: adapter starts, creates mandatory states, sets `info.connection`.
- Mock timers with sinon when needed.

## CI & Scripts
- `npm test` → runs lint + unit tests.
- `npm run build` for TS.
- Keep PRs focused; update `CHANGELOG.md`.

## Style & Conventions
- Files: `/lib/*.js` (or `*.ts`), `/admin/*`, `/test/*`.
- Naming: camelCase (vars), PascalCase (classes), UPPER_SNAKE (const).
- No magic numbers; extract to consts.
- JSDoc on public functions (short form).

## Do / Don’t
**Do**
- Create all objects before first state write.
- Use `extendObjectAsync` to evolve schema.
- Guard network calls with timeouts & retries (backoff).
- Cleanly unsubscribe/close on unload.

**Don’t**
- Don’t write states in tight loops without debounce.
- Don’t act on states with `ack===true` in `stateChange`.
- Don’t block the event loop (no `while(true)`; no sync I/O).
- Don’t introduce new deps casually; prefer stdlib or existing utils.

## Common Snippets (guide Copilot)
- Set connection:
  ```js
  await this.setStateAsync('info.connection', true, true);