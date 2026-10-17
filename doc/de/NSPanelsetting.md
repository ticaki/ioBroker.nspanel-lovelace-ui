# Nspanel-Einstellungen

Hier werden Panels **angelegt, aktualisiert und entfernt**. Der obere Teil ist das Einrichtungsformular, darunter steht für jedes bekannte Panel eine Karte.

<img alt="Nspanel-Einstellungen" src="../Pictures/Installation/install-02-nspanel-einstellungen.png" width="100%"/>

Der Tab erscheint, sobald die [MQTT-Server Einstellungen](General) vollständig sind — ein Panel muss dafür noch nicht existieren, denn hier entsteht das erste.

## 1. Das Einrichtungsformular

| Feld | Bedeutung |
|---|---|
| **IP von ioBroker** | Nur beim eigenen MQTT-Server des Adapters: die Adresse, unter der das Panel den ioBroker erreicht. |
| **IP des Panel** | Feste IP des Panels; wird auf gültiges IPv4-Format geprüft. |
| **Panelname (eindeutig)** | Name des Panels, taucht später im Skript und in den Datenpunkten auf. |
| **MQTT-Topic (eindeutig)** | Topic des Panels. Muss mit einem Buchstaben beginnen und mindestens vier Zeichen haben. |
| **Nspanel Hardwaremodel** | EU-Querformat, US-Querformat oder US-Hochformat. |
| **Zeitzone** | Zeitzone, die dem Panel mitgegeben wird. |

Der Knopf darunter heißt **Nspanel-Initialisierung**, wenn das Topic neu ist, und **NSPanelkonfiguration aktualisieren**, wenn es ein Panel mit diesem Topic bereits gibt. Er ist erst aktiv, wenn alle Felder gültig ausgefüllt sind und die Instanz läuft.

Was die Initialisierung dann tut — drei Schritte, Berry-Treiber, TFT-Firmware —, steht ausführlich unter [Adapterinstallation](Adapter-Installation). ⚠️ **Am Ende erscheint ein Dialog mit „Speichern" und „Stornieren": erst „Speichern" übernimmt das Panel in die Konfiguration.**

## 2. Die Panel-Karten

Jede Karte zeigt den Namen, den Verbindungsstatus und als reine Anzeige die **MAC-Adresse**, die **IP**, das **MQTT-Topic** und das **Hardwaremodell**.

| Bedienelement | Wirkung |
|---|---|
| **Stift** | Kopiert IP, Name, Topic und Modell des Panels nach oben ins Formular, damit man es dort ändern kann; der Rahmen blinkt kurz. **Die Änderung selbst passiert erst**, wenn man anschließend *NSPanelkonfiguration aktualisieren* drückt. |
| **Papierkorb** | Fragt nach und entfernt das Panel danach **aus der Konfiguration**. Das Gerät selbst behält seine Tasmota-Einstellungen; soll es wirklich leer sein, hilft der Werksreset in den [Tasmota-Tools](tasmotatools). |
| **Tasmota-Konsole öffnen** | Öffnet die Konsole der Tasmota-Weboberfläche des Panels in einem neuen Tab — dort laufen die Tasmota-Meldungen live durch, und man kann Befehle eingeben. |

## 3. Häufige Stolpersteine

- **Topic schon vergeben:** Zwei Panels dürfen nicht dasselbe Topic haben. Der Knopf wechselt sonst auf „aktualisieren" und überschreibt das bestehende Panel.
- **Panel war vorher an einem anderen Host:** Vor der Initialisierung einmal `reset 4` auf der Tasmota-Konsole ausführen.
- **Nach einem ioBroker-Backup:** Panels löschen und neu anlegen — die Zertifikate werden dabei neu erzeugt.
- **Kein Internet am Panel:** Die Initialisierung bricht mit einem Hinweis ab, weil Berry-Treiber und TFT-Firmware vom Panel selbst heruntergeladen werden.
