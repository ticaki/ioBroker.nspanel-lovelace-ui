# Panel-Konfiguration exportieren und importieren

## Anleitung

### Wofür

Die Konfiguration eines Panels lässt sich als Datei sichern und wieder einspielen. Das hilft

- als **Sicherung**, bevor Sie größere Änderungen machen: Geht etwas schief, spielen Sie die Datei einfach
  wieder in dasselbe Panel ein;
- zum **Übertragen auf ein anderes Panel**, z. B. wenn ein zweites Panel genauso aussehen soll wie das erste
  oder ein Panel ersetzt wird – auch in eine andere ioBroker-Installation.

Die Datei enthält drei Teile:

- **Seiten** – alle Seiten, die auf dem Panel zu sehen sind, mit ihrer Navigation (vor, zurück, hoch, Home);
- **Screensaver** – der Screensaver des Panels mit seinen Benachrichtigungen;
- **Sonstiges** – die Hardware-Tasten, „Panel benutzt kein Skript“, geänderte Navigation von Skript-Seiten
  und die Einstellungen des Panels (z. B. Screensaver-Timeout, Helligkeit, Tastenkopplung).

### Exportieren

1. Im Admin auf den Reiter **Nspanel-Einstellungen** gehen.
2. Auf der Kachel des Panels auf den **Export-Knopf** (Pfeil nach unten) klicken.

   ![Export- und Import-Knopf auf der Kachel](00-tile-export-import-buttons.png)

3. Enthalten Seiten des Panels eine **PIN** (Alarm-/Entsperrseite) oder ein **WLAN-Passwort** (QR-Seite),
   fragt der Admin nach, ob diese mit in die Datei sollen:

   ![Rückfrage zu PINs und Passwörtern](secrets-dialog.png)

   - **Ohne Passwörter exportieren** (Vorgabe): Die Datei enthält keine Geheimnisse und kann gefahrlos
     weitergegeben werden. Nach einem Import in ein anderes Panel geben Sie PIN bzw. Passwort dort neu ein.
   - **Mit Passwörtern exportieren**: Die Datei enthält PIN und Passwörter im Klartext. Bewahren Sie sie sicher
     auf.

   Eine PIN, die das globale Passwort der Instanz verwendet, ist kein Geheimnis und wird immer mitgenommen.
4. Der Browser lädt die Datei herunter, z. B. `nspanel-Wohnzimmer-2026-11-11.json`.

### Importieren

1. Auf der Kachel des **Ziel-Panels** auf den **Import-Knopf** (Pfeil nach oben) klicken.
2. Auswählen, welche Teile übernommen werden sollen – Seiten, Screensaver, Sonstiges –, dann
   **Datei auswählen**.

   ![Teile auswählen](00b-import-groups.png)

   Ist die Datei beschädigt oder keine Panel-Konfiguration, erscheint eine Fehlermeldung
   ([Beispiel](09-invalid-file.png)). Fehlt ein gewählter Teil in der Datei, wird er übersprungen und angezeigt.
3. Es öffnet sich die **Übersicht**. Oben stehen Hinweise, z. B. dass vorhandene Einstellungen des Panels
   ersetzt werden, dass die Datei von einem Panel mit anderem Modell stammt oder auf welchen Seiten Sie
   Passwörter neu eingeben müssen. Darunter steht jede Seite der Datei und der Screensaver mit dem, was mit
   ihr passiert:

   | Anzeige | Bedeutung |
   | --- | --- |
   | **unverändert** | Die Seite ist schon genau so auf dem Panel – es passiert nichts. |
   | **Zuweisung ergänzen** | Die Seite gibt es schon (gleicher Inhalt), sie wird zusätzlich diesem Panel zugeordnet. |
   | **Navigation ändern** | Die Seite ist schon auf dem Panel, bekommt aber die Navigation aus der Datei. |
   | **neu anlegen** | Die Seite gibt es noch nicht, sie wird angelegt. |
   | **unterschiedlich** | Es gibt schon eine Seite mit diesem Namen, aber mit anderem Inhalt. Sie wählen: |
   | – umbenennen (Vorschlag) | Die Seite aus der Datei wird unter einem neuen Namen angelegt; den Namen können Sie ändern. Die vorhandene Seite bleibt, wie sie ist. |
   | – vorhandene ersetzen | Die vorhandene Seite bekommt den Inhalt aus der Datei. |
   | – überspringen | Die Seite aus der Datei wird nicht übernommen. |

   Seiten ohne Konflikt sind zusammengeklappt („23 ohne Konflikt“), ein Klick zeigt sie an. Wird eine Seite
   umbenannt, ändern sich auch die Seiten, die auf sie verweisen – sie erscheinen dann ebenfalls als
   „unterschiedlich“.

   ![Übersicht mit Konflikten](04-conflicts-review.png)

   Ein Klick auf **unterschiedlich** zeigt, was sich genau unterscheidet, z. B. Überschrift, einzelne Elemente
   oder die Navigation:

   ![Unterschiede einer Seite](05-diff-dialog.png)

   Wählen Sie **vorhandene ersetzen** für eine Seite, die auch andere Panels zeigen, fragt der Admin noch
   einmal nach und nennt diese Panels – sie ändern sich mit:

   ![Rückfrage beim Ersetzen](06-replace-confirm.png)

4. Auf **Importieren** klicken. Im häufigsten Fall – Sicherung ins selbe Panel zurückspielen oder Import in ein
   leeres Panel – ist nichts zu entscheiden, ein Klick genügt.

   ![Sicherung ins selbe Panel](01-same-panel-review.png)

5. Die **Zusammenfassung** zeigt, was angelegt, umbenannt, ersetzt oder übersprungen wurde und wo Sie PIN
   oder Passwort neu eingeben müssen.

   ![Zusammenfassung](07c-result-secrets.png)

6. **Speichern** drücken. Seiten, Screensaver, Tasten und Navigation gelten erst nach dem Speichern. Die
   **Panel-Einstellungen** (Timeout, Helligkeit usw.) werden dagegen schon beim Importieren sofort
   geschrieben.

### Gut zu wissen

- **Passwörter neu eingeben:** Enthielt die Datei keine PINs/Passwörter, bekommen neu angelegte Alarm- bzw.
  Entsperrseiten das globale Passwort der Instanz und QR-Seiten ein leeres WLAN-Passwort. Tragen Sie die
  richtigen Werte auf den in der Zusammenfassung genannten Seiten nach. Bereits vorhandene Seiten behalten
  ihre PIN.
- **Startseite:** Bringt die Datei eine Startseite mit, wird sie die Startseite des Ziel-Panels. Andere
  Panels, die bisher dieselbe Startseite hatten, behalten sie.
- **Seiten, die mehrere Panels nutzen:** Der Import ändert nur, was das Ziel-Panel zeigt. Nur
  „vorhandene ersetzen“ wirkt auch auf andere Panels – deshalb die Rückfrage.
- **Anderes Modell:** Stammt die Datei von einem Panel mit anderem Modell (z. B. EU-Panel → Smartphone hochkant),
  passen nicht immer gleich viele Elemente auf eine Seite bzw. in den Screensaver. Prüfen Sie die Seiten
  nach dem Import ([Beispiel](02-empty-panel-review.png)).
- Vorher zugeordnete Seiten des Ziel-Panels, die nicht in der Datei stehen, werden nur vom Panel gelöst, nicht
  gelöscht – sie bleiben in der Seitenliste.

---

## Screenshots für die Durchsicht

Aufgenommen mit Puppeteer gegen den Dev-Server (Admin auf Deutsch). Testdaten: Export von Panel **Webtest**
(web-p, 22 Seiten, Screensaver „Webtest“); **Leer** ist ein leeres Web-Panel (eu), **testpanel** ein
konfiguriertes Panel. Für die Konflikt-Szenarien wurde die exportierte Datei von Hand geändert (Überschriften
von `e2eLong`, `Unlock1` und `tom`).

| Bild | Szenario | Was prüfen |
| --- | --- | --- |
| `export-button.png` | Export-Knopf auf der Kachel (erster Stand) | – |
| `secrets-dialog.png` | Export mit PIN/Passwort-Seiten | Standard ist „Ohne Passwörter exportieren“ |
| `00-tile-export-import-buttons.png` | Kachel mit Export- und Import-Knopf | Reihenfolge der Knöpfe |
| `00b-import-groups.png` | Import, Schritt 1: Teile wählen | Texte der drei Gruppen |
| `01-same-panel-review.png`, `01b-same-panel-result.png` | 1: Export und Re-Import ins selbe Panel | alles „unverändert“, kein Überschreiben- und kein Passwort-Hinweis, Ergebnis „Unverändert (22)“ |
| `02-empty-panel-review.png`, `02b-empty-panel-result.png` | 2: Import in ein leeres Panel (älterer Stand der Texte) | kein Überschreiben-Hinweis; zugleich 8: Modell-Warnung web-p → eu |
| `03-configured-panel-review.png` | 3: Import in ein konfiguriertes Panel | Überschreiben-Hinweis nennt nur Teile, die sich wirklich ändern; Zähler „4 unverändert, 19 Zuweisung ergänzen“ |
| `04-conflicts-review.png` | 4/5: geänderte Seite → „umbenennen“ vorgeschlagen | `e2eLong` geändert; `e2eTarget`, `e2eStart`, `e2eFix` werden über die Verweise ebenfalls zum Konflikt; Passwort-Hinweis nennt nur neu angelegte Seiten |
| `05-diff-dialog.png` | 4: Unterschiede (Klick auf „unterschiedlich“) | lesbare Feldnamen („Überschrift“, „Navigation: zurück“) |
| `05b-diff-ripple.png` | 5: Unterschied nur durch Umbenennung | „Zielseite: e2eLong“ → „e2eLong_webtest“ |
| `06-replace-confirm.png` | 6: „vorhandene ersetzen“ bei geteilter Seite | Liste der mitbetroffenen Panels (inkl. „alle Panels“) |
| `07a-name-validation.png` | eigener Name „main“ (älterer Stand der Texte) | Fehlermeldung, „Importieren“ gesperrt |
| `07b-conflicts-edited.png` | sehr langer eigener Name | Layout bei langen Namen |
| `07c-result-secrets.png` | 7: Ergebnis mit „bitte neu eingeben“ | QR-Seite ohne Passwort; Umbenannt/Ersetzt/Unverändert getrennt |
| `09-invalid-file.png`, `09b-foreign-file.png` | 9: kaputte bzw. fremde Datei | verständliche Fehlermeldung |
| `10-dark-theme-review.png` | Konflikt-Übersicht im dunklen Theme (älterer Stand der Texte) | Kontraste |
