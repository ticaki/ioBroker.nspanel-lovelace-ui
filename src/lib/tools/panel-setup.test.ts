import { expect } from 'chai';
import { matchPanelForSetup, type PanelSetupEntry } from './panel-setup';

interface TestPanel extends PanelSetupEntry {
    ip: string;
}

const kitchen: TestPanel = { id: 'AABBCCDDEEFF', topic: 'nspanel/kitchen', ip: '192.168.1.10' };
const living: TestPanel = { id: '112233445566', topic: 'nspanel/living', ip: '192.168.1.11' };
const web: TestPanel = { id: 'web_1', topic: 'web/browser', ip: '', kind: 'web' };

describe('lib/tools/panel-setup', () => {
    describe('matchPanelForSetup', () => {
        it('creates a new panel for an unknown device with a free topic', () => {
            expect(matchPanelForSetup([kitchen, living, web], '0A0B0C0D0E0F', 'nspanel/bath')).to.deep.equal({
                isNew: true,
                index: -1,
            });
        });

        it('creates a new panel when nothing is configured', () => {
            expect(matchPanelForSetup([], kitchen.id, kitchen.topic)).to.deep.equal({ isNew: true, index: -1 });
        });

        it('updates the entry with the same MAC and the same topic', () => {
            expect(matchPanelForSetup([kitchen, living], living.id, living.topic)).to.deep.equal({
                isNew: false,
                index: 1,
            });
        });

        it('updates the entry with the same MAC and a new topic', () => {
            expect(matchPanelForSetup([kitchen, living], living.id, 'nspanel/office')).to.deep.equal({
                isNew: false,
                index: 1,
            });
        });

        it('updates the entry with the same MAC and a new IP (the IP is not checked)', () => {
            const moved: TestPanel = { ...kitchen, ip: '192.168.1.99' };
            expect(matchPanelForSetup([moved, living], kitchen.id, kitchen.topic)).to.deep.equal({
                isNew: false,
                index: 0,
            });
        });

        it('rejects a new device with the topic of another panel', () => {
            expect(matchPanelForSetup([kitchen, living], '0A0B0C0D0E0F', living.topic)).to.deep.equal({
                error: 'sendToTopicInUse',
                conflictIndex: 1,
            });
        });

        it('rejects a known device that takes over the topic of another panel', () => {
            expect(matchPanelForSetup([kitchen, living], kitchen.id, living.topic)).to.deep.equal({
                error: 'sendToTopicInUse',
                conflictIndex: 1,
            });
        });

        it('rejects the topic of a web panel', () => {
            expect(matchPanelForSetup([kitchen, web], '0A0B0C0D0E0F', web.topic)).to.deep.equal({
                error: 'sendToTopicInUse',
                conflictIndex: 1,
            });
        });

        it('does not take a web panel with the same id as the device', () => {
            const webSameId: TestPanel = { ...web, id: kitchen.id };
            expect(matchPanelForSetup([webSameId], kitchen.id, 'nspanel/kitchen')).to.deep.equal({
                isNew: true,
                index: -1,
            });
        });

        it('takes the first of several entries with the same MAC', () => {
            const duplicate: TestPanel = { ...kitchen, topic: 'nspanel/kitchen2' };
            expect(matchPanelForSetup([living, kitchen, duplicate], kitchen.id, 'nspanel/kitchen2')).to.deep.equal({
                isNew: false,
                index: 1,
            });
        });
    });
});
