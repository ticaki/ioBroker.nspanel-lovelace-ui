# Chart page – configuration in the admin

The chart page draws a measurement over time — as a **column chart** or as a **line chart**. It either fetches the data from a history adapter (InfluxDB, History, SQL) itself, or it takes a ready-made value out of a state.

You create it in the **PageConfig** tab, page type **Chart**.

Contents:
- [Creating the page](#1-creating-the-page)
- [Chart type: columns or line](#2-chart-type-columns-or-line)
- [Data formatting: database or script](#3-data-formatting-database-or-script)
- [Way A: data from a history adapter](#4-way-a-data-from-a-history-adapter)
- [Way B: data from your own states](#5-way-b-data-from-your-own-states)
- [The y-axis and the two-character rule](#6-the-y-axis-and-the-two-character-rule)
- [The time axis](#7-the-time-axis)
- [Colour and labelling](#8-colour-and-labelling)
- [Panel assignment and navigation](#9-panel-assignment-and-navigation)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. On the left pick the page type **Chart**, enter a name, press **+**.
3. The page appears in the list and the editor opens on the right.

**Headline** is the header line on the panel; creating the page fills in the page name, empty shows `Page Chart`.

> As with every card type all fields are locked while the instance is not running — without an explanation.

## 2. Chart type: columns or line

Under **Chart type** there are two choices, and that choice decides more than just the look:

| | **Column chart** | **Line chart** |
|---|---|---|
| Resolution from the database | one average **per hour** | **5-minute grid**, at most 500 points |
| Y-axis | minimum fixed at **0** | spans across the data |
| Handling large numbers | **manual factor** | **automatic** |
| X-axis spacing | labels only | ticks **and** labels set separately |

Rule of thumb: **columns** for daily or hourly totals (consumption per hour), **line** for a progression (temperature).

<img alt='Liniendiagramm am Panel' src='../Pictures/pageChart/Linechart.png' height='230'> <img alt='Säulendiagramm am Panel' src='../Pictures/pageChart/Balkenchart.png' height='230'>

The two pictures show the differences: the **line chart** (left) spans the y-axis across the data — here 11 to 22 °C. The **column chart** (right) always starts at **0** and shows one column per hour. Both axis labels stay **two digits**, which is the limit of the panel (see [section 6](#6-the-y-axis-and-the-two-character-rule)). And the time labels show the spacing: every four hours on the left, at every hour divisible by six on the right.

## 3. Data formatting: database or script

The **Data formatting** choice is the actual switch:

| Choice | Meaning |
|---|---|
| **Database adapter** | The adapter queries a history adapter itself and works out the presentation. This is the way without a script. |
| **Script version** | You deliver axis and values ready-made in two states of your own. For special cases the automatic way does not cover. |

> The labels here are **swapped and confusing**: the choice is called *Data formatting* but decides the **data source**; the field below it is called *data source* but means the **instance of the database adapter**. So read for the function, not the name.

## 4. Way A: data from a history adapter

With **Database adapter** two fields appear.

**data source** (meaning: the instance) lists the running instances of **InfluxDB**, **History** and **SQL**. The editor knows no other history adapters. With no suitable instance active it says *No instance found*.

**data point for values from the database** takes the measurement. The picker only shows **states that are actually being logged in that instance** — a state that is not recorded does not even appear. That is the most useful check in the whole editor.

**Range in hours** sets how far back it draws; the window always ends „now". Default 24.

The adapter requests the data as averages (`getHistory` with `aggregate: average`). If the selected instance is not running, the chart stays empty and there is only a warning in the log.

> **Without an instance or without a state, the page falls back to the script way silently** — and then shows an empty chart, because the script states are empty. There is **no** message in the admin. So if you see an empty chart, first check that both fields are filled.

> **Vanished instance:** if the selected instance is later disabled or removed, the field shows **empty** — but it is still stored. The page then looks unconfigured when it is not.

**Factor for card chart** only exists for the **column chart**. It divides the values before they go to the panel — watts to kilowatts, so the y-axis labels fit into two characters (see [section 6](#6-the-y-axis-and-the-two-character-rule)).

> The field shows `1`, `0.1`, `0.01`, `0.001` — what is meant is a **divisor**: `0.001` means „divide by 1000", so watts → kilowatts. There is no tooltip and the direction cannot be guessed from the label.

## 5. Way B: data from your own states

With **Script version** two different fields appear. Here the adapter computes **nothing** — it passes on whatever is in the states. So you have to produce the panel format yourself:

| Field | Expected content |
|---|---|
| **Data point for ticks** | A **JSON array** with the values of the y-axis. If the content is not an array, it is ignored. |
| **Data point for values** | A **string in panel format** that is passed on unchanged: for the column chart `value^label~value~…`, for the line chart `ticks+labels~position:value~…`. |

Both states are watched — when one changes, the card is redrawn (at most once per minute).

This way is meant for experienced users whose case the automatic way does not fit. **There is no automatic scaling here**: you have to keep to the panel's two-character rule yourself.

## 6. The y-axis and the two-character rule

It pays to know the panel's contract here, because it explains almost every odd-looking chart:

- Values and tick marks go to the panel **multiplied by 10**; the panel divides by 10 again and prints every mark as a **whole number of at most two characters**. 1520 becomes „15".
- The panel spans the axis **exactly across the data** and shows **only marks inside that range**. Extra marks above or below are invisible — so there is no way to give the curve headroom like that.

For the two chart types this means:

**Line chart — does it by itself.** The adapter picks the step as the smallest 1-2-5 value that gives at most five steps across the span, and places marks from the step below the minimum to the step above it. If a mark does not fit into two characters, it **raises the factor in steps of ten** until it does, and appends it to the axis label — „W" becomes `W x10`. Nothing to do for that.

**Column chart — here you have to act.** It computes more simply: minimum always **0**, step derived from the maximum. There is **no** automatic safeguard against labels that are too long — that is what the **Factor for card chart** is for. If the axis shows nonsense, the factor is the first lever.

In neither case is there a setting for minimum, maximum or step of the y-axis.

## 7. The time axis

Two fields, both only in the database way:

| Field | Applies to | Meaning |
|---|---|---|
| **X-axis ticks** | line chart only | Spacing of the ticks in **hours**. Default 2. |
| **X-axis labels** | both | Spacing of the time labels in **hours**. Default 4. |

> For the **column chart** the label spacing works differently than the name suggests: labelled are the columns whose **time of day** is divisible by the value — with 4 that is 0, 4, 8, 12, 16, 20 o'clock. So it is not a spacing „from now", but a grid on the clock.

> The fields accept **any** number greater than zero; there is no upper limit, and `0` or negative values clear the field silently so the default applies again. The old table limited the same fields to 1 to 8 — a good guide for sensible values.

**Range and resolution are linked**, without the editor pointing it out: the line chart fetches at most 500 points, so the 5-minute grid gets coarser from about 42 hours on. The column chart produces one column per hour — for a range of a week that is 168 columns on a narrow display.

## 8. Colour and labelling

**Select color for chart** sets the colour of the curve or the columns; the default is yellow. **y-axis label** is the text next to the axis — that is where the line chart appends its factor when needed.

> There is **one** colour and **one** series per page. The card cannot show several curves in one chart, and accordingly there is no legend — the „legend" consists of the headline and the axis label.

## 9. Panel assignment and navigation

Panel, navigation targets, *Start page*, *Hidden* and *Screensaver behavior* live in the right-hand column, described under [PageConfig – Overview](PageConfig#panel-assignment-and-navigation).

> The **Documentation** link at the bottom left of the tab always leads to the page about the column chart for a chart page — even with a line chart configured. Internally both carry the same card type.
