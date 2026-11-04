# Page PChart – pie chart

The page `cardPChart` shows up to five values as a pie chart with a legend (the legend of HMI 6.0.5 has five rows). The panel computes the percentages itself; headline and legend use the font color of the panel. It needs TFT version 6.0.5 (EU panel).

A pie chart page is created in the `PageConfig` tab as a page of type `Pie chart`: configure everything in the editor, assign the navigation in the panel section. No script is needed; there is no page type for this card in the configuration script.

## Creating the page in the `PageConfig` tab

In the `PageConfig` tab click the PLUS on the left, choose the type `Pie chart` and enter a unique page name (`uniqueName`, it must be unique across the whole panel). The editor then shows:

1. **Headline** of the page.
2. **Legend**: what is printed next to the name of each slice – the name only, name and value, name and percent, or name, value and percent (default).
3. **Decimal places** of the value text (default 2). Applies to the values from states; with the script data point the text comes ready-made from the script.
4. **Data source**: `Values from states` (default, see below) or `Script data point` (for existing scripts that build the panel text themselves).

The fields can only be edited while the adapter instance is running. Visibility (`hide page`), `alwaysOn` and the navigation are set in the navigation/panel assignment section like for every page.

## Values from states (default)

The main view of the editor: a time range, a DB instance when needed and five rows for the slices.

### Time range

- **Current value** (default): every slice shows the current value of its state. When one of the states changes the adapter redraws the page – at most once a minute, because the panel rebuilds the whole pie on every update.
- Every other entry: each slice shows the **average** of its state over the range. This needs a **DB instance** (`history`, `sql` or `influxdb`, stored in the short form `influxdb.0`) that logs all slice states.
  - **Rolling, until now:** `Last hour`, `Last 24 hours`, `Last 7 days`, `Last 30 days`, `Custom` (hours field, e.g. 36 = the last 36 hours).
  - **Calendar, fixed start and end** (local time of the adapter, week starts on Monday): `Today` (00:00 until now), `Yesterday` (00:00 to 24:00 of the previous day), `This week` (Monday 00:00 until now), `Last week` (Monday 00:00 to Sunday 24:00 of the previous week), `This month` (1st 00:00 until now), `Last month` (1st 00:00 to last day 24:00 of the previous month). With `Yesterday`, `Last week` and `Last month` the value therefore only changes with the next day/week/month.

  The adapter reads the averages via `getHistory` over exactly that window (one average per state, one after the other) and reloads them every 5 minutes while the page is shown. If the database returns no value for a state (not logged, instance not running, timeout) that slice shows 0 and the log gets a warning – once, until a value arrives again; the other slices are not affected.

The range is stored as a key (`rangeKey`: `current`, `h1`, `d1`, `w1`, `m1`, `custom`, `today`, `yesterday`, `thisWeek`, `lastWeek`, `thisMonth`, `lastMonth`), the hours (`rangeHours`) only for `custom`.

### Slices

Per slice (1–5):

- **Name**: text of the legend. Empty → the name of the state (`common.name`, in the language of the adapter).
- **State (number)**: the numeric state. A slice without a state is left out; the others move up.
- **Unit**: printed behind the value, e.g. `kWh`. Empty → the unit of the state (`common.unit`).
- **Color** of the slice. New pages start with a different default color per slice.

A value of 0 keeps its legend line (without a piece in the pie), negative values count as 0. The order of the rows is the order in legend and pie.

The legend has a fixed width: names longer than about 20 characters and value texts longer than about 15 characters (next to the percentage; about 20 without it) are cut hard by the adapter so that nothing is written on top of each other – narrow characters count less, capitals and digits more. This applies to both data sources.

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

More than five slices: from the fifth on the adapter sums all remaining ones up as one slice **Other** (number = sum of the rest, no value text, color of the fifth slice), because the panel reads five entries only. A time range does not apply to this source.

## What the adapter sends to the panel

The numbers of all slices are scaled with one common factor to integers whose sum is about 1 000 000 – the panel works with the sum in 32 bit and needs it below 2 000 000; small shares do not drop to 0. The decimals of the original values only appear in the value text. The panel reads at most five slices and computes the percentages itself.
