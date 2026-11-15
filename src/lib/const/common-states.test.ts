/**
 * The runtime resolution against common.states has to give the same results as the scripts and lists that were
 * generated into the configuration before - as long as common.states does not change.
 * The `old*` functions are the generators as they were in pageThermo2.ts and config-manager.ts.
 */
import { expect } from 'chai';
import {
    DEFAULT_CLIMATE_MODES,
    commonStatesToRecord,
    matchesStatesToken,
    resolveStatesText,
    resolveStatesToken,
    statesList,
    withCommonStates,
} from './common-states';

type States = string[] | Record<string, string>;

/**
 * config-manager.ts before: literal of the airCondition mode buttons.
 *
 * @param token mode token
 * @param states common.states or the default list
 * @param modeType common.type of MODE
 * @returns the literal or undefined
 */
function oldModeLiteral(token: string, states: States, modeType: ioBroker.CommonType | undefined): string | undefined {
    if (Array.isArray(states)) {
        const position = states.indexOf(token);
        if (position === -1) {
            return undefined;
        }
        return modeType === 'string' ? JSON.stringify(token) : String(position);
    }
    if (states && typeof states === 'object') {
        for (const key of Object.keys(states)) {
            if (states[key] === token) {
                return modeType !== 'string' && /^-?\d+(\.\d+)?$/.test(key) ? key : JSON.stringify(key);
            }
        }
        if (states[token] !== undefined) {
            return JSON.stringify(token);
        }
    }
    return undefined;
}

/**
 * Runs a generated script like Dataitem did.
 *
 * @param body script
 * @param val value
 * @returns the result
 */
function run(body: string, val?: unknown): unknown {
    return new Function('val', body)(val);
}

const STATE_SHAPES: { name: string; states: States }[] = [
    { name: 'array', states: ['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN_ONLY', 'DRY'] },
    { name: 'record numeric keys', states: { 0: 'OFF', 1: 'AUTO', 2: 'COOL', 3: 'HEAT', 5: 'FAN_ONLY', 10: 'DRY' } },
    { name: 'record negative/decimal keys', states: { '-1': 'OFF', 1.5: 'COOL', 2: 'HEAT' } },
    { name: 'record string keys', states: { off: 'OFF', cool: 'COOL', heat: 'HEAT' } },
    { name: 'record with tokens as keys', states: { OFF: 'Aus', COOL: 'Kühlen', DRY: 'Trocknen' } },
    { name: 'default list', states: [...DEFAULT_CLIMATE_MODES] },
];
const TOKENS = [...DEFAULT_CLIMATE_MODES, 'UNKNOWN'];
const VALUES: unknown[] = [0, 1, 2, 3, 5, 6, 10, -1, 1.5, '0', '1', '2', '10', '-1', '1.5', 'off', 'cool', 'OFF'];
VALUES.push('COOL', 'DRY', 'heat', true, false, null, '', 'x');

describe('lib/const/common-states', () => {
    describe('mode token of the airCondition buttons (config-manager)', () => {
        for (const shape of STATE_SHAPES) {
            for (const modeType of ['number', 'string', 'mixed'] as ioBroker.CommonType[]) {
                it(`${shape.name}, MODE ${modeType}: same buttons, same written value, same comparison`, () => {
                    for (const token of TOKENS) {
                        const literal = oldModeLiteral(token, shape.states, modeType);
                        const resolved = resolveStatesToken(token, shape.states, modeType);
                        expect(resolved === undefined, `button ${token} exists`).to.equal(literal === undefined);
                        if (literal === undefined || resolved === undefined) {
                            continue;
                        }
                        expect(resolved, `write ${token}`).to.equal(run(`return ${literal}`));
                        for (const val of VALUES) {
                            expect(matchesStatesToken(val, resolved), `read ${token} val ${String(val)}`).to.equal(
                                run(`return val == ${literal}`, val),
                            );
                        }
                    }
                });
            }
        }

        it('resolves against changed states', () => {
            expect(resolveStatesToken('COOL', { 0: 'OFF', 2: 'COOL' }, 'number')).to.equal(2);
            expect(resolveStatesToken('COOL', { 0: 'OFF', 7: 'COOL' }, 'number')).to.equal(7);
            expect(resolveStatesToken('COOL', { 0: 'OFF' }, 'number')).to.equal(undefined);
        });

        it('knows no token in the deprecated string form', () => {
            expect(resolveStatesToken('OFF', '0:OFF;1:COOL', 'number')).to.equal(undefined);
        });
    });

    describe('display text (pageThermo2)', () => {
        for (const shape of STATE_SHAPES) {
            it(`${shape.name}: "return states[val] || val" and "return states[val]"`, () => {
                const keep = `return ${JSON.stringify(shape.states)}[val] || val`;
                const strict = `return ${JSON.stringify(shape.states)}[val]`;
                for (const val of VALUES) {
                    expect(resolveStatesText(shape.states, val, true), `keep ${String(val)}`).to.equal(run(keep, val));
                    expect(resolveStatesText(shape.states, val, false), `strict ${String(val)}`).to.equal(
                        run(strict, val),
                    );
                }
            });
        }

        it('shows the value itself without states (keepValue) or nothing', () => {
            expect(resolveStatesText(undefined, 3, true)).to.equal(3);
            expect(resolveStatesText(undefined, 3, false)).to.equal(undefined);
        });
    });

    describe('lists of the fan (config-manager level.mode.fan)', () => {
        for (const shape of STATE_SHAPES) {
            it(`${shape.name}: keys and texts as before`, () => {
                expect(statesList(shape.states, 'keys')).to.deep.equal(Object.keys(shape.states).map(String));
                expect(statesList(shape.states, 'values')).to.deep.equal(Object.values(shape.states).map(String));
            });
        }

        it('gives empty lists without states', () => {
            expect(statesList(undefined, 'keys')).to.deep.equal([]);
            expect(statesList('0:a;1:b', 'values')).to.deep.equal([]);
        });
    });

    it('commonStatesToRecord turns an array into a record by position', () => {
        expect(commonStatesToRecord(['a', 'b'])).to.deep.equal({ 0: 'a', 1: 'b' });
        expect(commonStatesToRecord({ x: 'y' })).to.deep.equal({ x: 'y' });
        expect(commonStatesToRecord('0:a')).to.equal(null);
        expect(commonStatesToRecord(undefined)).to.equal(null);
    });

    it('withCommonStates replaces read, a token also write, and leaves other types alone', () => {
        const item = { type: 'triggered' as const, dp: 'a.0.b', read: 'return 1', write: 'return 2' };
        expect(withCommonStates(item, { mode: 'text' })).to.deep.equal({
            type: 'triggered',
            dp: 'a.0.b',
            write: 'return 2',
            commonStates: { mode: 'text' },
        });
        expect(withCommonStates(item, { mode: 'token', token: 'OFF' })).to.deep.equal({
            type: 'triggered',
            dp: 'a.0.b',
            commonStates: { mode: 'token', token: 'OFF' },
        });
        expect(item.read, 'the original stays').to.equal('return 1');
        expect(withCommonStates({ type: 'const', constVal: 1 }, { mode: 'text' })).to.equal(undefined);
    });
});
