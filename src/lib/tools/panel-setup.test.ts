import { expect } from 'chai';
import {
    duplicatePanelIdIndexes,
    matchPanelForSetup,
    migrateScriptConfigTopic,
    replacePanelTopicInScript,
    SCRIPT_END_STOP_TOKEN,
    type PanelSetupEntry,
    type PanelSetupMatch,
} from './panel-setup';

interface TestPanel extends PanelSetupEntry {
    ip: string;
}

const kitchen: TestPanel = { id: 'AABBCCDDEEFF', topic: 'nspanel/kitchen', name: 'Kitchen', ip: '192.168.1.10' };
const living: TestPanel = { id: '112233445566', topic: 'nspanel/living', name: 'Living', ip: '192.168.1.11' };
const web: TestPanel = { id: 'web_1', topic: 'web/browser', name: 'Browser', ip: '', kind: 'web' };

/**
 * like `configurationScriptId` in main.ts: the cleaned name below the script folder
 *
 * @param name name of the panel
 * @returns the script id
 */
const scriptId = (name: string): string => `script.js.nspanel.${name.replace(/[^0-9A-Za-z_-]/g, '_')}`;

/**
 * another Tasmota panel with the given name
 *
 * @param name name of the panel
 * @returns the panel
 */
const named = (name: string): TestPanel => ({ id: '665544332211', topic: 'nspanel/other', name, ip: '' });

/**
 * `matchPanelForSetup` with the script id normalization
 *
 * @param panels configured panels
 * @param macId MAC of the device
 * @param topic requested topic
 * @param name requested name
 * @returns the match
 */
const match = (panels: TestPanel[], macId: string, topic: string, name = 'New panel'): PanelSetupMatch =>
    matchPanelForSetup(panels, macId, topic, name, scriptId);

describe('lib/tools/panel-setup', () => {
    describe('matchPanelForSetup', () => {
        it('creates a new panel for an unknown device with a free topic', () => {
            expect(match([kitchen, living, web], '0A0B0C0D0E0F', 'nspanel/bath')).to.deep.equal({
                isNew: true,
                index: -1,
            });
        });

        it('creates a new panel when nothing is configured', () => {
            expect(match([], kitchen.id, kitchen.topic)).to.deep.equal({ isNew: true, index: -1 });
        });

        it('updates the entry with the same MAC and the same topic', () => {
            expect(match([kitchen, living], living.id, living.topic)).to.deep.equal({
                isNew: false,
                index: 1,
            });
        });

        it('updates the entry with the same MAC and a new topic', () => {
            expect(match([kitchen, living], living.id, 'nspanel/office')).to.deep.equal({
                isNew: false,
                index: 1,
            });
        });

        it('updates the entry with the same MAC and a new IP (the IP is not checked)', () => {
            const moved: TestPanel = { ...kitchen, ip: '192.168.1.99' };
            expect(match([moved, living], kitchen.id, kitchen.topic)).to.deep.equal({
                isNew: false,
                index: 0,
            });
        });

        it('rejects a new device with the topic of another panel', () => {
            expect(match([kitchen, living], '0A0B0C0D0E0F', living.topic)).to.deep.equal({
                error: 'sendToTopicInUse',
                conflictIndex: 1,
            });
        });

        it('rejects a known device that takes over the topic of another panel', () => {
            expect(match([kitchen, living], kitchen.id, living.topic)).to.deep.equal({
                error: 'sendToTopicInUse',
                conflictIndex: 1,
            });
        });

        it('rejects the topic of a web panel', () => {
            expect(match([kitchen, web], '0A0B0C0D0E0F', web.topic)).to.deep.equal({
                error: 'sendToTopicInUse',
                conflictIndex: 1,
            });
        });

        it('does not take a web panel with the same id as the device', () => {
            const webSameId: TestPanel = { ...web, id: kitchen.id };
            expect(match([webSameId], kitchen.id, 'nspanel/kitchen')).to.deep.equal({
                isNew: true,
                index: -1,
            });
        });

        it('takes the first of several entries with the same MAC', () => {
            const duplicate: TestPanel = { ...kitchen, topic: 'nspanel/kitchen2' };
            expect(match([living, kitchen, duplicate], kitchen.id, 'nspanel/kitchen2')).to.deep.equal({
                isNew: false,
                index: 1,
            });
        });

        it('rejects a new device with the name of another panel', () => {
            expect(match([kitchen, living], '0A0B0C0D0E0F', 'nspanel/bath', 'Living')).to.deep.equal({
                error: 'sendToNameInUse',
                conflictIndex: 1,
            });
        });

        it('rejects a name that gives the same script id as another panel', () => {
            expect(
                matchPanelForSetup(
                    [kitchen, named('Living Room')],
                    '0A0B0C0D0E0F',
                    'nspanel/bath',
                    'Living/Room',
                    scriptId,
                ),
            ).to.deep.equal({ error: 'sendToNameInUse', conflictIndex: 1 });
            expect(
                matchPanelForSetup([named('Wohn zimmer')], '0A0B0C0D0E0F', 'nspanel/bath', 'Wohn.zimmer', scriptId),
            ).to.deep.equal({ error: 'sendToNameInUse', conflictIndex: 0 });
        });

        it('compares the names exactly as the normalization does (case-sensitive here)', () => {
            expect(match([kitchen, living], '0A0B0C0D0E0F', 'nspanel/bath', 'living')).to.deep.equal({
                isNew: true,
                index: -1,
            });
        });

        it('rejects the name of a web panel', () => {
            expect(match([kitchen, web], '0A0B0C0D0E0F', 'nspanel/bath', 'Browser')).to.deep.equal({
                error: 'sendToNameInUse',
                conflictIndex: 1,
            });
        });

        it('keeps the name of the same device', () => {
            expect(match([kitchen, living], kitchen.id, 'nspanel/kitchen2', 'Kitchen')).to.deep.equal({
                isNew: false,
                index: 0,
            });
        });

        it('lets a known device take a new free name', () => {
            expect(match([kitchen, living], kitchen.id, kitchen.topic, 'Office')).to.deep.equal({
                isNew: false,
                index: 0,
            });
        });

        it('rejects a known device that takes over the name of another panel', () => {
            expect(match([kitchen, living], kitchen.id, kitchen.topic, 'Living')).to.deep.equal({
                error: 'sendToNameInUse',
                conflictIndex: 1,
            });
        });

        it('reports the topic conflict before the name conflict', () => {
            expect(match([kitchen, living], '0A0B0C0D0E0F', living.topic, 'Kitchen')).to.deep.equal({
                error: 'sendToTopicInUse',
                conflictIndex: 1,
            });
        });

        it('ignores entries without a name', () => {
            const nameless: TestPanel = { ...living, name: '' };
            expect(match([nameless], '0A0B0C0D0E0F', 'nspanel/bath', '')).to.deep.equal({
                isNew: true,
                index: -1,
            });
        });
    });

    describe('duplicatePanelIdIndexes', () => {
        it('finds no duplicates in distinct ids', () => {
            expect(duplicatePanelIdIndexes([kitchen, living, web])).to.deep.equal([]);
        });

        it('returns the later entries of an id, the first one stays', () => {
            expect(
                duplicatePanelIdIndexes([kitchen, living, { ...kitchen, topic: 'x' }, { ...kitchen }, { ...living }]),
            ).to.deep.equal([2, 3, 4]);
        });

        it('skips missing entries and empty ids', () => {
            expect(duplicatePanelIdIndexes([undefined, { id: '' }, { id: '' }, kitchen])).to.deep.equal([]);
        });
    });

    describe('replacePanelTopicInScript', () => {
        const tail = `\n/****\n${SCRIPT_END_STOP_TOKEN}\n****/\nconst x = { panelTopic: 'nspanel/old' };\n`;

        it('replaces the topic in the user part and keeps the template part', () => {
            const head = `const config = {\n    panelTopic: 'nspanel/old',\n    weatherEntity: 'w',\n};`;
            const result = replacePanelTopicInScript(head + tail, 'nspanel/old', 'nspanel/new');
            expect(result.count).to.equal(1);
            expect(result.source).to.equal(head.replace('nspanel/old', 'nspanel/new') + tail);
        });

        it('handles quotes and spaces', () => {
            const cases: [string, string][] = [
                [`panelTopic: "nspanel/old",`, `panelTopic: "nspanel/new",`],
                ['panelTopic:`nspanel/old`,', 'panelTopic:`nspanel/new`,'],
                [`panelTopic  :   'nspanel/old' ,`, `panelTopic  :   'nspanel/new' ,`],
                [`'panelTopic': 'nspanel/old',`, `'panelTopic': 'nspanel/new',`],
                [`"panelTopic":"nspanel/old"`, `"panelTopic":"nspanel/new"`],
                [`panelTopic: ' nspanel/old ',`, `panelTopic: 'nspanel/new',`],
                [`const c = { panelTopic: 'nspanel/old', x: 1 };`, `const c = { panelTopic: 'nspanel/new', x: 1 };`],
            ];
            for (const [from, to] of cases) {
                const result = replacePanelTopicInScript(from, 'nspanel/old', 'nspanel/new');
                expect(result.source, from).to.equal(to);
                expect(result.count, from).to.equal(1);
            }
        });

        it('replaces every occurrence of the old topic, e.g. in overrideConfig', () => {
            const src = `const o = {\n  panelTopic: 'nspanel/old',\n};\nconst c = {\n  panelTopic: 'nspanel/old',\n};`;
            const result = replacePanelTopicInScript(src, 'nspanel/old', 'nspanel/new');
            expect(result.count).to.equal(2);
            expect(result.source).to.not.contain('nspanel/old');
        });

        it('leaves line comments, other topics and other keys alone', () => {
            const src = [
                `    // panelTopic: 'nspanel/old',`,
                `    panelTopic: 'nspanel/other',`,
                `    myPanelTopic: 'nspanel/old',`,
                `    mypanelTopic: 'nspanel/old',`,
                `    topic: 'nspanel/old',`,
            ].join('\n');
            const result = replacePanelTopicInScript(src, 'nspanel/old', 'nspanel/new');
            expect(result.count).to.equal(0);
            expect(result.source).to.equal(src);
        });

        it('returns the source unchanged when nothing is found or the topics are equal', () => {
            const src = `panelTopic: someVariable,`;
            expect(replacePanelTopicInScript(src, 'nspanel/old', 'nspanel/new')).to.deep.equal({
                source: src,
                count: 0,
            });
            const same = `panelTopic: 'nspanel/old',`;
            expect(replacePanelTopicInScript(same, 'nspanel/old', 'nspanel/old')).to.deep.equal({
                source: same,
                count: 0,
            });
        });

        it('replaces in the whole source when the END STOP token is missing', () => {
            const result = replacePanelTopicInScript(`a\npanelTopic: 'nspanel/old'`, 'nspanel/old', 'nspanel/new');
            expect(result).to.deep.equal({ source: `a\npanelTopic: 'nspanel/new'`, count: 1 });
        });
    });

    describe('migrateScriptConfigTopic', () => {
        const raw = (panelTopic: string, scriptName = 'script.js.ns.old'): Record<string, unknown> => ({
            panelTopic,
            scriptName,
            pages: [],
        });
        const conv = (topic: string, scriptName = 'script.js.ns.old'): Record<string, unknown> => ({
            topic,
            scriptName,
            name: 'x',
        });

        it('moves raw and converted entries to the new topic', () => {
            const native = {
                scriptConfigRaw: [raw('a/old'), raw('a/other')],
                scriptConfig: [conv('a/other'), conv('a/old')],
            };
            const result = migrateScriptConfigTopic(native, 'a/old', 'a/new');
            expect(result.scriptConfigRaw).to.deep.equal([raw('a/new'), raw('a/other')]);
            expect(result.scriptConfig).to.deep.equal([conv('a/other'), conv('a/new')]);
            expect(result.moved).to.equal(2);
            expect(result.dropped).to.equal(0);
            expect(native.scriptConfigRaw[0]).to.deep.equal(raw('a/old'));
        });

        it('drops an existing entry of the new topic', () => {
            const native = { scriptConfigRaw: [raw('a/new', 'stale'), raw('a/old')] };
            const result = migrateScriptConfigTopic(native, 'a/old', 'a/new');
            expect(result.scriptConfigRaw).to.deep.equal([raw('a/new')]);
            expect(result.scriptConfig).to.equal(undefined);
            expect(result.dropped).to.equal(1);
        });

        it('follows a renamed script only where scriptName names the old script', () => {
            const native = { scriptConfigRaw: [raw('a/old')], scriptConfig: [conv('a/old', 'custom')] };
            const result = migrateScriptConfigTopic(native, 'a/old', 'a/new', {
                from: 'script.js.ns.old',
                to: 'script.js.ns.new',
            });
            expect(result.scriptConfigRaw).to.deep.equal([raw('a/new', 'script.js.ns.new')]);
            expect(result.scriptConfig).to.deep.equal([conv('a/new', 'custom')]);
        });

        it('only renames the script when the topic stays', () => {
            const native = { scriptConfigRaw: [raw('a/old'), raw('a/other')] };
            const result = migrateScriptConfigTopic(native, 'a/old', 'a/old', {
                from: 'script.js.ns.old',
                to: 'script.js.ns.new',
            });
            expect(result.scriptConfigRaw).to.deep.equal([raw('a/old', 'script.js.ns.new'), raw('a/other')]);
            expect(result.dropped).to.equal(0);
        });

        it('changes nothing without a matching entry, with equal topics or broken lists', () => {
            expect(migrateScriptConfigTopic({ scriptConfigRaw: [raw('a/x')] }, 'a/old', 'a/new')).to.deep.equal({
                moved: 0,
                dropped: 0,
                scriptConfigRaw: undefined,
                scriptConfig: undefined,
            });
            expect(migrateScriptConfigTopic({ scriptConfigRaw: [raw('a/old')] }, 'a/old', 'a/old')).to.deep.equal({
                moved: 0,
                dropped: 0,
            });
            expect(
                migrateScriptConfigTopic({ scriptConfigRaw: 'x', scriptConfig: [null, 1] }, 'a/old', 'a/new').moved,
            ).to.equal(0);
        });
    });
});
