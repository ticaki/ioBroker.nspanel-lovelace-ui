# NSPanel Lovelace UI - Documentation Translation Status

This document tracks the translation status of the NSPanel Lovelace UI adapter documentation.

## Translation Progress

### ✅ Completed Languages
| Language | Status | Key Files Translated | Notes |
|----------|--------|---------------------|-------|
| 🇩🇪 **Deutsch** | ✅ Original | All files | Original German documentation |
| 🇬🇧 **English** | ✅ Complete | All key files | Professional translations completed |

### 🟡 Partially Translated Languages  
| Language | Status | Key Files Translated | Notes |
|----------|--------|---------------------|-------|
| 🇪🇸 **Español** | 🟡 Good | Home, Sidebar, Footer, General, ScriptConfig, Adapter-Installation | Major documentation files translated |
| 🇫🇷 **Français** | 🟡 Good | Home, Sidebar, Footer, General, ScriptConfig, Adapter-Installation | Major documentation files translated |
| 🇮🇹 **Italiano** | 🟡 Good | Home, Sidebar, Footer, General, ScriptConfig | Key documentation files translated |
| 🇳🇱 **Nederlands** | 🟡 Basic | General | Minimal translation |
| 🇵🇹 **Português** | 🟡 Basic | General | Minimal translation |

### 🔴 Placeholder Languages
| Language | Status | Notes |
|----------|--------|-------|
| 🇵🇱 **Polski** | 🔴 Placeholder | Structure created, needs translation |
| 🇷🇺 **Русский** | 🔴 Placeholder | Structure created, needs translation |
| 🇺🇦 **Українська** | 🔴 Placeholder | Structure created, needs translation |
| 🇨🇳 **中文** | 🔴 Placeholder | Structure created, needs translation |

## File Structure

Each language directory contains:
- `Home.md` - Main entry page
- `_Sidebar.md` - Navigation sidebar
- `_Footer.md` - Page footer
- All documentation pages copied from German original

## Translation Guidelines

### For Contributors

1. **Preserve Code Examples**: Never translate code snippets, variable names, or configuration values
2. **Maintain Links**: Update internal links to point to same language pages
3. **Keep Structure**: Maintain the same file and folder structure as German original
4. **Technical Terms**: Keep technical terms in English where appropriate (e.g., "MQTT", "NSPanel")

### Important Files to Translate First

Priority order for translation:
1. `Home.md` - Main landing page
2. `_Sidebar.md` - Navigation menu
3. `_Footer.md` - Footer text
4. `ScriptConfig.md` - Configuration documentation
5. `Adapter-Installation.md` - Installation guide
6. `General.md` - General settings

## Language-Specific Notes

### Spanish (Español)
- Completed basic navigation and home pages
- Uses formal language style
- Technical terms preserved in English

### French (Français)  
- Completed basic navigation and home pages
- Uses formal language style
- Technical terms preserved in English

### Italian (Italiano)
- Completed basic navigation and home pages
- Uses formal language style  
- Technical terms preserved in English

## Contributing Translations

To contribute translations:

1. Choose a language from the "Placeholder" or "Partially Translated" sections
2. Edit files in the `doc/{language-code}/` directory
3. Remove `<!-- TODO: Translate -->` comments when translating
4. Test that internal links work correctly
5. Submit a pull request

## Automated Translation Tools

The repository includes helper scripts in `/tmp/` for:
- Creating language structure (`translate-docs.js`)
- Improving English translations (`improve-english.js`)

---

**Last Updated**: Created during Issue #462 implementation
**Contributors**: copilot, ticaki