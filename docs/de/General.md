# MQTT-Server-Einstellungen  
  
Im Tab `MQTT-Server-Einstellungen` werden die Daten für die MQTT-Verbindung einmalig eingetragen. Wenn die Verbindung steht muss hier nichts mehr geändert werden.   

  - **WICHTIG** sollte das Panel schon einmal mit einem anderen Host verbunden gewesen sein, müsst ihr auf der Tasmotakonsole `reset 4` eingeben, damit die alte Verbindung vergessen wird. 
  Spielt ihr ein Backup von Iobroker ein, müsst ihr die Panels aus der Config löschen und neu anlegen, weil die TSL Zertifikate neu erstellt werden müssen. Sonst gibt es Probleme mit der Kopplung.  
  - Bei der Nutzung des internen MQTT Server (**vom Adapter**), ist es möglich, über den Button die Daten automatisch ausfüllen zu lassen. Diese Funktion sucht auch einen freien Port, damit es nicht zu Problemen  mit anderen Adapter kommt. (z.B. Shelly, Sonoff). Es werden **alle** MQTT-Einstellungen in Tasmota überschrieben und an den **Adater-MQTT-Server** angepasst.  
  - Bei Nutzung eines externen MQTT-Servers (mosquitto oder MQTT-Adapter) sind die Felder unten entsprechend selbst auszufüllen.  
    - IP zum externen MQTT-Server -> Beim MQTT-Adapter ist die IP vom iobroker einzutragen.  
    - MQTT-Port -> es daruf zu achten, dass der Port nicht schon von einem anderen Adapter oder Dienst/Service genutzt wird.  
    - Benutzername und Passwort -> mit welchem sich Tasmota (Panel) beim Server anmelden muss.   

 <img alt= "Startbild" src="Pictures/general/MQTT-Setting.png" width="100%" height="100%"/>  
   