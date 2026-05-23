# PageConfig

**Content**  
+ [Allegemeine Infos](#allgemeine-infos)  
+ [Übersicht](#übersicht)
    + [Neue Seite](#neue-seite-hinzufügen)
+ [Konfiguration](#seiten-konfiguration)  
+ [Naviagtion und Standardeigenschaften](#navigation--standardeigenschaften)  

<img alt='pageConfig' src='Pictures/pageConfig/pageQR_config.png'>  
  
## Allgemeine Infos
Im PageConfig Tab werden die Seiten direkt im Admin erstellt und stehen somit allen Panels zur Verfügung. Es wird keine Config im Script dafür angelegt. Hier wird die Konfiguration der Seite und für die Navigation festgelegt.  

Der Tab ist in drei Bereiche eingeteilt. Rechts befindet sich die [Übersicht](#übersicht) der Seiten, in der Mitte ist die [Konfiguration](#seiten-konfiguration) der Seite und links ( das Feld kann man ein- und ausblenden ) wird die [Naviagtion und Standardeigenschaften](#navigation--standardeigenschaften) der Seite eingestellt.  
  
## Übersicht  

In der Übersicht werden alle Seiten die im Admin erstellt wurden angezeigt. Über den Seiten-Typ-Filter kann selektiert werden; verfügbar sind: **Alle**, **Menü-Seite** (`pageMenu`), **Alarm** (`cardAlarm`), **QR** (`cardQR`) und **Abfall** (`cardTrash`). Wenn eine Seite ausgewählt ist, kann über den Link "Dokumentation" direkt ins Wiki gesprungen werden für weitere Infos.

> [!NOTE]
> Die Seitentypen **PagePower** und **PageChart** werden **nicht** hier, sondern über die eigenen Admin-Tabs [Page Power](PagePower) bzw. [Page Chart](PageChart) konfiguriert.

<img alt='pageConfig' src='Pictures/pageConfig/ansicht_pages.png' width="40%" height="40%">  
  
---  
### Neue Seite hinzufügen  
  
1. Seitentyp auswählen
2. Name für die neue Seite festlegen. Dieser Name **muss** einmalig sein im **Adapter**.  
3. klick auf den Plus-Button  
4. es erschint in der Mitte die Konfiguration für die Seite.  
       
<img alt='pageConfig' src='Pictures/pageConfig/added_new_page.png' width="40%" height="40%">  
  
## Seiten-Konfiguration  
  
Die Seitenkonfiguration wird für jede Seite separat noch einmal beschrieben. Zu den Seiten kann über das Menu gesprungen werden oder von hier aus.  
  
+ [Menü-Seite (cardGrid)](cardGrid)  
+ [pageQR](cardQR)  
+ [pageAlarm / pageUnlock](cardAlarm)
+ [pageTrash](cardTrash)  
    
## Navigation / Standardeigenschaften  
  
<img alt='pageConfig' src='Pictures/pageConfig/navigation_Panels.png' width="40%" height="40%">  

Im linken Fenster **"Navigation/Panel"** stellt man unter dem Reiter **"Navigation"** den Platz in der Seitenhierarchie ein. Zuerst wird das Panel bzw. "alle" ausgewählt. Dann wählt man vor bzw. hinter welcher Seite die aktuelle Seite liegen soll.  
> [NOTE]
> nur eines der Felder **Prev** oder **Next** auswählen. bei der Feldern Home und Parent wird das Haussymbol bzw. Pfeil nachoben eingeblendet und als Ziel die ausgewählte Seite definiert.  
  
<img alt='pageConfig' src='Pictures/pageConfig/standardSetting_pages.png' width="40%" height="40%"> 
  
Im Reiter **"Pagedetails"** kann festgelegt werden, ob die Seite versteckt wird beim setzen des Datenpunktes **nspanel-lovelace-ui.0.panels.C0_49_XX_XX_XX_XX.cmd.hideCards** auf true.  
Des Weiteren kann das Verhalten des Screensaver eingestellt werden für diese Seite.  
+ **Standard-Timeout** -> Screensaver blendet sich nach x Sekunden ein.  
+ **niemals aktivieren** -> Seite bleibt solange sichtbar bis manuell zur nächtes Seite gesprungen wird.  
+ **von der vorherigen Seite übernehmen** -> übernimmt die Einstellung von der vorherigen Seite.   