# Page Thermo2

The PageThermo2 is the thermostat page with the new design: up to eight heat circuits (e.g. heating / air condition or several rooms), any number of page items around the temperature display (with paging), headlines per circuit. The full description of the script configuration is on the German page [PageThermo2](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/PageThermo2) for now.

## Creating a thermostat page in the `PageConfig` tab

A Thermo2 page can be created without a script: in the `PageConfig` tab click the PLUS on the left, choose the type `Thermostat (Thermo2)` and enter a unique page name (`uniqueName`). The editor shows:

- **Heat circuits** (up to eight, order by the arrows): per circuit the **thermostat channel** (an alias with the role `thermostat` or `airCondition`, see the [alias table](ALIAS)), the **headline** (empty = `common.name` of the channel) and **minimum / maximum temperature** plus **step** (empty = 15 / 28 / 0.5). The limits are read like in the script - with the option *Values in tenths* in the NSPanel settings the adapter divides them by 10. A channel with another role or a missing object is flagged in the editor.
- **Page items**: the same items as on the menu pages (channel, navigation, icons, colors ...), created with the known item dialog. New in the dialog is the field **Heat circuit**: the item is then shown for that circuit only (`filter` of the script); *all heat circuits* = always visible. An `airCondition` counts twice (heating / cooling), the list in the dialog already takes that into account.
- Navigation, panel assignment, *start page*, *hidden* and *alwaysOn* as with the other page types in the panel section.

In the adapter the admin page goes through the same code as the script page (`PageThermo2.getPage`): alias resolution, `modeList` from `common.states`, the generated mode / auto / manual buttons and the filter indices are identical. The remaining script options (icons, colors, units, `modeList`, direct data points `set`/`thermoId1`/`thermoId2`/`modeId`, `sortOrder`) are not editable in the admin yet - use the script for those.
