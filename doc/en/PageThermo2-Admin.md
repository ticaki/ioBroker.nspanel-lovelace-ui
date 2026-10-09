# Page Thermo2 – configuration in the admin

The thermostat page `cardThermo2` can be created without a script: tab **PageConfig**, page type **Thermostat (Thermo2)**. The editor draws the page the way the panel shows it – every spot of the card can be clicked and opens the matching settings. In the adapter the admin page goes through the same code as the script page, so the result on the panel is identical.

The script configuration (structure, alias roles, data points, `modeList`, `sortOrder` …) is described on the German page [Page Thermo2](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/PageThermo2). This page covers the admin only.

Contents:
- [Creating the page](#1-creating-the-page)
- [The editor at a glance](#2-the-editor-at-a-glance)
- [Heat circuit: data source and headline](#3-heat-circuit-data-source-and-headline)
- [Set temperature: minimum, maximum, step](#4-set-temperature-minimum-maximum-step)
- [Display of the values: icon, color, unit](#5-display-of-the-values-icon-color-unit)
- [Mode display](#6-mode-display)
- [Heat circuit icon](#7-heat-circuit-icon)
- [Page items: adding, moving, free slots](#8-page-items-adding-moving-free-slots)
- [Order of the slots](#9-order-of-the-slots)
- [Saving, panel assignment, navigation](#10-saving-panel-assignment-navigation)
- [If something does not look as expected](#11-if-something-does-not-look-as-expected)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. Click the PLUS in the **Pages** list on the left, choose the type **Thermostat (Thermo2)** and enter a **unique ID** (the page name used by the navigation).
3. The new page appears in the list and the editor opens on the right. A new page has no heat circuit yet – the editor says so and offers the heat circuit dialog (see [Heat circuit](#3-heat-circuit-data-source-and-headline)).

**Panel filter** and **page type** above the list only filter the list.

## 2. The editor at a glance

![Editor](../Pictures/PageThermo2/admin-01-editor.png)

| Element | Meaning |
|---|---|
| **Unique ID** | Page name; locked for the start page (`main`). |
| **Tabs above the panel** | One tab per heat circuit as the panel counts them (an `airCondition` channel gives two tabs: heating and cooling). The **+** on the right adds a circuit (at most 8). |
| **Headline** in the panel | Click → dialog *Heat circuit* (data source, headline, order, remove). |
| **Line 1** (thermometer, actual temperature) and **line 3** (drop, humidity) | Click → dialog *Display of the values* (icon, color, unit). |
| **Big number** (set temperature) | Click → dialog *Set temperature* (minimum, maximum, step). |
| **Mode text** (e.g. MANUAL) | Click → dialog *Mode display* (mode texts). |
| **Nine slots** | The page items in the real order of the panel: four on the left, four on the right, the ninth between − and +. Dashed = free, lock = taken by the adapter (circuit selectors and the buttons generated from the alias), green border = item for this circuit only, blue border = item for all circuits. |
| **Page x/y** with arrows | More than nine entries are paged – like on the panel. |
| **Order of the slots** | The sort order of the slots (`sortOrder`), see [Order](#9-order-of-the-slots). |
| **Add page item** | New item for the selected circuit (same as clicking a free slot). |
| **Heat circuit icon** | Dialog for icon and colors of the circuit selector slots. |

To the right is the usual **Navigation/Panel** section (panel assignment, `prev`/`next`/`parent`/`home`, system pages, *hidden*, *alwaysOn*).

## 3. Heat circuit: data source and headline

Clicking the **headline** opens the dialog of the selected circuit, the **+** above the panel the dialog for a new one.

![Heat circuit](../Pictures/PageThermo2/admin-02-heizkreis.png)

**Data source – alias channel:** a channel with the role `thermostat` or `airCondition` (see the [alias table](ALIAS)). Type the ID or pick it with **…** from the object tree; the tree shows channels, devices and folders.

![Object selection](../Pictures/PageThermo2/admin-04-objektauswahl.png)

Right after the selection the editor checks the channel and shows its **role** and the **buttons the adapter generates from the data points of the alias** (MODESET or AUTOMATIC/MANUAL/OFF, POWER, BOOST, WINDOWOPEN, PARTY, MAINTAIN, UNREACH, LOWBAT, ERROR, VACATION, WORKING – each only if the data point exists). These buttons take the first slots and carry a lock in the mock; they cannot be changed here. A channel with another role, or a missing object, is flagged:

![Wrong role](../Pictures/PageThermo2/admin-05-falsche-rolle.png)

**Data source – single data points:** instead of an alias the data points are given directly – **set temperature** (writable), **actual temperature**, optional **humidity** and **mode** (number or text). In this mode the adapter generates no buttons from an alias.

**Headline:** empty = `common.name` of the channel. An `airCondition` channel has an additional **cooling headline** for its second tab.

**Move left / Move right** changes the order of the circuits (and thus the numbers of the selector slots), **Remove heat circuit** deletes it together with the items bound to it only. Moving a circuit takes its items along.

**Apply** is possible only with a plausible data source: an alias channel with a matching role, or set and actual data point. A new circuit is created with *Apply* only – *Cancel* leaves nothing behind.

![New heat circuit](../Pictures/PageThermo2/admin-03-heizkreis-neu.png)

If an older configuration contains circuits without data source, the editor flags them above the tabs with a **Remove** button; the adapter skips such circuits anyway.

## 4. Set temperature: minimum, maximum, step

Click the **big number** in the ring.

![Set temperature](../Pictures/PageThermo2/admin-06-solltemperatur.png)

- **Minimum / maximum temperature** and **step** of the set temperature. Empty fields = adapter defaults (15 / 28 / 0.5).
- With the option *Values in tenths* in the NSPanel settings the values are given in tenths (25 = 2.5 °C) – exactly like in the script.

## 5. Display of the values: icon, color, unit

Click **line 1** (actual temperature) or **line 3** (humidity).

![Display of the values](../Pictures/PageThermo2/admin-07-anzeige.png)

Per line: **icon** (default `thermometer` or `water-percent`, picked from the icon list), **color** (default green or magenta; the **×** resets to the default) and **unit** (default `°C` or `%`). The unit of line 1 is also used for the set temperature.

## 6. Mode display

Click the **mode text** below the ring.

![Mode display](../Pictures/PageThermo2/admin-08-modus.png)

**Mode texts, one entry per line** – the line number is the value of the mode data point, starting at 0. Empty = the adapter uses `common.states` of the mode data point and, if there are none, its own list (OFF, AUTO, COOL, HEAT, ECO, FAN, DRY). Corresponds to `modeList` in the script.

## 7. Heat circuit icon

Button **Heat circuit icon** below the panel.

![Heat circuit icon](../Pictures/PageThermo2/admin-09-heizkreis-symbol.png)

With more than one circuit the selector slots (①, ② …) take the first places around the ring. Here you set the **icon** (default: digit of the circuit), **color active** (default green) and **color inactive** (default grey); an `airCondition` channel shows the fields a second time for the cooling circuit. Corresponds to `iconHeatCycle`, `iconHeatCycleOnColor`, `iconHeatCycleOffColor` (and `…2`) in the script.

## 8. Page items: adding, moving, free slots

![Items on page 2](../Pictures/PageThermo2/admin-10-items-seite2.png)

- **Adding:** a click on a free slot or **Add page item** opens the known item dialog (channel, role, navigation, icons, colors …). New there is the field **Heat circuit**: *all heat circuits* or exactly one – the item is then shown for that circuit only (`filter` in the script). Clicking a free slot further back puts the item exactly there; the slots before it stay free.
- **Editing:** click the item.
- **Moving:** hovering shows arrows (one slot left/right) and the trash. Items can also be **dragged** – onto a taken slot (the two swap) or onto a free slot further back (the slots in between stay free). While dragging the item is semi-transparent and the target is highlighted.
- **Deleting:** the trash removes the item; its slot stays free, the other items keep their places.
- **Free slots between items** are saved (as empty items per circuit) and shown as empty places on the panel. Free slots at the end are dropped.
- **Paging:** more than nine entries spread over several pages; the page number is at the bottom left of the panel mock, on the panel the arrow at the top right pages.

The item dialog with the field **Heat circuit** (preset to the selected circuit):

![Item dialog](../Pictures/PageThermo2/admin-12-item-dialog.png)

![Dragging](../Pictures/PageThermo2/admin-11-ziehen.png)

Note on items for *all heat circuits*: their slot may differ per circuit because every circuit has a different number of generated buttons in front. The editor always shows the layout of the selected circuit.

## 9. Order of the slots

Select **Order of the slots** below the panel (`sortOrder` in the script):

![Order of the slots](../Pictures/PageThermo2/admin-13-anordnung.png)

| Value | Layout |
|---|---|
| **V** – vertical | left 1–4, right 5–8 (default) |
| **H** – horizontal | left/right alternating |
| **HM** – horizontal, middle first | |
| **VM** – vertical, middle first | |
| **HB** – horizontal, bottom first | |
| **VB** – vertical, bottom first | |

The editor draws the slots in the chosen order. With any value other than **V** the adapter sorts the eight side slots only – the ninth (between − and +) stays empty; the editor draws it dimmed with a hint.

## 10. Saving, panel assignment, navigation

- In the **Navigation/Panel** section on the right assign the panel and set the navigation (`prev`, `next`, `parent`, `home`) – as with the other page types. Without `next`/`prev` the page is reachable through a navigation item (`targetPage`) only.
- **Save** or **Save and close** at the bottom. The instance restarts and builds the page.

## 11. If something does not look as expected

- **Everything greyed out:** the instance is not running. The editor can be used with a running instance only.
- **A button is missing on the panel although the data point exists:** for `VACATION` and `USERICON` the adapter does not search by role but for the data point with **exactly this name** below the channel (e.g. `….VACATION`, not `….Vacation`). The preview in the heat circuit dialog shows only the buttons the adapter really generates.
- **Items appear elsewhere than in the editor:** check whether the item is bound to *all heat circuits* (see the note in [Page items](#8-page-items-adding-moving-free-slots)) and whether the order is not **V** (ninth slot).
- **The page shows nothing:** at least one heat circuit with a data source is needed.
