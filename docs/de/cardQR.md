# PageQR  

**Achtung die PageQR wird jetzt direkt im Admin vom Adapter konfiguriert und erstellt unter dem Tab "PageConfig"**  

**Content**  
+ [Einstellungen im Admin](#einstellung-im-admin)  
    + [Type Freitext](#freitext)
    + [Type Wifi](#wifi)  
    + [Type Telefon](#telefon)  
    + [Type URL](#url)  
+ [Naviagtion / Panel](#navigation--panel)
 

Die PageQR erzeugt auf dem Panel ein QR-Code, der mit dem Handy zum Beispiel gescannt werden kann. Damit können Daten für das GästeWlan, eine Telefonnummer oder eine URL zu einer Website übermittelt werden.  
  
---  
## Einstellung im Admin

Die komplette Beschreibung des Tab PageConfig ist [hier](PageConfig) hinterlegt.

Zuerst wird der Seitentyp ausgewählt, in diesem Fall "QR". Dann im Textfeld "neue Seite" eine neu ID festlegen.  
> [!Note]  
> Diese ID muss einmalig sein im Adapter.  
mit dem Klick auf den "Plus"-Button wird die Seite angelegt und die Konfiguration für die Seite sichtbar.

Jetzt kann in der Konfiguration der QR-Code Typ ausgewählt werden und die Überschrift der Seite definiert werden.  

### Freitext
Hier kann eigener QR-Code eingefügt werden. Es gibt im Netz verschidenen Seiten zum nachlesen, wenn ihr diese Funktion nutzen möchtet. Probiert aus was geht.
  
### Wifi  
Beim Typ Wifi stehen folgende Felder zusätzlich zur Verfügung.  

- **WLAN-SSID** -> Hier wird der Name des Wlan eingeben   
- **WlanVerschlüsselung** -> wählt die Verschlüsselung eures Wlan aus  
- **Password** -> Wlan Password eintragen oder leer lassen
- **verstecktes Netzwerk** -> aktivieren, wenn euer netzwerk nicht sichtbar ist  
- **Password verbergen** ->  damit wird das Password auf der Seite im Panel ausgeblendet, befindet sich aber trozdem im QR Code  
- **Schalter/State** -> hier kann ein Datenpunkt vom Typ boolean eingetragen werden bzw. mit den kleinen Button rechts ausgewählt werden.  

> [!Note]  
> Wenn der Datenpunkt hinterlegt ist, wird im Panel an der Stelle des Passwortes ein Schalter eingeblendet. Mit diesem wird dann der Datenpunkt auf true / false gesetzt.  

<img alt='panelWifi' src='Pictures/pageQR/panelPageQRWifiPW.png' height='250' ><img alt='panelWifi' src='Pictures/pageQR/panelPageQRWifiSwitch.png' height='250' >  

---  

### TELEFON  
  
Beim Type TEL kann eine Telefonnummer in den Code eingebettet werden. Nachdem scannen mit dem Handy, kann man diese direkt wählen. Um International zu bleiben, sollte die Nummer mit der Ländervorwahl beginnen z.B. +49 für Deutschland.  

<img alt='panelWifi' src='Pictures/pageQR/panelPageQRTelefon.png' height='250' >  

---  

### URL  

Hier bei handelt es sich um den klassischen QR-Code wie er in jeder Werbung zu finden ist. Im Code verbirgt sich eine URL - die nach dem Scan aufgerufen werden kann. z.B. https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki/PageQR  

<img alt='panelWifi' src='Pictures/pageQR/panelPageQRURL.png' height='250' >  
  
---
  
## Navigation / Panel  
Zum Schluss wird die Navigation und allgemeine Seiteneinstellungen durchgefürht  

Auf der linken Seite in dem eingeblendeten Fenster **"Navigation/Panel"** stellt man unter dem Reiter **"Navigation"** den Platz in der Seitenhierachie. Zuerst wird das Panel bzw. "alle" ausgewählt. Dann wählt man vor bzw. hinter welcher Seite die pageQR liegen soll.  
> [NOTE]
> nur eines der Felder Prev oder Next auswählen. bei der Feldern home und parent wird das Haussymbol bzw. Pfeil nachoben eingeblendet und als ziehl die ausgewählte Seite definiert.  
  
Im Reiter **"Pagedetails"** kann festgelegt werden, ob die Seite versteckt wird beim sezten des Datenpunktes **nspanel-lovelace-ui.0.panels.C0_49_XX_XX_XX_XX.cmd.hideCards** auf true.  
Des Weiteren kann das Verhalten des Screensaver eingestellt werden für diese Seite.  
+ **Standard-Timeout** -> Screensaver blendet sich nach x Sekunden ein.  
+ **niemals aktivieren** -> Seite bleibt solange sichtbar bis manuell zur nächtes gesprungen wird.  
+ **von der vorherigen Seite übernehmen** -> übernimmt die Einstellung von der vorherigen Seite.  

