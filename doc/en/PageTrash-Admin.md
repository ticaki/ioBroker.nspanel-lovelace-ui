# Trash page – configuration in the admin

The trash page shows the next **waste collection dates**: one line per date with a coloured icon, the type of waste and the date — „today", „tomorrow", the weekday or the date. The dates come from the **ical adapter** or from an uploaded **`.ics` file**.

You create it in the **PageConfig** tab, page type **Trash**.

Contents:
- [Creating the page](#1-creating-the-page)
- [Four or six dates](#2-four-or-six-dates)
- [Where the dates come from](#3-where-the-dates-come-from)
- [Reading in the events and assigning them](#4-reading-in-the-events-and-assigning-them)
- [The six waste types](#5-the-six-waste-types)
- [How a date finds its line](#6-how-a-date-finds-its-line)
- [What appears on the panel](#7-what-appears-on-the-panel)
- [When the dates are refreshed](#8-when-the-dates-are-refreshed)
- [Panel assignment and navigation](#9-panel-assignment-and-navigation)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. On the left pick the page type **Trash**, enter a name, press **+**.

**Headline** is the header line on the panel; empty shows `Trash`.

> The card type is called `cardTrash` internally but never reaches the panel under that name: the adapter builds an entities card from it (with four dates) or a schedule card (with six). That does not matter for the configuration — it only explains why other card types are sometimes mentioned at the panel end.

## 2. Four or six dates

The selection for the number of date lines carries the label **„Layout"** in the interface and offers *4 trash entries* or *6 trash entries*.

> The label is unfortunate: „Layout" suggests the arrangement, while what is meant is the **number of dates**. The proper text only sits in the tooltip (*Number of trash entries on the page*) and is therefore practically invisible.

The number also decides the presentation: with **four** dates there is more room per line (long weekday, four-digit year), with **six** it gets tighter (short weekday, two-digit year).

## 3. Where the dates come from

Under **Import type** there are two ways:

| Choice | What is needed |
|---|---|
| **Import via iCal Adapter State** | A state of the ical adapter holding the table of dates. |
| **Import via .ics file** | A calendar file you upload here. |

**Way 1 — ical adapter.** The field **JSON State** takes the state with the list of dates. What is expected is a list of dates with a date and an event name, the way the ical adapter provides it. Past dates (before today at midnight) are discarded.

> The object picker only shows **states whose ID begins with `ical.`**. If you provide your dates through a script or in `0_userdata`, you will not find your state in the dialog and have to **type the ID into the field by hand** — that works, but nothing tells you so.

> The label *JSON State* reads the same in both languages and does not say that the ical adapter's table of dates is meant.

**Way 2 — `.ics` file.** With **Upload file** you pick a calendar file; the path then enters itself into the field **.ics file including path**. A message names the number of dates found — or reports that none were found. Here too only dates from today on count; they are sorted by date.

> On the way through the ical adapter there is **no sorting** — the order the adapter delivers applies.

## 4. Reading in the events and assigning them

For the card to show anything, it has to know **which event name belongs to which type of waste**. There is a helper for that:

1. **Search events** (or **Select events** on the file way) reads the source and collects all event names occurring in it.
2. The names appear as a list of checkboxes — **at most six** can be selected.
3. **Apply selection** enters them in order into the fields *Trash type 1* to *6*.

> ⚠️ **„Apply selection" overwrites entries of your own.** The function writes into **all six** fields — whatever you entered by hand and is not ticked now is **cleared**. If you have already curated the fields, it is better to add entries by hand than to use the transfer a second time.

> Error messages of this search appear as small notice windows and are **partly German, partly English**, hard-coded — regardless of the language of the admin.

## 5. The six waste types

Below that are **six identically built blocks**, one per type of waste:

| Field | Meaning |
|---|---|
| **Color field *n*** | The colour of the icon — blue for paper, yellow for the recycling bag, grey for residual waste, brown for organic. The defaults are already set along those lines. |
| **Icon field *n*** | The icon. Without one the card uses a calendar. |
| **Trash type *n*** | **The search term** used to assign dates to this line — see [section 6](#6-how-a-date-finds-its-line). |
| **Optional label *n*** | What is **displayed** on the panel when it should differ from the search term. Handy when the calendar delivers „Restabfallbehaelter 240l" but the panel should read „Residual waste". |

> **Six blocks are always shown**, even when „4 trash entries" is set above. Blocks 5 and 6 are then ineffective — there is no hint about it.

## 6. How a date finds its line

This is the core of the configuration and is explained nowhere in the interface:

- For every date the adapter checks whether the event name **contains** the text from **Trash type *n*** — it is a substring search, not an exact match. So „Bio" also matches „Biotonne 14-täglich".
- It is checked **from 1 to 6**, and the **first match wins**. With overlapping terms the order decides: with „Papier" in field 1 and „Altpapier" in field 3, both end up in line 1.
- **Empty fields are skipped.**
- **Dates without a match are discarded** — they do not appear at all.

From this follows the most common cause of an empty card: with **no** waste type entered, not a single date matches and the page stays empty for good. There is no warning for that.

Best practice: pick **short, unambiguous terms** and fetch the exact spelling through *Search events*.

## 7. What appears on the panel

One line per date: icon in the chosen colour, the name (the optional label, otherwise the waste type) and the date.

The date is shown in stages: **today** and **tomorrow** as a word, within the next seven days as a **weekday**, after that as a **date**. With six dates in the short form (short weekday, two-digit year), with four in the long one.

> The words for „today" and „tomorrow" are hard-coded **in English**, while the date format is fixed to **German**. On a German panel it therefore reads „today" above a date in the format `15.11.2026`.

Internally the adapter always keeps up to six dates ready; with the „4" setting the last two are not shown.

## 8. When the dates are refreshed

> The dates are fetched when the adapter starts and after that **once per hour**. So after a change to the configuration the card may keep showing the old dates for up to an hour. If you do not want to wait, restart the instance.

## 9. Panel assignment and navigation

Panel, navigation targets, *Start page*, *Hidden* and *Screensaver behavior* live in the right-hand column, described under [PageConfig – Overview](PageConfig#panel-assignment-and-navigation).
