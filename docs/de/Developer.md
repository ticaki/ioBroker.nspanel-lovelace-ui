# Developer

Der Tab **Developer** enthält erweiterte Einstellungen für Debugging und interne Konfiguration.

> **Hinweis:** Dieser Tab ist nur im **Expertenmodus** sichtbar. Die Einstellungen hier sind für die Fehlersuche und Entwicklung gedacht und können die Performance oder das Verhalten des Adapters beeinflussen.

> 🖼️ **Bild fehlt:** Gesamtansicht des Developer Tabs  
> Pfad: `Pictures/developer/developer-tab-uebersicht.png`  
> *Screenshot des kompletten Tabs im Expertenmodus einfügen.*

![Developer Tab Übersicht](Pictures/developer/developer-tab-uebersicht.png)

---

## Logging

Diese vier Checkboxen aktivieren zusätzliche Debug-Ausgaben im ioBroker-Log. Sie sollten nur bei der Fehlersuche aktiviert werden, da sie die Log-Menge erheblich erhöhen können.

| Konfig-Key | Standard | Beschreibung |
|-----------|---------|--------------|
| `additionalLog` | `false` | Allgemeines erweitertes Logging — gibt zusätzliche interne Verarbeitungsschritte aus |
| `debugLogMqtt` | `false` | Loggt alle eingehenden und ausgehenden MQTT-Nachrichten |
| `debugLogStates` | `false` | Loggt alle State-Änderungen die der Adapter verarbeitet |
| `debugLogPages` | `false` | Loggt den Aufbau und das Rendering von Seiten |

> Alle vier Optionen sind Checkboxen. Es können mehrere gleichzeitig aktiviert werden.

---

## Weitere Einstellungen

### Fix Broken Common Types

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `fixBrokenCommonTypes` |
| Typ | Checkbox |
| Standard | `false` |

Versucht, fehlerhafte `common.type`-Definitionen bei ioBroker-Datenpunkten automatisch zu korrigieren. Nützlich wenn Geräte oder Adapter inkonsistente Typen liefern (z. B. ein `boolean`-Datenpunkt der tatsächlich Zahlen liefert).

---

### TFT-Firmware-Version pinnen

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `forceTFTVersion` |
| Typ | Textfeld |
| Standard | leer |

Erzwingt eine bestimmte TFT-Firmware-Version beim Flash-Vorgang, unabhängig von der aktuell empfohlenen Version. Format: Versionsnummer als String, wie sie im versions-JSON des Adapters aufgeführt ist (z. B. `4.3.12` — nur als Formatbeispiel, keine Empfehlung).

> ⚠️ **Nur für Tests.** Kein Support für Probleme die durch das Pinnen einer Version entstehen. Auf eigenes Risiko verwenden.

---

### Entwickler-Symbole ausblenden

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `hideDeveloperSymbols` |
| Typ | Checkbox |
| Standard | `false` |

Blendet Hinweissymbole und Markierungen aus, die normalerweise auf nicht vollständig konfigurierte Datenpunkte oder Entwicklungsfeatures hinweisen. Nützlich um eine sauberere Admin-Oberfläche zu erhalten.

---

## Danger Zone

> ⚠️ **Diese Einstellungen nur verwenden, wenn genau bekannt ist was sie bewirken.**

### URL-Bearbeitung aktivieren

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `_activateURls` |
| Typ | Checkbox |
| Standard | `false` |
| Wird gespeichert | **Nein** — wird bei jedem Neustart zurückgesetzt |

Schaltet die Bearbeitung der drei URL-Felder frei (Schutz gegen versehentliches Ändern). Da diese Einstellung nicht persistiert wird, muss sie nach jedem Neustart der Admin-Oberfläche erneut aktiviert werden.

---

### Versions-JSON URL

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `versionJsonUrl` |
| Typ | Textfeld |
| Standard | `https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json` |
| Aktiv wenn | `_activateURls` = `true` |

Überschreibt die URL von der der Adapter die verfügbaren Versionen abruft. Nützlich um auf einen eigenen Spiegel-Server oder einen Test-Branch zu zeigen.

---

### Berry-Script URL

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `berryUrl` |
| Typ | Textfeld |
| Standard | `https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry` |
| Aktiv wenn | `_activateURls` = `true` |

Überschreibt die URL von der der Adapter das Tasmota-Berry-Script lädt.

---

### TFT-Server URL

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `tftUrl` |
| Typ | Textfeld |
| Standard | `http://nspanel.de` |
| Aktiv wenn | `_activateURls` = `true` |

Überschreibt die URL des Servers von dem die TFT-Firmware heruntergeladen wird. **Nur HTTP** wird unterstützt (kein HTTPS).

---

## Unbekannte Tokens loggen

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `logUnknownTokens` |
| Typ | Checkbox |
| Standard | `false` |

Loggt alle Tokens (Datenpunkt-Referenzen) die der Adapter nicht auflösen kann. Hilfreich bei der Diagnose von Konfigurationsproblemen, bei denen Datenpunkte nicht gefunden werden.

---

> **Hinweis:** Dieser Tab enthält weitere Elemente (Channel Config Dialog, Icon-Auswahl) die zu Entwicklungs- und Testzwecken hinzugefügt wurden und nicht für den produktiven Einsatz gedacht sind.

---

## Zusammenfassung aller Konfig-Keys

| Key | Typ | Standard | Beschreibung |
|-----|-----|---------|--------------|
| `additionalLog` | boolean | `false` | Erweitertes allgemeines Logging |
| `debugLogMqtt` | boolean | `false` | MQTT-Nachrichten loggen |
| `debugLogStates` | boolean | `false` | State-Änderungen loggen |
| `debugLogPages` | boolean | `false` | Seiten-Rendering loggen |
| `fixBrokenCommonTypes` | boolean | `false` | Fehlerhafte ioBroker-Typen korrigieren |
| `forceTFTVersion` | string | `""` | TFT-Version erzwingen (nur Tests) |
| `hideDeveloperSymbols` | boolean | `false` | Entwickler-Hinweissymbole ausblenden |
| `_activateURls` | boolean | `false` | URL-Bearbeitung freischalten (nicht persistiert) |
| `versionJsonUrl` | string | GitHub-URL | Versions-JSON URL überschreiben |
| `berryUrl` | string | GitHub-URL | Berry-Script URL überschreiben |
| `tftUrl` | string | `http://nspanel.de` | TFT-Server URL überschreiben (nur HTTP) |
| `logUnknownTokens` | boolean | `false` | Unbekannte Tokens loggen |

---

## Verwandte Seiten

- [Developer-Templates](Developer-Templates) — Template-System für Entwickler
- [Developer-Readme](Developer-Readme) — Entwickler-Dokumentation
- [Developer-News (Latest)](Developer-News-(Latest)) — Aktuelle Entwickler-Neuigkeiten
