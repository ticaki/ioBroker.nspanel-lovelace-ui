# Tasmota Tools

Der Tab **Tasmota Tools** stellt Werkzeuge zur Fehlerbehebung und Neuinstallation von Tasmota-Komponenten bereit. Er ist hauptsächlich für die Diagnose und manuelle Wartung gedacht — im normalen Betrieb werden Updates über den [Maintain](Maintain)-Tab durchgeführt.

> **Hinweis:** Dieser Tab ist nur im **Experten-Modus** des ioBroker sichtbar und wird erst angezeigt, wenn MQTT vollständig konfiguriert ist und mindestens ein Panel vorhanden ist.

> 🖼️ **Bild fehlt:** Screenshot des Tasmota-Tools-Tabs mit ausgefüllter IP-Auswahl und sichtbaren Buttons  
> Pfad: `Pictures/tasmotaTools/tasmotatools.png`

![Tasmota Tools](Pictures/tasmotaTools/tasmotatools.png)

---

## Panel auswählen

| Feld | Beschreibung |
|------|-------------|
| **IP des Panel** | Dropdown mit automatischer Vervollständigung. Die Liste der verfügbaren Tasmota-Geräte wird vom Adapter abgefragt. Es kann auch manuell eine IP-Adresse eingegeben werden. Pflichtfeld für alle Aktions-Buttons (muss eine gültige IPv4-Adresse sein). |

---

## Aktions-Buttons

| Button | Beschreibung |
|--------|-------------|
| **Tasmota WebUI öffnen** | Öffnet die Tasmota-Weboberfläche des gewählten Panels in einem neuen Browser-Fenster. |
| **Restart** | Startet Tasmota auf dem gewählten Panel neu. Zeigt einen Bestätigungsdialog vor der Ausführung. Zeigt den Fortschritt an. |
| **Berry Treiber installieren** | Installiert den Berry-Treiber auf dem Panel neu. Zeigt den Fortschritt an. Nützlich, wenn der Treiber beschädigt ist oder nach Tasmota-Updates. |
| **TFT Firmware installieren** | Installiert die TFT-Firmware neu. Berücksichtigt die Beta-TFT-Einstellung aus Global Settings (`useBetaTFT`) und das Panel-Modell. Zeigt den Fortschritt an. |

| **Tasmota zurücksetzen** | Setzt **alle Tasmota-Einstellungen** auf Werkseinstellungen zurück — WLAN-Daten bleiben erhalten, alles andere (MQTT, Skripte, Berry-Treiber) wird gelöscht. Zeigt einen Bestätigungsdialog. Entspricht `reset 4` in der Tasmota-Konsole. Danach muss das Panel neu initialisiert werden.

---

## Verwandte Seiten

- [Maintain](Maintain) — Reguläre Updates für Tasmota, TFT und Skript
- [NSPanel-Einstellungen](NSPanelsetting) — Panel initialisieren und konfigurieren
- [NSPanel flashen](NSPanel-flashen) — Initiales Flashen des NSPanels mit Tasmota
