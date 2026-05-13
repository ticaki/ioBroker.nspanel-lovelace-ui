
Ab Adapter Version v0.8.0

<img alt='pagePopup_cmd' src='Pictures/PagePopup/pagePopup_cmd.png'>  

Es werden immer alle Datenpunkte übertragen:

`activate` sendet die Daten an den Adapter

Erklärung zu den States ist unten zu finden - einzig `global` bedeutet an alle Panels senden

- `buttonLeft` hat `nächstes` als Standardfunktion (unendlicher Kreisverkehr) - wird automatische eingeblendet bei Bedarf
- `buttonMid` schließt nur die pagePopup.
- `buttonRight` hat `löschen` als Standardfunktion.

Wegen Übersicht geteilt

- `buttonLeft` die `nächste` Funktion schließt global/lokal auch ein überblättertes information Popup
- `X` schließt auf dem Panel, wo es gedrückt wird, das Popup. Ein information Popup wird dabei entfernt. Ein acknowledge Popup wird nach 5 Minuten wieder eingeblendet.
- `buttonRight` schließt/löscht/bestätigt bei einem globalen Popup dieses für alle Panels.

### Empfohlen: Versand mit Hilfe eines Skriptes

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
             panel?: string[];
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
             buzzer?: boolean | string
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

- **id**: zur Wiedererkennung - beliebige Zeichenkette - wenn leer, werden alle gespeicherten Popups gelöscht
- **type**: 'information' - wenn aufs 'X' gedrückt wird oder auf den `buttonRight`/`buttonLeft` wird das Popup gelöscht / 'acknowledge' - drücken auf 'X' startet den Wiedervorlagetimer (5 Minuten), drücken auf `buttonRight` löscht es.
- **priority**: 1: höchste Prio oder  <= 0 löscht das Popup mit der **id** <= -100 löscht die Popups die mit der **id** anfangen
- **panel**: leer oder nicht da -> Popup wird an alle Panel gesendet oder mit Angabe nur die benannten Panel
- **global**: true -> Popup wird auf allen Panel gleich behandelt, false -> jedes Panel bearbeitet die Popup selbst  
- **alwaysOn**: das gleiche Effekt wie bei Seiten
- **textSize**: unterschiedliche Textgrößen 0-5
- **buzzer**: true/false oder ein Tasmota Buzzer string. Wird 1 mal beim anzeigen ausgelöst.

- **text** - **headline** muß angegeben sein, sonst steht im Panel **missing text/headline**

- **acknowledge** ohne Angabe von buttonRight, wird ein 'Ok' Button eingeblendet

### Auswertungsstates für die Popups

<img alt='pagePopup_state' src='Pictures/PagePopup/pagePopup_state.png'>  

in **id** steht die ID der Meldung - auf globaler Ebene steht noch das Panel davor also panel.id
lokal im panel steht nur die ID

**global** wird nur von globalen Popups beschrieben. lokal von allen die auf dem panel angezeigt werden.

Beim Drücken eines Buttons wird der entsprechende Button mit der ID aktualisiert. Bei globalen Popups auch auf der globalen Ebene

