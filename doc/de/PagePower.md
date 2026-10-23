# Page Power

Die Energie-Seite zeichnet den Stromfluss im Haus: bis zu sechs Quellen und Verbraucher, die in die Mitte
— den virtuellen Verteilerkasten — hinein- oder aus ihm herausfließen. Die Punkte laufen umso schneller,
je größer die Leistung ist, und das Symbol kann seine Farbe nach dem Wert wechseln.

> **Eingerichtet wird sie im Admin**, im Tab *PageConfig*: [Energie-Seite – Konfiguration im
> Admin](PagePower-Admin). Dort stehen alle Felder — die sechs Flächen, der Slot-Dialog mit Einheit und
> Nachkommastellen, die Farbskala, Geschwindigkeit und Flussrichtung, die beiden Hauswerte und die interne
> Summe.

<img alt='Energie-Seite im Editor' src='../Pictures/pagePower/pagePowerallg.png'>

## Was am Panel ankommt

- **Sechs Flächen** rund um das Haus: drei links, drei rechts. Jede zeigt Symbol, Wert und Einheit; eine
  optionale Beschriftung steht darüber.
- **Die Mitte** ist das Haus mit zwei Werten — einer über, einer unter dem Symbol. Der untere kann statt
  eines eigenen Datenpunkts die **Summe der eingespeisten Flüsse** zeigen.
- **Die Bewegungsrichtung** sagt, wohin die Energie läuft: Erzeuger fließen zur Mitte, Verbraucher von ihr
  weg. Bei 0 W steht der Punkt still.
- Die Einheit wächst automatisch mit: aus 999 W wird bei der nächsten Stufe 1 kW.

<img alt='Haus mit den beiden Werten' src='../Pictures/pagePower/pagePowerHome.png'>

## Zweiter Weg: der alte Tab *Page Power* plus Skript

Neben dem Editor im Tab *PageConfig* gibt es weiterhin den älteren Tab **Page Power**. Eine dort angelegte
Seite erscheint **nicht von selbst** auf einem Panel: Sie braucht einen Eintrag im Konfigurationsskript mit
demselben `uniqueName`.

```typescript
// als Hauptseite unter pages
const powerGrid: ScriptConfig.PagePower = {
    uniqueName: 'seitenname', // wie im Admin
    type: 'cardPower',
};

// als Unterseite unter subPages
const energieAnzeige: ScriptConfig.PagePower = {
    prev: 'uniqueName einer Seite',
    home: 'main',
    uniqueName: 'seitenname',
    type: 'cardPower',
};
```

```typescript
pages: [powerGrid],
subPages: [energieAnzeige],
```

Der Adapter sucht den `uniqueName` in der Tabelle des alten Tabs (`pagePowerdata`). Findet er ihn nicht,
meldet er *No pagePowerdata found for …* und lässt die Seite weg.

> **Für Seiten aus dem Tab *PageConfig* gilt das nicht.** Die baut der Admin selbst und weist sie dem Panel
> direkt zu — dort ist **kein Skripteintrag nötig**, und ein Verweis aus dem Skript findet eine solche Seite
> auch gar nicht: Er sucht nur in der Tabelle des alten Tabs. Welche Felder es gibt, steht auf der
> [Admin-Seite](PagePower-Admin).
