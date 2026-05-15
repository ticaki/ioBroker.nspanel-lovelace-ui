# Symbol Overview

The **Symbol Overview** tab displays all icons that can be used on the NSPanel. The search function makes it easy to find the desired icon, and clicking on it copies the icon name to the clipboard.

> 🖼️ **Image missing:** Screenshot of the Symbol Overview tab with the filter field visible and several icons shown  
> Path: `Pictures/symbolOverview/symbolOverview.png`

![Symbol Overview](Pictures/symbolOverview/symbolOverview.png)

---

## Usage

| Action | Description |
|--------|-------------|
| **Ctrl+F** (Win/Linux) or **Cmd+F** (Mac) | Shows the filter text field and moves focus to it. |
| **Filter field** | Filters the displayed icons by name (case-insensitive). The X icon in the field clears the filter and hides the field again. |
| **Click on an icon** | Copies the icon name to the clipboard. A confirmation bar at the bottom of the screen confirms the copy. |

---

## Using Icon Names in the Configuration Script

The copied icon name can be used directly in the configuration script as the `icon` parameter, for example:

```javascript
icon: 'home'
```

---

## Related Pages

- [ScriptConfig](ScriptConfig) — Use icon names in the configuration script
- [Global Settings](globelSettings) — Color scheme for icons
