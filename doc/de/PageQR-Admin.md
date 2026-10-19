# QR-Code-Seite – Konfiguration im Admin

Die QR-Seite zeigt auf dem Panel einen **QR-Code** mit zwei Textzeilen darunter. Der häufigste Zweck: Gäste scannen den Code und sind im WLAN, ohne das Passwort abzutippen. Die Karte kann aber auch einen beliebigen Text, eine Internetadresse oder eine Telefonnummer übertragen.

Angelegt wird sie im Tab **PageConfig**, Seitentyp **QR**. Ein Konfigurationsskript ist dafür nicht nötig.

Inhalt:
- [Seite anlegen](#1-seite-anlegen)
- [QR-Code-Typ](#2-qr-code-typ)
- [Überschrift und Inhalt](#3-überschrift-und-inhalt)
- [WLAN: Verschlüsselung, Passwort, verstecktes Netz](#4-wlan-verschlüsselung-passwort-verstecktes-netz)
- [Das WLAN per Schalter freigeben](#5-das-wlan-per-schalter-freigeben)
- [Was auf dem Panel erscheint](#6-was-auf-dem-panel-erscheint)
- [Panel-Zuweisung und Navigation](#7-panel-zuweisung-und-navigation)
- [Aus einer alten Konfiguration übernommen](#8-aus-einer-alten-konfiguration-übernommen)

## 1. Seite anlegen

1. Instanz-Einstellungen öffnen → Tab **PageConfig**.
2. Links als Seitentyp **QR** wählen, im Feld *Neue Seite* einen Namen eintragen, **+** drücken.
3. Die Seite erscheint in der Liste, rechts öffnet sich der Editor.

Der Name ist die eindeutige ID der Seite — unter ihm sprechen andere Seiten sie in ihren Navigationszielen an. Zum Umbenennen und zu den Fallstricken dabei siehe [PageConfig – Übersicht](PageConfig#seiten-anlegen-umbenennen-löschen).

> **Alle Felder sind ausgegraut, wenn die Instanz nicht läuft.** Der Editor fragt den Adapter live ab; bei gestopptem Adapter lässt sich nichts eintragen und auch nichts anlegen. Einen erklärenden Hinweis dazu gibt die Oberfläche nicht — das ausgegraute Formular ist der einzige Hinweis.

## 2. QR-Code-Typ

Vier Schaltflächen entscheiden, **was** der Code enthält. Davon hängt ab, welche Felder darunter erscheinen:

| Typ | Inhalt des Codes | Weitere Felder |
|---|---|---|
| **Freitext** | der Text unverändert | keine |
| **WLAN** | `WIFI:T:<Verschlüsselung>;S:<SSID>;P:<Passwort>;H:<versteckt>;` | Verschlüsselung, Passwort, verstecktes Netz, Schalter |
| **URL** | `URL:<Adresse>` | keine |
| **Telefon** | `TEL:<Nummer>` | keine |

Der Typ ist mit **Freitext** vorbelegt.

## 3. Überschrift und Inhalt

**Überschrift** steht als Kopfzeile über dem Code. Beim Anlegen wird der Seitenname eingetragen; bleibt das Feld leer, zeigt das Panel `Page QR`.

Das Feld darunter trägt den eigentlichen Inhalt und **wechselt seine Beschriftung** mit dem Typ: *QR Zeichenkette*, *WLAN-SSID*, *URL* oder *Telefonnummer*.

> **Geprüft wird hier nichts.** Keine Pflichtangabe, keine Längengrenze, keine Prüfung, ob eine Adresse wie eine Adresse aussieht. Ein leeres Feld erzeugt einen leeren QR-Code — zu sehen ist das erst am Panel, der Editor hat keine Vorschau.

Zwei Dinge, die der Adapter mit dem Inhalt macht und die man wissen muss, wenn ein Code nicht funktioniert:

- **Eine Tilde `~` wird durch `-` ersetzt.** Das gilt für die ganze Nachricht ans Panel, also auch für SSID und Passwort. Ein Passwort mit Tilde kommt am Panel verändert an — ohne jede Meldung.
- **Sonderzeichen im WLAN-Code werden nicht geschützt.** Enthält SSID oder Passwort ein `;`, `:`, `,` oder `\`, bricht das die Struktur des `WIFI:`-Codes, und der Scanner liest Unsinn. Wer solche Zeichen im Passwort hat, muss die QR-Karte dafür abschreiben.

## 4. WLAN: Verschlüsselung, Passwort, verstecktes Netz

Diese vier Felder erscheinen nur beim Typ **WLAN**.

**WLAN-Verschlüsselung** — zur Wahl stehen *No Password*, *WPA*, *WPA2*, *WPA3* und *WEP*. (Die Einträge sind in der Oberfläche englisch, auch in der deutschen Fassung.)

> ⚠️ **Solange das Feld nicht angefasst wurde, zeigt die Oberfläche `WPA2`, in den QR-Code schreibt der Adapter aber `WPA`.** Die Anzeige ist eine Vorbelegung der Oberfläche, gespeichert wird erst beim Anfassen; ohne gespeicherten Wert greift der Fallback `WPA`. Viele Geräte verbinden sich trotzdem, manche nicht — und dann sucht man den Fehler bei der SSID. **Das Feld deshalb einmal bewusst setzen**, auch wenn „WPA2" schon dasteht.

**WLAN-Passwort** — das Passwort im Klartext; das Augensymbol schaltet die Anzeige um. Das Feld verschwindet, wenn als Verschlüsselung *No Password* gewählt ist.

> ⚠️ **Das Passwort liegt im Klartext in der Adapterkonfiguration** (`native.pageConfig[].qrPass`) und ist für jeden mit Objekt-Leserecht sichtbar. Die zentrale, verschlüsselte Ablage ist in Arbeit (PR [#782](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/pull/782)); bis dahin gilt: Wer das nicht möchte, nimmt für die Gäste ein eigenes Gastnetz mit einem Passwort, dessen Verlust nicht schmerzt.
>
> Nebenwirkung: Schaltet man den QR-Typ später von *WLAN* auf etwas anderes, bleiben Passwort und Verschlüsselungsart **unsichtbar in der Konfiguration stehen**. Wer sie los werden will, löscht das Passwortfeld, solange der Typ noch auf WLAN steht.

**Verstecktes Netzwerk** — setzt im Code die Markierung `H:`, damit sich der Scanner auch mit einem Netz verbindet, das seinen Namen nicht aussendet.

**Passwort verbergen** — lässt die Passwortzeile am Panel leer.

> ⚠️ **Das ist keine Sicherheitsfunktion.** Der Haken verbirgt nur die Textzeile; **im QR-Code steht das Passwort weiterhin** und jeder Scanner liest es aus. Genau dafür ist die Karte da. Der Haken hilft gegen Mitlesen über die Schulter, nicht gegen Abfotografieren des Codes.

## 5. Das WLAN per Schalter freigeben

**Schalter/Status, um WLAN zu aktivieren** nimmt einen Datenpunkt mit `type=boolean`, der sowohl lesbar als auch beschreibbar ist (die Objektauswahl zeigt nur solche). Üblicher Fall: das Gastnetz im Router ist normalerweise aus und wird nur eingeschaltet, wenn Besuch da ist.

Was dieser Datenpunkt **wirklich** bewirkt, steht so nicht in der Oberfläche:

- Die **zweite Zeile der Karte wird zum Schalter**. Sie zeigt dann ein grünes `wifi`-Symbol mit `WlanOn` bzw. ein graues `wifi-off` mit `WlanOff`, und ein Druck darauf schaltet den Datenpunkt um.
- **Die Passwortzeile verschwindet damit**, denn es gibt nur diese eine Zeile. Wer Schalter *und* Passwortanzeige möchte, kann das auf dieser Karte nicht haben.
- Der QR-Code selbst bleibt unverändert sichtbar — auch wenn das Netz gerade aus ist.

## 6. Was auf dem Panel erscheint

Die Karte ist fest aufgebaut: Überschrift, QR-Code, darunter **genau zwei Zeilen**.

| Zeile | Inhalt |
|---|---|
| **1** | Symbol und Beschriftung je Typ — Freitext: `qrcode-scan` ohne Beschriftung · WLAN: `wifi` mit „SSID" · URL: `web` mit „URL / Website" · Telefon: `phone` mit „Telephone". Als Wert steht der eingetragene Inhalt. |
| **2** | Ohne Schalter: Symbol `key-wireless` (nur bei WLAN) mit „Password" und dem Passwort als Wert — leer, wenn *Passwort verbergen* gesetzt ist. Mit Schalter: die Schaltfläche aus [Abschnitt 5](#5-das-wlan-per-schalter-freigeben). |

> Die Beschriftungen dieser beiden Zeilen — „SSID", „Password", „URL / Website", „Telephone", „WlanOn", „WlanOff" — sind im Adapter **fest englisch** hinterlegt und werden nicht übersetzt. Auf einem deutschen Panel steht dort also „Password", nicht „Passwort".

Die Karte aktualisiert sich höchstens einmal pro Sekunde. Wie viele QR-Seiten man anlegt, ist nicht begrenzt.

## 7. Panel-Zuweisung und Navigation

Panel, Navigationsziele, *Startseite*, *Versteckt* und *Verhalten des Bildschirmschoners* liegen — wie bei allen Kartentypen — in der rechten Spalte und sind unter [PageConfig – Übersicht](PageConfig#panelzuweisung-und-navigation) beschrieben. Die QR-Seite hat dort keine Besonderheiten.

Erinnerung: Eine Seite **ohne Panel-Zuweisung** wird nicht gebaut und ist am Panel nicht vorhanden.

## 8. Aus einer alten Konfiguration übernommen

Wer die QR-Seiten früher in der eigenen Tabelle `pageQRdata` gepflegt hat, findet sie nach dem Update als Seiten im Tab PageConfig wieder. Die Umstellung passiert beim ersten Start von selbst.

> ⚠️ **Passwort und Verschlüsselungsart musst du neu eintragen.** Die Umstellung überträgt Name, Überschrift, Typ, Inhalt, Schalter-Datenpunkt und die beiden Haken — **nicht** das Passwort und **nicht** die Verschlüsselungsart. Danach steht das Passwortfeld leer und die Verschlüsselung fällt auf `WPA` zurück. Der QR-Code wird trotzdem gebaut und sieht gültig aus; nur verbindet sich niemand mehr. Eine Log-Meldung dazu gibt es nicht.
>
> Nach einem Update einer bestehenden Anlage also: **jede QR-Seite einmal öffnen**, Passwort eintragen und die Verschlüsselung bewusst setzen.
