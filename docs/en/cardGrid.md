# Page Menu / Grid (`cardGrid`, `cardGrid2`, `cardGrid3`)

The **grid cards** show a page of tiles, each displaying one [PageItem](en-ScriptConfig#pageitems) (entity or navigation). There are three variants that differ only in the number of tiles and the layout. If more PageItems are defined than there are tiles, you can page through the screen.

Grid cards can be created in two ways:
- in the **configuration script** as a page of type `PageGrid`/`PageGrid2`/`PageGrid3` with its own `items` array, **or**
- in the **admin** via a **menu page** (internally "cardMenue"), without a script entry.

> The same admin menu page also creates the card types [`cardEntities`](en-Pages) (list layout) and `cardSchedule` (schedule). They share the editor and the paging/filter logic with the grids, but have their own tile counts.

---

## Grid variants

| `type` | `ScriptConfig` type | Tiles | Note |
|--------|---------------------|:-----:|------|
| `cardGrid` | `PageGrid` | 6 | standard grid |
| `cardGrid2` | `PageGrid2` | 8 (9 on US portrait) | larger tiles, `fontSize`/`useValue` per PageItem possible |
| `cardGrid3` | `PageGrid3` | 4 | large grid with few, prominent tiles |

For comparison, the other menu card types: `cardEntities` 4 (US portrait 5), `cardSchedule` 6.

---

## Variant 1: In the configuration script

In the script the page is created with the matching type; the tiles are filled via the `items` array with PageItems:

```typescript
const livingroom: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'livingroom',
    heading: 'Living room',
    items: [
        { id: 'alias.0.NSPanel_1.AirPurifier', name: 'Air purifier', icon: 'power', offColor: MSRed, onColor: MSGreen },
        { navigate: true, icon: 'home', name: 'Home', targetPage: 'main' },
    ],
};
```

The full structure of a PageItem (mandatory and optional fields, colours, `colorScale`, navigation, long press …) is described under [ScriptConfig → PageItems](en-ScriptConfig#pageitems). On `cardGrid2` the PageItem options `useValue` and `fontSize` (font size 0–5) additionally take effect.

### Paging & filtering

Grid cards support the paging and filter options from [ScriptConfig → additional parameters for navigation on the page](en-ScriptConfig#additional-parameters-for-navigation-on-the-page):

- `scrollPresentation`: `'classic'` (default, page by page via the arrow top right) · `'arrow'` (arrow tile on the last slot) · `'auto'` (automatic paging; interval via `scrollAutoTiming` in seconds, default 15).
- `scrollType`: `'page'` (default, whole page) · `'half'` (half a page).
- `filterType`: `'true'` / `'false'` / `number` — shows only matching PageItems depending on the primary value.

---

## Variant 2: In the admin (menu page / cardMenue)

In the menu page all grid types, `cardEntities` and `cardSchedule` can be created directly in the admin, so they do not have to be created in the script. Currently each tile offers the basic functions `targetPage`, `trueColor` (= `onColor`), `falseColor` (= `offColor`), `trueIcon` (= `icon`), `falseIcon` (= `icon2`) and `name`.

### Basics
The general handling of the tab is described under [Page Config](en-PageConfig) and should be read first.

### Settings in detail

> 🖼️ **Image missing:** Admin configuration of a menu page (headline, card type, tile layout).
> Path: `Pictures/cardMenue/config.png`

![Menu configuration](Pictures/cardMenue/config.png)

#### Headline
The page title.

#### Card type
Choose the card type here; the layout of the tile fields changes depending on the type. The layout matches the display on the panel.

#### Panel layout / adding PageItems
Clicking a field opens the main dialog for the PageItem.

> 🖼️ **Image missing:** Main dialog of a PageItem (navigation checkbox, object selection, name, conditions).
> Path: `Pictures/cardMenue/mainDialog.png`

![Main dialog](Pictures/cardMenue/mainDialog.png)

- **Checkbox "is a navigation"** — makes the PageItem jump to a target page on press (equivalent to `navigate: true`). The "target page" dropdown appears (`targetPage`).
- **ioBroker channel** — clicking the three-dot button opens the object browser to select the channel.
  > [!NOTE]
  > A state must be selected for the channel to be applied. On channel errors a symbol appears behind the button and a "Details" button below shows the error message.
- **Name** — custom name for the PageItem. Without an entry the name is taken from `common.name`; if that is missing too, the role name is used.
- **Conditions true/false** — a differing icon and colour compared to the default settings.

In the panel layout, the PageItems can be moved by drag-and-drop and copied/pasted. To insert more PageItems than fit on one page, use the "add page" button to create another page. You can then choose whether an **arrow** for paging is inserted in the last PageItem of the page (`scrollPresentation: 'arrow'`) or whether the page's navigation arrows are used (`'classic'`).

---

## Related pages

- [ScriptConfig](en-ScriptConfig) — page structure and PageItems
- [Page Config](en-PageConfig) — admin tab for page configuration
- [Pages](en-Pages) — overview of all page types
