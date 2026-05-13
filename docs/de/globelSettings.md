# Globale Einstellungen

Der Tab **Global Settings** enthält adapterweite Einstellungen, die für alle angeschlossenen NSPanels gelten.

> **Hinweis:** Dieser Tab wird erst angezeigt, wenn MQTT vollständig konfiguriert ist und mindestens ein Panel angelegt wurde. Alle Einstellungen können nur geändert werden, während der Adapter läuft.

---

## Übersicht der Einstellungen

### Beta TFT-Firmware

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `useBetaTFT` |
| Typ | Checkbox |
| Standard | `false` |
| Nur in Expertenmodus | ja |

Aktiviert die Verwendung von Beta-TFT-Firmware-Versionen beim Flashen des NSPanels. Wenn aktiviert, wird der Header des Abschnitts rot hervorgehoben als Warnung.

> **Achtung:** Beta-Firmware kann instabil sein. Nur aktivieren, wenn ausdrücklich gewünscht. Die Aktivierung erfordert den Expertenmodus.

---

### Farbthema-Einstellungen

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `colorTheme` |
| Typ | Auswahl (Dropdown) |
| Standard | `0` (Standard) |

Legt das Farbschema für alle Panels fest.

| Wert | Name | Beschreibung |
|------|------|-------------|
| `0` | Standard | Standardfarben des Adapters |
| `1` | Tropisch | Warme, tropische Farbtöne |
| `2` | Technisch | Kühle, technische Farbtöne |
| `3` | Sonnenuntergang | Orange-rote Töne |
| `4` | Vulkan | Dunkle, intensive Töne |
| `5` | Benutzerfarben | Vollständig benutzerdefiniertes Farbschema (konfigurierbar im Tab [colorTheme](ColorThemes)) |

Bei Auswahl von `5` (Benutzerfarben) erscheint der Tab **colorTheme** in der Admin-Oberfläche.

---

### Wetter-Entity

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `weatherEntity` |
| Typ | Auswahl (dynamisch geladen) |
| Standard | leer |

Wählt die ioBroker-Objekt-ID des Wettergeräts aus, dessen Daten auf dem Screensaver angezeigt werden. Die verfügbaren Entities werden dynamisch vom Adapter geladen (erfordert laufenden Adapter).

---

### Datumsformat

Drei Einstellungen steuern gemeinsam, wie Datum und Uhrzeit auf dem Display angezeigt werden.

#### Wochentagsformat

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `weekdayFormat` |
| Typ | Checkbox |
| Standard | `false` |

- `false` — Kurzes Wochentagsformat (z. B. „Mo")
- `true` — Langes Wochentagsformat (z. B. „Montag")

#### Monatsformat

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `monthFormat` |
| Typ | Auswahl |
| Standard | `0` (lang) |

| Wert | Name | Beispiel |
|------|------|---------|
| `0` | lang | „Januar" |
| `1` | kurz | „Jan" |
| `2` | numerisch | „1" |

#### Jahresformat

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `yearFormat` |
| Typ | Checkbox |
| Standard | `false` |

- `false` — Kurzes Jahresformat (z. B. „25")
- `true` — Langes Jahresformat (z. B. „2025")

---

### Rollladensteuerung

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `shutterClosedIsZero` |
| Typ | Checkbox |
| Standard | `false` |

Definiert, welcher Positionswert als „vollständig geschlossen" gilt.

- `false` — Position `100` = vollständig geschlossen
- `true` — Position `0` = vollständig geschlossen (maximal ausgefahren)

Relevant wenn der angeschlossene Rollladenantrieb den Wert `0` für „unten" verwendet.

---

### cardThermo2 Einstellungen

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `defaultValueCardThermo` |
| Typ | Checkbox |
| Standard | `false` |

Steuert, wie `minValue`, `maxValue` und `stepValue` bei cardThermo2-Konfigurationen interpretiert werden.

- `false` — Werte direkt (z. B. `2.5` = 2,5 °C)
- `true` — Werte in Zehnteln (z. B. `25` = 2,5 °C)

> Gilt nur für den Seitentyp `cardThermo2`. Gilt als globaler Standard für alle Thermostat-Seiten.

---

### Service-Pin

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `pw1` |
| Typ | Passwortfeld (nur Ziffern) |
| Standard | leer |

Numerischer PIN-Code für den Service-Zugang. Darf nur Ziffern enthalten. Wird für bestimmte Servicefunktionen am Panel benötigt.

---

### Letzte Seite merken

| Eigenschaft | Wert |
|-------------|------|
| Konfig-Key | `rememberLastSite` |
| Typ | Checkbox |
| Standard | `false` |

- `false` — Das Panel öffnet beim Start immer die konfigurierte Startseite
- `true` — Das Panel merkt sich die zuletzt angezeigte Seite und öffnet diese beim nächsten Start — bis das Panel neu gestartet wird

---

## Zusammenfassung aller Konfig-Keys

| Key | Typ | Standard | Beschreibung |
|-----|-----|---------|--------------|
| `useBetaTFT` | boolean | `false` | Beta-TFT-Firmware verwenden (nur Expertenmodus) |
| `colorTheme` | number (0–5) | `0` | Farbthema für alle Panels |
| `weatherEntity` | string | `""` | ioBroker-ID der Wetter-Entity |
| `weekdayFormat` | boolean | `false` | Langes Wochentagsformat |
| `monthFormat` | number (0–2) | `0` | Monatsformat (lang/kurz/numerisch) |
| `yearFormat` | boolean | `false` | Langes Jahresformat (4-stellig) |
| `shutterClosedIsZero` | boolean | `false` | Position 0 = vollständig geschlossen |
| `defaultValueCardThermo` | boolean | `false` | Thermowerte in Zehnteln |
| `pw1` | string | `""` | Service-PIN (nur Ziffern) |
| `rememberLastSite` | boolean | `false` | Letzte Seite beim Start öffnen |

---

## Verwandte Seiten

- [Farbthemen](ColorThemes) — Benutzerdefiniertes Farbschema konfigurieren
- [MQTT-Server-Einstellungen](General) — Verbindungseinstellungen
- [NSPanel-Setting](NSPanelsetting) — Panel-spezifische Einstellungen
