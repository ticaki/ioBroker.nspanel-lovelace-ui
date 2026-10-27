# PageChart

Die PageChart ermöglicht zwei Darstellungen: Balken (`cardChart`) und Linie (`cardLChart`). Die Daten kommen entweder wie beim alten Script extern aufbereitet aus zwei Datenpunkten (Skala und Werte) oder direkt aus einem Datenbankadapter. Aktuell werden SQL, InfluxDB (V2) und History unterstützt.

<img alt='Linechart' src= '../Pictures/pageChart/Linechart.png'> <img alt= 'Balkenchart' src='../Pictures/pageChart/Balkenchart.png'>

Eine Chart-Seite wird im Tab `PageConfig` als Seite mit dem Typ `Diagramm` angelegt: alles im Editor einstellen, Navigation im Panel-Bereich zuweisen. Kein Script nötig. Den früheren Tab `PageChart` gibt es nicht mehr — siehe [Übernahme der alten Tabelle](#übernahme-der-alten-tabelle-pagechart).

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

Das Panel zeigt an der Y-Achse ganze Zahlen mit höchstens zwei Stellen. Beim Balkendiagramm sorgt der Wertefaktor dafür, dass große Werte passen; beim Liniendiagramm wählt der Adapter den Faktor automatisch (10, 100, …) und hängt ihn an die Y-Achsen-Beschriftung an, z. B. `W x10` — die Achse zeigt dann `10 … 15` für 100 … 150 W. Die Y-Ticks setzt der Adapter in runden Schritten (1, 2, 5, 10 …) vom Minimum bis zum Maximum der Daten. Mehr Ticks bringen nichts: das Panel spannt die Y-Achse genau über die Daten und zeigt nur die Ticks in diesem Bereich — Luft über oder unter der Kurve lässt sich über die Skala nicht erzeugen (gilt auch für die Skriptversion).

## Übernahme der alten Tabelle `PageChart`

Bis Version 1.7 gab es zusätzlich den Tab `PageChart`, dessen Seiten über einen Verweis im Konfig-Script in die Navigation kamen. Beim ersten Start nach dem Update übernimmt der Adapter alle Einträge dieser Tabelle in den Tab `PageConfig` (Typ `Diagramm`) und löscht die alte Tabelle. Ist ein Seitenname dort schon vergeben, bekommt die Seite den Zusatz `_chart` (Warnung im Log) — das Script findet sie trotzdem unter dem alten Namen.

Die Navigation kommt bei diesen Seiten vorerst weiter aus dem Konfig-Script, der bisherige Verweis funktioniert unverändert:

```typescript
    const temperatur: ScriptConfig.PageChart = {
        uniqueName: 'temperatur',
        type: 'cardLChart'
    };
```

Das ist eine Übergangslösung und veraltet: der Editor zeigt bei solchen Seiten einen Hinweis, das Log eine Warnung. Sobald der Seite im Tab `PageConfig` eine Navigation zugewiesen ist, gilt diese; die Seite dann aus dem Script entfernen — sonst wird sie dort mit einer Warnung übersprungen.
