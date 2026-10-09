# Page Thermo2

The PageThermo2 is the thermostat page with the new design: up to eight heat circuits (e.g. heating / air condition or several rooms), any number of page items around the temperature display (with paging), headlines per circuit. The full description of the script configuration is on the German page [PageThermo2](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/PageThermo2) for now.

## Creating a thermostat page in the `PageConfig` tab

A Thermo2 page can be created without a script: in the `PageConfig` tab click the PLUS on the left, choose the type `Thermostat (Thermo2)` and enter a unique page name (`uniqueName`). The editor draws the page the way the panel shows it - the settings open by clicking the respective spot:

- **Tabs above the panel** are the heat circuits (up to eight, `+` adds one). An `airCondition` channel gives two tabs (heating / cooling), exactly like on the panel.
- **Headline** → dialog *Heat circuit*: data source **alias channel** (role `thermostat` or `airCondition`, see the [alias table](ALIAS); the editor shows the role and the buttons the adapter will generate from the alias) **or single data points** (set temperature `set`, actual temperature `thermoId1`, humidity `thermoId2`, mode `modeId`), headline (empty = `common.name`), cooling headline (`name2`), order, remove.
- **Set temperature (big number)** → *Set temperature*: `minValue`, `maxValue`, `stepValue` (empty = 15 / 28 / 0.5; in tenths with *Values in tenths* in the NSPanel settings).
- **Actual temperature and humidity line** → *Value display*: `icon`/`onColor`/`unit` and `icon2`/`onColor2`/`unit2`, each with a reset to the default.
- **Mode text** → *Mode display*: `modeList`, one entry per line (empty = `common.states` of the data point, otherwise the list of the adapter).
- **Button "Circuit icon"** → `iconHeatCycle` with colors (for airCondition also the `…2` variant of the cooling circuit).
- **The eight slots around the ring** are the page items in their real order: with more than one circuit first the selector slots ①②…, then the buttons the adapter generates from the alias (lock, not editable), then the configured items - green border = this circuit only, blue border = all circuits. A free slot or "Add page item" opens the known item dialog with the field **Heat circuit** (`filter`). Hovering an item shows arrows for moving and the delete button; more than eight entries are paged, the **order of the slots** is `sortOrder`.
- Navigation, panel assignment, *start page*, *hidden* and *alwaysOn* as with the other page types in the panel section.

In the adapter the admin page goes through the same code as the script page (`PageThermo2.getPage`): alias resolution, `modeList`, the generated mode / auto / manual buttons and the filter indices are identical.
