# Testumgebung

Fertige Testdaten für alle Panel-Modelle: Datenpunkte für jede Kanalrolle des Adapters und je Modell eine
Panel-Konfiguration mit allen Kartentypen, voll belegten Seiten und einem voll belegten Bildschirmschoner.
Damit lässt sich die Web-Ansicht schnell durchklicken, und für Hardware-Tests liegt sofort eine Konfiguration bereit.
Bilder und Prüftabelle: [doc/Pictures/testumgebung](../doc/Pictures/testumgebung/README.md).

## In drei Schritten

1. **Datenpunkte anlegen** – Instanz-Einstellungen → Reiter **developer** (nur im Expertenmodus sichtbar) →
   **Testdatenpunkte anlegen**. Der Adapter legt alle Objekte unter `0_userdata.0.NSPanelTest` und
   `alias.0.NSPanelTest` an und meldet, wie viele neu angelegt wurden und wie viele schon da waren.
   Vorhandene Objekte und Werte werden **nicht** verändert – der Knopf darf beliebig oft gedrückt werden.
2. **Panel-Konfiguration importieren** – im Reiter **NSPanel-Einstellungen** auf der Kachel des Panels
   **Panel-Konfiguration importieren** wählen, die Datei zum Modell des Panels auswählen (Tabelle unten),
   in der Übersicht **Importieren** und danach die Instanz-Einstellungen **speichern**.
3. **Fertig** – der Adapter startet neu, das Panel (oder die Web-Ansicht) zeigt die Testseiten.

Ein Panel ohne Hardware geht am schnellsten als eigenständiges Web-Panel: NSPanel-Einstellungen → Web-Panel
hinzufügen, Modell wählen, dann wie oben importieren. Aufruf im Browser: `http://<ioBroker>:8090/<topic>`.

## Welche Datei für welches Modell

| Modell | Datei | Panel |
| ------ | ----- | ----- |
| EU (480 × 320) | [`panels/nspanel-eu.json`](panels/nspanel-eu.json) | NSPanel EU, Web-Klon eines EU-Panels |
| US quer (480 × 320) | [`panels/nspanel-us-l.json`](panels/nspanel-us-l.json) | NSPanel US Landscape |
| US hochkant (320 × 480) | [`panels/nspanel-us-p.json`](panels/nspanel-us-p.json) | NSPanel US Portrait |
| Smartphone quer (640 × 320) | [`panels/nspanel-web-l.json`](panels/nspanel-web-l.json) | eigenständiges Web-Panel `web-l` |
| Smartphone hochkant (320 × 640) | [`panels/nspanel-web-p.json`](panels/nspanel-web-p.json) | eigenständiges Web-Panel `web-p` |

Die Seiten heißen nach dem Modell (`eu_licht`, `usp_haus`, …). Mehrere Dateien lassen sich deshalb ohne
Namenskonflikte in dieselbe Instanz importieren. Die Dateien enthalten keine Passwörter oder PINs
(Alarm/Tür-Seite nutzen das globale Passwort der Instanz, das Gäste-WLAN ist offen).

## Was enthalten ist

**Seiten** (Reihenfolge der Navigation, die letzte führt zurück zur Startseite):

| Seite | Karte | Inhalt |
| ----- | ----- | ------ |
| Licht (Startseite) | cardGrid | Licht, Dimmer, CT, RGB, RGB-Single, Hue, … – alle Plätze des Modells |
| Haus | cardGrid2 | Steckdosen, Szenen, Rollladen, Tor, Schloss, Lüfter, Heizung, Klima, Auswahl, Timer, Lautstärke; der letzte Platz führt zur Unterseite **Details** |
| Messwerte | cardGrid3 | Temperaturen, Feuchten, Strompreis, Restlaufzeit als Wert mit Farbskala |
| Rollläden & Tore, Sensoren, Steuerung | cardEntities | je alle Zeilen des Modells |
| Alle Rollen | cardEntities | ein Kanal je Rolle, mit Blätterpfeil |
| Abfahrten | cardSchedule | Fahrplan-Abfahrten (Rolle timeTable) und Infozeilen |
| Wohnzimmer, Klimaanlage | cardThermo | Thermostat mit allen Datenpunkten, Klimaanlage (airCondition) |
| Heizkreise | cardThermo2 | 4 Thermostate (einer über Einzel-States), Klimaanlage als Heiz- und Kühlkreis, 9 Elemente |
| Medien | cardMedia | Player `squeezeboxrpc.0.Players.Familienzimmer` mit eigenen Elementen |
| Energiefluss | cardPower | 6 Zweige, Akku-Ladestand und Hausverbrauch in der Mitte |
| Strom 24 h, Außentemperatur | cardChart / cardLChart | Balken- und Liniendiagramm aus Datenpunkten (Skript-Quelle) |
| Energie heute | cardPChart | Kuchendiagramm mit 5 Stücken |
| Alarmanlage, Tür öffnen | cardAlarm | Alarm mit 5 Modi, Türöffner (globales Passwort) |
| Gäste-WLAN, Anleitung | cardQR | offenes WLAN mit Schalter, URL |
| Abfuhrtermine | cardTrash | 4 Abfallarten aus einem Datenpunkt im Format des iCal-Adapters |
| Licht (Seitenlink) | Seitenlink | zeigt die Startseite unter eigenem Namen |
| Details | cardEntities | Unterseite (nur über das Element auf „Haus“, Zurück führt nach „Haus“) |

**Bildschirmschoner**: ein Eintrag je Modell, Startmodus **advanced**. Jeder Bereich ist für den größten
Modus des Modells belegt (links bis 4, unten bis 8, Indikatoren bis 12, dazu Favorit, Wechselzeile, beide
MR-Icons und zwei Benachrichtigungen). Dadurch ist auch nach einem Moduswechsel jeder Platz belegt. Die
Indikatoren sind gemischt: reine Anzeige, Tippen schaltet/öffnet eine Seite, langes Drücken (TFT 6.0.9) mit
eigener Aktion, oder beides.

**Modus wechseln** – den Datenpunkt `nspanel-lovelace-ui.0.panels.<Panel-ID>.cmd.screenSaver.layout` setzen:

| Wert | Modus |
| ---- | ----- |
| 0 | standard |
| 1 | alternate |
| 2 | advanced |
| 3 | easyview |
| 4 | tiles (screensaver5) |

Der Wechsel gilt sofort. Nach einem Neustart des Adapters gilt wieder der Modus aus dem Admin (advanced);
dauerhaft ändert man ihn im Reiter **Bildschirmschoner** am Eintrag „Test …“.

Die Benachrichtigungen erscheinen, wenn `0_userdata.0.NSPanelTest.Hinweis.Waschmaschine_fertig` auf `true`
oder `0_userdata.0.NSPanelTest.Hinweis.Fenster_offen` größer 0 gesetzt wird.

## Grenzen

- **us-p in der Web-Ansicht**: die Bildschirmschoner-Modi standard, alternate, advanced und easyview werden
  auf us-p noch im Querformat gezeichnet und rechts abgeschnitten (nur tiles ist hochkant). Die Hardware
  ist davon nicht betroffen.

- **Medien**: die Medienseite braucht einen echten Player (alexa2, sonos, spotify-premium, mpd, squeezeboxrpc).
  Die Dateien verweisen auf `squeezeboxrpc.0.Players.Familienzimmer`; nach dem Import im Admin den eigenen Player
  wählen oder die Seite ausblenden.
- **Rolle media** und **sensor.alarm.flood**: die Kanäle werden angelegt, stehen aber auf keiner Seite – ein
  Element der Rolle media braucht einen Alias auf den Status eines echten Players, sensor.alarm.flood ist im
  Adapter als Seitenelement noch nicht umgesetzt. Der Wassermelder ist ein Indikator des Bildschirmschoners.
- **Zeitwerte**: Abfahrten und Abfuhrtermine werden beim Anlegen relativ zur aktuellen Zeit gesetzt und
  veralten danach. Zum Erneuern die Datenpunkte löschen und den Knopf noch einmal drücken.

## Aufbau

| Pfad | Inhalt |
| ---- | ------ |
| `../templates/test-states.json` | Quelle der Datenpunkte, wird mit dem Adapter ausgeliefert und vom Knopf gelesen |
| `panels/nspanel-<modell>.json` | Exporte der Admin-Funktion „Panel-Konfiguration exportieren“ (ohne Passwörter) |
| `tools/build-panel-configs.ts` | erzeugt die Test-Panels im Dev-Server neu (`npx tsx testumgebung/tools/build-panel-configs.ts`), danach je Panel exportieren |
| `0_userdata.json`, `alias.json`, `*_Script.ts` | ältere Testdaten für das Konfigurationsskript (Objekt-Export, manuell zu importieren) |

### Format von `test-states.json`

```json
{
    "userdata": "0_userdata.0.NSPanelTest",
    "alias": "alias.0.NSPanelTest",
    "channels": [
        { "id": "Licht.Stehlampe", "role": "dimmer", "name": "Stehlampe",
          "states": { "SET": { "val": 60, "unit": "%" }, "ON_SET": true } }
    ],
    "states": [
        { "id": "Energie.PV", "name": "PV-Erzeugung", "type": "number", "role": "value.power", "unit": "W", "val": 4280 }
    ]
}
```

- Ein **Kanal** wird zum Alias-Kanal `alias.0.NSPanelTest.<id>` mit der Rolle `role`. Jeder Datenpunkt wird ein
  Wert-State `0_userdata.0.NSPanelTest.<id>.<DP>` und ein Alias-State, der darauf zeigt.
- Typ, Rolle und Schreibrecht kommen aus der Datenpunkt-Tabelle des Adapters (`requiredScriptDataPoints`);
  in der Objektform (`{ "val": …, "role": …, "type": …, "unit": …, "min": …, "max": …, "states": … }`) lassen sie
  sich überschreiben.
- **States** ohne Alias (Energie, Diagramme, Abfall, Hinweise, Wetterwerte) liegen direkt unter `userdata`.
- Platzhalter: `{{ts:+15m}}` wird zum Zeitstempel (s, m, h, d), `{{date:+3d}}` in einem Text zum Datum.
- Ein Unit-Test prüft, dass jede Kanalrolle vorkommt und alle Pflicht-Datenpunkte vorhanden sind.
