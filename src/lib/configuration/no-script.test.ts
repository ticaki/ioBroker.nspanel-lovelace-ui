import { expect } from 'chai';
import {
    checkScriptConfigTopics,
    findPanelEntry,
    isNoScriptPanel,
    noScriptRejectionMessage,
    normalizePanelTopic,
    type NoScriptPanelEntry,
} from './no-script';

const panels: NoScriptPanelEntry[] = [
    { name: 'Kitchen', topic: 'nspanel/kitchen', noScript: true },
    { name: 'Living', topic: 'nspanel/living' },
    { name: 'Office', topic: 'nspanel/office', noScript: false },
];

describe('lib/configuration - no-script', () => {
    it('normalizes the old command topic', () => {
        expect(normalizePanelTopic('nspanel.kitchen.cmnd.CustomSend')).to.equal('nspanel.kitchen');
        expect(normalizePanelTopic('nspanel/kitchen')).to.equal('nspanel/kitchen');
    });

    it('finds the panel entry, also for the command topic', () => {
        const list: NoScriptPanelEntry[] = [{ name: 'A', topic: 'a.b', noScript: true }];
        expect(findPanelEntry(list, 'a.b')?.name).to.equal('A');
        expect(findPanelEntry(list, 'a.b.cmnd.CustomSend')?.name).to.equal('A');
        expect(findPanelEntry(list, 'x')).to.equal(undefined);
        expect(findPanelEntry(undefined, 'a.b')).to.equal(undefined);
        expect(findPanelEntry(list, undefined)).to.equal(undefined);
    });

    it('tells a panel without script apart', () => {
        expect(isNoScriptPanel(panels, 'nspanel/kitchen')).to.equal(true);
        expect(isNoScriptPanel(panels, 'nspanel/living')).to.equal(false);
        expect(isNoScriptPanel(panels, 'nspanel/office')).to.equal(false);
        expect(isNoScriptPanel(panels, 'unknown')).to.equal(false);
        expect(isNoScriptPanel([null, undefined], 'nspanel/kitchen')).to.equal(false);
    });

    it('rejects a local script for a panel without script', () => {
        const result = checkScriptConfigTopics(panels, {
            panelTopic: 'nspanel/kitchen',
            scriptName: 'script.js.nspanel.Kitchen',
            version: '0.9.0',
        });
        expect(result.global).to.equal(false);
        expect(result.accepted).to.deep.equal([]);
        expect(result.rejected).to.have.length(1);
        expect(result.rejected[0]).to.contain('Kitchen');
        expect(result.rejected[0]).to.contain('nspanel/kitchen');
        expect(result.rejected[0]).to.contain('script.js.nspanel.Kitchen');
        expect(result.rejected[0]).to.contain('Panel uses no script');
    });

    it('accepts a local script for a normal panel', () => {
        const result = checkScriptConfigTopics(panels, { panelTopic: 'nspanel/living', version: '0.9.0' });
        expect(result).to.deep.equal({ global: false, accepted: ['nspanel/living'], rejected: [] });
    });

    it('checks every topic of a script with several panels', () => {
        const result = checkScriptConfigTopics(panels, {
            panelTopic: ['nspanel/living', 'nspanel/kitchen', 'nspanel/office'],
            version: '0.9.0',
        });
        expect(result.accepted).to.deep.equal(['nspanel/living', 'nspanel/office']);
        expect(result.rejected).to.have.length(1);
        expect(result.rejected[0]).to.contain('nspanel/kitchen');
    });

    it('always accepts the global script', () => {
        const result = checkScriptConfigTopics(panels, {
            type: 'globalConfig',
            version: '0.9.0',
            subPages: [],
            panelTopic: 'nspanel/kitchen',
        });
        expect(result).to.deep.equal({ global: true, accepted: [], rejected: [] });
    });

    it('leaves invalid messages to the config manager', () => {
        expect(checkScriptConfigTopics(panels, undefined)).to.deep.equal({ global: false, accepted: [], rejected: [] });
        expect(checkScriptConfigTopics(panels, { version: '1' })).to.deep.equal({
            global: false,
            accepted: [],
            rejected: [],
        });
    });

    it('builds the rejection message without a known name or script', () => {
        const text = noScriptRejectionMessage(undefined, 'x/y');
        expect(text).to.contain('with topic x/y');
        expect(text).to.contain('this panel script');
    });
});
