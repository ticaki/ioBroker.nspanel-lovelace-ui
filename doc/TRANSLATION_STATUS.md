# NSPanel Lovelace UI - Documentation Translation Status

This document tracks the translation status of the NSPanel Lovelace UI adapter documentation.

## Translation Progress

### ✅ Completed Languages (Available for Users)
| Language | Status | Key Files Translated | Notes |
|----------|--------|---------------------|-------|
| 🇩🇪 **Deutsch** | ✅ Complete | All files | Original German documentation |
| 🇬🇧 **English** | ✅ Complete | All key files | Professional translations completed |
| 🇪🇸 **Español** | ✅ Ready | Home, Sidebar, Footer, General, ScriptConfig, Adapter-Installation | Major documentation files translated |
| 🇫🇷 **Français** | ✅ Ready | Home, Sidebar, Footer, General, ScriptConfig, Adapter-Installation | Major documentation files translated |
| 🇮🇹 **Italiano** | ✅ Ready | Home, Sidebar, Footer, General, ScriptConfig | Key documentation files translated |

### 🔄 Community Translation Needed
| Language | Status | Current State | How to Contribute |
|----------|--------|---------------|-------------------|
| 🇳🇱 **Nederlands** | 🔄 Basic Structure | General.md translated only | Translate remaining files using German source |
| 🇵🇹 **Português** | 🔄 Basic Structure | General.md translated only | Translate remaining files using German source |
| 🇵🇱 **Polski** | 🔄 Structure Only | TODO markers only | Complete translation needed |
| 🇷🇺 **Русский** | 🔄 Structure Only | TODO markers only | Complete translation needed |
| 🇺🇦 **Українська** | 🔄 Structure Only | TODO markers only | Complete translation needed |
| 🇨🇳 **中文** | 🔄 Structure Only | TODO markers only | Complete translation needed |

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

## Contributing Translations

To contribute translations:

1. **Choose a language** from the "Community Translation Needed" section above
2. **Navigate to the language directory** (e.g., `doc/nl/` for Dutch)
3. **Start with these priority files** in order:
   - `Home.md` - Main landing page  
   - `_Sidebar.md` - Navigation menu
   - `ScriptConfig.md` - Configuration documentation (most important technical content)
   - `Adapter-Installation.md` - Installation guide
4. **Translation guidelines**:
   - Remove `<!-- TODO: Translate -->` comments when translating
   - Keep all code examples and variable names exactly as they are
   - Preserve image links and technical terminology
   - Update internal links to point to same-language files
5. **Submit a pull request** with your translations

### Translation Template

When translating, replace German content but preserve:
- All `code blocks` and technical examples
- Image paths: `../Pictures/...`
- Configuration variables and technical terms
- Link structures (update language but keep relative paths)

---

**Last Updated**: Created during Issue #462 implementation  
**Contributors**: copilot, ticaki

**Need help?** Open an issue or ask in the ioBroker forum!