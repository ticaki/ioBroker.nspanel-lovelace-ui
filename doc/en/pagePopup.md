# Popups

**Two different things** are called popup in this adapter:

1. **The detail popup of a tile** — light, shutter, thermostat, timer, selection list. It opens from a page
   when you tap a tile, it belongs to that page item, and it is configured there (see
   [recurring dialogs](PageConfig-Dialoge)). The timer popup has a page of its own: [timer popup](popupTimer).
2. **The notification popup** — a page of its own that puts a message on top of everything else. That is
   what this page is about.

> **The notification popup is never created anywhere.** It is a **system page**: every panel gets two of
> them at start — one for the adapter's system messages and one for your own. The admin does not offer this
> page type, and neither does the configuration script. The page is driven **only** by **states** or by
> **`sendTo`**.

Contents:
- [Way 1: the states](#1-way-1-the-states)
- [Way 2: `sendTo`](#2-way-2-sendto)
- [The queue](#3-the-queue)
- [The three buttons, the X and the feedback states](#4-the-three-buttons-the-x-and-the-feedback-states)
- [How it looks on the panel](#5-how-it-looks-on-the-panel)
- [Big icon (from TFT 6.2.0)](#6-big-icon-from-tft-620)
- [Pitfalls](#pitfalls)

## 1. Way 1: the states

Each panel carries a set of fields under
`nspanel-lovelace-ui.<instance>.panels.<panel>.cmd.pagePopup.`. You fill them and then trigger
**`activate`** — only that button reads **all** fields and sends the message off.

| State | Type | Default | Meaning |
|---|---|---|---|
| `id` | string | empty | Name used to recognise the message again. **Empty deletes all** stored popups. |
| `global` | boolean | false | Send to every panel instead of just this one. |
| `activate` | button | — | Triggers the send. |
| `priority` | number | 50 | Smaller = further to the front. **≤ 0 deletes** the popup with this `id`, **≤ −100** every popup whose `id` starts with it. |
| `type` | string | `information` | `information` or `acknowledge`. |
| `headline` / `colorHeadline` | string / json | empty / white | Headline and its colour. |
| `text` / `colorText` | string / json | empty / white | Message text and its colour. |
| `buttonLeft` / `buttonMid` / `buttonRight` (+ `colorButton…`) | string / json | empty / white | Label and colour of the three buttons. |
| `icon` / `iconColor` | string / json | empty | Icon in front of the headline; with `largeIcon` the big icon. |
| `largeIcon` | boolean | false | Show the message with a big icon, see [Big icon](#6-big-icon-from-tft-620). |
| `buttonLeftIcon` / `buttonRightIcon` | string | empty | Only with `largeIcon`: icon on the left/right button. |
| `textSize` | number 1–5 | 3 | Font size, and with it how many lines fit. |
| `buzzer` | boolean | false | One beep when the message appears. |
| `alwaysOn` | boolean | **true** | The popup stays instead of giving way to the screensaver. |

On this path:

- **Empty fields stay empty.** The substitutes *Missing Headline* / *Missing Text* only exist on the
  `sendTo` path.
- **The buzzer can only be on or off here.** A custom Tasmota pattern can only be passed through `sendTo` —
  and it only sounds at all when `cmd.isBuzzerAllowed` is set on the panel.
- **`textSize` only accepts 1 to 5 as a state.** Size 0 is taken by `sendTo` only.

## 2. Way 2: `sendTo`

From a script this is the more convenient way, because everything goes in one call:

```javascript
sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', {
    id: 'test3',
    headline: 'test3',
    buttonLeft: 'next',
    buttonRight: 'oki',
    text: 'It is alive!!!'
});
```

In full, with every field the adapter evaluates:

```typescript
type PagePopupDataDetails = {
    id?: string;                 // missing → 'missing'
    priority?: number;           // missing → 50
    type?: 'information' | 'acknowledge';   // missing → 'information'
    headline: string;            // missing → 'Missing Headline'
    text: string;                // missing → 'Missing Text'
    panel?: string | string[];   // missing → to every panel
    global?: boolean;            // only false switches global off
    colorHeadline?: { r: number; g: number; b: number } | string;
    buttonLeft?: string;
    colorButtonLeft?: { r: number; g: number; b: number } | string;
    buttonMid?: string;
    colorButtonMid?: { r: number; g: number; b: number } | string;
    buttonRight?: string;
    colorButtonRight?: { r: number; g: number; b: number } | string;
    colorText?: { r: number; g: number; b: number } | string;
    textSize?: string;           // 0–5
    icon?: string;
    iconColor?: { r: number; g: number; b: number } | string;
    largeIcon?: boolean;         // true → big icon (from TFT 6.2.0)
    buttonLeftIcon?: string;     // only with largeIcon: name of the icon
    buttonRightIcon?: string;    // only with largeIcon: name of the icon
    alwaysOn?: boolean;          // missing → true
    buzzer?: boolean | string;   // true or a Tasmota pattern
};

const message: PagePopupDataDetails = {
    id: 'test3',
    priority: 49,
    headline: 'test3',
    buttonLeft: 'next',
    buttonRight: 'oki',
    text: 'It is alive!!!',
    type: 'information',
};

sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', message);
```

The colour fields take an `{r,g,b}` object **or** a string such as `#ff0000`. An unusable value silently
falls back to the default colour. If **no panel is online**, the adapter says so in the callback
(`{ error: 'No Panels Online' }`); a panel name that does not exist ends up as an error in the log.

## 3. The queue

Several messages live side by side and are sorted **ascending by `priority`** — the smallest number comes
first. The panel always shows the front one.

> **At most ten popups** are kept per panel; anything beyond that is dropped. Broken JSON is **discarded
> without a word** — no log entry, no reaction on the panel.

## 4. The three buttons, the X and the feedback states

The three buttons are **answer buttons**: label and colour come from `buttonLeft`, `buttonMid`,
`buttonRight` and `colorButton…` (without a colour: left yellow, middle red, right green); a button without a
label is not shown. What a press does is fixed – and different for each button:

| Button | Queue | Afterwards |
|---|---|---|
| **left** | An `acknowledge` message moves **to the end** of the queue ("later again"); an `information` message is done – with `global` on the other panels as well. | The popup shows the next message; if none is left it returns to the previous page. If more than one message is waiting and the field is empty, the adapter labels the button *Next* by itself. |
| **middle** | The message is done – but **only on this panel**; a `global` message stays on the other panels. | The popup closes and returns to the previous page, even if further messages are waiting. |
| **right** | The message is done, with `global` on **all** panels. With `type: 'acknowledge'` and no label of its own it reads **`ok`**. | The popup shows the next message; if none is left it returns to the previous page. |
| **X** | An `information` message is done; an `acknowledge` message stays in the queue and, with `alwaysOn`, comes back by itself after **five minutes**. | Closes the popup only on the panel where it was pressed. |

There is no "clear all" button – a script does that through the fields above: leaving `id` empty and triggering
`activate` empties the whole queue, `priority` ≤ 0 takes the message with this `id` out, ≤ −100 all whose
`id` starts like that (via `sendTo` `{ id: 'test3', priority: -1 }` is enough).

What was pressed ends up in states – **not** below `cmd`:

- per panel, always: `…panels.<panel>.pagePopup.id` gets the `id` of the message, and `.buttonLeft`,
  `.buttonMid` or `.buttonRight` – depending on the button – the `id` as well.
- for all panels together, **only with `global`**: `nspanel-lovelace-ui.<instance>.pagePopup.id` gets
  `<panel>.<id>` (with the name of the panel where it was pressed), `.buttonLeft`/`.buttonMid`/`.buttonRight`
  the plain `id`.

> Up to and including 2.2.0 the **left** button wrote the value with the panel name in front into the local
> state and did not write the global one at all. Since the version after it behaves like the other two – a
> script that tested for "ends with my id" keeps working; one that read the panel name from the local value has
> to switch to the global state.

## 5. How it looks on the panel

- **Long text rotates.** If the text does not fit into the lines `textSize` allows, the panel pages through
  it (about 3 seconds per block, shorter when it wraps back to the start).
- **An unknown icon is left out** and the message is sent without one (warning in the log).
- **`alwaysOn: true` keeps the popup open**, otherwise the panel timeout applies and the screensaver takes
  over. Tapping the screensaver brings an open popup back.

## 6. Big icon (from TFT 6.2.0)

For messages you want to recognise from across the room – toilet occupied, severe weather, washing machine done:
with **`largeIcon: true`** the panel shows the message as a big icon with **one line of text** below it, plus the X
and up to two buttons as vertical columns on the left and right. There is no new interface – it is the fields of
way 1 and way 2 plus `largeIcon`. **Without `largeIcon` everything stays as before**: `icon` is then the small icon
in front of the headline.

| Severe weather with two buttons | Occupied, no buttons | Long text in one line | 24 px in two lines |
|---|---|---|---|
| ![Big orange thunderstorm icon, a green button with a tick on the left, a grey button with an alarm clock on the right, "Unwetterwarnung" below](../Pictures/pageNotify/popupNotify3-01-unwetter.png) | ![Red prohibition sign without buttons, "Besetzt" below](../Pictures/pageNotify/popupNotify3-02-besetzt.png) | ![Washing machine with one button on the right; the text that is too long is cut with ...](../Pictures/pageNotify/popupNotify3-03-waschmaschine.png) | ![With textSize 0 the text is smaller and in two lines](../Pictures/pageNotify/popupNotify3-04-zweizeilig-24px.png) |

It needs a panel with **TFT 6.2.0 or newer** or a web panel. A panel with an older TFT shows the same message the
classic way.

| Field | Meaning |
|---|---|
| **`largeIcon`** | `true` switches on the look with the big icon. |
| **`icon`** / **`iconColor`** | The big icon and its colour (default white). The panel only has the icons of the list below; the web panel shows any. Without a valid icon the info icon `information-outline` appears. |
| **`text`** / **`colorText`** | The text line. Text that is too long is cut with `...`, it does not page. `headline` is not shown here. |
| **`textSize`** | `3` (default) = 48 px and `2` (also `1`) = 32 px, **one** line each; `0` = 24 px in **two** lines. `4` and `5` count as `3`. The upright us-p shows more lines. |
| **`buttonLeftIcon`** / **`colorButtonLeft`** | Left button: icon and background colour. Acts like the left button of section 4. |
| **`buttonRightIcon`** / **`colorButtonRight`** | Right button: icon and background colour. Acts like the right button of section 4. |

Without a button icon a button follows the labels of section 4: if `buttonLeft` has a text, the left button shows
`close-thick`; if `buttonRight` has one (with `acknowledge` automatically `ok`), the right one shows `check-bold`. If
more messages are waiting, the left button shows `arrow-right-bold` ("next"). Otherwise the button is left out.
Button icons that fit: OK `check-bold`, confirm `check-circle-outline`, later `alarm-snooze`, open `door-open` or
`lock-open-variant-outline`, decline `close-thick`.

```javascript
sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', {
    id: 'storm',
    headline: 'Storm',                 // for panels with an older TFT
    text: 'Severe weather warning',
    largeIcon: true,
    icon: 'weather-lightning-rainy',
    iconColor: '#ff8000',
    buttonLeftIcon: 'check-bold',
    colorButtonLeft: '#208020',
    buttonRightIcon: 'alarm-snooze',
    colorButtonRight: '#304850',
    type: 'acknowledge',
});
```

The panel has these big icons (names of the Material Design Icons):
`alert`, `information-outline`, `doorbell`, `package-variant-closed`, `mailbox-up`, `phone-ring`,
`shield-alert`, `alarm-light`, `window-open-variant`, `door-open`, `garage-open`, `ev-station`, `power-socket-de`,
`battery-alert-variant-outline`, `calendar`, `calendar-alert`, `calendar-clock`, `bell-ring`, `trash-can`,
`wifi-off`, `web-off`, `cloud-off-outline`, `lan-disconnect`, `cancel`, `toilet`, `door-closed-lock`,
`weather-rainy`, `weather-lightning`, `weather-lightning-rainy`, `weather-hail`, `weather-pouring`,
`weather-snowy-heavy`, `weather-windy`, `weather-tornado`, `home-flood`, `snowflake-alert`, `sun-thermometer`,
`weather-fog`, `washing-machine`, `tumble-dryer`, `dishwasher`, `washing-machine-alert`, `tumble-dryer-alert`,
`dishwasher-alert`, `fridge-alert`, `water-boiler-alert`, `robot-vacuum-alert`, `radiator-off`, `water-alert`,
`smoke-detector-alert`, `fire-alert`

## Pitfalls

**No big icon without `largeIcon`.** An `icon` on its own stays the small icon in front of the headline – existing
scripts keep working unchanged.

**Older TFT: classic look.** If the panel has no TFT 6.2.0, it shows the message the classic way despite
`largeIcon`. The adapter writes a warning to the log once.

**Without a valid icon the info icon appears.** If `icon` is missing, the name is unknown or the icon is not in the
list of section 6, the panel shows `information-outline` and the adapter warns once in the log. An unknown button
icon is reported as well and replaced by the default icon.

**With the big icon, headline and middle button are missing.** `headline` and `buttonMid` are not shown there.
If you also serve older panels, fill in `headline` anyway.
