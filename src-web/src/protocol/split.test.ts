import { describe, expect, it } from 'vitest';
import { parseEntity6, parseEntityList, parseEntityUpdHeader, parseNavigation, splitTilde, toNumber } from './split';

// example from HMI/Readme.md, cardEntities
const CARD_ENTITIES =
    'entityUpd~LightTest~button~navigate.prev~<~65535~~~button~navigate.next~>~65535~~~light~light.bed_light~A~17299~Bed Light~0~light~light.ceiling_lights~B~52231~Ceiling Lights~1~switch~switch.ac~C~17299~AC~0~switch~switch.decorative_lights~D~65222~Decorative Lights~1';

describe('splitTilde', () => {
    it('splits at ~ and keeps empty fields', () => {
        expect(splitTilde('a~~b~')).toEqual(['a', '', 'b', '']);
    });
});

describe('toNumber', () => {
    it('parses numbers and falls back', () => {
        expect(toNumber('17299')).toBe(17299);
        expect(toNumber('')).toBe(0);
        expect(toNumber('x', 7)).toBe(7);
        expect(toNumber(undefined, 1)).toBe(1);
    });
});

describe('parseEntity6', () => {
    it('reads one tuple at an offset', () => {
        const fields = splitTilde(CARD_ENTITIES);
        const e = parseEntity6(fields, 14);
        expect(e).toEqual({
            type: 'light',
            id: 'light.bed_light',
            icon: 'A',
            iconColor: 17299,
            displayName: 'Bed Light',
            optionalValue: '0',
        });
    });
    it('pads missing fields', () => {
        expect(parseEntity6(['text', 'x'])).toEqual({
            type: 'text',
            id: 'x',
            icon: '',
            iconColor: 65535,
            displayName: '',
            optionalValue: '',
        });
    });
});

describe('parseNavigation / parseEntityUpdHeader', () => {
    it('reads the two navigation entities after the title', () => {
        const args = splitTilde(CARD_ENTITIES).slice(1);
        const header = parseEntityUpdHeader(args);
        expect(header.title).toBe('LightTest');
        expect(header.navigation.left.id).toBe('navigate.prev');
        expect(header.navigation.left.icon).toBe('<');
        expect(header.navigation.right.id).toBe('navigate.next');
        expect(header.rest[0]).toBe('light');
        expect(header.rest.length).toBe(4 * 6);
        expect(parseNavigation(args, 1)).toEqual(header.navigation);
    });
    it('parses the entity list', () => {
        const header = parseEntityUpdHeader(splitTilde(CARD_ENTITIES).slice(1));
        const list = parseEntityList(header.rest);
        expect(list.map(e => e.id)).toEqual([
            'light.bed_light',
            'light.ceiling_lights',
            'switch.ac',
            'switch.decorative_lights',
        ]);
        expect(parseEntityList(header.rest, 0, 2).length).toBe(2);
    });
});
