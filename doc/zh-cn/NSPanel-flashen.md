<!-- TODO: Translate from German to 中文 -->

**Benötigt wird:**
* FTDI-Adapter
* Sonoff NSPanel
* 5 Pins einer Pinleiste mit 2,54mm Pinabstand (Pitch)
* 5 Jumper/Dupont Kabel Female/Female trennbar
* Ein klein wenig Mut, denn wir übernehmen für Schäden durch diese Anleitung keine Haftung ;-)

> [!IMPORTANT]  
> **Achtung!**  
> * Dieser Vorgang kann nicht rückgängig gemacht werden!  
> * Es gibt **"keine"** bekannte Anleitung zurück zur Original-Firmware  

***


**Folge zum Flashen entweder diesem Video** https://www.youtube.com/watch?v=uqPz08ZpFW8 ...

... **oder gehe nach der nachfolgenden Beschreibung vor**:

Die Touch-Platte hat nur zwei Schrauben, mit denen die Kunststoffabdeckung befestigt ist. Beim Entfernen kommt eine gut beschriftete Platine mit der Aufschrift „E32-MSW-NX“ und „NSPanel-EU“ zum Vorschein.

Der Blick fällt sofort auf die unteren 5 Pin-Löcher, die wir alle gerne sehen: 3V3, RX, TX, GND und IO0. Einfacher Zugang zum Flashen! Wenn du dort dauerhaft eine Stiftleisten anlöten möchtest, achte darauf, die andere Seite mit Isolierband zu schützen, um einen Kurzschluss auf der Metallschirmabschirmung zu verhindern. Grundsätzlich ist ein Anlöten einer Stiftleiste nicht erforderlich.

Anschlussbelegung für den FTDI-Adapter

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/22e56bf6-b35d-4d11-9054-d1e2593954a5)

1) Stelle Deinen seriellen Adapter (FTDI) auf 3,3 V ein
2) Verbinde es mit den Pins GND, ESP_RX, ESP_TX und 3V3 auf der Platine (im Bild oben gelb markiert).
3) Stelle sicher, dass RX-TX zwischen dem NSPanel und dem FTDI gekreuzt sind.
4) Schnappe Dir ein Dupont-Kabel und verbinde es zwischen IO0 und einem der GND-Pins rechts (neben den 5V-Pins), um das NSPanel zum Booten in den Flash-Modus zu zwingen.
5) Übe etwas Druck auf die Dupont-Kabel aus, um eine gute Verbindung sicherzustellen, und schließe das FTDI an Ihren Computer an.

Du musst das NSPanel nicht komplett zerlegen, um es zu flashen. Es reicht auch vorsichtig eine Check-Karte oder eine eine Visitenkarte unter die 5 Pins der Platine zu schieben, um einen Kurzschluss mit der Metallfolie unterhalb der Platine am Gehäuse zu vermeiden.
![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/810b67e0-0d01-4210-8059-5a712d2a49ac)

**Achte darauf, dass der GPIO0 mit Ground während des gesamten Flashvorgangs verbunden wird.**
![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/8dcc0832-3663-4f26-b1a2-3b4613cec36d)

![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/729f2d33-a46e-48d8-b38f-480f994bf24a)

Nimm den Webinstaller - geht am schnellsten - https://tasmota.github.io/install/
![image](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/87420a15-9080-416a-93d2-643febad9c23)

1) Öffne den Tasmota Web Installer in Chrome oder Edge, da der Browser in der Lage sein muss, eine Verbindung zu deinem seriellen Gerät herzustellen.
2) Wählen Sie Tasmota32 Sonoff-NSPanel (englisch).
3) Drücke „Verbinden“.
4) Wähle im Popup das ​​serielle Gerät aus.
5) Flash-Tasmota.

Folge der Anleitung des Tasmota-Webinstallers - nach etwa 5 Minuten ist dein NSPanel bereit für den Live-Betrieb.