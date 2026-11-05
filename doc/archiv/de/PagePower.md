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
