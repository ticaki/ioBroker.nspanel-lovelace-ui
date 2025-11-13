v0.8.0

![Bildschirmfoto 2025-11-07 um 11.05.45.png](/assets/uploads/files/1762509950429-bildschirmfoto-2025-11-07-um-11.05.45-resized.png) 

Es werden immer alle Datenpunkte übertragen:

`activate` sendet die Daten an den Adapter

Erklärung zu den States ist unten zu finden - einzig `global` bedeutet an alle Panels senden

`buttonLeft` hat `nächstes` als Standardfunktion (unendlicher Kreisverkehr) - wird automatische eingeblendet bei Bedarf
`buttonMid` schließt nur die pagePopup
`buttonRight` hat `löschen` als Standardfunktion

`buttonLeft` die `nächste` Funktion schließt global/lokal auch ein überblättertes information Popup
`X` schließt auf dem Panel wo es gedrückt wird das popup. Ein information Popup wird dabei entfernt.
`buttonRight` schließt/löscht/bestätigt bei einem globalen Popup dieses für alle Panels.

Buttonrückgabe States:
Findet man nicht unter cmd :)
Dort wird beim Drücken eines Buttons der entsprechende button mit der ID aktualisiert. Bei globalen Popups auch auf der globalen Ebene


Empfohlen:
Versand innerhalb eines Skriptes

Simpel:
```
sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', {id: 'test3', headline:'test3', buttonLeft:'weiter', buttonRight: 'oki',  text:'Es lebt!!!'})
```

oder in kompliziert: :)

```
type PagePopupDataDetails = {
             id?: string;
             headline: string;
             text: string;
             panel?: string;
             priority?: number;
             type?: 'information' | 'acknowledge';
             colorHeadline?: {r:number,g:number,b:number} | string;
             buttonLeft?: string;
             colorButtonLeft?: {r:number,g:number,b:number} | string;
             buttonMid?: string;
             colorButtonMid?: {r:number,g:number,b:number} | string;
             buttonRight?: string;
             colorButtonRight?: {r:number,g:number,b:number} | string;
             colorText?: {r:number,g:number,b:number} | string;
             textSize?: string;
             icon?: string;
             iconColor?: {r:number,g:number,b:number};
             alwaysOn?: boolean;
             buzzer: boolean | string
         };

const message: PagePopupDataDetails = {
    id: 'test3', 
    priority: 49,
    headline:'test3', 
    buttonLeft:'weiter', 
    buttonRight: 'oki',  
    text:'Es lebt!!!',
    type: 'information',
}

sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', message)
```

Popups sind grundsätzlich erstmal dauerhaft 
buttonLeft - buttonMid - buttonRight wurde ja oben schon erklärt

Global: Wenn kein Panel angegeben ist gilt alles als global auch das löschen.

**id**: zur Wiedererkennung - beliebige Zeichenkette - wenn leer werden alle gespeicherten Popups gelöscht
**type**: information - wenn aufs X gedrückt wird oder auf den `buttonRight`/`buttonLeft` wird das gelöscht / acknowledge - drücken auf X startet wiedervorlage Timer (5 Minuten) drücken auf `buttonRight` löscht es.
**priority**: 1: höchste Prio |  <= 0 löscht das popup mit der **id** <= -100 löscht die Popups die mit der **id** anfangen
**panel**: leer oder nicht da -> popup ist global | mit Angabe nur das benannte Panel
**alwaysOn**: das gleiche wie bei Seiten
**textSize**: unterschiedliche Textgrößen 0-5
**buzzer**: true/false oder ein Tasmota Buzzer string. Wird 1 mal beim anzeigen ausgelöst.

**text** - **headline** muß angegeben sein sonst steht im Panel **missing text/headline**

**acknowledge** ohne Angabe von buttonRight wird umgetypt in **information**

das sind auswertungsstates für die popups



in **id** steht die ID die du hingeschickt ist - auf globaler ebene steht noch das panel davor also panel.id
lokal im panel steht nur die ID
wenn yes oder no angeklickt wird, wird der entsprechende State mit der ID aktualisiert.

**global** wird nur von globalen popups beschrieben. lokal von allen die auf dem panel angezeigt werden.
