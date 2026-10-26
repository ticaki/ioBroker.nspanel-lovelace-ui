import { expect } from 'chai';
import { Library } from './library';

/**
 * isPanelActivated() only reads the state database, so the test drives the method on a
 * prototype-based instance with a stubbed readdb - no adapter, no constructor side effects.
 *
 * @param db state values by id, a missing key stands for a datapoint that does not exist
 * @returns an object with isPanelActivated bound to that database
 */
function withDb(db: Record<string, { val: unknown } | undefined>): Pick<Library, 'isPanelActivated'> {
    const lib = Object.create(Library.prototype) as Library;
    (lib as unknown as { readdb: (id: string) => { val: unknown } | undefined }).readdb = (id: string) => db[id];
    return lib;
}

describe('Library.isPanelActivated', () => {
    it('counts a missing datapoint as activated', () => {
        expect(withDb({}).isPanelActivated('NSPanel1')).to.equal(true);
    });

    it('reports false only when the datapoint really is false', () => {
        const lib = withDb({ 'panels.NSPanel1.cmd.activated': { val: false } });
        expect(lib.isPanelActivated('NSPanel1')).to.equal(false);
    });

    it('reports true when the datapoint is true', () => {
        const lib = withDb({ 'panels.NSPanel1.cmd.activated': { val: true } });
        expect(lib.isPanelActivated('NSPanel1')).to.equal(true);
    });

    it('does not treat a null value as deactivated - only an explicit false switches a panel off', () => {
        const lib = withDb({ 'panels.NSPanel1.cmd.activated': { val: null } });
        expect(lib.isPanelActivated('NSPanel1')).to.equal(true);
    });

    it('asks for the datapoint of the panel it was given', () => {
        const asked: string[] = [];
        const lib = Object.create(Library.prototype) as Library;
        (lib as unknown as { readdb: (id: string) => undefined }).readdb = (id: string) => {
            asked.push(id);
            return undefined;
        };
        lib.isPanelActivated('Kitchen.Panel');
        expect(asked).to.deep.equal(['panels.Kitchen.Panel.cmd.activated']);
    });
});
