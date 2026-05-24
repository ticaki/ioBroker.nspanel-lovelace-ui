# Page Alarm (`cardAlarm`)

Die **`cardAlarm`** stellt auf dem Panel ein Alarm-/Sicherheitsfeld mit Zifferntastatur (Numpad), Status-Symbol und bis zu vier beschrifteten Schaltflächen dar. Damit lässt sich eine Alarmanlage scharf-/unscharf schalten oder – als Variante **Entsperren** – ein PIN-geschützter Entsperr-Dialog abbilden.

Die Seite wird **vollständig im Admin** über den Tab **PageConfig** konfiguriert – einschließlich ihrer Position in der Navigation (Bereich **Navigation/Panel**). Ein Eintrag im Konfigurationsskript ist dafür **nicht erforderlich**: Sind Seite *und* Navigation im Admin gesetzt, erscheint sie ohne jeden Skript-Bezug auf dem Panel. (Ein im Skript gesetztes `items`-Array wird beim `cardAlarm` ohnehin nicht ausgewertet.)

> Die Variante **Entsperren** teilt sich die Implementierung mit dem Alarm. Die eigenständige Seite [Page Unlock](pageUnlock) ist noch in Erprobung – hier wird nur der Alarm-Teil vollständig beschrieben.

**Inhalt**
+ [Funktionsweise](#funktionsweise)
+ [Einstellungen im Admin (PageConfig)](#einstellungen-im-admin-pageconfig)
    + [Alarm](#typ-alarm)
    + [Entsperren](#typ-entsperren)
+ [Zustandsmaschine](#zustandsmaschine)
+ [Erzeugte Datenpunkte](#erzeugte-datenpunkte)
+ [PIN-Verhalten](#pin-verhalten)
+ [Navigation / Panel](#navigation--panel)
+ [Optionaler Verweis im Skript](#optionaler-verweis-im-skript)

---

## Funktionsweise

Auf dem Panel zeigt die `cardAlarm` ein Status-Symbol, eine Zifferntastatur und bis zu vier Schaltflächen. Welche Schaltflächen erscheinen, hängt vom aktuellen Status ab:

- Im Zustand **unscharf** (`disarmed`) werden die Schaltflächen aus dem Block **Aktivieren** (`button1`–`button4`) eingeblendet. Ein Druck darauf schaltet die Anlage scharf.
- Im Zustand **scharf** (`armed`) werden die Schaltflächen aus dem Block **Deaktivieren** (`button5`–`button8`) eingeblendet. Ein Druck darauf schaltet unscharf.
- Leer gelassene Schaltflächentexte werden auf dem Panel nicht angezeigt.

Symbol, Symbolfarbe, Numpad-Freigabe und Blink-Effekt werden je Status **automatisch** gesetzt und sind nicht konfigurierbar.

> 🖼️ **Bild fehlt:** Panel-Ansicht der Alarm-Seite mit Status-Symbol, Numpad und Schaltflächen (je einmal scharf/unscharf).
> Pfad: `Pictures/cardAlarm/panel-alarm.png`

![Alarm auf dem Panel](Pictures/cardAlarm/panel-alarm.png)

---

## Einstellungen im Admin (PageConfig)

Die allgemeine Bedienung des Tabs ist unter [Page Config](PageConfig) beschrieben und sollte vorab gelesen werden. Zuerst den Seitentyp **Alarm** wählen, im Feld „neue Seite" einen eindeutigen Namen vergeben und mit dem Plus-Button anlegen. Anschließend erscheinen in der Mitte die Konfigurationsfelder.

> 🖼️ **Bild fehlt:** PageConfig-Editor für eine Alarm-Seite (Felder „Eindeutige ID", „Typ", „Überschrift", „Pin", Schaltflächen-Blöcke).
> Pfad: `Pictures/cardAlarm/config.png`

![Alarm-Konfiguration im Admin](Pictures/cardAlarm/config.png)

| Feld (Admin-Label) | Schlüssel | Typ | Beschreibung |
|--------------------|-----------|-----|--------------|
| Eindeutige ID | `uniqueName` | String | Eindeutiger Name der Seite, im gesamten Adapter einmalig. Muss bei Verwendung im Skript mit dem dortigen `uniqueName` übereinstimmen. |
| Typ | `alarmType` | `'alarm'` \| `'unlock'` | **Alarm** = vollwertige Alarmanlage, **Entsperren** = PIN-Entsperrung (siehe unten). |
| Überschrift | `headline` | String | Titel der Seite (oben mittig auf dem Panel). |
| Pin | `pin` | number | PIN, die auf dem Numpad eingegeben werden muss. `0` bzw. leer = keine PIN-Abfrage. Sonderwert `-1` = es wird das globale Admin-Passwort (`pw1`) verwendet. |

### Typ Alarm

Bei `alarmType: 'alarm'` erscheinen zwei Schaltflächen-Blöcke und zwei Optionen:

| Feld (Admin-Label) | Schlüssel | Wirkung |
|--------------------|-----------|---------|
| **Aktivieren** – Oberer Knopf / 2. Knopf / 3. Knopf / Unterer Knopf | `button1`–`button4` | Schaltflächentexte für den **unscharfen** Zustand. Ein Druck scharf-schaltet (Aktionen `A1`–`A4`); der gewählte Modus landet im Datenpunkt `.mode`. |
| **Deaktivieren** – Oberer Knopf / 2. Knopf / 3. Knopf / Unterer Knopf | `button5`–`button8` | Schaltflächentexte für den **scharfen** Zustand. Ein Druck unscharf-schaltet (Aktionen `D1`–`D4`). |
| Genehmigt | `approved` | boolean | Bei aktiv läuft jedes Scharf-/Unscharf-Schalten über eine externe **Bestätigung** (Zwischenzustände `arming`/`pending`, Bestätigung über den Datenpunkt `.approve`). Inaktiv = sofortiges Umschalten. |
| Global | `global` | boolean | Bei aktiv wird der Alarmstatus **panelübergreifend** gehalten und unter `alarm.<uniqueName>` (statt `panels.<panel>.alarm.<uniqueName>`) gespeichert; alle Panels mit dieser Seite teilen sich denselben Status. |

### Typ Entsperren

Bei `alarmType: 'unlock'` entfallen die acht Schaltflächen. Stattdessen gibt es eine einzelne **Entsperren**-Schaltfläche (Aktion `U1`) und ein zusätzliches Feld:

| Feld (Admin-Label) | Schlüssel | Wirkung |
|--------------------|-----------|---------|
| Zielseite beim Entsperren | `setNavi` | String (`uniqueName`) | Optional: Nach erfolgreicher PIN-Eingabe wird die angegebene NSPanel-Seite geöffnet. Ohne Angabe wird stattdessen nur der interne Status umgeschaltet. |

---

## Zustandsmaschine

Die Alarm-Seite kennt fünf Zustände (im Datenpunkt `.status` als Zahlindex 0–4 abgelegt):

| Index | Status | Bedeutung | Symbol |
|-------|--------|-----------|--------|
| 0 | `disarmed` | unscharf | `shield-off` (grün) |
| 1 | `armed` | scharf | `shield-home` |
| 2 | `arming` | wird scharf geschaltet (wartet auf Bestätigung) | `shield` (gelb) |
| 3 | `pending` | wird unscharf geschaltet (wartet auf Bestätigung) | `shield-off` (gelb) |
| 4 | `triggered` | ausgelöst | `bell-ring` (rot) |

**Ohne** Option *Genehmigt*: Ein Schaltflächendruck wechselt direkt zwischen `disarmed` und `armed`.

**Mit** Option *Genehmigt*:
- `disarmed` → Druck auf eine *Aktivieren*-Taste → `arming` → bei `.approve = true` → `armed` (bei `.approve = false` zurück zu `disarmed`).
- `armed` → Druck auf eine *Deaktivieren*-Taste → `pending` → bei `.approve = true` → `disarmed` (bei `.approve = false` zurück zu `armed`).

Der Zustand `triggered` wird **extern** über den Datenpunkt `.status` gesetzt (z. B. von einer Alarmlogik); in diesem Zustand sind keine Bedienaktionen möglich, bis er extern zurückgesetzt wird.

---

## Erzeugte Datenpunkte

Der Adapter legt pro Alarm-Seite einen Channel an – bei lokalen Seiten unter
`nspanel-lovelace-ui.0.panels.<panelName>.alarm.<uniqueName>`,
bei *globalen* Seiten unter `nspanel-lovelace-ui.0.alarm.<uniqueName>`:

| Datenpunkt | Typ | Beschreibung |
|------------|-----|--------------|
| `.status` | number | Aktueller Zustand als Index 0–4 (siehe Tabelle oben). Beschreibbar – externes Setzen ändert den Panel-Status (z. B. auf `4` = ausgelöst). |
| `.mode` | string | Zuletzt gedrückte Aktion (`A1`–`A4` / `D1`–`D4`); beim Alarm-Typ Hinweis auf den gewählten Modus. |
| `.approve` | boolean | Bestätigungs-Handshake für die Zwischenzustände `arming`/`pending` (nur relevant bei aktiver Option *Genehmigt*). |

---

## PIN-Verhalten

Ist eine PIN konfiguriert, muss sie vor dem Schalten korrekt am Numpad eingegeben werden. Bei falscher Eingabe wird die Eingabe für eine ansteigende Zeit gesperrt (exponentielles Backoff: 2^Fehlversuche Sekunden); auf dem Panel erscheint „Gesperrt für *X* s". Nach einer korrekten Eingabe wird der Fehlerzähler zurückgesetzt.

Der Sonderwert `pin = -1` verwendet das globale Admin-Passwort aus den [Global Settings](globelSettings) (`pw1`) statt einer eigenen PIN.

---

## Navigation / Panel

Im linken Fenster **„Navigation/Panel"** wird unter dem Reiter **„Navigation"** der Platz in der Seitenhierarchie festgelegt. Zuerst das Panel bzw. „alle" wählen, dann vor (`prev`) bzw. hinter (`next`) welcher Seite die Alarm-Seite liegen soll.

> [!NOTE]
> Nur eines der Felder **Prev** oder **Next** wählen. Über **Home** und **Parent** werden Haussymbol bzw. Pfeil-nach-oben eingeblendet und auf die gewählte Seite verlinkt.

Im Reiter **„Pagedetails"** lässt sich festlegen, ob die Seite beim Setzen des Datenpunktes
`nspanel-lovelace-ui.0.panels.<MAC>.cmd.hideCards` auf `true` ausgeblendet wird, sowie das Screensaver-Verhalten:
+ **Standard-Timeout** → Screensaver blendet sich nach der eingestellten Zeit ein.
+ **niemals aktivieren** → Seite bleibt sichtbar, bis manuell zur nächsten gewechselt wird.
+ **von der vorherigen Seite übernehmen** → übernimmt die Einstellung der vorherigen Seite.

---

## Optionaler Verweis im Skript

Ist die Alarm-Seite im Admin **inklusive Navigation** (Bereich **Navigation/Panel**) konfiguriert, **ist kein Skript-Eintrag nötig** – sie erscheint allein durch die Admin-Konfiguration auf dem Panel.

Ein Verweis im Skript ist nur dann sinnvoll, wenn die Panel-Navigation komplett über das Konfigurationsskript aufgebaut wird (statt über den Navigationsbereich des Admins). Dann genügt eine minimale Referenz mit identischem `uniqueName`; der Seiteninhalt kommt weiterhin aus dem Admin (das `items`-Array wird beim `cardAlarm` nicht ausgewertet). Der Typ `PageAlarm` erbt die optionalen Navigationsparameter aus dem [Seiten-Basistyp](ScriptConfig#optionale-parameter) (`prev`, `next`, `home`, `parent`, `hiddenByTrigger`, `alwaysOnDisplay` …); `useColor` gibt es hier nicht.

```typescript
// Nur nötig, wenn die Navigation per Skript gesetzt wird – als Unterseite unter subPages
const alarmSub: ScriptConfig.PageAlarm = {
    type: 'cardAlarm',
    uniqueName: 'alarm', // muss mit dem Namen im Admin übereinstimmen
    prev: 'main',
    home: 'main',
    items: [],
};
```

> [!NOTE]
> Dieselbe `uniqueName` nicht gleichzeitig im Admin **mit** Navigation und im Skript positionieren. Standardmäßig hat die Skript-Seite Vorrang und der gleichnamige Admin-Eintrag wird mit einer Warnung übersprungen.

Mehr zum Einbinden von Seiten im Skript unter [ScriptConfig](ScriptConfig). Übersicht aller Seitentypen unter [Pages](Pages).
