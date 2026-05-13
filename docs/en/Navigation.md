# Navigation Overview

> ⚠️ **This page and the related admin tab are currently under active revision.** Both the documentation and the adapter implementation are not yet finalized. The described functionality may change.

The **Navigation Overview** tab allows centralized management of page navigation for all pages of a panel via the admin interface — as an alternative to navigation defined directly in the configuration script.

> **Note:** This tab is only shown after MQTT is fully configured and at least one panel has been added.

> 🖼️ **Image missing:** Full view of the Navigation Overview tab with a filled table  
> Path: `Pictures/navigation/navigation-overview-tab.png`

![Navigation Overview Tab](Pictures/navigation/navigation-overview-tab.png)

---

## How it works

The Navigation Overview stores a mapping to four navigation positions for each page (`navId`):

| Position | Field | Meaning |
|----------|-------|---------|
| Top left / Back | `left1` (prev) | Previous page — reached by swiping right or via the back button |
| Bottom left | `left2` (parent) | Parent page — parent page in the hierarchy |
| Top right / Forward | `right1` (next) | Next page — reached by swiping left or via the forward button |
| Bottom right | `right2` (home) | Start page — jump to the panel's start page |

When `prev`/`next` are configured, pages are automatically inserted into the navigation order. If `next` of page A points to page B and page B already has a `prev`, page A is inserted between them. In case of conflicts, `prev` takes priority.

> Pages without `next` and `prev` can only be reached via `{ navigate: 'true', targetPage: 'pagename' }` in the script.

---

## Controls

### Select Panel

Selects the panel whose navigation should be edited. The selection determines which pages appear in the table and dropdowns.

---

### Enable Navigation

| Config key | `_useNavigation` |
|------------|-----------------|
| Type | Checkbox |
| Default | `false` |

Enables centralized navigation control via the admin overview for the selected panel. When disabled, the adapter uses the navigation from the configuration script.

---

### Action Buttons

| Button | Function |
|--------|---------|
| **Load** | Loads the currently saved navigation configuration of the selected panel into the table |
| **Save** | Applies the table as the new navigation configuration for the selected panel |
| **Clear** | Deletes the saved navigation configuration of the panel |

> ⚠️ **Important:** After changing navigation IDs (`navId`), briefly switch to another tab and return for the changes to be applied correctly.

---

### Config Source

The **Config Source** field (read-only) shows where the currently active navigation configuration of the panel comes from (script or admin overview).

---

## Navigation Table

The table contains one row per page of the selected panel.

| Column | Description | Required |
|--------|-------------|---------|
| **navId** | Unique name of the page — corresponds to `uniqueName` in the script | yes |
| **uniqueID** | Internal panel page ID (loaded from the panel) | yes |
| **prev** | Previous page (left navigation) | at least one of prev/parent/next/home |
| **parent** | Parent page | at least one of prev/parent/next/home |
| **next** | Next page (right navigation) | at least one of prev/parent/next/home |
| **home** | Start page / home jump | at least one of prev/parent/next/home |

The table supports **export and import** (CSV/JSON) via the built-in table buttons.

---

## Related Pages

- [Navigation Flow](naviFlow) — Visual representation of the navigation structure
- [ScriptConfig](ScriptConfig) — Define navigation in the configuration script
