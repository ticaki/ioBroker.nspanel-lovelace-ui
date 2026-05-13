# Symbol-Übersicht

Der Tab **Symbol-Übersicht** zeigt alle Symbole (Icons), die auf dem NSPanel verwendet werden können. Über die Suchfunktion lässt sich das gewünschte Symbol schnell finden, und per Klick wird der Symbol-Name in die Zwischenablage kopiert.

> 🖼️ **Bild fehlt:** Screenshot des Symbol-Übersicht-Tabs mit sichtbarem Filter-Feld und mehreren Symbolen  
> Pfad: `Pictures/symbolOverview/symbolOverview.png`

![Symbol-Übersicht](Pictures/symbolOverview/symbolOverview.png)

---

## Bedienung

| Aktion | Beschreibung |
|--------|-------------|
| **Strg+F** (Win/Linux) oder **Cmd+F** (Mac) | Blendet das Filter-Textfeld ein und setzt den Fokus darauf. |
| **Filter-Feld** | Filtert die angezeigten Symbole nach Name (Groß-/Kleinschreibung ignoriert). Das X-Icon im Feld leert den Filter und blendet das Feld wieder aus. |
| **Klick auf ein Symbol** | Kopiert den Symbol-Namen in die Zwischenablage. Eine Bestätigungsleiste am unteren Bildschirmrand bestätigt das Kopieren. |

---

## Verwendung im Konfigurationsskript

Den kopierten Symbol-Namen kann man direkt im Konfigurationsskript als `icon`-Parameter verwenden, zum Beispiel:

```javascript
icon: 'home'
```

---

## Verwandte Seiten

- [ScriptConfig](ScriptConfig) — Symbol-Namen im Konfigurationsskript verwenden
- [Global Settings](globelSettings) — Farbschema für Symbole
