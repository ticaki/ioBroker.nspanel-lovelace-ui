# Adapter-Installation

## Voraussetzungen

- ioBroker mit **js-controller >= 7.0.6**
- **Node.js >= 22**
- Adapter `nspanel-lovelace-ui` ab v1.x installiert
- Geflashtes NSPanel mit Tasmota (siehe [NSPanel flashen](NSPanel-flashen))

## Grundeinstellung (MQTT)
Im Tab `MQTT-Server-Einstellungen` muss die MQTT Verbindung eingestellt werden   

  - **WICHTIG** sollte das Panel schon einmal mit einem anderen Host verbunden gewesen sein, müsst ihr auf der Tasmotakonsole `reset 4` eingeben, damit die alte Verbindung vergessen wird. 
  Spielt ihr ein Backup von Iobroker ein, müsst ihr die Panels aus der Config löschen und neu anlegen, weil die TSL Zertifikate neu erstellt werden müssen. Sonst gibt es Probleme mit der Kopplung.  
  - Bei der Nutzung des internen MQTT Server (**vom Adapter**), ist es möglich, über den Button die Daten automatisch ausfüllen zu lassen. Diese Funktion sucht auch einen freien Port, damit es nicht zu Problemen  mit anderen Adapter kommt. (z.B. Shelly, Sonoff). Es werden **alle** MQTT-Einstellungen in Tasmota überschrieben und an den **Adater-MQTT-Server** angepasst.  
  - Bei Nutzung eines externen MQTT-Servers (mosquitto oder MQTT-Adapter) sind die Felder unten entsprechend selbst auszufüllen.  
    - IP zum externen MQTT-Server -> Beim MQTT-Adapter ist die IP vom iobroker einzutragen.  
    - MQTT-Port -> es daruf zu achten, dass der Port nicht schon von einem anderen Adapter oder Dienst/Service genutzt wird.  
    - Benutzername und Passwort -> mit welchem sich Tasmota (Panel) beim Server anmelden muss.  

  <img alt= "Startbild" src="Pictures/general/MQTT-Setting.png" width="100%" height="100%"/>
  - nach dem Speichern kann auf der Seite `Panel Einstellungen` gewechselt werden. 

## Panel Einstellungen  
  
  <img alt= "Panel Schritt 1" src="Pictures/nspanelSettings/Nspanelsettings.png" width="100%" height="100%"/>  
  
- die IP-Adresse, nach Möglichkeit eine feste IP im Router einstellen  
- einen Namen für das Panel vergeben  
- den Mqtt-Topic unter dem das Panel lauscht  
- den Panel-Typ [EU, US-P, US-L]  
- Zeitzone auswählen  

zum Schluss auf den Button `NSPanel-Initialisierung` klicken.  
Es werden die MQTT-Daten und Tasmota-Einstellungen an das Panel gesendet und damit alle Einstellungen richtig gesetzt. Desweiteren wird der Berry-Treiber installiert, sowie die NSPanel Firmware installiert(ca. 10 Minuten).  
Nach der Initialisierung wird das Panel in die Liste automatisch eingetragen.  

Im log kann man verfolgen, 
- der Berry-Treiber installiert wird
- die TFT Firmware installiert wird
- die beiden Script (Panel und Global) angelegt werden
- die Script gestartet werden
- der Adapter neu startet und das Panel aktiviert
  
Jetzt sollte auf dem Panel ein Screensaver zu sehen sein.  
 

Wenn das Panel mit der Grundconfig läuft, kann mit dem Script begonnen werden.  
   
<img alt= "Panel Schritt 5" src="Pictures/Installation/Installation_Panels_5.png" width="50%" height="100%"/>

- das Konfig-Script 

[Beispiel Konfigurationsskript](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/script/example_sendTo_script_iobroker.ts)
    
Weitere Erläuterungen zu diesem Script erhaltet ihr hier. [**Konfiguratiosscript** / Einleitung](ScriptConfig)  

Bei Fragen fragen - Discord, Forum, hier, Telegram, Teams alles vorhanden :)


[Alias Tabelle](ALIAS)
