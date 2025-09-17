<!-- TODO: Translate from German to 中文 -->

# Content

[Latest Changes](#latest-changes) 
* [Navigation](#navigation)
* [Doppelklicks (Bestätigung)](#doppelklicks-(bestätigung)) 
* [Doppelklicks](#doppelklicks) 
* [Verwendung von Themenfarben](#verwendung-von-Themenfarben)
* [Bearbeiten von Übersetzungen](#bearbeiten-von-übersetzungen)
* [Einfügen des Servicemenüs](#einfügen-des-servicemenüs)
* [Zugriff auf Paneldatenpunkte](#zugriff-auf-paneldatenpunkte)
* [Anlegen von Popups](#anlegen-von-popups)
* [Konfiguration - Enums](#konfiguration---enums)
* [Platzhalter - dbInit](#platzhalter---dbinit)

---

# Latest Changes

## Navigation
Die Navigation bietet 2 Seiten, jeweils mit 2 Klickmöglichkeiten und 3 Icons. Links und rechts sind die jeweiligen Seiten auf dem Panel.
- single only: Darstellung als Pfeil in die jeweilige Richtung in weiß
- double only: Darstellung als parent(Pfeil nach oben) links oder home rechts in weiß
- single und double definiert: Darstellung als outline Pfeil nach links oben oder rechts oben.
Nur wenn beide definiert sind gibt es eine Doppelklick.

Zusätzlich nochmal die Blätterfunktion:
- Entities: links ein blauer Pfeil nach oben, rechts ein blauer Pfeil nach unten bis zum jeweiligen Ende der Blätter funktion dann folgt die darstellung wie oben beschrieben.
- Grids: ein blauer Pfeil nach links oder rechts (scrolltype page), bei Zeilenweisen blättern ist die Darstellung wie Entities.


## Doppelklicks (Bestätigung)
**09.03.2024**

Im Pageitem type `button` gibt es mit gesetztem Datenpunkt `confirm: {type: 'const', constVal: 'sure?`}` die Option nach dem ersten Klick den Text aus confirm anzeigen zu lassen und noch einen 2. abzuwarten, bevor die Aktion ausgelöst wird, siehe Tasmota Restart.

## Doppelklicks
**09.03.2024**

Doppelklicks in der Navigation
- in der normalen Navigation werden diese mit der Eigenschaft double konfiguriert. Wenn in der Navigation nur ein double vor kommt ist es ein single wird aber als parent/Home dargestellt.
- in der Seiten/Zeilenblätterfunktion löst ein Doppelklick einen Navigationsklick in die entsprechende Richtung aus, so als wenn schon durchgeblättert hätte.


## Verwendung von Themenfarben
**09.03.2024**
Es gibt folgende Themenkonstanten die man aktuell verwenden kann:
```typescript
export interface ColorThemenInterface {
    good: RGB;
    bad: RGB;
    true: RGB;
    false: RGB;
    activated: RGB;
    deactivated: RGB;
    attention: RGB;
    info: RGB;
    option1: RGB;
    option2: RGB;
    option3: RGB;
    option4: RGB;
    open: RGB;
    close: RGB
}
```

Beispiel:
```typescript
                true: {
                    value: { type: 'const', constVal: 'checkbox-intermediate' },
                    color: { type: 'const', constVal: Color.bad },
                    text: { value: { type: 'internal', dp: '///AdapterNoConnection' } },
                },

                false: {
                    value: { type: 'const', constVal: 'checkbox-marked-outline' },
                    color: { type: 'const', constVal: Color.good },
                    text: { value: { type: 'internal', dp: '///AdapterNoConnection' } },
                },    
```


## Bearbeiten von Übersetzungen
**09.03.2024**
Übersetzungen von Tokens in Worte muß für en hier https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/e72aa58d709fa21abe2428097da61ea4a693a447/admin/i18n/en/translations.json#L44 eingetragen werden. Links ist das Token (key) rechts die gemeinte Bedeutung. Das sollte für en und de von hand erfolgen damit keine dummen übersetzungfehler vom Skript erzeugt werden.


Das sind sowohl Texte die im Adminmenü, in der Objektübersicht als common.name sowie im Panel angezeigt werden


Im Admin gibts dazu eine neue Option die unbekannte Tokens jede Minute ins Log schreibt. Unbekannte Tokens sind alles was nicht in der Übersetzung steht aber durch die Übersetzungsfunktion läuft. Bitte keine Tokens eintragen die von euch als Beschreibung hinzugefügt sind und unter persönliche Optionen fällt. Das gilt natürlich auch für Werte, die dort erscheinen.

Beispiel: 
```json
{"0":"","StateObjects.isOnline":"","StateObjects.panel":"","Wohnzimmer":"","StateObjects.cmd":"","StateObjects.alarm":"","StateObjects.buttons":"","StateObjects.buttons.left":"","StateObjects.buttons.right":"","StateObjects.dimStandby":"","StateObjects.dimActive":"","StateObjects.detachRight":"","StateObjects.detachLeft":"","StateObjects.cardAlarm":"","StateObjects.status":"","StateObjects.screensaverTimeout":"","StateObjects.mainNavigationPoint":"","StateObjects.screenSaver":"","Information":"","Tasmota":"","StateObjects.firmwareversion":"","StateObjects.onlineVersion":"","net":"","Hostname":"","IPAddress":"","Gateway":"","Subnetmask":"","DNSServer1":"","DNSServer2":"","Mac":"","StateObjects.power1":"","StateObjects.power2":"","IP6Global":"","IP6Local":"","Ethernet":"","Webserver":"","HTTP_API":"","WifiConfig":"","WifiPower":"","StateObjects.uptime":"","sts":"","Time":"","Uptime":"","UptimeSec":"","Heap":"","SleepMode":"","Sleep":"","LoadAvg":"","MqttCount":"","Berry":"","HeapUsed":"","Objects":"","POWER1":"","POWER2":"","Wifi":"","AP":"","SSId":"","BSSId":"","Channel":"","Mode":"","RSSI":"","Signal":"","LinkCount":"","Downtime":"","StateObjects.nspanel":"","StateObjects.displayVersion":"","StateObjects.model":"","StateObjects.bigIconLeft":"","StateObjects.bigIconRight":"","StateObjects.currentPage":"","StateObjects.navigateToPage":"","Samstag, 9. März 2024":"","12:33":"","Number":"","all connected":"","Stopped":"","entities1":"","3.4°C":"","4.6m/s":"","Wind":"","7.0m/s":"","Böen":"","ONO°":"","Windr.":"","Do":"","Fr":"","Sa":"","So":"","Mo":"","Sonne":"","Feuchte":"","UV":"","Wasserstand":"","10%":"","12:34":"","12:35":""}
```

`12:34`ist die Uhrzeit, da dort auch ein text stehen kann, läuft das ebenso durch die übersetzung. `DNSServer1` ist der ersten DNS Eintrag im Tasmota und findet man in der Objektdatenbank. `Mo/DI...` kommt vom Accuweather.


## Einfügen des Servicemenüs
**07.03.2024**
Das Servicemenü wird mit folgender Methode in die Navigation integriert:
```typescript
            {
                name: 'pagename', 
                page: 'page',
                left: { single: '///service' }, // das ///service ist das ziel für die Navigation
                right: { single: 'einZiel', double: 'main' },
            },
```
- Es muß als linkes Ziel einmal ///service ausgewählt werden und oder als rechtes Ziel. Dann wird das Menü dort eingefügt.
- die erste Seite ist eine cardUnlock mit keiner Pin. Eine Pin dazu kann im Admin eingegeben werden


## Zugriff auf Paneldatenpunkte
**03.03.2024**
- Um Zugriff auf Datenpunkte unabhängig von der Adapterinstanze und Panel zu erhalten muß folgender Platzhalter verwendet werden. `${this.namespace}` dieser wird dann ausgelöst in z.B. `nspanel-lovelace-ui.0.panels.C0_49_EF_FA_4C_6C`

## Anlegen von Popups
**03.03.2024**

Gibts zwar schon ein paar Tage länger, aber um Fragen vor zu beugen eine kurze Erklärung wie das funktioniert.
- Popups werden ausschließlich über entity1 getriggert - alle anderen trigger werden überschrieben.
- Popups dürfen nicht in der Navigation enthalten sein.
- Zeilenumbrüche immer mit `\n` angeben, die werden automatisch um das `\r` ergänzt.
- Popups die sich überschneiden, sollten beim Schließen alle vorhergehenden Popups anzeigen und auf der Ursprungsseite landen.
- **Wichtig** eine Page ist ein Popup auch wenn das mehrfach aktiviert ist, überschreibt es sich nur selber und ein verlassen geht zur letzten anderen Seite.
- wie man ein Popup erstellt sieht man hier. Die uniqueID /// ist für internes vorgesehen, diese Popups sollen in const/notification.ts drin sein.

```typescript
const popupWelcome: PageBaseConfig = {
    card: 'popupNotify',
    dpInit: '',
    alwaysOn: 'none',
    uniqueID: '///WelcomePopup',
    config: {
        card: 'popupNotify',
        data: {
            entity1: { value: { type: 'triggered', dp: '0_userdata.0.example_state' } },
            headline: { type: 'const', constVal: 'welcomeHToken' },
            colorHeadline: { true: { color: { type: 'const', constVal: Color.Green } } },
            buttonLeft: { type: 'const', constVal: '' },
            colorButtonLeft: { true: { color: { type: 'const', constVal: Color.White } } },
            buttonRight: { type: 'const', constVal: '' },
            colorButtonRight: { true: { color: { type: 'const', constVal: Color.White } } },
            text: { type: 'const', constVal: 'welcomeTToken' }, // text: { type: 'const', constVal: 'Text Test ${pl}' },
            colorText: { true: { color: { type: 'const', constVal: Color.White } } },
            timeout: { type: 'const', constVal: 3 },
            // {placeholder: {text: '' oder dp: ''}} im Text muss dann ${dieserKeyStehtImText} stehen
            // optionalValue: { type: 'const', constVal: { dieserKeyStehtImText: { text: 'das ist ein placeholder' } } },
            //setValue1: { type: 'const', constVal: true }, // alleine ist es ein switch
            //setValue2: { type: 'const', constVal: true }, // mit setValue2 wird 1, bei yes und 2 bei no auf true gesetzt
            closingBehaviour: { type: 'const', constVal: 'both' }, // 'both' | 'yes' | 'no' | 'none'
        },
    },
    pageItems: [],
    items: undefined,
};
```

## Konfiguration - Enums
**02.03.2024**

- Enums für Page und PageItems hinzugefügt `optional`: `string` oder `string[]`
- `enum.rooms` und `enum.functions` verfügbar die Strings müssen auch so anfangen.
- sind nicht in templates verfügbar - macht auch keinen Sinn - vielleicht für `functions` dann müssten wir aber erst definieren welche Funktion was bewirkt.

```typescript
        {
            enums: 'enum.rooms.kitchen' /* oder ['enum.rooms.kitchen'],
            template: 'text.battery.bydhvs',
        },
```


## Platzhalter - dbInit
**02.03.2024**

- dbInit ist in Templates verfügbar überall optional
- Platzhalter für dbInit hinzugefügt.
- dpInit muß immer ein `string` sein, regexp wird aus diesem String gebaut.
- device hinzugefügt `string`
- #°^°# // das ist ein plazhalter der mit device aufgefüllt wird. Wenn dpInit eine regex sein soll, muß die natürlich als String angelegt werden und das device muss dann für einen regexp escaped werden.

Beispiel:
```typescript
        {
            device: '0',
            template: 'text.battery.bydhvs',
        },
```
Auschnitt aus dem Template:
```typescript
    'text.battery.bydhvs': {
        /**
         * entity1 enthält den Füllstand
         * entity2 ebenfalls
         * entity3 ist true für laden und false für entladen. default ist false entity3 wird nicht automatisch gefunden
         */
        template: 'text.battery',
        role: 'battery',
        adapter: 'bydhvs',
        type: 'text',
        dpInit: '/bydhvs\\.#°^°#\\./',

        data: {
```

Da alle regexp darunter mit dem dpInit nur auf einen State zutreffen können, ist das Item mit dem `device='0'` konfiguriert.



---