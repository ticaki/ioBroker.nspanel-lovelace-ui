import { expect } from 'chai';
import { cycleValueToState, nextCycleIndex, normalizeCycleValues } from './screensaver-cycle';

describe('lib/const/screensaver-cycle - cycleValueToState', () => {
    it('number: comma as decimal separator, only finite numbers', () => {
        expect(cycleValueToState(' -1 ', 'number')).to.equal(-1);
        expect(cycleValueToState('1,5', 'number')).to.equal(1.5);
        expect(cycleValueToState('1.5', 'number')).to.equal(1.5);
        expect(cycleValueToState('abc', 'number')).to.equal(null);
        expect(cycleValueToState('Infinity', 'number')).to.equal(null);
        expect(cycleValueToState('1,2,3', 'number')).to.equal(null);
    });
    it('boolean: true/false/1/0 in any case become a real boolean', () => {
        expect(cycleValueToState('true', 'boolean')).to.equal(true);
        expect(cycleValueToState('TRUE', 'boolean')).to.equal(true);
        expect(cycleValueToState('1', 'boolean')).to.equal(true);
        expect(cycleValueToState('false', 'boolean')).to.equal(false);
        expect(cycleValueToState('False', 'boolean')).to.equal(false);
        expect(cycleValueToState('0', 'boolean')).to.equal(false);
        expect(cycleValueToState('2', 'boolean')).to.equal(null);
        expect(cycleValueToState('an', 'boolean')).to.equal(null);
    });
    it('string: the trimmed text', () => {
        expect(cycleValueToState(' 1 ', 'string')).to.equal('1');
        expect(cycleValueToState('true', 'string')).to.equal('true');
    });
    it('mixed or unknown: number if numeric, true/false as boolean, otherwise the text', () => {
        for (const type of ['mixed', undefined]) {
            expect(cycleValueToState('1', type)).to.equal(1);
            expect(cycleValueToState('1,5', type)).to.equal(1.5);
            expect(cycleValueToState('false', type)).to.equal(false);
            expect(cycleValueToState('True', type)).to.equal(true);
            expect(cycleValueToState(' Szene ', type)).to.equal('Szene');
        }
    });
    it('empty text is null for every type', () => {
        for (const type of ['number', 'boolean', 'string', 'mixed', undefined]) {
            expect(cycleValueToState('', type)).to.equal(null);
            expect(cycleValueToState('   ', type)).to.equal(null);
        }
    });
});

describe('lib/const/screensaver-cycle - nextCycleIndex', () => {
    it('walks through the list and wraps after the last value', () => {
        const values = ['-1', '0', '1'];
        expect(nextCycleIndex(values, -1, 'number', undefined)).to.equal(1);
        expect(nextCycleIndex(values, 0, 'number', undefined)).to.equal(2);
        expect(nextCycleIndex(values, 1, 'number', undefined)).to.equal(0);
    });
    it('one value stays on that value', () => {
        expect(nextCycleIndex(['5'], 5, 'number', 0)).to.equal(0);
        expect(nextCycleIndex(['5'], 7, 'number', undefined)).to.equal(0);
    });
    it('no match, no value or an unusable value starts with the first entry', () => {
        expect(nextCycleIndex(['-1', '1'], 42, 'number', 1)).to.equal(0);
        expect(nextCycleIndex(['-1', '1'], null, 'number', 1)).to.equal(0);
        expect(nextCycleIndex(['-1', '1'], undefined, 'number', undefined)).to.equal(0);
        expect(nextCycleIndex(['-1', '1'], 'abc', 'number', undefined)).to.equal(0);
        expect(nextCycleIndex(['-1', '1'], { val: 1 }, 'number', undefined)).to.equal(0);
        expect(nextCycleIndex(['-1', '1'], '', 'string', undefined)).to.equal(0);
    });
    it('repeated values: the last index counts while it fits the state', () => {
        const values = ['0', '1', '0', '-1'];
        expect(nextCycleIndex(values, 0, 'number', 0)).to.equal(1);
        expect(nextCycleIndex(values, 1, 'number', 1)).to.equal(2);
        expect(nextCycleIndex(values, 0, 'number', 2)).to.equal(3);
        expect(nextCycleIndex(values, -1, 'number', 3)).to.equal(0);
        // changed from outside: the first entry with that value is the position
        expect(nextCycleIndex(values, 0, 'number', 3)).to.equal(1);
        expect(nextCycleIndex(values, 0, 'number', undefined)).to.equal(1);
    });
    it('a last index outside the list is ignored', () => {
        expect(nextCycleIndex(['0', '1'], 1, 'number', 7)).to.equal(0);
        expect(nextCycleIndex(['0', '1'], 0, 'number', -1)).to.equal(1);
    });
    it('boolean state with texts in the list', () => {
        expect(nextCycleIndex(['false', 'true'], false, 'boolean', undefined)).to.equal(1);
        expect(nextCycleIndex(['false', 'true'], true, 'boolean', undefined)).to.equal(0);
        expect(nextCycleIndex(['0', 'TRUE'], false, 'boolean', undefined)).to.equal(1);
    });
    it('a value with a comma matches the number of the state', () => {
        expect(nextCycleIndex(['1,5', '2,5'], 1.5, 'number', undefined)).to.equal(1);
        expect(nextCycleIndex(['1,5', '2,5'], 2.5, 'number', undefined)).to.equal(0);
    });
    it('invalid entries never match', () => {
        expect(nextCycleIndex(['x', '1'], 1, 'number', undefined)).to.equal(0);
    });
});

describe('lib/const/screensaver-cycle - normalizeCycleValues', () => {
    it('makes texts, trims and drops what is no value', () => {
        expect(normalizeCycleValues([-1, ' 1 ', true, '', '  ', null, {}])).to.deep.equal(['-1', '1', 'true']);
    });
    it('anything but a list gives no values', () => {
        expect(normalizeCycleValues('-1,1')).to.deep.equal([]);
        expect(normalizeCycleValues(null)).to.deep.equal([]);
        expect(normalizeCycleValues(undefined)).to.deep.equal([]);
    });
});
