# Page QR (`cardQR`)

The **`cardQR`** generates a QR code on the panel that can be scanned, e.g. with a phone. It can pass on WLAN credentials (guest WLAN), a phone number, a URL or any free text.

The page is configured **entirely in the admin** via the **PageConfig** tab – including its position in the navigation (the **Navigation/Panel** pane). An entry in the configuration script is **not required** for this.

**Content**
+ [Settings in the admin](#settings-in-the-admin)
    + [Free text (FREE)](#free-text-free)
    + [WLAN (Wifi)](#wlan-wifi)
    + [URL](#url)
    + [Phone (TEL)](#phone-tel)
+ [Navigation / Panel](#navigation--panel)
+ [Optional reference in the script](#optional-reference-in-the-script)

---

## Settings in the admin

The general handling of the tab is described under [Page Config](en-PageConfig). First choose the page type **QR**, enter a unique name in the "new page" field and create it with the plus button.

> [!NOTE]
> The name (`uniqueName`) must be unique across the whole adapter.

Then the QR type and the headline are set.

> 🖼️ **Image missing:** PageConfig editor for a QR page (QR type selection, headline, type-dependent fields).
> Path: `Pictures/pageQR/config.png`

![QR configuration in the admin](Pictures/pageQR/config.png)

The QR type is determined via the field **"QR type selection"** (`selType`):

| Selection | `selType` | QR code content |
|-----------|:---------:|-----------------|
| Free text | 0 | any text |
| Wifi | 1 | WLAN credentials |
| URL | 2 | web address |
| Phone | 3 | phone number |

Common to all types is the field **"SSID/URL/phone"** (`ssidUrlTel`), into which – depending on the type – the text, the SSID, the URL or the phone number is entered.

### Free text (FREE)
Any QR code content can be entered here as free text.

### WLAN (Wifi)
For the Wifi type the following additional fields are available:

| Field (admin label) | Key | Description |
|---------------------|-----|-------------|
| WLAN SSID | `ssidUrlTel` | name of the WLAN |
| WLAN encryption | `wlantype` | `nopass`, `WPA`, `WPA2`, `WPA3` or `WEP` (default `WPA`) |
| Password | `qrPass` | WLAN password (may be left empty) |
| hidden network | `wlanhidden` | enable if the network is not visible (hidden SSID) |
| hide password | `pwdhidden` | hides the password on the panel; it is still contained in the QR code |
| Switch/state | `setState` | optional boolean state |

> [!NOTE]
> If a `setState` is configured, a switch is shown on the panel in place of the password, toggling the state between `true`/`false`.

> 🖼️ **Image missing:** Panel view of a WLAN QR with visible password resp. with a switch.
> Path: `Pictures/pageQR/panel-wifi.png`

![WLAN QR on the panel](Pictures/pageQR/panel-wifi.png)

### URL
The classic QR code with a stored URL that can be opened after scanning (e.g. `https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki`).

### Phone (TEL)
Embeds a phone number that can be dialled directly after scanning. To stay international the number should begin with the country code (e.g. `+49` for Germany).

---

## Navigation / Panel

In the left "Navigation/Panel" pane, the **"Navigation"** tab sets the position in the page hierarchy. First select the panel or "all", then choose before (`prev`) or after (`next`) which page the QR page should sit.

> [!NOTE]
> Use only one of **Prev** or **Next**. **Home** and **Parent** show a house icon resp. an up arrow linked to the chosen page.

The **"Page details"** tab controls whether the page is hidden when the state
`nspanel-lovelace-ui.0.panels.<MAC>.cmd.hideCards` is set to `true`, and the screensaver behaviour:
+ **Standard timeout** → screensaver appears after the configured time.
+ **never activate** → page stays visible until you switch manually.
+ **inherit from previous page** → takes over the setting of the previous page.

---

## Optional reference in the script

If the QR page is configured in the admin **including its navigation** (the **Navigation/Panel** pane), **no script entry is needed** – it appears on the panel from the admin configuration alone.

A reference in the script only makes sense if the panel navigation is built entirely via the configuration script (instead of the admin's navigation pane). In that case a minimal reference with an identical `uniqueName` is enough; the page content still comes from the admin.

```typescript
// Only needed when navigation is set via the script – as a subpage under subPages
const wlanQRSub: ScriptConfig.PageQR = {
    type: 'cardQR',
    uniqueName: 'guestwifi', // must match the name in the admin
    prev: 'main',
    home: 'main',
};
```

> [!NOTE]
> Do not position the same `uniqueName` both in the admin **with** navigation and in the script. By default the script page takes precedence and the admin entry of the same name is skipped with a warning.

Overview of all page types under [Pages](en-Pages).
