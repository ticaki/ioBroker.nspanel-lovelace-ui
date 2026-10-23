# PageChart

The chart page shows a history — either as **bars** (`cardChart`) or as a **line** (`cardLChart`).

<img alt='Linechart' src= '../Pictures/pageChart/Linechart.png'> <img alt= 'Balkenchart' src='../Pictures/pageChart/Balkenchart.png'>

> **It is configured in the admin**, in the *PageConfig* tab: [Chart page – configuration in the
> admin](PageChart-Admin). Every field is there — chart type, colour, the two ways of preparing the data,
> range and axis divisions. This page describes **what arrives on the panel** and the **second way**
> through the configuration script.

## What arrives on the panel

The adapter fetches the data over the configured range: for the **bar chart** one average per hour, for
the **line chart** averages on a 5-minute grid and at most 500 points.

On the y-axis the panel prints **integers with at most two characters**. For the bar chart the *factor*
keeps large values readable; for the line chart the adapter picks the factor itself (10, 100, …) and
appends it to the axis label — 100 … 150 W then reads `W x10` with the axis showing `10 … 15`.

> **There is no headroom above or below the curve.** The panel spans the y-axis exactly over the data and
> only shows the ticks that fall inside it. Adding more ticks does not help — this holds for the script
> version as well.
