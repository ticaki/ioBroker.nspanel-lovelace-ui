# Content

[Latest Changes](#latest-changes)
* [Navigation](#navigation)
* [Double clicks (confirmation)](#double-clicks-confirmation)
* [Double clicks](#double-clicks)
* [Using theme colors](#using-theme-colors)
* [Editing translations](#editing-translations)
* [Inserting the service menu](#inserting-the-service-menu)
* [Accessing panel datapoints](#accessing-panel-datapoints)
* [Creating popups](#creating-popups)
* [Configuration — enums](#configuration--enums)
* [Placeholder — dpInit](#placeholder--dpinit)

---

# Latest Changes

## Navigation
The navigation offers 2 sides, each with 2 click targets and 3 icons. Left and right are the respective sides on the panel.
- single only: shown as an arrow pointing in that direction in white.
- double only: shown as `parent` (arrow up) on the left or `home` on the right in white.
- single and double both defined: shown as an outline arrow pointing up-left or up-right.
Only when both are defined is there a double click.

In addition the paging function:
- Entities: blue arrow up/down on the left/right until the end of the page list, then it falls back to the rendering above.
- Grids: blue arrow left or right (`scrolltype: page`); for row-wise paging the rendering matches `Entities`.

## Double clicks (confirmation)
**2024-03-09**

For PageItems of type `button` the property `confirm: { type: 'const', constVal: 'sure?' }` makes the button show that confirmation text after the first click and wait for a second click before executing the action (see Tasmota Restart).

## Double clicks
**2024-03-09**

Double clicks in navigation:
- in normal navigation they are configured via the `double` property. If only `double` is set, it behaves like a single click but is rendered as parent/home.
- in page/row paging a double click triggers a navigation click in the corresponding direction — as if you had paged all the way through.


## Using theme colors
**2024-03-09**

The following theme constants are currently available:
```typescript
export interface ColorThemenInterface {
    good: RGB;
    bad: RGB;
    true: RGB;
    false: RGB;
    activated: RGB;
    deactivated: RGB;
    attention: RGB;
    info: RGB;
    option1: RGB;
    option2: RGB;
    option3: RGB;
    option4: RGB;
    open: RGB;
    close: RGB;
}
```

Example:
```typescript
                true: {
                    value: { type: 'const', constVal: 'checkbox-intermediate' },
                    color: { type: 'const', constVal: Color.bad },
                    text:  { value: { type: 'internal', dp: '///AdapterNoConnection' } },
                },
                false: {
                    value: { type: 'const', constVal: 'checkbox-marked-outline' },
                    color: { type: 'const', constVal: Color.good },
                    text:  { value: { type: 'internal', dp: '///AdapterNoConnection' } },
                },
```


## Editing translations
**2024-03-09**

Translations from tokens to words for English must be added here: https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/admin/i18n/en/translations.json — token on the left, intended meaning on the right. This should be done by hand for both `en` and `de` so the script does not produce silly machine translations.

These are texts shown in the admin UI, in the object tree (`common.name`) and on the panel.

The admin UI also has an option that logs unknown tokens once per minute. Unknown tokens are everything that runs through the translation function but is not in the translations file. Please do not add tokens that you added as a personal description / personal option. The same applies to values that show up there.

Example:
```json
{"0":"","StateObjects.isOnline":"","StateObjects.panel":"", ...}
```

`12:34` is the time of day — since arbitrary text can also appear there, it also runs through the translation. `DNSServer1` is the first DNS entry in Tasmota, found in the object database. `Mo/Di…` comes from AccuWeather.


## Inserting the service menu
**2024-03-07**

The service menu is integrated into navigation as follows:
```typescript
            {
                name: 'pagename',
                page: 'page',
                left:  { single: '///service' },               // ///service is the target for navigation
                right: { single: 'someTarget', double: 'main' },
            },
```
- `///service` must be selected as a left target and/or right target. The menu is then inserted there.
- The first page is a `cardUnlock` without a PIN. A PIN can be set in the admin.


## Accessing panel datapoints
**2024-03-03**

To access datapoints independent of adapter instance and panel, use the placeholder `${this.namespace}` — it is expanded to e.g. `nspanel-lovelace-ui.0.panels.C0_49_EF_FA_4C_6C`.

## Creating popups
**2024-03-03**

This has been around a while, but to forestall questions: how it works.

- Popups are triggered exclusively via `entity1` — all other triggers are overwritten.
- Popups must not be part of the navigation.
- Use `\n` for line breaks; `\r` is added automatically.
- Overlapping popups should — when closed — show all previous popups in turn and land on the originating page.
- **Important:** a page IS a popup. If it is enabled multiple times it only overwrites itself, and leaving it returns to the last other page.
- An example of how to create a popup is below. The `///` uniqueID prefix is reserved for internal use; such popups should live in `const/notification.ts`.

```typescript
const popupWelcome: PageBaseConfig = {
    card: 'popupNotify',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///WelcomePopup',
    config: {
        card: 'popupNotify',
        data: {
            entity1: { value: { type: 'triggered', dp: '0_userdata.0.example_state' } },
            headline:        { type: 'const', constVal: 'welcomeHToken' },
            colorHeadline:   { true: { color: { type: 'const', constVal: Color.Green } } },
            buttonLeft:      { type: 'const', constVal: '' },
            colorButtonLeft: { true: { color: { type: 'const', constVal: Color.White } } },
            buttonRight:     { type: 'const', constVal: '' },
            colorButtonRight:{ true: { color: { type: 'const', constVal: Color.White } } },
            text:            { type: 'const', constVal: 'welcomeTToken' },
            colorText:       { true: { color: { type: 'const', constVal: Color.White } } },
            timeout:         { type: 'const', constVal: 3 },
            closingBehaviour:{ type: 'const', constVal: 'both' }, // 'both' | 'yes' | 'no' | 'none'
        },
    },
    pageItems: [],
    items: undefined,
};
```

## Configuration — enums
**2024-03-02**

- Enums for Page and PageItems added, `optional`: `string` or `string[]`.
- `enum.rooms` and `enum.functions` are available; strings must start that way.
- Not available in templates — would not make much sense; maybe for `functions` once we settle on what each function should do.

```typescript
        {
            enums: 'enum.rooms.kitchen' /* or */ ['enum.rooms.kitchen'],
            template: 'text.battery.bydhvs',
        },
```


## Placeholder — dpInit
**2024-03-02**

- `dpInit` is available in templates everywhere optional.
- Placeholder for `dpInit` added.
- `dpInit` must always be a `string` — the regex is built from this string.
- `device` added (`string`).
- `#°^°#` — placeholder filled with `device`. If `dpInit` is a regex it must of course be passed as a string and the `device` value must be regex-escaped.

Example:
```typescript
        {
            device: '0',
            template: 'text.battery.bydhvs',
        },
```
Excerpt from the template:
```typescript
    'text.battery.bydhvs': {
        /**
         * entity1 holds the charge level
         * entity2 same
         * entity3 is true while charging, false while discharging. Default false; entity3 is not auto-detected.
         */
        template: 'text.battery',
        role: 'battery',
        adapter: 'bydhvs',
        type: 'text',
        dpInit: '/bydhvs\\.#°^°#\\./',

        data: {
```

Since all regexes below match exactly one state given `dpInit`, the item is configured with `device='0'`.



---
