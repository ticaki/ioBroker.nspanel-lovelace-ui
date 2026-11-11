# Testumgebung – Bilder und Anleitung

## Anleitung

**1. Testdatenpunkte anlegen.** In den Instanz-Einstellungen den Expertenmodus einschalten, den Reiter
**developer** öffnen und **Testdatenpunkte anlegen** drücken. Unten erscheint, wie viele Objekte angelegt wurden
und wie viele schon da waren. Vorhandene Datenpunkte bleiben unverändert, der Knopf darf mehrfach gedrückt werden.

![Entwickler-Reiter mit dem Knopf und der Meldung](01-entwickler-knopf.png)

**2. Panel-Konfiguration importieren.** Im Reiter **Nspanel-Einstellungen** auf der Kachel des Panels
**Panel-Konfiguration importieren** wählen und die Datei zum Modell aus `testumgebung/panels/` öffnen
(`nspanel-eu.json`, `nspanel-us-l.json`, `nspanel-us-p.json`, `nspanel-web-l.json`, `nspanel-web-p.json`).
In einem leeren Panel ist alles „ohne Konflikt“ – **Importieren**.

![Übersicht vor dem Import](02-import-uebersicht.png)

![Ergebnis des Imports](03-import-ergebnis.png)

**3. Speichern.** Danach die Instanz-Einstellungen speichern. Das Panel zeigt die Testseiten, die Navigation
führt mit dem Pfeil nach rechts durch alle Seiten und zurück zur Startseite „Licht“.

**Bildschirmschoner-Modus wechseln.** Den Datenpunkt `panels.<Panel-ID>.cmd.screenSaver.layout` setzen:
0 standard, 1 alternate, 2 advanced, 3 easyview, 4 tiles. Jeder Modus ist voll belegt. Nach einem Neustart
des Adapters gilt wieder advanced (der Modus des Admin-Eintrags).

## Seiten je Modell (Web-Ansicht)

### EU (`eu`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![eu licht](eu-licht.png) | ![eu haus](eu-haus.png) | ![eu alle-rollen](eu-alle-rollen.png) | ![eu heizkreise](eu-heizkreise.png) | ![eu energie](eu-energie.png) |

### US quer (`us-l`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![us-l licht](us-l-licht.png) | ![us-l haus](us-l-haus.png) | ![us-l alle-rollen](us-l-alle-rollen.png) | ![us-l heizkreise](us-l-heizkreise.png) | ![us-l energie](us-l-energie.png) |

### US hochkant (`us-p`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![us-p licht](us-p-licht.png) | ![us-p haus](us-p-haus.png) | ![us-p alle-rollen](us-p-alle-rollen.png) | ![us-p heizkreise](us-p-heizkreise.png) | ![us-p energie](us-p-energie.png) |

### Smartphone quer (`web-l`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![web-l licht](web-l-licht.png) | ![web-l haus](web-l-haus.png) | ![web-l alle-rollen](web-l-alle-rollen.png) | ![web-l heizkreise](web-l-heizkreise.png) | ![web-l energie](web-l-energie.png) |

### Smartphone hochkant (`web-p`)

| Licht | Haus | Alle Rollen | Heizkreise | Energie |
| --- | --- | --- | --- | --- |
| ![web-p licht](web-p-licht.png) | ![web-p haus](web-p-haus.png) | ![web-p alle-rollen](web-p-alle-rollen.png) | ![web-p heizkreise](web-p-heizkreise.png) | ![web-p energie](web-p-energie.png) |

## Bildschirmschoner-Modi (Web-Ansicht)

Alle fünf Modi je Modell, voll belegt. us-p zeichnet jetzt jeden Modus hochkant wie die us-p-HMI.

| Modus | EU | US quer | US hochkant | Smartphone quer | Smartphone hochkant |
| --- | --- | --- | --- | --- | --- |
| standard | ![eu standard](eu-schoner-standard.png) | ![us-l standard](us-l-schoner-standard.png) | ![us-p standard](us-p-schoner-standard.png) | ![web-l standard](web-l-schoner-standard.png) | ![web-p standard](web-p-schoner-standard.png) |
| alternate | ![eu alternate](eu-schoner-alternate.png) | ![us-l alternate](us-l-schoner-alternate.png) | ![us-p alternate](us-p-schoner-alternate.png) | ![web-l alternate](web-l-schoner-alternate.png) | ![web-p alternate](web-p-schoner-alternate.png) |
| advanced | ![eu advanced](eu-schoner-advanced.png) | ![us-l advanced](us-l-schoner-advanced.png) | ![us-p advanced](us-p-schoner-advanced.png) | ![web-l advanced](web-l-schoner-advanced.png) | ![web-p advanced](web-p-schoner-advanced.png) |
| easyview | ![eu easyview](eu-schoner-easyview.png) | ![us-l easyview](us-l-schoner-easyview.png) | ![us-p easyview](us-p-schoner-easyview.png) | ![web-l easyview](web-l-schoner-easyview.png) | ![web-p easyview](web-p-schoner-easyview.png) |
| tiles | ![eu tiles](eu-schoner-tiles.png) | ![us-l tiles](us-l-schoner-tiles.png) | ![us-p tiles](us-p-schoner-tiles.png) | ![web-l tiles](web-l-schoner-tiles.png) | ![web-p tiles](web-p-schoner-tiles.png) |
| mit Hinweis | – | – | ![us-p-schoner-advanced-hinweis](us-p-schoner-advanced-hinweis.png) ![us-p-schoner-easyview-hinweis](us-p-schoner-easyview-hinweis.png) ![us-p-schoner-standard-hinweis](us-p-schoner-standard-hinweis.png) ![us-p-schoner-tiles-hinweis](us-p-schoner-tiles-hinweis.png) | – | ![web-p-schoner-advanced-hinweis](web-p-schoner-advanced-hinweis.png) ![web-p-schoner-easyview-hinweis](web-p-schoner-easyview-hinweis.png) ![web-p-schoner-standard-hinweis](web-p-schoner-standard-hinweis.png) ![web-p-schoner-tiles-hinweis](web-p-schoner-tiles-hinweis.png) |

## Weitere Seiten (nach den Korrekturen)

| Modell | Messwerte (cardGrid3) | Medien | Details (cardEntities) |
| --- | --- | --- | --- |
| EU | ![eu messwerte](eu-messwerte.png) | ![eu medien](eu-medien.png) | ![eu details](eu-details.png) |
| US quer | ![us-l messwerte](us-l-messwerte.png) | ![us-l medien](us-l-medien.png) | ![us-l details](us-l-details.png) |
| US hochkant | ![us-p messwerte](us-p-messwerte.png) | ![us-p medien](us-p-medien.png) | ![us-p details](us-p-details.png) |
| Smartphone quer | ![web-l messwerte](web-l-messwerte.png) | ![web-l medien](web-l-medien.png) | ![web-l details](web-l-details.png) |
| Smartphone hochkant | ![web-p messwerte](web-p-messwerte.png) | ![web-p medien](web-p-medien.png) | ![web-p details](web-p-details.png) |

## Systemseite „Navigation fehlerhaft“ (Web-Ansicht)

Auf allen Test-Panels zeigt die Seite `wecker` (globales Skript) nach links auf `heizung`, eine Seite ohne Inhalt.
Ein Druck auf den Pfeil nach links öffnet die Systemseite „Navigation fehlerhaft“ (Titel „Navi-Fehler“); ihr Pfeil zurück führt wieder zu
`wecker`.

| EU | US-L | US-P | Web-L | Web-P |
| --- | --- | --- | --- | --- |
| ![eu](navigation-fehlerhaft-eu.png) | ![us-l](navigation-fehlerhaft-us-l.png) | ![us-p](navigation-fehlerhaft-us-p.png) | ![web-l](navigation-fehlerhaft-web-l.png) | ![web-p](navigation-fehlerhaft-web-p.png) |
| ![eu en](navigation-fehlerhaft-eu-en.png) | ![us-l en](navigation-fehlerhaft-us-l-en.png) | ![us-p en](navigation-fehlerhaft-us-p-en.png) | ![web-l en](navigation-fehlerhaft-web-l-en.png) | ![web-p en](navigation-fehlerhaft-web-p-en.png) |

Erste Zeile Systemsprache Deutsch, zweite Englisch. Die kurzen Texte passen in allen 11 Sprachen auf us-p und web-p
(Titel höchstens 13 Zeichen, Bezeichnungen höchstens 121 px bei 18 px Noto Sans).

## Vorher / nachher

| Befund | vorher | nachher |
| --- | --- | --- |
| us-p advanced: Querformat, rechts abgeschnitten, Hinweis-Symbol als Kästchen | ![vorher](us-p-schoner-advanced-vorher.png) | ![nachher](us-p-schoner-advanced.png) |
| us-p cardGrid3: große Werte überlappen und werden abgeschnitten | ![vorher](us-p-messwerte-vorher.png) | ![nachher](us-p-messwerte.png) |
| web-p cardGrid3: Werte abgeschnitten (`0,31€`, `42mi`) | ![vorher](web-p-messwerte-vorher.png) | ![nachher](web-p-messwerte.png) |
| us-p cardGrid2: Namen stoßen aneinander, Inhalt 16 px nach links verschoben | ![vorher](us-p-haus-vorher.png) | ![nachher](us-p-haus.png) |
| us-p cardEntities: Werte mitten im Buchstaben abgeschnitten | ![vorher](us-p-details-vorher.png) | ![nachher](us-p-details.png) |
| eu cardMedia: untere Optionszeile unten abgeschnitten, Restzeit `14:1` abgeschnitten | ![vorher](eu-medien-vorher.png) | ![nachher](eu-medien.png) |
| eu EasyView: MR-Balken fehlten, breite Werte abgeschnitten | ![vorher](eu-schoner-easyview-vorher.png) | ![nachher](eu-schoner-easyview.png) |

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
