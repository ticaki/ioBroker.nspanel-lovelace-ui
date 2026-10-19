# PageConfig – overview

The **PageConfig** tab is where the pages of a panel are built: create them, set them up, assign them to a panel and link them to each other. Everything configured here lives in the adapter configuration — no configuration script is needed for it.

<img alt="The PageConfig tab with panel filter, page type and page list" src="../Pictures/pageConfig/pageconfig-01-uebersicht.png" width="100%"/>

The tab only appears once the MQTT connection is up and at least one panel is set up. The **instance must also be running**: with the adapter stopped, the page type, the create field and the whole right-hand column are greyed out, because the admin asks the running adapter for the existing pages.

## Layout

| Area | Content |
|---|---|
| **Left** | Panel filter, page type, the page list and the link to this documentation. |
| **Middle** | The editor of the selected page — one per card type (see [sub-pages](#sub-pages-per-card-type)). |
| **Right** | **Navigation/Panel**: panel assignment, navigation targets and the page details. The column can be collapsed with the handle. |

## Panel filter

Decides which pages the list shows — it changes nothing in the configuration.

| Choice | Shows |
|---|---|
| **All panels** | Every page, regardless of assignment. |
| **Unassigned** | Pages without a panel assignment. Those are **not reachable** on any panel — this is where to find them again. |
| **&lt;panel name&gt;** | Pages assigned to that panel, plus every page set to *(all)*. |

<img alt="The opened panel filter" src="../Pictures/pageConfig/pageconfig-02-panelfilter.png" width="100%"/>

## Page type

The page type filters the list **and** determines what a click on **+** creates.

<img alt="Choosing the page type" src="../Pictures/pageConfig/pageconfig-03-seitentyp.png" width="100%"/>

- **All** and **Main pages** are filters only — nothing can be created under them, the input field is hidden.
- **Menu page** covers the five menu variants (grid with 6, 8 or 4 cells, entities, schedule); which one it becomes is decided afterwards in the editor.
- The remaining entries — **Alarm**, **QR**, **Power**, **Trash**, **Chart**, **Thermostat (Thermo2)** — are one card type each.

**Main pages** is not a card type of its own but a marker: any page can be the start page (see [page details](#page-details)). In the list it carries the suffix `(main)`.

## Creating, renaming and deleting pages

<img alt="Creating a new page with a page type selected" src="../Pictures/pageConfig/pageconfig-04-seite-anlegen.png" width="100%"/>

**Create:** pick a page type, enter a name in the *New page* field, press **+**. The name is the unique ID of the page: it is how other pages address it in their navigation targets, and how a `navigate` command on a button jumps to it.

- `main` is reserved and will be rejected — the start page is made with the marker, not with the name.
- A name already in use cannot be created, the button stays disabled.
- If the name matches a page that already comes from the configuration script, a note points it out: the admin page then **replaces** the script page of the same name. (A configuration script addresses its pages by that same name — which is why a clash is noticed at all.)

**Rename:** not in the list, but in the editor via the *Unique ID* field. On the start page it is locked while the marker is set.

> ⚠️ **Renaming does not carry the navigation along.** Every *prev*, *next*, *parent* and *home* **of other pages** that pointed at the old name stays as it was and then leads nowhere — the same goes for a `navigate` command on a button and for a reference from the configuration script. After renaming, set every connection to this page again; the [Navigation flow](naviFlow) tab shows which ones they are. And unlike creating, renaming does **not reject a name already in use** — the ID then exists twice. When in doubt it is safer to create the page anew than to rename it.

**Order:** the list is always sorted alphabetically; there is no manual order, and none is needed — what the panel shows follows from the navigation, not from the position in the list.

**Copy:** a whole page cannot be duplicated — but **single page items of a menu page** can: right-click the cell, *copy item*, right-click the target cell, *paste item*. This also works from one menu page into another. The details — including what the clipboard belongs to and what gets overwritten when pasting — are under [Menu page](PageMenu-Admin#5-copying-and-pasting-tiles).

**Delete:** via the bin icon in the row, with a confirmation.

<img alt="Confirmation before deleting a page" src="../Pictures/pageConfig/pageconfig-07-loeschen.png" width="100%"/>

> ⚠️ Deleting does **not clean up references from other pages**. If a *prev*, *next*, *parent* or *home* pointed at the deleted page, that entry stays and leads nowhere. Before deleting, the [Navigation flow](naviFlow) tab shows who points at the page.

## Panel assignment and navigation

The right-hand column decides **on which panel** a page appears and **how it is reached**.

<img alt="Page editor with the Navigation/Panel column" src="../Pictures/pageConfig/pageconfig-05-editor-navigation.png" width="100%"/>

**Assign a panel:** choose a panel in the select field and add it with **+**. There is also the entry **(all)** — the page then applies to every panel, including ones added later. The bin icon next to an assignment removes it again (on a phone tap twice: the first tap only marks it).

> A page **without** a panel assignment is never built and does not exist on the panel. That is the most common reason for "the page is gone" — the *Unassigned* panel filter lists all of them.

**Navigation targets:** there are four fields for the selected panel. They match the swipe gestures on the panel:

| Field | Gesture on the panel |
|---|---|
| **next** | swipe right once |
| **prev** | swipe left once |
| **home** | swipe right twice |
| **parent** | swipe left twice |

The choices are the pages this panel knows about — the page itself is excluded. The **Show system pages** checkbox adds the internal pages (`///…`) to the list; the unlock page `///unlock` is always available.

Worth knowing:

- **The opposite direction is not created automatically.** Setting `next = B` on page A means `prev = A` has to be entered on B as well, otherwise there is no way back.
- A page with no target at all that is not the start page automatically gets `home` pointing at the start page when the configuration is built — an emergency exit, not navigation.
- A ⚠️ on a field means the target does not exist on the panel in question. If a panel has not reported any pages yet (because it has never been online), no warning is shown.
- With the **(all)** assignment, *prev* or *next* has to be set, otherwise the page can only be reached from a button with a `navigate` command. The admin points this out.

## Page details

<img alt="The page details tab" src="../Pictures/pageConfig/pageconfig-06-seitendetails.png" width="100%"/>

| Setting | Meaning |
|---|---|
| **Start page (main)** | The page is published under the ID `main` and replaces the start page of the configuration script. There can only be one per panel — if another one is already set, the checkbox stays disabled and the note names the page in the way. While the marker is set, the name, the panel assignment and the navigation targets are locked: the start page inherits the links of its predecessor. |
| **Hidden** | The page is built but does not appear when swiping through. It stays reachable through a dedicated navigation target or a button. |
| **Screensaver behaviour** | *Default timeout* (the panel's setting), *never activate* (the page stays on screen — an alarm page, for instance) or *take over from the previous page*. |

The third tab of the column (*placeholder*) has no function and is reserved for later settings.

> The tab labels currently show the keys `navigation`, `pagedetails` and `placeholder` instead of their translations — a known point in the admin interface, without consequences for the configuration.

## Saving

The admin collects all page changes in the form; they only take effect on **Save**, and the adapter restarts for it. There is **no warning when leaving the tab** — clicking away unsaved loses the work.

One exception: assigning a panel writes the page name to the panel straight away so that the select lists are complete. That is only a cache of the interface — the page itself is still only created on save.

## Sub-pages per card type

The settings of the individual cards have pages of their own:

- [Menu page](PageMenu-Admin)
- [Alarm and unlock page](PageAlarm-Admin)
- [QR code](PageQR-Admin)
- [Power](PagePower-Admin)
- [Chart](PageChart-Admin)
- [Trash](PageTrash-Admin)
- [Thermostat](PageThermo2-Admin)
- [Recurring dialogs](PageConfig-Dialoge)

The **unlock page** is not a page type of its own: it is made from an alarm page whose editor is switched from *alarm* to the *unlock* mode, together with the target to jump to after the correct PIN.
