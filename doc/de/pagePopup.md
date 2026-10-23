# Popups

Im Adapter heißen **zwei verschiedene Dinge** Popup:

1. **Detail-Popups einer Fläche** — Licht, Rollladen, Thermostat, Timer, Auswahlliste. Sie gehen auf, wenn
   man auf einer Seite länger oder gezielt auf eine Fläche tippt, und gehören zum jeweiligen Pageitem;
   eingestellt werden sie dort (siehe [Wiederkehrende Dialoge](PageConfig-Dialoge)).
2. **Das Meldungs-Popup** — eine eigene Seite, die eine Nachricht über alles andere legt. Um die geht es
   hier.

> **Das Meldungs-Popup wird nirgends angelegt.** Es ist eine **Systemseite**: Jedes Panel bekommt beim
> Start zwei davon — eine für die Systemmeldungen des Adapters und eine für eigene Meldungen. Im Admin
> gibt es diesen Seitentyp nicht, im Konfigurationsskript auch nicht. Gesteuert wird die Seite
> ausschließlich über **Datenpunkte** oder über **`sendTo`**.

## Weg 1: die Datenpunkte

Je Panel liegt unter `nspanel-lovelace-ui.<Instanz>.panels.<Panel>.cmd.pagePopup.` ein Satz Felder.
Man füllt sie und löst dann **`activate`** aus — erst dieser Knopf liest **alle** Felder und schickt die
Meldung ab.

| Datenpunkt | Typ | Vorgabe | Bedeutung |
|---|---|---|---|
| `id` | string | leer | Name zum Wiedererkennen. **Leer löscht alle** gespeicherten Popups. |
| `global` | boolean | false | An alle Panels statt nur an dieses. |
| `activate` | button | — | Löst den Versand aus. |
| `priority` | number | 50 | Kleiner = weiter vorn. **≤ 0 löscht** das Popup mit dieser `id`, **≤ −100** alle, deren `id` damit beginnt. |
| `type` | string | `information` | `information` oder `acknowledge`. |
| `headline` / `colorHeadline` | string / json | leer / weiß | Überschrift und ihre Farbe. |
| `text` / `colorText` | string / json | leer / weiß | Meldungstext und seine Farbe. |
| `buttonLeft` / `buttonMid` / `buttonRight` (+ `colorButton…`) | string / json | leer / weiß | Beschriftung und Farbe der drei Knöpfe. |
| `icon` / `iconColor` | string / json | leer | Symbol vor der Überschrift. |
| `textSize` | number 1–5 | 3 | Schriftgröße und damit, wie viele Zeilen passen. |
| `buzzer` | boolean | false | Einmaliger Ton beim Anzeigen. |
| `alwaysOn` | boolean | **true** | Popup bleibt stehen, statt in den Bildschirmschoner zu laufen. |

Auf diesem Weg gilt:

- **Leere Felder bleiben leer.** Die Ersatztexte *Missing Headline* / *Missing Text* gibt es nur auf dem
  `sendTo`-Weg.
- **Der Summer kann hier nur an oder aus sein.** Ein eigenes Tasmota-Muster lässt sich nur über `sendTo`
  mitgeben — und gesummt wird ohnehin nur, wenn am Panel `cmd.isBuzzerAllowed` gesetzt ist.
- **`textSize` kennt am Datenpunkt nur 1 bis 5.** Die Größe 0 nimmt nur `sendTo` entgegen.

## Weg 2: `sendTo`

Aus einem Skript heraus ist das der bequemere Weg, weil alles in einem Rutsch geht:

```javascript
sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', {
    id: 'test3',
    headline: 'test3',
    buttonLeft: 'weiter',
    buttonRight: 'oki',
    text: 'Es lebt!!!'
});
```

Ausführlich, mit allen Feldern, die der Adapter auswertet:

```typescript
type PagePopupDataDetails = {
    id?: string;                 // fehlt → 'missing'
    priority?: number;           // fehlt → 50
    type?: 'information' | 'acknowledge';   // fehlt → 'information'
    headline: string;            // fehlt → 'Missing Headline'
    text: string;                // fehlt → 'Missing Text'
    panel?: string | string[];   // fehlt → an alle Panels
    global?: boolean;            // nur false schaltet global ab
    colorHeadline?: { r: number; g: number; b: number } | string;
    buttonLeft?: string;
    colorButtonLeft?: { r: number; g: number; b: number } | string;
    buttonMid?: string;
    colorButtonMid?: { r: number; g: number; b: number } | string;
    buttonRight?: string;
    colorButtonRight?: { r: number; g: number; b: number } | string;
    colorText?: { r: number; g: number; b: number } | string;
    textSize?: string;           // 0–5
    icon?: string;
    iconColor?: { r: number; g: number; b: number } | string;
    alwaysOn?: boolean;          // fehlt → true
    buzzer?: boolean | string;   // true oder ein Tasmota-Muster
};

const message: PagePopupDataDetails = {
    id: 'test3',
    priority: 49,
    headline: 'test3',
    buttonLeft: 'weiter',
    buttonRight: 'oki',
    text: 'Es lebt!!!',
    type: 'information',
};

sendTo('nspanel-lovelace-ui.0', 'setPopupNotification', message);
```

Die Farbfelder nehmen ein `{r,g,b}`-Objekt **oder** eine Zeichenkette wie `#ff0000`. Ein unbrauchbarer
Wert fällt stillschweigend auf die Standardfarbe zurück. Ist **kein Panel online**, meldet der Adapter das
im Rückruf (`{ error: 'No Panels Online' }`); ein Panelname, den es nicht gibt, landet als Fehler im Log.

## Die Warteschlange

Mehrere Meldungen liegen nebeneinander und werden **aufsteigend nach `priority`** sortiert — die kleinste
Zahl steht vorn. Das Panel zeigt immer die vorderste.

> **Höchstens zehn Popups** hält der Adapter je Panel vor; was darüber hinaus ankommt, fällt hinten weg.
> Ein fehlerhaftes JSON wird **ohne Meldung verworfen** — kein Logeintrag, keine Reaktion am Panel.

## Die Knöpfe, das X und die Rückmeldungen

| Knopf | Wirkung |
|---|---|
| **links** | Blättert zur nächsten Meldung. Liegt mehr als eine an und ist das Feld leer, beschriftet der Adapter den Knopf selbst mit *Next*. |
| **Mitte** | Nimmt die aktuelle Meldung aus der Warteschlange und kehrt zur vorherigen Seite zurück. |
| **rechts** | Bestätigt und löscht. Bei `type: 'acknowledge'` ohne eigene Beschriftung steht dort **`ok`** — der Typ bleibt dabei `acknowledge`. |
| **X** | Schließt die Meldung auf dem Panel, an dem gedrückt wurde. Bei `acknowledge` **und** `alwaysOn` kommt sie nach **fünf Minuten** von selbst wieder. |

Was gedrückt wurde, steht hinterher in Datenpunkten — **nicht** unter `cmd`:

- je Panel: `…panels.<Panel>.pagePopup.id`, `.buttonLeft`, `.buttonMid`, `.buttonRight`
- für alle Panels zusammen: `nspanel-lovelace-ui.<Instanz>.pagePopup.id`, `.buttonLeft`, `.buttonMid`,
  `.buttonRight`

> **Beim linken Knopf stimmt das nicht ganz:** Der Adapter schreibt dort den Wert **mit** vorangestelltem
> Panelnamen in den **lokalen** Datenpunkt und den globalen gar nicht — bei Mitte und rechts ist es
> umgekehrt richtig herum (lokal die reine `id`, global mit Panelnamen). Wer auf den linken Knopf reagiert,
> prüft den Wert also besser mit „endet auf meine id".

## Darstellung am Panel

- **Langer Text rotiert.** Passt der Text nicht in die Zeilen, die `textSize` erlaubt, blättert das Panel
  ihn durch (etwa 3 Sekunden je Abschnitt, bei der Rückkehr zum Anfang kürzer).
- **Ein unbekanntes Symbol lässt der Adapter weg** und schickt die Meldung ohne Symbol.
- **`alwaysOn: true` hält das Popup offen**, sonst greift der Panel-Timeout und der Bildschirmschoner
  übernimmt. Tippt man den Bildschirmschoner an, holt das Panel ein offenes Popup zurück.
