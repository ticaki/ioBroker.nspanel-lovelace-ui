# Page Alarm (`cardAlarm`)

The **`cardAlarm`** displays an alarm/security panel with a numeric keypad (numpad), a status icon and up to four labelled buttons. It can arm/disarm an alarm system or – as the **Unlock** variant – present a PIN-protected unlock dialog.

The page is configured **entirely in the admin** via the **PageConfig** tab – including its position in the navigation (the **Navigation/Panel** pane). An entry in the configuration script is **not required** for this: once the page *and* its navigation are set in the admin, it appears on the panel without any script reference. (An `items` array set in the script is not evaluated for `cardAlarm` anyway.)

> The **Unlock** variant shares its implementation with the alarm. The dedicated [Page Unlock](en-pageUnlock) page is still under test – only the alarm part is fully described here.

**Content**
+ [How it works](#how-it-works)
+ [Settings in the admin (PageConfig)](#settings-in-the-admin-pageconfig)
    + [Alarm](#type-alarm)
    + [Unlock](#type-unlock)
+ [State machine](#state-machine)
+ [Generated states](#generated-states)
+ [PIN behaviour](#pin-behaviour)
+ [Navigation / Panel](#navigation--panel)
+ [Optional reference in the script](#optional-reference-in-the-script)

---

## How it works

On the panel the `cardAlarm` shows a status icon, a numeric keypad and up to four buttons. Which buttons appear depends on the current state:

- In the **disarmed** state the buttons from the **Activate** block (`button1`–`button4`) are shown. Pressing one arms the system.
- In the **armed** state the buttons from the **Deactivate** block (`button5`–`button8`) are shown. Pressing one disarms the system.
- Buttons whose text is left empty are not shown on the panel.

Icon, icon colour, numpad availability and the flashing effect are set **automatically** per state and are not configurable.

> 🖼️ **Image missing:** Panel view of the alarm page with status icon, numpad and buttons (armed and disarmed).
> Path: `Pictures/cardAlarm/panel-alarm.png`

![Alarm on the panel](Pictures/cardAlarm/panel-alarm.png)

---

## Settings in the admin (PageConfig)

The general handling of the tab is described under [Page Config](en-PageConfig) and should be read first. First choose the page type **Alarm**, enter a unique name in the "new page" field and create it with the plus button. The configuration fields then appear in the centre.

> 🖼️ **Image missing:** PageConfig editor for an alarm page (fields "Unique ID", "Type", "Headline", "Pin", button blocks).
> Path: `Pictures/cardAlarm/config.png`

![Alarm configuration in the admin](Pictures/cardAlarm/config.png)

| Field (admin label) | Key | Type | Description |
|---------------------|-----|------|-------------|
| Unique ID | `uniqueName` | string | Unique page name, unique across the whole adapter. When used in the script it must match the `uniqueName` there. |
| Type | `alarmType` | `'alarm'` \| `'unlock'` | **Alarm** = full alarm system, **Unlock** = PIN unlock (see below). |
| Headline | `headline` | string | Page title (top centre on the panel). |
| Pin | `pin` | number | PIN to be entered on the numpad. `0` or empty = no PIN prompt. Special value `-1` = uses the global admin password (`pw1`). |

### Type Alarm

With `alarmType: 'alarm'` two button blocks and two options appear:

| Field (admin label) | Key | Effect |
|---------------------|-----|--------|
| **Activate** – Top / 2nd / 3rd / Bottom button | `button1`–`button4` | Button texts for the **disarmed** state. A press arms the system (actions `A1`–`A4`); the chosen mode is written to the `.mode` state. |
| **Deactivate** – Top / 2nd / 3rd / Bottom button | `button5`–`button8` | Button texts for the **armed** state. A press disarms the system (actions `D1`–`D4`). |
| Approved | `approved` | boolean | When active, every arm/disarm goes through an external **confirmation** (intermediate states `arming`/`pending`, confirmed via the `.approve` state). Inactive = immediate switching. |
| Global | `global` | boolean | When active the alarm status is kept **across panels** and stored under `alarm.<uniqueName>` (instead of `panels.<panel>.alarm.<uniqueName>`); all panels showing this page share the same status. |

### Type Unlock

With `alarmType: 'unlock'` the eight buttons are dropped. Instead there is a single **Unlock** button (action `U1`) and one extra field:

| Field (admin label) | Key | Effect |
|---------------------|-----|--------|
| Target page on unlock | `setNavi` | string (`uniqueName`) | Optional: after a successful PIN entry the given NSPanel page is opened. Without a value only the internal status is toggled. |

---

## State machine

The alarm page has five states (stored in the `.status` state as numeric index 0–4):

| Index | Status | Meaning | Icon |
|-------|--------|---------|------|
| 0 | `disarmed` | disarmed | `shield-off` (green) |
| 1 | `armed` | armed | `shield-home` |
| 2 | `arming` | being armed (awaiting confirmation) | `shield` (yellow) |
| 3 | `pending` | being disarmed (awaiting confirmation) | `shield-off` (yellow) |
| 4 | `triggered` | triggered | `bell-ring` (red) |

**Without** the *Approved* option: a button press switches directly between `disarmed` and `armed`.

**With** the *Approved* option:
- `disarmed` → press an *Activate* button → `arming` → on `.approve = true` → `armed` (on `.approve = false` back to `disarmed`).
- `armed` → press a *Deactivate* button → `pending` → on `.approve = true` → `disarmed` (on `.approve = false` back to `armed`).

The `triggered` state is set **externally** via the `.status` state (e.g. by an alarm logic); in this state no operation is possible until it is reset externally.

---

## Generated states

The adapter creates one channel per alarm page – for local pages under
`nspanel-lovelace-ui.0.panels.<panelName>.alarm.<uniqueName>`,
for *global* pages under `nspanel-lovelace-ui.0.alarm.<uniqueName>`:

| State | Type | Description |
|-------|------|-------------|
| `.status` | number | Current state as index 0–4 (see table above). Writable – setting it externally changes the panel status (e.g. `4` = triggered). |
| `.mode` | string | Last pressed action (`A1`–`A4` / `D1`–`D4`); for the alarm type indicates the chosen mode. |
| `.approve` | boolean | Confirmation handshake for the intermediate states `arming`/`pending` (only relevant when the *Approved* option is active). |

---

## PIN behaviour

If a PIN is configured it must be entered correctly on the numpad before switching. On a wrong entry the input is locked for an increasing time (exponential backoff: 2^attempts seconds); the panel shows "Locked for *X* s". After a correct entry the failure counter is reset.

The special value `pin = -1` uses the global admin password from the [Global Settings](en-globelSettings) (`pw1`) instead of a dedicated PIN.

---

## Navigation / Panel

In the left "Navigation/Panel" pane, the **"Navigation"** tab sets the position in the page hierarchy. First select the panel or "all", then choose before (`prev`) or after (`next`) which page the alarm page should sit.

> [!NOTE]
> Use only one of **Prev** or **Next**. **Home** and **Parent** show a house icon resp. an up arrow linked to the chosen page.

The **"Page details"** tab controls whether the page is hidden when the state
`nspanel-lovelace-ui.0.panels.<MAC>.cmd.hideCards` is set to `true`, and the screensaver behaviour:
+ **Standard timeout** → screensaver appears after the configured time.
+ **never activate** → page stays visible until you switch manually.
+ **inherit from previous page** → takes over the setting of the previous page.

---

## Optional reference in the script

If the alarm page is configured in the admin **including its navigation** (the **Navigation/Panel** pane), **no script entry is needed** – it appears on the panel from the admin configuration alone.

A reference in the script only makes sense if the panel navigation is built entirely via the configuration script (instead of the admin's navigation pane). In that case a minimal reference with an identical `uniqueName` is enough; the page content still comes from the admin (the `items` array is not evaluated for `cardAlarm`). The `PageAlarm` type inherits the optional navigation parameters from the [page base type](en-ScriptConfig#optional-parameters) (`prev`, `next`, `home`, `parent`, `hiddenByTrigger`, `alwaysOnDisplay` …); `useColor` does not exist here.

```typescript
// Only needed when navigation is set via the script – as a subpage under subPages
const alarmSub: ScriptConfig.PageAlarm = {
    type: 'cardAlarm',
    uniqueName: 'alarm', // must match the name in the admin
    prev: 'main',
    home: 'main',
    items: [],
};
```

> [!NOTE]
> Do not position the same `uniqueName` both in the admin **with** navigation and in the script. By default the script page takes precedence and the admin entry of the same name is skipped with a warning.

More on embedding pages in the script under [ScriptConfig](en-ScriptConfig). Overview of all page types under [Pages](en-Pages).
