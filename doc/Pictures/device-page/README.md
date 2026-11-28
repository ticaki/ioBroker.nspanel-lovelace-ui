# Geräteseite für „Gerät mit Details“

Dieser Ordner enthält die Bilder zur Geräteseite, eine Kurz-Anleitung und die Prüftabellen für Tim.

- **Ausführliche Anleitung für Nutzer:** [doc/de/deviceDetails.md](../../de/deviceDetails.md) (englisch:
  [doc/en/deviceDetails.md](../../en/deviceDetails.md)).
- **Liste aller Bilder, Aufnahmeweg und Abgleich Web ↔ HMI:** [BILDER.md](BILDER.md).
- **Status-Icons und ihre Stufen im Admin** (Bilder und Prüftabelle): [../device-page-stages/README.md](../device-page-stages/README.md).
- Technik (Protokoll, Maße): [doc/ideas/device-details](../../ideas/device-details/README.md).

Stand: 2026-11-28 – Geräteseite auf allen fünf Modellen, Web-Panel-Elemente für die Smartphone-Web-Panels, Status-Icons
in Stufen (Layout 1 bis 16, Layout 3 bis 8 Icons).

## Kurz-Anleitung

Ein Item der Art **Gerät mit Details** öffnet mit einem langen Druck (Grid-Seiten) bzw. einem Tipp auf Icon oder
Bezeichnung (cardEntities) die **Detailseite** – eine Liste mit allen angehakten Werten des Geräts. Stattdessen
kannst du eine **Geräteseite** öffnen lassen: ein großes Geräte-Icon, feste Plätze (Slots) für Werte, einen
Fortschrittsbalken, Knöpfe, Schalter oder kleine Status-Icons, eine Statuszeile und unten rechts ein kleines „i“,
das die Detailseite öffnet. Das passt z. B. für Waschmaschine, Saugroboter, Rasenmäher oder Auto.

1. Im Seiten-Editor das Item öffnen, oben die Art **Gerät mit Details** und das Gerät wählen.
2. Bei **Long-Press öffnet** **Geräteseite** wählen (Vorgabe ist **Detailseite**). Umschalten verliert nichts,
   solange der Dialog offen ist.

   ![Bereich der Geräteseite im Dialog, Layout 3](../device-page-stages/layout3-stage0.png)

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
   Kurzer Tipp Standard/Navigation, bei einem Alias-Kanal Steckdose oder Taster auch Langer Druck).

   ![Einstellungen des Elements](admin-slot-dialog.png)

8. **Status-Icons** (nur Layout 1 und 3): unter der Statuszeile die Stufe wählen – Layout 1 **Keine Status-Icons**,
   **1–3 Spalten (bis 6 Icons)**, **4–5 Spalten (bis 10 Icons), Info-Zeilen ohne Namen**, **6–8 Spalten (bis 16
   Icons), ohne Info-Zeilen**; Layout 3 **Keine Status-Icons**, **1–4 Icons, statt Kachel 1**, **5–8 Icons, statt
   Kachel 1 und 2**. Darunter die **Plätze der Status-Icons** belegen (so viele, wie die Stufe fasst). Was die Stufe
   verdeckt (Plätze darüber, Info-Zeilen bzw. Kacheln), blendet der Dialog aus und lässt es gespeichert. Am Panel
   rücken die belegten Plätze lückenlos auf, es erscheinen nur belegte Spalten. Ein Status-Icon zeigt nur ein Icon in
   seiner Farbe. Einzelheiten und Bilder: [../device-page-stages/README.md](../device-page-stages/README.md).
9. **i-Icon anzeigen** (Vorgabe an): das „i“ öffnet die Detailseite mit den angehakten Einträgen der Filterliste.
10. **Web-Panel-Elemente (web-l / web-p)** (Häkchen unter den Slots, Vorgabe aus): angehakt erscheinen darunter
    die zusätzlichen Slots – Layout 1: 7–8 (2 Knöpfe), Layout 2: 7 (Info-Zeile) und 8–9 (2 Knöpfe), Layout 3:
    9–10 (2 Info-Zeilen) und 11 (Schalter). Nur eigenständige Web-Panels der Modelle web-l (Smartphone quer) und
    web-p (Smartphone hochkant) zeigen sie. Häkchen entfernen blendet sie aus, ihre Einstellungen bleiben
    gespeichert.
11. **Übernehmen**, dann im Tab **Speichern**.

**Geräteseite schon beim ersten Tipp:** Unter **Kurzer Tipp** gibt es **Geräteseite öffnen** – nur wählbar, wenn
bei „Long-Press öffnet“ die Geräteseite gewählt ist.

![Kurzer Tipp: Geräteseite öffnen](admin-shortpress.png)

Die drei Layouts: **1 – Steuern** (2 Info-Zeilen, 4 Knöpfe, bis zu 16 Status-Icons), **2 – Fortschritt** (großer
Wert, Fortschrittsbalken, 3 Info-Kacheln, 1 Knopf), **3 – Werte** (6 Info-Kacheln, 2 Schalter, bis zu 8 Status-Icons
statt der ersten Kacheln).

**Wo es die Geräteseite gibt:** auf allen Panels – EU, US quer (us-l), US hochkant (us-p) und Web-Panels (auch
Smartphone quer / hochkant). Hardware-Panels brauchen eine aktuelle TFT (Version folgt); mit älterer TFT öffnet
sich wie bisher die Detailseite. Web-Klone von Hardware-Panels sehen aus wie die Hardware.

**Textlängen:** Name und Wert höchstens 31 Byte, Statuszeile 63 Byte je Abschnitt – auf allen Modellen gleich. Die
sichtbare Breite ist je Modell verschieden (Statuszeile: eu/us-l 390 px, us-p und web-p 262 px, web-l 580 px).

**Blinken beim langen Druck** zeigt nur die HMI, das Web-Panel nicht.

## Bilder: Szenario und was Tim prüfen soll

Alle Panel-Bilder sind Web-Panel-Aufnahmen mit dem jeweiligen Modell (statisch gerendert, siehe
[BILDER.md](BILDER.md)); sie zeigen dieselbe Belegung wie Tims Aufnahmen der EU-HMI. Ausnahme: `hmi/` enthält Tims
Aufnahmen der echten HMI `device14` (EU und US-Hochformat) im Nextion-Simulator (2026-11-28), je Icon-Anzahl ein Bild.

| Bild | Szenario | Was Tim prüfen soll |
|---|---|---|
| ![](../device-page-stages/layout3-stage0.png) | Bereich der Geräteseite, Layout 3 „ID.3“, keine Status-Icons | Aufbau verständlich? Vorschau passt zu den Slot-Nummern? |
| ![](admin-shortpress.png) | Kurzer Tipp „Geräteseite öffnen“ gewählt | Auswahl nur mit „Long-Press öffnet: Geräteseite“ möglich |
| ![](admin-status-custom.png) | Statuszeile mit „Benutzerdefinierter Datenpunkt“ | Feld für die ID erscheint, nichts rot bei leerem Feld |
| ![](admin-slot-custom.png) | Slots mit Datenpunkt, Kanal und einem unpassenden Datenpunkt | rote Markierung „passt nicht zu diesem Slot“; die Integration nimmt das Bild neu auf (Wahl „Kanal“ und „Navigation“) |
| ![](admin-slot-dialog.png) | „…“ eines Knopf-Slots | die Integration nimmt das Bild neu auf: Knopf-Slots öffnen die Pageitem-Konfiguration ohne Kanalauswahl; den kleinen Dialog gibt es nur noch für Status-Icons (`admin-slot-dialog-status.png`) |
| ![](eu-cardDevice1.png) | eu, Layout 1 „Robbi“, Stufe 1–3 Spalten, vier Status-Icons in zwei Spalten (neu aufgenommen 2026-11-28, für `device14` erneut: Satz B 6 px weiter rechts) | Raster an den Info-Zeilen ausgerichtet, Info-Zeilen mit kurzem Namen („Batte“, „Fläch“), Abstand zwischen Raster und Info-Icon |
| ![](eu-cardDevice1-plain.png) | eu, Layout 1 ohne Status-Icons | kein Raster, Info-Zeilen breit; Tims Aufnahme 160356 |
| ![](eu-cardDevice1-stage0.png) ![](eu-cardDevice1-stage1.png) ![](eu-cardDevice1-stage2.png) ![](eu-cardDevice1-stage3.png) | eu, Layout 1 in den Stufen keine / 1–3 / 4–5 / 6–8 Spalten mit 0 / 5 / 9 / 14 Icons | Info-Zeilen breit / kurzer Name / ohne Namen / keine; nur belegte Spalten, halbe letzte Spalte mit leerem Kästchen |
| ![](eu-cardDevice3-stage0.png) ![](eu-cardDevice3-stage1.png) ![](eu-cardDevice3-stage2.png) | eu, Layout 3 in den Stufen keine / 1–4 / 5–8 mit 0 / 4 / 7 Icons | Kachel 1 bzw. 1 und 2 weg, Raster in der ersten Kachelreihe |
| ![](hmi/cardDevice1-icons-00.png) ![](hmi/cardDevice1-icons-02.png) ![](hmi/cardDevice1-icons-04.png) ![](hmi/cardDevice1-icons-06.png) ![](hmi/cardDevice1-icons-08.png) ![](hmi/cardDevice1-icons-10.png) ![](hmi/cardDevice1-icons-12.png) ![](hmi/cardDevice1-icons-14.png) ![](hmi/cardDevice1-icons-16.png) | echte EU-HMI `device14` (Simulator), Layout 1 „Robbi“ mit 0, 2 … 16 Icons | ✓ bestätigt (siehe Prüfung 70): 0 Icons Satz A, 2–6 Satz B (1–3 Spalten), 8–10 Satz C (4–5 Spalten), 12–16 keine Info-Zeilen (6–8 Spalten); in der Nutzer-Doku statt der eu-Web-Bilder |
| ![](hmi/cardDevice3-icons-0.png) ![](hmi/cardDevice3-icons-1.png) ![](hmi/cardDevice3-icons-2.png) ![](hmi/cardDevice3-icons-3.png) ![](hmi/cardDevice3-icons-4.png) ![](hmi/cardDevice3-icons-5.png) ![](hmi/cardDevice3-icons-6.png) ![](hmi/cardDevice3-icons-7.png) ![](hmi/cardDevice3-icons-8.png) | echte EU-HMI `device14` (Simulator), Layout 3 „ID.3“ mit 0–8 Icons | ✓ bestätigt (siehe Prüfung 70): 1–4 Icons statt Kachel 1, 5–8 statt Kachel 1 und 2; in der Nutzer-Doku statt der eu-Web-Bilder |
| ![](hmi/us-p-cardDevice1-icons-00.png) ![](hmi/us-p-cardDevice1-icons-02.png) ![](hmi/us-p-cardDevice1-icons-04.png) ![](hmi/us-p-cardDevice1-icons-06.png) ![](hmi/us-p-cardDevice1-icons-08.png) ![](hmi/us-p-cardDevice1-icons-10.png) ![](hmi/us-p-cardDevice1-icons-12.png) ![](hmi/us-p-cardDevice1-icons-14.png) ![](hmi/us-p-cardDevice1-icons-16.png) | echte us-p-HMI `device14` (Simulator), Layout 1 „Robbi“ mit 0, 2 … 16 Icons | ✓ bestätigt (siehe Prüfung 70): Raster unter dem Haupt-Icon; 0 Icons Satz A unter dem Haupt-Icon, 2–10 Info-Zeilen rechts neben dem Haupt-Icon nur mit Icon und Wert, 12–16 keine Info-Zeilen; in der Nutzer-Doku (eingeklappt) statt der us-p-Web-Bilder |
| ![](hmi/us-p-cardDevice3-icons-0.png) ![](hmi/us-p-cardDevice3-icons-1.png) ![](hmi/us-p-cardDevice3-icons-2.png) ![](hmi/us-p-cardDevice3-icons-3.png) ![](hmi/us-p-cardDevice3-icons-4.png) ![](hmi/us-p-cardDevice3-icons-5.png) ![](hmi/us-p-cardDevice3-icons-6.png) ![](hmi/us-p-cardDevice3-icons-7.png) ![](hmi/us-p-cardDevice3-icons-8.png) | echte us-p-HMI `device14` (Simulator), Layout 3 „ID.3“ mit 0–8 Icons | ✓ bestätigt (siehe Prüfung 70): 1–4 Icons statt Kachel 1, 5–8 statt Kachel 1 und 2 (erste Kachelreihe); in der Nutzer-Doku (eingeklappt) statt der us-p-Web-Bilder |
| ![](us-p-cardDevice1-stage0.png) ![](us-p-cardDevice1-stage1.png) ![](us-p-cardDevice1-stage2.png) ![](us-p-cardDevice1-stage3.png) ![](us-p-cardDevice3-stage0.png) ![](us-p-cardDevice3-stage1.png) ![](us-p-cardDevice3-stage2.png) | us-p, dieselben Stufen | Layout 1: Raster unter dem Haupt-Icon, Info-Zeilen in 1–3 und 4–5 rechts neben dem Haupt-Icon (nur Icon und Wert). Gegen die echte us-p-HMI abgeglichen ([BILDER.md](BILDER.md#device14-stufen-gegen-die-echte-hmi-2026-11-28)); nicht mehr in der Nutzer-Doku |
| ![](web-l-cardDevice1-stage0.png) ![](web-l-cardDevice1-stage1.png) ![](web-l-cardDevice1-stage2.png) ![](web-l-cardDevice1-stage3.png) ![](web-l-cardDevice3-stage0.png) ![](web-l-cardDevice3-stage1.png) ![](web-l-cardDevice3-stage2.png) | web-l, dieselben Stufen | Raster wie eu, Info-Zeilen bis zum rechten Rand |
| ![](eu-cardDevice2.png) | eu, Layout 2 „Waschmaschine“, Balken 62 % | großer Wert, Balken, drei Kacheln, Knopf oben rechts; der Gerätename unter dem Icon ist an der Feldgrenze (96 px) abgeschnitten – so gewollt? Tims Aufnahme 160338 |
| ![](eu-cardDevice3.png) | eu, Layout 3 „ID.3“ | sechs Kacheln zeilenweise, zwei Schalter; Tims Aufnahme 160313 |
| ![](eu-detail-page.png) | eu, Detailseite „Robbi“ | vier Zeilen mit Icon, Name, Wert; Tims Aufnahme 202318 |
| ![](us-l-cardDevice1.png) ![](us-l-cardDevice2.png) ![](us-l-cardDevice3.png) | us-l, Layouts 1–3 | wie eu, Inhalt 15 px weiter rechts. Die Kopfzeile zeichnet das Web-Panel auf us-l wie eu (auf der echten us-l-HMI sitzt auch sie 15 px weiter rechts) |
| ![](us-p-cardDevice1.png) ![](us-p-cardDevice2.png) ![](us-p-cardDevice3.png) | us-p, Layouts 1–3; Statuszeile zeigt den ersten Abschnitt des Texts | Anordnung wie in den HMI-Vorschauen `next/hmi-us-p-cardDevice*.png`; passt die Aufteilung für Tim? |
| ![](web-l-cardDevice1-plain.png) ![](web-l-cardDevice2-plain.png) ![](web-l-cardDevice3-plain.png) | web-l ohne Web-Panel-Elemente | Elemente über die Breite verteilt, keine Lücke |
| ![](web-l-cardDevice1.png) ![](web-l-cardDevice2.png) ![](web-l-cardDevice3.png) | web-l mit Web-Panel-Elementen (6 Knöpfe; 4 Infos + 3 Knöpfe; 8 Infos + 3 Schalter) | Reihenfolge und Lage der zusätzlichen Elemente |
| ![](web-p-cardDevice1-plain.png) ![](web-p-cardDevice2-plain.png) ![](web-p-cardDevice3-plain.png) | web-p ohne Web-Panel-Elemente | Zeilen teilen sich die Höhe, kein Loch über der Statuszeile |
| ![](web-p-cardDevice1.png) ![](web-p-cardDevice2.png) ![](web-p-cardDevice3.png) | web-p mit Web-Panel-Elementen | dritte Knopfreihe, vierte Info-Zeile und drei Knöpfe in einer Reihe, vierte Kachelreihe und dritter Schalter |
| ![](hmi-cardDevice1.png) ![](hmi-cardDevice1-plain.png) ![](hmi-cardDevice2.png) ![](hmi-cardDevice3.png) | HMI-Vorschauen eu des Werkzeugs `card_device.py` für `device12` (2×2-Raster; Beispieldaten des Werkzeugs, Einheiten dort mit Leerzeichen) | nur für die Entwickler-Dokumente; `hmi-us-l-*.png` und `hmi-us-p-*.png` ebenso. Die Vorschauen von `device14` je Stufe liegen in `next/` |

## Was Tim prüfen soll

Spalte **Im Browser geprüft (2026-11-23)**: ✓ = im Admin des Dev-Servers per Puppeteer geprüft, „✓ nur Admin“ = der Admin-Teil der Zeile geprüft, der Teil am Panel nicht; leer = nicht geprüft. Die Zeilen 30, 32, 38–43 sind an den „…“-Dialog vom 2026-11-24 angepasst (Pageitem-Konfiguration statt des kleinen Dialogs) und deshalb wieder ungeprüft. Die Zeilen ab 52 betreffen die Web-Panel-Elemente und die fünf Modelle (seit 2026-11-24). Die Zeilen 4, 15, 16, 18–21, 52, 55, 59 und ab 63 sind an die Status-Icons in Stufen angepasst (2026-11-28) und ungeprüft – bis auf Zeile 70 (eu und us-p im Nextion-Simulator bestätigt, 2026-11-28, `device14`) und den eu-/us-p-Teil von 67; die Admin-Bilder dazu prüft [../device-page-stages/README.md](../device-page-stages/README.md#bilder-zum-prüfen).

| # | Prüfung | Erwartung | Im Browser geprüft (2026-11-23) |
|---|---|---|---|
| 1 | Item „Gerät mit Details“ öffnen, das noch keine Geräteseite hat | „Long-Press öffnet“ steht auf **Detailseite**, kein Geräteseiten-Bereich sichtbar | |
| 2 | Auf **Geräteseite** umschalten | Layout 1 gewählt, Info-Slots 1 und 2 mit den ersten angehakten Einträgen vorbelegt, Knöpfe leer, Statuszeile leer, „i-Icon anzeigen“ an | |
| 3 | Etwas ändern, auf **Detailseite** und zurück auf **Geräteseite** schalten | alle Änderungen sind wieder da | ✓ |
| 4 | Layout 1 mit belegten Slots und Status-Icons, dann Layout 2 und zurück auf Layout 1 wählen (Gegenprobe: Layout 3 → Layout 1) | Slots bleiben nach Position; Layout 2 und 1 haben 6 Slots, nichts geht verloren. Von Layout 3 (8 Slots) nach Layout 1 (6 Slots) gehen die Schalter-Slots 7/8 verloren. Status-Icons und ihre Stufe bleiben bei jedem Wechsel gespeichert (siehe 66) | |
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
| 14 | ~~Item mit einer Geräteseite Layout 1 von vor den Status-Icons öffnen~~ | **entfällt** – die Geräteseite ist unveröffentlicht, es gibt keine älteren Stände | |
| 15 | Layout 1 und 3: unter den Plätzen der Status-Icons | Hinweis „Status-Icons zeigen nur ein Icon in seiner Farbe … Auf dem Panel rücken die belegten Plätze lückenlos auf.“ | |
| 16 | Status-Platz 8 einen Wert geben (Stufe 6–8 Spalten) | der „…“-Knopf der Zeile wird aktiv; die Vorschau ändert sich nicht – sie folgt der Stufe, nicht der Belegung | |
| 17 | Über „…“ ein eigenes Icon wählen, dann einen anderen Wert für denselben Slot | das Icon bleibt, „…“ ist grün; Wert auf „leer“ → Einstellungen sind weg, „…“ ausgegraut | ✓ |
| 18 | Stufe auf „Keine Status-Icons“ stellen | keine Plätze der Status-Icons mehr im Dialog, Vorschau ohne Raster, Info-Zeilen breit; die Belegung der Plätze bleibt gespeichert (siehe 64) | |
| 19 | Layout 1 mit Status-Icons → Layout 3 → Layout 1 | Status-Icons sind ein eigener Teil der Konfiguration: Layout 3 zeigt die ersten 8 Plätze (Stufe höchstens 5–8), zurück auf Layout 1 sind alle Plätze und die alte Stufe wieder da; eigene Icons bleiben | |
| 20 | Am Panel: Layout 1 mit einem An/Aus-Wert (z. B. Tür) als Status-Icon | Icon grün/rot (aktiviert/deaktiviert) wechselt mit dem Wert, kein Name, kein Wert, Tipp ohne Wirkung | |
| 21 | Am Panel: Wert eines Status-Icons ändern | nur das Icon bzw. seine Farbe ändert sich; Raster, Spalten und Info-Zeilen bleiben (sie folgen nur der Stufe und der Belegung im Admin) | |
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
| 34 | ~~Altes Item mit Status-Icon (Feld `icon`) öffnen~~ | **entfällt** – die Geräteseite ist unveröffentlicht | |
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
| 52 | Abschnitt „Slots“: Häkchen **Web-Panel-Elemente (web-l / web-p)** | Vorgabe aus, der Tooltip erklärt es; angehakt erscheinen darunter die zusätzlichen Slots des Layouts (Layout 1: 7–8 Knopf; Layout 2: 7 Info-Zeile, 8–9 Knopf; Layout 3: 9–10 Info-Zeile, 11 Schalter), alle leer | |
| 53 | Zusätzlichen Slot belegen (State, Benutzerdefiniert, „…“), übernehmen, neu öffnen | verhält sich wie ein normaler Slot derselben Art; Rohdaten zeigen `webExtras: true` und die Einträge hinten in `slots` | |
| 54 | Häkchen entfernen, übernehmen, neu öffnen; wieder anhaken | Slots weg, in den Rohdaten fehlt `webExtras`, die Einträge in `slots` bleiben; nach dem Anhaken sind sie wieder da | |
| 55 | Layout wechseln mit belegten zusätzlichen Slots (1 → 2 → 3 → 1), einmal mit und einmal ohne Häkchen | sie bleiben zusätzliche Slots in ihrer Reihenfolge (der erste bleibt der erste); wechselt dabei die Art (Layout 1 Knopf, Layout 2/3 Info-Zeile), steht ein unpassender Wert rot „passt nicht zu diesem Slot“ da; beim Wechsel auf Layout 1 fällt der dritte weg – auch ohne Häkchen; Status-Icons und zusätzliche Slots mischen sich nie | |
| 56 | Web-Panel web-l und web-p: Häkchen an / aus | an: die zusätzlichen Elemente erscheinen (wie `web-l-cardDevice*.png`, `web-p-cardDevice*.png`), Tipp/Long-Press/Popup wie bei den anderen; aus: Seite ohne sie und ohne Lücke (wie `…-plain.png`) | |
| 57 | EU-/US-Panel und Web-Klon eines Hardware-Panels mit angehakten Web-Panel-Elementen | Seite unverändert, nichts Zusätzliches, Statuszeile wie vorher | |
| 58 | us-l-Panel bzw. Web-Panel mit Modell US-Querformat: alle drei Layouts | Anordnung wie EU, Inhalt 15 px weiter rechts (wie `us-l-cardDevice*.png`) | |
| 59 | us-p-Panel bzw. Web-Panel mit Modell US-Hochformat: alle drei Layouts | hochkant neu angeordnet (wie `us-p-cardDevice*.png`): Layout 1 Haupt-Icon oben links, mit Status-Icons darunter ihr Raster und die Info-Zeilen rechts neben dem Haupt-Icon (nur Icon und Wert), ohne Status-Icons die Info-Zeilen in voller Breite, Knöpfe 2×2; Layout 2 Infos als Zeilen, Knopf über die volle Breite; Layout 3 Haupt-Icon mittig, Schalter als Zeilen. Statuszeile 262 px: ein langer Statustext wechselt früher als am EU-Panel | |
| 60 | Name und Wert mit mehr als 31 Byte in einem Slot, auf allen fünf Modellen ansehen | überall bei 31 Byte abgeschnitten; davor endet der Text an der Feldgrenze des Modells (sichtbare Breite je Modell verschieden), ohne eigene „…“ | |
| 61 | Im Web-Panel ein Element der Geräteseite und eine Grid-Kachel halten | kein Blinken (das zeigt nur die HMI); beim Loslassen wird der lange Druck trotzdem ausgelöst | |
| 62 | Abgleich Web ↔ HMI gegen Tims Aufnahmen | Ergebnis in [BILDER.md](BILDER.md#abgleich-web--hmi): Rahmen, Balken und Schalter deckungsgleich, Icons und Texte auf 1–3 px gleich; kein Fehler der Geräteseite im Web-Panel | ✓ (2026-11-24, statisch gerendert) |
| 63 | Layout 1: Auswahl **Status-Icons** aufklappen | **Keine Status-Icons**, **1–3 Spalten (bis 6 Icons)**, **4–5 Spalten (bis 10 Icons), Info-Zeilen ohne Namen**, **6–8 Spalten (bis 16 Icons), ohne Info-Zeilen**; Layout 3: **Keine Status-Icons**, **1–4 Icons, statt Kachel 1**, **5–8 Icons, statt Kachel 1 und 2**; Layout 2: keine Auswahl | |
| 64 | Jede Stufe einmal wählen | so viele Plätze der Status-Icons wie die Stufe fasst (6/10/16 bzw. 4/8); Layout 1 mit 6–8 Spalten blendet Slots 1/2 aus, Layout 3 Slot 1 bzw. 1/2; die Vorschau zeigt die Aufteilung der Stufe | |
| 65 | Platz 8 belegen (6–8 Spalten), auf 1–3 Spalten verkleinern, übernehmen, neu öffnen, wieder 6–8 Spalten | Platz 8 ist wieder belegt, ebenso ausgeblendete Slots 1/2 mit ihren Einstellungen | |
| 66 | Layout 1 mit 6–8 Spalten auf Layout 3 umstellen, dann zurück | Layout 3 zeigt „5–8 Icons, statt Kachel 1 und 2“ und 8 Plätze; zurück auf Layout 1 wieder 6–8 Spalten und 16 Plätze | |
| 67 | Am Panel: jede Stufe von Layout 1 und 3 mit 0, 1, 5, 9 bzw. 14 belegten Plätzen, dazwischen leere Plätze | belegte Plätze rücken lückenlos auf, spaltenweise (oben, unten, nächste Spalte); nur belegte Spalten erscheinen, höchstens die der Stufe; halbe letzte Spalte mit leerem Kästchen; Info-Zeilen bzw. Kacheln folgen nur der Stufe (wie `eu-cardDevice1-stage*.png`, `eu-cardDevice3-stage*.png`, echte HMI: `hmi/`) | ✓ teilweise: eu und us-p im Simulator, siehe 70 (Lücken und halbe letzte Spalte nicht aufgenommen); us-l offen |
| 68 | Am Panel: Status-Icons mit Alias-Kanal (dimmbares Licht, Rollladen, Steckdose mit Langer Druck) und mit Navigation | Tipp und Halten wie in der Tabelle „Tippen und Halten auf ein Status-Icon“ der Nutzer-Doku; Popup ohne Überschrift; Drück-Feedback grau und Long-Press-Blinken am Hardware-Panel | |
| 69 | Ausgeblendete Belegung (Platz über der Stufe, verdeckter Slot) mit einem Kanal, der nicht existiert; Adapter neu starten | keine Warnung im Log für diesen Platz – ausgeblendete Belegungen wertet der Adapter nicht aus | |
| 70 | Am EU- und us-p-Panel (`device14`): Layout 1 mit 0, 2 … 16 und Layout 3 mit 0–8 Status-Icons (Bilder `hmi/`, us-p mit Präfix `us-p-`) | jede Stufe sichtbar mit so vielen Spalten wie belegt; Rahmen um jede Zelle, rechte Kante geschlossen; Info-Sätze A (keine) / B (1–3 Spalten, Name an der Feldgrenze abgeschnitten) / C (4–5, ohne Namen) / keine (6–8); Layout 3: Kachel 1 bzw. 1 und 2 fehlen, die übrigen Kacheln unverändert. us-l und us-p wie EU (bzw. hochkant: Raster unter dem Haupt-Icon, Info-Zeilen bei 1–5 Spalten rechts daneben nur mit Icon und Wert) | ✓ eu und us-p im Nextion-Simulator (Tim, 2026-11-28; eu mit `device13` und erneut mit `device14`, us-p mit `device14`); us-l offen |
