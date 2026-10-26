import { describe, expect, it } from 'vitest';
import { parseCommand } from '../../protocol/commands';
import type { Entity6 } from '../../protocol/types';
import {
    bottomCount,
    handleCommand,
    initial,
    isBlankEntity,
    layoutOf,
    parseColor,
    parseEntityUpd,
    parseNotify,
    parseStatusUpdate,
    parseWeatherUpdate,
    splitAreas,
    splitRuns,
    splitTime,
} from './parse';

const ctx = (pageType = 'screensaver'): { pageType: string; pageArgs: string[] } => ({ pageType, pageArgs: [] });

/** entity as `Screensaver.getData()` normalises it: type and id cleared (except indicator) */
function e(icon: string, color: number, name: string, value: string, id = ''): string {
    return `~${id}~${icon}~${color}~${name}~${value}`;
}
const EMPTY = '~~~~~';
/** `weatherUpdate~<entity>~<entity>~…` as `Screensaver.update()` builds it */
const wu = (...entities: string[]): string => ['weatherUpdate', ...entities].join('~');

// `Screensaver.sendColors()` with the default theme (background HMIDark, LightGray forecast, …)
const COLOR = 'color~6371~65535~65363~54938~65535~54938~54938~54938~54938~54938~54938~54938~54938~54938~65363~1374';

describe('screensaver parse', () => {
    it('ignores entityUpd like the real display', () => {
        const model = initial();
        expect(parseEntityUpd(['Title', 'x'], model, ctx())).toBe(model);
    });

    it('parses the color command of the adapter in the order of HMI/Readme.md', () => {
        const { cmd, args } = parseCommand(COLOR);
        expect(cmd).toBe('color');
        const colors = parseColor(args);
        expect(colors.background).toBe(6371);
        expect(colors.time).toBe(65535);
        expect(colors.timeAmPm).toBe(65363);
        expect(colors.date).toBe(54938);
        expect(colors.mainText).toBe(65535);
        expect(colors.forecast).toEqual([54938, 54938, 54938, 54938]);
        expect(colors.forecastVal).toEqual([54938, 54938, 54938, 54938]);
        expect(colors.bar).toBe(54938);
        expect(colors.mainTextAlt2).toBe(65363);
        expect(colors.timeAdd).toBe(1374);
    });

    it('leaves missing colour fields undefined', () => {
        const colors = parseColor(['6371', '', 'x']);
        expect(colors.background).toBe(6371);
        expect(colors.time).toBeUndefined();
        expect(colors.timeAmPm).toBeUndefined();
        expect(colors.timeAdd).toBeUndefined();
    });

    it('parses statusUpdate with the big-icon flags', () => {
        // Screensaver.HandleScreensaverStatusIcons(): icon1~color1~icon2~color2~bigLeft~bigRight
        const { args } = parseCommand('statusUpdate~A~1374~B 19.0°~65504~1~');
        const [left, right] = parseStatusUpdate(args);
        expect(left).toEqual({ icon: 'A', color: 1374, big: true });
        expect(right).toEqual({ icon: 'B 19.0°', color: 65504, big: false });
        const [noLeft] = parseStatusUpdate(['', '', '', '', '', '']);
        expect(noLeft.icon).toBe('');
        expect(noLeft.color).toBe(65535);
    });

    it('parses notify and clears it on an empty payload', () => {
        expect(parseNotify(['Hohe Zahl: 10', 'Im Datenpunkt steht die Zahl 10.'])).toEqual({
            heading: 'Hohe Zahl: 10',
            text: 'Im Datenpunkt steht die Zahl 10.',
        });
        expect(parseNotify(['', ''])).toBeUndefined();
        expect(parseNotify(['Nur Titel', ''])).toEqual({ heading: 'Nur Titel', text: '' });
        // the adapter sends the line breaks of the state as CR LF
        expect(parseNotify(['Müllabfuhr', 'Zeile 1\r\nZeile 2\rZeile 3'])?.text).toBe('Zeile 1\nZeile 2\nZeile 3');
    });

    it('handleCommand updates only its own part of the model', () => {
        const ctxS = ctx();
        let model = initial();
        model = handleCommand('weatherUpdate', parseCommand(wu(e('S', 65504, '', '15.8 °C'))).args, model, ctxS)!;
        expect(model.entities).toHaveLength(1);
        model = handleCommand('color', parseCommand(COLOR).args, model, ctxS)!;
        model = handleCommand('statusUpdate', ['A', '1', 'B', '2', '', ''], model, ctxS)!;
        model = handleCommand('notify', ['H', 'T'], model, ctxS)!;
        expect(model.entities).toHaveLength(1);
        expect(model.colors?.background).toBe(6371);
        expect(model.status[1].icon).toBe('B');
        expect(model.notify?.heading).toBe('H');
        expect(handleCommand('foo', [], model, ctxS)).toBeUndefined();
        expect(handleCommand('notify', ['', ''], model, ctxS)?.notify).toBeUndefined();
    });

    it('standard layout: favorit + 4 bottom entities', () => {
        const payload = wu(
            e('S', 65504, '', '15.8 °C'),
            e('R', 52810, 'Regen', '49 %'),
            e('W', 52810, 'Wind', '5 bft'),
            e('U', 32495, 'UV', '1'),
            e('L', 32495, 'Luft', '53 %'),
        );
        const entities = parseWeatherUpdate(parseCommand(payload).args);
        expect(entities).toHaveLength(5);
        expect(layoutOf('screensaver', entities)).toBe('standard');
        const areas = splitAreas('screensaver', entities, 'eu');
        expect(areas.layout).toBe('standard');
        expect(areas.favorit?.optionalValue).toBe('15.8 °C');
        expect(areas.favorit?.iconColor).toBe(65504);
        expect(areas.bottom.map(b => b.displayName)).toEqual(['Regen', 'Wind', 'UV', 'Luft']);
        expect(areas.alternate).toBeUndefined();
        expect(areas.left).toEqual([]);
        expect(areas.indicator).toEqual([]);
    });

    it('alternate layout: favorit + 3 bottom + empty + alternate entity', () => {
        // Screensaver.update(): alternate gets an empty entity in front
        const payload = wu(
            e('C', 21130, '', '0 °C'),
            e('A', 65535, 'Außen', 'Aus'),
            e('W', 32495, 'Wind', '6.1m/s'),
            e('B', 32495, 'Böen', '8.9m/s'),
            EMPTY,
            e('H', 52810, '', '78.0%'),
        );
        const entities = parseWeatherUpdate(parseCommand(payload).args);
        expect(entities).toHaveLength(6);
        const areas = splitAreas('screensaver', entities, 'eu');
        expect(areas.layout).toBe('alternate');
        expect(areas.favorit?.optionalValue).toBe('0 °C');
        expect(areas.bottom.map(b => b.displayName)).toEqual(['Außen', 'Wind', 'Böen']);
        expect(areas.alternate?.icon).toBe('H');
        expect(areas.alternate?.optionalValue).toBe('78.0%');
    });

    it('advanced layout: favorit, 3 left, 6 bottom, 5 indicators with their ids', () => {
        const bottom = ['Regen', 'Wind', 'Böen', 'Windr.', 'Feuchte', 'UV'].map(n => e('I', 1, n, 'v'));
        const indicator = [0, 1, 2, 3, 4].map(i => e('X', 63488, '', '', `3?${10 + i}`));
        const payload = wu(
            e('S', 65504, '', '7.5 °C'),
            e('T', 1, '', '21.4°C'),
            e('P', 1, '', '594 W'),
            e('G', 1, '', 'Heute'),
            ...bottom,
            ...indicator,
        );
        const entities = parseWeatherUpdate(parseCommand(payload).args);
        expect(entities).toHaveLength(15);
        const areas = splitAreas('screensaver2', entities, 'eu');
        expect(areas.layout).toBe('advanced');
        expect(areas.favorit?.optionalValue).toBe('7.5 °C');
        expect(areas.left.map(l => l.optionalValue)).toEqual(['21.4°C', '594 W', 'Heute']);
        expect(areas.bottom).toHaveLength(6);
        expect(areas.bottom[5].displayName).toBe('UV');
        expect(areas.indicator.map(i => i.id)).toEqual(['3?10', '3?11', '3?12', '3?13', '3?14']);
    });

    it('easyview layout: 3 bottom entities, 4 on us-p', () => {
        expect(bottomCount('easyview', 'eu')).toBe(3);
        expect(bottomCount('easyview', 'us-l')).toBe(3);
        expect(bottomCount('easyview', 'us-p')).toBe(4);
        expect(bottomCount('standard', 'us-p')).toBe(4);
        const payload = wu(
            EMPTY,
            e('S', 65504, 'Sonne', '06:42'),
            e('W', 64800, 'Wind', '6,2m/s'),
            e('B', 64800, 'Böen', '12,3m/s'),
        );
        const areas = splitAreas('screensaver3', parseWeatherUpdate(parseCommand(payload).args), 'eu');
        expect(areas.layout).toBe('easyview');
        expect(isBlankEntity(areas.favorit)).toBe(true);
        expect(areas.bottom.map(b => b.optionalValue)).toEqual(['06:42', '6,2m/s', '12,3m/s']);
    });

    it('tolerates a short or empty weatherUpdate', () => {
        expect(splitAreas('screensaver', [], 'eu').layout).toBe('standard');
        const one: Entity6[] = parseWeatherUpdate(parseCommand(wu(e('S', 1, '', '1'))).args);
        const areas = splitAreas('screensaver2', one, 'eu');
        expect(areas.favorit?.optionalValue).toBe('1');
        expect(areas.bottom).toEqual([]);
        expect(areas.indicator).toEqual([]);
    });

    it('splits the time into time and AM/PM', () => {
        expect(splitTime('11:05')).toEqual({ time: '11:05', ampm: '' });
        expect(splitTime('11:05 PM')).toEqual({ time: '11:05', ampm: 'PM' });
        expect(splitTime('')).toEqual({ time: '', ampm: '' });
    });

    it('splits an MR icon field into glyphs and text', () => {
        expect(splitRuns(' 19.0°')).toEqual([
            { kind: 'icon', glyph: '' },
            { kind: 'text', text: ' 19.0°' },
        ]);
        expect(splitRuns('\u{F045E}')).toEqual([{ kind: 'icon', glyph: '\u{F045E}' }]);
        expect(splitRuns('')).toEqual([]);
    });
});
