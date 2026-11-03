# Page PChart – pie chart

The page `cardPChart` shows up to six values as a pie chart with a legend. The panel computes the percentages itself; headline and legend use the font color of the panel. It needs TFT version 6.0.5 (EU panel).

A pie chart page is created in the `PageConfig` tab as a page of type `Pie chart`: configure everything in the editor, assign the navigation in the panel section. No script is needed; there is no page type for this card in the configuration script.

## Creating the page in the `PageConfig` tab

In the `PageConfig` tab click the PLUS on the left, choose the type `Pie chart` and enter a unique page name (`uniqueName`, it must be unique across the whole panel). The editor then shows:

1. **Headline** of the page.
2. **Legend**: what is printed next to the name of each slice – the name only, name and value, name and percent, or name, value and percent (default).
3. **Decimal places** of the value text (default 2). Applies to the values from states; with the script data point the text comes ready-made from the script.
4. **Data source**: `Values from states` (default, see below) or `Script data point` (for existing scripts that build the panel text themselves).

The fields can only be edited while the adapter instance is running. Visibility (`hide page`), `alwaysOn` and the navigation are set in the navigation/panel assignment section like for every page.

## Values from states (default)

The main view of the editor: a time range, a DB instance when needed and six rows for the slices.

### Time range

- **Current value** (default): every slice shows the current value of its state. When one of the states changes the adapter redraws the page – at most once a minute, because the panel rebuilds the whole pie on every update.
- **Last hour**, **Last 24 hours**, **Last 7 days**, **Last 30 days** or **Custom** with an hours field: every slice shows the **average** of its state over that range, always "from then until now". This needs a **DB instance** (`history`, `sql` or `influxdb`, stored in the short form `influxdb.0`) that logs all slice states. The adapter reads the averages via `getHistory` (one average per state, one after the other) and reloads them every 5 minutes while the page is shown. If the database returns no value for a state (not logged, instance not running, timeout) that slice shows 0 and the log gets a warning – once, until a value arrives again; the other slices are not affected.

The range is stored as a number of hours (`rangeHours`, 0 = current value).

### Slices

Per slice (1–6):

- **Name**: text of the legend. Empty → the name of the state (`common.name`, in the language of the adapter).
- **State (number)**: the numeric state. A slice without a state is left out; the others move up.
- **Unit**: printed behind the value, e.g. `kWh`. Empty → the unit of the state (`common.unit`).
- **Color** of the slice. New pages start with six different default colors.

A value of 0 keeps its legend line (without a piece in the pie), negative values count as 0. The order of the rows is the order in legend and pie.

## Script data point

For scripts that build the panel text themselves (for instance following the old NSPanel Lovelace script): one state the script writes the finished text into. Four fields per slice, separated by `~`:

```
Name~Number~Value text~Color
```

Example: `Grid~5200~5.20 kWh~63488~Self use~3100~3.10 kWh~2016~Feed-in~1500~1.50 kWh~2047`

- **Name**: text of the legend (a `~` in the name is replaced by `-`).
- **Number**: sets the size of the slice; the adapter normalises the numbers itself, decimals and big sums are fine, negative values count as 0.
- **Value text**: printed in the legend as it is, e.g. `5.20 kWh`.
- **Color**: RGB565 decimal like on the other cards; a hex value like `#ff0000` is converted.

More than six slices: from the sixth on the adapter sums all remaining ones up as one slice **Other** (number = sum of the rest, no value text, color of the sixth slice), because the panel reads six entries only. A time range does not apply to this source.

## What the adapter sends to the panel

The numbers of all slices are scaled with one common factor to integers whose sum is about 1 000 000 – the panel works with the sum in 32 bit and needs it below 2 000 000; small shares do not drop to 0. The decimals of the original values only appear in the value text. The panel reads at most six slices and computes the percentages itself.
