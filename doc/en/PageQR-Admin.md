# QR code page – configuration in the admin

The QR page shows a **QR code** on the panel with two lines of text below it. The most common purpose: guests scan the code and are on the WiFi without typing the password. The card can also carry any text, a web address or a phone number.

You create it in the **PageConfig** tab, page type **QR**. No configuration script is needed for this.

Contents:
- [Creating the page](#1-creating-the-page)
- [QR code type](#2-qr-code-type)
- [Headline and content](#3-headline-and-content)
- [WiFi: encryption, password, hidden network](#4-wifi-encryption-password-hidden-network)
- [Enabling the WiFi with a switch](#5-enabling-the-wifi-with-a-switch)
- [What appears on the panel](#6-what-appears-on-the-panel)
- [Panel assignment and navigation](#7-panel-assignment-and-navigation)
- [Taken over from an old configuration](#8-taken-over-from-an-old-configuration)

## 1. Creating the page

1. Open the instance settings → tab **PageConfig**.
2. On the left pick the page type **QR**, enter a name in *New Page*, press **+**.
3. The page appears in the list and the editor opens on the right.

The name is the unique ID of the page — other pages address it by that name in their navigation targets. For renaming and its pitfalls see [PageConfig – Overview](PageConfig#creating-renaming-and-deleting-pages).

> **Every field is greyed out while the instance is not running.** The editor queries the adapter live; with a stopped adapter nothing can be entered and nothing can be created. The interface gives no explanation for this — the greyed-out form is the only hint.

## 2. QR code type

Four radio buttons decide **what** the code contains. Which fields appear below depends on it:

| Type | Content of the code | Further fields |
|---|---|---|
| **Free Text** | the text unchanged | none |
| **WiFi** | `WIFI:T:<encryption>;S:<SSID>;P:<password>;H:<hidden>;` | encryption, password, hidden network, switch |
| **URL** | `URL:<address>` | none |
| **Phone** | `TEL:<number>` | none |

The type is preset to **Free Text**.

## 3. Headline and content

**Headline** sits above the code. Creating the page fills in the page name; if you clear the field, the panel shows `Page QR`.

The field below carries the actual content and **changes its label** with the type: *QR String*, *WiFi SSID*, *URL* or *Phone Number*.

> **Nothing is validated here.** No required entry, no length limit, no check whether an address looks like an address. An empty field produces an empty QR code — and you only see that on the panel, because the editor has no preview.

Two things the adapter does with the content, worth knowing when a code does not work:

- **A tilde `~` is replaced by `-`.** This applies to the whole message sent to the panel, so to SSID and password as well. A password containing a tilde arrives changed — without any notice.
- **Special characters in the WiFi code are not escaped.** If the SSID or password contains a `;`, `:`, `,` or `\`, that breaks the structure of the `WIFI:` code and the scanner reads nonsense. If your password contains such characters, the QR card is not an option for it.

## 4. WiFi: encryption, password, hidden network

These four fields only appear for the type **WiFi**.

**WiFi Encryption** — the choices are *No Password*, *WPA*, *WPA2*, *WPA3* and *WEP*.

> ⚠️ **As long as the field has not been touched, the interface shows `WPA2`, but the adapter writes `WPA` into the QR code.** The displayed value is only a preset of the interface; nothing is stored until you touch it, and without a stored value the fallback `WPA` applies. Many devices connect anyway, some do not — and then you go looking for the mistake in the SSID. **So set the field deliberately once**, even if „WPA2" is already showing.

**WiFi Password** — the password in clear text; the eye icon toggles the display. The field disappears when the encryption is set to *No Password*.

> ⚠️ **The password is stored in clear text** in the adapter configuration (`native.pageConfig[].qrPass`) and is visible to anyone with read access to the objects. The central, encrypted storage is in the works (PR [#782](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/pull/782)); until then: if you do not want that, use a separate guest network for your visitors with a password whose loss does not hurt.
>
> Side effect: if you later switch the QR type from *WiFi* to something else, password and encryption **stay in the configuration, invisibly**. To get rid of them, clear the password field while the type is still WiFi.

**Hidden Network** — sets the `H:` marker in the code so the scanner also connects to a network that does not broadcast its name.

**Hide Password** — leaves the password line on the panel empty.

> ⚠️ **This is not a security feature.** The checkbox only hides the text line; **the QR code still contains the password** and any scanner reads it out. That is exactly what the card is for. The checkbox helps against someone reading over your shoulder, not against a photo of the code.

## 5. Enabling the WiFi with a switch

**Switch / state to enable WiFi** takes a state of `type=boolean` that is both readable and writable (the picker only offers such states). The usual case: the guest network on the router is normally off and only switched on when visitors are there.

What this state **really** does is not stated in the interface:

- The **second line of the card turns into a switch**. It then shows a green `wifi` icon with `WlanOn` or a grey `wifi-off` with `WlanOff`, and pressing it toggles the state.
- **The password line disappears with it**, because there is only this one line. If you want the switch *and* the password display, this card cannot do both.
- The QR code itself stays visible unchanged — even while the network is off.

## 6. What appears on the panel

The card has a fixed layout: headline, QR code, and below it **exactly two lines**.

| Line | Content |
|---|---|
| **1** | Icon and label per type — Free Text: `qrcode-scan` without a label · WiFi: `wifi` with „SSID" · URL: `web` with „URL / Website" · Phone: `phone` with „Telephone". The value is the content you entered. |
| **2** | Without a switch: icon `key-wireless` (WiFi only) with „Password" and the password as the value — empty when *Hide Password* is set. With a switch: the button from [section 5](#5-enabling-the-wifi-with-a-switch). |

> The labels of these two lines — „SSID", „Password", „URL / Website", „Telephone", „WlanOn", „WlanOff" — are hard-coded **in English** in the adapter and are not translated.

The card refreshes at most once per second. There is no limit on how many QR pages you create.

## 7. Panel assignment and navigation

Panel, navigation targets, *Start page*, *Hidden* and *Screensaver behavior* live — as with every card type — in the right-hand column and are described under [PageConfig – Overview](PageConfig#panel-assignment-and-navigation). The QR page has no peculiarities there.

A reminder: a page **without a panel assignment** is not built and does not exist on the panel.

## 8. Taken over from an old configuration

If you used to keep your QR pages in the separate `pageQRdata` table, you will find them as pages in the PageConfig tab after the update. The conversion happens by itself on the first start.

> ⚠️ **You have to re-enter the password and the encryption type.** The conversion carries over name, headline, type, content, the switch state and both checkboxes — but **not** the password and **not** the encryption type. Afterwards the password field is empty and the encryption falls back to `WPA`. The QR code is still built and looks valid; only nobody connects any more. There is no log message about it.
>
> So after updating an existing installation: **open every QR page once**, enter the password and set the encryption deliberately.
