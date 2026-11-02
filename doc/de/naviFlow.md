# Navigation Flow

Dieser Tab zeichnet die **Navigation eines Panels als Graph**: Jede Seite ist ein **Knoten**, jede Verbindung zwischen zwei Seiten eine **Linie**. Damit lässt sich auf einen Blick prüfen, ob die Seiten so zusammenhängen, wie es gedacht war, und woher jede Seite kommt. Seit 2.0.0 ist der Tab außerdem ein **Editor**: Mit dem Haken *Navigation bearbeiten* werden `prev`, `next`, `home` und `parent` direkt im Graphen gezogen statt Feld für Feld im Tab [PageConfig](PageConfig).

<!-- Bild folgt: Navigation Flow mit Kopfzeile, vollständiger Legende und Graph (Bildauftrag 1) -->

Inhalt:
- [Was der Tab zeigt](#1-was-der-tab-zeigt)
- [Kopfzeile: Filter und Knöpfe](#2-kopfzeile-filter-und-knöpfe)
- [Die Legende lesen](#3-die-legende-lesen)
- [Anordnen und Einklappen](#4-anordnen-und-einklappen)
- [Seitendetails rechts](#5-seitendetails-rechts)
- [Navigation bearbeiten](#6-navigation-bearbeiten)
- [Geltungsbereich bei Seiten für alle Panels](#7-geltungsbereich-bei-seiten-für-alle-panels)
- [Skript-Seiten überschreiben](#8-skript-seiten-überschreiben)
- [Speichern und Neustart](#9-speichern-und-neustart)
- [Fallstricke](#fallstricke)

## 1. Was der Tab zeigt

Der Graph zeigt **das, was der Adapter beim letzten Start wirklich gebaut hat** — nicht den Inhalt des Formulars. Gezeigt wird je Panel:

- **Seiten** als Knoten, mit dem Namen, unter dem die Seite in der Navigation angesprochen wird (die Startseite immer als `main`).
- **Navigationsverweise** als farbige Linien: `prev`, `next`, `home`, `parent`.
- **Zielseiten** von Flächen: der kurze Druck auf ein PageItem führt zu einer Seite, der lange Druck zu einer zweiten. Ein Ziel, das auf beiden Wegen erreichbar ist, wird nur einmal gezeichnet (als kurzer Druck).
- **Datenpunkte und Channels**, mit denen eine Seite arbeitet — auf Wunsch als eigene Knoten. Auch ein Navigationsziel, das aus einem Datenpunkt gelesen wird, bekommt so einen Knoten: wohin es führt, steht erst zur Laufzeit fest, woher es kommt, ist aber zu sehen.

Der Tab braucht eine **laufende Instanz**. Oben rechts steht **Adapter online** bzw. **Adapter offline**; antwortet der Adapter nicht innerhalb von drei Sekunden, erscheint statt des Graphen „Keine Daten – Der Adapter ist möglicherweise offline oder es ist kein Panel konfiguriert."

## 2. Kopfzeile: Filter und Knöpfe

| Bedienelement | Wirkung |
|---|---|
| **Panel-Auswahl** (unter der Legende) | Wählt das Panel, dessen Navigation gezeigt wird. Die Auswahl merkt sich der Browser und stellt sie beim nächsten Besuch wieder her. |
| **Systemseiten anzeigen** | Blendet die internen Seiten (`///…`) ein oder aus. Die Entsperrseite `///unlock` bleibt immer sichtbar. Seiten, die beim Einschalten neu auftauchen, werden um die stehenden Knoten herum platziert. |
| **Datenpunkte anzeigen** | Blendet die Datenpunkt- und Channel-Knoten ein. Sie stehen in einer äußeren Spalte rechts auf Höhe ihrer Seite und verschieben keine Seite. |
| **Home-Verbindungen zu main anzeigen** | Aus geschaltet verschwinden die `home`-Linien, die auf `main` zeigen — in großen Konfigurationen hat fast jede Seite eine, und sie überdecken alles andere. Sichtbar bleiben sie bei der gerade angeklickten Seite und bei Seiten mit ungespeicherten Änderungen. Der Zustand wird **je Panel** gemerkt. |
| **Navigation bearbeiten** | Schaltet den Editiermodus ein, siehe [Abschnitt 6](#6-navigation-bearbeiten). Der Haken bleibt gesperrt, solange keine Navigationsdaten vorliegen oder das Panel kein Topic meldet. |
| **Aktualisieren** | Holt die Navigationsdaten neu vom Adapter. Noch nicht gespeicherte Änderungen an Verweisen bleiben erhalten. |
| **Automatisches Layout** (Hauptknopf) | Platziert **nur Knoten ohne gespeicherte Position**, und zwar neben der Seite, die zu ihnen führt. Alle übrigen Knoten bleiben, wo sie sind. Gibt es nichts zu platzieren, meldet eine Einblendung „Alle Knoten haben bereits eine Position". |
| **▾ neben dem Knopf** | Menü mit *Nur Knoten ohne Position platzieren* (dasselbe wie der Hauptknopf) und *Alles neu anordnen…*. |
| **Alles neu anordnen…** | Ordnet **jeden sichtbaren Knoten** neu an (Baum ab der Hauptseite, bei vielen Seiten in mehreren Bändern nebeneinander). ⚠️ Überschreibt alle selbst gesetzten Positionen — deshalb fragt der Admin vorher („Navigation neu anordnen?", *Abbrechen – Anordnung beibehalten* / *Neu anordnen – Layout anwenden*). |

Die drei Anzeigehaken sind **reine Anzeigefilter** und verändern nichts an der Konfiguration.

Auf Tablets und Telefonen weist ein Hinweis neben der Panel-Auswahl darauf hin, dass Schaltflächen aus anderen Flows einen **Doppeltipp** brauchen.

## 3. Die Legende lesen

Die **Farbe der Linie** sagt, wie zwei Seiten zusammenhängen:

| Linie | Bedeutung |
|---|---|
| violett, Pfeil an beiden Enden | `prev` **und** `next` — die Verbindung gilt in beide Richtungen |
| türkis | `next` (nächste Seite) |
| blauviolett | `prev` (vorherige Seite) |
| gelb, gestrichelt | `home` (Sprung zur Startseite) |
| rot | `parent` (übergeordnete Seite) |
| grün, gestrichelt | Zielseite einer Fläche (kurzer Druck) |
| orange, gestrichelt | Zielseite beim langen Druck |
| blaugrau, dünn gepunktet | Datenpunkt oder Channel, den die Seite nutzt |

Der **Rahmen eines Knotens** sagt, woher die Seite stammt: ohne Farbe aus dem Konfigurationsskript des Panels, violett aus der globalen Skript-Konfiguration, **grün aus der Admin-Konfiguration**, gelb Systemseite bzw. Standard-Startseite, blaugrau gestrichelt ein Datenpunkt-Knoten (keine Seite).

Dazu kommen drei **Marken am Knoten**:

| Marke | Bedeutung |
|---|---|
| **Schloss** | Vom Adapter aus einer Fläche erzeugte Seite (z. B. ein Popup). Ihre Navigation ist nicht änderbar. |
| **Stift** | Skript-Seite, deren Navigation im Admin überschrieben ist (siehe [Abschnitt 8](#8-skript-seiten-überschreiben)). |
| **Stift in Warnfarbe** | Dieselbe Seite, aber das Skript liefert inzwischen andere Verweise als zum Zeitpunkt der Änderung. |
| **Gestrichelter Außenrahmen mit Punkt** | Die Verweise dieser Seite wurden geändert und sind noch nicht gespeichert. |

Die Herkunft beantwortet die häufige Frage „warum sieht das Panel anders aus als im Skript beschrieben". **Bei gleichem Namen gewinnt aber nicht automatisch die Admin-Seite**: Eine Skript-Seite desselben Panels behält ihren Namen, solange die Admin-Seite nicht die Startseite ist, die Instanz-Option für den Vorrang nicht gesetzt ist und die verdrängte Seite nicht aus dem globalen Skript oder vom Skript eines anderen Panels stammt — andernfalls protokolliert der Adapter „Page with name … already exists, skipping!" und die Admin-Seite entfällt. Die Regel mit allen Ausnahmen steht unter [Pages](Pages).

## 4. Anordnen und Einklappen

- **Knoten verschieben:** Die Anordnung lässt sich frei ziehen. Gespeichert wird automatisch im Hintergrund (Zeitgeber, Panel-Wechsel, Verlassen des Tabs) — es gibt keinen eigenen Knopf dafür. Ein von Hand bewegter Knoten behält seine Position dauerhaft.
- **Teilbaum ein- und ausklappen:** Seiten mit Unterseiten tragen rechts unten einen kleinen Knopf. Eingeklappt zeigt er **+N** mit der Zahl der ausgeblendeten Seiten, aufgeklappt ein Minus; aufgeklappt wird er erst beim Überfahren der Seite deutlich sichtbar. Der Klappzustand wird **je Panel** im Browser gemerkt. Ohne gemerkten Zustand ist der Teilbaum der **Service-Seiten unter `///unlock`** eingeklappt — sichtbar wird das erst mit dem Haken *Systemseiten anzeigen*.
- **Linien in einen eingeklappten Teilbaum** werden auf die eingeklappte Seite umgelenkt und blass gepunktet gezeichnet. Sie sind reine Anzeige: kein Menü, nicht verschiebbar.
- Seiten in einem eingeklappten Teilbaum bekommen **keine Position**; sie werden erst beim Aufklappen neben den stehenden Knoten einsortiert.

## 5. Seitendetails rechts

Ein **Klick auf einen Knoten** öffnet rechts eine Tafel und hebt alle Linien dieser Seite hervor. Bei einer Seite stehen dort Name, Überschrift (sofern sie eine feste und keine aus einem Datenpunkt gelesene ist), Kartentyp, Bildschirmschoner-Verhalten, Blätter-Einstellungen und die Zahl der Flächen. Gehört die Seite zur Admin-Konfiguration, führt der Knopf **Seitenkonfiguration öffnen** direkt in den Tab [PageConfig](PageConfig) auf diese Seite; verschobene Knoten werden vorher gespeichert.

Ein **Datenpunkt- oder Channel-Knoten** zeigt stattdessen *Datenpunkt-Info* bzw. *Channel-Info*: die ID, die Überschriften, in welcher Rolle und mit welchem Elementtyp die Seite ihn nutzt, ob Wert statt Icon angezeigt wird, und die Icons — kommt ein Icon selbst aus einem Datenpunkt, zeigt die Tafel den **aktuellen Wert** mit dem Hinweis, aus welchem Datenpunkt er stammt. Ein Klick auf die freie Fläche schließt die Tafel.

## 6. Navigation bearbeiten

Der Haken **Navigation bearbeiten** macht aus dem Graphen einen Editor.

<!-- Bild folgt: Editiermodus, Quell-Anfasser an einem Knoten und gezogene Verbindung (Bildauftrag 2) -->

**Was sich im Bild ändert.** Jede editierbare Seite zeigt vier vergrößerte **Quell-Anfasser**, jede Seite außerdem die vier Ziel-Anfasser, damit eine Verbindung auf ihr abgelegt werden kann. Beidseitige `prev`/`next`-Verbindungen werden im Editiermodus **nicht mehr als eine violette Doppelpfeil-Linie**, sondern als zwei getrennte Linien gezeichnet: Jede Linie steht hier für genau einen Eintrag der Konfiguration.

**Verweis setzen.** Den Quell-Anfasser auf die Zielseite ziehen. Welcher Anfasser gezogen wird, entscheidet über den Verweis:

| Anfasser am Knoten | Verweis |
|---|---|
| oben Mitte | `prev` |
| unten Mitte | `next` |
| links oben | `home` |
| links unten | `parent` |

Das Ablegen gelingt auch auf der **Fläche** des Zielknotens — den kleinen Anfasser muss niemand treffen. Eine Seite kann nicht auf sich selbst verweisen. Das Ende einer vorhandenen, editierbaren Linie lässt sich auf eine andere Seite ziehen; wird es ins Leere gezogen, bleibt die Linie, wie sie war.

**Verweis entfernen.** Ein **Klick auf die Linie** öffnet an der Zeigerposition ein Menü. Es listet **alle** Verweise zwischen den beiden Seiten in beiden Richtungen — `a.next = b` und `b.prev = a` liegen übereinander. Jeder Eintrag, der in der Konfiguration steht, lässt sich entfernen (*prev: a → b entfernen*).

<!-- Bild folgt: geöffnetes Linien-Menü mit entfernbarem und abgeleitetem Eintrag (Bildauftrag 3) -->

**Drei Fälle, in denen nichts geht:**

- **Erzeugte Seiten** (Schloss) haben keine Quell-Anfasser. Ihre Navigation bestimmt die Fläche, aus der sie entstanden sind.
- **Systemseiten** und Datenpunkt-Knoten sind keine editierbaren Seiten; sie dürfen nur **Ziel** einer Linie sein.
- **Abgeleitete Verweise** sind blass und dünner gezeichnet und im Menü ausgegraut: „Vom Adapter abgeleitet (Standard-Home oder Verkettung) – nicht löschbar". Das betrifft das automatische `home` einer Seite ohne jeden eigenen Verweis und die Gegenstücke, die der Adapter beim Verketten der Admin-Seiten selbst setzt.

Ist die Seite dem gewählten Panel nach der **aktuellen, noch nicht gespeicherten** Konfiguration gar nicht zugewiesen, erscheint unten die Warnung „Diese Seite ist diesem Panel in der aktuellen Konfiguration nicht zugewiesen – Zuweisung im Seiten-Tab prüfen". Der Graph zeigt die Seite dann noch aus dem letzten Adapterstart.

**Wohin die Änderung geschrieben wird:** Bei einer Admin-Seite in deren Panelzuweisung (dieselbe Stelle, die der Tab [PageConfig](PageConfig#panelzuweisung-und-navigation) mit vier Auswahlfeldern bearbeitet) — die beiden Wege sind also austauschbar. Bei einer Skript-Seite in eine eigene Liste von Überschreibungen, siehe [Abschnitt 8](#8-skript-seiten-überschreiben).

## 7. Geltungsbereich bei Seiten für alle Panels

Bezieht eine Admin-Seite ihre Navigation aus der Zuweisung **(alle)**, gibt es für das gezeigte Panel keine eigene Zeile, in die die Änderung passen würde. Der Admin fragt deshalb nach („Seite ist allen Panels zugewiesen"):

- **Für alle Panels ändern** — die Änderung landet in der Zeile *(alle)* und gilt überall.
- **Nur für dieses Panel (…)** — es wird eine **panel-spezifische Zuweisung** angelegt, die ab dann Vorrang vor *(alle)* hat. Sie startet mit einer Kopie der Verweise aus *(alle)*, damit die übrigen Verweise der Seite auf diesem Panel erhalten bleiben.
- **Abbrechen** — nichts wird geschrieben.

Die Wahl wird je Seite und Panel für die Sitzung gemerkt; der nächste Verweis derselben Seite wird ohne Rückfrage geschrieben.

> Bei einer aus den alten Admin-Tabellen übernommenen Diagramm- oder Energieseite, die ihre Navigation noch aus dem Skript bezieht, endet das mit dem ersten hier gesetzten Verweis: Von dann an gilt die Navigation aus dem Admin. Siehe [Migration](Migration).

## 8. Skript-Seiten überschreiben

Auch Seiten aus dem Konfigurationsskript (eigenes oder globales) lassen sich hier umhängen. Das **Skript bleibt unangetastet**: Die Änderung wird als *Überschreibung* in der Instanz-Konfiguration gespeichert und vom Adapter bei jedem Start über die Skript-Navigation gelegt — sie übersteht damit auch ein erneutes Senden des Skripts. Solche Seiten tragen im Graphen einen **Stift**.

Jede Überschreibung merkt sich zusätzlich, welche Verweise das Skript **zum Zeitpunkt der Änderung** geliefert hat. Liefert es inzwischen andere, gilt sie als veraltet: Der Stift wird zur Warnfarbe, und beim Laden oder Wechseln des Panels fragt der Admim nach („Skript-Navigation hat sich geändert"). Der Dialog stellt je Seite drei Spalten gegenüber — *Skript zum Zeitpunkt der Änderung*, *Skript jetzt*, *Deine Änderung* — und bietet vier Wege an, die **für alle aufgeführten Seiten gemeinsam** gelten:

| Knopf | Wirkung |
|---|---|
| **Zusammenführen** | Verweise, die selbst geändert wurden, bleiben; alle übrigen folgen dem Skript. |
| **Meine Änderung behalten** | Die Verweise bleiben unverändert; der neue Skript-Stand wird nur als neue Grundlage gemerkt (die Warnung verschwindet). |
| **Skript übernehmen** | Die Überschreibung wird verworfen, die Seite folgt wieder dem Skript. Bei einem Panel mit dem Haken *Panel benutzt kein Skript* ([NSPanelsetting](NSPanelsetting)) wird dieser Knopf nicht angeboten. |
| **Später** | Schließt den Dialog ohne Entscheidung. In dieser Sitzung wird nicht erneut gefragt. |

<!-- Bild folgt: Dialog „Skript-Navigation hat sich geändert" mit der Vergleichstabelle (Bildauftrag 4) -->

Eine Überschreibung lässt sich auch einzeln zurücknehmen: Im Menü einer Linie steht dafür *Skript-Navigation von „…" wiederherstellen*.

Eine veraltete Überschreibung wird trotzdem angewandt — das Panel läuft also mit dem, was hier eingestellt wurde, bis die Frage entschieden ist.

## 9. Speichern und Neustart

Zwei Dinge werden getrennt gespeichert:

- **Die Anordnung der Knoten** gehört zum Panel, nicht zur Instanz-Konfiguration. Sie wird automatisch gesichert: etwa alle zehn Sekunden, beim Panel-Wechsel, beim Wechsel in einen anderen Tab und beim Verlassen der Seite. Dafür muss der Adapter laufen; ist er offline, wird nichts gespeichert.
- **Geänderte Verweise** stehen im Formular des Admins und werden erst mit **Speichern** wirksam. Solange sie offen sind, tragen die betroffenen Seiten den gestrichelten Rahmen und oben steht der Hinweis „Änderungen werden mit *Speichern* übernommen, der Adapter startet dann neu; die endgültige Verkettung von `prev`/`next` berechnet der Adapter."

Nach dem Speichern startet der Adapter neu. Der Tab bemerkt das selbst, zeigt „Adapter startet neu, Ansicht wird aktualisiert …" und liest die Navigation nach drei Sekunden neu, danach alle zwei Sekunden bis höchstens eine Minute. Die alte Ansicht bleibt in der Zwischenzeit stehen. Sobald die neuen Daten eine Änderung widerspiegeln, verliert die Seite ihre Markierung; bleiben Markierungen übrig, folgt automatisch ein weiterer Leseversuch.

**Was der Adapter beim Bauen noch verändert** — wer die Linien danach nicht wiedererkennt, findet hier den Grund:

- Eine Seite ohne jeden eigenen Verweis (und die nicht Startseite ist) bekommt `home` auf die Startseite — ein Notausgang, keine Navigation.
- `home` oder `parent` auf die Seite selbst werden verworfen.
- `prev`/`next` der **Admin-Seiten** werden zu einer Kette verrechnet: Eine Seite, die sich mit `next` zwischen zwei andere setzt, zieht die Gegenstücke der Nachbarn nach. Diese Verkettung hat **Vorrang** vor dem, was eine einzelne Seite konfiguriert. Die Vorschau im Graphen nähert das nur an; das endgültige Bild gibt es erst nach dem Neustart.
- Ein Verweis auf eine Seite, die das Panel nicht hat, wird fallen gelassen (der Adapter warnt im Log).

## Fallstricke

- **„Automatisches Layout" ordnet nicht alles neu.** Der Hauptknopf platziert nur Knoten ohne gespeicherte Position; stehen alle, erscheint lediglich die Meldung „Alle Knoten haben bereits eine Position". Erst *Alles neu anordnen…* im Menü daneben räumt den ganzen Graphen auf — mit Rückfrage, weil alle selbst gesetzten Positionen verloren gehen. Knoten in **eingeklappten** Teilbäumen bleiben dabei außen vor und werden erst beim Aufklappen platziert.
- **Der Haken *Navigation bearbeiten* ist grau.** Dann liegen entweder keine Navigationsdaten vor, oder das gewählte Panel meldet kein Topic (Panel nicht in der Panel-Tabelle der Instanz). Ohne Topic gibt es keine Zuweisung, in die eine Änderung geschrieben werden könnte.
- **Eine blasse Linie lässt sich nicht löschen.** Sie steht nicht in der Konfiguration, sondern wird vom Adapter abgeleitet. Ein Entfernen würde sie sofort wieder erzeugen — deshalb ist der Menüeintrag ausgegraut.
- **Eine Seite sieht nach dem Abschalten von *Home-Verbindungen zu main anzeigen* verwaist aus.** Der Filter versteckt nur die Linie, nicht den Verweis.
- **Die Überschreibung einer Skript-Seite verpufft, wenn eine Admin-Seite dieselbe Seite ersetzt.** Der Adapter nimmt den Navigationsknoten dann wieder heraus und protokolliert eine Warnung („page is replaced by the admin configuration"). Ebenso wirkungslos bleiben Überschreibungen für erzeugte Seiten und für Seiten, deren Navigationsknoten im Skript anders heißt als die Seite. Liefert das Skript die Seite gar nicht mehr, bleibt die Überschreibung liegen und wartet (Log-Eintrag auf Info-Ebene).
- **Der Tab-Wechsel macht geänderte Verweise unsichtbar.** Verlässt man den Tab und kommt zurück, wird die Ansicht neu aufgebaut: Der gestrichelte Rahmen und die vorgezogene Linie sind weg, der Graph zeigt wieder den Stand des letzten Adapterstarts. **Die Änderung ist trotzdem noch im Formular** und wird mit *Speichern* übernommen. Wer sie wirklich verwerfen will, muss die Instanz-Einstellungen ohne Speichern verlassen.
- **Die Startseite lässt sich nur hier umhängen.** Im Tab [PageConfig](PageConfig#panelzuweisung-und-navigation) sind die vier Navigationsfelder einer als Startseite markierten Seite gesperrt, weil sie die Verknüpfungen ihrer Vorgängerin erbt. Im Editiermodus des Flows sind sie es nicht — ein hier gesetzter Verweis gilt und ersetzt den geerbten.
- **Die Frage nach einer veralteten Überschreibung kommt nur einmal je Sitzung.** Wer *Später* wählt, sieht den Dialog bis zum Neuladen der Admin-Seite nicht wieder; die Warnfarbe am Stift bleibt aber.
- **Auf Tablets und Telefonen** brauchen Schaltflächen aus anderen Flows einen **Doppeltipp**.
