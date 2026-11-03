# Page PChart – Kreisdiagramm

Die Seite `cardPChart` zeigt bis zu sechs Werte als Kreisdiagramm mit Legende. Die Prozentwerte rechnet das Panel selbst, Überschrift und Legende erscheinen in der Schriftfarbe des Panels. Voraussetzung ist die TFT-Version 6.0.5 (EU-Panel).

Eine Kreisdiagramm-Seite wird im Tab `PageConfig` als Seite mit dem Typ `Kreisdiagramm` angelegt: alles im Editor einstellen, Navigation im Panel-Bereich zuweisen. Ein Skript ist nicht nötig; einen Seitentyp im Konfig-Script gibt es für diese Karte nicht.

## Anlegen im Tab `PageConfig`

Im Tab `PageConfig` links auf das PLUS klicken, als Typ `Kreisdiagramm` wählen und einen eindeutigen Seitennamen vergeben (`uniqueName`, darf im gesamten Panel nur einmal vorkommen). Der Editor zeigt dann:

1. **Überschrift** der Seite.
2. **Legende**: was neben dem Namen jeder Scheibe steht – nur der Name, Name und Wert, Name und Prozent oder Name, Wert und Prozent (Vorgabe).
3. **Nachkommastellen** des Wert-Textes (Vorgabe 2). Gilt für die Werte aus Datenpunkten; beim Skript-Datenpunkt kommt der Text fertig aus dem Skript.
4. **Datenquelle**: `Werte aus Datenpunkten` (Standard, siehe unten) oder `Skript-Datenpunkt` (für bestehende Skripte, die den Panel-Text selbst erzeugen).

Die Felder sind nur bedienbar, solange die Adapterinstanz läuft. Sichtbarkeit (`Seite ausblenden`), `alwaysOn` und die Navigation werden wie bei allen Seiten im Bereich Navigation/Panel-Zuordnung gesetzt.

## Werte aus Datenpunkten (Standard)

Die Hauptansicht des Editors: ein Zeitraum, bei Bedarf eine DB-Instanz und sechs Zeilen für die Scheiben.

### Zeitraum

- **Aktueller Wert** (Vorgabe): jede Scheibe zeigt den aktuellen Wert ihres Datenpunkts. Ändert sich einer der Datenpunkte, zeichnet der Adapter die Seite neu – höchstens einmal pro Minute, da das Panel den Kreis bei jedem Update komplett neu aufbaut.
- **Letzte Stunde**, **Letzte 24 Stunden**, **Letzte 7 Tage**, **Letzte 30 Tage** oder **Benutzerdefiniert** mit einem Stundenfeld: jede Scheibe zeigt den **Mittelwert** ihres Datenpunkts über diesen Zeitraum, immer „von damals bis jetzt“. Dafür muss eine **DB-Instanz** gewählt werden (`history`, `sql` oder `influxdb`, gespeichert in der Kurzform `influxdb.0`), die alle Scheiben-Datenpunkte loggt. Der Adapter fragt die Mittelwerte per `getHistory` ab (ein Mittelwert je Datenpunkt, nacheinander) und lädt sie alle 5 Minuten neu, solange die Seite angezeigt wird. Liefert die Datenbank für einen Datenpunkt keinen Wert (nicht geloggt, Instanz nicht gestartet, Zeitüberschreitung), zeigt die Scheibe 0 und das Log eine Warnung – einmal, bis wieder ein Wert kommt; die übrigen Scheiben sind davon nicht betroffen.

Der Zeitraum wird als Stundenzahl gespeichert (`rangeHours`, 0 = aktueller Wert).

### Scheiben

Je Scheibe (1–6):

- **Name**: Text der Legende. Leer → der Name des Datenpunkts (`common.name`, in der Sprache des Adapters).
- **Datenpunkt (Zahl)**: der numerische Datenpunkt. Eine Scheibe ohne Datenpunkt entfällt; die übrigen rücken auf.
- **Einheit**: steht hinter dem Wert, z. B. `kWh`. Leer → die Einheit des Datenpunkts (`common.unit`).
- **Farbe** der Scheibe. Neue Seiten haben sechs unterschiedliche Vorgabefarben.

Der Wert 0 behält seine Legendenzeile (ohne Stück im Kreis), negative Werte zählen als 0. Die Reihenfolge der Zeilen ist die Reihenfolge in Legende und Kreis.

## Skript-Datenpunkt

Für Skripte, die den Panel-Text selbst erzeugen (etwa nach dem Muster des alten NSPanel-Lovelace-Skripts): ein Datenpunkt, in den das Skript den fertigen Text schreibt. Je Scheibe vier Felder, getrennt durch `~`:

```
Name~Zahl~Wert-Text~Farbe
```

Beispiel: `Netzbezug~5200~5.20 kWh~63488~Eigennutzung~3100~3.10 kWh~2016~Einspeisung~1500~1.50 kWh~2047`

- **Name**: Text der Legende (ein `~` im Namen wird durch `-` ersetzt).
- **Zahl**: bestimmt die Größe der Scheibe; der Adapter normiert die Zahlen selbst, Nachkommastellen und große Summen sind erlaubt, negative Werte zählen als 0.
- **Wert-Text**: steht fertig formatiert in der Legende, z. B. `5.20 kWh`.
- **Farbe**: RGB565 dezimal wie bei den anderen Karten; ein Hex-Wert wie `#ff0000` wird umgerechnet.

Mehr als sechs Scheiben: der Adapter fasst ab der sechsten alle restlichen zu einer Scheibe **Sonstiges** zusammen (Zahl = Summe der Reste, ohne Wert-Text, Farbe der sechsten Scheibe), weil das Panel nur sechs Einträge liest. Ein Zeitraum gilt für diese Quelle nicht.

## Was der Adapter ans Panel schickt

Die Zahlen aller Scheiben werden mit einem gemeinsamen Faktor auf Ganzzahlen skaliert, deren Summe bei etwa 1 000 000 liegt – das Panel rechnet mit der Summe in 32 Bit und braucht sie unter 2 000 000; kleine Anteile fallen dabei nicht auf 0. Die Nachkommastellen der Originalwerte stehen nur im Wert-Text. Das Panel liest höchstens sechs Scheiben, die Prozentwerte berechnet es selbst.
