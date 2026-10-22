# Benachrichtigungen des Bildschirmschoners – Konfiguration im Admin

Eine Benachrichtigung legt sich über den Bildschirmschoner, solange ein Datenpunkt „an“ ist: zwei Zeilen – eine Überschrift mit Symbol und darunter ein Text. Gedacht ist das für Dinge, die man sehen soll, ohne das Panel zu bedienen: ein offenes Fenster, ein Alarm, eine Störung, ein Wert, der aus dem Rahmen läuft.

Angelegt werden sie über die **Glocke** im Panelbild des Screensaver-Editors, gleich neben dem Zahnrad. Alle Bildschirmschoner teilen sich **eine gemeinsame Liste**; das Häkchen je Zeile entscheidet, auf welchem Bildschirmschoner eine Benachrichtigung erscheint. Ein Konfigurationsskript ist dafür nicht nötig.

Wie der Bildschirmschoner selbst angelegt wird, steht unter [Screensaver – Admin](Screensaver-Admin). Diese Seite beschreibt nur die Benachrichtigungen.

Inhalt:
- [Die Liste](#1-die-liste)
- [Inhalt: Überschrift und Text](#2-inhalt-überschrift-und-text)
- [Wann anzeigen: Datenpunkte und Bedingung](#3-wann-anzeigen-datenpunkte-und-bedingung)
- [Priorität: welche Meldung das Panel zeigt](#4-priorität-welche-meldung-das-panel-zeigt)
- [Quittieren und Gruppen-ID](#5-quittieren-und-gruppen-id)
- [Summer](#6-summer)
- [Vorschau und was der Dialog prüft](#7-vorschau-und-was-der-dialog-prüft)
- [Speichern – was der Adapter daraus macht](#8-speichern--was-der-adapter-daraus-macht)
- [Wenn etwas nicht wie erwartet aussieht](#9-wenn-etwas-nicht-wie-erwartet-aussieht)

## 1. Die Liste

Die Glocke sitzt im Panelbild unten rechts, links vom Zahnrad. Die kleine Zahl daran nennt, wie viele Benachrichtigungen auf **diesem** Bildschirmschoner eingeschaltet sind. Sie ist nur bedienbar, solange die Instanz läuft.

Ein Klick öffnet **Benachrichtigungen** – die gemeinsame Liste. Jede Zeile zeigt:

| Element | Bedeutung |
|---|---|
| **Auf diesem Bildschirmschoner anzeigen** | Das Häkchen schaltet die Benachrichtigung für den gerade geöffneten Bildschirmschoner ein. Ohne Häkchen bleibt sie in der Liste, geht aber an kein Panel. |
| Prioritäts-Chip | Die Prioritätszahl, siehe [Priorität](#4-priorität-welche-meldung-das-panel-zeigt). |
| Beschriftung | Die **Beschreibung**, sonst die Überschrift, sonst der Text, sonst der erste Datenpunkt. |
| Zweite Zeile | Die Datenpunkte, bei Bedarf die Bedingung und „Quittieren (Gruppen-ID)“. |
| **Auch verwendet von: …** | Erscheint, wenn weitere Bildschirmschoner dieselbe Benachrichtigung nutzen. |
| **Bearbeiten**, **Duplizieren**, **Löschen** | Stift, Kopie, Papierkorb. Duplizieren legt die Kopie direkt darunter an und übernimmt den Haken. |

Unten legt **Benachrichtigung hinzufügen** eine neue an.

> Die Reihenfolge in der Liste ist reine Anzeige: angehakte oben, danach nach Priorität, dann nach Speicherreihenfolge. Welche Meldung das Panel zeigt, entscheidet allein die Priorität.

> ⚠️ **Bearbeiten und Löschen wirken auf alle Bildschirmschoner**, die dieselbe Benachrichtigung nutzen. Beim Bearbeiten weist der Dialog darauf hin, beim Löschen fragt er nach – aber nur, wenn die Benachrichtigung tatsächlich mehrfach verwendet wird. Wer eine Meldung nur für ein Panel ändern will, **dupliziert** sie zuerst.

## 2. Inhalt: Überschrift und Text

Der Abschnitt **Inhalt** füllt die zwei Zeilen, die das Panel anzeigt:

| Feld | Wirkung |
|---|---|
| **Icon vor der Überschrift** | Symbol links in der ersten Zeile. |
| **Überschrift-Präfix**, **Überschrift**, **Überschrift-Einheit** | Die erste Zeile, in dieser Reihenfolge zusammengesetzt. |
| **Text-Präfix**, **Text**, **Text-Suffix** | Die zweite Zeile. |
| **Beschreibung** | Nur für die Übersicht in der Liste – sie wird **nicht** auf dem Panel angezeigt. |

**Jedes dieser Felder nimmt entweder einen festen Text oder die ID eines Datenpunkts** – im zweiten Fall zeigt das Panel dessen aktuellen Wert. Zahlen werden dabei wie am Panel formatiert; hat die Überschrift keine eigene Einheit, hängt der Adapter die Einheit des Datenpunkts an.

> **Präfix und Suffix des Textes** bleiben gesperrt, solange **Text** leer ist – allein ergeben sie keine Zeile. Was bei gesperrtem Feld schon dort stand, wird beim Übernehmen verworfen.

> ⚠️ Ob ein Feld als Text oder als Datenpunkt gilt, entscheidet allein, **ob es die ID wirklich gibt**. Ein Tippfehler in der ID landet unbemerkt als Text auf dem Panel; gewarnt wird nicht. Die [Vorschau](#7-vorschau-und-was-der-dialog-prüft) ist die Probe aufs Exempel: Steht dort der Wert, wurde die ID erkannt.

## 3. Wann anzeigen: Datenpunkte und Bedingung

| Feld | Wirkung |
|---|---|
| **Datenpunkt 1, 2, …** | Mindestens einer ist Pflicht. **Datenpunkt hinzufügen** hängt weitere an; ab zwei Zeilen lässt sich eine wieder löschen. |
| **Wann anzeigen** | Optionaler Ausdruck über `val`, den Wert des jeweiligen Datenpunkts – zum Beispiel `val >= 3`. |

Die Benachrichtigung erscheint, **solange alle eingetragenen Datenpunkte „an“ sind** (logisches UND). Ohne Bedingung zählt der Wert unmittelbar als Ja/Nein. Mit Bedingung wird der Ausdruck für jeden Datenpunkt ausgewertet; es ist ein freier JavaScript-Ausdruck, nicht nur ein Vergleich – `val > 9` ist ebenso möglich wie `val.length > 0 && val !== 'OFF'`.

> **Eine Bedingung gilt für alle** Datenpunkte der Benachrichtigung. Unterschiedliche Bedingungen je Datenpunkt gibt es nicht – dafür braucht es zwei Benachrichtigungen.

> ⚠️ Die Bedingung wird **nicht auf Syntax geprüft**. Ein fehlerhafter Ausdruck fällt erst zur Laufzeit auf: Der Adapter schreibt einen Fehler ins Log und wertet dann den Rohwert als Ja/Nein.

## 4. Priorität: welche Meldung das Panel zeigt

Das Panel zeigt **immer nur eine** Benachrichtigung. Sind mehrere gleichzeitig aktiv, gewinnt die mit der **niedrigsten Prioritätszahl**; bei Gleichstand entscheidet die Reihenfolge der gemeinsamen Liste.

- **Priorität**: kleinere Zahl = höher. Leer bedeutet **99**, also ganz hinten.
- Die übrigen Meldungen erscheinen erst, wenn die vorrangige nicht mehr aktiv oder quittiert ist. Eine Abfolge mehrerer Meldungen gibt es nicht.

## 5. Quittieren und Gruppen-ID

| Feld | Wirkung |
|---|---|
| **Quittieren** | Tippen auf den Bildschirmschoner blendet die Benachrichtigung aus – bis ihr Datenpunkt aus- und wieder angeht. |
| **Gruppen-ID** | Nur bei gesetztem Häkchen. Benachrichtigungen mit derselben Gruppen-ID werden gemeinsam quittiert, und zwar **auf allen Panels**. |

> ⚠️ **Ohne** „Quittieren“ bleibt die Meldung stehen, solange ihre Datenpunkte an sind – sie lässt sich am Panel nicht wegtippen. Für Dauerzustände (offenes Fenster) ist das gewollt, für Ereignisse (Türklingel) meist nicht.

## 6. Summer

Drei Möglichkeiten: **Aus**, **Standard** (`1,2,3,0xF54`) oder **Eigene Tonfolge**. Bei „Eigene“ ist das Feld **Tonfolge** Pflicht; es nimmt die Argumente des Tasmota-Befehls `Buzzer` in der Form *Anzahl,an,aus,Melodie*.

Der Summer ertönt nur, **wenn die angezeigte Benachrichtigung wechselt** – nicht wiederholt, solange dieselbe Meldung steht. Außerdem schweigt er im Nachtmodus und wenn `cmd.isBuzzerAllowed` des Panels aus ist.

## 7. Vorschau und was der Dialog prüft

Die Vorschau im Dialog zeichnet die Meldung so, wie das Panel sie setzt: schwarzer Kasten, Symbol, Überschriftzeile, Textzeile. Felder mit einer gültigen Datenpunkt-ID zeigen den **aktuellen Wert**.

> Die Werte werden kurz nach dem Tippen einmal geholt und beim Öffnen des Dialogs neu gelesen – sie laufen **nicht live** mit.

**Übernehmen** bleibt gesperrt, solange eine dieser Bedingungen nicht erfüllt ist:

- mindestens ein **Datenpunkt** ist eingetragen,
- es gibt überhaupt etwas anzuzeigen – also **Text** oder **Überschrift** (auch deren Präfix, Einheit oder Icon genügen),
- die **Priorität** ist eine Zahl,
- bei **Eigene Tonfolge** ist die Tonfolge ausgefüllt.

Der Dialog nennt den Grund jeweils in einer Warnzeile, etwa „Nichts anzuzeigen: Überschrift (oder deren Präfix, Einheit, Icon) oder Text ausfüllen.“

## 8. Speichern – was der Adapter daraus macht

Der Dialog arbeitet auf einer Kopie: Erst **Übernehmen** in der Liste schreibt die Änderungen zurück, und erst **Speichern** in den Instanz-Einstellungen macht sie dauerhaft – die Instanz startet dabei neu.

- Die Benachrichtigungen liegen zentral unter **`native.screensaverNotify`**, jede mit einer eigenen ID. Ein Bildschirmschoner speichert nur die **IDs** der Benachrichtigungen, die auf ihm erscheinen sollen.
- Ältere Konfigurationen, bei denen die Benachrichtigungen noch im Eintrag des Bildschirmschoners steckten, wandern beim Laden automatisch in die gemeinsame Liste.
- Nicht angehakte Benachrichtigungen bleiben erhalten, werden aber an kein Panel geschickt.

Auf dem Panel entsteht daraus eine Überschriftzeile (Symbol + Präfix + Wert/Text + Einheit) und darunter die Textzeile (Präfix + Text + Suffix). Im Skript entspricht das `notifyScreensaverEntity`, siehe [Screensaver](screensaver).

## 9. Wenn etwas nicht wie erwartet aussieht

- **Die Glocke ist grau:** Die Instanz läuft nicht. Benachrichtigungen lassen sich nur bei laufender Instanz bearbeiten.
- **Statt des Werts steht die ID auf dem Panel:** Die ID gibt es nicht – dann gilt der Eintrag als fester Text. In der Vorschau sieht man es sofort.
- **Die Meldung erscheint nie:** Alle Datenpunkte müssen gleichzeitig „an“ sein. Gibt es einen der Datenpunkte nicht, zählt er als „aus“ – bei mehreren Datenpunkten verschwindet die Meldung damit still. Ist **nur ein** Datenpunkt eingetragen und fehlt dieser, verwirft der Adapter die ganze Benachrichtigung und schreibt einen Fehler ins Log.
- **Es erscheint eine andere Meldung als erwartet:** Es ist immer nur eine zu sehen – die mit der kleinsten Prioritätszahl. Leere Priorität heißt 99.
- **Die Meldung geht nicht weg:** Ohne **Quittieren** bleibt sie, bis ihre Datenpunkte ausgehen.
- **Quittieren wirkt auf mehr als gedacht:** Benachrichtigungen mit derselben **Gruppen-ID** werden gemeinsam ausgeblendet, auch auf anderen Panels.
- **Der Summer bleibt still:** Nachtmodus, `cmd.isBuzzerAllowed` aus – oder die angezeigte Meldung hat gar nicht gewechselt.
- **Die Überschrift wird falsch umbrochen:** Die Zeichenfolge `<sp!it>` darf im Text nicht vorkommen, der Adapter trennt daran intern die Zeilen. Ein `~` im Text wird durch `-` ersetzt.
- **Eine Änderung taucht auf einem anderen Bildschirmschoner auf:** Die Liste ist gemeinsam – siehe „Auch verwendet von“ in der Zeile. Vor einer abweichenden Fassung erst **Duplizieren**.
