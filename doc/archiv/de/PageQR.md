# Page QR

Die **QR-Seite** zeigt am Panel einen QR-Code, den man mit dem Handy abscannt: die Zugangsdaten des
Gäste-WLANs, eine Telefonnummer oder eine Internetadresse. Sie wird **ausschließlich im Admin**
eingerichtet — ein Konfigurationsskript kann diesen Kartentyp nicht anlegen, es weist ihn ausdrücklich ab
(„is only supported in the admin configuration! Skipped!", `config-manager.ts`). Es gibt hier also keinen
zweiten Weg und entsprechend auch keine Skript-Beschreibung.

➡️ **[QR-Seite – Konfiguration im Admin](PageQR-Admin)**

Dort stehen alle Felder: der QR-Code-Typ, Überschrift und Inhalt, bei WLAN zusätzlich Verschlüsselung,
Passwort (auch aus den zentralen Zugangsdaten), verstecktes Netz und der Schalter, der das Gäste-WLAN
freigibt.

## Was am Panel ankommt

**WLAN** — der Code füllt die obere Hälfte, darunter stehen zwei Zeilen. Die erste zeigt den Netznamen,
die zweite entweder das Passwort **oder** einen Schalter; beides zusammen geht nicht. Die Beschriftungen
*SSID*, *Password* und *Telephone* kommen aus der Panel-Firmware und bleiben englisch, auch wenn der
Adapter auf Deutsch läuft.

<img alt='WLAN-Seite mit Passwortzeile' src='../Pictures/pageQR/panelPageQRWifiPW.png' height='250'> <img alt='WLAN-Seite mit Schalter statt Passwort' src='../Pictures/pageQR/panelPageQRWifiSwitch.png' height='250'>

**Telefon** — die Nummer steht im Code; nach dem Scannen bietet das Handy sie direkt zum Anrufen an.
Sinnvoll mit Ländervorwahl, also `+49…`.

**URL** — der klassische Fall: hinter dem Code steckt eine Adresse, die das Handy nach dem Scannen öffnet.

<img alt='Telefon-Seite' src='../Pictures/pageQR/panelPageQRTelefon.png' height='250'> <img alt='URL-Seite' src='../Pictures/pageQR/panelPageQRURL.png' height='250'>

## Navigation

Wie die Seite erreicht wird — Hauptseite oder Unterseite, mit welchen Nachbarn —, legt die
**Panel-Zuweisung** im selben Tab fest; sie ist auf der [Admin-Seite](PageQR-Admin#7-panel-zuweisung-und-navigation)
beschrieben. Ein Panel zeigt eine QR-Seite nur, wenn sie ihm dort zugewiesen ist.

> **Der Code wird im Panel erzeugt, nicht im Adapter.** Der Adapter schickt nur den Text (SSID,
> Verschlüsselung, Passwort, Nummer, Adresse); gezeichnet wird er von der Panel-Firmware. Sehr lange
> Inhalte werden dadurch schnell unleserlich — kurze Adressen scannen zuverlässiger.
