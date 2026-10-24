import { describe, expect, it } from 'vitest';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';
import { menuSlotCount, menuSlots, isEmptySlot } from './shared/menuParse';
import {
    gridValueText,
    parseNumberOptions,
    parseShutterOptions,
    popupForType,
    splitIconField,
} from './shared/entityTypes';

const ctx = { pageType: 'cardEntities', pageArgs: [] };

/** HMI/Readme.md "cardEntities Page", example with 4 entities */
const README =
    'entityUpd~LightTest~button~navigate.prev~<~65535~~~button~navigate.next~>~65535~~~light~light.bed_light~A~17299~Bed Light~0~light~light.ceiling_lights~B~52231~Ceiling Lights~1~switch~switch.ac~C~17299~AC~0~switch~switch.decorative_lights~D~65222~Decorative Lights~1';

/** what PageEntities sends: `getPayload(entityUpd~headline, navigation, options)` with ids `<page>?<cmd>?<item>` */
const ADAPTER =
    'entityUpd~Steuerung~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~number~0?2?0~~65504~Lautstärke~35|0|100~button~0?2?1~~65504~Szene Abend~PRESS~shutter~0?2?2~~65535~Rollo~|||enable|disable|enable~~~~~';

describe('cardEntities parse', () => {
    it('parses title, navigation and the 4 entities of the readme example', () => {
        const m = parseEntityUpd(README.split('~').slice(1), initial(), ctx);
        expect(m.title).toBe('LightTest');
        expect(m.navigation.left.id).toBe('navigate.prev');
        expect(m.navigation.left.icon).toBe('<');
        expect(m.navigation.right.id).toBe('navigate.next');
        expect(m.entities).toHaveLength(4);
        expect(m.entities[0]).toEqual({
            type: 'light',
            id: 'light.bed_light',
            icon: 'A',
            iconColor: 17299,
            displayName: 'Bed Light',
            optionalValue: '0',
        });
        expect(m.entities[3].type).toBe('switch');
        expect(m.entities[3].optionalValue).toBe('1');
    });

    it('keeps placeholder slots and pads to the slot count', () => {
        const m = parseEntityUpd(ADAPTER.split('~').slice(1), initial(), ctx);
        expect(m.entities).toHaveLength(4);
        expect(isEmptySlot(m.entities[3])).toBe(true);
        expect(m.entities[2].id).toBe('0?2?2');
        const slots = menuSlots(m.entities, menuSlotCount('cardEntities', 'us-p'));
        expect(slots).toHaveLength(5);
        expect(isEmptySlot(slots[4])).toBe(true);
    });

    it('treats delete entities as empty', () => {
        const m = parseEntityUpd(
            ['T', ...Array<string>(12).fill(''), 'delete', '', '', '', '', '', '', 'delete', '', '', '', ''],
            initial(),
            ctx,
        );
        expect(m.entities).toHaveLength(2);
        expect(m.entities.every(isEmptySlot)).toBe(true);
    });

    it('cuts entities beyond 5 (never sent by the adapter)', () => {
        const many = ['T', ...Array<string>(12).fill('')];
        for (let i = 0; i < 7; i++) {
            many.push('text', `id${i}`, '', '65535', `n${i}`, 'v');
        }
        expect(parseEntityUpd(many, initial(), ctx).entities).toHaveLength(5);
    });

    it('does not handle entityUpdateDetail (popups are separate pages)', () => {
        expect(parseEntityUpdateDetail(['x'], initial(), ctx)).toBeUndefined();
    });

    it('slot counts follow PageMenu.maxItems', () => {
        expect(menuSlotCount('cardEntities', 'eu')).toBe(4);
        expect(menuSlotCount('cardEntities', 'us-p')).toBe(5);
        expect(menuSlotCount('cardSchedule', 'eu')).toBe(6);
        expect(menuSlotCount('cardGrid', 'eu')).toBe(6);
        expect(menuSlotCount('cardGrid2', 'eu')).toBe(8);
        expect(menuSlotCount('cardGrid2', 'us-p')).toBe(9);
        expect(menuSlotCount('cardGrid3', 'eu')).toBe(4);
    });
});

describe('entity helpers', () => {
    it('parses shutter options with and without enable flags', () => {
        const s = parseShutterOptions('|||enable|disable|enable');
        expect(s.up).toEqual({ icon: '', enabled: true });
        expect(s.stop).toEqual({ icon: '', enabled: false });
        expect(s.down.enabled).toBe(true);
        const readme = parseShutterOptions('iconUp|iconStop|iconDown');
        expect(readme.stop).toEqual({ icon: 'iconStop', enabled: true });
        expect(parseShutterOptions('||').up).toEqual({ icon: '', enabled: false });
    });

    it('parses number options and clamps the value', () => {
        expect(parseNumberOptions('35|0|100')).toEqual({ value: 35, min: 0, max: 100 });
        expect(parseNumberOptions('150|10|100')).toEqual({ value: 100, min: 10, max: 100 });
        expect(parseNumberOptions('')).toEqual({ value: 0, min: 0, max: 100 });
        expect(parseNumberOptions('5|5|5').max).toBeGreaterThan(5);
    });

    it('maps entity types to their popups', () => {
        expect(popupForType('light')).toBe('popupLight');
        expect(popupForType('light2')).toBe('popupLightNew');
        expect(popupForType('shutter2')).toBe('popupShutter2');
        expect(popupForType('input_sel')).toBe('popupInSel');
        expect(popupForType('timer')).toBe('popupTimer');
        expect(popupForType('number')).toBe('popupSlider');
        expect(popupForType('switch')).toBeUndefined();
        expect(popupForType('text')).toBeUndefined();
    });

    it('splits the icon field into glyph and text', () => {
        expect(splitIconField('')).toEqual({ glyph: undefined, text: '' });
        expect(splitIconField('15.6')).toEqual({ glyph: undefined, text: '15.6' });
        expect(splitIconField('')).toEqual({ glyph: '', text: '' });
        expect(splitIconField('21.5')).toEqual({ glyph: '', text: '21.5' });
    });

    it('reads the font of the item option fontSize from a trailing ¬<n>', () => {
        expect(splitIconField('21.4°C¬3')).toEqual({ glyph: undefined, text: '21.4°C', font: 3 });
        expect(splitIconField('48 %¬0')).toEqual({ glyph: undefined, text: '48 %', font: 0 });
        expect(splitIconField('¬4')).toEqual({ glyph: undefined, text: '', font: 4 });
        // only 0-5 are fonts
        expect(splitIconField('a¬9')).toEqual({ glyph: undefined, text: 'a¬9' });
    });

    it('shows a value on cardGrid3 only when optionalValue is a text', () => {
        const base = { id: 'x', icon: '', iconColor: 0, displayName: 'n' };
        expect(gridValueText({ ...base, type: 'text', optionalValue: '15.6 °C' })).toBe('15.6 °C');
        expect(gridValueText({ ...base, type: 'number', optionalValue: '35|0|100' })).toBe('35');
        expect(gridValueText({ ...base, type: 'switch', optionalValue: '1' })).toBe('');
        expect(gridValueText({ ...base, type: 'button', optionalValue: '1' })).toBe('');
        expect(gridValueText({ ...base, type: 'button', optionalValue: 'PRESS' })).toBe('PRESS');
    });
});
