# Power page – configuration in the admin

The power page shows a house in the middle and up to **six energy flows** around it — photovoltaics, grid, battery, heat pump, wallbox. Every flow has an icon, a value and an **animation** whose speed follows the power.

You create it in the **PageConfig** tab, page type **Power**.

Contents:
- [Creating the page](#1-creating-the-page)
- [The grid: six tiles around the house](#2-the-grid-six-tiles-around-the-house)
- [Setting up a flow](#3-setting-up-a-flow)
- [Colour by value: the colour scale](#4-colour-by-value-the-colour-scale)
- [Speed and flow direction](#5-speed-and-flow-direction)
- [The two house values](#6-the-two-house-values)
- [The internal sum](#7-the-internal-sum)
- [What reaches the panel](#8-what-reaches-the-panel)
- [Panel assignment and navigation](#9-panel-assignment-and-navigation)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. On the left pick the page type **Power**, enter a name, press **+**.

**Headline** is the header line on the panel; empty shows the page name.

## 2. The grid: six tiles around the house

The editor shows the card as a **three-by-three grid**: three tiles on the left, three on the right, in the middle at the top **Home top**, in the centre the house icon and below it **Home bottom**.

- **Clicking a tile** opens the *Edit power slot* dialog.
- **The six tiles can be swapped with the mouse** — pick one up and drag it onto another. That way you arrange the flows without entering them again.
- The **bin icon** on a tile clears it again.
- An empty tile shows *(empty - click to configure)*.

**There are always exactly six tiles** — no more, no fewer. Unused ones stay empty.

> Dragging only works with a pointing device and only while the instance is running.

## 3. Setting up a flow

In the *Edit power slot* dialog:

| Field | Meaning |
|---|---|
| **Entity headline** | The label next to the icon. Left empty, it says „Power" with the number of the tile. |
| **Icon** | The icon of the flow, from the icon list. |
| **Power data point** | The measurement. The picker only shows states of type number. **Without it the tile stays empty on the panel** — no warning is given. |
| **Decimal places** | 0, 1 or 2. |
| **Unit** | W, kW or MW — the **smallest** unit from which the adapter scales up automatically. |
| **Icon color** | A fixed colour for the icon. Disabled as soon as the colour scale is active. |

The same state feeds **value and animation** at once.

> **The unit of the state wins.** If the state's `common.unit` holds a unit, it takes precedence over the choice in the dialog.

> **Generation and consumption are not configured**, they follow from the **sign** of the measurement and the checkbox *Reverse flow direction*. The convention is: generators flow **towards the house**, consumers **away from it**. That sentence appears nowhere in the interface — yet it is the key to a coherent display.

> The three dialogs of this page only have **„close"**, no cancel: every entry takes effect on the page immediately. And unlike the main form, the fields stay usable **even with a stopped instance** — a difference that easily misleads.

## 4. Colour by value: the colour scale

With **Color depends on value** the icon is tinted according to the power — green for a good yield, red for heavy draw. Three fields then appear:

| Field | Meaning |
|---|---|
| **minimum power for color** | The lower end of the scale. |
| **maximum power for color** | The upper end. |
| **best value for color** | The value that counts as „good" and gets the middle of the gradient. |

The computation uses a red-green gradient across these three points.

> The fields accept **any** number — it is not checked whether the minimum is below the maximum, and an empty field does not yield a valid value.

> The **icon colour set earlier stays stored**, even while the scale is active and the field appears disabled. Switch the scale off later and the old colour is back.

## 5. Speed and flow direction

The **Speed scale** section controls the animation — it runs faster the greater the power.

| Field | Meaning |
|---|---|
| `powerMinValueForSpeed` | The power from which something starts moving. |
| **Maximum power** | The power at which the animation runs fastest. |
| **Reverse flow direction** | Reverses the direction — for flows whose state carries the sign the other way round. |

> ⚠️ **The first field shows the raw key `powerMinValueForSpeed` instead of a label** — the adapter is missing the translation, in both languages. What is meant is the **minimum power for the speed**, the counterpart of the field below it.

> The label **Maximum power** effectively exists twice: here for the animation, further up as *maximum power for color* for the gradient. They can only be told apart by the section headings *Color scale* and *Speed scale*.

## 6. The two house values

Above and below the house icon sits one value each, configured through the tiles **Home top** and **Home bottom**. Both only know a state, decimal places and a unit — no icon, no name.

Common practice: at the top the current consumption of the house, at the bottom the balance or the feed-in.

> **No name can be shown** next to the house icon. The field for it exists in the data model but is never filled by the adapter, and the interface does not even offer it.

## 7. The internal sum

Instead of a state of its own, **Home bottom** can show a sum of the six flows. Tick **Use internal sum (Home bottom)** for that; the state field disappears and a multiple selection of the tiles *Power 1* to *Power 6* appears instead.

The selected tiles are **added up**, the remaining ones count as zero.

> ⚠️ **The German label says the opposite.** There it reads „Slots, die **negativ** in die Summe gehen" („slots that enter the sum negatively") — in fact the selected tiles enter the sum **unchanged, that is positively**, and all unselected ones as zero. Nothing is negated. The English version („Slots that contribute to the sum") describes it correctly. So when setting it up: **select the tiles that should contribute to the sum.**

> **An empty selection means „all six".** If you tick the box and select nothing, the adapter sums up **all** tiles. So the checkbox immediately delivers a result nobody selected.

## 8. What reaches the panel

The card has a fixed layout: headline, house icon with two values, six flows with icon, name, value and animation. It refreshes at most every two seconds.

> **Six characters are available for the value.** If the space is not enough, the adapter scales up to the next unit by itself and **cuts the decimal places if need be**. The *Decimal places* setting is therefore a wish, not a promise: `1234.5 W` will rather become `1.2 kW`.

## 9. Panel assignment and navigation

Panel, navigation targets, *Start page*, *Hidden* and *Screensaver behavior* live in the right-hand column, described under [PageConfig – Overview](PageConfig#panel-assignment-and-navigation).
