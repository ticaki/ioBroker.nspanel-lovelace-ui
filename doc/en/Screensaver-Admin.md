# Screensaver – configuration in the admin

The screensaver can be set up without a script: tab **Screensaver** in the instance settings. One entry describes one screensaver – its version, the panels that show it and the items on its places. The editor draws the panel the way the chosen version shows it; every place can be clicked and opens the matching settings. In the adapter the admin entry goes through the same code as the script screensaver (`getScreensaverConfig`), so the result on the panel is identical.

What a screensaver is, which versions exist and how it is configured in the script is described on the German page [Screensaver](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/screensaver). This page covers the admin only.

Contents:
- [Creating a screensaver](#1-creating-a-screensaver)
- [The editor at a glance](#2-the-editor-at-a-glance)
- [Version and panels](#3-version-and-panels)
- [Items: the item dialog](#4-items-the-item-dialog)
- [Templates as items](#5-templates-as-items)
- [Indicators and buttons](#6-indicators-and-buttons)
- [Status icons](#7-status-icons)
- [Time and date](#8-time-and-date)
- [Weather](#9-weather)
- [Options: rotation, swipe, indicator buttons](#10-options-rotation-swipe-indicator-buttons)
- [Saving – what the adapter does with it](#11-saving--what-the-adapter-does-with-it)
- [If something does not look as expected](#12-if-something-does-not-look-as-expected)

## 1. Creating a screensaver

1. Open the instance settings → tab **Screensaver**.
2. On the left type a name into **New screensaver** and click the PLUS. The name must be unique; it only serves the list and the log.
3. The entry appears in the list, the editor opens on the right. A new entry starts as version **Standard** without a panel – the places appear as soon as a panel is chosen (see [Version and panels](#3-version-and-panels)).

The bin on a list entry deletes it (with confirmation). Below the list the **panels without an entry** are named – they keep the screensaver of their script.

## 2. The editor at a glance

![Editor](../Pictures/screensaverAdmin/admin-01-ueberblick.png)

| Element | Meaning |
|---|---|
| **Name** | Name of the entry (can be renamed, must stay unique). |
| **Version** | `Standard`, `Alternate`, `Advanced` or `Easyview` – the card (`screensaver`, `screensaver2`, `screensaver3`) follows from it. The line below names the card and the panel model the places are drawn for. |
| **Panels** | Multi select of the panels showing this screensaver. A panel can have only one. |
| **Panel picture** | The places of the chosen version: **Favorit** (large), **Left**, **Bottom**, **Indicators** (Advanced) or **Alternate**. Dashed with **+** = free (click adds an item), occupied = click edits, drag moves – also between the areas. Every item shows its icon in its color and, as text, the last part of the state id or the template name. |
| **Time**, **Date** | Click opens the dialog for 12h/24h or the date format. |
| **Two icons at the bottom** | The status icons (`mrIcon1`, `mrIcon2`), click opens their dialog; grey = not used. |
| **Gear** | Options: rotation time, swipe gestures, indicator buttons. |
| **Weather** (right) | Weather adapter and its additional items, see [Weather](#9-weather). |
| **Frames of the indicators** | grey = no button, red = button, green = switch, blue = open page (see [Indicators](#6-indicators-and-buttons)). |

The note at the bottom reminds that a panel assigned here gets this screensaver when the adapter starts – instead of the screensaver of its script.

## 3. Version and panels

![Panels](../Pictures/screensaverAdmin/admin-02-panels.png)

- **Panels**: The list shows all panels of the instance (tooltip with topic, IP and model). The **model of the first chosen panel** decides how many places the areas have – `eu` and `us-l` in landscape, `us-p` in portrait with its own layout. If the chosen panels have different models, the editor says which one it draws for. If a panel is listed in two entries, the first one in the list wins; editor and log warn about it.
- **Changing the version**: Items that have no place in the new version are kept and reported at the top – the button **Remove** deletes them at once. Switching back to the old version brings them back.

![Version change](../Pictures/screensaverAdmin/admin-14-version-wechsel.png)

The places per version and model are those of the script (`ScreenSaverConst`): Standard and Easyview have favorit and bottom, Alternate also the alternate place, Advanced additionally left and indicators.

## 4. Items: the item dialog

A click on a free place opens the item dialog, a click on an occupied item edits it. The fields follow the place and the type of the state; a preview at the top right draws the item the way the place shows it.

![New item](../Pictures/screensaverAdmin/admin-03-item-neu.png)

**Source**: *State* (one state with its own fields, like `type: 'script'` in the script) or *Template* (a page item template of the adapter, see [Templates](#5-templates-as-items)).

**State**: Type the id or pick it from the object tree via **…**. It has to be a **state** (`type: state`) – a channel or device is refused with a hint, as is an id that does not exist. As soon as the state is known, the dialog shows name, type and unit as well as the role and reveals the fields that fit the type:

![Item with an on/off state](../Pictures/screensaverAdmin/admin-04-item-datenpunkt.png)

| Type of the state | Fields |
|---|---|
| **boolean** | icon on / off, color on / off, text while true / false |
| **number** | icon (expert mode: an icon list per value range too), fixed color or color scale by value, unit (empty = of the state), factor, decimals |
| date/time (role `date`/`time`) | icon, color, date format (`Intl.DateTimeFormat` options, presets to choose from, expert mode: own JSON) |
| other (string …) | icon, color |

Depending on the place fields are added or dropped: **Bottom** has the **headline** (empty = name of the state), **indicators** show the icon only and have the **action** instead (see [Indicators](#6-indicators-and-buttons)).

**Icon**: An item needs an icon – without one the panel cannot draw it, so the dialog does not allow **Apply**. **Default icons are preset** from the role (and stay editable): the role of the channel above the state counts first (a `light` channel gives the bulb also for its `.ACTUAL`), otherwise the role of the state itself (`value.humidity`, `switch.light`, `sensor.door`, `value.temperature` …). The line "Role: …" names both. If the role knows no icons, please choose one.

**Color**: *fixed colors* (separate on/off for boolean, picker or hex value); for numbers alternatively *color scale by value* (dialog with scale, minimum/maximum, best value, mode – like the page items):

![Number with color scale](../Pictures/screensaverAdmin/admin-05-item-zahl-skala.png)

Third choice *color from a state*: a state whose value is the color – `#rrggbb`, `{"r":…,"g":…,"b":…}` (also as JSON string) or a decimal number. On an on/off state it applies to "on", "off" takes the default color. The state must exist and be a state.

![Color from a state](../Pictures/screensaverAdmin/admin-06-item-farbe-datenpunkt.png)

**Icon per value range** (numbers only): Instead of one fixed icon the item can hold a list "up to value → icon" – the panel then changes the icon with the value. The button **Icon per value…** sits below the icon field in **expert mode**; a list that is already stored is shown with its icons without expert mode too and can be dropped there with the trash button.

![Icon per value range](../Pictures/screensaverAdmin/admin-15-item-icon-wertebereich.png)

- Every row holds an **up to value** and an **icon**. An icon applies **up to and including** its value, above the highest value its icon stays. In the picture: up to 5 `snowflake-thermometer`, up to 18 `thermometer-low`, up to 24 `thermometer`, above that `thermometer-high` – so 23.5 °C shows the middle icon (see the preview).
- **Add entry** appends a row, the trash button on the right removes it. **Sort by value** only tidies the list up – the order does not matter, the adapter sorts the list itself.
- **Apply** stays disabled while a started row is incomplete (every row needs a number **and** an icon); a value used twice is reported – only one of those entries takes effect. An empty list removes the setting.
- The list **replaces the icon** of the field above. Color or color scale, unit, factor and decimals keep working as before.
- In the script this is `ScreensaverEntityIconSelect`; the adapter builds the same read function as on the script path, so the result on the panel is identical.

**Text instead of value** (boolean): Instead of `true`/`false` the panel shows the text for true or false. Each field may also hold the **id of a state** – then its value is shown. An empty field keeps the raw value.

**Visibility** (expert mode): a state that hides the item while `false`, and optionally a condition over `val` (like `ScreensaverEntityEnabled` / `ScreensaverEntityVisibleCondition` in the script). `val` is the value of the item's state – so `val > 0` shows the item for positive values only.

![Item dialog in expert mode](../Pictures/screensaverAdmin/admin-16-item-expertenmodus.png)

The picture shows the same favourite with expert mode switched on (the icon at the bottom left of the admin bar): the button **Icon per value…** sits below the icon field, at the bottom are the visibility state and the condition. Without expert mode both blocks are missing – a stored icon list stays visible nevertheless.

**Remove item** at the bottom left clears the place.

## 5. Templates as items

With the source **Template** a place takes a page item template of the adapter (e.g. `text.clock`, `text.lock`, `script.light`, `shutter.basic`, the `pirate-weather.*` templates). The template brings icon, colors and texts itself, so these fields are not shown.

![Template](../Pictures/screensaverAdmin/admin-07-item-template.png)

- The list of templates comes from the **running adapter** (grouped by prefix). If the instance is not running, the list is empty and the dialog says so.
- Below the selection stand type, expected role and – for adapter templates – the adapter.
- Most templates search their states **below an object**: then a **channel or alias** is chosen (the object tree shows channels, devices and folders), and the dialog names what the template looks for below it (e.g. `.ACTUAL`, `switch.lock | state`). A single state at this spot is reported as a warning.
- Templates without an object (`text.clock`, `text.wlan`, `button.service.*` …) need none – the field is not shown.

This matches `type: 'template'` with `dpInit` in the script.

## 6. Indicators and buttons

The indicators (version Advanced) show an icon only. For them the item dialog has the **action when pressed**:

![Indicator with action](../Pictures/screensaverAdmin/admin-08-indikator-aktion.png)

| Action | Effect | Script |
|---|---|---|
| none | a tap leads to the main page | – |
| **Button (writes true)** | writes `true` into the chosen state | `ScreensaverEntityButton` |
| **Switch (toggles)** | toggles the chosen state between `true` and `false` | `ScreensaverEntitySwitch` |
| **Open page** | opens the chosen page of the instance | `ScreensaverEntityNaviToPage` |

Button and switch need a **writable** state (`common.write`); the dialog checks it and otherwise does not allow applying. All three actions only work when **Indicators act as buttons** is enabled in the [options](#10-options-rotation-swipe-indicator-buttons) – without the option a tap on an indicator leads to the main page. In the panel picture the frame shows the action: red = button, green = switch, blue = page, grey = none.

## 7. Status icons

The two icons in the footer (`mrIcon1`, `mrIcon2`) each follow a state: icon "on" while `true`, otherwise "off", each with its own color. An optional second state is shown as a value next to it (with decimals and unit). Without a state the icon stays unused.

![Status icon](../Pictures/screensaverAdmin/admin-09-statussymbol.png)

## 8. Time and date

Click on the time: **adapter default**, **24 hours** or **12 hours**, with preview.

![Time](../Pictures/screensaverAdmin/admin-10-uhr.png)

Click on the date: format of **weekday**, **month** and **year** (long, short, numeric, 2-digit …). "Global setting" takes the format from the instance settings; a value here applies to this screensaver only. The preview shows the result with today's date.

![Date](../Pictures/screensaverAdmin/admin-11-datum.png)

## 9. Weather

To the right of the panel picture stands the **weather adapter** of this screensaver:

![Weather](../Pictures/screensaverAdmin/admin-12-wetter.png)

- **Global setting** – the weather instance of the instance settings (named in brackets), **No weather**, or one of the installed weather instances.
- With a chosen adapter checkboxes for its **additional items** appear (sunrise/sunset, forecast days, wind …). They are appended after the own items of the **bottom** area; with more items than places the area pages (rotation time) and the editor shows a scrollbar with the number of items.
- The **favorit** shows the current weather as long as no own item lies there – an own item replaces it.

## 10. Options: rotation, swipe, indicator buttons

The gear in the panel picture opens the options:

![Options](../Pictures/screensaverAdmin/admin-13-optionen.png)

- **Rotation time (s)**: areas with more items than places page through; `0` = off (`rotationTime`).
- **Swipe gestures on the screensaver** (`screensaverSwipe`).
- **Indicators act as buttons** (`screensaverIndicatorButtons`) – required for the actions of [Indicators](#6-indicators-and-buttons).

## 11. Saving – what the adapter does with it

**Save** or **Save and close** at the bottom; the instance restarts. On start the adapter looks for the first entry that lists the topic of each panel and builds the screensaver from it – through the same path as the script. The log then says e.g.:

```
Screensaver 'Wohnzimmer' (advanced) from the admin configuration replaces the script screensaver of panel 'NSPanel-Wohnzimmer'
```

- The screensaver of the script is replaced for this panel; panels without an entry keep it.
- Version and rotation time come from the entry; the states `panels.<panel>.cmd.screenSaver.layout` and `…rotationTime` follow it (they do not overwrite the entry).
- An item without icon gets the default icons of its role, without a known role `help-circle-outline` – the dialog does not let it through without icon anyway.
- The stored form lies in `native.screensaverConfig` of the instance (one object per entry).

## 12. If something does not look as expected

- **Everything greyed out:** The instance is not running. The editor works with a running instance only, the template list comes from the running adapter.
- **No places in the panel picture:** No panel chosen yet.
- **Apply stays disabled:** state missing or no state (channel chosen?), no icon, no writable state for button/switch, no valid state for "color from a state" – the dialog names the reason in a yellow line.
- **The icon does not change with the value:** An icon list exists for number states only, and every icon applies up to and including its value – above the highest value its icon stays. Duplicate values are reported by the dialog, only one of them takes effect.
- **Wrong icon preset:** The role of the channel above the state counts first – just change the icon.
- **Panel shows the script screensaver:** The panel is in no entry, or it is in a second entry further down (the first wins) – see the log.
- **Items missing after a version change:** They lie in areas the version does not have (message at the top of the editor); switch the version back or **Remove**.
- **Indicator does not react to its action:** Enable the option **Indicators act as buttons**.
