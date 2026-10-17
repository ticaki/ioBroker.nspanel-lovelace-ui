# NSPanel settings

This is where panels are **created, updated and removed**. The upper part is the setup form, below it every known panel has a card.

<img alt="NSPanel settings" src="../Pictures/Installation/install-02-nspanel-einstellungen.png" width="100%"/>

The tab appears as soon as the [MQTT server settings](General) are complete — a panel does not have to exist yet, because this is where the first one is created.

## 1. The setup form

| Field | Meaning |
|---|---|
| **IP of ioBroker** | Only with the adapter's own MQTT server: the address under which the panel reaches ioBroker. |
| **IP of the panel** | The panel's fixed IP; checked for a valid IPv4 format. |
| **Panel name (unique)** | Name of the panel, later used for the script and the states. |
| **MQTT topic (unique)** | Topic of the panel. Must start with a letter and be at least four characters long. |
| **NSPanel hardware model** | EU landscape, US landscape or US portrait. |
| **Time zone** | The time zone handed to the panel. |

The button below reads **NSPanel initialisation** for a new topic and **update NSPanel configuration** if a panel with that topic already exists. It only becomes active once every field is valid and the instance is running.

What the initialisation then does — three steps, Berry driver, TFT firmware — is described in detail under [adapter installation](Adapter-Installation). ⚠️ **At the end a dialog with "save" and "cancel" appears: only "save" adds the panel to the configuration.**

## 2. The panel cards

Each card shows the name, the connection state and, for information only, the **MAC address**, the **IP**, the **MQTT topic** and the **hardware model**.

| Control | Effect |
|---|---|
| **Pencil** | Copies IP, name, topic and model into the form above so they can be changed; the frame blinks briefly. **The change itself only happens** when *update NSPanel configuration* is pressed afterwards. |
| **Bin** | Asks for confirmation and then removes the panel **from the configuration**. The device itself keeps its Tasmota settings; to really wipe it, use the factory reset in the Tasmota tools. |
| **Open Tasmota console** | Opens the console of the panel's Tasmota web interface in a new tab — Tasmota messages run through live there and commands can be entered. |

## 3. Common pitfalls

- **Topic already in use:** two panels must not share a topic. Otherwise the button switches to "update" and overwrites the existing panel.
- **The panel was attached to another host before:** run `reset 4` on the Tasmota console before initialising.
- **After restoring an ioBroker backup:** delete the panels and create them again — the certificates are regenerated.
- **No internet on the panel:** the initialisation stops with a message, because the panel downloads the Berry driver and the TFT firmware itself.
