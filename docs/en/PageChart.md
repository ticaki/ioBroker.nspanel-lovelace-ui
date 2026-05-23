# PageChart

The PageChart offers two chart presentations: bar and line. You can choose whether the data is prepared externally and provided via states (as in the old script) or whether a database adapter is used for data storage. Currently SQL, InfluxV2 and History are supported.

<img alt='Linechart' src= 'Pictures/pageChart/Linechart.png'> <img alt= 'Barchart' src='Pictures/pageChart/Balkenchart.png'>

## Basic settings

<img alt='Chart general' src='Pictures/pageChart/pageChartallg.png'>

Selecting the `PageChart` tab takes you to the settings. To create a new page, click the PLUS sign and the data fields for the page appear (see image above).
1. First define the page name; it must not repeat anywhere in the panel. It is the ID for this page and is identical to the `uniqueName`. The name also appears in the grey bar, so you can easily distinguish multiple pages.
2. Set the headline shown on the page.
3. If you tick `alwaysOnDisplay`, the page stays permanently visible and does not automatically jump into the screensaver. To re-enable the screensaver you have to switch to another page.
4. The `hide page` option lets you remove the page from the navigation when the `hide Page` option is active in the `System` service page.
5. With the colour field you set the colour of the line/bars.
6. Choose the type: barChart → bars, lineChart → lines.
<img alt='chartType' src='Pictures/pageChart/pageChartType.png'>
7. Data source `oldScriptVersion` or `dbAdapter`.
<img alt= 'adapter instance' src='Pictures/pageChart/pageChartAdapter.png'>

    - **oldScriptVersion** → here the values for scale and data must be prepared externally. They follow the schema of the NSPanel script. You only need to enter the states for scale and data. The NSPanel script wiki has examples of JavaScripts that read data from a database and write it, prepared, into the states for scale and data.
    - **dbAdapter** → if you store data in a database with a database adapter, you can select the adapter instance in the `data source` field. In the `state for archived values` field you must select the same state that was configured in the adapter.
        - set the time range in hours,
        - every how many hours a tick is added to the X axis,
        - for the bar chart a factor is chosen to display large values sensibly on the screen,
        - every how many hours a scale value should be written to the X axis.
8. The label of the Y axis, e.g. the unit.

## Reference in the configuration script
```typescript
// LineChart
    const temperature: ScriptConfig.PageChart = {
        uniqueName: 'temperature',
        type: 'cardLChart'
    }

// BarChart
    const powerChart: ScriptConfig.PageChart = {
        uniqueName: 'power',
        type: 'cardChart'
    };
```
