# Web-Panel: Referenzbilder

Stand: 2026-10-25

## Referenz: Aufnahmen vom Nextion-Emulator (eu)

Ordner: `/mnt/projekte/nspanel emu/` (Samba-Freigabe `//samba.kiemen.com/projekte`), 41 Bilder,
aufgenommen am 2026-10-24 mit dem Panel `emu` (Topic `emu_topic`). Das ist die echte
HMI-Darstellung und damit die maßgebliche Vorlage für das Web-Panel (eu). Die Bilder sind
ca. 470×320, teils mit grauem Rand bzw. rotem Balken des Emulator-Fensters.

Erzeugt mit `doc/web-panel/emu-pictures-config.ts` (Seiten) und
`doc/web-panel/emu-pictures-helper.js` (Screensaver-Zustände, Popups) - siehe `PLAN.md`,
Abschnitt Testumgebung.

| Bereich | Dateien |
| --- | --- |
| cardEntities | `cardEntities-1-light-switch-shutter-number.png`, `cardEntities-2-text-button-inputsel-timer.png` |
| cardGrid | `cardGrid.png` (6 Kacheln), `cardGrid-3-tiles.png` |
| cardGrid2 | `cardGrid2.png` (8 Kacheln), `cardGrid2-usp-subpage.png` (Unterseite, Pfeil runter) |
| cardGrid3 | `cardGrid3-icons.png` (ohne useValue), `cardGrid3-usevalue-default-font.png` (useValue ohne fontSize), `cardGrid3-usevalue-fonts-0-3.png`, `cardGrid3-usevalue-fonts-4-5.png` (fontSize 0-5, Font 5 an der Kachel abgeschnitten, Icon in Font 3) |
| cardThermo | `cardThermo.png` |
| cardSchedule | `cardSchedule.png` |
| cardChart | `cardChart.png` |
| cardPower | `cardPower.png` - Achtung: die grauen Kästen um die Navigationspfeile sind ein Zwischenzustand (Adapter-Neustart während der Aufnahme), richtig sind türkise Pfeile wie auf den anderen Seiten |
| cardAlarm | `cardAlarm.png` (unscharf, „disarm“) |
| cardUnlock | `cardUnlock.png`, `cardUnlock-lockicon.png` |
| popupLight | `popupLight-switch-only.png`, `popupLight-dimmer.png`, `popupLight-ct.png`, `popupLight-hue-ct.png`, `popupLight-hue-colorwheel.png` |
| popupShutter | `popupShutter-tilt.png` (mit Lamellen), `popupShutter2.png` |
| popupFan | `popupFan.png` |
| popupSlider | `popupSlider-1-slider.png`, `popupSlider-3-slider.png` |
| popupInSel | `popupInSel.png` |
| popupThermo | `popupThermo.png` |
| popupTimer | `popupTimer-running.png`, `popupTimer-edit-minutes.png`, `popupTimer-edit-seconds.png` |
| popupNotify | `popupNotify-information-textsize3.png` (ohne Buttons, langer Text), `popupNotify-acknowledge-3buttons-textsize3.png` |
| Screensaver Standard | `screensaver-standard-statusicons.png` (Status-Icons links/rechts oben), `screensaver-standard-infoicon.png` (Info-Icon unter der Uhrzeit) |
| Screensaver Alternativ | `screensaver-alternate-infoicon.png`, `screensaver-alternate-infoicon-dimmed.png` (gedimmt), `screensaver-alternate-notify.png` (Benachrichtigung) |
| Screensaver Advanced | `screensaver2-advanced-infoicon.png` |
| Screensaver EasyView | `screensaver3-easyview-infoicon.png` |

Ältere Wiki-Bilder (`~/ioBroker.nspanel-lovelace-ui.wiki/Pictures`, Stand 2026-04-10) bleiben
Referenz für cardMedia (`pageMedia/*`), cardThermo2 (`PageThermo2/*`), cardQR (`pageQR/*`),
cardLChart (`pageChart/Linechart.png`), cardTrash (`pageTrash/*`) und die Symbolübersicht.

## Fehlend

- [ ] **cardAlarm scharf geschaltet** (nur der unscharfe Zustand ist vorhanden)
- [ ] **cardMedia mit Lautstärke-Popup** - braucht einen echten Player (z. B. Media-Seite von ns_panel6)
- [ ] **Startlogo als Video/GIF** - wird nachgereicht, bis dahin Provisorium
- [ ] **us-p** (Hochformat) und **us-l** - Screensaver und je eine Karte, braucht ein Panel dieses Modells
- [ ] **popupNotify mit anderen Textgrößen** (vorhanden ist nur textSize 3, der Standard)

Nicht nötig bzw. nicht möglich:

- `popupLightNew` und `popupNotify2` sendet der Adapter nie.
- Gedimmter Screensaver: Vorgabe ist Helligkeit und Kontrast herunterregeln (ein Beispiel liegt trotzdem vor).
