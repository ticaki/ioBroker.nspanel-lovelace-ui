# Geräteseite für „Gerät mit Details“

Ein Item der Art **Gerät mit Details** öffnet mit einem langen Druck (Grid-Seiten) bzw. einem Tipp auf Icon oder
Bezeichnung (cardEntities) bisher immer die **Detailseite** – eine Liste mit allen angehakten Werten des Geräts.
Jetzt kannst du stattdessen eine **Geräteseite** öffnen lassen: ein großes Geräte-Icon, feste Plätze (Slots) für
Werte, einen Fortschrittsbalken, Knöpfe, Schalter oder kleine Status-Icons, eine Statuszeile und unten rechts ein kleines „i“, das die
Detailseite öffnet. Das passt z. B. für Waschmaschine, Saugroboter, Rasenmäher oder Auto.

## So stellst du es ein

1. Öffne im Seiten-Editor das Item und wähle oben die Art **Gerät mit Details** und dein Gerät.
2. Unter der Filterliste steht **Long-Press öffnet**. Wähle **Geräteseite**.
   - **Detailseite** ist die Vorgabe und verhält sich wie bisher.
   - Du kannst hin- und herschalten, ohne etwas zu verlieren, solange der Dialog offen ist. Gespeichert wird die
     Geräteseite nur, wenn beim Übernehmen **Geräteseite** gewählt ist.
3. Wähle das **Layout**. Die kleinen Bilder zeigen, wo welcher Slot sitzt; die Nummern gehören zu den Zeilen
   weiter unten.
4. **Haupt-Icon**: das große Icon oben links. Leer lassen = das Icon des Items.
5. **Statuszeile**: ein beliebiger Wert des Geräts als Text in der breiten Zeile unten, z. B. das Programm der
   Waschmaschine. Leer = leere Zeile.
6. **Slots**: Für jeden Slot steht die Nummer, die Art und eine Auswahl der Werte des Geräts. Angeboten werden nur
   Werte, die zur Art passen – „leer“ geht immer.
   - **Status-Icon** (nur Layout 1, Slots 7–10): zeigt nur ein kleines Icon in seiner Farbe, ohne Name und Wert, und
     reagiert nicht auf Tipps. Sobald ein Wert gewählt ist, erscheint daneben eine **Icon**-Auswahl: leer = das Icon
     automatisch (wie bei der Info-Zeile desselben Werts), sonst dein Icon, z. B. „delete-empty“ für „Behälter leeren“
     oder „air-filter“ für den Filter. Die Farbe kommt automatisch: An/Aus-Werte in den Farben aktiviert/deaktiviert,
     andere Werte in der Farbe ihrer Gruppe.
7. **i-Icon anzeigen** (Vorgabe an): das „i“ unten rechts öffnet die Detailseite mit den Einträgen, die du in der
   **Filterliste** angehakt hast. Die Filterliste erreichst du weiter über ihren Knopf.
8. **Übernehmen**.

Beim ersten Einschalten der Geräteseite werden die Info-Slots mit den angehakten Einträgen der Filterliste
vorbelegt. Knöpfe, Schalter, Fortschrittsbalken, Status-Icons und die Statuszeile bleiben leer – die wählst du selbst.

Wechselst du das Layout, bleiben die Slots nach ihrer Position erhalten (Slot 1 bleibt Slot 1 usw.). Passt ein Wert
danach nicht mehr zur Art des Slots, wird er rot mit „passt nicht zu diesem Slot“ angezeigt. Ein Wert, den es im
Gerät nicht mehr gibt, steht rot mit „nicht im Gerät gefunden“ da und bleibt gespeichert, bis du ihn änderst.

Ist der Adapter gerade nicht gestartet, zeigen die Auswahlen nur die gespeicherten Werte; das Item lässt sich
trotzdem unverändert speichern.

## Die drei Layouts

### 1 – Steuern (Saugroboter, Rasenmäher)

Zwei Info-Zeilen neben dem Icon, darunter vier Knöpfe. Optional vier kleine **Status-Icons** in einem 2×2-Raster
direkt rechts neben dem großen Icon (z. B. WLAN, Behälter, Filter, Fehler). Sind alle vier leer, sieht die Seite aus
wie ohne sie; ist mindestens eines belegt, erscheint das ganze Raster (leere Felder bleiben als leere Kästchen
stehen) und die beiden Info-Zeilen werden schmaler – lange Namen werden dann früher abgeschnitten.

![cardDevice1 mit Status-Icons](hmi-cardDevice1.png)
![cardDevice1 ohne Status-Icons](hmi-cardDevice1-plain.png)

### 2 – Fortschritt (Waschmaschine, Trockner, Geschirrspüler)

Ein großer Wert (z. B. Restzeit), ein Fortschrittsbalken, drei kleine Info-Kacheln und ein Knopf oben rechts.

![cardDevice2](hmi-cardDevice2.png)

### 3 – Werte (Auto, Sensoren)

Sechs Info-Kacheln und zwei Schalter.

![cardDevice3](hmi-cardDevice3.png)

## Was in welchen Slot passt

| Art | Welche Werte |
|---|---|
| Info-Zeile | alle |
| großer Wert | alle |
| Fortschrittsbalken | Zahlen (0–100 %, mit Min/Max des Werts umgerechnet) |
| Knopf | Taster (nur schreibbar) oder schaltbare An/Aus-Werte |
| Schalter | schaltbare An/Aus-Werte |
| Status-Icon | alle (nur Icon und Farbe) |

## Wo es die Geräteseite gibt

Nur auf **EU-Panels** und **Web-Panels im Querformat** mit aktueller TFT. Alle anderen Panels (US, Web-Panel im
Hochformat, ältere TFT) öffnen wie bisher die Detailseite.

## Was Tim prüfen soll

Screenshots des Dialogs fehlen noch (ohne laufenden Dev-Server nicht möglich).

| # | Prüfung | Erwartung |
|---|---|---|
| 1 | Item „Gerät mit Details“ öffnen, das noch keine Geräteseite hat | „Long-Press öffnet“ steht auf **Detailseite**, kein Geräteseiten-Bereich sichtbar |
| 2 | Auf **Geräteseite** umschalten | Layout 1 gewählt, Info-Slots 1 und 2 mit den ersten angehakten Einträgen vorbelegt, Knöpfe leer, Statuszeile leer, „i-Icon anzeigen“ an |
| 3 | Etwas ändern, auf **Detailseite** und zurück auf **Geräteseite** schalten | alle Änderungen sind wieder da |
| 4 | Layout 3 wählen, dann Layout 1 | Slots bleiben nach Position; Slots 7/8 fallen bei Layout 1 weg |
| 5 | Auswahl eines Knopf-/Schalter-/Fortschritts-Slots aufklappen | nur passende States (Knopf: Taster und schaltbare boolean, Schalter: schaltbare boolean, Balken: Zahlen), „leer“ oben |
| 6 | Statuszeile aufklappen | alle States des Geräts, Name + ID wie in der Filterliste |
| 7 | Haupt-Icon wählen und wieder leeren | Icon wird gespeichert bzw. entfällt |
| 8 | Übernehmen, Dialog neu öffnen | Geräteseite mit allen Einstellungen da; Rohdaten zeigen `device.devicePage` |
| 9 | Auf **Detailseite** stellen und übernehmen | `device.devicePage` ist aus den Rohdaten verschwunden |
| 10 | Einen gespeicherten Slot-State im Objektbaum löschen, Dialog öffnen | Slot zeigt den State rot „nicht im Gerät gefunden“, nach Übernehmen weiter gespeichert |
| 11 | Adapter stoppen, Dialog öffnen, Übernehmen | gespeicherte Geräteseite bleibt unverändert |
| 12 | Long-Press am EU-Panel (neue TFT) und am Web-Panel quer | Geräteseite erscheint mit den gewählten Slots |
| 13 | Dialog in hellem und dunklem Thema, schmales Fenster | Vorschaubilder und Slot-Zeilen lesbar, nichts abgeschnitten |
| 14 | Item mit einer Geräteseite Layout 1 von vor den Status-Icons (6 Slots) öffnen | Slots 1–6 unverändert, Slots 7–10 „Status-Icon“ leer; Übernehmen speichert 10 Slots |
| 15 | Layout 1: unter den Slots | Hinweis, dass die Info-Zeilen schmaler werden, sobald ein Status-Icon belegt ist |
| 16 | Status-Slot 8 einen Wert geben | daneben erscheint die Icon-Auswahl; die Vorschau von Layout 1 zeigt jetzt das 2×2-Raster und schmalere Info-Zeilen |
| 17 | Eigenes Icon wählen, dann einen anderen Wert für denselben Slot | das Icon bleibt; Wert auf „leer“ → Icon-Auswahl verschwindet, Icon ist weg |
| 18 | Alle Status-Slots wieder leeren | Vorschau ohne Raster, Info-Zeilen wieder breit |
| 19 | Layout 1 mit Status-Icons → Layout 3 → Layout 1 | Slots 7/8 bekommen bei Layout 3 die Werte von Status 7/8 nur, wenn sie zum Schalter passen (sonst rot); das eigene Icon geht beim Wechsel auf Layout 3 verloren |
| 20 | Am Panel: Layout 1 mit einem An/Aus-Wert (z. B. Tür) als Status-Icon | Icon grün/rot (aktiviert/deaktiviert) wechselt mit dem Wert, kein Name, kein Wert, Tipp ohne Wirkung |
| 21 | Am Panel: Status-Icons ein- und ausblenden (Wert im Admin setzen/leeren) | Raster erscheint/verschwindet, Info-Zeilen springen schmal/breit |
