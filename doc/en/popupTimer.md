# Timer popup

A page item with a channel of the role `level.timer` is a timer: in the list of a page it shows its name and its time, a tap on it opens the **timer popup** with the fields for minutes and seconds and up to three buttons. Depending on the channel the counting is done by the adapter, by a script of your own, by nobody (an alarm clock with a fixed time) – or the item shows the timer of the screensaver.

The item is created like any other through the [Pageitem Configuration](PageConfig-Dialoge#1-pageitem-configuration): pick a channel with the role `level.timer` as the **ioBroker Channel**. Which states the channel may have is listed in the [alias table](ALIAS#leveltimer). The name in the list and in the popup is the **Name** of the dialog, otherwise the name of the channel, and as a last resort *Timer*.

Contents:
- [Operating modes](#1-operating-modes)
- [States](#2-states)
- [Buttons](#3-buttons)
- [Controlling the internal timer from outside](#4-controlling-the-internal-timer-from-outside)
- [Use the timer of the screensaver](#5-use-the-timer-of-the-screensaver)
- [Display and limits](#6-display-and-limits)
- [Pitfalls](#pitfalls)

## 1. Operating modes

The adapter reads the operating mode of an item from the states of its channel:

| Mode | How the adapter recognises it | Who counts |
|---|---|---|
| **Internal** | no `ACTUAL` | the adapter |
| **External** | `ACTUAL` with the role `value.timer` or `level.timer`, or with the unit `s`, `sec` or `ms` | a script of your own |
| **Alarm clock** | `ACTUAL` with the role `date`, or with another role without a unit of time | nobody – a fixed clock time |
| **From the screensaver** | checkbox **Use the timer of the screensaver** in the item dialog | like the screensaver, see [section 5](#5-use-the-timer-of-the-screensaver) |

A channel with a `SET` only is an internal timer – unless `SET` carries the role `date`, then it is an alarm clock. An external timer or alarm clock with nothing writable and no `STATUS` is a plain time display: the popup shows the time but has no buttons.

## 2. States

| State | Meaning |
|---|---|
| `ACTUAL` | The value that is shown. For an external timer the remaining time in seconds, with the unit `ms` in milliseconds. For an alarm clock a timestamp in milliseconds, shown as the clock time `HH:MM` in local time. |
| `SET` | The adapter writes a time set in the popup here, in the same unit as `ACTUAL`. Without `SET` it writes into `ACTUAL` if that one is writable. For an alarm clock `SET` holds the next point in time of that clock time as a timestamp in milliseconds. |
| `STATUS` | `0` = off, `1` = pause, `2` = running. Needed for an external timer and an alarm clock so that the buttons Start, Pause and On/Off exist – without it the script cannot know that it should count. |
| `STATE` | Becomes `true` when an internal timer runs out and when **Finish** is pressed – never with **Cancel** or **Clear**. |

Values written from outside only count when they are confirmed (`ack`) or the state lies below `0_userdata.0` or `alias.0`.

## 3. Buttons

Which buttons the popup shows and whether the time can be edited depends on the mode and the state:

| Mode and state | Buttons | Time editable |
|---|---|---|
| Internal, no time | **Start** | yes |
| Internal, time set, not started | **Start**, **Cancel** | yes |
| Internal, running | **Pause**, **Cancel**, **Finish** | no |
| Internal, paused | **Continue**, **Cancel** (after editing: **Start**) | yes |
| Internal, expired | **Finish**, display `00:00` | no |
| External, `STATUS` 0 | **Start**, **Clear** | if writable |
| External, `STATUS` 1 | **Continue**, **Clear** | if writable |
| External, `STATUS` 2, time left > 0 | **Pause**, **Cancel**, **Finish** | no |
| External, `STATUS` 2, time left 0 | **Finish**, display `00:00` | no |
| External without `STATUS` | **Clear**, if something is writable | if writable |
| Alarm clock, off | **On** (writes `STATUS` 2) | if writable |
| Alarm clock, on | **Off** (writes `STATUS` 1) | no |
| Alarm clock without `STATUS` | none | if writable |
| From the screensaver, no timer | **Start**, if a free slot is writable | yes, if a start is possible |
| From the screensaver, running or paused | **Cancel** | no |
| From the screensaver, expired | **Finish** | no |
| From the screensaver, not writable | none | no |

Closing the time fields starts nothing. For an external timer and an alarm clock the adapter writes the time to `SET` (or `ACTUAL`) at once; for an internal timer it remembers it and writes it to `SET` as well, if there is one; with *From the screensaver* it only remembers it. Counting begins with **Start** only.

**Cancel** and **Clear** set `STATUS` to 0 and, for an external timer, `SET` and `ACTUAL` to 0; `STATE` is left alone. **Finish** does the same and sets `STATE` to `true` in addition.

## 4. Controlling the internal timer from outside

The internal timer runs inside the adapter, also while its page has never been opened. Through `SET` and `STATUS` it can be controlled from a script:

| Writing | Effect |
|---|---|
| `SET` > 0, timer standing or paused | sets the time, does not start |
| `SET` > 0, timer running | new remaining time, keeps running |
| `SET` = 0 | like **Cancel** |
| `STATUS` = 2 | Start or Continue; with the counter at 0 it takes the time from `SET` |
| `STATUS` = 1 | Pause, if it is running |
| `STATUS` = 0 | Cancel, without `STATE` |

The adapter mirrors every change of its state into `STATUS`. When the time is over, `STATUS` stays at 2 until **Finish** is pressed – like an external timer standing at `ACTUAL` 0 with `STATUS` 2. The remaining time of an internal timer cannot be read from outside. After a restart of the adapter an internal timer is gone; a `STATUS` left over from before is corrected then.

## 5. Use the timer of the screensaver

The checkbox **Use the timer of the screensaver** stands in the Pageitem Configuration for a channel of the role `level.timer` only. Below it says: *The item and its popup show the timer of the screensaver of this panel (time dialog). The states of this channel are not used for it.* Meant is the timer that is set up through the time in the [screensaver editor](screensaver#timer-instead-of-the-clock).

- List and popup show the same timer as the screensaver of this panel – also while it is tapped away there; with slot patterns the slot chosen there right now.
- The states of the channel are not used; the channel only needs the role.
- The checkbox is locked when the screensaver of this panel uses exactly this item as the source of its timer: *Not possible: the screensaver of this panel uses this item as the source of its timer, that would be a circle.*

**Start** writes the data state of the screensaver timer first and then its on/off state. Which value goes into the data depends on the state: the remaining time with the unit `s`, `sec` or `ms` or the role `value.timer` or `level.timer`, an ISO date for a text state, otherwise the end as a timestamp in milliseconds. With slot patterns Start takes the lowest slot whose on/off is not true – without one no start is possible. **Cancel** and **Finish** set the on/off state of the shown slot to false. There is no pause here. If the source of the screensaver is a page item, the checkbox item starts and stops that page item.

If the screensaver of the panel has no complete timer, the log warns once per panel and the item stays without buttons.

## 6. Display and limits

- In the list the time reads `HH:MM:SS`, for an alarm clock `HH:MM`. The popup shows minutes and seconds, at most `99:59`; for an alarm clock hour and minute.
- The two input fields of the panel go up to 59 each, so at most `59:59` can be entered.
- While a timer runs, the list is refreshed every 2 seconds, the open popup every second. That is on purpose – faster, the traffic to the panel piles up.
- The popup stays open while the timer runs, and the panel does not dim, because every refresh resets its sleep counter. That is intended.

## Pitfalls

- **The item has no buttons:** Either nothing is writable and there is no `STATUS` (plain display), or the item uses the timer of the screensaver and that has no complete timer – the log says so once. A circle (the item is the source of the screensaver timer at the same time) leaves the item without buttons as well.
- **The script does not notice the start:** Without `STATUS` there are no Start, Pause and On/Off buttons for an external timer and an alarm clock. Create the state, writable, and read it with `ack`.
- **After a restart the internal timer does not go on.** It lives in the adapter only; whoever needs that counts in the script and hands `ACTUAL` and `STATUS` to the adapter.
- **The popup shows `99:59` although more time is left:** The two fields are limited to 99 minutes; the list shows the full time as `HH:MM:SS`.
- **`STATE` does not come:** Only the end of an internal timer and the button **Finish** set it. **Cancel** and **Clear** are meant not to report an end.
