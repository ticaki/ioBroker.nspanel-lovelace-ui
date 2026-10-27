# PageChart

The PageChart offers two views: bars (`cardChart`) and a line (`cardLChart`). The data comes either from two states that a script prepares (scale and values, as with the old NSPanel script) or directly from a database adapter. SQL, InfluxDB (V2) and History are supported.

<img alt='Linechart' src= '../Pictures/pageChart/Linechart.png'> <img alt= 'Balkenchart' src='../Pictures/pageChart/Balkenchart.png'>

A chart page is created in the `PageConfig` tab as a page of type `Chart`: configure everything in the editor, assign the navigation in the panel section. No script needed. The former tab `PageChart` no longer exists — see [Migration of the old table](#migration-of-the-old-table-pagechart).

## Creating a chart in the `PageConfig` tab

In the `PageConfig` tab click the PLUS on the left, choose the type `Chart` and enter a unique page name (`uniqueName`, it must be unique across the whole panel). The editor then shows:

1. **Chart type**: column chart or line chart.
2. **Headline** of the page.
3. **Color** of the line or the bars.
4. **Data formatting**:
    - **Script version** → scale and values are prepared externally (schema of the NSPanel script). Only the two states `Data point for ticks` and `Data point for values` are needed. The wiki of the NSPanel script has example JavaScripts that read a database and write the prepared data into these states.
    - **Database adapter** → choose a running instance of `sql`, `influxdb` or `history` under `data source` (stored in the short form, e.g. `influxdb.0`). Under `data point for values from the database` choose the state that is logged by this instance. In addition:
        - `Range in hours` — how far back from now (default 24),
        - `X-axis ticks` (line only) — every how many hours a tick is drawn on the x-axis (default 2),
        - `Factor for card chart` (bar only) — divides large values so they fit the display,
        - `X-axis labels` — every how many hours a time label is written to the x-axis (default 4).
      An empty number field means: the adapter uses the default.
5. **Y-axis label**, e.g. the unit.

The fields can only be edited while the adapter instance is running. Visibility (`hide page`), `alwaysOn` and the navigation are set like for every page in the navigation / panel assignment section.

The adapter fetches the data as one average per hour for the bar chart and as averages on a 5-minute grid (at most 500 points) for the line chart, each over the configured range.

The panel prints integer y-axis ticks with at most two characters. The bar chart uses the manual factor to keep large values readable; the line chart chooses the factor automatically (10, 100, …) and appends it to the y-axis label, e.g. `W x10` — the axis then reads `10 … 15` for 100 … 150 W. The adapter places the y-ticks in round steps (1, 2, 5, 10 …) from the minimum to the maximum of the data. More ticks do not help: the panel spans the y-axis exactly over the data and shows only the ticks inside that range — there is no way to add headroom above or below the curve through the scale (this also applies to the script version).

## Migration of the old table `PageChart`

Up to version 1.7 there was also the tab `PageChart`, whose pages got into the navigation through a reference in the configuration script. On the first start after the update the adapter moves all rows of that table into the `PageConfig` tab (type `Chart`) and deletes the old table. If a page name is already used there, the page gets the suffix `_chart` (warning in the log) — the script still finds it under its old name.

For these pages the navigation keeps coming from the configuration script for now, the existing reference works unchanged:

```typescript
    const temperatur: ScriptConfig.PageChart = {
        uniqueName: 'temperatur',
        type: 'cardLChart'
    };
```

This is a transition and deprecated: the editor shows a hint for such pages, the log a warning. As soon as the page has a navigation assigned in the `PageConfig` tab, that one applies; then remove the page from the script — otherwise it is skipped there with a warning.
