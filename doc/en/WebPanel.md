# Web panel

Since version **1.7.0** the adapter also shows the panel UI **in a web browser** — with the same pages,
popups and screensavers as on the NSPanel. It brings its own small web server for this; no Tasmota and no
panel hardware are needed.

There are two kinds:

- **A real panel in the browser:** every configured NSPanel can also be opened in a browser. The browser
  behaves like an **additional** panel with the same configuration.
- **A standalone web panel:** a panel **without any hardware**, e.g. for a tablet on the wall or for trying
  out pages at the desk.

Contents:

1. [Switching on and address](#1-switching-on-and-address)
2. [Opening a real panel in the browser](#2-opening-a-real-panel-in-the-browser)
3. [Adding a standalone web panel](#3-adding-a-standalone-web-panel)
4. [Operation in the browser](#4-operation-in-the-browser)
5. [Protecting access: PIN, HTTPS, security key](#5-protecting-access-pin-https-security-key)
6. [What a web panel cannot do](#6-what-a-web-panel-cannot-do)
7. [Pitfalls](#7-pitfalls)

## 1. Switching on and address

The settings are in the instance settings, tab **Web panels**. At the top the tab shows the address under
which the panels can be reached.

| Field | Meaning |
|---|---|
| **Enable web panels** | Switches the web server on. **On by default.** |
| **Web panel port** | Default `8090`. |
| **Bind address** | Network interface the server listens on. `0.0.0.0` (default) = all. |
| **Host name for the links** | Only used for the links in the admin, the address preview and the log message. Empty = the adapter detects it. With HTTPS enter the name from the certificate. |
| **PIN**, **HTTPS**, **FIDO2** | see [section 5](#5-protecting-access-pin-https-security-key) |

Every panel has its own address, built from its **topic**:

```
http://<ioBroker host>:8090/<topic of the panel>
```

The start page `http://<ioBroker host>:8090/` lists all panels with model and number of connected
browsers. It is easier from the admin: the button **Open web panel in a new tab** is in the panel overview
(tab *NSPanel settings*), in the [Maintain](Maintain) tab and in [Panelinfo](Panelinfo). If a PIN is set,
this button logs the browser in right away.

> All settings of this tab only apply after **saving** — the instance restarts.

## 2. Opening a real panel in the browser

Nothing to set up: when web panels are switched on, **every** NSPanel can be reached under its topic.
The ID of the panel works instead of the topic as well.

Good to know:

- **The browser navigates independently of the real panel.** It is an additional panel with the same
  configuration — opening another page in the browser does not change the display on the wall.
- **All browsers on the same address stay in sync**: if two devices open the same panel, both show the
  same page.
- The browser shares the **states** with the real panel (`panels.<panel>.*`). Commands under `cmd.*` —
  screensaver or brightness, for example — therefore also act in the browser. The values under `info.*`
  (firmware, Wi-Fi, status) are written by the real panel only.
- If the real panel is **deactivated** or not running, the browser shows nothing either and retries later.

## 3. Adding a standalone web panel

1. Open the tab **NSPanel settings**. Next to *NSPanel initialization* there is the button
   **Add web panel** — it only appears when web panels are switched on.
2. Fill in the dialog:
   - **Panel name** — unique.
   - **Topic** — unique, becomes the path of the address. Letters, digits, `_` and `-` are allowed, plus `/`
     as separator. Not allowed as first part: `assets`, `fonts`, `icons`, `auth`, `ws` (the web server
     uses them itself). Below the field the dialog shows the resulting address.
   - **Hardware model** — EU landscape, US landscape or US portrait. This sets format and aspect ratio of
     the display.
3. Confirm with **Save**, then save the instance settings.

The web panel gets an ID of the form `web_` + 12 characters automatically and appears in the panel overview
with the label **Web**. The **pencil** changes name, topic and model — a new topic is also a new address.
It is deleted with the **trash can**; this only works while the instance is running.

**It gets pages like any other panel:** in the [PageConfig](PageConfig) tab the web panel shows up in the
panel selection, pages and navigation are assigned the same way. A configuration script is **not
needed** — without a script it starts with the admin configuration (from the version after 1.7.0; in 1.7.0
itself a web panel still needed a script).

Its states are under `panels.web_<…>.*`. When no browser is connected any more, it reports itself offline.

## 4. Operation in the browser

- **Tapping or clicking** acts like a press on the display — mouse and touch alike.
- **Holding** (from about 0.6 seconds) is the long press: on a tile of a menu page a short press switches,
  holding opens the detail popup — like on the real panel.
- **The two hardware buttons** are bars below the display. They trigger the action configured for the
  buttons and set `panels.<panel>.buttons.left`/`right`. **They do not switch relays.**
- **Buzzer:** the browser plays the tones itself — but only after the first tap. Browsers require this;
  tones before that are dropped silently.
- **Screensaver and dimming** work like on the panel: after the configured time the display dims, a tap
  wakes it.
- **Size:** the display is scaled to the window with a fixed aspect ratio, free space stays black. There is
  no fullscreen button of its own; use the browser's fullscreen (usually `F11`).
- **Connection lost:** the page turns grey with a hint. After an adapter restart the browser reconnects on
  its own.

## 5. Protecting access: PIN, HTTPS, security key

> ⚠️ **Without a PIN every web panel is open** — anyone who reaches the port on the network can operate
> it. Since web panels are on by default, this also applies to every real panel. The log warns about it at
> start. If you do not need web panels, switch them off; if you do, set a PIN.

**Web panel PIN** — one shared PIN for all web panels, real and standalone. Every browser enters it
**once** and stays logged in. A **new PIN logs out all browsers**. After five wrong entries within a minute
that computer has to wait one minute.

**HTTPS (ioBroker certificates)** — serves the panels encrypted. The certificates are chosen from the
ioBroker certificates (system settings): **public certificate**, **private certificate** and, if needed,
the **chained certificate**. Without valid certificates the web panels stay **off** — there is no fallback
to unencrypted HTTP.

**FIDO2 security key** — a security key or passkey can be used instead of the PIN. The PIN stays in place;
the key is a more convenient way to log in. Requirements:

1. HTTPS is switched on,
2. the web panel is opened via a **host name**, **not via an IP address**,
3. the browser trusts the certificate (a self-signed one works when it is installed as trusted in the
   browser or the system).

The key is registered **in the browser**, not in the admin: follow the registration link on the start page
of the web panels (`/auth/fido/register`), log in once with the PIN, give it a name. After that the login
page offers *Sign in with a security key*. In the admin the *Web panels* tab lists all registered keys with
the date of last use; they are also **removed** there (only while the instance is running).

## 6. What a web panel cannot do

A web panel has neither Tasmota nor a Nextion display. Therefore there is:

- **no firmware or TFT update** and nothing to flash,
- **no relays** — not even in the browser view of a real panel; the relays of the real panel stay
  untouched,
- **no temperature sensor** (and hence no temperature offset),
- **no Tasmota commands** except the buzzer, no Tasmota restart,
- **no update icon** on the screensaver.

## 7. Pitfalls

- **Port in use:** if something else already runs on the port, the web panels stay off; the log names the
  next free port. Enter that one in the tab.
- **Settings do not take effect:** all fields of the tab only apply after saving and restarting the
  instance.
- **FIDO2 is not offered:** HTTPS off, opened via an IP address or certificate not trusted — check the three
  requirements from section 5.
- **The web server's own pages** (start page, login, "Panel not found") are English only; the panel UI
  itself uses the configured language.
