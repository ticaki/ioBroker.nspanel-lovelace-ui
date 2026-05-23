# Global Pages and Global Link

## Overview

The **Global Pages** feature lets you define page configurations centrally and reuse them across multiple panel scripts. This is especially useful when you run several NSPanels and want them to share the same pages, but each with its own navigation or ordering.

The feature consists of two main components:
- **Global Script**: defines reusable pages centrally
- **Local Script**: references pages from the Global Script via `globalLink`

## Concept and benefits

### What are Global Pages?

Global Pages are page definitions stored in a separate **Global Script**. These pages can then be referenced by multiple **Local Scripts** (panel-specific configurations).

### Benefits

- **Central maintenance**: changes to a page are made only once in the Global Script and are automatically applied to all panels
- **Consistency**: all panels use the same page definitions
- **Flexibility**: each panel can use the global pages in a different order and with different navigation
- **Overridable**: certain properties such as `heading` can be overridden in the Local Script
- **Reduced redundancy**: no need to define the same pages multiple times

## Setting up the Global Script

### 1. Use the Global Script

On installation the adapter automatically creates a Global Script (`globalPageConfig.ts`). This script already contains all required structures and only needs to be filled with your page definitions.

**Note**: the script is stored in the JavaScript adapter folder and is ready to use. You only need to edit and run it.

#### Basic structure

The configuration in the Global Script has the following structure:

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig', // required

    // All global pages
    subPages: [
        // Page definitions go here
    ],

    // Optional: shared navigation
    navigation?: NavigationItemConfig[],

    // Optional: native page items
    nativePageItems?: any[],

    // Optional: maximum number of navigation adjustment runs for deep linking (default: 3)
    maxNavigationAdjustRuns?: number
};
```

#### Important properties

- `type: 'globalConfig'` - **required**: marks this as a Global Config
- `subPages` - array containing all global page definitions
- `navigation` - optional: shared navigation configuration
- `nativePageItems` - optional: shared native page items
- `maxNavigationAdjustRuns` - optional: maximum number of iterations for deep linking when overriding a uniqueName (default: 3)

> **Note**: the `globalPagesConfig` type also has a `version` field. You do **not** set it manually — the Global Script adds it automatically when sending the configuration to the adapter.

### 2. Define global pages

Every page in the Global Script must have a unique `uniqueName`. This is the key used to reference the page later.

#### Example: simple grid page

```typescript
const livingRoom: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'living_room', // Important: unique name!
    heading: 'Living room',
    prev: 'main',
    next: 'kitchen',
    items: [
        { id: 'alias.0.LivingRoom.Light.Main' },
        { id: 'alias.0.LivingRoom.Socket.TV' },
        { id: 'alias.0.LivingRoom.Blind.Roller1' },
        // ... more items
    ]
};
```

#### Example: media page

```typescript
const mediaPlayer: ScriptConfig.PageMedia = {
    type: 'cardMedia',
    uniqueName: 'media_living_room',
    heading: 'Sonos Living room',
    prev: 'living_room',
    next: 'main',
    media: {
        id: 'sonos.0.LivingRoom',
        speakerList: ['Living room', 'Kitchen', 'Bedroom'],
        playList: ['Favorites', 'Radio'],
        volumePresets: ['Quiet?20', 'Normal?50', 'Loud?80'],
        minValue: 0,
        maxValue: 100
    },
    items: []
};
```

#### Example: thermostat page

```typescript
const heating: ScriptConfig.PageThermo = {
    type: 'cardThermo',
    uniqueName: 'heating_living_room',
    heading: 'Heating Living room',
    prev: 'media_living_room',
    next: 'main',
    items: [
        {
            id: 'alias.0.LivingRoom.Thermostat',
            minValue: 160, // 16.0°C
            maxValue: 240, // 24.0°C
            stepValue: 5    // 0.5°C steps
        }
    ]
};
```

### 3. Assemble the Global Config

All defined pages are collected in the `subPages` array:

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        livingRoom,
        mediaPlayer,
        heating,
        kitchen,
        bedroom,
        // ... more pages
    ]
};
```

### 4. Run the script

After configuring the pages you have to run the Global Script. Transferring the configuration to the adapter happens automatically — the required code is already included in the script and does not need to be written manually.

**Important**: the Global Script must be run again after every change so that the configuration is updated.

## Configuring the Local Script

### 1. Use the Local Script

On installation the adapter automatically creates a Local Script for each panel. The script name is based on the panel name you chose during setup. This script only needs to be filled with your panel-specific configuration.

### 2. Reference pages with globalLink

In the Local Script (panel-specific configuration) global pages are included via `globalLink`.

#### Minimal reference

The simplest form is to specify only the `globalLink`:

```typescript
const livingRoomPage: PageType = {
    globalLink: 'living_room' // References the page with uniqueName 'living_room'
};
```

This adopts **all** properties of the global page, including navigation (`prev`, `next`, etc.).

#### With an optional heading

You can override the heading:

```typescript
const livingRoomPage: PageType = {
    heading: 'Living area', // Overrides the heading from the Global Script
    globalLink: 'living_room'
};
```

#### With an optional uniqueName (deep linking)

You can also assign your own `uniqueName`. In that case the adapter automatically creates copies of all referenced pages and adjusts navigation, so an isolated page hierarchy is created:

```typescript
const livingRoomPage: PageType = {
    uniqueName: 'lr_panel1', // Your own uniqueName for this panel
    heading: 'Living area',
    globalLink: 'living_room'
};
```

**Deep linking**: if you specify your own `uniqueName` that differs from the `uniqueName` of the global page, the global page is copied under this new name. In addition, all pages this page refers to (via `next`, `prev`, `home`, `parent` or `navigate` items) are copied and renamed as well. This makes it possible to use the same global page multiple times with different names and isolated navigation paths.

**Example**: if the global page `living_room` refers to `kitchen` and you set `uniqueName: 'lr_panel1'`, `kitchen` is also copied (e.g. as `lr_panel1_kitchen_copy_nav_12345`), and navigation is adjusted automatically.

### 2. Navigation in pages

When a global page is used in `pages` (main pages), the navigation of the global page is taken into account to add missing referenced pages automatically. Afterwards the navigation parameters (`prev`, `next`, `home`, `parent`) of the inserted pages are **removed**, and the pages are integrated into the circular navigation of the main pages.

**Automatic addition of pages**: if a global page refers via `next` **or** `prev` to another global page that is not yet contained in `pages`, that page is automatically inserted directly **after** the current page (at position `i+1`). This applies to **both** reference directions. The only difference is the log message:

- For `next`: a hint that the page was added (recommendation to remove it from `subPages`).
- For `prev`: additionally a warning "This is not recommended! Prev navigation will randomly change the order of pages!", because inserting a page linked via `prev` *after* the current page disrupts the logical order.

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_LivingRoom',
    // ... more configuration

    pages: [
        { globalLink: 'main' },              // Becomes the first main page
        { globalLink: 'living_room' },       // Navigation is adjusted automatically
        { globalLink: 'media_living_room' }, // Navigation is adjusted automatically
    ],

    subPages: []
};
```

**Important**: the first page in `pages` should have the `uniqueName` "main" (or link to it), since it is used as the start page.

### 3. Navigation in subPages

When a global page is used in `subPages` (sub pages), you can **optionally override** the navigation:

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Kitchen',
    // ... more configuration

    pages: [
        { globalLink: 'main' }
    ],

    subPages: [
        {
            globalLink: 'living_room',
            // Overrides the navigation from the Global Script
            prev: 'main',
            next: 'kitchen_panel2',
            home: 'main'
        },
        {
            globalLink: 'media_living_room'
            // No navigation given = uses the one from the Global Script
        }
    ]
};
```

**Behavior for navigation in subPages**:
- If **at least one** navigation parameter (`prev`, `next`, `home`, or `parent`) is given, **all four** parameters from the Local Script are used (even if they are `undefined`)
- If **no** navigation parameter is given, the navigation from the Global Script is adopted

### 4. Deep linking with uniqueName

If you assign your own `uniqueName` for a global page in a Local Script that differs from the original `uniqueName` of the global page, this activates the **deep linking** feature:

1. **Automatic copying**: the global page is copied under the new `uniqueName`
2. **Recursive navigation**: all pages this page refers to are copied and renamed as well
3. **Isolated hierarchy**: an isolated page hierarchy is created that is independent of other uses of the same global pages

**Use case**: use this when you want to use the same global page multiple times on a panel, but with different navigation paths.

**Example**:
```typescript
// Global Script: page with navigation
const details: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'details',
    heading: 'Details',
    next: 'settings',
    items: [...]
};

// Local Script: multiple use with deep linking
const config: ScriptConfig.Config = {
    pages: [
        { globalLink: 'main' },
        { globalLink: 'details', uniqueName: 'details_variant_a' }, // Creates copies
        { globalLink: 'details', uniqueName: 'details_variant_b' }  // Separate copies
    ],
    subPages: []
};
```

**Configuring recursion depth**: you can control the maximum number of iterations with `maxNavigationAdjustRuns` in the Global Script (default: 3).

## Practical examples

### Example 1: multiple panels with the same pages

#### Global_Script.ts

```typescript
// Global page definitions
const homePage: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'main',
    heading: 'Overview',
    next: 'lights',
    items: [
        { id: 'alias.0.House.Temperature.Outside' },
        { id: 'alias.0.House.Window.Open' },
        { id: 'alias.0.House.Door.State' }
    ]
};

const lightsPage: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'lights',
    heading: 'Lighting',
    prev: 'main',
    next: 'main',
    items: [
        { id: 'alias.0.Light.LivingRoom' },
        { id: 'alias.0.Light.Kitchen' },
        { id: 'alias.0.Light.Bedroom' }
    ]
};

const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        homePage,
        lightsPage
    ]
};
```

After configuring, run the Global Script to transfer the changes.

#### Local_Script_Panel1.ts (Living room)

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_LivingRoom',
    // ... more configuration

    pages: [
        { globalLink: 'main', heading: 'Living room' }, // Overrides heading
        { globalLink: 'lights' }
    ],

    subPages: []
};
```

After configuring, run the Local Script to transfer the changes.

#### Local_Script_Panel2.ts (Kitchen)

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Kitchen',
    // ... more configuration

    pages: [
        { globalLink: 'main', heading: 'Kitchen' }, // Overrides heading
        { globalLink: 'lights' }
    ],

    subPages: []
};
```

After configuring, run the Local Script to transfer the changes.

### Example 2: different page selection per panel

#### Global_Script.ts

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        homePage,          // uniqueName: 'main'
        livingRoom,        // uniqueName: 'living_room'
        kitchen,           // uniqueName: 'kitchen'
        bedroom,           // uniqueName: 'bedroom'
        bathroom,          // uniqueName: 'bathroom'
        heating,           // uniqueName: 'heating'
        media              // uniqueName: 'media'
    ]
};
```

#### Local_Script_LivingRoom.ts

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_LivingRoom',

    pages: [
        { globalLink: 'main' },
        { globalLink: 'living_room' }, // Only pages relevant for the living room
        { globalLink: 'media' }
    ],

    subPages: [
        { globalLink: 'heating' } // As a sub page
    ]
};
```

#### Local_Script_Kitchen.ts

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Kitchen',

    pages: [
        { globalLink: 'main' },
        { globalLink: 'kitchen' }, // Different page selection
        { globalLink: 'living_room' }
    ],

    subPages: []
};
```

### Example 3: combining global and local pages

You can combine global pages with locally defined pages:

```typescript
// Local page definition only for this panel
const localSpecialPage: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'local_special',
    heading: 'Panel-specific',
    prev: 'main',
    next: 'living_room',
    items: [
        { id: 'alias.0.PanelSpecific.Sensor1' }
    ]
};

const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Special',

    pages: [
        { globalLink: 'main' },         // Global page
        localSpecialPage,               // Local page
        { globalLink: 'living_room' }   // Global page
    ],

    subPages: [
        { globalLink: 'media' },        // Global page
        { globalLink: 'heating' }       // Global page
    ]
};
```

### Example 4: deep linking - multiple use with custom names

You can use the same global page multiple times by assigning a separate `uniqueName` each time. The adapter then automatically creates isolated copies with adjusted navigation.

#### Global_Script.ts

```typescript
const roomControl: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'room_control',
    heading: 'Room control',
    next: 'room_settings',
    items: [
        { id: 'alias.0.Room.Light' },
        { id: 'alias.0.Room.Temperature' }
    ]
};

const roomSettings: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'room_settings',
    heading: 'Room settings',
    prev: 'room_control',
    items: [
        { id: 'alias.0.Room.Config' }
    ]
};

const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        roomControl,
        roomSettings
    ],
    maxNavigationAdjustRuns: 5 // Increased recursion depth for complex hierarchies
};
```

#### Local_Script.ts

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_MultiRoom',

    pages: [
        { globalLink: 'main' },

        // First instance for the living room
        {
            globalLink: 'room_control',
            uniqueName: 'living_room_control',
            heading: 'Living room'
        },
        // Automatically copied: room_settings → living_room_control_room_settings_copy_nav_xxxxx

        // Second instance for the bedroom
        {
            globalLink: 'room_control',
            uniqueName: 'bedroom_control',
            heading: 'Bedroom'
        }
        // Automatically copied: room_settings → bedroom_control_room_settings_copy_nav_xxxxx
    ],

    subPages: []
};
```

In this example two isolated copies of the `room_control` page are created, each with its own navigation to the automatically copied `room_settings` pages.

## Important notes and best practices

### Navigation and ordering

1. **Pages navigation**:
   - The navigation (`next`, `prev`) from the Global Script is used to automatically add missing referenced pages to `pages`
   - For both `next` and `prev` references the referenced page is automatically inserted directly after the current page (position `i+1`)
   - For `prev` references an additional warning is emitted, because inserting *after* the current page randomly changes the order — the page is still added
   - After the automatic addition the navigation parameters are removed and the pages are linked circularly

2. **SubPages navigation**: for pages in `subPages` the following applies:
   - Without navigation parameters: navigation from the Global Script is adopted
   - With at least one navigation parameter: all navigation parameters from the Local Script are used

3. **Example of automatic addition**: if you have `{ globalLink: 'living_room' }` in `pages` and the global page `living_room` has `next: 'kitchen'`, `kitchen` is automatically added to `pages` if not already present.

### Unreferenced global pages

Global pages that you do **not** include directly via `globalLink` in `pages` or `subPages` (and that are not pulled in automatically through navigation) are still carried over into the panel's `subPages` as page definitions. They are therefore defined on the panel, but only visible if they are reachable through navigation — otherwise they stay inactive.

**Consequence**: the Global Script applies adapter-wide to all panels. If you want to actually use a specific global page on a panel, include it explicitly; but expect that all remaining global pages are still carried along as (inactive) definitions.

### Documentation and tracking

For better tracking you can use comments in your Global Script to document changes:

```typescript
// Version 1.0 - Initial setup
// Version 1.1 - Added heating page
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [...]
};
```

### Avoiding errors

1. **Unique uniqueNames**: every page in the Global Script must have a unique `uniqueName`.

2. **Home page "main"**: the first page should have the `uniqueName` "main" or link to it.

3. **Global Script first**: the Global Script must be run before Local Scripts can access it.

4. **Keep navigation consistent**: make sure navigation references point to existing pages.

5. **Deep linking recursion depth**: for complex page hierarchies you can increase `maxNavigationAdjustRuns` to support deeper navigation chains. The default value is 3.

6. **uniqueName override**: when you assign your own `uniqueName`, copies are created automatically. Use this deliberately and only when needed.

### Maintenance and updates

1. **Central changes**: changes in the Global Script only require running the Global Script again.

2. **Update Local Scripts**: after changes in the Global Script the Local Scripts must be run again.

3. **Script updates**: the type definitions in the scripts are updated automatically during updates to keep maintenance simple.

4. **Panel-specific overrides**: use `heading` and navigation overrides sparingly to keep things maintainable.

## Troubleshooting

### "Global page with uniqueName X not found!"

**Problem**: the Local Script references a page that does not exist in the Global Script.

**Solution**:
- Check whether the `globalLink` matches the `uniqueName` in the Global Script
- Make sure the Global Script ran successfully

**Note**: a reference that cannot be found is removed from `pages` or `subPages`; the rest of the configuration continues to be processed.

### "Abort - double uniqueName X in config!"

**Problem**: two pages share the same `uniqueName`. This can happen after including global pages when a locally defined page uses the same name as a global page.

**Solution**:
- Assign a unique `uniqueName` to every page — local and global
- Note that the entire panel configuration is **aborted** as soon as a duplicate `uniqueName` is detected (no partial update)

### Page is not shown

**Problem**: a referenced page does not appear on the panel.

**Solution**:
- Check whether the page is listed in `pages` or `subPages`
- Check the navigation - is the page reachable via other pages?
- Check whether `hiddenByTrigger` is used

### Navigation does not work as expected

**Problem**: navigation between pages behaves differently than expected.

**Solution**:
- For `pages`: navigation is managed automatically, custom navigation is ignored
- For `subPages`: check whether you override navigation or use the one from the Global Script
- Make sure navigation references point to existing pages

## Summary

The Global Pages feature offers a powerful way to reuse page configurations:

- **Global Script**: defines all shared pages once, with `uniqueName`
- **Local Script**: references pages via `globalLink`
- **Flexibility**: overriding `heading` and navigation is possible
- **Deep linking**: use the same page multiple times with custom `uniqueName` and isolated navigation
- **Automatic navigation**: missing referenced pages are added automatically
- **Maintainability**: central changes affect all panels
- **Combinable**: global and local pages can be mixed

This architecture makes it possible to create a consistent user experience across multiple NSPanels, while still allowing panel-specific adjustments and even multiple use of the same pages with different navigation paths.
