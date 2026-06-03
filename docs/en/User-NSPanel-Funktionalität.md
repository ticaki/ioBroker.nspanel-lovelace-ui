# Feature Overview

This page gives an overview of what the **NSPanel Lovelace UI** can do before you dive into the individual configuration pages. It is aimed at new users who want to gauge whether the adapter covers their use cases.

## What is the NSPanel?

The **Sonoff NSPanel** is a smart wall switch with:

- two physical relay switches
- a 3.5-inch touchscreen
- temperature and brightness sensors

Originally intended for the eWeLink app, it can be integrated much more powerfully into ioBroker using alternative firmware.

## What does the NSPanel Lovelace UI do?

The NSPanel Lovelace UI is an alternative user interface for the Sonoff NSPanel in the style of the Home Assistant Lovelace UI. It installs its own Nextion firmware (TFT) on the display and is controlled entirely from ioBroker. Communication typically runs over **Tasmota** (firmware on the ESP) and **MQTT**.

This lets you, directly on the display:

- show Lovelace-like **cards** with devices and sensors
- display **sensor values** (e.g. temperature, humidity)
- control **lights, shutters, thermostats** and other devices
- trigger **scenes and automations**
- show a **screensaver** with time, date and weather

## Operating concept

The panel always shows **one page** at a time. You switch between pages and open **popups** for detailed control (e.g. brightness, color, fan speed) using navigation arrows, tapping tiles, and the hardware buttons. From the idle state (screensaver), a tap takes you back to the first page.

- **Navigation:** How pages are linked is described in [Navigation Overview](en-Navigation) and [Navigation Flow](en-naviFlow).
- **Hardware buttons:** The two relays/buttons can be freely assigned (see [Configuration Script](en-ScriptConfig)).

## Page types (cards)

The adapter provides various page types. A full overview with the internal type names is available under [Standard Pages](en-Pages).

| Page type | Purpose | Docs |
|-----------|---------|------|
| Menu/grid page | Tile overview with devices and subpages | [Page Menu](en-cardGrid) |
| Entities/list page | List of controls and values | [Standard Pages](en-Pages) |
| Thermostat | Heating/climate control | [Page Thermo2](en-PageThermo2) |
| Media | Media player control | [Page Media](en-PageMedia) |
| Power/energy | Energy flow display | [Page Power](en-PagePower) |
| Chart | History charts | [Page Chart](en-PageChart) |
| Alarm | Alarm system with PIN | [Page Alarm](en-cardAlarm) |
| QR code | Wi-Fi/URL/text QR code | [Page QR](en-cardQR) |
| Schedule/trash | Appointment and waste-collection overview | [Page Trash](en-cardTrash) |
| Popup notification | Pop-up messages | [Page PopupNotify](en-PagePopup) |

## Popups for detailed control

Tapping a tile opens matching popups depending on the device type, e.g.:

- **Light:** on/off, brightness, color temperature, color
- **Shutter/blind:** up/down/stop, position, slats
- **Thermostat:** target temperature, mode
- **Fan:** speed levels
- **Timer / slider / selection:** generic input popups

## Screensaver

When idle, the panel shows a **screensaver** with time, date, weather (current + forecast) and optional status icons. Layout, colors and content are extensively configurable — see [Screensaver](en-screensaver).

## Additional features

- **Buzzer control:** tone signals for button presses and notifications (requires `SetOption111 1` in Tasmota).
- **Color themes:** selectable and customizable color palettes for the entire interface — see [Color Themes](en-ColorThemes).
- **Multiple panels:** a single adapter instance can manage several NSPanels at once.
- **Templates:** reusable templates for common devices (see [Developer Templates](en-Developer-Templates)).

## Requirements

- Sonoff NSPanel with **Tasmota** firmware and the **NSPanel Lovelace UI TFT** flashed (see [Flash NSPanel](en-NSPanel-flashen))
- A running **MQTT server** (e.g. the ioBroker MQTT adapter, see [MQTT Server Settings](en-General))
- ioBroker with the adapter installed (see [Adapter Installation](en-Adapter-Installation))

## Next steps

1. [Flash NSPanel](en-NSPanel-flashen) — install the firmware
2. [Adapter Installation](en-Adapter-Installation) — set up the adapter
3. [Configuration Script — Introduction](en-ScriptConfig) — create your first pages
4. [Standard Pages](en-Pages) — page types in detail
