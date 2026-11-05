# MQTT-Server Einstellungen

Der Adapter spricht mit den Panels ausschließlich über **MQTT**. In diesem Tab wird festgelegt, welcher Broker das ist. Ohne gültige Angaben hier bleiben die meisten anderen Tabs ausgeblendet — sie setzen eine funktionierende MQTT-Verbindung und mindestens ein Panel voraus.

<img alt="MQTT-Server Einstellungen" src="../Pictures/Installation/install-01-mqtt-server.png" width="100%"/>

## Eigener Server oder externer Broker

| Einstellung | Bedeutung |
|---|---|
| **Verwende den eigenen MQTT-Server des Adapters** | Der Adapter betreibt den Broker selbst. Empfohlen, weil er direkt mit dem Panel spricht. |
| **Fülle automatisch MQTT-Anmeldeinformationen und Port aus** | Nur beim eigenen Server: erzeugt einen zufälligen Benutzernamen und ein langes Zufallspasswort und sucht einen **freien Port ab 8883**, damit es keinen Streit mit anderen Adaptern gibt (Shelly, Sonoff …). |
| **IP zum externen MQTT-Server** | Adresse des fremden Brokers. Beim MQTT-Adapter die IP des ioBroker-Hosts; bei Mosquitto dessen Adresse. Gesperrt, solange der eigene Server aktiv ist. |
| **MQTT-Port** | Der Port, auf dem der Broker lauscht — bei Mosquitto in der Regel 1883, beim MQTT-Adapter der dort eingestellte Port. |
| **MQTT-Benutzername** / **MQTT-Passwort** | Zugangsdaten, mit denen sich das Panel am Broker anmeldet. Das Passwort lässt sich über das Augensymbol sichtbar machen; gespeichert wird es verschlüsselt. |
| **Tasmota WebUI-Passwort verwenden** | Einschalten, wenn die Weboberfläche des Panels durch ein Passwort geschützt ist. Erst dann erscheint das Feld **Tasmota Webui Passwort**. |

## Was das Tasmota-Passwort bewirkt

Der Adapter spricht das Panel nicht nur über MQTT an, sondern für einige Aufgaben auch direkt über dessen Weboberfläche — etwa beim Installieren des Berry-Treibers, beim Neustart und bei den Werkzeugen im Tab *tasmotaTools*. Ist die Oberfläche passwortgeschützt, hängt er die hier hinterlegten Zugangsdaten automatisch an diese Aufrufe an. Fehlt das Passwort, scheitern genau diese Aktionen.

## Hinweise

- **Alle Felder sind gesperrt, solange die Instanz nicht läuft.** Erst eine laufende Instanz kann den Autofill-Knopf bedienen.
- **Ein Wechsel des Brokers wirkt sich auf die Panels aus:** Bei der nächsten *Nspanel-Initialisierung* werden die MQTT-Einstellungen im Tasmota überschrieben und auf den hier eingestellten Server gezogen. Panels, die schon laufen, müssen dafür erneut initialisiert werden.
- Nach dem Speichern startet die Instanz neu — das ist bei ioBroker-Instanzeinstellungen normal.

Wie man von hier aus ein Panel in Betrieb nimmt, steht unter [Adapterinstallation](Adapter-Installation).
