# Geräteseite für „Gerät mit Details“

Dieser Ordner enthält die Bilder zur Geräteseite, eine Kurz-Anleitung und die Prüftabellen für Tim.

- **Ausführliche Anleitung für Nutzer:** [doc/de/deviceDetails.md](../../de/deviceDetails.md) (englisch:
  [doc/en/deviceDetails.md](../../en/deviceDetails.md)).
- **Liste aller Bilder, Aufnahmeweg und Abgleich Web ↔ HMI:** [BILDER.md](BILDER.md).
- Technik (Protokoll, Maße): [doc/ideas/device-details](../../ideas/device-details/README.md).

Stand: 2026-11-24 – Geräteseite auf allen fünf Modellen, Web-Panel-Elemente für die Smartphone-Web-Panels.

## Kurz-Anleitung

Ein Item der Art **Gerät mit Details** öffnet mit einem langen Druck (Grid-Seiten) bzw. einem Tipp auf Icon oder
Bezeichnung (cardEntities) die **Detailseite** – eine Liste mit allen angehakten Werten des Geräts. Stattdessen
kannst du eine **Geräteseite** öffnen lassen: ein großes Geräte-Icon, feste Plätze (Slots) für Werte, einen
Fortschrittsbalken, Knöpfe, Schalter oder kleine Status-Icons, eine Statuszeile und unten rechts ein kleines „i“,
das die Detailseite öffnet. Das passt z. B. für Waschmaschine, Saugroboter, Rasenmäher oder Auto.

1. Im Seiten-Editor das Item öffnen, oben die Art **Gerät mit Details** und das Gerät wählen.
2. Bei **Long-Press öffnet** **Geräteseite** wählen (Vorgabe ist **Detailseite**). Umschalten verliert nichts,
   solange der Dialog offen ist.

   ![Dialog „Gerät mit Details“ mit Geräteseite](admin-overview.png)

3. **Layout** wählen – die kleinen Bilder zeigen, wo welcher Slot sitzt (Anordnung des EU-Panels).
4. **Haupt-Icon** wählen (leer = Icon des Items).
5. **Statuszeile**: ein Wert des Geräts oder ganz oben **Benutzerdefinierter Datenpunkt** für einen eigenen
   Datenpunkt, z. B. einen Text unter `0_userdata.0`.

   ![Statuszeile mit benutzerdefiniertem Datenpunkt](admin-status-custom.png)

6. **Slots** belegen: je Zeile „leer“, **Benutzerdefiniert** oder ein passender Wert des Geräts.
   **Benutzerdefiniert** bietet **Datenpunkt** (irgendein Datenpunkt), **Kanal** (Alias-Kanal, bedient wie auf
   einer Grid-Seite) und – bei Info-Zeile, Knopf und Status-Icon – **Navigation** (Platz nur zum Springen auf eine
   Zielseite). Was nicht passt oder fehlt, ist rot markiert und bleibt am Panel leer.

   ![Slots: eigener Datenpunkt, Alias-Kanal und ein unpassender Datenpunkt](admin-slot-custom.png)

7. **…** rechts in jeder belegten Zeile öffnet die Einstellungen des Elements (grün, sobald etwas gesetzt ist):
   bei Info-Zeile, großem Wert, Fortschrittsbalken, Knopf und Schalter die Pageitem-Konfiguration ohne Kanalauswahl
   (Name, Icon und Farbe für wahr/unwahr, Farbverlauf, Text-/Icongröße, **Ist eine Navigation** mit Zielseite,
   bei Knopf und Schalter **Langer Druck**); bei einem Status-Icon ein kleiner Dialog (Icon, Farbe, Farbverlauf,
   Kurzer Tipp Standard/Navigation).

   ![Einstellungen des Elements](admin-slot-dialog.png)

8. **Status-Icons** (nur Layout 1, Slots 7–10): nur ein kleines Icon in seiner Farbe. Sobald eines belegt ist,
   erscheint das 2×2-Raster; auf eu, us-l und web-l werden die beiden Info-Zeilen dann schmaler.
9. **i-Icon anzeigen** (Vorgabe an): das „i“ öffnet die Detailseite mit den angehakten Einträgen der Filterliste.
10. **Web-Panel-Elemente (web-l / web-p)** (Häkchen unter den Slots, Vorgabe aus): angehakt erscheinen darunter
    die zusätzlichen Slots – Layout 1: 11–12 (2 Knöpfe), Layout 2: 7 (Info-Zeile) und 8–9 (2 Knöpfe), Layout 3:
    9–10 (2 Info-Zeilen) und 11 (Schalter). Nur eigenständige Web-Panels der Modelle web-l (Smartphone quer) und
    web-p (Smartphone hochkant) zeigen sie. Häkchen entfernen blendet sie aus, ihre Einstellungen bleiben
    gespeichert.
11. **Übernehmen**, dann im Tab **Speichern**.

**Geräteseite schon beim ersten Tipp:** Unter **Kurzer Tipp** gibt es **Geräteseite öffnen** – nur wählbar, wenn
bei „Long-Press öffnet“ die Geräteseite gewählt ist.

![Kurzer Tipp: Geräteseite öffnen](admin-shortpress.png)

Die drei Layouts: **1 – Steuern** (2 Info-Zeilen, 4 Knöpfe, 4 Status-Icons), **2 – Fortschritt** (großer Wert,
Fortschrittsbalken, 3 Info-Kacheln, 1 Knopf), **3 – Werte** (6 Info-Kacheln, 2 Schalter).

**Wo es die Geräteseite gibt:** auf allen Panels – EU, US quer (us-l), US hochkant (us-p) und Web-Panels (auch
Smartphone quer / hochkant). Hardware-Panels brauchen eine aktuelle TFT (Version folgt); mit älterer TFT öffnet
sich wie bisher die Detailseite. Web-Klone von Hardware-Panels sehen aus wie die Hardware.

**Textlängen:** Name und Wert höchstens 31 Byte, Statuszeile 63 Byte je Abschnitt – auf allen Modellen gleich. Die
sichtbare Breite ist je Modell verschieden (Statuszeile: eu/us-l 390 px, us-p und web-p 262 px, web-l 580 px).

**Blinken beim langen Druck** zeigt nur die HMI, das Web-Panel nicht.

## Bilder: Szenario und was Tim prüfen soll

Alle Panel-Bilder sind Web-Panel-Aufnahmen mit dem jeweiligen Modell (statisch gerendert, siehe
[BILDER.md](BILDER.md)); sie zeigen dieselbe Belegung wie Tims Aufnahmen der EU-HMI.

| Bild | Szenario | Was Tim prüfen soll |
|---|---|---|
| ![](admin-overview.png) | Dialog mit Geräteseite, Layout 1, alle Slots belegt (Gerät `0_userdata.0.devicepage.robot`) | Aufbau verständlich? Vorschau passt zu den Slot-Nummern? Die Integration nimmt das Bild neu auf (neuer Hinweistext, Häkchen Web-Panel-Elemente) |
| ![](admin-shortpress.png) | Kurzer Tipp „Geräteseite öffnen“ gewählt | Auswahl nur mit „Long-Press öffnet: Geräteseite“ möglich |
| ![](admin-status-custom.png) | Statuszeile mit „Benutzerdefinierter Datenpunkt“ | Feld für die ID erscheint, nichts rot bei leerem Feld |
| ![](admin-slot-custom.png) | Slots mit Datenpunkt, Kanal und einem unpassenden Datenpunkt | rote Markierung „passt nicht zu diesem Slot“; die Integration nimmt das Bild neu auf (Wahl „Kanal“ und „Navigation“) |
| ![](admin-slot-dialog.png) | „…“ eines Knopf-Slots | die Integration nimmt das Bild neu auf: Knopf-Slots öffnen die Pageitem-Konfiguration ohne Kanalauswahl; den kleinen Dialog gibt es nur noch für Status-Icons (`admin-slot-dialog-status.png`) |
| ![](eu-cardDevice1.png) | eu, Layout 1 „Robbi“ mit vier Status-Icons | Raster an den Info-Zeilen ausgerichtet, Info-Zeilen schmal; deckt sich mit Tims Aufnahme 202151 |
| ![](eu-cardDevice1-plain.png) | eu, Layout 1 ohne Status-Icons | kein Raster, Info-Zeilen breit; Tims Aufnahme 160356 |
| ![](eu-cardDevice2.png) | eu, Layout 2 „Waschmaschine“, Balken 62 % | großer Wert, Balken, drei Kacheln, Knopf oben rechts; der Gerätename unter dem Icon ist an der Feldgrenze (96 px) abgeschnitten – so gewollt? Tims Aufnahme 160338 |
| ![](eu-cardDevice3.png) | eu, Layout 3 „ID.3“ | sechs Kacheln zeilenweise, zwei Schalter; Tims Aufnahme 160313 |
| ![](eu-detail-page.png) | eu, Detailseite „Robbi“ | vier Zeilen mit Icon, Name, Wert; Tims Aufnahme 202318 |
| ![](us-l-cardDevice1.png) ![](us-l-cardDevice2.png) ![](us-l-cardDevice3.png) | us-l, Layouts 1–3 | wie eu, Inhalt 15 px weiter rechts. Die Kopfzeile zeichnet das Web-Panel auf us-l wie eu (auf der echten us-l-HMI sitzt auch sie 15 px weiter rechts) |
| ![](us-p-cardDevice1.png) ![](us-p-cardDevice2.png) ![](us-p-cardDevice3.png) | us-p, Layouts 1–3; Statuszeile zeigt den ersten Abschnitt des Texts | Anordnung wie in den HMI-Vorschauen `hmi-us-p-cardDevice*.png`; passt die Aufteilung für Tim? |
| ![](web-l-cardDevice1-plain.png) ![](web-l-cardDevice2-plain.png) ![](web-l-cardDevice3-plain.png) | web-l ohne Web-Panel-Elemente | Elemente über die Breite verteilt, keine Lücke |
| ![](web-l-cardDevice1.png) ![](web-l-cardDevice2.png) ![](web-l-cardDevice3.png) | web-l mit Web-Panel-Elementen (6 Knöpfe; 4 Infos + 3 Knöpfe; 8 Infos + 3 Schalter) | Reihenfolge und Lage der zusätzlichen Elemente |
| ![](web-p-cardDevice1-plain.png) ![](web-p-cardDevice2-plain.png) ![](web-p-cardDevice3-plain.png) | web-p ohne Web-Panel-Elemente | Zeilen teilen sich die Höhe, kein Loch über der Statuszeile |
| ![](web-p-cardDevice1.png) ![](web-p-cardDevice2.png) ![](web-p-cardDevice3.png) | web-p mit Web-Panel-Elementen | dritte Knopfreihe, vierte Info-Zeile und drei Knöpfe in einer Reihe, vierte Kachelreihe und dritter Schalter |
| ![](hmi-cardDevice1.png) ![](hmi-cardDevice1-plain.png) ![](hmi-cardDevice2.png) ![](hmi-cardDevice3.png) | HMI-Vorschauen eu des Werkzeugs `card_device.py` (Beispieldaten des Werkzeugs, Einheiten dort mit Leerzeichen) | nur für die Entwickler-Dokumente; `hmi-us-l-*.png` und `hmi-us-p-*.png` ebenso |

## Was Tim prüfen soll

Spalte **Im Browser geprüft (2026-11-23)**: ✓ = im Admin des Dev-Servers per Puppeteer geprüft, „✓ nur Admin“ = der Admin-Teil der Zeile geprüft, der Teil am Panel nicht; leer = nicht geprüft. Die Zeilen 30, 32, 38–43 sind an den „…“-Dialog vom 2026-11-24 angepasst (Pageitem-Konfiguration statt des kleinen Dialogs) und deshalb wieder ungeprüft. Die Zeilen ab 52 betreffen die Web-Panel-Elemente und die fünf Modelle (seit 2026-11-24).

| # | Prüfung | Erwartung | Im Browser geprüft (2026-11-23) |
|---|---|---|---|
| 1 | Item „Gerät mit Details“ öffnen, das noch keine Geräteseite hat | „Long-Press öffnet“ steht auf **Detailseite**, kein Geräteseiten-Bereich sichtbar | |
| 2 | Auf **Geräteseite** umschalten | Layout 1 gewählt, Info-Slots 1 und 2 mit den ersten angehakten Einträgen vorbelegt, Knöpfe leer, Statuszeile leer, „i-Icon anzeigen“ an | |
| 3 | Etwas ändern, auf **Detailseite** und zurück auf **Geräteseite** schalten | alle Änderungen sind wieder da | ✓ |
| 4 | Layout 1 mit belegten Status-Slots 7–10, dann Layout 2 und zurück auf Layout 1 wählen (Gegenprobe: Layout 3 → Layout 1) | Slots bleiben nach Position; Layout 2 hat nur 6 Slots – die Status-Slots 7–10 gehen dabei verloren und sind zurück auf Layout 1 leer. Von Layout 3 (8 Slots) nach Layout 1 (10 Slots) geht nichts verloren, die Slots 9/10 sind leer | |
| 5 | Auswahl eines Knopf-/Schalter-/Fortschritts-Slots aufklappen | nur passende States (Knopf: Taster und schaltbare boolean, Schalter: schaltbare boolean, Balken: Zahlen), „leer“ oben | ✓ |
| 6 | Statuszeile aufklappen | alle States des Geräts, Name + ID wie in der Filterliste | ✓ |
| 6a | Statuszeile: **Benutzerdefinierter Datenpunkt** wählen (zweiter Eintrag nach „leer“) | darunter erscheint das Feld für die ID mit Knopf „...“; mit leerem Feld bleibt die Auswahl stehen (springt nicht auf „leer“), nichts ist rot markiert. ID außerhalb des Geräts eintragen (z. B. `0_userdata.0.status`), übernehmen, neu öffnen: Auswahl und ID sind da; am Panel zeigt die Statuszeile den Wert und folgt Änderungen | ✓ nur Admin |
| 7 | Haupt-Icon wählen und wieder leeren | Icon wird gespeichert bzw. entfällt | |
| 8 | Übernehmen, Dialog neu öffnen | Geräteseite mit allen Einstellungen da; Rohdaten zeigen `device.devicePage` | ✓ |
| 9 | Auf **Detailseite** stellen und übernehmen | `device.devicePage` ist aus den Rohdaten verschwunden | |
| 10 | Einen gespeicherten Slot-State im Objektbaum löschen, Dialog öffnen | Slot zeigt den State rot „nicht im Gerät gefunden“, nach Übernehmen weiter gespeichert | |
| 11 | Adapter stoppen, Dialog öffnen, Übernehmen | gespeicherte Geräteseite bleibt unverändert | |
| 12 | Long-Press am EU-, us-l- und us-p-Panel (neue TFT) und in jedem Web-Panel | Geräteseite erscheint mit den gewählten Slots | |
| 13 | Dialog in hellem und dunklem Thema, schmales Fenster | Vorschaubilder und Slot-Zeilen lesbar, nichts abgeschnitten | |
| 14 | Item mit einer Geräteseite Layout 1 von vor den Status-Icons (6 Slots) öffnen | Slots 1–6 unverändert, Slots 7–10 „Status-Icon“ leer; Übernehmen speichert 10 Slots | |
| 15 | Layout 1: unter den Slots | Hinweis, dass die Info-Zeilen schmaler werden, sobald ein Status-Icon belegt ist (gilt für eu, us-l und web-l; auf us-p und web-p bleiben sie gleich breit) | ✓ |
| 16 | Status-Slot 8 einen Wert geben | der „…“-Knopf der Zeile wird aktiv; die Vorschau von Layout 1 zeigt jetzt das 2×2-Raster und schmalere Info-Zeilen | |
| 17 | Über „…“ ein eigenes Icon wählen, dann einen anderen Wert für denselben Slot | das Icon bleibt, „…“ ist grün; Wert auf „leer“ → Einstellungen sind weg, „…“ ausgegraut | ✓ |
| 18 | Alle Status-Slots wieder leeren | Vorschau ohne Raster, Info-Zeilen wieder breit | |
| 19 | Layout 1 mit Status-Icons → Layout 3 → Layout 1 | Slots 7/8 bekommen bei Layout 3 die Werte von Status 7/8 nur, wenn sie zum Schalter passen (sonst rot); das eigene Icon geht beim Wechsel auf Layout 3 verloren | |
| 20 | Am Panel: Layout 1 mit einem An/Aus-Wert (z. B. Tür) als Status-Icon | Icon grün/rot (aktiviert/deaktiviert) wechselt mit dem Wert, kein Name, kein Wert, Tipp ohne Wirkung | |
| 21 | Am Panel: Status-Icons ein- und ausblenden (Wert im Admin setzen/leeren) | Raster erscheint/verschwindet, Info-Zeilen springen schmal/breit | |
| 22 | Slot-Auswahl aufklappen (jede Art) | Reihenfolge: „leer“, **Benutzerdefiniert**, dann die Werte des Geräts | ✓ |
| 23 | Info-Slot: Benutzerdefiniert → Datenpunkt, ID außerhalb des Geräts eintragen, übernehmen, neu öffnen | Auswahl und ID sind da, nichts rot; am Panel Name des Datenpunkts und Wert mit Einheit, folgt Änderungen. Leeres Feld: Auswahl bleibt stehen, Slot am Panel leer | ✓ nur Admin |
| 24 | Fortschritts-Slot: eigenen Datenpunkt wählen, der keine Zahl ist; danach eine ID, die es nicht gibt | rot „passt nicht zu diesem Slot“ bzw. „Datenpunkt nicht gefunden“; am Panel bleibt der Slot leer (Warnung im Log) | ✓ nur Admin |
| 25 | Knopf-Slot: Benutzerdefiniert → Kanal, mit „...“ ein Licht aussuchen (State unter dem Kanal anklicken) | die ID wird auf den Kanal gekürzt; angeboten werden nur Kanäle, die zur Slot-Art passen | ✓ |
| 26 | Schalter-Slot: Kanal-ID eines Rollladens eintippen | rot „passt nicht zu diesem Slot“ | ✓ |
| 27 | Am Panel: Steckdose (socket) und einfaches Licht (light) in Info- und Knopf-Slot | Tipp schaltet, Icon/Farbe wechseln, **kein** popupLight beim Halten; Info-Zeile zeigt An/Aus | |
| 28 | Am Panel: dimmbares Licht im Knopf-Slot, Rollladen und Auswahl (select) im Info-Slot, Regler (slider) im Fortschritts-Slot | Licht: Tipp schaltet, Halten öffnet popupLight; Rollladen/Auswahl öffnen ihr Popup sofort, Wertfeld des Rollladens leer; Balken folgt dem Regler | |
| 29 | Am Panel: Steckdose im Schalter-Slot (Layout 3), Temperatur-Kanal im Info-Slot und als großer Wert | Schalter schaltet und zeigt den Zustand; Temperatur mit Icon (nicht Zahl statt Icon) und Wert mit Einheit | |
| 30 | „…“ eines Knopf-Slots mit An/Aus-Wert: es öffnet die Pageitem-Konfiguration ohne Kanalauswahl (Titel mit Nummer und Art des Slots); Icon „pause“ bei wahr, „play“ bei unwahr, zwei Farben, übernehmen | „…“ grün; am Panel wechseln Icon und Farbe mit dem Wert, der Tipp schaltet um | |
| 31 | „…“ eines Info-Slots mit Zahl: Icon bei wahr und Farbe setzen; „Farbverlauf …“ mit Min/Max | Icon/Farbe gelten immer (kein „unwahr“); mit Farbverlauf ändert sich die Farbe mit dem Wert; beim Fortschritts-Slot die Balkenfarbe | |
| 32 | „…“ eines Knopf- und eines Schalter-Slots | Abschnitt **Langer Druck** mit Datenpunkt-Auswahl (keine Zielseite); bei Info-/Wert-/Fortschritts-Slots fehlt er. Am Panel (HMI ab device5): langer Druck setzt den Datenpunkt (Knopf) bzw. schaltet ihn um (Schalter), kein Tipp dabei | |
| 33 | „…“ eines Kanal-Slots: eigenes Icon und Farbe | überschreiben die Vorgaben der Rolle am Panel | |
| 34 | Altes Item mit Status-Icon (Feld `icon`) öffnen, „…“ des Slots | Dialog zeigt das Icon bei wahr und unwahr, „…“ grün; ohne Änderung bleibt alles wie vorher | ✓ |
| 35 | Kurzer Tipp: **Geräteseite öffnen** bei „Long-Press öffnet: Detailseite“ | ausgegraut; mit Geräteseite wählbar. Wählen, dann auf Detailseite schalten → Kurzer Tipp springt auf „Keine“ | ✓ |
| 36 | Am Panel: Item mit „Geräteseite öffnen“ kurz antippen (Grid und cardEntities) | Geräteseite erscheint; langer Druck ebenso; Zurück führt zur Seite des Items. Auf der Geräteseite tut ein Tipp auf das große Icon nichts. Alte TFT: Detailseite | |
| 37 | Am Panel: langer Druck auf einen Slot ohne Long-Press-Einstellung, auf das große Icon und auf „i“ | nichts passiert (kein Schalten, keine Detailseite) | |
| 38 | „…“ eines Info-, Wert-, Knopf- oder Schalter-Slots mit einem Wert des Geräts; danach „…“ eines Status-Slots | Info/Wert/Knopf/Schalter: Häkchen **Ist eine Navigation**, gesetzt erscheint die **Zielseite** (dieselbe Liste wie beim Standard-Item, mit Screensaver). Status-Slot: kleiner Dialog mit Abschnitt **Kurzer Tipp** („Standard“ / „Navigation“) | |
| 39 | „Ist eine Navigation“ setzen (Status-Slot: „Navigation“ wählen), Zielseite aussuchen, übernehmen, Item speichern, neu öffnen | „…“ grün; Rohdaten zeigen am Slot `isNavigation: true` und `targetPage`; Häkchen wieder entfernen (bzw. „Standard“) → beide Felder weg | |
| 40 | Zielseite eintippen, die es nicht gibt | Feld rot „Zielseite nicht gefunden“, nach Übernehmen steht dasselbe rot unter der Slot-Zeile; speichern geht trotzdem | |
| 41 | Slot-Auswahl **Benutzerdefiniert** bei Info-Zeile, Knopf, Status-Icon | dritte Wahl **Navigation** neben Datenpunkt und Kanal; bei großem Wert, Fortschrittsbalken und Schalter fehlt sie | |
| 42 | **Navigation** wählen: Zielseite in der Zeile, über „…“ Name (Beschriftung), Icon und Farbe | „…“ ist ohne ID aktiv und zeigt Name (Hilfstext „Leer = Name der Zielseite …“) und nur eine Spalte Icon/Farbe, keinen Farbverlauf, kein „Ist eine Navigation“, keinen Langen Druck; neu öffnen: alles da | |
| 43 | „…“ eines Kanal-Slots mit Steckdose/Licht/Sensor und eines mit Rollladen/Auswahl/Timer | Steckdose/Licht/Sensor: „Ist eine Navigation“ vorhanden; Rollladen/Tor/Schloss/Auswahl/Timer: fehlt | |
| 44 | Am Panel und im Web-Panel: Navigations-Platz im Knopf-Slot, in der Info-Zeile und als Status-Icon antippen | Zielseite erscheint; Knopf/Info zeigen Icon und Beschriftung (leer = Seitenname), kein Wert; Status-Icon nur das Icon | |
| 45 | Am Panel: Slot mit Wert und „Navigation“ (Info-Zeile mit Zahl, Knopf mit An/Aus-Wert) antippen | Zielseite erscheint, der Wert wird **nicht** geschaltet/gedrückt; Icon, Farbe und Wert des Slots wie vorher | |
| 46 | Am Panel: Schalter-Slot mit „Navigation“ | Tipp auf Icon/Name öffnet die Zielseite, der Schalter rechts schaltet weiter | |
| 47 | Am Panel: Info-Zeile mit einer Auswahl (schreibbar, mit Werteliste) und „Navigation“ | Zeile zeigt den Text des Werts, der Tipp öffnet die Zielseite statt des Auswahl-Popups | |
| 48 | Am Panel: dimmbares Licht (Kanal) mit „Navigation“ | kurzer Tipp öffnet die Zielseite, Halten öffnet weiter popupLight | |
| 49 | Auf der Zielseite die Pfeile benutzen | sie führen, wie für die Zielseite eingerichtet (nicht automatisch zur Geräteseite); über das Item kommt man wieder auf die Geräteseite | |
| 50 | Zielseite wählen, die dem Panel nicht zugeordnet ist (oder Seite löschen), am Panel antippen | nichts passiert; im Log **eine** Warnung „target page … is not assigned to panel …“, auch bei mehrfachem Tippen | |
| 51 | Kanal-Slot mit einer Kanal-ID, die es nicht gibt, Adapter neu starten | im Log eine Warnung `Page '<Seite>', page item <n>: Device page slot … not found!` – einmal, auch wenn die Seite mehreren Panels zugeordnet ist | |
| 52 | Abschnitt „Slots“: Häkchen **Web-Panel-Elemente (web-l / web-p)** | Vorgabe aus, der Tooltip erklärt es; angehakt erscheinen darunter die zusätzlichen Slots des Layouts (Layout 1: 11–12 Knopf; Layout 2: 7 Info-Zeile, 8–9 Knopf; Layout 3: 9–10 Info-Zeile, 11 Schalter), alle leer | |
| 53 | Zusätzlichen Slot belegen (State, Benutzerdefiniert, „…“), übernehmen, neu öffnen | verhält sich wie ein normaler Slot derselben Art; Rohdaten zeigen `webExtras: true` und die Einträge hinten in `slots` | |
| 54 | Häkchen entfernen, übernehmen, neu öffnen; wieder anhaken | Slots weg, in den Rohdaten fehlt `webExtras`, die Einträge in `slots` bleiben; nach dem Anhaken sind sie wieder da | |
| 55 | Layout wechseln mit belegten zusätzlichen Slots (1 → 2 → 3 → 1), einmal mit und einmal ohne Häkchen | sie bleiben zusätzliche Slots in ihrer Reihenfolge (der erste bleibt der erste); wechselt dabei die Art (Layout 1 Knopf, Layout 2/3 Info-Zeile), steht ein unpassender Wert rot „passt nicht zu diesem Slot“ da; beim Wechsel auf Layout 1 fällt der dritte weg – auch ohne Häkchen; aus einem Status-Icon wird kein zusätzlicher Slot und umgekehrt | |
| 56 | Web-Panel web-l und web-p: Häkchen an / aus | an: die zusätzlichen Elemente erscheinen (wie `web-l-cardDevice*.png`, `web-p-cardDevice*.png`), Tipp/Long-Press/Popup wie bei den anderen; aus: Seite ohne sie und ohne Lücke (wie `…-plain.png`) | |
| 57 | EU-/US-Panel und Web-Klon eines Hardware-Panels mit angehakten Web-Panel-Elementen | Seite unverändert, nichts Zusätzliches, Statuszeile wie vorher | |
| 58 | us-l-Panel bzw. Web-Panel mit Modell US-Querformat: alle drei Layouts | Anordnung wie EU, Inhalt 15 px weiter rechts (wie `us-l-cardDevice*.png`) | |
| 59 | us-p-Panel bzw. Web-Panel mit Modell US-Hochformat: alle drei Layouts | hochkant neu angeordnet (wie `us-p-cardDevice*.png`): Layout 1 Haupt-Icon oben links, 2×2-Status-Icons daneben, Info-Zeilen volle Breite, Knöpfe 2×2; Layout 2 Infos als Zeilen, Knopf über die volle Breite; Layout 3 Haupt-Icon mittig, Schalter als Zeilen. Statuszeile 262 px: ein langer Statustext wechselt früher als am EU-Panel | |
| 60 | Name und Wert mit mehr als 31 Byte in einem Slot, auf allen fünf Modellen ansehen | überall bei 31 Byte abgeschnitten; davor endet der Text an der Feldgrenze des Modells (sichtbare Breite je Modell verschieden), ohne eigene „…“ | |
| 61 | Im Web-Panel ein Element der Geräteseite und eine Grid-Kachel halten | kein Blinken (das zeigt nur die HMI); beim Loslassen wird der lange Druck trotzdem ausgelöst | |
| 62 | Abgleich Web ↔ HMI gegen Tims Aufnahmen | Ergebnis in [BILDER.md](BILDER.md#abgleich-web--hmi): Rahmen, Balken und Schalter deckungsgleich, Icons und Texte auf 1–3 px gleich; kein Fehler der Geräteseite im Web-Panel | ✓ (2026-11-24, statisch gerendert) |
