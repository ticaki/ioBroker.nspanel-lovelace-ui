# Prompt: Schlagzeile und Popup des NSPanel per sendTo aus einem anderen Adapter

Diese Datei ist ein fertiger Prompt für Claude. Er beschreibt die sendTo-Schnittstelle von `nspanel-lovelace-ui` für die
**Schlagzeile** (Meldungszeile im Bildschirmschoner, `screensaverNotify`) und das **Popup** (`setPopupNotification`)
aus Sicht eines Aufrufers. Gedacht für eine Session in einem **anderen** Adapter oder Skript, der Meldungen an NSPanels
schicken will. Kompletten Text unterhalb der Linie an Claude geben, im Repository des aufrufenden Adapters.

---

Du baust in diesen Adapter (oder dieses Skript) eine Anbindung an den ioBroker-Adapter `nspanel-lovelace-ui` ein. Der
Adapter steuert Sonoff-NSPanels (und Web-Panels) und nimmt Meldungen per `sendTo` entgegen. Du bist hier **Nutzer** der
Schnittstelle: Du änderst nichts an `nspanel-lovelace-ui`, sondern schickst ihm Nachrichten. Den Code von
`nspanel-lovelace-ui` brauchst du nicht; alles Nötige steht unten.

## Die zwei Ziele

| Befehl | Was erscheint | Wann sichtbar |
|---|---|---|
| `screensaverNotify` | **Schlagzeile**: Überschrift + Text als Meldungszeile im Bildschirmschoner | nur im Bildschirmschoner |
| `setPopupNotification` | **Popup**: Vollbild-Meldung mit Überschrift, Text, bis zu 3 Tasten | sofort, über jeder Seite |

Beide verstehen weitgehend **dieselbe JSON**. Du kannst also eine Meldung bauen und sie je nach Wichtigkeit an einen
oder beide Befehle schicken. Felder, die ein Befehl nicht kennt, ignoriert er ohne Fehler.

Instanz: normalerweise `nspanel-lovelace-ui.0` – mach sie in deiner Konfiguration einstellbar.

```ts
// in einem Adapter
const answer = await this.sendToAsync('nspanel-lovelace-ui.0', 'screensaverNotify', message);
// in einem Skript (javascript-Adapter)
sendTo('nspanel-lovelace-ui.0', 'screensaverNotify', message, answer => { /* ... */ });
```

## Gemeinsame Felder

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | Kennung der Meldung. Gleiche `id` ersetzt die vorige Meldung, statt eine zweite anzulegen. Wähle stabile, sprechende ids mit einem eigenen Präfix, z. B. `myadapter.waschmaschine`. |
| `priority` | number | Kleiner = wichtiger. Standard **50**. `<= 0` **entfernt** die Meldung mit dieser `id`; `<= -100` entfernt **alle** Meldungen, deren `id` mit dieser `id` beginnt (Präfix). |
| `headline` | string | Überschrift. Bei der Schlagzeile wird auch der alte Name `heading` angenommen. |
| `text` | string | Text der Meldung. |
| `panel` | string \| string[] | Ziel-Panel(s): Name, Anzeigename (friendlyName) oder MQTT-Topic. **Fehlt es, geht die Meldung an alle Panels.** |
| `icon` | string | MDI-Iconname (ohne `mdi:`), z. B. `washing-machine`. Schlagzeile: steht vor der Überschrift. |
| `colorHeadline`, `colorText` | `{r,g,b}` oder `"#rrggbb"` | Farbe von Überschrift/Text. Fehlt = Farbe des Farbthemas. |
| `buzzer` | boolean \| string | Tonsignal beim Erscheinen. `true` = Standardton, String = eigene Tasmota-Buzzer-Folge (z. B. `"1,2,3,0xF54"`). Das Panel kann Töne nachts oder per Einstellung unterdrücken. |
| `type` | `'information'` \| `'acknowledge'` | `acknowledge`: Die Meldung muss quittiert werden – Antippen (Schlagzeile) bzw. die Taste (Popup) **entfernt** sie. `information` (Standard): bleibt, bis du sie entfernst. |
| `global` | boolean | Bei `acknowledge`: Quittieren auf einem Panel entfernt die Meldung auf **allen** Panels. Standard `true`, sobald die Meldung an mehrere Panels ging. |

Nur Schlagzeile:

| Feld | Bedeutung |
|---|---|
| `backgroundBlink` | `"#rrggbb"`: Hintergrund der Meldungszeile wechselt jede Sekunde zwischen Themenfarbe und dieser Farbe. Wirkt erst ab Panel-Firmware (TFT) 6.2.0 und im Web-Panel, ältere ignorieren es. |

Nur Popup (Schlagzeile ignoriert sie): `buttonLeft`, `buttonMid`, `buttonRight`, `colorButtonLeft`, `colorButtonMid`,
`colorButtonRight`, `buttonLeftIcon`, `buttonRightIcon`, `iconColor`, `largeIcon`, `textSize`, `alwaysOn`.

## Verhalten der Schlagzeile mit `id`

- Pro Panel gibt es eine **Warteschlange** von höchstens 10 Meldungen. Angezeigt wird immer nur **eine**: die mit der
  kleinsten `priority`. Ist die Warteschlange voll, fällt die unwichtigste heraus – das kann auch die gerade geschickte
  sein.
- Eine Meldung mit bereits vorhandener `id` ersetzt den Inhalt und behält ihren Platz unter den Meldungen gleicher
  Priorität.
- Die Warteschlange wird mit den Meldungen gemischt, die der Nutzer im Admin von `nspanel-lovelace-ui` eingerichtet hat
  (deren Standard-Priorität ist 99). Bei **gleicher** Priorität gewinnt deine sendTo-Meldung; unter sendTo-Meldungen
  gleicher Priorität gewinnt die ältere.
- Antippen: Bei `type: 'acknowledge'` wird die Meldung entfernt (mit `global` auf allen Panels). Bei `information`
  blendet ein Tipp sie nur vorübergehend aus; sie erscheint wieder, solange du sie nicht entfernst.
- `buzzer` ertönt nur, wenn die Meldung neu zur angezeigten wird, und nur im Tagmodus des Panels, wenn dort Töne erlaubt
  sind.
- Entfernen: dieselbe `id` mit `priority: 0` schicken (oder `enabled: false`). Alle eigenen auf einmal entfernen:
  `{ id: 'myadapter.', priority: -100 }`.
- Ändert sich nur der Inhalt einer angezeigten Meldung oft (z. B. Restlaufzeit), drosselt das Panel die Aktualisierung
  selbst. Du musst nicht entprellen, schick aber keine sinnlosen Wiederholungen.
- Nach einem Neustart von `nspanel-lovelace-ui` ist die Warteschlange leer. Wenn deine Meldungen einen Zustand abbilden,
  schicke sie bei Bedarf erneut (z. B. beim Start deines Adapters und bei Zustandsänderung).

## Alter Weg ohne `id` (nur Schlagzeile)

Ohne `id` (oder mit leerer `id`) belegt `screensaverNotify` den alten **Einzelplatz**:
`{ panel, heading, text, enabled }` (`headline` wird als Ersatz für `heading` angenommen, `panel` wie oben, fehlt =
alle Panels). Dieser Platz überdeckt alle anderen Meldungen, solange er aktiv ist, und `enabled` fehlt =
**ausgeschaltet**. Felder wie `priority`, `icon` oder Farben wirken hier nicht. Nutze ihn in neuem Code nicht; er existiert nur zur Kompatibilität.

## Antworten

- `screensaverNotify`: `{ result: 'ok' }`, sobald mindestens ein Ziel-Panel die Meldung bekommen hat, sonst
  `{ error: 'sendToAnyError' }` (kein Panel gefunden, Adapter noch nicht bereit). Unbekannte Panel-Namen in einer Liste
  landen nur im Log von `nspanel-lovelace-ui`.
- `setPopupNotification`: `[]` bei Erfolg oder `{ error: 'No Panels Online' }`.

Werte nur aus, ob ein `error`-Feld vorhanden ist, und logge es als Warnung. Kein Wiederholen in einer Schleife.

## Ältere Versionen von `nspanel-lovelace-ui`

Die Warteschlange der Schlagzeile mit `id` gibt es ab der nächsten Version nach **2.4.1**. Ältere Versionen kennen bei der Schlagzeile nur den alten Weg: Sie ignorieren `id`, `priority`, `headline` usw., lesen
`panel` nur als MQTT-Topic und schalten ohne `enabled: true` aus. Wenn dein Code mit alten und neuen Versionen laufen
soll, schick bei der Schlagzeile zusätzlich:

- `heading` mit demselben Wert wie `headline`,
- `enabled: true` beim Anzeigen (neue Versionen ignorieren `enabled: true` bei Meldungen mit `id`),
- `panel` als MQTT-Topic.

Beim Entfernen (`priority: 0`) schaltet eine alte Version dann den Einzelplatz aus – das ist das gewünschte Ergebnis.
Nur das Präfix-Entfernen und mehrere gleichzeitige Meldungen gibt es dort nicht.

## Beispiele

```ts
// Anzeigen (Schlagzeile, alle Panels)
{ id: 'myadapter.washer', priority: 40, headline: 'Waschmaschine', text: 'fertig', icon: 'washing-machine',
  type: 'acknowledge', buzzer: true }

// dieselbe Meldung zusätzlich als Popup mit Taste
await this.sendToAsync(instance, 'setPopupNotification',
  { id: 'myadapter.washer', priority: 40, headline: 'Waschmaschine', text: 'fertig', type: 'acknowledge',
    buttonRight: 'OK', panel: ['Küche'] });

// entfernen
{ id: 'myadapter.washer', priority: 0 }

// alle Meldungen dieses Adapters entfernen
{ id: 'myadapter.', priority: -100 }
```

## So gehst du vor

1. Lies, wie dieser Adapter Ereignisse erzeugt, und schlag mir vor, **welche** davon als Schlagzeile, welche als Popup
   und welche als beides gehen sollen, mit Priorität und `type`. Frag nach, bevor du baust.
2. Kapsle die Schnittstelle in **einer** Funktion/Klasse (Nachricht bauen, senden, Antwort prüfen, entfernen), statt
   `sendTo` an vielen Stellen zu verstreuen. Instanz und Ziel-Panels kommen aus der Konfiguration.
3. Verwende stabile ids mit festem Präfix und entferne Meldungen aktiv, wenn ihr Grund wegfällt.
4. Prüfe nicht, ob `nspanel-lovelace-ui` installiert ist, durch Raten – fehlt die Instanz, bekommst du keine Antwort
   (Timeout) bzw. einen Fehler; behandle das ruhig mit einer Warnung.
5. Halte dich an die Regeln dieses Repositories (Sprache, Lint, Tests) und dokumentiere die neue Option für die Nutzer
   dieses Adapters.
