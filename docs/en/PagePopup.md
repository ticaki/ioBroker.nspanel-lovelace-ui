# Page PopupNotify

> **Note:** This is **not** a script page type. Notification popups are not configured as a page in `pages`/`subPages`, but triggered at runtime via a `sendTo` message (`setPopupNotification`) or via the corresponding command states.

From adapter version v0.8.0

<img alt='pagePopup_cmd' src='Pictures/PagePopup/pagePopup_cmd.png'>

All states are always transmitted:

`activate` sends the data to the adapter

An explanation of the states can be found below – only `global` means: send to all panels

- `buttonLeft` has `next` as its default function (infinite carousel) – shown automatically when needed
- `buttonMid` only closes the pagePopup.
- `buttonRight` has `delete` as its default function.

Split for clarity

- `buttonLeft` the `next` function also closes a skipped-over information popup, globally/locally
- `X` closes the popup on the panel where it is pressed. An information popup is removed in the process. An acknowledge popup reappears after 5 minutes.
- `buttonRight` closes/deletes/confirms a global popup for all panels.

### Recommended: sending via a script

Simple:
```
sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', {id: 'test3', headline:'test3', buttonLeft:'next', buttonRight: 'ok',  text:'It is alive!!!'})
```

or the complicated way :)

```
type PagePopupDataDetails = {
             id?: string;
             headline: string;
             text: string;
             panel?: string[];
             priority?: number;
             type?: 'information' | 'acknowledge';
             colorHeadline?: {r:number,g:number,b:number} | string;
             buttonLeft?: string;
             colorButtonLeft?: {r:number,g:number,b:number} | string;
             buttonMid?: string;
             colorButtonMid?: {r:number,g:number,b:number} | string;
             buttonRight?: string;
             colorButtonRight?: {r:number,g:number,b:number} | string;
             colorText?: {r:number,g:number,b:number} | string;
             textSize?: string;
             icon?: string;
             iconColor?: {r:number,g:number,b:number};
             alwaysOn?: boolean;
             buzzer?: boolean | string
         };

const message: PagePopupDataDetails = {
    id: 'test3',
    priority: 49,
    headline:'test3',
    buttonLeft:'next',
    buttonRight: 'ok',
    text:'It is alive!!!',
    type: 'information',
}

sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', message)
```

Popups are basically permanent by default
buttonLeft - buttonMid - buttonRight was already explained above

- **id**: for recognition – any string – if empty, all stored popups are deleted
- **type**: 'information' – pressing 'X' or `buttonRight`/`buttonLeft` deletes the popup / 'acknowledge' – pressing 'X' starts the re-display timer (5 minutes), pressing `buttonRight` deletes it.
- **priority**: 1: highest priority, or <= 0 deletes the popup with the **id**, <= -100 deletes the popups whose **id** starts with it
- **panel**: empty or absent → popup is sent to all panels, or with a value only to the named panels
- **global**: true → popup is treated the same on all panels, false → each panel handles the popup itself
- **alwaysOn**: same effect as on pages
- **textSize**: different text sizes 0–5
- **buzzer**: true/false or a Tasmota buzzer string. Triggered once when shown.

- **text** – **headline** must be specified, otherwise the panel shows **missing text/headline**

- **acknowledge** without a buttonRight value shows an 'Ok' button

### Evaluation states for the popups

<img alt='pagePopup_state' src='Pictures/PagePopup/pagePopup_state.png'>

**id** contains the ID of the message – at the global level the panel precedes it, i.e. panel.id
locally on the panel only the ID is shown

**global** is only written by global popups; locally by all that are shown on the panel.

When a button is pressed, the corresponding button is updated with the ID. For global popups also at the global level.
