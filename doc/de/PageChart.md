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
