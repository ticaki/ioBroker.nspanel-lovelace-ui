# Screensaver notifications – configuration in the admin

A notification covers the screensaver while a datapoint is “on”: two lines – a headline with an icon and a text below it. It is meant for things that should be noticed without operating the panel: an open window, an alarm, a fault, a value that runs out of range.

They are created through the **bell** in the panel image of the screensaver editor, right next to the gear. All screensavers share **one common list**; the checkbox in each row decides on which screensaver a notification appears. A configuration script is not needed for this.

How the screensaver itself is created is described under [Screensaver – admin](Screensaver-Admin). This page covers the notifications only.

Contents:
- [The list](#1-the-list)
- [Content: headline and text](#2-content-headline-and-text)
- [When to show: datapoints and condition](#3-when-to-show-datapoints-and-condition)
- [Priority: which message the panel shows](#4-priority-which-message-the-panel-shows)
- [Dismissing and the group id](#5-dismissing-and-the-group-id)
- [Buzzer](#6-buzzer)
- [Preview and what the dialog checks](#7-preview-and-what-the-dialog-checks)
- [Saving – what the adapter does with it](#8-saving--what-the-adapter-does-with-it)
- [If something does not look as expected](#9-if-something-does-not-look-as-expected)

## 1. The list

The bell sits in the panel image at the bottom right, left of the gear. The small number on it tells how many notifications are switched on for **this** screensaver. It only works while the instance is running.

A click opens **Notifications** – the common list. Each row shows:

| Element | Meaning |
|---|---|
| **Show on this screensaver** | The checkbox switches the notification on for the screensaver currently open. Without it the notification stays in the list but is sent to no panel. |
| Priority chip | The priority number, see [Priority](#4-priority-which-message-the-panel-shows). |
| Label | The **description**, otherwise the headline, otherwise the text, otherwise the first datapoint. |
| Second line | The datapoints, the condition if there is one, and “dismissible (group id)”. |
| **Also used by: …** | Appears when further screensavers use the same notification. |
| **Edit**, **Duplicate**, **Delete** | Pencil, copy, bin. Duplicate puts the copy right below and keeps the checkbox. |

At the bottom, **Add notification** creates a new one.

> The order in the list is display only: checked ones on top, then by priority, then by the order they were stored in. Which message the panel shows is decided by the priority alone.

> ⚠️ **Editing and deleting affect every screensaver** that uses the same notification. The dialog says so when editing, and asks before deleting – but only when the notification really is used more than once. To change a message for one panel only, **duplicate** it first.

## 2. Content: headline and text

The **content** section fills the two lines the panel displays:

| Field | Effect |
|---|---|
| **Icon in front of the headline** | Icon at the left of the first line. |
| **Headline prefix**, **Headline**, **Headline unit** | The first line, composed in this order. |
| **Text prefix**, **Text**, **Text suffix** | The second line. |
| **Description** | For the list only – it is **not** shown on the panel. |

**Every one of these fields takes either a fixed text or the id of a datapoint** – in the latter case the panel shows its current value. Numbers are formatted the way the panel does it; if the headline has no unit of its own, the adapter appends the unit of the datapoint.

> **Prefix and suffix of the text** stay disabled while **text** is empty – on their own they do not make a line. Anything left in a disabled field is dropped when applying.

> ⚠️ Whether a field counts as text or as a datapoint depends solely on **whether the id actually exists**. A typo in an id silently ends up as text on the panel; there is no warning. The [preview](#7-preview-and-what-the-dialog-checks) is the proof: if the value appears there, the id was recognised.

## 3. When to show: datapoints and condition

| Field | Effect |
|---|---|
| **Datapoint 1, 2, …** | At least one is required. **Add datapoint** appends more; from two rows on, a row can be removed again. |
| **When to show** | Optional expression over `val`, the value of the respective datapoint – for example `val >= 3`. |

The notification appears **while all datapoints listed are “on”** (logical AND). Without a condition the value counts as yes/no directly. With a condition the expression is evaluated for every datapoint; it is a free JavaScript expression, not just a comparison – `val > 9` works as well as `val.length > 0 && val !== 'OFF'`.

> **One condition applies to all** datapoints of the notification. Different conditions per datapoint do not exist – that needs two notifications.

> ⚠️ The condition is **not checked for syntax**. A faulty expression only shows up at runtime: the adapter logs an error and then evaluates the raw value as yes/no.

## 4. Priority: which message the panel shows

The panel shows **one** notification at a time. If several are active, the one with the **lowest priority number** wins; on a tie the order of the common list decides.

- **Priority**: smaller number = higher. Empty means **99**, that is, last.
- The other messages appear once the leading one is no longer active or has been dismissed. There is no sequence of several messages.

## 5. Dismissing and the group id

| Field | Effect |
|---|---|
| **Dismissible** | Tapping the screensaver hides the notification – until its datapoint goes off and on again. |
| **Group id** | Only with the checkbox set. Notifications sharing a group id are dismissed together, and that **on all panels**. |

> ⚠️ **Without** “dismissible” the message stays as long as its datapoints are on – it cannot be tapped away at the panel. For lasting states (an open window) that is intended, for events (a doorbell) usually not.

## 6. Buzzer

Three choices: **off**, **default** (`1,2,3,0xF54`) or **custom sequence**. With “custom”, the field **sequence** is mandatory; it takes the arguments of the tasmota command `Buzzer` in the form *count,on,off,tune*.

The buzzer only sounds **when the displayed notification changes** – not repeatedly while the same message stands. It also stays silent in night mode and when `cmd.isBuzzerAllowed` of the panel is off.

## 7. Preview and what the dialog checks

The preview in the dialog draws the message the way the panel renders it: black box, icon, headline line, text line. Fields holding a valid datapoint id show the **current value**.

> The values are fetched once shortly after typing and read again when the dialog opens – they do **not** follow live.

**Apply** stays disabled until all of these hold:

- at least one **datapoint** is entered,
- there is something to show at all – either **text** or **headline** (its prefix, unit or icon are enough),
- **priority** is a number,
- with **custom sequence**, the sequence is filled in.

The dialog names the reason in a warning line, for example “Nothing to display: fill in the headline (or its prefix, unit, icon) or the text.”

## 8. Saving – what the adapter does with it

The dialog works on a copy: only **apply** in the list writes the changes back, and only **save** in the instance settings makes them permanent – the instance restarts in the process.

- The notifications are kept centrally in **`native.screensaverNotify`**, each with an id of its own. A screensaver only stores the **ids** of the notifications that are to appear on it.
- Older configurations, where notifications were still part of the screensaver entry, are moved into the common list automatically when loading.
- Notifications without a checkmark are kept but sent to no panel.

On the panel this becomes a headline line (icon + prefix + value/text + unit) and the text line below it (prefix + text + suffix). In the script this is `notifyScreensaverEntity`, see [Screensaver](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/screensaver).

## 9. If something does not look as expected

- **The bell is greyed out:** The instance is not running. Notifications can only be edited with a running instance.
- **The id appears on the panel instead of the value:** The id does not exist – then the entry counts as a fixed text. The preview shows it immediately.
- **The message never appears:** All datapoints must be “on” at the same time. A datapoint that does not exist counts as “off” – with several datapoints the message silently disappears. If **only one** datapoint is entered and it is missing, the adapter drops the whole notification and logs an error.
- **A different message than expected appears:** Only one is ever visible – the one with the smallest priority number. An empty priority means 99.
- **The message does not go away:** Without **dismissible** it stays until its datapoints go off.
- **Dismissing affects more than expected:** Notifications sharing a **group id** are hidden together, on other panels as well.
- **The buzzer stays silent:** Night mode, `cmd.isBuzzerAllowed` off – or the displayed message did not change at all.
- **The headline breaks in the wrong place:** The sequence `<sp!it>` must not appear in the text, the adapter splits the lines at it internally. A `~` in the text is replaced by `-`.
- **A change shows up on another screensaver:** The list is shared – see “Also used by” in the row. **Duplicate** first if a different version is needed.
