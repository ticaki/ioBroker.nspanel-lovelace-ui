# Recurring dialogs in PageConfig

The editors of the individual card types look different, but they all fall back on the same dialogs. Once you have understood how the **Pageitem Configuration** works, you will recognise it on every page — be it a menu page, a thermostat page or an alarm page. This page describes those dialogs once and in full; the card type pages link here.

All dialogs share two properties:

- **Clicking next to them does not close them.** They only close through their own buttons — that keeps a half-finished entry from being lost.
- **Their *Apply* does not save anything yet.** It only writes the setting back into the admin's form. Nothing takes effect until **Save** in the PageConfig tab, and the adapter restarts for that (see [PageConfig – Overview](PageConfig#saving)).

Contents:
- [Pageitem Configuration](#1-pageitem-configuration)
- [Picking an object: text field and „…"](#2-picking-an-object-text-field-and-)
- [Value Display Configuration](#3-value-display-configuration)
- [Color Options](#4-color-options)
- [Mode list](#5-mode-list)
- [The configuration check when saving](#6-the-configuration-check-when-saving)

## 1. Pageitem Configuration
![Page item configuration](../Pictures/pageConfigDialoge/dialoge-01-pageitem.png)


This is the dialog behind every single tile of a card. It opens with a **click on the tile** in the editor — on a menu page one of the fields, on the thermostat page one of the nine tiles around the setpoint. Clicking a free tile creates a new pageitem, clicking an occupied one opens the existing one.

At the top, next to the title *Pageitem Configuration*, you can see what you are dealing with: the **role** of the selected channel (`role=dimmer`, `role=socket` …), or *no channel selected*, or *Object not found in ioBroker*.

### What a pageitem should show: the three basic cases

![Page item as navigation to another page](../Pictures/pageConfigDialoge/dialoge-02-navigation.png)

Two checkboxes at the head of the dialog decide which kind of element you get:

| Checkbox | Result |
|---|---|
| neither | **Device.** The pageitem operates an ioBroker channel (an alias or a device with a `role`). The adapter reads from the role which states belong to it and how the tile has to look. |
| **Is a navigation** | **A jump to another page.** Instead of a device you pick a **Target page**. The channel ID may then stay empty — the dialog says so explicitly („Empty ID is allowed (Navigation)"). |
| **Custom button (no alias needed)** | **A single state.** No channel, no alias: the ID has to point directly at a state of `type=boolean`. The dialog checks that and writes underneath what it found — *writeable*, *read-only*, *not a boolean state* or *not a state*. |

With *Is a navigation* ticked, the field **Target page** appears. It lists the pages this panel knows, but it also accepts a freely typed name — handy for a page that does not exist yet, and also the place where a typo goes unnoticed.

### The ioBroker channel and its check marks

![Check mark and plain text next to the channel field](../Pictures/pageConfigDialoge/dialoge-07-pruefzeichen.png)


The field is called **ioBroker Channel**, for a custom button **ioBroker State** instead. The picker behind „…" only offers objects that suit the selected card type.

While and after you type, the admin checks the channel and shows the result **to the left of the field**:

| Mark | Meaning |
|---|---|
| Spinner | The check is still running. |
| Red ✖ | **Missing required datapoints.** The tooltip names them. The role requires states the channel does not have. |
| Red ⚠ | **Duplicate datapoints** — several states of the channel match the same role and the adapter cannot decide. The tooltip names them. |

Below the field there is one more line in plain words: *ok (role=…)* when everything fits, *Object not found in ioBroker*, *Missing ID*, or — when the role is not a known device type — *The object's role is not a recognized device type*. In that last case the pageitem can still be saved, but the panel cannot do anything with it.

The gear icon to the right of the field opens the [Value Display Configuration](#3-value-display-configuration) **for the channel ID itself**. You rarely need that — it is the way to turn a channel into a composed value.

### Name and value display


**Name** is the label of the tile on the panel. If the field stays empty, the helper text below shows what happens instead: either *Suggestion: …* (the name the adapter would derive from the channel) or *Default name will be used*.

The **…** button next to it opens the [Value Display Configuration](#3-value-display-configuration). That turns the label into a **live value** — prefix, number from a state, unit, suffix. Once a value display is set up, its preview appears as faint placeholder text in the name field.

### Further settings, depending on the card type

These fields only appear where they have an effect:

| Field | Visible when | Meaning |
|---|---|---|
| **Heating circuit** | thermostat page only | Assigns the pageitem to one heating circuit, or *(all)* — then it appears on every one. |
| **Text Size** | menu pages only | Font size 0–5 instead of the default. The tooltip lists the six fonts and their quirks: font 0 (size 24) and 2 (32) cannot show **icons** but support special characters of many languages; 1, 3 and 4 can show icons but only a limited character set; 5 (128) is ASCII only. |
| **Use Value Instead of Icon** | menu pages only, not for a custom button | The tile shows the value as text rather than an icon. |
| **Long press** | menu pages only, and only for a navigation, a custom button or `role=button` | A second function on the same tile. |

**Long press** can **either** switch a state **or** jump to a page — never both. That is why the other field disappears as soon as one of them is filled. The state has to be `type=boolean` and `write=true`; the picker only offers such states in the first place.

### Icon and colour for „true" and „false"

Below that there are two identically built columns: **Condition is true** and **Condition is false** — switched on and off, open and closed. Per column:

- **Icon (true)** respectively **Icon (false)**: the icon picker. Left empty, the dialog shows which icon the adapter will use by itself (*Default icon will be used: …*).
- **Color**: without a choice of your own it says *Default color will be used* plus the colour value — the colour taken from the role and the configured [colour theme](colorTheme). **Set color** switches to a colour of your own, **Reset** takes it away again.

That way a page you never styled still looks coherent: every gap is filled by the adapter from role and colour theme.

### The buttons at the foot

| Button | Effect |
|---|---|
| **Color Settings** | Opens the [Color Options](#4-color-options) — a colour gradient across a value range. |
| **Mode list** | Only for the roles `rgbSingle`, `rgb`, `ct`, `hue` and `select`: opens the [mode list](#5-mode-list). |

Both turn **green** as soon as something is configured behind them. So the colour of the button tells you whether it is worth looking inside.

**As a rule only one of the two is there.** For the light roles `rgbSingle`, `rgb`, `ct` and `hue` the colour button is disabled — the default of these page items is `type: 'boolean'`, so a colour across a value range makes no sense; the mode list remains. For every other role it is the other way round: only **Color Settings**. In native mode both disappear.

### Native (expert mode only)

At the bottom left, in expert mode, sits the **Native** toggle. It replaces the whole dialog with the raw JSON of the pageitem. That is the emergency exit for settings that have no interface yet — not the normal way. With invalid JSON, **Save** stays disabled and the error message appears below the field.

> If the dialog is missing something the pageitem would need, the right way is a report to the development team — not a workaround in native mode or in the configuration script: <https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues>

## 2. Picking an object: text field and „…"
![Object selection, pre-filtered to the matching objects](../Pictures/pageConfigDialoge/dialoge-03-objektauswahl.png)


Wherever an ioBroker ID is needed, you find the same pair: a **text field** and next to it the **…** button.

- The text field accepts a typed ID — and for prefix, suffix and mode list also free text.
- **…** opens ioBroker's object picker. It is **pre-filtered**: at each place only those objects can be selected that make sense there — for a long press only writable boolean states, for the selection datapoint of a mode list only strings, for a channel only channels.

The value is taken over when you **leave the field** or press **Enter** — only then does the admin check the ID. If you type and click *Apply* right away, the click itself triggers the check; the dialog waits for it instead of swallowing the click.

## 3. Value Display Configuration
![Value display configuration with preview](../Pictures/pageConfigDialoge/dialoge-04-wertanzeige.png)


This dialog (title *Value Display Configuration*) builds **one** text from several parts, and that is what the panel shows. It sits behind every „…" button next to a name field and behind the value rows of the thermostat page.

**The dialog does not show the same fields everywhere.** At the **name field** of a page item you get value source, prefix, suffix and the **preview** — **unit** and **date format** are missing there. Behind the **gear next to the channel ID** it is the other way round: there you get **unit** and **date format**, but no preview, and the value source itself is read-only. The picture above shows the call from the name field.

| Field | Meaning |
|---|---|
| **Value Source / Value State ID** | The state whose value is shown. If this is not a state but plain text, the text is shown. Below it you see the **detected type** (`number`, `string`, `boolean`) — which further fields appear depends on it. |
| **Unit** | Numbers only — and only at the gear next to the channel ID. Is **filled in automatically** from the state's `common.unit` as soon as you select it. |
| **Prefix** | Text **before** the value — or a state whose value is put in front. |
| **Suffix** | The same **after** the value. |
| **Preview** | Continuously shows the result with the **real current value**. States in prefix and suffix are resolved. |

> The unit appears in the preview **for numbers only**. With a string as the value source it is neither shown nor passed to the panel — if you need a unit there, put it into the suffix.

**Date Format** (its own box, for numbers and strings — likewise only at the gear next to the channel ID): this turns a timestamp into a readable date.

- **Locale** — e.g. `de-DE`. Pre-filled from the browser.
- **Format options (JSON)** — the options of `Intl.DateTimeFormat`, e.g. `{"dateStyle": "short"}`. The field is **checked immediately**: invalid JSON turns it red. Leaving it empty switches date formatting off.
- A **number** is read as a timestamp in milliseconds, a **string** as a date text.

**Delete** (bottom left, only where the calling editor offers it) removes the value display again.

## 4. Color Options
![Colour options with colour preview](../Pictures/pageConfigDialoge/dialoge-05-farboptionen.png)


Title *Color Options*. This turns a numeric value into a colour — an icon that runs from blue to red the warmer the reading gets.

**The three colour fields:** **Color Min**, **Color Max** and **Color Best**. As long as no colour of your own is set, it says *No color* or shows the default colour as a preview, and **Set color** takes exactly that default as a starting point. **Reset** hands the colour back to role and colour theme.

| Field | Meaning |
|---|---|
| **Min Value** / **Max Value** | The value range the colour runs across. Preset to 0 and 100. |
| **Best Value** | Optional. A point inside the range that gets **Color Best** — the target temperature in the middle, for instance. Without it, the field says *no best value*. |
| **Color Mode** | How the colours are computed in between: *Mixed (RGB scaling)*, *Hue (HSV scaling)*, *CIE (Color table)*, *Tri-Gradient (Red-Green)* and *Quad-Gradient (RYGB)*, the two gradients also **anchored**. The default is *Mixed*. |
| **Logarithmic Scaling** | *Linear (none)*, *Log10 to Max* or *Log10 to Min* — for readings that span several orders of magnitude. |

Below sits a **colour preview**: a table of values over coloured cells, computed with exactly the same function that later determines the colour on the panel. Minimum, maximum and the best value are printed bold. The preview only appears once more than 1 lies between min and max.

## 5. Mode list
![Mode list with check and counter](../Pictures/pageConfigDialoge/dialoge-06-modusliste.png)


Title *Mode list (inSel_Alias / modeList)*. This gives a pageitem a **selection list** on the panel — the light scenes of an RGB lamp, for example. The dialog applies to the roles `rgbSingle`, `rgb`, `ct`, `hue` and `select`.

| Field | Meaning |
|---|---|
| **Selection datapoint (inSel_Alias)** | The state of type `string` the selected entry is written to. For the role `select` the field is absent: there the adapter uses the channel's `SET` state, and a note at the top names it. |
| **Modes (one per line)** | The entries, one per line. Blank lines are discarded. |
| **Take list from datapoint** | Fills the list from the state's `common.states`. The button is disabled when no state is selected or it has no `common.states` — the tooltip tells you which of the two. |

**The selection datapoint is checked**, and the result appears as a coloured message in the dialog: *exists, type string, writable* (green), or a warning — *does not exist*, *not a state*, *wrong type*, *not writable*. Saving with a failed check brings up the question **Check failed — apply anyway?**; the way stays open, but not by accident.

**Limits the dialog keeps counting** (below the text field it continuously says „*n* entries, approx. *x* of 900 characters"):

- At most **48 entries** — the adapter drops everything beyond that.
- At most **900 characters** for the whole list — beyond that it is truncated.
- **No `?` inside an entry.** That is how the adapter separates the entries; a `?` in the text cannot be displayed by the panel. The dialog warns and names the entries concerned.
- Every entry is wrapped on the panel into **two lines of 12 characters**, the second one truncated if need be. The character count in the dialog already accounts for that.

> If the state has **its own `common.states`**, the adapter builds the list on the panel directly from them — the mode list then only serves as a fallback should the `states` be missing. The dialog points that out as soon as it finds any.

## 6. The configuration check when saving

**Save** in the Pageitem Configuration does not close the dialog right away. The admin first sends the pageitem **to the running adapter**, which checks it against the card type and reports back what it noticed. That gives three cases:

| Result | What happens |
|---|---|
| No message | The pageitem is taken over, the dialog closes. |
| Notes, no error | A window **Configuration Check** lists them. **Save** takes it over anyway, **Cancel** leads back into the dialog. |
| Error | Window **Configuration Error**, only **Close**. The dialog stays open so you can put it right. |

If states were already detected as missing or duplicated, the button is not called *Save* but **Details…** and is orange — it leads straight into that window.

> **If the adapter is not running**, no check is possible; the dialog then saves without one. So a page passing without complaint means nothing while the adapter is stopped. In the PageConfig tab the editor is greyed out with a stopped adapter anyway (see [PageConfig – Overview](PageConfig)).
