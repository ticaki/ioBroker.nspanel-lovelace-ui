# Navigation Flow

The **Navigation Flow** tab visualizes the complete navigation structure of a panel as an interactive flow diagram. Each configured page appears as a node, and connecting arrows show all navigation paths. This makes it easy to spot configuration errors (missing connections, dead ends) at a glance.

> **Note:** Requires a running adapter. The adapter status (online/offline) is displayed directly in the tab.

> 🖼️ **Image missing:** Screenshot of Navigation Flow with several connected pages, visible legend, and open info panel  
> Path: `Pictures/naviFlow/naviFlow.png`

![Navigation Flow](Pictures/naviFlow/naviFlow.png)

---

## Controls

| Element | Function |
|---------|---------|
| **Panel selector** (dropdown) | Switches between configured panels; unsaved position changes are automatically saved on panel switch |
| **Refresh** | Reloads navigation data from the adapter |
| **Auto Layout** | Recalculates node positions automatically (after confirmation) |
| **Show system pages** | Checkbox — shows or hides internal system pages (IDs starting with `///`); `///unlock` is always shown |

---

## Edge Types and Legend

Each arrow type has its own color and line style. The legend is shown above the diagram.

| Type | Color | Style | Meaning |
|------|-------|-------|---------|
| `prev` | purple-blue `#6676d2` | solid | Previous page (swipe right / back button) |
| `next` | cyan `#19c3d2` | solid | Next page (swipe left / forward button) |
| `home` | yellow `#fbc02d` | dashed (long) | Jump to start page |
| `parent` | red `#d32f2f` | solid | Parent page in the hierarchy |
| `target` | green `#43a047` | dashed (short) | Direct jump via `targetPage` in the script |

Arrows are only created between pages that are actually linked in the navigation configuration. Pages without connections appear as isolated nodes.

---

## Moving Nodes and Info Panel

- **Move nodes:** Nodes can be freely repositioned by drag & drop. Positions are saved and restored the next time the tab is opened.
- **Click on a node:** Opens an info panel on the right side of the diagram showing detailed information about the page (page type, configured parameters).
- **Click on background:** Closes the info panel.

---

## Automatic Saving

Position changes are saved automatically:
- **Every 10 seconds** when there are unsaved changes
- **When switching browser tabs** or minimizing the window
- **When closing the tab** (via the Beacon API)

---

## Auto Layout

The **Auto Layout** button recalculates all node positions automatically. The calculation follows a tree algorithm:

1. The page with ID `main` (or the first page) is chosen as the root node
2. The main trunk (primary navigation line) is built by following the `prev`/`next` chain
3. Pages linked via `targetPages` are attached as child branches
4. Remaining pages are attached via `parent` references or the nearest trunk node
5. Final positioning uses the **d3-hierarchy tree algorithm** (horizontal tree diagram, left to right)

> ⚠️ Auto Layout overwrites all manually set positions. A confirmation dialog is shown before execution.

---

## Zoom and Navigation in the Diagram

| Action | Function |
|--------|---------|
| Mouse wheel | Zoom |
| Click & drag on background | Pan the diagram |
| Touch devices | Arrows show tooltips on tap; pinch to zoom |

---

## Related Pages

- [Navigation Overview](Navigation) — Edit navigation configuration in table form
- [ScriptConfig](ScriptConfig) — Define navigation in the configuration script (`prev`, `next`, `parent`, `home`, `targetPage`)
