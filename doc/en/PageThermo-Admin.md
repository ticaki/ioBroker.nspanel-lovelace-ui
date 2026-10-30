# Page Thermo (classic) – configuration in the admin

The classic thermostat page `cardThermo` can be created without a script: tab **PageConfig**, page type **Thermostat (classic)**. In the adapter the admin page runs through the same code as the script page (`ConfigManager.getPageThermo`), the result on the panel is identical.

The page shows **one** thermostat: an alias channel with the role `thermostat` or `airCondition`. Only the headline, the channel, the unit and the limits of the set temperature are configured – everything else (actual temperature, humidity, second set point, mode icons and the buttons at the bottom) is derived by the adapter from the states it finds below the channel. There are no page items of its own. For several heat circuits or own buttons on one page use [Page Thermo2](PageThermo2-Admin).

Contents:
- [Creating the page](#1-creating-the-page)
- [Fields](#2-fields)
- [Minimum, maximum, step](#3-minimum-maximum-step)
- [What the panel shows per alias states](#4-what-the-panel-shows-per-alias-states)
- [Saving, panel assignment, navigation](#5-saving-panel-assignment-navigation)
- [Take-over from the script](#6-take-over-from-the-script)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. In the list **Pages** on the left click the PLUS, choose the type **Thermostat (classic)** and enter a **unique ID** (the page name the navigation refers to).
3. The new page appears in the list; the editor opens on the right. A new page has no channel yet – without a channel the adapter does not build the page (message in the log).

## 2. Fields

| Field | Meaning |
|---|---|
| **Unique ID** | Page name; locked for the start page (`main`). |
| **Headline** | Headline of the page on the panel. Empty = unique ID. |
| **Thermostat channel** | Alias channel (channel, device or folder) with `common.role` `thermostat` or `airCondition` – `items[0].id` of the script. The selection dialog shows matching objects only; the editor warns about a missing object or another role. Which states the adapter looks for below the channel is described in [section 4](#4-what-the-panel-shows-per-alias-states) and in the [alias table](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/ALIAS). |
| **Unit** | Text behind the actual and the set temperature (e.g. `°C`). Empty = `common.unit` of the set temperature state. |
| **Minimum / maximum temperature, step** | Limits and step of the set temperature, see [below](#3-minimum-maximum-step). |

**Hidden**, **Always on**, **Start page** and the **navigation** are set on the right in the area *Navigation/Panel* – like for every page type.

## 3. Minimum, maximum, step

The three values are **stored exactly as the script has them** (`minValue`, `maxValue`, `stepValue` of `items[0]`), so a page taken over from a script keeps its numbers. The adapter (`pageThermo.ts`) decides the unit by the maximum:

- **Maximum ≥ 100**: all three values are **tenths of a degree** – `minValue: 100, maxValue: 300, stepValue: 1` means 10 °C to 30 °C in steps of 0.1 °C; `stepValue: 5` would be 0.5 °C.
- **Maximum < 100**: all three values count as **degrees** and are multiplied by 10 – `minValue: 15, maxValue: 28, stepValue: 0.5` means 15 °C to 28 °C in steps of 0.5 °C.
- A step below one tenth of a degree is raised to one tenth.
- **Empty fields**: the adapter takes `common.min` / `common.max` / `common.step` of the set temperature state; without them 15 °C to 30 °C in steps of 0.5 °C apply.

The option *Values in tenths* (`defaultValueCardThermo`) in the NSPanel settings concerns `cardThermo2` only, not this page.

## 4. What the panel shows per alias states

What the panel shows below the headline is **not configured** but derived from the states the adapter finds below the channel (matched by `common.role` and `common.type`, see the [alias table](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/ALIAS)). The pictures show the four typical results.

### Thermostat: one set point

![Thermostat](../Pictures/PageThermo/panel-01-thermostat.png)

Role `thermostat`. On the left **current** (`ACTUAL`, `value.temperature`) and – with a `HUMIDITY` state (`value.humidity`) – the **humidity**; in the middle the set point `SET` (`level.temperature`, required) with the − and + keys. The buttons at the bottom come from the optional states of the channel, one per state found: `POWER` (`switch.power`), `BOOST` (`switch.mode.boost`), `WINDOWOPEN` (`sensor.window`), `PARTY` (`switch.mode.party`), `MAINTAIN` (`indicator.maintenance`), `UNREACH`, `LOWBAT`, `ERROR`, `VACATION`, `WORKING`. The auto / manual buttons of the picture come from the original script; the adapter does not generate them for this role, and a `MODE` state is not shown as an icon bar with `thermostat`.

### Air conditioner: mode icons

![Air conditioner](../Pictures/PageThermo/panel-02-klimaanlage.png)

Role `airCondition` with a `MODE` state (`value.mode.airconditioner`, number). The adapter derives the icons at the bottom from `common.states` of the `MODE` state – one icon per known state, in this order: `OFF` (power-off), `AUTO` (A in a circle), `COOL` (snowflake), `HEAT` (flame), `ECO` (E in a circle), `FAN_ONLY` (fan), `DRY` (drop). Without `common.states` the list `OFF, AUTO, COOL, HEAT, ECO, FAN, DRY` applies (index = value). After them follow the buttons of the optional states as above (`POWER`, `BOOST`, `MAINTAIN`, `UNREACH`, `ERROR`, …).

### Air conditioner: two set points

![Air conditioner with two set points](../Pictures/PageThermo/panel-03-klimaanlage-zwei-sollwerte.png)

Role `airCondition` with `SET` **and** `SET2` (both `level.temperature`, `SET2` has to carry exactly that name): the panel shows two set points side by side, e.g. heating and cooling. The icon bar below as in the picture before.

### Heat pump: four modes

![Heat pump](../Pictures/PageThermo/panel-04-waermepumpe.png)

Role `airCondition` whose `MODE` state knows only `OFF`, `AUTO`, `COOL` and `HEAT` in `common.states` – exactly four icons appear. States missing in `common.states` get no icon.

### Script fields without effect

The script knows the fields `iconArray`, `popupThermoMode1`, `popupThermoMode2`, `popupThermoMode3`, `popUpThermoName`, `setThermoAlias` and `setThermoDestTemp2` on the thermo item (the mode popup with up to three lists of the original script). The adapter does **not** read them – they have no effect on the panel, and the converter passes them over without notice. The same applies to the icon, color and name fields of the item.

## 5. Saving, panel assignment, navigation

- On the right in the area **Navigation/Panel** assign the panel and set the navigation (`prev`, `next`, `parent`, `home`) – like for the other page types. Without `next`/`prev` the page is reachable only through a navigation item (`targetPage`).
- At the bottom **Save** or **Save and close**. The instance restarts afterwards and builds the page.
- When the adapter does not build the page (no channel, object missing, wrong role, `SET` not found), the reason is in the log of the instance.

## 6. Take-over from the script

When a script is [taken over into the admin](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/ScriptConfig#skript-in-den-admin-übernehmen) a `cardThermo` page becomes this page type: `heading` → headline, `items[0].id` → channel, `items[0].unit` → unit, `items[0].minValue`/`maxValue`/`stepValue` → the three numbers (unchanged). All other fields of the item ([see above](#script-fields-without-effect)) and further items are never read by the adapter in the script either – they are dropped without notice, the panel shows the same as before.

The page is skipped only when the take-over would change the panel: no item, `items[0]` without `id` (or a navigation / `native` item), a `unit` that is no text or empty, a `minValue`/`maxValue`/`stepValue` that is no number.
