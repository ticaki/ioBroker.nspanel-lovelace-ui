# Testumgebung – Aufbau

Diese Seite beschreibt, woraus die [Testumgebung](Testumgebung) besteht: woher die Datenpunkte kommen, wie sich eigene ergänzen lassen, wie die fünf Panel-Dateien erzeugt werden und was der Unit-Test absichert.

Inhalt:
- [Woher die Datenpunkte kommen](#1-woher-die-datenpunkte-kommen)
- [Platzhalter für Zeiten und Datumswerte](#2-platzhalter-für-zeiten-und-datumswerte)
- [Was beim Anlegen entsteht](#3-was-beim-anlegen-entsteht)
- [Rollenabdeckung und Unit-Test](#4-rollenabdeckung-und-unit-test)
- [Die Panel-Dateien neu erzeugen](#5-die-panel-dateien-neu-erzeugen)
- [Die alten Skript-Testdaten](#6-die-alten-skript-testdaten)

## 1. Woher die Datenpunkte kommen

Einzige Quelle ist **`templates/test-states.json`**. Die Datei wird mit dem Adapter ausgeliefert, der Knopf im Reiter *Entwickler* liest sie zur Laufzeit — wer sie ändert, ändert damit die Testumgebung.

| Größe | Stand heute |
|---|---|
| Kanäle | 52 |
| Datenpunkte in diesen Kanälen | 191 |
| Einzel-States ohne Alias | 25 |
| verschiedene Kanalrollen | 30 |

Aufbau der Datei:

```json
{
    "version": 1,
    "userdata": "0_userdata.0.NSPanelTest",
    "alias": "alias.0.NSPanelTest",
    "channels": [
        { "id": "Licht.Stehlampe", "role": "dimmer", "name": "Stehlampe",
          "states": { "SET": { "val": 60, "unit": "%" }, "ON_SET": true } }
    ],
    "states": [
        { "id": "Energie.PV", "name": "PV-Erzeugung", "type": "number",
          "role": "value.power", "unit": "W", "val": 4280 }
    ]
}
```

- Ein **Kanal** wird zum Alias-Kanal `alias.0.NSPanelTest.<id>` mit der angegebenen Rolle. Jeder Datenpunkt darin entsteht doppelt: als Wert-State unter `0_userdata.0.NSPanelTest.<id>.<DP>` und als Alias-State, der darauf zeigt.
- **Typ, Rolle und Schreibrecht** holt der Adapter aus seiner eigenen Datenpunkt-Tabelle zur jeweiligen Kanalrolle. In der ausführlichen Objektform lassen sie sich überschreiben: `{ "val": …, "role": …, "type": …, "unit": …, "min": …, "max": …, "states": … }`. Der Kurzform-Wert (`"ON_SET": true`) reicht, wenn die Vorgaben passen.
- **States** stehen ohne Alias direkt unter `userdata` — Energie-, Diagramm-, Wetter-, Abfall- und Hinweiswerte.

Die Bestückung ist bewusst ungleichmäßig: je Rolle ist **ein** Kanal reich ausgestattet, weitere Kanäle derselben Rolle sind absichtlich dünn. Der Thermostat „Wohnzimmer" hat 15 Datenpunkte, „Bad" sechs, „Kinderzimmer" und „Schlafzimmer" je vier. So werden Vollausbau und Sparvariante zugleich geprüft.

## 2. Platzhalter für Zeiten und Datumswerte

Feste Zeitstempel in einer mitgelieferten Datei wären sofort veraltet. Deshalb gibt es zwei Platzhalter, die beim Anlegen aufgelöst werden:

| Form | Wird zu | Verwendet für |
|---|---|---|
| `{{ts:+<n><Einheit>}}` | Zeitstempel in Millisekunden, Einheiten `s`, `m`, `h`, `d` | die Abfahrtszeiten der sechs Fahrplan-Kanäle (Soll- und Ist-Zeit) |
| `{{date:+<n>d}}` | lokales Datum **innerhalb eines Textes** | die acht Abfuhrtermine im JSON-Datenpunkt `Abfall.Termine` |

Der Abfalldatenpunkt ist dadurch im Format des iCal-Adapters aufgebaut: `[{"_date":"{{date:+1d}}","event":"Restmüll"}, …]` — acht Termine für vier Abfallarten.

Beide Platzhalter werden **nur beim Neuanlegen** ausgewertet. Ein zweiter Druck auf den Knopf erneuert sie nicht; dafür müssen die Datenpunkte erst gelöscht werden.

## 3. Was beim Anlegen entsteht

Aus den 52 Kanälen und 25 Einzel-States werden **550 Objekte**:

| Teil | Anzahl |
|---|---|
| Ordner unter `0_userdata.0.NSPanelTest` (mit Wurzel) | 76 |
| States unter `0_userdata.0.NSPanelTest` | 216 |
| Ordner unter `alias.0.NSPanelTest` (mit Wurzel) | 15 |
| Alias-Kanäle | 52 |
| Alias-States | 191 |
| **Summe** | **550** |

Die Objekte entstehen in einer Reihenfolge, in der jedes Elternobjekt vor seinen Kindern angelegt wird. Der Startwert wird ausschließlich am Wert-State unter `userdata` gesetzt, nicht am Alias — und nur dann, wenn das Objekt neu ist.

## 4. Rollenabdeckung und Unit-Test

Der Anspruch „jede Kanalrolle des Adapters kommt vor" ist kein Vorsatz, sondern geprüft: `src/lib/tools/test-states.test.ts` lädt die ausgelieferte Datei und stellt sicher, dass

1. sie in sich stimmig ist — bekannte Rollen, alle Pflicht-Datenpunkte je Rolle vorhanden, keine doppelten IDs,
2. **jede** Kanalrolle des Adapters durch mindestens einen Kanal abgedeckt ist,
3. jeder Alias-State ein Ziel hat, das im selben Lauf mit angelegt wird — kein Alias zeigt ins Leere.

Derzeit stehen 30 Rollen der Testdaten 30 Rollen des Adapters gegenüber, ohne Rest auf beiden Seiten. Kommt im Adapter eine Rolle dazu, schlägt der Test fehl, bis die Testdaten nachgezogen sind.

Starten:

```
npm run test:ts
npx mocha --config test/mocharc.custom.json "src/lib/tools/test-states.test.ts"
```

„Rolle kommt vor" heißt dabei: ein Kanal dieser Rolle existiert — nicht, dass jeder Datenpunkt der Rolle gefüllt ist. Das ist Absicht (siehe [Abschnitt 1](#1-woher-die-datenpunkte-kommen)).

## 5. Die Panel-Dateien neu erzeugen

Die fünf Dateien unter `testumgebung/panels/` sind **Exporte aus dem Admin**, keine von Hand gepflegten Dateien. Erzeugt werden sie von `testumgebung/tools/build-panel-configs.ts`:

```
npx tsx testumgebung/tools/build-panel-configs.ts
```

Das Werkzeug baut die fünf Panels mit allen Seiten, dem Bildschirmschoner und den Benachrichtigungen zusammen und schreibt sie direkt in das Instanzobjekt. Danach meldet es, wie viel geschrieben wurde — fünf Panels, 115 Seiten, fünf Bildschirmschoner.

| Voraussetzung | Einzelheit |
|---|---|
| laufender **dev-server** | Das Werkzeug spricht dessen Objektdatenbank direkt an und lädt den Datenbank-Client aus `.dev-server/default/`. Ohne dev-server läuft es nicht. |
| Instanz **`.0`** | Das Zielobjekt ist fest verdrahtet. |
| Quellcode statt Build | Typen und Vorlagen kommen aus `src/`, nicht aus `build/`. |

Es gibt weder Schalter noch Trockenlauf. Ersetzt wird gezielt: Panels mit einem `test_*`-Topic, Seiten mit gleichem Namen, Bildschirmschoner, deren Name mit „Test " beginnt, und Benachrichtigungen mit gleicher ID. Alles andere im Instanzobjekt bleibt stehen.

**Danach ist Handarbeit nötig:** Adapter neu starten und jedes Panel im Admin über die Kachel exportieren — erst dadurch entstehen die fünf JSON-Dateien.

> **Zu beachten bei Änderungen am Adapter:** Das Werkzeug hält die Kapazitätstabellen des Adapters — Plätze je Karte und je Bildschirmschoner-Bereich — als **eigene Kopie** vor, statt sie zu importieren. Heute stimmen beide Seiten überein. Ändert sich im Adapter eine Kapazität, laufen die Test-Panels still auseinander; geprüft wird das nirgends. Beim Anfassen der Kapazitäten also auch dieses Werkzeug nachziehen.

## 6. Die alten Skript-Testdaten

Im Ordner `testumgebung/` liegen daneben Testdaten für den **skriptbasierten** Konfigurationsweg, also für die Zeit vor der Konfiguration im Admin:

| Datei | Inhalt |
|---|---|
| `0_userdata.json` | Objektexport des Zweigs `0_userdata.0` (405 Objekte) |
| `alias.json` | Objektexport des Zweigs `alias.0` (338 Objekte) |
| `Config_Script.ts`, `Global_Script.ts`, `Local_Script.ts` | Referenzkonfigurationen für den JavaScript-Adapter |

Die beiden JSON-Dateien enthalten nur Objektdefinitionen, keine Werte; eingespielt werden sie über **Objekte → Import** im Admin. Die drei Skripte werden als Skript in den JavaScript-Adapter eingefügt.

Die Objektexporte sind seit September 2025 unverändert und damit wirklich alt. Die drei Skripte dagegen werden weiter gepflegt — aus ihnen stammt auch der Aufbau, mit dem die Systemseite „Navigation fehlerhaft" aufgenommen wurde.
