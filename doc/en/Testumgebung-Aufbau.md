# Test environment – structure

This page describes what the [test environment](Testumgebung) is made of: where the states come from, how to add your own, how the five panel files are produced and what the unit test guarantees.

Contents:
- [Where the states come from](#1-where-the-states-come-from)
- [Placeholders for times and dates](#2-placeholders-for-times-and-dates)
- [What is created](#3-what-is-created)
- [Role coverage and unit test](#4-role-coverage-and-unit-test)
- [Rebuilding the panel files](#5-rebuilding-the-panel-files)
- [The old script test data](#6-the-old-script-test-data)

## 1. Where the states come from

The single source is **`templates/test-states.json`**. The file ships with the adapter, and the button in the *Developer* tab reads it at runtime — changing it changes the test environment.

| Size | Today |
|---|---|
| Channels | 52 |
| States inside those channels | 191 |
| Single states without an alias | 25 |
| Distinct channel roles | 30 |

Structure of the file:

```json
{
    "version": 1,
    "userdata": "0_userdata.0.NSPanelTest",
    "alias": "alias.0.NSPanelTest",
    "channels": [
        { "id": "Licht.Stehlampe", "role": "dimmer", "name": "Stehlampe",
          "states": { "SET": { "val": 60, "unit": "%" }, "ON_SET": true } }
    ],
    "states": [
        { "id": "Energie.PV", "name": "PV-Erzeugung", "type": "number",
          "role": "value.power", "unit": "W", "val": 4280 }
    ]
}
```

- A **channel** becomes the alias channel `alias.0.NSPanelTest.<id>` with the given role. Each state inside it is created twice: as a value state below `0_userdata.0.NSPanelTest.<id>.<state>` and as an alias state pointing to it.
- **Type, role and write permission** are taken from the adapter's own state table for that channel role. The verbose object form lets you override them: `{ "val": …, "role": …, "type": …, "unit": …, "min": …, "max": …, "states": … }`. The short form (`"ON_SET": true`) is enough when the defaults fit.
- **States** live directly below `userdata` without an alias — power, chart, weather, waste and notification values.

The data is deliberately uneven: for each role **one** channel is richly equipped, further channels of the same role are intentionally sparse. The "Wohnzimmer" thermostat has 15 states, "Bad" six, "Kinderzimmer" and "Schlafzimmer" four each. That exercises the full build-out and the minimal variant at the same time.

## 2. Placeholders for times and dates

Fixed timestamps in a shipped file would be stale immediately. Hence two placeholders that are resolved at creation time:

| Form | Becomes | Used for |
|---|---|---|
| `{{ts:+<n><unit>}}` | timestamp in milliseconds, units `s`, `m`, `h`, `d` | the departure times of the six timetable channels (scheduled and actual) |
| `{{date:+<n>d}}` | local date **inside a text** | the eight collection dates in the JSON state `Abfall.Termine` |

That makes the waste state follow the format of the iCal adapter: `[{"_date":"{{date:+1d}}","event":"Restmüll"}, …]` — eight dates for four waste types.

Both placeholders are only evaluated **when an object is created**. Pressing the button again does not refresh them; the states have to be deleted first.

## 3. What is created

The 52 channels and 25 single states turn into **550 objects**:

| Part | Count |
|---|---|
| Folders below `0_userdata.0.NSPanelTest` (incl. root) | 76 |
| States below `0_userdata.0.NSPanelTest` | 216 |
| Folders below `alias.0.NSPanelTest` (incl. root) | 15 |
| Alias channels | 52 |
| Alias states | 191 |
| **Total** | **550** |

Objects are created in an order that puts every parent before its children. The initial value is written to the value state below `userdata` only, never to the alias — and only when the object is new.

## 4. Role coverage and unit test

The claim "every channel role of the adapter is covered" is not a good intention but a test: `src/lib/tools/test-states.test.ts` loads the shipped file and makes sure that

1. it is consistent in itself — known roles, all mandatory states per role present, no duplicate ids,
2. **every** channel role of the adapter is covered by at least one channel,
3. every alias state has a target that is created in the same run — no alias points into the void.

Right now 30 roles in the test data face 30 roles in the adapter, with no remainder on either side. When a role is added to the adapter, the test fails until the test data follows.

Running it:

```
npm run test:ts
npx mocha --config test/mocharc.custom.json "src/lib/tools/test-states.test.ts"
```

"Role is covered" means a channel of that role exists — not that every state of the role is filled. That is intentional (see [section 1](#1-where-the-states-come-from)).

## 5. Rebuilding the panel files

The five files below `testumgebung/panels/` are **exports from the admin**, not hand-written files. They are produced by `testumgebung/tools/build-panel-configs.ts`:

```
npx tsx testumgebung/tools/build-panel-configs.ts
```

The tool assembles the five panels with all pages, the screensaver and the notifications and writes them straight into the instance object. Afterwards it reports what was written — five panels, 115 pages, five screensavers.

| Requirement | Detail |
|---|---|
| a running **dev-server** | The tool talks to its object database directly and loads the database client from `.dev-server/default/`. Without a dev-server it does not run. |
| instance **`.0`** | The target object is hard-wired. |
| source instead of build | Types and templates come from `src/`, not from `build/`. |

There are neither switches nor a dry run. Replacement is targeted: panels with a `test_*` topic, pages with the same name, screensavers whose name starts with "Test ", and notifications with the same id. Everything else in the instance object stays untouched.

**Manual work follows:** restart the adapter and export each panel in the admin via its tile — only that produces the five JSON files.

> **Worth knowing when changing the adapter:** the tool keeps the adapter's capacity tables — slots per card and per screensaver area — as its **own copy** instead of importing them. Today both sides agree. If a capacity changes in the adapter, the test panels silently drift apart; nothing checks this. So when touching capacities, update this tool as well.

## 6. The old script test data

The `testumgebung/` folder also holds test data for the **script-based** configuration route, that is, for the time before configuring in the admin:

| File | Content |
|---|---|
| `0_userdata.json` | object export of the `0_userdata.0` branch (405 objects) |
| `alias.json` | object export of the `alias.0` branch (338 objects) |
| `Config_Script.ts`, `Global_Script.ts`, `Local_Script.ts` | reference configurations for the JavaScript adapter |

The two JSON files contain object definitions only, no values; they are loaded via **Objects → Import** in the admin. The three scripts are pasted into the JavaScript adapter as a script.

The object exports have been unchanged since September 2025 and are genuinely old. The three scripts, by contrast, are still maintained — they also provide the setup the "navigation error" system page was captured with.
