# Page Trash (Abfall)

Die **Abfall-Seite** zeigt die nächsten Abfuhrtermine: je Zeile ein Symbol in der Farbe der Tonne, der
Name der Abfallart und rechts der Tag. Sie wird **ausschließlich im Admin** eingerichtet — im
Konfigurationsskript gibt es diesen Kartentyp nicht.

➡️ **[Abfall-Seite – Konfiguration im Admin](PageTrash-Admin)**

## Was am Panel ankommt

Die Seite hat **vier oder sechs Zeilen** — die Wahl im Admin entscheidet zugleich über die Karte, die der
Adapter daraus baut: bei vier Terminen eine `cardEntities`, bei sechs eine `cardSchedule`, beide über die
Vorlage `entities.waste-calendar` (`admin.ts`). Ein Wert außerhalb von 1 bis 6 wird auf 6 gesetzt.

Je Zeile stehen:

| Teil | Woher er kommt |
|---|---|
| Symbol und Farbe | Aus dem Feld der Abfallart im Admin; ohne Angabe nimmt der Adapter `calendar-month`. |
| Text | Der **optionale Name**, falls gesetzt — sonst der Suchbegriff der Abfallart. |
| Tag rechts | `today`, `tomorrow`, der Wochentag (innerhalb der nächsten Woche) oder das Datum. |

> **Die beiden Wörter `today` und `tomorrow` bleiben englisch.** Der Adapter setzt sie wörtlich und
> übersetzt sie nirgends (`pageTrash.ts`). Wochentage und Datum formatiert er dagegen **fest auf Deutsch**
> (`de-DE`), unabhängig von der Sprache des Adapters. Bei vier Terminen schreibt er den Wochentag lang
> („Donnerstag") und das Datum vierstellig, bei sechs kurz („Do.") und zweistellig — in der schmaleren
> Zeile ist weniger Platz.

## Woher die Termine kommen

Zwei Quellen stehen zur Wahl, beide im Admin:

- **Datenpunkt eines Kalender-Adapters** — typischerweise `ical.0.data.table`. Der Adapter erwartet eine
  Liste von Einträgen mit `_date` und `event`.
- **`.ics`-Datei im ioBroker-Dateispeicher** — der Adapter liest sie, nimmt alle `VEVENT`-Einträge und
  sortiert sie nach Datum. Fehlt die Datei, steht das im Log (*does not exist in ioBroker files*).

Für beide gilt dasselbe Sieb:

1. **Alles vor heute fällt weg** (Vergleich ab 0 Uhr).
2. Der Ereignistext muss den **Suchbegriff einer Abfallart enthalten** — es genügt ein Teilstück, groß und
   klein wird unterschieden. Die **erste passende** der sechs Zeilen gewinnt; deshalb entscheidet die
   Reihenfolge im Admin, wenn sich Begriffe überschneiden („Papier" und „Papiertonne").
3. Ein Termin, der zu keiner Abfallart passt, **erscheint nicht** — er wird ohne Meldung verworfen.
4. Nach **sechs** Einträgen ist Schluss, auch wenn die Quelle mehr liefert.

## Wann aktualisiert wird

Beim Start des Adapters und danach **alle sechs Stunden** (zur vollen Stunde 0, 6, 12 und 18 Uhr,
`controller.ts`). Ein neuer Termin im Kalender erscheint also nicht sofort auf dem Panel. Wer früher
nachsehen will, startet die Instanz neu.
