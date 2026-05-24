# PagePower (`cardPower`)

The **PagePower** displays and offsets up to 6 consumers / producers. It depicts the power distribution in your smart home – icons, colour gradients, the speed of the flow direction and the flow direction itself can be configured. You can create several of these pages.

The page is configured **entirely in the admin** via the **PageConfig** tab (page type **Power** / `cardPower`) – including its position in the navigation (**Navigation/Panel** area). An entry in the configuration script is **not required**: once the page *and* its navigation are set in the admin, it appears on the panel without any script reference.

> [!NOTE]
> An older, **separate admin tab "Page Power"** still exists (legacy configuration). It writes the same data (`pagePowerdata`) as the new PageConfig editor. **The PageConfig route is recommended**, because it also handles the navigation and works without a script.

**Content**
+ [How it works](#how-it-works)
+ [Settings in the admin (PageConfig)](#settings-in-the-admin-pageconfig)
    + [Producer / consumer (slots)](#producer--consumer-slots)
    + [Home (centre)](#home-centre)
+ [Navigation / Panel](#navigation--panel)
+ [Optional reference in the script](#optional-reference-in-the-script)

---

## How it works

On the panel the page shows three slots on the left and three on the right (top / middle / bottom) plus the **Home** symbol in the centre (the virtual distribution box / meter) where all power values come together. Each occupied slot displays a consumer or producer with icon, value and an animated flow direction. Producers should flow towards the centre, consumers away from it.

> 🖼️ **Image missing:** Panel view of the power page with Home symbol and flow animation.
> Path: `Pictures/pagePower/panel-power.png`

---

## Settings in the admin (PageConfig)

The general operation of the tab is described under [Page Config](en-PageConfig) and should be read first. In the page-type selector choose **Power**, enter a name that is unique within the whole panel (= `uniqueName`) in the "new page" field and create it with the plus button. The slot layout (three fields left, three right) with the **Home** area in between then appears in the centre.

General page fields (as for all PageConfig pages):

| Field (admin label) | Key | Description |
|---------------------|-----|-------------|
| Unique ID | `uniqueName` | Unique name of the page, unique across the whole adapter. Must match the `uniqueName` in the script when used there. |
| Headline | `headline` | Title of the page (top centre on the panel). |
| Screensaver behaviour | `alwaysOn` | Default timeout / Never activate / Inherit from previous page (see [Navigation / Panel](#navigation--panel)). |
| Hidden | `hidden` | Hides the page when the state `…cmd.hideCards` is `true`. |

> 🖼️ **Image missing:** PageConfig editor of a power page (slot layout + Home).
> Path: `Pictures/pagePower/config.png`

### Producer / consumer (slots)

Clicking a slot opens the **"edit power slot"** dialog:

| Field (admin label) | Description |
|---------------------|-------------|
| **Display name** | Text above the flow display, e.g. which consumer/producer it is. |
| **Icon** | Icon selection via the select field (with search suggestions). |
| **State for power** | State that contains the power (watts). |
| **Decimal places** | Number of decimals displayed, independent of the state. |
| **Unit** | Smallest unit to display. **AutoUnit** raises it once the number becomes four digits (e.g. 999 W → 1 kW). A unit defined in the state takes precedence and overrides the admin selection. |
| **Icon colour** | Fixed icon colour (colour picker). Disabled when "colour depends on value" is active. |
| **Colour depends on value** | Enables the **colour scale** – the icon changes colour depending on the power. |
| **Speed scale** (min/max power) | Value range of the flow animation. At the maximum value the dot runs at 100 % speed; at 0 it stops and gets proportionally faster as the power rises. |
| **Reverse flow direction** | Reverses the animation direction (producers towards the centre, consumers away from it). |

With the **colour scale** active (`colour depends on value`), three values define the gradient from green to red. The value of **best power for colour** decides which value is green:

+ **Example 1** — 0 W green, 100 W red
    + `min power for colour` = 0
    + `max power for colour` = 100
    + `best power for colour` = 0

+ **Example 2** — 0 W red, 100 W green
    + `min power for colour` = 0
    + `max power for colour` = 100
    + `best power for colour` = 100

+ **Example 3** — -50 W red, 0 W green, 100 W red again
    + `min power for colour` = -50
    + `max power for colour` = 100
    + `best power for colour` = 0

### Home (centre)

Home is the central part of the page – the virtual distribution box with its meter. There are two value fields:

+ **House top** (`power_home_top`): The value above the house symbol. Define the state, optionally choose decimal places and unit. Here too a unit from the state overrides the admin selection.
+ **House bottom** (`power_home_bot`): Has two modes.
    + Without **use internal sum (house bottom)** it behaves like *House top* (its own state).
    + With the internal sum enabled it instead shows a sum **calculated internally** from the slot values. Via **slots that count negatively in the sum** you choose which of the six slots are included in that sum.

---

## Navigation / Panel

In the left **"Navigation/Panel"** window the position in the page hierarchy is set under the **"Navigation"** tab. First select the panel or "all", then before (`prev`) or after (`next`) which page the power page should sit.

> [!NOTE]
> Select only one of the fields **Prev** or **Next**. Via **Home** and **Parent** the house symbol resp. up arrow are shown and linked to the selected page.

In the **"Pagedetails"** tab the screensaver behaviour can be set:
+ **Default timeout** → the screensaver activates after the configured time.
+ **never activate** → the page stays visible until you manually switch to the next one.
+ **inherit from previous page** → adopts the setting of the previous page.

---

## Optional reference in the script

If the power page is configured in the admin **including navigation** (**Navigation/Panel** area), **no script entry is needed** – it appears on the panel through the admin configuration alone.

A reference in the script is only useful when the panel navigation is built entirely via the configuration script (instead of the admin navigation area). Then a minimal reference with an identical `uniqueName` suffices; the page content still comes from the admin (`pagePowerdata`). The `PagePower` type inherits the optional navigation parameters from the [page base type](en-ScriptConfig#optional-parameters) (`prev`, `next`, `home`, `parent` …).

```typescript
// Only needed when navigation is set via the script – as a main page under pages
const powerGrid: ScriptConfig.PagePower = {
    type: 'cardPower',
    uniqueName: 'pagename', // must match the name in the admin
};
```

```typescript
// … or as a subpage under subPages
const energyDisplay: ScriptConfig.PagePower = {
    type: 'cardPower',
    uniqueName: 'pagename', // must match the name in the admin
    prev: 'uniqueName of a page',
    home: 'main',
};
```

> [!NOTE]
> Do not position the same `uniqueName` both in the admin **with** navigation and in the script. By default the script page takes precedence and the admin entry with the same name is skipped with a warning.

For more on embedding pages in the script see [ScriptConfig](en-ScriptConfig). An overview of all page types is under [Pages](en-Pages).
