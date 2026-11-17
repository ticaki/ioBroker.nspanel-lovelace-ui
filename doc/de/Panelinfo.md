# Panelinfo

Der Adapter bringt einen **eigenen Eintrag in der linken Seitenleiste des Admin** mit — unter dem Adaptersymbol.  
Er öffnet den Tab **Panelinfo**: eine Kachel je Panel mit den wichtigsten Werten, und zwar nicht nur zum Ansehen, sondern auch zum Bedienen.

<img alt="Panelinfo mit der Kachel eines Panels" src="../Pictures/panelinfo/panelinfo-01-kachel.png" width="100%"/>

Anders als die Instanz-Einstellungen ist dieser Tab für den **täglichen Blick** gedacht: Läuft das Panel, wie stark ist das WLAN, wie viele Seiten hat es, welches Skript gehört dazu. Oben rechts in der Kachel führt das **Zahnrad** zu den Instanz-Einstellungen, wenn doch etwas konfiguriert werden muss.

## Was die Kachel zeigt

Kopfzeile: Name des Panels, der Verbindungsstatus und — falls der Adapter eine Abweichung erkannt hat — der Zusatz **(Überprüfen!)** samt oranger Umrandung. Dann folgen die Werte:

| Anzeige | Datenpunkt unter `panels.<Panel>.` | Bedeutung |
|---|---|---|
| **Panel aktiv** | `cmd.activated` | Schaltet das Panel im Adapter an und aus. |
| **Layout** | `cmd.screenSaver.layout` | Version des Bildschirmschoners (z. B. `advanced`). |
| **Bildschirmschoner-Timeout** | `cmd.screenSaver.timeout` | Sekunden bis zum Bildschirmschoner. |
| **Tagesmodus** | `cmd.dim.dayMode` | Umschaltung zwischen Tag- und Nachthelligkeit. |
| **Zeitplan aktivieren** | `cmd.dim.schedule` | Schaltet die zeitgesteuerte Helligkeit ein. |
| **Temperaturoffset** | `cmd.tempOffset` | Korrekturwert für den eingebauten Temperatursensor, siehe [Temperaturoffset](#temperaturoffset). |
| **Temperature1** | `info.tasmota.sensors.ANALOG.Temperature1` | Messwert des Sensors im Panel. |
| **Panelmodell** | `info.nspanel.model` | Hardwaremodell, z. B. EU-Querformat. |
| **Anzahl der Seiten** | `info.internal.pageCount` | Wie viele Seiten das Panel aktuell kennt. |
| **Signal** | `info.tasmota.sts.Wifi.Signal` | WLAN-Pegel in dBm — je näher an 0, desto besser. |
| **Skriptname** | `info.internal.scriptName` | Das Konfigurationsskript, das zu diesem Panel gehört. |

Unten führt **Tasmota-Konsole öffnen** direkt in die Weboberfläche des Panels.

## Bedienen statt nur ansehen

Die Felder, die zu einem **schreibbaren** Datenpunkt gehören, sind echte Bedienelemente: Schalter kippen sofort, eine Auswahl übernimmt den Wert beim Auswählen, ein Textfeld, wenn man **Eingabe** drückt oder es verlässt. **Gespeichert wird nichts und neu gestartet auch nicht** — der Wert geht direkt in den Datenpunkt, das Panel reagiert unmittelbar. Reine Messwerte (Temperatur, Signal, Seitenzahl, Skriptname) lassen sich nicht ändern.

Praktisch heißt das: Bildschirmschoner-Zeit oder Tagesmodus probiert man hier aus, ohne die Instanz-Einstellungen zu öffnen und ohne den Adapter neu zu starten.

## Temperaturoffset

Der **Temperaturoffset** ist ein Korrekturwert für den eingebauten Temperatursensor: Tasmota rechnet ihn auf den Messwert auf, ein negativer Wert senkt die Anzeige also ab.

| Was | Verhalten |
|---|---|
| **Wertebereich** | −12,6 bis +12,6. Werte außerhalb setzt der Adapter auf die nächste Grenze. |
| **Einheit** | Folgt der Einstellung `TempUnit` in Tasmota — °C oder °F. |
| **Übertragung** | Der Adapter schickt den Wert per MQTT als Tasmota-Befehl `<Topic>/cmnd/tempOffset` an das Panel. Das geht nur, solange das Panel online ist. |
| **Nach einer Änderung** | Der Adapter fragt gleich danach `STATUS 10` ab, damit **Temperature1** zeitnah den korrigierten Wert zeigt und nicht erst mit der nächsten regelmäßigen Meldung. |
| **Panel geht online** | Bei jedem Online-Gehen sendet der Adapter den gespeicherten Wert erneut. |
| **Wert vom Panel** | Kommt vom Panel eine MQTT-Nachricht (`tele/RESULT` oder `stat/RESULT`) mit dem Feld `tempOffset`, übernimmt der Adapter diesen Wert in den Datenpunkt. |

Im Schnellzugriff ist das Feld ein Textfeld: Wert eintippen, mit **Eingabe** bestätigen oder das Feld verlassen — wie unter [Bedienen statt nur ansehen](#bedienen-statt-nur-ansehen) beschrieben. Web-Panels haben keinen Temperatursensor und damit auch keinen Offset (siehe [WebPanel](WebPanel)); bei ihnen fehlen beide Felder.

## Hinweise

- Läuft die Instanz nicht, erscheint statt der Kacheln ein Hinweis darauf — dann hilft ein Blick ins Protokoll.
- Die Farbe der Kachel folgt derselben Logik wie im Tab [Maintain](Maintain): orange heißt „der Adapter hat etwas gefunden", etwa eine veraltete Firmware oder eine neuere Skriptversion.
- Welche Werte eine Kachel zeigt, ist im Adapter festgelegt; die vollständige Liste aller Datenpunkte eines Panels steht im Objektbaum unter `nspanel-lovelace-ui.<Instanz>.panels.<Panel>`.
