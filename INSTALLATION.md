Ablauf:
- Adapter über Expertenmodus und Github installieren
- Im Admin Mqtt einstellen und speichern
  - Bei der Nutzung des internen MQTT Server, ist es möglich, über den Button die Daten automatisch ausfüllen zu lassen. Diese Funktion sucht auch einen freien Port, damit es nicht zu Problemen  mit anderen Adapter kommt. (z.B. Shelly, Sonoff) 
  ![Startbild](Picture/Installation_Start.png)  
  - nach dem Speichern kann auf der Seite `Panels` die MQTT-Daten an das Panel gesendet werden 
  und damit werden die Tasmota-Einstellungen richtig gesetzt.  

- Im Admin unter `Panels` in der Tabelle einen neu Zeile einfügen durch klicken auf das Plus-Symbol,  
![Panel Schritt 1](Picture/Installation_Panels_1.png)  
dann im unteren Teil die IP-Adresse, einen Namen für das Panel vergeben und den Mqtt-Topic unter dem das Panel lauscht eintragen.  
![Panel Schritt 2](Picture/Installation_Panels_2.png)  
Anschließend den Button `TASMOTASENDTO` klicken, es werden doi kompletten Konfigdaten An Tasmota gesendet und damit Tasmota für den den Adapter richtig konfiguriert.
Zum Schluß den Button `TASMOTAADDTABLESENDTO` klicken, die Oberfläche wird neu geladen und das Panel steht jetzt in der Tabelle.  
![Panel Schritt 3](Picture/Installation_Panels_3.png)
Speichern und schliessen

Nächster Schritt:
- Dieses [Skript](script/example_sendTo_script_iobroker.ts) als RAW downloaden und ein neues TS-Skript im Javascript-Adapter anlegen [Beispiel Konfigurationsskript](script/example_sendTo_script_iobroker.ts)
- Anschauen und die Konfiguration aus einem vorhandenen aktuellen Nspanel-Skript hinein kopieren.  
**Alle Servicepages** aus dem alten Skript nicht übernehmen.
- Der Topic hier muß identisch sein mit einem der Topics aus dem Admin.
- Jede Seite braucht eine Eigenschaft `uniqueName`

z.B. 
```
const main: PageType = {
    'type': 'cardGrid',
    uniqueName:'main',
    'heading': 'Wohnzimmer',
    'useColor': true,
    'items': [
        { navigate: true, id: 'alias.0.NSPanel.1.usr.Temperatur.M.Wohnzimmer', targetPage: 'this_Thermostat',name: 'Wohnzimmer', onColor: MSRed, offColor: Blue, useValue: true, colorScale: {'val_min': -20, 'val_max': 40, 'val_best': 19} },
        { id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.room', onColor: MSRed, offColor: MSGreen},
        //{ navigate: true, id: '', targetPage: 'Alexa_Schlafzimmer', onColor: White},
        { navigate: true, icon:'home', name:'Haus', targetPage: 'MenuGrid', onColor: White},
    ]};
```
- Die Hauptseite muß **main** heißen
- `next`, `prev`, `home`, `parent` müssen Strings sein die auf einen der `uniqueName` verweist.
- Seiten die in `pages` eingetragen werden, werden im Kreis miteinander verlinkt, alle anderen Seiten die verwendet werden sollen müssen in `subPages` aufgeführt sein
- `button1` und `button2` ***haben eine neue Konfiguration***
- `useValue` wird nicht verwendet.

Wenn alles eingestellt ist, Skript starten und auf die Rückmeldung warten, das Skript beendet sich selbst.

Dabei bedeutet die Phrase: `not implemented yet!` das wir es noch nicht eingebaut habe und `not supported` das wir das auch nicht werden :)

Bei Fragen fragen - discord, forum, hier, telegram, teams alles vorhanden :)


[Alias Tabelle](ALIAS.md)  
  
[Zurück](README.md#aktuelle-version)  
