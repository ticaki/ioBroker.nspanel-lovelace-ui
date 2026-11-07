# Timer-Popup

Ein Pageitem mit einem Kanal der Rolle `level.timer` ist ein Timer: In der Liste einer Seite zeigt es seinen Namen und die Zeit, ein Tipp darauf öffnet das **Timer-Popup** mit den Feldern für Minuten und Sekunden und bis zu drei Tasten. Gezählt wird je nach Kanal im Adapter, in einem eigenen Skript, gar nicht (Wecker mit fester Uhrzeit) – oder das Item zeigt den Timer des Bildschirmschoners.

Angelegt wird das Item wie jedes andere über die [Pageitem-Konfiguration](PageConfig-Dialoge#1-pageitem-konfiguration): als **ioBroker-Kanal** einen Kanal mit der Rolle `level.timer` wählen. Welche Datenpunkte der Kanal haben kann, steht in der [Alias-Tabelle](ALIAS#leveltimer). Der Name in Liste und Popup ist der **Name** aus dem Dialog, sonst der Name des Kanals, zuletzt *Timer*.

Inhalt:
- [Betriebsarten](#1-betriebsarten)
- [Datenpunkte](#2-datenpunkte)
- [Tasten](#3-tasten)
- [Den internen Timer von außen steuern](#4-den-internen-timer-von-außen-steuern)
- [Timer aus dem Screensaver verwenden](#5-timer-aus-dem-screensaver-verwenden)
- [Anzeige und Grenzen](#6-anzeige-und-grenzen)
- [Fallstricke](#fallstricke)

## 1. Betriebsarten

Welche Betriebsart ein Item hat, liest der Adapter aus den Datenpunkten des Kanals ab:

| Betriebsart | Woran der Adapter sie erkennt | Wer zählt |
|---|---|---|
| **Intern** | kein `ACTUAL` | der Adapter |
| **Extern** | `ACTUAL` mit der Rolle `value.timer` oder `level.timer`, oder mit der Einheit `s`, `sec` oder `ms` | ein eigenes Skript |
| **Wecker** | `ACTUAL` mit der Rolle `date`, oder mit einer anderen Rolle ohne Zeiteinheit | niemand – eine feste Uhrzeit |
| **Vom Screensaver** | Häkchen **Timer aus dem Screensaver verwenden** im Item-Dialog | wie der Bildschirmschoner, siehe [Abschnitt 5](#5-timer-aus-dem-screensaver-verwenden) |

Ein Kanal, der nur einen `SET` hat, ist ein interner Timer – außer `SET` trägt die Rolle `date`, dann ist es ein Wecker. Ein externer Timer oder Wecker, bei dem nichts beschreibbar ist und der keinen `STATUS` hat, ist eine reine Zeitanzeige: Das Popup zeigt die Zeit, hat aber keine Tasten.

## 2. Datenpunkte

| Datenpunkt | Bedeutung |
|---|---|
| `ACTUAL` | Der angezeigte Wert. Beim externen Timer die Restzeit in Sekunden, bei der Einheit `ms` in Millisekunden. Beim Wecker ein Zeitstempel in Millisekunden, angezeigt als Uhrzeit `HH:MM` in Ortszeit. |
| `SET` | Dorthin schreibt der Adapter eine im Popup eingestellte Zeit, in derselben Einheit wie `ACTUAL`. Ohne `SET` schreibt er in `ACTUAL`, falls der beschreibbar ist. Beim Wecker steht in `SET` der nächste Zeitpunkt dieser Uhrzeit als Zeitstempel in Millisekunden. |
| `STATUS` | `0` = aus, `1` = Pause, `2` = läuft. Beim externen Timer und beim Wecker nötig, damit es die Tasten Start, Pause und An/Aus gibt – sonst weiß das Skript nicht, dass es zählen soll. |
| `STATE` | Wird `true`, wenn ein interner Timer abläuft und wenn **Fertig** gedrückt wird – nie bei **Abbrechen** oder **Löschen**. |

Von außen geschriebene Werte wirken nur, wenn sie bestätigt sind (`ack`) oder der Datenpunkt unter `0_userdata.0` oder `alias.0` liegt.

## 3. Tasten

Welche Tasten das Popup zeigt und ob sich die Zeit bearbeiten lässt, hängt an Betriebsart und Zustand:

| Betriebsart und Zustand | Tasten | Zeit bearbeitbar |
|---|---|---|
| Intern, keine Zeit | **Start** | ja |
| Intern, Zeit gesetzt, nicht gestartet | **Start**, **Abbrechen** | ja |
| Intern, läuft | **Pause**, **Abbrechen**, **Fertig** | nein |
| Intern, pausiert | **Weiter**, **Abbrechen** (nach dem Bearbeiten: **Start**) | ja |
| Intern, abgelaufen | **Fertig**, Anzeige `00:00` | nein |
| Extern, `STATUS` 0 | **Start**, **Löschen** | wenn beschreibbar |
| Extern, `STATUS` 1 | **Weiter**, **Löschen** | wenn beschreibbar |
| Extern, `STATUS` 2, Rest > 0 | **Pause**, **Abbrechen**, **Fertig** | nein |
| Extern, `STATUS` 2, Rest 0 | **Fertig**, Anzeige `00:00` | nein |
| Extern ohne `STATUS` | **Löschen**, falls etwas beschreibbar ist | wenn beschreibbar |
| Wecker, aus | **An** (schreibt `STATUS` 2) | wenn beschreibbar |
| Wecker, an | **Aus** (schreibt `STATUS` 1) | nein |
| Wecker ohne `STATUS` | keine | wenn beschreibbar |
| Vom Screensaver, kein Timer | **Start**, wenn ein freier Slot beschreibbar ist | ja, wenn Start möglich ist |
| Vom Screensaver, läuft oder pausiert | **Abbrechen** | nein |
| Vom Screensaver, abgelaufen | **Fertig** | nein |
| Vom Screensaver, nicht beschreibbar | keine | nein |

Das Schließen der Zeitfelder startet nichts. Beim externen Timer und beim Wecker schreibt der Adapter die Zeit sofort in `SET` (oder `ACTUAL`); beim internen Timer merkt er sie sich und schreibt sie zusätzlich in `SET`, falls es den gibt; bei *Vom Screensaver* merkt er sie sich nur. Gestartet wird erst mit **Start**.

**Abbrechen** und **Löschen** setzen `STATUS` auf 0 und beim externen Timer `SET` und `ACTUAL` auf 0; `STATE` bleibt unberührt. **Fertig** tut dasselbe und setzt zusätzlich `STATE` auf `true`.

## 4. Den internen Timer von außen steuern

Der interne Timer läuft im Adapter, auch wenn seine Seite nie geöffnet wurde. Über `SET` und `STATUS` lässt er sich aus einem Skript steuern:

| Schreiben | Wirkung |
|---|---|
| `SET` > 0, Timer steht oder pausiert | stellt die Zeit, startet nicht |
| `SET` > 0, Timer läuft | neue Restzeit, läuft weiter |
| `SET` = 0 | wie **Abbrechen** |
| `STATUS` = 2 | Start oder Weiter; steht der Zähler auf 0, nimmt er die Zeit aus `SET` |
| `STATUS` = 1 | Pause, falls er läuft |
| `STATUS` = 0 | Abbrechen, ohne `STATE` |

Der Adapter spiegelt jeden Zustandswechsel in `STATUS`. Beim Ablauf bleibt `STATUS` auf 2, bis **Fertig** gedrückt wird – wie ein externer Timer, der mit `ACTUAL` 0 bei `STATUS` 2 steht. Die Restzeit eines internen Timers ist von außen nicht lesbar. Nach einem Neustart des Adapters ist ein interner Timer weg; ein übrig gebliebener `STATUS` wird dann berichtigt.

## 5. Timer aus dem Screensaver verwenden

Das Häkchen **Timer aus dem Screensaver verwenden** steht in der Pageitem-Konfiguration nur bei einem Kanal der Rolle `level.timer`. Darunter steht: *Item und Popup zeigen den Timer des Screensavers dieses Panels (Dialog der Uhrzeit). Die Datenpunkte dieses Channels werden dafür nicht verwendet.* Gemeint ist der Timer, der im [Screensaver-Editor](screensaver#timer-statt-uhrzeit) über die Uhrzeit eingestellt wird.

- Liste und Popup zeigen denselben Timer wie der Bildschirmschoner dieses Panels – auch, wenn er dort weggetippt ist; bei Slot-Mustern den dort gerade gewählten Slot.
- Die Datenpunkte des Kanals werden nicht verwendet; der Kanal braucht nur die Rolle.
- Das Häkchen ist gesperrt, wenn der Bildschirmschoner dieses Panels genau dieses Item als Quelle seines Timers nutzt: *Nicht möglich: Der Screensaver dieses Panels nutzt genau dieses Item als Quelle seines Timers, das wäre ein Kreis.*

**Start** schreibt zuerst den Daten-Datenpunkt des Bildschirmschoner-Timers und dann den An/Aus-Datenpunkt. Welcher Wert in die Daten kommt, richtet sich nach dem Datenpunkt: die Restzeit bei der Einheit `s`, `sec` oder `ms` oder der Rolle `value.timer` oder `level.timer`, ein ISO-Datum bei einem Text-Datenpunkt, sonst die Endzeit als Zeitstempel in Millisekunden. Bei Slot-Mustern nimmt Start den niedrigsten Slot, dessen An/Aus nicht wahr ist – gibt es keinen, ist kein Start möglich. **Abbrechen** und **Fertig** setzen An/Aus des angezeigten Slots auf falsch. Eine Pause gibt es hier nicht. Ist die Quelle des Bildschirmschoners ein Pageitem, startet und beendet das Häkchen-Item dieses Pageitem.

Hat der Bildschirmschoner des Panels keinen vollständigen Timer, warnt das Log einmal je Panel, und das Item bleibt ohne Tasten.

## 6. Anzeige und Grenzen

- In der Liste steht die Zeit als `HH:MM:SS`, beim Wecker als `HH:MM`. Das Popup zeigt Minuten und Sekunden, höchstens `99:59`; beim Wecker Stunde und Minute.
- Die beiden Eingabefelder des Panels gehen jeweils bis 59, eingegeben werden kann also höchstens `59:59`.
- Bei laufendem Timer wird die Liste alle 2 Sekunden aufgefrischt, das offene Popup jede Sekunde. Das ist Absicht – schneller staut sich der Verkehr zum Panel.
- Das Popup bleibt bei laufendem Timer offen, und das Panel dunkelt nicht ab, weil jede Auffrischung seinen Schlaf-Zähler zurücksetzt. Das ist gewollt.

## Fallstricke

- **Das Item hat keine Tasten:** Entweder ist nichts beschreibbar und es gibt keinen `STATUS` (reine Anzeige), oder das Item nutzt den Timer des Bildschirmschoners, der keinen vollständigen Timer hat – das Log nennt es einmal. Auch ein Kreis (das Item ist zugleich Quelle des Bildschirmschoner-Timers) lässt das Item ohne Tasten.
- **Das Skript bekommt den Start nicht mit:** Ohne `STATUS` gibt es bei externem Timer und Wecker keine Start-, Pause- und An/Aus-Tasten. Den Datenpunkt anlegen, beschreibbar und mit `ack` lesen.
- **Nach einem Neustart zählt der interne Timer nicht weiter.** Er lebt nur im Adapter; wer das braucht, zählt im Skript und gibt `ACTUAL` und `STATUS` an den Adapter.
- **Das Popup zeigt `99:59`, obwohl mehr Zeit bleibt:** Die beiden Felder sind auf 99 Minuten begrenzt; die Liste zeigt mit `HH:MM:SS` die volle Zeit.
- **`STATE` kommt nicht:** Nur der Ablauf eines internen Timers und die Taste **Fertig** setzen ihn. **Abbrechen** und **Löschen** sollen gerade keinen Ablauf melden.
