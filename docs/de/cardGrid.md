# cardMenue    

in der cardMenue können alle cardGrid-Typen, cardEntities und cardSchedule angelegt werden und müssen somit nicht im Script erstellt werden. Aktuell stehen nur die Grundfunktionen targetPage, trueColor (onColor), falseColor (offColor), trueIcon (icon), falseIcon (icon2) und name zur Verfügung. Weitere Einstellungen wie useColor mit seinen verschiedenen Modi und useValue sowie min/max werden schnellstens nachgeliefert.  

## Grundlagen  
Die allgemeinen Informationen zur Bedienung des Tab [Page Config ist hier](PageConfig) beschrieben und sollte im Vorfeld gelesen werden.  
  
## Einstellungen im Detail  
  
 <img alt='pageMenue' src='Pictures/cardMenue/config.png' width="45%">  
   

### Überschrift  

Die Überschrift der Seite, was sonst ;)  

### Kartentyp  
  
Hier wird der Kartentyp ausgewählt, je nach Typ ändert sich das Layout für die Felder der PageItem. Das Layout entspricht der Anzeige auf dem Panel.  

### PanelLayout / hinzufügen von PageItem  

Mit einem Klick auf ein Feld öffnet sich der Hauptdialog für das PageItem.  

 <img alt='Maindialog' src='Pictures/cardMenue/mainDialog.png' width="45%">  
   
 #### Checkbox "ist eine Navigation"  
 Mit der Checkbox kann aus gewählt werden, das dieses PageItem beim drücken auf eine Zielseite springt. (entspricht "navigate:true"). Es wird das DropDown-Menue "Zielseite" eingeblendet, wo die Seite ausgewählt wird. (targetPage)  

#### iobroker-Kanal  
Klick auf den Button mit den drei Punkten öffnet den Objektbrowser, wo der Channel ausgewählt wird.  
  
> [Note]  
> es muss ein State ausgewählt werden, damit der Channel übernommen wird.  

Sollten Fehler im Channel sein, erscheint hinter dem Button ein Symbol und unten erscheint ein Button `Details`. Klick auf den Button zeigt die Fehlermeldung an.  

#### Name  
Hier kann eine eigener Name für das PageItem eingetragen werden. Wenn hier nicht eingetragen wird, wird der Name aus common.Name ermittelt. Ohne common.Name wird der Name der Rolle genutzt.  

#### Bedingungen true/false  
hier kann ein anderes Icon und Farbe ausgewählt werden, die genutzt werden sollen als die Standardeinstellungen.  

---  
Im Panellayout können die PageItem mit drag and drop verschoben werden, copy and paste funktioniert auch. Wenn mehr PageItem eingefügt werden sollen als auf eine Seite passen, kann mit dem Button `Seite hinzufügen` eine weitere Seite hinzugefügt werden, gleichzeit besteht dann auch die Auswahl, ob im letzten PageItem der Seite ein `Pfeil` eingefügt wird zum Blättern oder mit den Navigationspfeilen der Seite geblättert werden soll.  