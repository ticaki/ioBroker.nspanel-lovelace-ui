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

## Way 1: the states

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
| `icon` / `iconColor` | string / json | empty | Icon in front of the headline. |
| `textSize` | number 1–5 | 3 | Font size, and with it how many lines fit. |
| `buzzer` | boolean | false | One beep when the message appears. |
| `alwaysOn` | boolean | **true** | The popup stays instead of giving way to the screensaver. |

On this path:

- **Empty fields stay empty.** The substitutes *Missing Headline* / *Missing Text* only exist on the
  `sendTo` path.
- **The buzzer can only be on or off here.** A custom Tasmota pattern can only be passed through `sendTo` —
  and it only sounds at all when `cmd.isBuzzerAllowed` is set on the panel.
- **`textSize` only accepts 1 to 5 as a state.** Size 0 is taken by `sendTo` only.

## Way 2: `sendTo`

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

## The queue

Several messages live side by side and are sorted **ascending by `priority`** — the smallest number comes
first. The panel always shows the front one.

> **At most ten popups** are kept per panel; anything beyond that is dropped. Broken JSON is **discarded
> without a word** — no log entry, no reaction on the panel.

## The three buttons, the X and the feedback states

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

## How it looks on the panel

- **Long text rotates.** If the text does not fit into the lines `textSize` allows, the panel pages through
  it (about 3 seconds per block, shorter when it wraps back to the start).
- **An unknown icon is left out** and the message is sent without one.
- **`alwaysOn: true` keeps the popup open**, otherwise the panel timeout applies and the screensaver takes
  over. Tapping the screensaver brings an open popup back.
