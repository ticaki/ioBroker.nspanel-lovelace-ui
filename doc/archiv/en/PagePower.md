# Page Power

The power page draws the flow of energy through the house: up to six sources and consumers running into
the middle — the virtual distribution box — or out of it. The dots move faster the higher the power is,
and the icon can change its colour with the value.

> **It is configured in the admin**, in the *PageConfig* tab: [Power page – configuration in the
> admin](PagePower-Admin). Every field is described there — the six tiles, the slot dialog with unit and
> decimals, the colour scale, speed and flow direction, the two house values and the internal sum.

<img alt='Power page in the editor' src='../Pictures/pagePower/pagePowerallg.png'>

## What arrives on the panel

- **Six tiles** around the house: three on the left, three on the right. Each shows an icon, a value and a
  unit; an optional label sits above it.
- **The middle** is the house with two values — one above, one below the icon. Instead of a state of its
  own, the lower one can show the **sum of the feeding flows**.
- **The direction of movement** tells where the energy goes: producers flow towards the middle, consumers
  away from it. At 0 W the dot stands still.
- The unit grows automatically: 999 W becomes 1 kW at the next step.

<img alt='The house with its two values' src='../Pictures/pagePower/pagePowerHome.png'>
