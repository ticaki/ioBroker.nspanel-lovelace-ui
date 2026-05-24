# PagePower (`cardPower`)

Die **PagePower** stellt bis zu 6 Verbraucher / Erzeuger dar und verrechnet sie. Sie bildet die Stromverteilung in eurem Smarthome ab – Icons, Farbverläufe, Geschwindigkeit der Flussrichtung sowie die Flussrichtung selbst lassen sich einstellen. Ihr könnt mehrere dieser Seiten erstellen.

Die Seite wird **vollständig im Admin** über den Tab **PageConfig** (Seitentyp **Leistung** / `cardPower`) konfiguriert – einschließlich ihrer Position in der Navigation (Bereich **Navigation/Panel**). Ein Eintrag im Konfigurationsskript ist dafür **nicht erforderlich**: Sind Seite *und* Navigation im Admin gesetzt, erscheint sie ohne jeden Skript-Bezug auf dem Panel.

> [!NOTE]
> Ein älterer, **separater Admin-Tab „Page Power"** existiert weiterhin (Legacy-Konfiguration). Er schreibt dieselben Daten (`pagePowerdata`) wie der neue PageConfig-Editor. **Empfohlen ist der Weg über PageConfig**, da dieser auch die Navigation übernimmt und ohne Skript auskommt.

**Inhalt**
+ [Funktionsweise](#funktionsweise)
+ [Einstellungen im Admin (PageConfig)](#einstellungen-im-admin-pageconfig)
    + [Erzeuger / Verbraucher (Slots)](#erzeuger--verbraucher-slots)
    + [Home (Mitte)](#home-mitte)
+ [Navigation / Panel](#navigation--panel)
+ [Optionaler Verweis im Skript](#optionaler-verweis-im-skript)

---

## Funktionsweise

Auf dem Panel zeigt die Seite je drei Slots links und rechts (oben / Mitte / unten) sowie in der Mitte das **Home**-Symbol (virtueller Stromkasten/Zähler), an dem alle Leistungen zusammenlaufen. Jeder belegte Slot stellt einen Verbraucher oder Erzeuger mit Icon, Wert und einer animierten Flussrichtung dar. Erzeuger sollten zur Mitte fließen, Verbraucher von ihr weg.

> 🖼️ **Bild fehlt:** Panel-Ansicht der Power-Seite mit Home-Symbol und Flussanimation.
> Pfad: `Pictures/pagePower/panel-power.png`

---

## Einstellungen im Admin (PageConfig)

Die allgemeine Bedienung des Tabs ist unter [Page Config](PageConfig) beschrieben und sollte vorab gelesen werden. Im Seitentyp-Auswahlfeld **Leistung** wählen, im Feld „neue Seite" einen im gesamten Panel eindeutigen Namen vergeben (= `uniqueName`) und mit dem Plus-Button anlegen. Anschließend erscheint in der Mitte das Slot-Layout (drei Felder links, drei rechts) mit dem **Home**-Bereich dazwischen.

Allgemeine Seitenfelder (wie bei allen PageConfig-Seiten):

| Feld (Admin-Label) | Schlüssel | Beschreibung |
|--------------------|-----------|--------------|
| Eindeutige ID | `uniqueName` | Eindeutiger Name der Seite, im gesamten Adapter einmalig. Muss bei Verwendung im Skript mit dem dortigen `uniqueName` übereinstimmen. |
| Überschrift | `headline` | Titel der Seite (oben mittig auf dem Panel). |
| Verhalten des Bildschirmschoners | `alwaysOn` | Standard-Timeout / Niemals aktivieren / Von der vorherigen Seite übernehmen (siehe [Navigation / Panel](#navigation--panel)). |
| Versteckt | `hidden` | Blendet die Seite aus, wenn der Datenpunkt `…cmd.hideCards` auf `true` steht. |

> 🖼️ **Bild fehlt:** PageConfig-Editor einer Power-Seite (Slot-Layout + Home).
> Pfad: `Pictures/pagePower/config.png`

### Erzeuger / Verbraucher (Slots)

Ein Klick auf einen Slot öffnet den Dialog **„Leistungs-Slot bearbeiten"**:

| Feld (Admin-Label) | Beschreibung |
|--------------------|--------------|
| **Anzeigename** | Text über der Flussanzeige, z. B. welcher Verbraucher/Erzeuger das ist. |
| **Icon** | Icon-Auswahl über das Selectfeld (mit Suchvorschlägen). |
| **Datenpunkt für Leistung** | Datenpunkt, der die Leistung (Watt) enthält. |
| **Nachkommastellen** | Anzahl der dargestellten Dezimalstellen, unabhängig vom Datenpunkt. |
| **Einheit** | Kleinste darzustellende Einheit. Per **AutoUnit** wird sie erhöht, sobald die Zahl vierstellig wird (z. B. 999 W → 1 kW). Eine im Datenpunkt definierte Einheit ist führend und überschreibt die Admin-Auswahl. |
| **Iconfarbe** | Feste Farbe des Icons (ColorPicker). Deaktiviert, wenn „Farbe vom Wert abhängig" aktiv ist. |
| **Farbe vom Wert abhängig** | Aktiviert die **Farbskala** – das Icon wechselt je nach Leistung die Farbe. |
| **Geschwindigkeitsskala** (min/max Leistung) | Wertebereich der Flussanimation. Beim Maximalwert läuft der Punkt mit 100 % Geschwindigkeit; bei 0 steht er und wird mit steigender Leistung prozentual schneller. |
| **Flussrichtung umkehren** | Kehrt die Animationsrichtung um (Erzeuger zur Mitte, Verbraucher von ihr weg). |

Bei aktiver **Farbskala** (`Farbe vom Wert abhängig`) bestimmen drei Werte den Verlauf von Grün nach Rot. Welcher Wert grün ist, entscheidet **beste Leistung für Farbe**:

+ **Beispiel 1** — 0 W grün, 100 W rot
    + `minimale Leistung für Farbe` = 0
    + `maximale Leistung für Farbe` = 100
    + `beste Leistung für Farbe` = 0

+ **Beispiel 2** — 0 W rot, 100 W grün
    + `minimale Leistung für Farbe` = 0
    + `maximale Leistung für Farbe` = 100
    + `beste Leistung für Farbe` = 100

+ **Beispiel 3** — -50 W rot, 0 W grün, 100 W wieder rot
    + `minimale Leistung für Farbe` = -50
    + `maximale Leistung für Farbe` = 100
    + `beste Leistung für Farbe` = 0

### Home (Mitte)

Home ist der mittlere Teil der Seite – der virtuelle Stromkasten mit seinem Zähler. Es gibt zwei Wertefelder:

+ **Haus oben** (`power_home_top`): Der Wert über dem Haus-Symbol. Datenpunkt festlegen, optional Nachkommastellen und Einheit wählen. Auch hier überschreibt eine Einheit aus dem Datenpunkt die Admin-Auswahl.
+ **Haus unten** (`power_home_bot`): Hat zwei Modi.
    + Ohne **Interne Summe verwenden (Haus unten)** verhält es sich wie *Haus oben* (eigener Datenpunkt).
    + Mit aktivierter interner Summe wird stattdessen eine aus den Slot-Werten **intern berechnete Summe** angezeigt. Über **Slots, die negativ in die Summe gehen** wählt ihr aus, welche der sechs Slots in diese Summe einfließen.

---

## Navigation / Panel

Im linken Fenster **„Navigation/Panel"** wird unter dem Reiter **„Navigation"** der Platz in der Seitenhierarchie festgelegt. Zuerst das Panel bzw. „alle" wählen, dann vor (`prev`) bzw. hinter (`next`) welcher Seite die Power-Seite liegen soll.

> [!NOTE]
> Nur eines der Felder **Prev** oder **Next** wählen. Über **Home** und **Parent** werden Haussymbol bzw. Pfeil-nach-oben eingeblendet und auf die gewählte Seite verlinkt.

Im Reiter **„Pagedetails"** lässt sich das Screensaver-Verhalten festlegen:
+ **Standard-Timeout** → Screensaver blendet sich nach der eingestellten Zeit ein.
+ **niemals aktivieren** → Seite bleibt sichtbar, bis manuell zur nächsten gewechselt wird.
+ **von der vorherigen Seite übernehmen** → übernimmt die Einstellung der vorherigen Seite.

---

## Optionaler Verweis im Skript

Ist die Power-Seite im Admin **inklusive Navigation** (Bereich **Navigation/Panel**) konfiguriert, **ist kein Skript-Eintrag nötig** – sie erscheint allein durch die Admin-Konfiguration auf dem Panel.

Ein Verweis im Skript ist nur dann sinnvoll, wenn die Panel-Navigation komplett über das Konfigurationsskript aufgebaut wird (statt über den Navigationsbereich des Admins). Dann genügt eine minimale Referenz mit identischem `uniqueName`; der Seiteninhalt kommt weiterhin aus dem Admin (`pagePowerdata`). Der Typ `PagePower` erbt die optionalen Navigationsparameter aus dem [Seiten-Basistyp](ScriptConfig#optionale-parameter) (`prev`, `next`, `home`, `parent` …).

```typescript
// Nur nötig, wenn die Navigation per Skript gesetzt wird – als Hauptseite unter pages
const powerGrid: ScriptConfig.PagePower = {
    type: 'cardPower',
    uniqueName: 'seitenname', // muss mit dem Namen im Admin übereinstimmen
};
```

```typescript
// … oder als Unterseite unter subPages
const energieAnzeige: ScriptConfig.PagePower = {
    type: 'cardPower',
    uniqueName: 'seitenname', // muss mit dem Namen im Admin übereinstimmen
    prev: 'uniqueName einer Seite',
    home: 'main',
};
```

> [!NOTE]
> Dieselbe `uniqueName` nicht gleichzeitig im Admin **mit** Navigation und im Skript positionieren. Standardmäßig hat die Skript-Seite Vorrang und der gleichnamige Admin-Eintrag wird mit einer Warnung übersprungen.

Mehr zum Einbinden von Seiten im Skript unter [ScriptConfig](ScriptConfig). Übersicht aller Seitentypen unter [Pages](Pages).
