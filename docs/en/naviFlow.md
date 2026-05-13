# Navigation Flow

> ⚠️ **Beta feature.** This tab is still in beta testing.

> **Note:** This tab is only visible in **expert mode** in ioBroker and requires a running adapter.

The **Navigation Flow** tab displays the navigation connections between all pages of a panel as an interactive flow diagram. This allows visual inspection of navigation paths and detection of errors in the configuration — for example missing connections or dead ends.

> 🖼️ **Image missing:** Example screenshot of Navigation Flow with several connected pages  
> Path: `Pictures/naviFlow/naviFlow.png`

![Navigation Flow](Pictures/naviFlow/naviFlow.png)

---

## Usage

1. **Select panel** — Dropdown at the top of the tab, selects the panel whose navigation structure is displayed.
2. **Read the diagram** — Each page appears as a node. Arrows show the navigation connections (prev, next, parent, home).
3. **Move nodes** — Nodes can be rearranged by drag & drop (visual only, no effect on the configuration).
4. **Zoom & Pan** — Mouse wheel to zoom, click & drag on the background to pan.

---

## Edge Colors and Styles

The arrows in the diagram differ by navigation type:

| Style | Meaning |
|-------|---------|
| Solid line | Direct navigation (next / prev) |
| Dashed line | Parent or home connection (parent / home) |

---

## Related Pages

- [Navigation Overview](Navigation) — Edit navigation configuration centrally
- [ScriptConfig](ScriptConfig) — Define navigation in the configuration script
