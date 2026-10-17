# Navigation Flow

Dieser Tab zeichnet die **Navigation eines Panels als Graph**: Jede Seite ist ein Knoten, jede Verbindung zwischen zwei Seiten eine Kante. Damit lässt sich auf einen Blick prüfen, ob die Seiten so zusammenhängen, wie es gedacht war — und woher jede Seite kommt.

<img alt="Navigation Flow mit Legende und Graph" src="../Pictures/naviFlow/naviflow-01-graph.png" width="100%"/>

## Bedienung

| Bedienelement | Wirkung |
|---|---|
| **Panel-Auswahl** | Wählt, dessen Navigation gezeigt wird. Die Auswahl merkt sich der Browser. |
| **Systemseiten anzeigen** | Blendet die internen Seiten (`///…`) ein oder aus. Die Entsperrseite `///unlock` bleibt immer sichtbar. |
| **Datenpunkte anzeigen** | Blendet zusätzlich die Datenpunkte ein, die eine Seite als Ziel verwendet. |
| **Aktualisieren** | Holt die Navigationsdaten neu vom Adapter. |
| **Automatisches Layout** | Ordnet alle Knoten neu an (Baum ab der Hauptseite). ⚠️ Überschreibt die selbst gesetzten Positionen — der Admin fragt deshalb vorher nach. |
| **Knoten verschieben** | Die Anordnung lässt sich frei ziehen. Gespeichert wird automatisch im Hintergrund, es gibt keinen eigenen Knopf dafür. |
| **Klick auf einen Knoten** | Öffnet rechts die Angaben zur Seite — Name, Überschrift, verwendete Datenpunkte. Gehört die Seite zur Admin-Konfiguration, führt ein Knopf direkt zu ihrer Seitenkonfiguration. |

## Die Legende lesen

Die **Farbe der Kante** sagt, wie zwei Seiten zusammenhängen: beidseitig (prev + next), nur vorwärts, nur rückwärts, Sprung zur Startseite, zur übergeordneten Seite, zu einer Zielseite, beim langen Druck — und als feine Linie die Datenpunkte einer Seite.

Der **Rahmen eines Knotens** sagt, woher die Seite stammt: aus dem Konfigurationsskript, aus der globalen Skript-Konfiguration, aus der **Admin-Konfiguration**, als Systemseite oder als Datenpunkt eines Ziels. Gerade diese Unterscheidung hilft bei der Frage „warum sieht das Panel anders aus als im Skript beschrieben" — eine Admin-Seite ersetzt die gleichnamige Skriptseite.

## Hinweise

- Steht oben rechts **Adapter offline** oder erscheint „Keine Daten", läuft die Instanz nicht oder es ist kein Panel konfiguriert.
- Die beiden Haken (Systemseiten, Datenpunkte) sind reine Anzeigefilter und verändern nichts an der Konfiguration.
- Auf Tablets und Telefonen braucht es für Schaltflächen aus anderen Flows einen **Doppeltipp**.
