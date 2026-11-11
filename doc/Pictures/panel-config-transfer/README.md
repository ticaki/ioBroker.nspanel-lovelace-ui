# Panel-Konfiguration exportieren / importieren – Screenshots

Aufgenommen mit Puppeteer gegen den Dev-Server (Admin auf Deutsch). Testdaten: Export von Panel **Webtest**
(web-p, 22 Seiten, Screensaver „Webtest“); **Leer** ist ein leeres Web-Panel (eu), **testpanel** ein
konfiguriertes Panel. Für die Konflikt-Szenarien wurde die exportierte Datei von Hand geändert (Überschriften
von `e2eLong`, `Unlock1` und `tom`).

| Bild | Szenario | Was prüfen |
| --- | --- | --- |
| `export-button.png` | Export-Knopf auf der Kachel (erster Stand) | – |
| `secrets-dialog.png` | Export mit PIN/Passwort-Seiten | Standard ist „Ohne Passwörter exportieren“ |
| `00-tile-export-import-buttons.png` | Kachel mit Export- und Import-Knopf | Reihenfolge der Knöpfe |
| `00b-import-groups.png` | Import, Schritt 1: Gruppen wählen | Texte der drei Gruppen |
| `01-same-panel-review.png`, `01b-same-panel-result.png` | 1: Export und Re-Import ins selbe Panel | nur „Zuweisung ergänzen“, kein Konflikt, ein Klick |
| `02-empty-panel-review.png`, `02b-empty-panel-result.png` | 2: Import in ein leeres Panel | kein Überschreiben-Hinweis; zugleich 8: Modell-Warnung web-p → eu |
| `03-configured-panel-review.png` | 3: Import in ein konfiguriertes Panel | Überschreiben-Hinweis oben, Hinweis „cmd.* sofort“ |
| `04-conflicts-review.png` | 4/5: geänderte Seite → „umbenennen“ vorgeschlagen | `e2eLong` geändert; `e2eTarget`, `e2eStart`, `e2eFix` werden über die Verweise ebenfalls zum Konflikt |
| `05-diff-dialog.png` | 4: Detail-Unterschiede (Klick auf „unterschiedlich“) | Feld `headline`, Navigation |
| `05b-diff-ripple.png` | 5: Unterschied nur durch Umbenennung | `targetPage: e2eLong` → `e2eLong_webtest` |
| `06-replace-confirm.png` | 6: „vorhandene ersetzen“ bei geteilter Seite | Liste der mitbetroffenen Panels (inkl. „alle Panels“) |
| `07a-name-validation.png` | eigener Name „main“ | Fehlermeldung, „Importieren“ gesperrt |
| `07b-conflicts-edited.png` | sehr langer eigener Name | Layout bei langen Namen |
| `07c-result-secrets.png` | 7: Ergebnis mit „bitte neu eingeben“ | QR-Seite ohne Passwort; Umbenannt/Ersetzt/ausgeblendete ALL-Seite |
| `09-invalid-file.png`, `09b-foreign-file.png` | 9: kaputte bzw. fremde Datei | verständliche Fehlermeldung |
| `10-dark-theme-review.png` | Konflikt-Übersicht im dunklen Theme | Kontraste |
