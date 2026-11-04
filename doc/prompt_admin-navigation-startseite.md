# Prompt: Doku-Ergänzung „Navigation der Startseite und ermittelte Nachbarn im Admin“

Diese Datei ist ein fertiger Prompt für eine KI, die die Wiki-Doku (`doc/de`, `doc/en`) des Adapters pflegt.
Kompletten Text unterhalb der Linie an die KI geben, zusammen mit Zugriff auf die Doku-Dateien.

---

Du pflegst die Wiki-Dokumentation des ioBroker-Adapters `nspanel-lovelace-ui` (deutsch unter `doc/de`,
englisch unter `doc/en`). Arbeite die folgende Verhaltensänderung des Admin-Tabs `PageConfig`
(Bereich **Navigation/Panel**, Reiter `navigation`) in die Doku ein. Halte dich an Stil und Tonfall der
bestehenden Seiten: sachlich, kurze Absätze, Tabellen für Felder, Backticks für Feldnamen und IDs, kein
Marketing. Ändere nur, was die Änderung betrifft.

## Was sich geändert hat

### 1. Eine Startseite hat keine eigene Navigation

- Eine Seite, die im Reiter `pagedetails` als **Startseite** markiert ist (sie wird auf dem Panel unter der ID
  `main` veröffentlicht), bekommt ihre Nachbarn ausschließlich von den **anderen** Seiten: jede Seite, deren
  `prev` auf `main` zeigt, hängt sich hinter die Startseite, jede Seite mit `next: main` davor.
- Für die Startseite gespeicherte Werte in `prev`, `next`, `parent` und `home` werden vom Adapter
  **ignoriert**. Sie werden **nicht gelöscht**: Wird die Startseiten-Markierung wieder entfernt, gelten die
  zuvor gespeicherten Werte unverändert weiter.
- Mehrere Seiten mit `prev: main` werden in der Reihenfolge der Seitenliste hinter die Startseite gekettet
  (erste Seite direkt hinter `main`, dann die nächste usw.).

### 2. Admin zeigt die vom Adapter ermittelten Nachbarn

- **Startseite:** Die Felder `prev`, `next`, `parent`, `home` sind gesperrt und zeigen in kursiver, grauer
  Schrift die Nachbarn, die der laufende Adapter für das gewählte Panel tatsächlich ermittelt hat. Darunter
  steht der Hinweis (deutsch): „Die Startseite hat keine eigene Navigation: ihre Nachbarn ergeben sich aus
  den anderen Seiten, deren prev/next auf die Startseite zeigen. Die Felder zeigen die vom Adapter
  ermittelten Nachbarn. Zum Ändern die Nachbarseite bearbeiten.“ Englisch: „The start page has no navigation
  of its own: its neighbours follow from the other pages whose prev/next point to the start page. The fields
  show the neighbours the adapter resolved. To change them, edit the neighbouring page.“
  Auch die Zusammenfassung pro Panel unterhalb der Felder zeigt bei einer Startseite die ermittelten, nicht
  die gespeicherten Werte.
- **Alle anderen Seiten:** Ein Feld **ohne gespeicherten Wert** zeigt als Platzhalter (kursiv, grau) den
  Nachbarn, den der Adapter aus der Navigation ermittelt hat, zum Beispiel die Seite, deren `next` auf diese
  Seite zeigt. Der Platzhalter ist **kein gespeicherter Wert**; Tooltip (deutsch): „Aus der Navigation des
  laufenden Adapters ermittelt, nicht gespeichert. Zum Speichern einen Wert wählen.“ Englisch: „Determined
  from the navigation of the running adapter, not stored. Choose a value to store it.“ Das Feld bleibt
  bedienbar; erst eine Auswahl wird gespeichert. Ein leeres Feld bleibt leer, es wird nichts automatisch
  zurückgeschrieben.
- Die ermittelten Werte gibt es nur, solange die Adapterinstanz läuft; ohne laufende Instanz bleiben die
  Platzhalter leer. Bei einer Zuweisung an **alle Panels** wird kein Platzhalter gezeigt, weil die Nachbarn je
  Panel verschieden sein können.

### 3. Kollisionshinweise unter `prev` und `next`

Unter dem Feld erscheint in Warnfarbe ein Hinweis, wenn im gewählten Panel

- andere Seiten denselben Wert in `prev` gespeichert haben – deutsch: „Die Seiten X, Y zeigen ebenfalls auf
  dieses prev.“, englisch: „The pages X, Y also point to this prev.“;
- andere Seiten denselben Wert in `next` gespeichert haben – deutsch: „Die Seiten X, Y zeigen ebenfalls auf
  dieses next.“, englisch: „The pages X, Y also point to this next.“;
- andere Seiten mit ihrem `prev` auf die aktuelle Seite zeigen, das eigene `next` aber zu keiner davon führt –
  deutsch: „Die Seiten X, Y zeigen mit ihrem prev auf diese Seite, next führt aber zu keiner davon - sie
  hängen nur über ihr eigenes prev an.“, englisch: „The pages X, Y point to this page with their prev, but
  next does not lead to any of them - they only hang on by their own prev.“

Die Hinweise werden aus der gespeicherten Konfiguration berechnet (Zuweisung an das Panel oder an alle
Panels; eine Zuweisung an das Panel ersetzt die an alle Panels). Startseiten zählen dabei nicht als Quelle, weil
ihre gespeicherten Werte ignoriert werden.

### 4. Verkettung: ein explizites `next` bleibt erhalten

Hat eine Seite ein eigenes `next` und zeigen gleichzeitig andere Seiten mit `prev` auf diese Seite, dann
überschreibt die eingekettete Gruppe das eigene `next` nicht mehr. Liegt die `next`-Seite in der Gruppe,
steht sie als erste hinter der Seite; liegt sie nicht darin, bleibt der eigene Link stehen und die Gruppe
hängt sich nur mit ihrem `prev` an.

## Aufgabe

1. Finde in `doc/de` und `doc/en` die Stellen, die den Bereich **Navigation/Panel** des Tabs `PageConfig`,
   die Felder `prev`/`next`/`parent`/`home` oder die **Startseiten-Markierung** beschreiben (z. B. in den
   Admin-Seiten `*-Admin.md`, `Maintain.md`, `GlobalPages.md`). Gibt es noch keinen eigenen Abschnitt zur
   Navigationszuweisung im Admin, lege ihn an der Stelle an, die zu den bestehenden Admin-Seiten passt, und
   verlinke ihn aus den Seiten, die auf die Navigationszuweisung verweisen.
2. Ergänze dort die Punkte 1 bis 4, deutsch und englisch, mit den oben zitierten Hinweistexten.
3. Prüfe Aussagen, die der Änderung widersprechen (etwa dass die Startseite eigene `prev`/`next`-Werte hat
   oder dass ein leeres Feld „keine Navigation“ bedeutet), und passe sie an.
4. Ergänze in `Developer-News-(Latest).md` (falls vorhanden) einen kurzen Eintrag.
5. Nenne am Ende die geänderten Dateien und zitiere die neuen Absätze.
