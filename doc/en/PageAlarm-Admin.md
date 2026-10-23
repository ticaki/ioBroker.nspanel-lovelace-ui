# Alarm and unlock page – configuration in the admin

An alarm page turns the panel into the control unit of an alarm system: four buttons to arm, four to disarm, a PIN pad and status states through which a real system is connected. The same card also serves as an **unlock page** — then it only asks for the PIN and jumps on to a page afterwards.

> **This card type exists in the admin only.** A configuration script rejects it explicitly („is only supported in the admin configuration! Skipped!"). So here there is no second way at all.

Contents:
- [Creating the page](#1-creating-the-page)
- [Operating mode: alarm or unlock](#2-operating-mode-alarm-or-unlock)
- [PIN](#3-pin)
- [The buttons of the alarm page](#4-the-buttons-of-the-alarm-page)
- [States and what they show](#5-states-and-what-they-show)
- [Approved: an intermediate step when switching](#6-approved-an-intermediate-step-when-switching)
- [The `unlock_global` checkbox](#7-the-unlock_global-checkbox)
- [The unlock page and its target](#8-the-unlock-page-and-its-target)
- [The states the adapter creates](#9-the-states-the-adapter-creates)
- [Panel assignment and navigation](#10-panel-assignment-and-navigation)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. On the left pick the page type **Alarm**, enter a name, press **+**.
3. The page appears in the list and the editor opens on the right.

> As with every card type the fields are locked while the instance is not running.

## 2. Operating mode: alarm or unlock
![Editor of the alarm page](../Pictures/pageAlarm/alarm-01-editor.png)


Right below the ID sits **Type** with two choices:

| Choice | Result |
|---|---|
| **Alarm** | The full alarm control: eight buttons, state machine, status states. |
| **Unlock** | Only a PIN prompt and a jump to another page. |

The **unlock page is not a page type of its own** — it is created right here, out of an alarm page. That is why you will not find it in the list when creating a page.

> ⚠️ **A new page has no operating mode yet.** Nothing is preset when creating it: **neither** of the two radio buttons is active, and because the editor shows the further fields per mode, at first you only see ID, type, headline and PIN — the page looks half empty. **Pick the type first**, then the rest appears.
>
> If the type stays unset, the adapter builds the page as an **unlock page** — even though the page type was called „Alarm" when creating it. So if you want an alarm page, you have to click *Alarm* actively.

**Switching later** only hides the fields of the other mode; values you entered stay in the configuration. A checkbox *Approved* or `unlock_global` set earlier therefore keeps working even though you can no longer see it.

**Headline** is the header line on the panel. Creating the page fills in the page name; if it stays empty, the panel shows the page name.

## 3. PIN

The field **PIN** accepts digits only; the eye icon shows them in clear text. The PIN applies to both modes: on the alarm page it protects every button, on the unlock page it is the whole point.

Four peculiarities worth knowing:

- **A page without a PIN cannot be configured here.** An empty field is stored as `0`, and `0` is a valid PIN — so it is still prompted for.
- **Leading zeros are dropped.** The entry is turned into a number: `0123` becomes `123`. If you plan a PIN with a leading zero, you have to choose a different one.
- **There is no length check** — neither a minimum nor a maximum, and no error message.
- **The central service PIN cannot be reached from here.** The adapter knows an encrypted service PIN (field *Service-Pin* in the [global settings](globelSettings)), but uses it only for its own built-in system page. It cannot be referenced in this page's PIN field.

> **The PIN is stored in clear text** in the adapter configuration (`native.pageConfig[].pin`) — unlike the service PIN, which is stored encrypted. Anyone with read access to the ioBroker objects can read it. This is the same point as the WiFi password of the QR page and is being addressed with PR [#782](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/pull/782).

> ⚠️ **After a failed attempt the card locks — and for ever longer.** The waiting time doubles with every failed attempt (2 s, 4 s, 8 s …) and is **not capped**: after ten attempts more than 17 minutes, after sixteen more than 18 hours. The counter is only reset by the correct PIN or by restarting the adapter. While locked, the card shows „Gesperrt für *n* s" and the pad stays dead.

## 4. The buttons of the alarm page

Two columns with four fields each. What you enter is the **text** of the button; which action it triggers is fixed.

| Column | Fields | Appears in state | Effect |
|---|---|---|---|
| **Armed** | Top button, 2. Button, 3. Button, Bottom button | `disarmed` | arms the system (four variants, e.g. „at home" and „away") |
| **Disarmed** | the same four labels | `armed` | disarms the system |

An empty field means: that button does not exist. So you can offer just one variant.

> The four fields of the right column carry **the same labels** in the interface as those of the left — there are no separate texts for „5. Button" to „8. Button". You tell them apart only by the column heading.
>
> Note that the German headings read *Aktivieren* / *Deaktivieren* („arm" / „disarm"), which sounds like a call to action but actually names the **state in which the buttons appear**. The English headings „Armed" / „Disarmed" refer to the other point of reference — the two language versions contradict each other here.

> ⚠️ **The „Disarmed" column is only applied when the „Armed" column is filled as well.** When building the panel page the adapter checks the wrong fields: for the bottom button of the right column it looks at whether the **bottom button of the left** column is filled. If you fill in only the right column, the panel shows **no button at all** in state `armed`, and the only way out of that page is the `.status` state.
>
> **Until this is fixed: always fill in pairs** — for every text in the *Armed* column also one in the same row of the *Disarmed* column.

## 5. States and what they show

The card knows five states. The current one is held by the `.status` state, through which an external system can also dictate the state.

| State | What the card shows | Pad |
|---|---|---|
| `disarmed` | the four buttons of the *Armed* column | free |
| `armed` | the four buttons of the *Disarmed* column | free |
| `arming` | a text button, the card flashes | locked |
| `pending` | the same, on the way back | locked |
| `triggered` | text button with the bell icon `bell-ring` | free |

On start-up the adapter normalises: `pending` becomes `armed`, `arming` becomes `disarmed` — so an intermediate state does not survive a restart.

> ⚠️ **The status texts appear in English.** The adapter is missing the translations for `armed`, `disarmed`, `arming`, `pending`, `triggered` and `locked`; in that case it shows the key itself. So the panel literally reads „arming", „pending", „triggered". Translated are only „locked for" and „unlock". Curiously, another file of the adapter does hold these terms in several languages, but it is not consulted at this point.

## 6. Approved: an intermediate step when switching

With the **Approved** checkbox, switching does not go through right away but via an intermediate state: pressing *arm* puts the card into `arming` and waits for a **confirmation from outside** — somebody writes `true` into the `.approve` state. Only then does it become `armed`. The way back works the same through `pending`.

This is meant for a real system that should report for itself that it is genuinely armed (after checking the door contacts, say). Without the checkbox the card switches directly.

## 7. The `unlock_global` checkbox

> ⚠️ **This checkbox currently shows the key `unlock_global` instead of a label** — the adapter is missing the translation, in every language. It is not a minor setting though, so here is what it does:

The checkbox moves the status states of the page from `panels.<panel>.alarm.<page>` to **`alarm.<page>`** and thereby keeps the state **the same across all panels**. If you show the same alarm page on several panels, that is what you want — otherwise the system is armed on one panel and not on the other.

With only one panel, leave it off. Note: after switching it, the states live **somewhere else** — scripts and visualisations pointing at them have to be adjusted.

## 8. The unlock page and its target
![Unlock mode with the field for the target page](../Pictures/pageAlarm/alarm-02-entsperren.png)


In the **Unlock** mode all buttons fall away. The card shows a lock (`lock-remove`), a pad and the label „unlock". After the correct PIN it jumps to the configured target.

The selection field below offers the pages of this panel; the page itself and the internal system pages (`///…`) are excluded.

> The hint text calls the target **optional** — true, but misleading: **without a target, nothing visible happens after the correct PIN.** The card stays where it is; internally only the status states are briefly cycled. An unlock page without a target is therefore practically ineffective — and no warning is given, neither in the admin nor in the log.

The unlock page is useful as a **gate page**: you set it as the navigation target in front of a page not everyone should operate, and enter the actual page as its target.

## 9. The states the adapter creates

For every alarm page the adapter creates three states, under `panels.<panel>.alarm.<pagename>` (or `alarm.<pagename>`, see [section 7](#7-the-unlock_global-checkbox)):

| State | Type | Meaning |
|---|---|---|
| `.status` | number, writable | The state, with the plain list `disarmed`, `armed`, `arming`, `pending`, `triggered`. **Writable from outside** — this is how an external system reports its state to the panel, and how you get out of a stuck state. |
| `.mode` | text, read-only | The last button event (`A1`…`A4` for arming, `D1`…`D4` for disarming). **This is the connector for your own alarm system:** a script listens here and switches the system accordingly. |
| `.approve` | boolean, writable | The confirmation for [Approved](#6-approved-an-intermediate-step-when-switching). |

So connecting a real system runs through these three states — no states or alias roles are entered in the editor, and none are evaluated.

## 10. Panel assignment and navigation

Panel, navigation targets, *Start page*, *Hidden* and *Screensaver behavior* live in the right-hand column, described under [PageConfig – Overview](PageConfig#panel-assignment-and-navigation).

For an alarm page, **Screensaver behavior** is worth a look: with *Never activate* the page stays put instead of switching to the screensaver after the timeout — useful when the state of the system should remain visible at all times.
