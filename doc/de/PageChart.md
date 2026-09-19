# PageChart

Die PageChart ermöglicht zwei Darstellungen: Balken (`cardChart`) und Linie (`cardLChart`). Die Daten kommen entweder wie beim alten Script extern aufbereitet aus zwei Datenpunkten (Skala und Werte) oder direkt aus einem Datenbankadapter. Aktuell werden SQL, InfluxDB (V2) und History unterstützt.

<img alt='Linechart' src= '../Pictures/pageChart/Linechart.png'> <img alt= 'Balkenchart' src='../Pictures/pageChart/Balkenchart.png'>

Eine Chart-Seite kann auf zwei Wegen angelegt werden — beide liefern dasselbe Ergebnis am Panel:

1. **Tab `PageConfig`** (empfohlen): Seite mit dem Typ `Diagramm` anlegen, alles im Editor einstellen, Navigation im Panel-Bereich zuweisen. Kein Script nötig.
2. **Klassisch**: Tab `PageChart` plus ein Verweis im Konfig-Script (siehe unten).

## Anlegen im Tab `PageConfig`

Im Tab `PageConfig` links auf das PLUS klicken, als Typ `Diagramm` wählen und einen eindeutigen Seitennamen vergeben (`uniqueName`, darf im gesamten Panel nur einmal vorkommen). Der Editor zeigt dann:

1. **Diagrammtyp**: Säulendiagramm oder Liniendiagramm.
2. **Überschrift** der Seite.
3. **Farbe** der Linie bzw. der Balken.
4. **Datenaufbereitung**:
    - **Skriptversion** → Skala und Werte werden extern aufbereitet (Schema des NSPanel-Scripts). Es sind nur die beiden Datenpunkte `Datenpunkt für Scale` und `Datenpunkt für Daten` einzutragen. Im Wiki des NSPanel-Scripts gibt es Beispiel-Javascripte, die Daten aus einer Datenbank lesen und aufbereitet in diese Datenpunkte schreiben.
    - **Datenbankadapter** → unter `Datenquelle` eine laufende Instanz von `sql`, `influxdb` oder `history` wählen (gespeichert wird die Kurzform, z. B. `influxdb.0`). Unter `Datenpunkt für archivierte Werte` den Datenpunkt wählen, der in dieser Instanz geloggt wird. Dazu:
        - `Zeitraum in Stunden` — wie weit zurück ab jetzt (Vorgabe 24),
        - `Einteilung X-Achse` (nur Linie) — alle wie viel Stunden ein Strich an die X-Achse kommt (Vorgabe 2),
        - `Wertefaktor` (nur Balken) — teilt große Werte, damit sie auf dem Display sinnvoll darstellbar sind,
        - `Einteilung X-Achsen-Beschriftungen` — alle wie viel Stunden ein Zeitwert an die X-Achse geschrieben wird (Vorgabe 4).
      Ein leeres Zahlenfeld bedeutet: der Adapter nimmt die Vorgabe.
5. **Bezeichnung der Y-Achse**, z. B. die Einheit.

Die Felder sind nur bedienbar, solange die Adapterinstanz läuft. Sichtbarkeit (`Seite ausblenden`), `alwaysOn` und die Navigation werden wie bei allen Seiten im Bereich Navigation/Panel-Zuordnung gesetzt.

Der Adapter holt die Daten beim Balkendiagramm als einen Mittelwert pro Stunde, beim Liniendiagramm als Mittelwerte im 5-Minuten-Raster (höchstens 500 Punkte), jeweils über den eingestellten Zeitraum.

Das Panel zeigt an der Y-Achse ganze Zahlen mit höchstens zwei Stellen. Beim Balkendiagramm sorgt der Wertefaktor dafür, dass große Werte passen; beim Liniendiagramm wählt der Adapter den Faktor automatisch (10, 100, …) und hängt ihn an die Y-Achsen-Beschriftung an, z. B. `W x10` — die Achse zeigt dann `10 … 15` für 100 … 150 W.

## Klassisch: Tab `PageChart` und Konfig-Script

<img alt='Chartallg' src='../Pictures/pageChart/pageChartallg.png'>

Mit Auswahl des Tab `PageChart` kommt ihr an die Einstellungen. Um eine neue Page zu erstellen, klickt ihr auf das PLUS-Zeichen und es erscheinen die Datenfelder für die Page. (siehe Bild oben)
1. Zuerst legt ihr den Seitennamen fest, dieser darf sich im gesamten Panel nicht wiederholen. Es ist die ID für diese Seite und ist identisch mit dem `uniqueName`. Der Name erscheint auch in dem grauen Balken, dadurch könnt ihr bei mehreren Seiten sie leicht unterscheiden.
2. Die Überschrift auf der Seite festlegen.
3. Wenn ihr den Haken bei `alwaysOnDisplay` setzt, bleibt die Seite permanent sichtbar und springt nicht automatisch in den Screensaver. Damit der Screensaver wieder aktiv wird, müsst ihr auf eine andere Seite springen.
4. Option `Seite ausblenden` ermöglicht die Seite aus der Navigation zu entfernen, wenn in der Serviceseite `System` die Option `hide Page` aktiv ist.
5. Mit dem Farbfeld kann die Farbe der Linie/Balken festgelegt werden.
6. Den Typ auswählen, barChart -> Balken und lineChart -> Linie
<img alt='chartTyp' src='../Pictures/pageChart/pageChartType.png'>
7. Datenherkunft `oldScriptVersion` oder `dbAdapter` — Bedeutung der Felder wie oben beim Tab `PageConfig`
<img alt= 'AdapterInstanz' src='../Pictures/pageChart/pageChartAdapter.png'>
8. Die Bezeichnung der Y-Achse, z. B. die Einheit

Die Seite wird dann im Konfig-Script referenziert; der `uniqueName` muss dem Seitennamen im Tab entsprechen:

```typescript
// LineChart
    const temperatur: ScriptConfig.PageChart = {
        uniqueName: 'temperatur',
        type: 'cardLChart'
    }

// Balkenchart
    const stromChart: ScriptConfig.PageChart = {
        uniqueName: 'strom',
        type: 'cardChart'
    };
```
