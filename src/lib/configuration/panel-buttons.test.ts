import { expect } from 'chai';
import { applyAdminButtons, type PanelButtons } from './panel-buttons';

/** Buttons as a configuration script delivers them. */
function scriptButtons(): PanelButtons {
    return { left: { mode: 'page', page: 'script-left' }, right: { mode: 'button', state: 'alias.0.scriptRight' } };
}

describe('lib/configuration - applyAdminButtons', () => {
    it('keeps the script buttons when the admin has none', () => {
        const result = applyAdminButtons(scriptButtons(), {});
        expect(result.buttons).to.deep.equal(scriptButtons());
        expect(result.invalid).to.deep.equal([]);
    });

    it('keeps the script buttons without an admin entry at all', () => {
        expect(applyAdminButtons(scriptButtons(), undefined).buttons).to.deep.equal(scriptButtons());
    });

    it('replaces only the configured side', () => {
        const result = applyAdminButtons(scriptButtons(), { buttonLeft: { mode: 'switch', state: 'alias.0.lamp' } });
        expect(result.buttons).to.deep.equal({
            left: { mode: 'switch', state: 'alias.0.lamp' },
            right: { mode: 'button', state: 'alias.0.scriptRight' },
        });
        expect(result.invalid).to.deep.equal([]);
    });

    it('takes an admin configuration for a panel without a script button', () => {
        const result = applyAdminButtons(null, {
            buttonRight: { mode: 'buttonOnDelayOff', state: 'alias.0.bell', delay: 2 },
        });
        expect(result.buttons).to.deep.equal({
            left: null,
            right: { mode: 'buttonOnDelayOff', state: 'alias.0.bell', delay: 2 },
        });
    });

    it('reports an invalid entry and keeps the script value', () => {
        const result = applyAdminButtons(scriptButtons(), {
            buttonLeft: { mode: 'switch', state: 'alias.0.' },
            buttonRight: { mode: 'page', page: '' },
        });
        expect(result.buttons).to.deep.equal(scriptButtons());
        expect(result.invalid).to.deep.equal(['left', 'right']);
    });

    it('accepts a configured "no action"', () => {
        const result = applyAdminButtons(scriptButtons(), { buttonLeft: null });
        expect(result.buttons).to.deep.equal({ left: null, right: { mode: 'button', state: 'alias.0.scriptRight' } });
        expect(result.invalid).to.deep.equal([]);
    });
});
