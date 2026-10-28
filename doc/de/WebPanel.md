# Web-Panel

Seit Version **1.7.0** zeigt der Adapter die Panel-Oberfläche auch **im Webbrowser** — mit denselben Seiten,
Popups und Bildschirmschonern wie auf dem NSPanel. Dafür bringt er einen eigenen kleinen Webserver mit;
Tasmota und Panel-Hardware braucht es dafür nicht.

Es gibt zwei Arten:

- **Ein echtes Panel im Browser:** Jedes eingerichtete NSPanel lässt sich zusätzlich im Browser öffnen.
  Der Browser verhält sich wie ein **weiteres** Panel mit derselben Konfiguration.
- **Ein eigenständiges Web-Panel:** ein Panel **ganz ohne Hardware**, etwa für ein Tablet an der Wand oder
  zum Ausprobieren von Seiten am Schreibtisch.

Inhalt:

1. [Einschalten und Adresse](#1-einschalten-und-adresse)
2. [Ein echtes Panel im Browser öffnen](#2-ein-echtes-panel-im-browser-öffnen)
3. [Ein eigenständiges Web-Panel anlegen](#3-ein-eigenständiges-web-panel-anlegen)
4. [Bedienung im Browser](#4-bedienung-im-browser)
5. [Zugang schützen: PIN, HTTPS, Sicherheitsschlüssel](#5-zugang-schützen-pin-https-sicherheitsschlüssel)
6. [Was ein Web-Panel nicht kann](#6-was-ein-web-panel-nicht-kann)
7. [Fallstricke](#7-fallstricke)

## 1. Einschalten und Adresse

Die Einstellungen stehen in den Instanz-Einstellungen im Tab **Web-Panels**. Oben zeigt der Tab, unter
welcher Adresse die Panels erreichbar sind.

<img alt="Tab Web-Panels in den Instanz-Einstellungen" src="../Pictures/webPanel/webpanel-01-tab.png" width="100%"/>

| Feld | Bedeutung |
|---|---|
| **Web-Panels aktivieren** | Schaltet den Webserver ein. **Ab Werk eingeschaltet.** |
| **Port der Web-Panels** | Vorgabe `8090`. |
| **Bind-Adresse** | Netzwerkschnittstelle, auf der der Server lauscht. `0.0.0.0` (Vorgabe) = alle. |
| **Hostname für die Links** | Nur für die Links im Admin, die Adressvorschau und die Meldung im Log. Leer = der Adapter ermittelt ihn selbst. Bei HTTPS den Namen aus dem Zertifikat eintragen. |
| **PIN**, **HTTPS**, **FIDO2** | siehe [Abschnitt 5](#5-zugang-schützen-pin-https-sicherheitsschlüssel) |

Jedes Panel hat eine eigene Adresse, gebildet aus seinem **Topic**:

```
http://<ioBroker-Host>:8090/<Topic des Panels>
```

Die Startseite `http://<ioBroker-Host>:8090/` listet alle Panels mit Modell und Anzahl verbundener Browser.

<img alt="Startseite der Web-Panels mit drei Panels" src="../Pictures/webPanel/webpanel-04-startseite.png"/>

Bequemer geht es aus dem Admin: Der Knopf **Web-Panel in neuem Tab öffnen** steht in der Panel-Übersicht
(Tab *Nspanel-Einstellungen*), im Tab [Maintain](Maintain) und in der [Panelinfo](Panelinfo). Ist eine PIN
gesetzt, meldet dieser Knopf den Browser gleich mit an.

> Alle Einstellungen dieses Tabs gelten erst nach dem **Speichern** — die Instanz startet dabei neu.

## 2. Ein echtes Panel im Browser öffnen

Dafür ist nichts einzurichten: Sind die Web-Panels eingeschaltet, ist **jedes** NSPanel unter seinem Topic
erreichbar. Statt des Topics funktioniert auch die ID des Panels.

<img alt="Ein NSPanel im Browser: Bildschirmschoner, darunter die Leisten der beiden Hardwaretasten" src="../Pictures/webPanel/webpanel-05-browser.png" width="100%"/>

Wichtig zu wissen:

- **Der Browser blättert unabhängig vom echten Panel.** Er ist ein zusätzliches Panel mit derselben
  Konfiguration — wer im Browser eine andere Seite öffnet, ändert nichts am Display an der Wand.
- **Alle Browser auf derselben Adresse laufen synchron**: Öffnen zwei Geräte dasselbe Panel, sehen beide
  dieselbe Seite.
- Die **Datenpunkte** teilt sich der Browser mit dem echten Panel (`panels.<Panel>.*`). Befehle unter
  `cmd.*` — etwa Bildschirmschoner oder Helligkeit — wirken also auch im Browser. Die Werte unter `info.*`
  (Firmware, WLAN, Status) schreibt nur das echte Panel.
- Ist das echte Panel **deaktiviert** oder gerade nicht in Betrieb, zeigt auch der Browser nichts an und
  versucht es später erneut.

## 3. Ein eigenständiges Web-Panel anlegen

1. Tab **Nspanel-Einstellungen** öffnen. Neben *Nspanel-Initialisierung* steht der Knopf
   **Web-Panel hinzufügen** — er erscheint nur, wenn die Web-Panels eingeschaltet sind.
2. Im Dialog ausfüllen:
   - **Panelname** — eindeutig.
   - **Topic** — eindeutig, wird zum Pfad der Adresse. Erlaubt sind Buchstaben, Ziffern, `_` und `-`,
     dazu `/` als Trenner. Nicht erlaubt als erster Teil: `assets`, `fonts`, `icons`, `auth`, `ws` (die
     braucht der Webserver selbst). Unter dem Feld zeigt der Dialog die fertige Adresse.
   - **Hardwaremodell** — EU-Querformat, US-Querformat oder US-Hochformat. Das bestimmt Format und
     Seitenverhältnis der Darstellung.

   <img alt="Dialog Web-Panel hinzufügen mit Name, Topic, Hardwaremodell und Adressvorschau" src="../Pictures/webPanel/webpanel-02-hinzufuegen.png" width="100%"/>

3. Mit **Speichern** übernehmen, dann die Instanz-Einstellungen speichern.

Das Web-Panel bekommt automatisch eine ID der Form `web_` + 12 Zeichen und erscheint in der
Panel-Übersicht mit dem Kennzeichen **Web**. Über den **Stift** lassen sich Name, Topic und Modell ändern —
ein neues Topic ist auch eine neue Adresse. Gelöscht wird es über den **Papierkorb**; das geht nur, solange
die Instanz läuft.

<img alt="Panel-Übersicht mit zwei NSPanels und dem Web-Panel Tablet Küche" src="../Pictures/webPanel/webpanel-03-panelkarten.png" width="100%"/>

**Seiten bekommt es wie jedes andere Panel:** Im Tab [PageConfig](PageConfig) taucht das Web-Panel in der
Panel-Auswahl auf, Seiten und Navigation werden genauso zugewiesen. Ein Konfigurationsskript ist
**nicht nötig** — ohne Skript startet es mit der Admin-Konfiguration (ab der Version nach 1.7.0; in 1.7.0
selbst brauchte auch ein Web-Panel noch ein Skript).

Die Datenpunkte liegen unter `panels.web_<…>.*`. Ist kein Browser mehr verbunden, meldet es sich als
offline.

## 4. Bedienung im Browser

- **Tippen oder Klicken** wirkt wie ein Druck aufs Display — mit Maus und Touch gleich.
- **Halten** (ab etwa 0,6 Sekunden) ist der lange Druck: Auf einer Kachel einer Menüseite schaltet ein
  kurzer Druck, Halten öffnet das Detail-Popup — wie am echten Panel.
- **Die zwei Hardwaretasten** liegen als Leisten unter dem Display. Sie lösen die Aktion aus, die für die
  Tasten eingestellt ist, und setzen `panels.<Panel>.buttons.left`/`right`. **Relais schalten sie nicht.**
- **Summer:** Der Browser spielt die Töne selbst ab — aber erst, nachdem einmal getippt wurde. Das ist eine
  Vorgabe der Browser; Töne davor fallen still weg.
- **Bildschirmschoner und Dimmen** laufen wie am Panel: Nach der eingestellten Zeit wird gedimmt, ein Tippen
  weckt das Panel.
- **Größe:** Die Darstellung wird mit festem Seitenverhältnis auf das Fenster skaliert, freie Fläche bleibt
  schwarz. Einen eigenen Vollbild-Knopf gibt es nicht; dafür das Vollbild des Browsers nehmen (meist `F11`).
- **Verbindung weg:** Die Seite wird grau mit einem Hinweis. Nach einem Neustart des Adapters verbindet sich
  der Browser von selbst wieder.

## 5. Zugang schützen: PIN, HTTPS, Sicherheitsschlüssel

> ⚠️ **Ohne PIN ist jedes Web-Panel offen** — wer den Port im Netz erreicht, kann es bedienen. Da die
> Web-Panels ab Werk eingeschaltet sind, gilt das auch für jedes echte Panel. Das Log warnt beim Start
> davor. Wer die Web-Panels nicht braucht, schaltet sie aus; wer sie braucht, setzt eine PIN.

**PIN der Web-Panels** — eine gemeinsame PIN für alle Web-Panels, echte wie eigenständige. Jeder Browser
gibt sie **einmal** ein und bleibt danach angemeldet. Eine **neue PIN meldet alle Browser ab**. Nach fünf
falschen Eingaben in einer Minute muss dieser Rechner eine Minute warten.

**HTTPS (ioBroker-Zertifikate)** — liefert die Panels verschlüsselt aus. Die Zertifikate werden aus den
ioBroker-Zertifikaten gewählt (Systemeinstellungen): **öffentliches Zertifikat**, **privates Zertifikat**
und, falls nötig, die **Zertifikatskette**. Ohne gültige Zertifikate bleiben die Web-Panels **aus** — einen
Rückfall auf unverschlüsseltes HTTP gibt es nicht.

**FIDO2-Sicherheitsschlüssel** — statt der PIN lässt sich ein Sicherheitsschlüssel oder Passkey nutzen. Die
PIN bleibt dabei bestehen; der Schlüssel ist eine bequemere Art, sich anzumelden. Voraussetzungen:

1. HTTPS ist eingeschaltet,
2. das Web-Panel wird über einen **Hostnamen** aufgerufen, **nicht über eine IP-Adresse**,
3. der Browser vertraut dem Zertifikat (ein selbst signiertes geht, wenn es im Browser oder System als
   vertrauenswürdig hinterlegt ist).

Registriert wird der Schlüssel **im Browser**, nicht im Admin: auf der Startseite der Web-Panels dem Link zur
Registrierung folgen (`/auth/fido/register`), einmal mit der PIN anmelden, einen Namen vergeben. Danach
bietet die Anmeldeseite *Sign in with a security key* an. Im Admin listet der Tab *Web-Panels* alle
registrierten Schlüssel mit Datum der letzten Nutzung; dort werden sie auch **entfernt** (nur bei laufender
Instanz).

## 6. Was ein Web-Panel nicht kann

Ein Web-Panel hat weder Tasmota noch ein Nextion-Display. Deshalb gibt es dort:

- **kein Firmware- oder TFT-Update** und nichts zu flashen,
- **keine Relais** — auch nicht beim Browser-Bild eines echten Panels; die Relais des echten Panels bleiben
  unberührt,
- **keinen Temperatursensor** (und damit keinen Temperaturoffset),
- **keine Tasmota-Befehle** außer dem Summer, keinen Tasmota-Neustart,
- **kein Update-Symbol** im Bildschirmschoner.

## 7. Fallstricke

- **Port belegt:** Läuft auf dem Port schon etwas anderes, bleiben die Web-Panels aus; das Log nennt den
  nächsten freien Port. Den dann im Tab eintragen.
- **Einstellungen greifen nicht:** Alle Felder des Tabs gelten erst nach dem Speichern und Neustart der
  Instanz.
- **FIDO2 wird nicht angeboten:** HTTPS aus, Aufruf über eine IP-Adresse oder Zertifikat nicht
  vertrauenswürdig — die drei Voraussetzungen aus Abschnitt 5 prüfen.
- **Die Seiten des Webservers** (Startseite, Anmeldung, „Panel not found“) gibt es nur auf Englisch; die
  Panel-Oberfläche selbst spricht die eingestellte Sprache.
