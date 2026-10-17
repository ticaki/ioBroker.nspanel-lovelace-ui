# Standard pages – introduction

**Every page is created in the admin.** Some of them have a **fixed layout**: the card decides where things sit on the panel, and all you choose is which states it shows and how they are labelled. Each of these cards has its own editor in the admin that draws the page the way the panel will show it.

The configuration script is the route for **experienced users in special cases** — normal operation does not need it. **If something cannot be set in the admin, please report it to the development team** ([issue](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues)) instead of working around it in the script.

## Where each page is configured

| Page | What it is for | Card description | Create in the admin |
|---|---|---|---|
| Thermostat | Heating and climate, up to eight heat circuits | Page Thermo2 | [Thermostat](PageThermo2-Admin) |
| Power | Energy flow with sources and consumers | Page Power | *(to come)* |
| Chart | History chart | [Page Chart](PageChart) | *(to come)* |
| QR code | Wi-Fi access as a QR code | Page QR | *(to come)* |
| Alarm | Alarm system with PIN and states | Page Alarm | *(to come)* |
| Trash | Waste collection dates | *(to come)* | *(to come)* |
| Menu page | Tile or list overview with freely chosen items | *(to come)* | *(to come)* |

## Things to keep in mind

- **One page, one source.** Once a page exists in the admin, the admin entry is what counts for the panels listed there. A page of the same name in the script is no longer used for those panels.
- **States come through alias channels.** The cards expect specific roles; the alias table lists them. The editor in the admin checks them while you pick a channel.
- **Unlock is not a page of its own** any more — it is configured together with the pages in the admin.
- **Popups** do not belong here: they open from within a page and are described on the popups page.
