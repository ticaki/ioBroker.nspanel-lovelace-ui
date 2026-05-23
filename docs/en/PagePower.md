# PagePower

**Content**
+ [Basic settings](#basic-settings)
    + [Producer / consumer](#producer--consumer)
    + [Home](#home)
+ [Reference in the configuration script](#reference-in-the-configuration-script)

The Page Power can display and offset up to 6 consumers / producers. It is meant to depict the power distribution in your smart home. Icons, colour gradients, the speed of the flow direction and the flow direction itself can be configured here. The options are explained using an example. You can create several of these pages. On which panel you use them is decided in the configuration script of the respective panel.

---
## Basic settings

<img alt='PagePower general' src='Pictures/pagePower/pagePowerallg.png'>

Selecting the `PagePower` tab takes you to the settings. To create a new page, click the PLUS sign and the data fields for the page appear (see image above).
1. First define the page name; it must not repeat anywhere in the panel. It is the ID for this page and is identical to the `uniqueName`. The name also appears in the grey bar, so you can easily distinguish multiple pages.
2. Set the headline shown on the page.
3. If you tick `alwaysOnDisplay`, the page stays permanently visible and does not automatically jump into the screensaver. To re-enable the screensaver you have to switch to another page.
4. The `hide page` option lets you remove the page from the navigation when the `hide Page` option is active in the `System` service page.

---
## Producer / consumer

<img alt='pagePowerItem' src='Pictures/pagePower/pagePowerItem.png'>

+ **Icon** → an icon can be selected via the select field; a smart search assists you and suggests variants.
+ **State for power** → select the state that contains the power (watts).

<img alt='pagePowerItemMore' src='Pictures/pagePower/pagePowerItemMore.png'>

+ **Number of decimal places** to be displayed, independent of the number stored in the state.
+ **Unit** — selects the smallest unit to display. The AutoUnit function raises the unit when the number becomes four digits, e.g. 999 W becomes 1 kW when increased. If a unit is defined in the state, it takes precedence and overrides the one set here in the admin.
+ **maximum power** → enter the maximum value expected from the state. The max value means 100 % speed of the flow-direction animation. At 0 W the dot stops and gets proportionally faster as the power rises.
+ Ticking the box reverses the **flow direction**. All producers should flow towards the centre and consumers away from it. The centre of the page represents the distribution box where all consumers and producers come together.
+ **Icon colour** → the icon colour can be chosen with the colour picker. If the icon should change colour according to the power level, enable `use colour scale`.

<img alt='' src='Pictures/pagePower/pagePowerItemUsecolor.png'>

With the values `min power`, `max power`, `best power` the colour gradient from green to red is defined. There are several ways to set the gradient. The value of `best power` decides which value is green.
+ **Example 1**
    0 W should be green and 100 W red
    + `min power` = 0
    + `max power` = 100
    + `best power` = 0

+ **Example 2**
    0 W should be red and 100 W green
    + `min power` = 0
    + `max power` = 100
    + `best power` = 100

+ **Example 3**
    -50 W should be red, 0 W green and 100 W red again
    + `min power` = -50
    + `max power` = 100
    + `best power` = 0

With **Description/Title** you can show a text above the flow display, e.g. which consumer it is.

---
### Home

<img alt='pagePowerHome' src='Pictures/pagePower/pagePowerHome.png'>

Home is the central part of the page where all power values come together. It is the virtual distribution box with its meter. There are two fields you can use to display values.

+ `House top` is the value above the house symbol. You define the state you want to display and can additionally choose decimal places and unit via `more settings`. Again, the unit from the state overrides the admin.
+ `House bottom` has two functions. If `internal calculation` is not active, it behaves like the `House top` field. When enabled, you can use `selection of power feeds` to select the fields that supply your smart home (e.g. grid, battery, solar panel).
---
## Reference in the configuration script
In the configuration script the page is embedded as follows.
As a main page under pages:
```typescript
    const powerGrid: ScriptConfig.PagePower = {
        uniqueName: 'pagename', // must match the name in the admin
        type: 'cardPower'
    };
```

As a subpage under subPages:
```typescript
    const energyDisplay: ScriptConfig.PagePower = {
        prev: 'uniqueName of a page',
        home: 'main',
        uniqueName: 'pagename', // must match the name in the admin
        type: 'cardPower'
    };
```
Under pages resp. subPages enter the name written after `const`.
```typescript
        // page division / Seiteneinteilung
        // main pages / Hauptseiten
        pages: [
            powerGrid,
        ],
        // subpages / Unterseiten
        subPages: [
            energyDisplay,
        ],
```

> [!NOTE]
> Configure everything in the admin first, then adjust the script and restart it.
