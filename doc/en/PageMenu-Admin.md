# Menu page – configuration in the admin

The menu page is the workhorse card type: a page of **tiles** that switch devices, show values or jump to other pages. Five variants sit behind it — three grids and two lists. You create it in the **PageConfig** tab, page type **Menu page**.

Contents:
- [Creating the page](#1-creating-the-page)
- [The five variants](#2-the-five-variants)
- [Filling the tiles](#3-filling-the-tiles)
- [Rearranging tiles](#4-rearranging-tiles)
- [Copying and pasting tiles](#5-copying-and-pasting-tiles)
- [More entries: pages and paging](#6-more-entries-pages-and-paging)
- [What the tiles show](#7-what-the-tiles-show)
- [Panel assignment and navigation](#8-panel-assignment-and-navigation)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. On the left pick the page type **Menu page**, enter a name, press **+**.
3. The page is created as a **Grid with 6 slots** — you switch the variant afterwards in the editor.

**Headline** is the header line on the panel; left empty, the panel uses the page name.

> The **Unique ID** field discards an **empty** entry and the reserved name `main` **silently**: because the field takes its value from the configuration, the characters you type simply do not appear. That looks like a bug but is intended. For renaming and its pitfalls see [PageConfig – Overview](PageConfig#creating-renaming-and-deleting-pages).

## 2. The five variants

Under **Card type** they sit in two groups:

| Group | Variant | Slots per page | Presentation |
|---|---|---|---|
| **Grid** | Grid (6 slots) | 6 | tiles, three columns |
| | Grid2 (8 slots) | 8, on a **us-p** panel **9** | tiles, four columns (us-p: three) |
| | Grid3 (4 slots) | 4 | tiles, two columns |
| **List** | Entities (4 rows) | 4 | rows, one column |
| | Schedule (6 rows) | 6 | rows, schedule presentation |

**Grids** show large tiles with an icon, **lists** show narrow rows — for many values at once.

> Technically these are **two separate selection groups**. Picking a list only clears the mark among the grids because the other group then has no valid value. It looks like one selection but behaves like two.

**Switching the variant keeps every tile** — even when the new variant has fewer slots. Nothing is deleted and no warning is given: the surplus tiles move onto a second page (see [section 6](#6-more-entries-pages-and-paging)).

**Grid2 and the panel model:** the variant is only available when all assigned panels are of the same model. With mixed models it is disabled, and a Grid2 already set is **reset to Grid automatically** — a notice explains that while the conflict lasts. Without a panel assignment the editor assumes 8 slots; assign a us-p panel later and it becomes 9.

> **With *Entities* the editor swallows one row on a us-p panel.** It always assumes four rows, but the panel shows **five** there. The fifth is only reachable in the editor through an extra page and paging. For Grid2 the model dependency is built in, for Entities it is not.

## 3. Filling the tiles

A click on a **dashed, empty tile** opens the [pageitem configuration](PageConfig-Dialoge#1-pageitem-configuration) — the same dialog every card type uses. That is where you decide whether the tile operates a **device**, jumps to **another page** or switches a **single state**.

A click on an **occupied** tile opens it for editing. The **red bin icon** in the tile clears it again — **without a confirmation and without undo**.

Only on menu pages the dialog offers three extra settings:

| Setting | Effect |
|---|---|
| **Text Size** | Font size 0–5 instead of the default. Note: fonts 0 and 2 cannot show **icons**. |
| **Use Value Instead of Icon** | The tile shows the value as text. |
| **Long press** | A second function on the same tile — either switch a state **or** jump to a page. |

> A gap in the middle of the row is allowed: click an empty tile further back and the item lands exactly there, the tiles before it stay empty. On the panel **those gaps still take up their place** — they are sent along as empty slots. Only gaps **at the end** are dropped.

## 4. Rearranging tiles

Occupied tiles can be **picked up with the mouse and dragged onto another tile**. That works across page boundaries too.

> **Dragging swaps, it does not move.** Drag tile 1 onto tile 5 and the item from 5 then sits in place 1 — the tiles in between do **not** shift up. So rebuilding an order means swapping step by step. The interface says nothing about this.

Dragging needs a pointing device; it is not available on a touch device.

## 5. Copying and pasting tiles

A fully configured tile can be transferred instead of entered again — with a row of similar lamps that is where most of the work is saved.

1. **Right-click** the occupied tile → **Copy item**.
2. **Right-click** the target tile → **Paste item**.

This also works **from one menu page into another**: switch page, right-click, paste.

What you need to know:

- On an **empty** tile the menu opens **only** when something has been copied before. On an occupied tile both entries appear, with *Paste item* greyed out while the clipboard is empty.
- **There is no display of the clipboard.** The only sign that something is in it is that the menu opens on empty tiles.
- **The clipboard belongs to the menu editor.** It survives switching to another **menu** page, but **not** a detour via a page of a different type (thermostat, QR, alarm …) — then it is gone. Reloading the interface clears it as well.
- **Pasting onto an occupied tile overwrites it without asking.** There is no undo.
- **Pasting further back fills the gaps before it with empty tiles** — and those take up their place on the panel.
- **No long press:** without a right-click, copying and pasting are **unreachable**, so they cannot be used on a tablet or phone. There are no keyboard shortcuts like Ctrl+C either.
- **The card type is not checked when pasting.** A tile copied on a grid carries its grid settings (text size, *use value instead of icon*, long press) onto an Entities or Schedule row, where they have no effect.

## 6. More entries: pages and paging

More entries than slots? Then **further pages** are created, and the panel pages through them.

- **Add page** creates another empty page.
- Additional pages also appear **by themselves** as soon as a tile beyond the capacity is filled.
- A separator **Page *n* / *m*** shows where you are; an empty last page can be removed again.
- There is no upper limit on the number of entries.

> **An empty page created with „Add page" is not permanent.** It only lives in the interface: after switching pages, reloading or changing the variant it is gone again. Only a **filled** tile makes a page permanent.

**Scroll mode** — this selection only appears for grid variants **and only when there is more than one page**:

| Choice | Behaviour on the panel |
|---|---|
| **Classic** | The panel pages on, one page at a time. Every slot can be used. |
| **Arrow** | The **last slot of every page** becomes the next-page arrow and is not available for an item. On the last page the arrow wraps back to the first. |

> ⚠️ **Editor and panel diverge here.** As long as the scroll mode has never been touched, **the editor assumes „Arrow"** — so it draws the arrow placeholder and takes one slot per page away from you. When building the page, however, the adapter sets **„Classic"**. On the panel that slot is usable, in the editor it is not. To make it worse: the field is invisible while there is only one page, so it cannot be put right in advance.
>
> **Until this is fixed:** as soon as a second page appears, click the scroll mode **once deliberately** — even if the setting you want already looks selected.

> The adapter knows two further paging settings that the admin does not offer: **half-page paging** (jumps by half a page, grids only) and the mode **`auto`**. Both are only reachable through a configuration script. If you miss one of them, a report to the development team is the right way: <https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues>

## 7. What the tiles show

The label of a tile in the editor follows an order of precedence:

1. the **name** from the pageitem configuration,
2. otherwise the name of the **ioBroker channel** — then shown **grey and italic**, so you can see it was not set by you,
3. otherwise a technical note such as `3: (dimmer)` or `3: [native]`.

A small branch icon marks tiles that **jump to another page**. The tooltip shows the ioBroker ID behind it.

On the panel, unused slots stay empty. How many characters a label takes depends on the font size and the panel model and is not fixed — keep it short when in doubt and check on the panel.

## 8. Panel assignment and navigation

Panel, navigation targets, *Start page*, *Hidden* and *Screensaver behavior* live in the right-hand column, described under [PageConfig – Overview](PageConfig#panel-assignment-and-navigation).

For menu pages the panel assignment matters twice over: it decides not only where the page appears but, through the panel model, also **how many slots** are available and whether the Grid2 variant can be chosen at all.
