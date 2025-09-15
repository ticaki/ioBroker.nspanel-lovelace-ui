# PagePower  
  
**Content**
+ [Grundeinstellung](#grundeinstellung)  
    + [Erzeuger / Verbraucher](#erzeuger--verbraucher)  
    + [Home ](#home)    
+ [Verweis im Konifg Script](#verweis-im-konfig-script)   

 Die Page Power ermöglicht bis zu 6 Verbraucher / Erzeuger darzustellen und zu verrechnen. Sie soll die Stromverteilung in eurem Smarthome abbilden. Icons, Farbverläufe, Geschwidigkeit der Flußrichtung sowie die Flußrichtung selbst lassen sich hier einstellen. Die Einstellmöglichkeiten erklären wir an einem Beispiel. Ihr könnt mehrere dieser Seiten erstellen. Auf welchem Panel ihr diese dann nutzt, entscheidet ihr im Konfig-Script des jeweiligen Panels.  
  
---
## Grundeinstellung  
  
 <img alt= 'PagePower allg' src='Pictures/pagePower/pagePowerallg.png'>  
   
 Mit Auswahl des Tab `PagePower` kommt ihr an die Einstellungen. Um eine neue Page zu erstellen, klickt ihr auf das PLUS-Zeichen und es erscheinen die Datenfelder für die Page. (siehe Bild oben)  
1. Zuerst legt ihr den Seitennamen fest, dieser darf sich im gesamten Panel nicht wiederholen. Es ist die ID für diese Seite und ist identisch mit dem `uniqueName`. Der Name erscheint auch in dem grauen Balken, dadruch könnt ihr bei mehreren Seiten sie leicht unterscheiden.
2. Die Überschrift auf der Seite festlegen.
3. Wenn ihr den Haken bei `alwaysOnDisplay` setzt, bleibt die Seite permanent sichtbar und spring nicht automatisch in den Screensaver. Damit der Screensaver wieder aktiv wird, müsst ihr auf eine andere Seite springen.  
4. Option `Seite ausblenden` ermöglicht die Seite aus der Navigation zu entfernen, wenn in der Serviceseite `System`die Option `hide Page` aktiv ist.
  
---  
## Erzeuger / Verbraucher  
  
<img alt='pagePowerItem' src='Pictures/pagePower/pagePowerItem.png'>  

+ **Icon** -> über das Selctfeld kann ein Icon ausgewählt werden, dabei unterstütz euch die Selectivesuche und schlägt Varianten vor.  
+ **Datenpunkt für Leistung** -> den Datenpunkt auswählen, der die Leistung (Watt) enthält   
  
 <img alt='pagePowerItemMore' src='Pictures/pagePower/pagePowerItemMore.png'>  
   
 + **Anzahl der Dezimalstellen**, die dargestellt werden sollen, unabhängig von der Anzahl im Datenpunkt  
 + **Einheit** Hiermit wird die kleinste darzustellende Einheit ausgewählt. Durch die AutoUnit-Funktion wird die Einheit erhöht, wenn die Zahl vierstellig wird. z.B 999W werden bei Erhöhung zu 1kW. Wenn im Datenpunkt eine Einheit definiert ist, ist diese führend und überschreibt diese hier im Admin.  
 + **maximale Leistung** -> den maximalen Wert eintragen der vom Datenpunkt zu erwarten ist. Der max-Wert bedeutet 100% Geschwindigkeit der Anzeige für die Flussrichtung. Bei 0W bleibt der Punkt stehen und wird bei Erhöhung der Leistung prozentual dann schneller.  
 + Durch setzen des Haken kann die **Flußrichtung umgekehrt** werden. Alle Erzeuger sollten zur Mitte fließen und Verbraucher davon weg. Die Mitte der Seite spiegelt den Verteilerkasten wieder, wo alle Verbraucher und Erzeuger zusammen kommen.  
 + **Iconfarbe** -> mit dem ColorPicture kann die Farbe des Icon ausgewählt werden. Soll das Icon nach Höhe der Leistung seine Farbe ändern, dann aktiviert `Farbskale verwenden`.  
   
 <img alt='' src='Pictures/pagePower/pagePowerItemUsecolor.png'>

Mit den Werten `min Leistung`, `max Leistung`, `best Leistung` wird der Farbverlauf von Grün nach Rot festgelegt. Es gibt mehrere Möglichkeiten den Verlauf einzustellen. Welcher Wert Grün ist entscheidet der Wert von `best Leistung`.
+ **Beispiel 1**  
    0W soll grün sein und 100W Rot  
    + `min Leistung` = 0
    + `max Leistung` = 100  
    + `best Leistung` = 0
  
 + **Beispiel 2**  
    0W soll Rot sein und 100W Grün  
    + `min Leistung` = 0
    + `max Leistung` = 100  
    + `best Leistung` = 100
  
 + **Beispiel 3**  
    -50W soll Rot sein 0W ist Grün und 100W wieder Rot
    + `min Leistung` = -50
    + `max Leistung` = 100  
    + `best Leistung` = 0  
  
Mit **Beschreibung/Titel** könnt ihr über der Flussanzeige einen Text einblenden z.B. welcher Verbraucher das ist.

---  
### Home  

<img alt='pagePowerHome' src='Pictures/pagePower/pagePowerHome.png'>  
  
Home ist der mittlere Teil der Page, hier laufen alle Leistungen zusammen. Es ist der virtuelle Stromkasten mit seinem Zähler. Es gibt hier zwei Felder die Ihr nutzen könnt um Werte anzeigen zu lassen.  

+ `Haus oben` ist der Wert über dem Haus-Symbol. Ihr legt den Datenpunkt fest den ihr anzeigen wollt und könnt über `weitere Einstellungen` zusätzlich noch Dezimalstellen und Einheit auswählen. Hier gilt auch das der Admin die Einheit vom Datenpunkt überschreibt.  
+ `Haus unten` hat zwei Funktionen. Wenn `interne Berechnung` nicht aktiv ist, dann gleicht es dem Feld `Haus oben`. Bei Aktivierung könnt ihr über `Auswahl Stromeinseisungen` die Felder auswählen, die euer Smarthome versorgen (z.B. Stromnetz, Batterie, Solarpanel)  
---  
## Verweis im Konfig Script
Im Konfig Script wird die Seite wie folgt eingebunden.  
Als Hauptseite unter pages
```typescript
    const powerGrid: ScriptConfig.PagePower = {
        uniqueName: 'seitenname', // muss mit dem Namen im Admin übereinstimmen
        type: 'cardPower'
    };
```  

Als Subpage unter subPages  
```typescript
    const energieAnzeige: ScriptConfig.PagePower = {
        prev: 'uniqueName einer Seite',
        home: 'main',
        uniqueName: 'seitenname', // muss mit dem Namen im Admin übereinstimmen
        type: 'cardPower'
    };
```  
Unter pages bzw subPages wird der Name, der hinter `const` steht eingetragen.  
```typescript
        // Seiteneinteilung / Page division
        // Hauptseiten / Mainpages
        pages: [
            powerGrid,
        ],
        // Unterseiten / Subpages
        subPages: [
            energieAnzeige,
        ],
```  

> [!Note]  
> Zuerst die Einstellungen im Admin durchführen und danach das Script anpassen und neu starten.