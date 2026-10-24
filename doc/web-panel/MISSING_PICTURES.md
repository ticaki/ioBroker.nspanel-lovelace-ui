# Web-Panel: Referenzbilder

Grundlage: Wiki-Klon `~/ioBroker.nspanel-lovelace-ui.wiki/Pictures` (Stand 2026-04-10) und
`doc/Pictures` im Repo. Als Vorlage taugen nur **Aufnahmen des Panels selbst** (ca. 480×320
oder ein Vielfaches davon), keine Admin-Screenshots.

## Vorhanden (Panel-Aufnahmen)

| Seite | Datei(en) im Wiki | Anmerkung |
| --- | --- | --- |
| Startseite | `Pictures/Panel_mit_logo.png` | mit Gehäuse, Startlogo |
| screensaver (Standard) | `Pictures/screensaver/screensaverStd.png` | |
| screensaver (Alternativ) | `Pictures/screensaver/screensaverAlt.png` | |
| screensaver2 (Advanced) | `Pictures/screensaver/screensaverAdv.png` | mit Bereichs-Beschriftung |
| screensaver3 (EasyView) | `Pictures/screensaver/screensaverEasy.png` | |
| Screensaver mit Benachrichtigung | `Pictures/screensaver/screensaverNotify.png` | |
| cardMedia | `Pictures/pageMedia/spotify.png`, `alexa.png`, `alexa2.png`, `equalizer.png`, `playlist.png`, `speaker.png`, `tracklist.png` | gut abgedeckt |
| cardThermo2 | `Pictures/PageThermo2/Thermo2_1.png`, `Thermo2_2.png`, `Thermo2MitDatenpunkten.png` | |
| cardQR | `Pictures/pageQR/panelPageQRTelefon.png`, `panelPageQRURL.png`, `panelPageQRWifiPW.png`, `panelPageQRWifiSwitch.png` | |
| cardChart / cardLChart | `Pictures/pageChart/Balkenchart.png`, `Linechart.png` | |
| cardTrash | `Pictures/pageTrash/panel-ansicht-4.png`, `panel-ansicht-6.png` | |
| Symbolübersicht | `Pictures/symbolOverview/symbolOverview.png` | Icon-Referenz |

Unklar (vermutlich Admin-Screenshots, bitte prüfen): `Pictures/pagePower/*.png`,
`Pictures/PagePopup/pagePopup_*.png`.

## Fehlend (bitte nachreichen)

Ideal: Screenshot oder Foto des Displays, möglichst frontal, pro Zustand ein Bild.

### Karten

- [ ] **cardEntities** (Liste mit 4 Zeilen; je ein Beispiel mit light, switch, shutter, number, text, button, input_sel)
- [ ] **cardGrid** (6 Kacheln)
- [ ] **cardGrid2** (8 Kacheln)
- [ ] **cardGrid3** (Variante mit Wertanzeige)
- [ ] **cardThermo** (altes Thermostat, nicht Thermo2)
- [ ] **cardAlarm** (scharf / unscharf / Eingabe des Codes)
- [ ] **cardSchedule**
- [ ] **cardUnlock** (PIN-Eingabe)
- [ ] **cardPower** (Energiefluss-Seite, Panel-Ansicht)
- [ ] **cardMedia** mit Lautstärke-Popup / ohne Logo (falls abweichend)

### Popups

- [ ] **popupLight** (Helligkeit, Farbtemperatur, Farbrad)
- [ ] **popupLightNew**
- [ ] **popupShutter** und **popupShutter2** (Position / Lamellen)
- [ ] **popupFan**
- [ ] **popupSlider**
- [ ] **popupThermo** (Modusauswahl)
- [ ] **popupInSel** (Auswahl-Liste)
- [ ] **popupTimer**
- [ ] **popupNotify** und **popupNotify2** (mit und ohne Buttons, langer Text)

### Screensaver-Zustände

- [ ] Standard-Screensaver mit **Status-Icons** (`statusUpdate`) links/rechts unten
- [ ] Screensaver mit **Glocke** neben der Uhrzeit (`time~HH:MM~<icon>`)

Gedimmter Screensaver: kein Bild nötig, Vorgabe ist Helligkeit **und** Kontrast herunterregeln.

### Startseite

- [ ] **Startlogo als Video/GIF/Bildershow** (wird nachgereicht; bis dahin zeigt die Startseite ein Provisorium)

### Modelle

- [ ] **us-p** (Hochformat) Screensaver und eine Karte
- [ ] **us-l** Screensaver und eine Karte, falls abweichend von eu
