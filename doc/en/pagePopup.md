# Popups

**Two different things** are called popup in this adapter:

1. **The detail popup of a tile** — light, shutter, thermostat, timer, selection list. It opens from a page
   when you tap a tile, it belongs to that page item, and it is configured there (see
   [recurring dialogs](PageConfig-Dialoge)).
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

## The buttons, the X and the feedback states

| Button | Effect |
|---|---|
| **left** | Moves to the next message. If more than one is waiting and the field is empty, the adapter labels the button *Next* by itself. |
| **middle** | Takes the current message out of the queue and returns to the previous page. |
| **right** | Confirms and deletes. With `type: 'acknowledge'` and no label of its own it reads **`ok`** — the type stays `acknowledge`. |
| **X** | Closes the message on the panel where it was pressed. With `acknowledge` **and** `alwaysOn` it comes back by itself after **five minutes**. |

What was pressed ends up in states — **not** below `cmd`:

- per panel: `…panels.<panel>.pagePopup.id`, `.buttonLeft`, `.buttonMid`, `.buttonRight`
- for all panels together: `nspanel-lovelace-ui.<instance>.pagePopup.id`, `.buttonLeft`, `.buttonMid`,
  `.buttonRight`

> **For the left button this is not quite true:** there the adapter writes the value **with** the panel name
> in front into the **local** state, and does not write the global one at all — for middle and right it is
> the other way round and correct (local the plain `id`, global with the panel name). So a script reacting
> to the left button is better off testing for „ends with my id".

## How it looks on the panel

- **Long text rotates.** If the text does not fit into the lines `textSize` allows, the panel pages through
  it (about 3 seconds per block, shorter when it wraps back to the start).
- **An unknown icon is left out** and the message is sent without one.
- **`alwaysOn: true` keeps the popup open**, otherwise the panel timeout applies and the screensaver takes
  over. Tapping the screensaver brings an open popup back.
