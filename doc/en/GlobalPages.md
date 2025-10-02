# Global Pages and Global Link

## Overview

The **Global Pages** feature allows you to define page configurations centrally and reuse them across multiple panel scripts. This is particularly useful when you have multiple NSPanels and want them to use the same pages, but with different navigation or arrangement for each panel.

The feature consists of two main components:
- **Global Script**: Defines reusable pages centrally
- **Local Script**: References pages from the Global Script using `globalLink`

## Concept and Benefits

### What are Global Pages?

Global Pages are page definitions that are stored in a separate **Global Script**. These pages can then be referenced by multiple **Local Scripts** (panel-specific configurations).

### Benefits

- **Central Maintenance**: Changes to a page are made only once in the Global Script and automatically applied to all panels
- **Consistency**: All panels use the same page definitions
- **Flexibility**: Each panel can use the global pages in a different order and with different navigation
- **Overridability**: Certain properties like `heading` can be overridden in the Local Script
- **Reduced Redundancy**: No need to define the same pages multiple times

## Setting up the Global Script

### 1. Create Global Script

The Global Script defines the reusable pages. It is typically stored in the file `Global_Script.ts`.

#### Basic Structure

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig', // Required field
    
    // All global pages
    subPages: [
        // Page definitions go here
    ],
    
    // Optional: Shared navigation
    navigation?: NavigationItemConfig[],
    
    // Optional: Native Page Items
    nativePageItems?: any[]
};
```

#### Important Properties

- `type: 'globalConfig'` - **Required**: Identifies this as a Global Config
- `subPages` - Array with all global page definitions
- `navigation` - Optional: Shared navigation configuration
- `nativePageItems` - Optional: Shared native page items

### 2. Define Global Pages

Each page in the Global Script must have a unique `uniqueName`. This is the key that will be used to reference the page later.

#### Example: Simple Grid Page

```typescript
const livingRoom: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'living_room', // Important: unique name!
    heading: 'Living Room',
    prev: 'main',
    next: 'kitchen',
    items: [
        { id: 'alias.0.LivingRoom.Light.Main' },
        { id: 'alias.0.LivingRoom.Socket.TV' },
        { id: 'alias.0.LivingRoom.Blind.Shutter1' },
        // ... more items
    ]
};
```

#### Example: Media Page

```typescript
const mediaPlayer: ScriptConfig.PageMedia = {
    type: 'cardMedia',
    uniqueName: 'media_living_room',
    heading: 'Sonos Living Room',
    prev: 'living_room',
    next: 'main',
    media: {
        id: 'sonos.0.LivingRoom',
        speakerList: ['Living Room', 'Kitchen', 'Bedroom'],
        playList: ['Favorites', 'Radio'],
        volumePresets: ['Quiet?20', 'Normal?50', 'Loud?80'],
        minValue: 0,
        maxValue: 100
    },
    items: []
};
```

#### Example: Thermostat Page

```typescript
const heating: ScriptConfig.PageThermo = {
    type: 'cardThermo',
    uniqueName: 'heating_living_room',
    heading: 'Living Room Heating',
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

### 3. Assemble Global Config

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

### 4. Send Global Config to Adapter

At the end of the Global Script, the configuration is sent to the adapter:

```typescript
try {
    log(await sendToAsync(
        'nspanel-lovelace-ui.0',
        'ScriptConfigGlobal',
        globalPagesConfig,
        { timeout: 30_000 }
    ));
} catch (e) {
    log(`Error in sendTo ScriptConfig: ${e}! This usually means that the adapter is not working!`, 'error');
}
```

**Important**: The Global Script only needs to be executed once and stores the configuration in the adapter. Changes require re-executing the script.

## Configure Local Script

### 1. Reference Pages with globalLink

In the Local Script (panel-specific configuration), global pages are included via `globalLink`.

#### Minimal Reference

The simplest form is to specify only the `globalLink`:

```typescript
const livingRoomPage: PageType = {
    globalLink: 'living_room' // References the page with uniqueName 'living_room'
};
```

This inherits **all** properties from the global page, including navigation (`prev`, `next`, etc.).

#### With Optional Heading

You can override the heading:

```typescript
const livingRoomPage: PageType = {
    heading: 'Living Area', // Overrides the heading from the Global Script
    globalLink: 'living_room'
};
```

#### With Optional uniqueName

You can also assign your own `uniqueName`:

```typescript
const livingRoomPage: PageType = {
    uniqueName: 'lr_panel1', // Own uniqueName for this panel
    heading: 'Living Area',
    globalLink: 'living_room'
};
```

### 2. Navigation in Pages

When a global page is used in `pages` (main pages), the navigation from the global page is considered to automatically add missing referenced pages. After that, the navigation parameters (`prev`, `next`, `home`, `parent`) of the inserted pages are **removed**, and the pages are integrated into the circular navigation of the main pages.

**Automatic Page Addition**: If a global page has `next` or `prev` pointing to another global page that is not yet in `pages`, it will be automatically added. This only happens for `next` references - for `prev` references, a warning is issued as it would change the order.

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_LivingRoom',
    // ... more configuration
    
    pages: [
        { globalLink: 'main' },            // Becomes first main page
        { globalLink: 'living_room' },     // Navigation automatically adjusted
        { globalLink: 'media_living_room' }, // Navigation automatically adjusted
    ],
    
    subPages: []
};
```

**Important**: The first page in `pages` should have the `uniqueName` "main" (or link to it), as this is used as the start page.

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
            // Overrides navigation from Global Script
            prev: 'main',
            next: 'kitchen_panel2',
            home: 'main'
        },
        {
            globalLink: 'media_living_room'
            // No navigation specified = uses navigation from Global Script
        }
    ]
};
```

**Navigation Behavior in subPages**:
- If **at least one** navigation parameter (`prev`, `next`, `home`, or `parent`) is specified, **all four** parameters from the Local Script are used (even if they are `undefined`)
- If **no** navigation parameter is specified, the navigation from the Global Script is inherited

## Practical Examples

### Example 1: Multiple Panels with Same Pages

#### Global_Script.ts

```typescript
// Global page definitions
const mainPage: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'main',
    heading: 'Overview',
    next: 'lights',
    items: [
        { id: 'alias.0.House.Temperature.Outside' },
        { id: 'alias.0.House.Windows.Open' },
        { id: 'alias.0.House.Door.Status' }
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
        mainPage,
        lightsPage
    ]
};

// Send to adapter
await sendToAsync('nspanel-lovelace-ui.0', 'ScriptConfigGlobal', globalPagesConfig);
```

#### Local_Script_Panel1.ts (Living Room)

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_LivingRoom',
    // ... more configuration
    
    pages: [
        { globalLink: 'main', heading: 'Living Room' }, // Overrides heading
        { globalLink: 'lights' }
    ],
    
    subPages: []
};

await sendToAsync('nspanel-lovelace-ui.0', 'ScriptConfig', config);
```

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

await sendToAsync('nspanel-lovelace-ui.0', 'ScriptConfig', config);
```

### Example 2: Different Page Selection per Panel

#### Global_Script.ts

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        mainPage,          // uniqueName: 'main'
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
        { globalLink: 'living_room' }, // Only relevant pages for living room
        { globalLink: 'media' }
    ],
    
    subPages: [
        { globalLink: 'heating' } // As sub page
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

### Example 3: Combining Global and Local Pages

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

## Important Notes and Best Practices

### Navigation and Order

1. **Pages Navigation**: 
   - The navigation (`next`, `prev`) from the Global Script is used to automatically add missing referenced pages to `pages`
   - For `next` references, the referenced page is automatically inserted after the current page
   - For `prev` references, a warning is issued as it would randomly change the order
   - After automatic addition, the navigation parameters are removed and pages are circularly linked

2. **SubPages Navigation**: For pages in `subPages`:
   - Without navigation parameters: Navigation from Global Script is inherited
   - With at least one navigation parameter: All navigation parameters from Local Script are used

3. **Example of Automatic Addition**: If you have `{ globalLink: 'living_room' }` in `pages` and the global page `living_room` has `next: 'kitchen'`, `kitchen` will be automatically added to `pages` if not already present.

### Documentation and Tracking

For better tracking, you can use comments in your Global Script to document changes:

```typescript
// Version 1.0 - Initial setup
// Version 1.1 - Added heating page
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [...]
};
```

### Error Prevention

1. **Unique uniqueNames**: Each page in the Global Script must have a unique `uniqueName`.

2. **Main Page "main"**: The first page should have the `uniqueName` "main" or link to it.

3. **Global Script First**: The Global Script must be executed before Local Scripts can access it.

4. **Keep Navigation Consistent**: Ensure that navigation references point to existing pages.

### Maintenance and Updates

1. **Central Changes**: Changes in the Global Script only require re-executing the Global Script.

2. **Update Local Scripts**: After changes in the Global Script, the Local Scripts do not need to be re-executed - they automatically use the current global configuration.

3. **Panel-specific Overrides**: Use `heading` and navigation overrides sparingly to maintain maintainability.

## Troubleshooting

### "Global page with uniqueName X not found!"

**Problem**: The Local Script references a page that does not exist in the Global Script.

**Solution**: 
- Check if the `globalLink` matches the `uniqueName` in the Global Script
- Ensure that the Global Script was executed successfully

### Page is Not Displayed

**Problem**: A referenced page does not appear on the panel.

**Solution**:
- Check if the page is listed in `pages` or `subPages`
- Check the navigation - is the page reachable from other pages?
- Check if `hiddenByTrigger` is being used

### Navigation Does Not Work as Expected

**Problem**: Navigation between pages behaves differently than expected.

**Solution**:
- For `pages`: Navigation is automatically managed, custom navigation is ignored
- For `subPages`: Check if you are overriding navigation or using the one from the Global Script
- Ensure that navigation references point to existing pages

## Summary

The Global Pages feature provides a powerful way to reuse page configurations:

- **Global Script**: Define all shared pages once with `uniqueName`
- **Local Script**: Reference pages via `globalLink`
- **Flexibility**: Override `heading` and navigation as needed
- **Maintainability**: Central changes affect all panels
- **Combinable**: Global and local pages can be mixed

This architecture enables you to create a consistent user experience across multiple NSPanels while still allowing panel-specific customizations.
