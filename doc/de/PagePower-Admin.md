# Energie-Seite – Konfiguration im Admin

Die Energie-Seite zeigt ein Haus in der Mitte und bis zu **sechs Energieflüsse** darum herum — Photovoltaik, Netzbezug, Batterie, Wärmepumpe, Wallbox. Zu jedem Fluss gehören ein Symbol, ein Wert und eine **Animation**, deren Geschwindigkeit sich nach der Leistung richtet.

Angelegt wird sie im Tab **PageConfig**, Seitentyp **Leistung**.

Inhalt:
- [Seite anlegen](#1-seite-anlegen)
- [Das Raster: sechs Flächen um das Haus](#2-das-raster-sechs-flächen-um-das-haus)
- [Einen Fluss einrichten](#3-einen-fluss-einrichten)
- [Farbe nach Wert: die Farbskala](#4-farbe-nach-wert-die-farbskala)
- [Geschwindigkeit und Flussrichtung](#5-geschwindigkeit-und-flussrichtung)
- [Die beiden Hauswerte](#6-die-beiden-hauswerte)
- [Die interne Summe](#7-die-interne-summe)
- [Was auf dem Panel ankommt](#8-was-auf-dem-panel-ankommt)
- [Panel-Zuweisung und Navigation](#9-panel-zuweisung-und-navigation)

## 1. Seite anlegen

1. Instanz-Einstellungen öffnen → Tab **PageConfig**.
2. Links als Seitentyp **Leistung** wählen, einen Namen eintragen, **+** drücken.

**Überschrift** ist die Kopfzeile am Panel; leer zeigt das Panel den Seitennamen.

## 2. Das Raster: sechs Flächen um das Haus

Der Editor bildet die Karte als **Raster von drei mal drei** ab: links drei Flächen, rechts drei Flächen, in der Mitte oben **Haus oben**, in der Mitte das Haussymbol und darunter **Haus unten**.

- **Klick auf eine Fläche** öffnet den Dialog *Leistungs-Slot bearbeiten*.
- **Die sechs Flächen lassen sich mit der Maus tauschen** — anfassen und auf eine andere Fläche ziehen. So ordnet man die Flüsse, ohne sie neu einzutragen.
- Das **Papierkorb-Symbol** auf einer Fläche leert sie wieder.
- Eine leere Fläche zeigt *(leer - zum Konfigurieren klicken)*.

**Es sind immer genau sechs Flächen** — nicht mehr, nicht weniger. Nicht belegte bleiben leer.

> Das Ziehen funktioniert nur mit einem Zeigegerät und nur, wenn die Instanz läuft.

## 3. Einen Fluss einrichten

Im Dialog *Leistungs-Slot bearbeiten*:

| Feld | Bedeutung |
|---|---|
| **Anzeigename** | Die Beschriftung neben dem Symbol. Bleibt sie leer, steht dort „Leistung" mit der Nummer der Fläche. |
| **Icon** | Das Symbol des Flusses, aus der Symbolliste. |
| **Datenpunkt für Leistung** | Der Messwert. Die Auswahl zeigt nur Datenpunkte vom Typ Zahl. **Ohne ihn bleibt die Fläche am Panel leer** — gewarnt wird nicht. |
| **Nachkommastellen** | 0, 1 oder 2. |
| **Einheit** | W, kW oder MW — die **kleinste** Einheit, ab der der Adapter automatisch hochrechnet. |
| **Iconfarbe** | Eine feste Farbe für das Symbol. Gesperrt, sobald die Farbskala aktiv ist. |

Derselbe Datenpunkt versorgt **Wert und Animation** zugleich.

> **Die Einheit des Datenpunkts gewinnt.** Steht in `common.unit` des Datenpunkts eine Einheit, hat sie Vorrang vor der Auswahl im Dialog.

> **Erzeugung und Verbrauch werden nicht eingestellt**, sie ergeben sich aus dem **Vorzeichen** des Messwerts und dem Haken *Flussrichtung umkehren*. Die Konvention lautet: Erzeuger fließen **zum Haus hin**, Verbraucher **davon weg**. In der Oberfläche steht dieser Satz nirgends — er ist aber der Schlüssel zu einer stimmigen Darstellung.

> Die drei Dialoge dieser Seite haben nur **„schließen"**, kein Abbrechen: Jede Eingabe wirkt sofort auf die Seite. Und anders als die Hauptmaske bleiben die Felder **auch bei gestoppter Instanz** bedienbar — ein Unterschied, der leicht in die Irre führt.

## 4. Farbe nach Wert: die Farbskala

Mit **Farbe vom Wert abhängig** färbt sich das Symbol je nach Leistung ein — grün bei viel Ertrag, rot bei viel Bezug. Dann erscheinen drei Felder:

| Feld | Bedeutung |
|---|---|
| **minimale Leistung für Farbe** | Der untere Rand der Skala. |
| **maximale Leistung für Farbe** | Der obere Rand. |
| **beste Leistung für Farbe** | Der Wert, der als „gut" gilt und die Mitte des Verlaufs bekommt. |

Gerechnet wird mit einem Rot-Grün-Verlauf über diese drei Punkte.

> Die Felder nehmen **jede** Zahl an — es wird nicht geprüft, ob das Minimum unter dem Maximum liegt, und ein leeres Feld ergibt keinen gültigen Wert.

> Die zuvor gesetzte **Iconfarbe bleibt gespeichert**, auch wenn die Skala aktiv ist und das Feld gesperrt erscheint. Schaltet man die Skala später ab, ist die alte Farbe wieder da.

## 5. Geschwindigkeit und Flussrichtung

Der Abschnitt **Geschwindigkeitsskala** steuert die Animation — sie läuft umso schneller, je größer die Leistung.

| Feld | Bedeutung |
|---|---|
| `powerMinValueForSpeed` | Die Leistung, ab der sich etwas bewegt. |
| **maximale Leistung** | Die Leistung, bei der die Animation am schnellsten läuft. |
| **Flussrichtung umkehren** | Dreht die Laufrichtung um — für Flüsse, deren Datenpunkt das Vorzeichen andersherum führt. |

> ⚠️ **Das erste Feld zeigt den rohen Schlüssel `powerMinValueForSpeed` statt einer Beschriftung** — dem Adapter fehlt die Übersetzung, in beiden Sprachen. Gemeint ist die **minimale Leistung für die Geschwindigkeit**, das Gegenstück zum Feld darunter.

> Die Beschriftung **maximale Leistung** gibt es faktisch zweimal: hier für die Animation, weiter oben als *maximale Leistung für Farbe* für den Farbverlauf. Auseinanderhalten kann man sie nur über die Abschnittsüberschriften *Farbskala* und *Geschwindigkeitsskala*.

## 6. Die beiden Hauswerte

Über und unter dem Haussymbol steht je ein Wert, eingerichtet über die Flächen **Haus oben** und **Haus unten**. Beide kennen nur Datenpunkt, Nachkommastellen und Einheit — kein Symbol, keinen Namen.

Üblich: oben der aktuelle Verbrauch des Hauses, unten die Bilanz oder die Einspeisung.

> Neben dem Haussymbol lässt sich **kein Name** anzeigen. Das Feld dafür existiert im Datenmodell, wird vom Adapter aber nie gefüllt, und die Oberfläche bietet es gar nicht erst an.

## 7. Die interne Summe

Statt eines eigenen Datenpunkts kann **Haus unten** eine Summe aus den sechs Flüssen zeigen. Dafür den Haken **Interne Summe verwenden (Haus unten)** setzen; das Feld für den Datenpunkt verschwindet, stattdessen erscheint eine Mehrfachauswahl der Flächen *Leistung 1* bis *Leistung 6*.

Die ausgewählten Flächen werden **addiert**, die übrigen zählen als null.

> ⚠️ **Die deutsche Beschriftung sagt das Gegenteil.** Dort steht „Slots, die **negativ** in die Summe gehen" — tatsächlich gehen die ausgewählten Flächen **unverändert, also positiv** in die Summe ein, und alle nicht ausgewählten mit null. Negiert wird nichts. Die englische Fassung („Slots that contribute to the sum") beschreibt es richtig. Beim Einrichten also: **die Flächen auswählen, die zur Summe beitragen sollen.**

> **Leere Auswahl bedeutet „alle sechs".** Setzt man den Haken und wählt nichts aus, summiert der Adapter **alle** Flächen. Der Haken liefert also sofort ein Ergebnis, das man so nicht ausgewählt hat.

## 8. Was auf dem Panel ankommt

Die Karte ist fest aufgebaut: Überschrift, Haussymbol mit zwei Werten, sechs Flüsse mit Symbol, Name, Wert und Animation. Aktualisiert wird höchstens alle zwei Sekunden.

> **Für den Wert stehen sechs Zeichen zur Verfügung.** Reicht der Platz nicht, rechnet der Adapter selbsttätig auf die nächstgrößere Einheit hoch und **kürzt notfalls die Nachkommastellen**. Die Einstellung *Nachkommastellen* ist damit ein Wunsch, keine Zusage: Aus `1234.5 W` wird eher `1.2 kW`.

## 9. Panel-Zuweisung und Navigation

Panel, Navigationsziele, *Startseite*, *Versteckt* und *Verhalten des Bildschirmschoners* liegen in der rechten Spalte, beschrieben unter [PageConfig – Übersicht](PageConfig#panelzuweisung-und-navigation).
