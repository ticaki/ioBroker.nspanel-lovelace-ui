# Testumgebung – Bilder und Anleitung

> **Archiviert am 12.11.2026.** Der Inhalt dieser Datei steht jetzt in der Dokumentation:
> [Testumgebung](../../de/Testumgebung.md), [Testumgebung – Aufbau](../../de/Testumgebung-Aufbau.md)
> und [Testumgebung – Bilder](../../de/Testumgebung-Bilder.md). Sie liegt hier nur noch zum Nachschlagen
> der Prüftabelle und enthält überholte Angaben — unter anderem wird der Expertenmodus **nicht** in den
> Instanz-Einstellungen umgeschaltet, sondern im Admin selbst.

## Anleitung

**1. Testdatenpunkte anlegen.** In den Instanz-Einstellungen den Expertenmodus einschalten, den Reiter
**developer** öffnen und **Testdatenpunkte anlegen** drücken. Unten erscheint, wie viele Objekte angelegt wurden
und wie viele schon da waren. Vorhandene Datenpunkte bleiben unverändert, der Knopf darf mehrfach gedrückt werden.

![Entwickler-Reiter mit dem Knopf und der Meldung](../../Pictures/testumgebung/01-entwickler-knopf.png)

**2. Panel-Konfiguration importieren.** Im Reiter **Nspanel-Einstellungen** auf der Kachel des Panels
**Panel-Konfiguration importieren** wählen und die Datei zum Modell aus `testumgebung/panels/` öffnen
(`nspanel-eu.json`, `nspanel-us-l.json`, `nspanel-us-p.json`, `nspanel-web-l.json`, `nspanel-web-p.json`).
In einem leeren Panel ist alles „ohne Konflikt“ – **Importieren**.

![Übersicht vor dem Import](../../Pictures/testumgebung/02-import-uebersicht.png)

![Ergebnis des Imports](../../Pictures/testumgebung/03-import-ergebnis.png)

**3. Speichern.** Danach die Instanz-Einstellungen speichern. Das Panel zeigt die Testseiten, die Navigation
führt mit dem Pfeil nach rechts durch alle Seiten und zurück zur Startseite „Licht“.

**Bildschirmschoner-Modus wechseln.** Den Datenpunkt `panels.<Panel-ID>.cmd.screenSaver.layout` setzen:
0 standard, 1 alternate, 2 advanced, 3 easyview, 4 tiles. Jeder Modus ist voll belegt. Nach einem Neustart
des Adapters gilt wieder advanced (der Modus des Admin-Eintrags).

## Seiten je Modell (Web-Ansicht)

### EU (`eu`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![eu licht](../../Pictures/testumgebung/eu-licht.png) | ![eu haus](../../Pictures/testumgebung/eu-haus.png) | ![eu alle-rollen](../../Pictures/testumgebung/eu-alle-rollen.png) | ![eu heizkreise](../../Pictures/testumgebung/eu-heizkreise.png) | ![eu energie](../../Pictures/testumgebung/eu-energie.png) |

### US quer (`us-l`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![us-l licht](../../Pictures/testumgebung/us-l-licht.png) | ![us-l haus](../../Pictures/testumgebung/us-l-haus.png) | ![us-l alle-rollen](../../Pictures/testumgebung/us-l-alle-rollen.png) | ![us-l heizkreise](../../Pictures/testumgebung/us-l-heizkreise.png) | ![us-l energie](../../Pictures/testumgebung/us-l-energie.png) |

### US hochkant (`us-p`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![us-p licht](../../Pictures/testumgebung/us-p-licht.png) | ![us-p haus](../../Pictures/testumgebung/us-p-haus.png) | ![us-p alle-rollen](../../Pictures/testumgebung/us-p-alle-rollen.png) | ![us-p heizkreise](../../Pictures/testumgebung/us-p-heizkreise.png) | ![us-p energie](../../Pictures/testumgebung/us-p-energie.png) |

### Smartphone quer (`web-l`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![web-l licht](../../Pictures/testumgebung/web-l-licht.png) | ![web-l haus](../../Pictures/testumgebung/web-l-haus.png) | ![web-l alle-rollen](../../Pictures/testumgebung/web-l-alle-rollen.png) | ![web-l heizkreise](../../Pictures/testumgebung/web-l-heizkreise.png) | ![web-l energie](../../Pictures/testumgebung/web-l-energie.png) |

### Smartphone hochkant (`web-p`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![web-p licht](../../Pictures/testumgebung/web-p-licht.png) | ![web-p haus](../../Pictures/testumgebung/web-p-haus.png) | ![web-p alle-rollen](../../Pictures/testumgebung/web-p-alle-rollen.png) | ![web-p heizkreise](../../Pictures/testumgebung/web-p-heizkreise.png) | ![web-p energie](../../Pictures/testumgebung/web-p-energie.png) |

## Bildschirmschoner-Modi (Web-Ansicht)

Alle fünf Modi je Modell, voll belegt. us-p zeichnet jetzt jeden Modus hochkant wie die us-p-HMI.

| Modus | EU | US quer | US hochkant | Smartphone quer | Smartphone hochkant |
| --- | --- | --- | --- | --- | --- |
| standard | ![eu standard](../../Pictures/testumgebung/eu-schoner-standard.png) | ![us-l standard](../../Pictures/testumgebung/us-l-schoner-standard.png) | ![us-p standard](../../Pictures/testumgebung/us-p-schoner-standard.png) | ![web-l standard](../../Pictures/testumgebung/web-l-schoner-standard.png) | ![web-p standard](../../Pictures/testumgebung/web-p-schoner-standard.png) |
| alternate | ![eu alternate](../../Pictures/testumgebung/eu-schoner-alternate.png) | ![us-l alternate](../../Pictures/testumgebung/us-l-schoner-alternate.png) | ![us-p alternate](../../Pictures/testumgebung/us-p-schoner-alternate.png) | ![web-l alternate](../../Pictures/testumgebung/web-l-schoner-alternate.png) | ![web-p alternate](../../Pictures/testumgebung/web-p-schoner-alternate.png) |
| advanced | ![eu advanced](../../Pictures/testumgebung/eu-schoner-advanced.png) | ![us-l advanced](../../Pictures/testumgebung/us-l-schoner-advanced.png) | ![us-p advanced](../../Pictures/testumgebung/us-p-schoner-advanced.png) | ![web-l advanced](../../Pictures/testumgebung/web-l-schoner-advanced.png) | ![web-p advanced](../../Pictures/testumgebung/web-p-schoner-advanced.png) |
| easyview | ![eu easyview](../../Pictures/testumgebung/eu-schoner-easyview.png) | ![us-l easyview](../../Pictures/testumgebung/us-l-schoner-easyview.png) | ![us-p easyview](../../Pictures/testumgebung/us-p-schoner-easyview.png) | ![web-l easyview](../../Pictures/testumgebung/web-l-schoner-easyview.png) | ![web-p easyview](../../Pictures/testumgebung/web-p-schoner-easyview.png) |
| tiles | ![eu tiles](../../Pictures/testumgebung/eu-schoner-tiles.png) | ![us-l tiles](../../Pictures/testumgebung/us-l-schoner-tiles.png) | ![us-p tiles](../../Pictures/testumgebung/us-p-schoner-tiles.png) | ![web-l tiles](../../Pictures/testumgebung/web-l-schoner-tiles.png) | ![web-p tiles](../../Pictures/testumgebung/web-p-schoner-tiles.png) |
| mit Hinweis | – | – | ![us-p-schoner-advanced-hinweis](../../Pictures/testumgebung/us-p-schoner-advanced-hinweis.png) ![us-p-schoner-easyview-hinweis](../../Pictures/testumgebung/us-p-schoner-easyview-hinweis.png) ![us-p-schoner-standard-hinweis](../../Pictures/testumgebung/us-p-schoner-standard-hinweis.png) ![us-p-schoner-tiles-hinweis](../../Pictures/testumgebung/us-p-schoner-tiles-hinweis.png) | – | ![web-p-schoner-advanced-hinweis](../../Pictures/testumgebung/web-p-schoner-advanced-hinweis.png) ![web-p-schoner-easyview-hinweis](../../Pictures/testumgebung/web-p-schoner-easyview-hinweis.png) ![web-p-schoner-standard-hinweis](../../Pictures/testumgebung/web-p-schoner-standard-hinweis.png) ![web-p-schoner-tiles-hinweis](../../Pictures/testumgebung/web-p-schoner-tiles-hinweis.png) |

## Weitere Seiten (nach den Korrekturen)

| Modell | Messwerte (cardGrid3) | Medien | Details (cardEntities) |
| --- | --- | --- | --- |
| EU | ![eu messwerte](../../Pictures/testumgebung/eu-messwerte.png) | ![eu medien](../../Pictures/testumgebung/eu-medien.png) | ![eu details](../../Pictures/testumgebung/eu-details.png) |
| US quer | ![us-l messwerte](../../Pictures/testumgebung/us-l-messwerte.png) | ![us-l medien](../../Pictures/testumgebung/us-l-medien.png) | ![us-l details](../../Pictures/testumgebung/us-l-details.png) |
| US hochkant | ![us-p messwerte](../../Pictures/testumgebung/us-p-messwerte.png) | ![us-p medien](../../Pictures/testumgebung/us-p-medien.png) | ![us-p details](../../Pictures/testumgebung/us-p-details.png) |
| Smartphone quer | ![web-l messwerte](../../Pictures/testumgebung/web-l-messwerte.png) | ![web-l medien](../../Pictures/testumgebung/web-l-medien.png) | ![web-l details](../../Pictures/testumgebung/web-l-details.png) |
| Smartphone hochkant | ![web-p messwerte](../../Pictures/testumgebung/web-p-messwerte.png) | ![web-p medien](../../Pictures/testumgebung/web-p-medien.png) | ![web-p details](../../Pictures/testumgebung/web-p-details.png) |

## Systemseite „Navigation fehlerhaft“ (Web-Ansicht)

Auf allen Test-Panels zeigt die Seite `wecker` (globales Skript) nach links auf `heizung`, eine Seite ohne Inhalt.
Ein Druck auf den Pfeil nach links öffnet die Systemseite „Navigation fehlerhaft“ (Titel „Navi-Fehler“); ihr Pfeil zurück führt wieder zu
`wecker`.

| EU | US-L | US-P | Web-L | Web-P |
| --- | --- | --- | --- | --- |
| ![eu](../../Pictures/testumgebung/navigation-fehlerhaft-eu.png) | ![us-l](../../Pictures/testumgebung/navigation-fehlerhaft-us-l.png) | ![us-p](../../Pictures/testumgebung/navigation-fehlerhaft-us-p.png) | ![web-l](../../Pictures/testumgebung/navigation-fehlerhaft-web-l.png) | ![web-p](../../Pictures/testumgebung/navigation-fehlerhaft-web-p.png) |
| ![eu en](../../Pictures/testumgebung/navigation-fehlerhaft-eu-en.png) | ![us-l en](../../Pictures/testumgebung/navigation-fehlerhaft-us-l-en.png) | ![us-p en](../../Pictures/testumgebung/navigation-fehlerhaft-us-p-en.png) | ![web-l en](../../Pictures/testumgebung/navigation-fehlerhaft-web-l-en.png) | ![web-p en](../../Pictures/testumgebung/navigation-fehlerhaft-web-p-en.png) |

Erste Zeile Systemsprache Deutsch, zweite Englisch. Die kurzen Texte passen in allen 11 Sprachen auf us-p und web-p
(Titel höchstens 13 Zeichen, Bezeichnungen höchstens 121 px bei 18 px Noto Sans).

## Vorher / nachher

| Befund | vorher | nachher |
| --- | --- | --- |
| us-p advanced: Querformat, rechts abgeschnitten, Hinweis-Symbol als Kästchen | ![vorher](../../Pictures/testumgebung/us-p-schoner-advanced-vorher.png) | ![nachher](../../Pictures/testumgebung/us-p-schoner-advanced.png) |
| us-p cardGrid3: große Werte überlappen und werden abgeschnitten | ![vorher](../../Pictures/testumgebung/us-p-messwerte-vorher.png) | ![nachher](../../Pictures/testumgebung/us-p-messwerte.png) |
| web-p cardGrid3: Werte abgeschnitten (`0,31€`, `42mi`) | ![vorher](../../Pictures/testumgebung/web-p-messwerte-vorher.png) | ![nachher](../../Pictures/testumgebung/web-p-messwerte.png) |
| us-p cardGrid2: Namen stoßen aneinander, Inhalt 16 px nach links verschoben | ![vorher](../../Pictures/testumgebung/us-p-haus-vorher.png) | ![nachher](../../Pictures/testumgebung/us-p-haus.png) |
| us-p cardEntities: Werte mitten im Buchstaben abgeschnitten | ![vorher](../../Pictures/testumgebung/us-p-details-vorher.png) | ![nachher](../../Pictures/testumgebung/us-p-details.png) |
| eu cardMedia: untere Optionszeile unten abgeschnitten, Restzeit `14:1` abgeschnitten | ![vorher](../../Pictures/testumgebung/eu-medien-vorher.png) | ![nachher](../../Pictures/testumgebung/eu-medien.png) |
| eu EasyView: MR-Balken fehlten, breite Werte abgeschnitten | ![vorher](../../Pictures/testumgebung/eu-schoner-easyview-vorher.png) | ![nachher](../../Pictures/testumgebung/eu-schoner-easyview.png) |

## Prüftabelle

| Bild | Szenario | Bitte prüfen |
| ---- | -------- | ------------ |
| 01-entwickler-knopf | Knopf im Reiter developer gedrückt, alle Objekte waren schon da | Text des Knopfs und der Hilfe verständlich? Meldung „0 angelegt, 550 vorhanden“ |
| 02-import-uebersicht | Import von `nspanel-eu.json` in das leere Panel „Test EU“ | 24 Zeilen ohne Konflikt (23 Seiten + Bildschirmschoner) |
| 03-import-ergebnis | Ergebnis desselben Imports | 23 Seiten neu, Startseite `eu_licht`, Bildschirmschoner neu |
| `<modell>-licht` | Startseite cardGrid | alle Plätze des Modells belegt (6 / 6 / 6 / 8 / 10), Namen lesbar |
| `<modell>-haus` | cardGrid2 | alle Plätze belegt (8 / 8 / 9 / 10 / 15), letzter Platz = Navigation „Details“ |
| `<modell>-alle-rollen` | cardEntities mit einem Kanal je Rolle | Blätterpfeil, Zeilen pro Modell (4 / 4 / 5 / 4 / 8) |
| `<modell>-heizkreise` | cardThermo2 mit 6 Kreisen (Klimaanlage = 2) | Kreiswahl und Elemente |
| `<modell>-energie` | cardPower | 6 Zweige, Akku-Ladestand oben, Hausverbrauch unten |
| `<modell>-schoner-*` | Modus per `cmd.screenSaver.layout` gewechselt | jeder Platz des Modus belegt, nichts abgeschnitten; us-p hochkant mit den Plätzen der us-p-HMI (standard 4 unten, alternate Favorit + Alternativ nebeneinander, advanced 3 links / 6 unten / 5 Indikatoren rechts, EasyView 2 × 2) |
| `<modell>-schoner-*-hinweis` | Benachrichtigung aktiv (`Hinweis.Waschmaschine_fertig` = true) | Überschrift mit Symbol (kein Kästchen), Text lesbar, nichts überdeckt halb |
| `<modell>-messwerte` | cardGrid3 mit großen Werten | Werte werden kleiner statt abgeschnitten, keine Überlappung |
| `<modell>-medien` | cardMedia | Optionszeile vollständig sichtbar, Restzeit als Text lesbar |
| `<modell>-details` | cardEntities mit langen Namen/Werten | lange Texte enden mit „…“ statt mitten im Buchstaben |
| `*-vorher` | Stand vor der Korrektur | zum Vergleich mit dem Bild ohne `-vorher` |
| `navigation-fehlerhaft-<modell>` | `wecker` → Pfeil links (Ziel `heizung` ohne Seite) | „Navi-Fehler“, „Ziel fehlt: heizung“, „Von Seite: wecker“, „Konfig prüfen“ (en: „Nav error“, „Missing“, „From page“, „Check config“); Pfeil zurück führt zu `wecker`. Nichts gekürzt, Unterlängen (g, p) nicht abgeschnitten |
