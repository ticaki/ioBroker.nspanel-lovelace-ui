# PanelStatusBadge component

React component that shows the status of a panel as a coloured badge with live updates.

## Features
- Live status updates through ioBroker state subscriptions
- Colour-coded status display (green = online, grey = offline, yellow = flashing, …)
- Automatic translation of the status labels
- Configurable size and appearance
- Tooltip with the full status text
- Maximum width: 150 px (with label) or 24 px (icon only)

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `panelId` | string | - | **Required.** Panel ID for the status subscription |
| `oContext` | any | - | **Required.** ioBroker admin context (socket, instance) |
| `adapterName` | string | `'nspanel-lovelace-ui'` | Adapter name for the state ID |
| `size` | `'small' \| 'medium'` | `'small'` | Chip size |
| `showLabel` | boolean | `true` | Show the status text |
| `showIcon` | boolean | `true` | Show the status icon |
| `disableTooltip` | boolean | `false` | Disable the tooltip |
| `alive` | boolean | `true` | Adapter alive state (disables the badge when `false`) |

## Usage

```tsx
import { PanelStatusBadge } from './components/PanelStatusBadge';

<PanelStatusBadge
    panelId="panel_wohnzimmer"
    oContext={this.props.oContext}
    size="small"
    showLabel={true}
/>
```

### Icon only, without a label

```tsx
<PanelStatusBadge
    panelId="panel_kueche"
    oContext={this.props.oContext}
    showLabel={false}
    showIcon={true}
/>
```

### Without a tooltip

```tsx
<PanelStatusBadge
    panelId="panel_bad"
    oContext={this.props.oContext}
    disableTooltip={true}
/>
```

## Status types

The component uses the central configuration from `adminShareConfig.ts`:

| Status | Colour | Description |
|--------|--------|-------------|
| **offline** | grey (`#9E9E9E`) | Panel offline, no connection to the adapter |
| **initializing** | grey (`#9E9E9E`) | Panel object initialised (startup only) |
| **connecting** | light blue (`#03A9F4`) | MQTT connection being established |
| **connected** | blue (`#2196F3`) | MQTT connected, but no online status yet |
| **online** | green (`#4CAF50`) | Panel TFT is online and ready |
| **flashing** | yellow (`#FFC107`) | Firmware update in progress |
| **setup** | orange (`#d99800`) | Panel in setup mode |
| **error** | red (`#F44336`) | An error occurred (connection error, flash error, …) |

## State subscription

The component automatically subscribes to this state:
```
{adapter}.{instance}.panels.{panelId}.status
```

Example:
```
nspanel-lovelace-ui.0.panels.panel_wohnzimmer.status
```

The state holds a numeric value (0-7) that is mapped to the matching `PanelStatus`.

## Lifecycle

- **componentDidMount**: subscribes to the status state and loads the initial value
- **componentDidUpdate**: when the panel ID changes, it re-subscribes automatically (the old subscription is removed, a new one created)
- **componentWillUnmount**: cleanly removes the state subscription

## Central configuration

All status configurations live in `src/lib/types/adminShareConfig.ts`:

- `panelStatusStates`: mapping of numeric values to status names
- `panelStatusColors`: colour for each status
- `panelStatusTranslationKeys`: translation key for each status

This central place keeps the status display consistent across the whole adapter.

## Technical details

### Data flow
1. The component subscribes to the ioBroker state via `oContext.socket.subscribeState()`
2. On a state change the `onStatusChanged` callback runs
3. The numeric value is converted into a `PanelStatus`
4. The status is stored in the component state
5. Rendering happens with the matching colour and the translated label

### Performance
- Automatic cleanup on unmount prevents memory leaks
- Re-subscription only when the panel ID changes
- Few re-renders through targeted state management

### Error handling
- On a subscription error the status falls back to `offline`
- Console logging for debugging (can be removed in production)
- Fallback to `offline` for invalid status values
