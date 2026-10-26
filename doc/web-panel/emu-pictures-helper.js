// Hilfsskript für die Referenzbilder (Panel 'emu', Topic emu_topic).
// SCHRITT wählen, Skript starten, Bild machen, nächsten SCHRITT wählen.
// Gehört zu doc/web-panel/emu-pictures-config.ts.

const SCHRITT = 'standard';
// 'standard'      Standard-Screensaver
// 'alternate'     Alternativ-Screensaver
// 'advanced'      Advanced-Screensaver
// 'easyview'      EasyView
// 'statusAn'      Status-Icons links/rechts an  (Standard-Screensaver)
// 'statusAus'     Status-Icons links/rechts aus (Standard-Screensaver)
// 'glocke'        Glocke neben der Uhrzeit
// 'notifyScr'     Benachrichtigung auf dem Screensaver
// 'popupInfo'     popupNotify ohne Buttons, langer Text
// 'popupButtons'  popupNotify mit drei Buttons
// 'aufraeumen'    Glocke, Benachrichtigung und Status-Icons zurücksetzen

const PANEL = 'nspanel-lovelace-ui.0.panels.D4_8A_FC_9F_64_60.cmd.';
const LAYOUT = {standard: 0, alternate: 1, advanced: 2, easyview: 3};

function setCmd(id, val) {
    setState(PANEL + id, val, false);
}

function popup(details) {
    const defaults = {
        id: 'bilder', priority: 50, type: 'information', headline: '', text: '',
        buttonLeft: '', buttonMid: '', buttonRight: '', icon: '', textSize: 3, global: false,
    };
    const d = Object.assign(defaults, details);
    for (const key of Object.keys(d)) {
        setCmd('pagePopup.' + key, d[key]);
    }
    setTimeout(() => setCmd('pagePopup.activate', true), 500);
}

switch (SCHRITT) {
    case 'standard':
    case 'alternate':
    case 'advanced':
    case 'easyview':
        setCmd('screenSaver.layout', LAYOUT[SCHRITT]);
        break;
    case 'statusAn':
    case 'statusAus':
        setCmd('screenSaver.layout', LAYOUT.standard);
        setState('0_userdata.0.Light.On_Actual', SCHRITT === 'statusAn');
        setState('0_userdata.0.Scoket.actual', SCHRITT === 'statusAn');
        break;
    case 'glocke':
        setCmd('screenSaver.layout', LAYOUT.standard);
        setCmd('screenSaver.infoIcon', 'bell-ring-outline');
        break;
    case 'notifyScr':
        setCmd('screenSaver.headingNotification', 'Müllabfuhr');
        setCmd('screenSaver.textNotification', 'Morgen wird die Biotonne abgeholt.\r\nBitte heute Abend rausstellen.');
        setCmd('screenSaver.activateNotification', true);
        break;
    case 'popupInfo':
        popup({
            headline: 'Information',
            icon: 'information-outline',
            text: 'Dies ist ein langer Benachrichtigungstext, der über mehrere Zeilen umbrechen soll, '
                + 'damit man sieht, wie das Panel lange Texte setzt und wo es sie abschneidet. '
                + 'Noch ein Satz, damit es wirklich lang wird.',
        });
        break;
    case 'popupButtons':
        popup({
            type: 'acknowledge',
            headline: 'Haustür',
            icon: 'door-open',
            text: 'Die Haustür steht seit 10 Minuten offen.',
            buttonLeft: 'Ignorieren',
            buttonMid: 'Später',
            buttonRight: 'OK',
        });
        break;
    case 'aufraeumen':
        setCmd('screenSaver.infoIcon', '');
        setCmd('screenSaver.activateNotification', false);
        setState('0_userdata.0.Light.On_Actual', false);
        setState('0_userdata.0.Scoket.actual', false);
        break;
}

setTimeout(() => stopScript(undefined), 2000);
