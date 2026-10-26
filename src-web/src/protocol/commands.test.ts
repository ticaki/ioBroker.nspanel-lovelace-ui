import { describe, expect, it } from 'vitest';
import {
    buttonPress2,
    hardwareButtonEvent,
    isPopupPage,
    isScreensaverPage,
    pageOpenDetailEvent,
    parseCommand,
    renderCurrentPageEvent,
    sleepReachedEvent,
    startupEvent,
} from './commands';

describe('parseCommand', () => {
    it('splits command and args', () => {
        expect(parseCommand('time~18:17~tTimeAdd')).toEqual({
            cmd: 'time',
            args: ['18:17', 'tTimeAdd'],
            raw: 'time~18:17~tTimeAdd',
        });
        expect(parseCommand('pageType~screensaver').args).toEqual(['screensaver']);
        expect(parseCommand('').cmd).toBe('');
    });
});

describe('event builders', () => {
    it('build the strings of HMI/Readme.md', () => {
        expect(buttonPress2('light.bed_light', 'OnOff', 1)).toBe('event,buttonPress2,light.bed_light,OnOff,1');
        expect(buttonPress2('bSubPrev', 'button')).toBe('event,buttonPress2,bSubPrev,button');
        expect(buttonPress2('screensaver', 'bExit', '')).toBe('event,buttonPress2,screensaver,bExit,');
        expect(startupEvent(55, 'eu', '5.1.1')).toBe('event,startup,55,eu,5.1.1');
        expect(renderCurrentPageEvent('cardGrid')).toBe('event,renderCurrentPage,cardGrid');
        expect(sleepReachedEvent('cardGrid')).toBe('event,sleepReached,cardGrid');
        expect(pageOpenDetailEvent('popupLight', 'light.x')).toBe('event,pageOpenDetail,popupLight,light.x');
        expect(hardwareButtonEvent(2)).toBe('event,button2');
    });
    it('classifies page types', () => {
        expect(isScreensaverPage('screensaver2')).toBe(true);
        expect(isScreensaverPage('cardGrid')).toBe(false);
        expect(isPopupPage('popupLight')).toBe(true);
    });
});
