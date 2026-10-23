# Feature overview

This page gives an overview of what the adapter can do before you dive into the individual configuration pages. It is meant for anyone who wants to judge whether the NSPanel covers their use cases.

Contents:
- [1. The NSPanel as a device](#1-the-nspanel-as-a-device)
- [2. What the adapter turns it into](#2-what-the-adapter-turns-it-into)
- [3. How it is operated](#3-how-it-is-operated)
- [4. Page types](#4-page-types)
- [5. Popups](#5-popups)
- [6. Screensaver](#6-screensaver)
- [7. Two ways to configure it](#7-two-ways-to-configure-it)
- [8. Hardware buttons, relays and buzzer](#8-hardware-buttons-relays-and-buzzer)
- [9. What you need](#9-what-you-need)

## 1. The NSPanel as a device

The SONOFF NSPanel is a wall switch with

- two physical relays,
- a 3.5-inch touchscreen,
- sensors for temperature and brightness.

Out of the box it works with the eWeLink app. With alternative firmware it can be integrated into ioBroker far more powerfully — which is where this adapter comes in.

## 2. What the adapter turns it into

The adapter installs its own Nextion firmware (TFT) on the display and drives the whole screen from ioBroker. The connection runs through **Tasmota** on the panel's ESP and an **MQTT broker**.

On the display you can then

- show Lovelace-style cards with devices and sensors,
- display readings (temperature, humidity, consumption),
- control lights, shutters, thermostats and other devices,
- trigger scenes and automations,
- show a screensaver with time, date and weather.

## 3. How it is operated

The panel always shows **one** page. You move between pages with navigation arrows, by tapping tiles and with the two hardware buttons; detailed control (brightness, colour, fan speed) happens in **popups**. From the idle state — the screensaver — a tap takes you back to the first page.

How pages are linked is described under Navigation *(page to come)*; the assignment of the hardware buttons belongs to the configuration script.

## 4. Page types

The adapter ships several card types. Which page can be created in the admin and which one comes from the script is listed under [standard pages](Pages).

| Card type | Purpose |
|---|---|
| `cardEntities` | List of controls and values |
| `cardGrid`, `cardGrid2`, `cardGrid3` | Tile overview with devices and subpages, in three densities |
| `cardThermo`, `cardThermo2` | Heating and climate; `cardThermo2` handles up to eight heat circuits |
| `cardMedia` | Media player control |
| `cardPower` | Energy flow with sources and consumers |
| `cardChart`, `cardLChart` | History charts |
| `cardAlarm` | Alarm system with PIN and state changes |
| `cardQR` | Wi-Fi access as a QR code |
| `cardUnlock` | Lock pages against accidental operation |
| `cardSchedule` | Schedules |
| `cardTrash` | Waste collection dates |

Two items are still in progress according to the project README: `cardLChart2` and the colour picker popup `popupColor`.

## 5. Popups

Popups open from within a page and control a single device in detail: `popupLight` and `popupLightNew` (brightness, colour, colour temperature), `popupShutter` and `popupShutter2` (shutters, slats), `popupThermo` (thermostat), `popupFan` (fan), `popupInSel` (selection lists), `popupTimer` and `popupSlider`. Which variant is used is decided by the adapter itself — the new one, except for a shutter with slats.

A different thing altogether is the **notification popup** (`popupNotify`): not a detail view of a device but a system page that puts a message on top of everything else. It is driven by states or `sendTo` and described under [Popups](pagePopup).

## 6. Screensaver

When idle, the panel shows a screensaver with time, date, weather and freely assignable value slots, plus status badges and indicator buttons. Several versions with different layouts exist (standard, alternate, advanced, easyview). It can be set up in the admin ([screensaver – admin](Screensaver-Admin)) or in the script.

## 7. Configuration in the admin — and when the script

**The admin is the way to go:** every page and the screensaver are created there, with a preview of the panel, and stored in the instance.

The **configuration script** remains for **experienced users** and **special cases** — situations that cannot be expressed in the admin. If you are starting out, you do not need it.

| | Admin | Configuration script |
|---|---|---|
| For whom | everyone | experienced users |
| Effort | clicking, with a preview of the panel | writing JavaScript |
| Scope | all pages, screensaver, basic panel settings | special cases beyond the admin |
| Stored in | the instance | the script |
| Interaction | applies to the panels listed | steps in where no admin page exists |

> **Anything missing in the admin should be reported.** If a setting cannot be made there, it is a case for the development team ([issue](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues)) — not a reason to detour through the script.

## 8. Hardware buttons, relays and buzzer

The panel's two buttons and the relays behind them are freely assignable — they can switch locally or merely report to ioBroker. The built-in buzzer can be used for button sounds and notifications (Tasmota command `Buzzer`, which requires `SetOption111 1`).

## 9. What you need

- a SONOFF NSPanel (EU or US version),
- Tasmota on the panel — the adapter installs the Berry driver and the TFT firmware itself,
- an MQTT broker reachable by both ioBroker and the panel,
- the adapter itself,
- a weather source as an adapter instance if you want weather on the screensaver.
