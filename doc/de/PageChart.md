# PageChart

Die Diagramm-Seite zeigt einen Verlauf — entweder als **Balken** (`cardChart`) oder als **Linie**
(`cardLChart`).

<img alt='Linechart' src= '../Pictures/pageChart/Linechart.png'> <img alt= 'Balkenchart' src='../Pictures/pageChart/Balkenchart.png'>

> **Eingerichtet wird sie im Admin**, im Tab *PageConfig*: [Diagramm-Seite – Konfiguration im
> Admin](PageChart-Admin). Dort stehen alle Felder — Diagrammtyp, Farbe, die beiden Wege der
> Datenaufbereitung, Zeitraum und Achseneinteilung. Diese Seite beschreibt, **was am Panel ankommt**, und
> den **zweiten Weg** über das Konfigurationsskript.

## Was am Panel ankommt

Die Daten holt der Adapter über den eingestellten Zeitraum: beim **Balkendiagramm** einen Mittelwert je
Stunde, beim **Liniendiagramm** Mittelwerte im 5-Minuten-Raster und höchstens 500 Punkte.

An der Y-Achse zeigt das Panel **ganze Zahlen mit höchstens zwei Zeichen**. Beim Balkendiagramm sorgt der
*Wertefaktor* dafür, dass große Werte hineinpassen; beim Liniendiagramm wählt der Adapter den Faktor selbst
(10, 100, …) und hängt ihn an die Achsenbeschriftung — aus 100 … 150 W wird dann `W x10` mit der Achse
`10 … 15`.

> **Luft über oder unter der Kurve gibt es nicht.** Das Panel spannt die Y-Achse genau über die Daten und
> zeigt nur die Striche, die in diesen Bereich fallen. Mehr Ticks zu setzen hilft nicht — das gilt auch
> für die Skriptversion.

## Zweiter Weg: der alte Tab *Page Chart* plus Skript

Neben dem Editor im Tab *PageConfig* gibt es weiterhin den älteren Tab **Page Chart**. Eine dort angelegte
Seite erscheint **nicht von selbst** auf einem Panel: Sie braucht einen Eintrag im Konfigurationsskript mit
demselben `uniqueName` — und der Kartentyp muss zur dort gewählten Darstellung passen.

```typescript
// Liniendiagramm
const temperatur: ScriptConfig.PageChart = {
    uniqueName: 'temperatur',
    type: 'cardLChart',
};

// Balkendiagramm
const stromChart: ScriptConfig.PageChart = {
    uniqueName: 'strom',
    type: 'cardChart',
};
```

Eingetragen wird der Name hinter `const` unter `pages` beziehungsweise `subPages`. Der Adapter sucht den
`uniqueName` in der Tabelle des alten Tabs (`pageChartdata`); findet er ihn nicht, meldet er
*No pageChartdata found for …* und lässt die Seite weg.

> **Für Seiten aus dem Tab *PageConfig* gilt das nicht.** Die baut der Admin selbst und weist sie dem Panel
> direkt zu — dort ist **kein Skripteintrag nötig**, und ein Verweis aus dem Skript findet eine solche Seite
> auch gar nicht. Für neue Seiten ist der Weg über *PageConfig* der richtige; die Felder sind dieselben.
