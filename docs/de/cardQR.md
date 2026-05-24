# Page QR (`cardQR`)

Die **`cardQR`** erzeugt auf dem Panel einen QR-Code, der z. B. mit dem Handy gescannt werden kann. Damit lassen sich WLAN-Zugangsdaten (Gäste-WLAN), eine Telefonnummer, eine URL oder ein beliebiger Freitext übergeben.

Die Seite wird **vollständig im Admin** über den Tab **PageConfig** konfiguriert – einschließlich ihrer Position in der Navigation (Bereich **Navigation/Panel**). Ein Eintrag im Konfigurationsskript ist dafür **nicht erforderlich**.

**Inhalt**
+ [Einstellungen im Admin](#einstellungen-im-admin)
    + [Freitext (FREE)](#freitext-free)
    + [WLAN (Wifi)](#wlan-wifi)
    + [URL](#url)
    + [Telefon (TEL)](#telefon-tel)
+ [Navigation / Panel](#navigation--panel)
+ [Optionaler Verweis im Skript](#optionaler-verweis-im-skript)

---

## Einstellungen im Admin

Die allgemeine Bedienung des Tabs ist unter [Page Config](PageConfig) beschrieben. Zuerst den Seitentyp **QR** wählen, im Feld „neue Seite" einen eindeutigen Namen vergeben und mit dem Plus-Button anlegen.

> [!NOTE]
> Der Name (`uniqueName`) muss im gesamten Adapter einmalig sein.

Anschließend werden der QR-Typ und die Überschrift festgelegt.

> 🖼️ **Bild fehlt:** PageConfig-Editor für eine QR-Seite (Auswahl QR-Typ, Überschrift, typabhängige Felder).
> Pfad: `Pictures/pageQR/config.png`

![QR-Konfiguration im Admin](Pictures/pageQR/config.png)

Der QR-Typ wird über das Feld **„Auswahl des QR-Typs"** (`selType`) bestimmt:

| Auswahl | `selType` | Inhalt des QR-Codes |
|---------|:---------:|---------------------|
| Freitext | 0 | beliebiger Text |
| Wifi | 1 | WLAN-Zugangsdaten |
| URL | 2 | Web-Adresse |
| Telefon | 3 | Telefonnummer |

Allen Typen gemeinsam ist das Feld **„SSID/URL/Telefon"** (`ssidUrlTel`), in das je nach Typ der Text, die SSID, die URL oder die Telefonnummer eingetragen wird.

### Freitext (FREE)
Hier kann ein beliebiger QR-Code-Inhalt als Freitext eingegeben werden.

### WLAN (Wifi)
Beim Typ Wifi stehen zusätzlich folgende Felder zur Verfügung:

| Feld (Admin-Label) | Schlüssel | Beschreibung |
|--------------------|-----------|--------------|
| WLAN-SSID | `ssidUrlTel` | Name des WLANs |
| WLAN-Verschlüsselung | `wlantype` | `nopass`, `WPA`, `WPA2`, `WPA3` oder `WEP` (Standard `WPA`) |
| Password | `qrPass` | WLAN-Passwort (kann leer bleiben) |
| verstecktes Netzwerk | `wlanhidden` | aktivieren, wenn das Netzwerk nicht sichtbar (hidden SSID) ist |
| Password verbergen | `pwdhidden` | blendet das Passwort auf dem Panel aus; im QR-Code ist es dennoch enthalten |
| Schalter/State | `setState` | optionaler boolescher Datenpunkt |

> [!NOTE]
> Ist ein `setState`-Datenpunkt hinterlegt, wird im Panel an der Stelle des Passworts ein Schalter eingeblendet, der den Datenpunkt auf `true`/`false` setzt.

> 🖼️ **Bild fehlt:** Panel-Ansicht WLAN-QR mit sichtbarem Passwort bzw. mit Schalter.
> Pfad: `Pictures/pageQR/panel-wifi.png`

![WLAN-QR auf dem Panel](Pictures/pageQR/panel-wifi.png)

### URL
Der klassische QR-Code mit einer hinterlegten URL, die nach dem Scan aufgerufen werden kann (z. B. `https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki`).

### Telefon (TEL)
Bettet eine Telefonnummer ein, die nach dem Scannen direkt gewählt werden kann. Um international zu bleiben, sollte die Nummer mit der Ländervorwahl beginnen (z. B. `+49` für Deutschland).

---

## Navigation / Panel

Im linken Fenster **„Navigation/Panel"** wird unter dem Reiter **„Navigation"** der Platz in der Seitenhierarchie festgelegt. Zuerst das Panel bzw. „alle" wählen, dann vor (`prev`) bzw. hinter (`next`) welcher Seite die QR-Seite liegen soll.

> [!NOTE]
> Nur eines der Felder **Prev** oder **Next** wählen. Über **Home** und **Parent** werden Haussymbol bzw. Pfeil-nach-oben eingeblendet und auf die gewählte Seite verlinkt.

Im Reiter **„Pagedetails"** lässt sich festlegen, ob die Seite beim Setzen des Datenpunktes
`nspanel-lovelace-ui.0.panels.<MAC>.cmd.hideCards` auf `true` ausgeblendet wird, sowie das Screensaver-Verhalten:
+ **Standard-Timeout** → Screensaver blendet sich nach der eingestellten Zeit ein.
+ **niemals aktivieren** → Seite bleibt sichtbar, bis manuell zur nächsten gewechselt wird.
+ **von der vorherigen Seite übernehmen** → übernimmt die Einstellung der vorherigen Seite.

---

## Optionaler Verweis im Skript

Ist die QR-Seite im Admin **inklusive Navigation** (Bereich **Navigation/Panel**) konfiguriert, **ist kein Skript-Eintrag nötig** – sie erscheint allein durch die Admin-Konfiguration auf dem Panel.

Ein Verweis im Skript ist nur dann sinnvoll, wenn die Panel-Navigation komplett über das Konfigurationsskript aufgebaut wird (statt über den Navigationsbereich des Admins). Dann genügt eine minimale Referenz mit identischem `uniqueName`; der Seiteninhalt kommt weiterhin aus dem Admin.

```typescript
// Nur nötig, wenn die Navigation per Skript gesetzt wird – als Unterseite unter subPages
const wlanQRSub: ScriptConfig.PageQR = {
    type: 'cardQR',
    uniqueName: 'gastwlan', // muss mit dem Namen im Admin übereinstimmen
    prev: 'main',
    home: 'main',
};
```

> [!NOTE]
> Dieselbe `uniqueName` nicht gleichzeitig im Admin **mit** Navigation und im Skript positionieren. Standardmäßig hat die Skript-Seite Vorrang und der gleichnamige Admin-Eintrag wird mit einer Warnung übersprungen.

Übersicht aller Seitentypen unter [Pages](Pages).
