# NSPanel Settings  
  
in diesem Tab wird das Panel initialisiert. Das bedeutet das alle wichtigen Daten für die Verbindung mit dem Adapter hier zum Panel übertragen werden und im Panel alle Einstellungen vorgenommen werden. Durch den Benutzer üssen keine Weitern Einstellungen am Panel durchgeführt werden. Es müssen nur die Felder ausgefüllt weerden.  

- die IP-Adresse, nach Möglichkeit eine feste IP im Router einstellen  
- einen Namen für das Panel vergeben (einmalig im Adapter)  
- den Mqtt-Topic unter dem das Panel lauscht  
- den Panel-Typ [EU, US-P, US-L]  
- Zeitzone auswählen  
  
<img alt= "Panel Settings" src="Pictures/nspanelSettings/Nspanelsettings.png" width="100%" height="100%"/>  

Wenn der interne MQTT-server genutzt wird, muss zusätzlich noch die IP des ioBokers ausgewählt werden.  
<img alt="iobrokerIP" src="Pictures/nspanelSettings/iobrokerIP.png" width="40%"/>  
  
Zum Schluss auf den Button `NSPanel-Initialisierung` klicken.  
Es werden die MQTT-Daten und Tasmota-Einstellungen an das Panel gesendet und damit alle Einstellungen richtig gesetzt. Desweiteren wird der Berry-Treiber installiert, sowie die NSPanel Firmware installiert (ca. 10 Minuten).  
   
Im Anschluß Popup bestätigen und Speichern. Es wird eine neu Card für das Panel erstellt und unten angezeigt. 

<img alt="panelCard" src="Pictures/nspanelSettings/panelCard.png" width="30%"/>  
  
In der Card ist der Status vom Panel zu sehen sowie ein button zum öffnen der Tasmota-Konsole. Über den Bleistift können die Daten bearbeitet werden, sie werden dazu in dan Init-Feld kopiert und der Button trägt dan die Bezeichung `Aktualisierung`. mit dem Mülleinmer wird das Panel aus dem Adapter gelöscht.   
    
    