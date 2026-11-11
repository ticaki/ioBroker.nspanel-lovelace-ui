import { expect } from 'chai';
import { genericStateObjects } from '../const/definition';
import {
    ALL_PANELS_SPECIAL_ID,
    type MenuEntry,
    type PageConfigEntry,
    type PageLinkEntry,
    type QREntry,
    type ScreensaverEntry,
    type UnlockEntry,
} from './adminShareConfig';
import {
    buildPanelConfigExport,
    effectivePageAssignment,
    exportMiscOfPanel,
    exportPagesOfPanel,
    exportScreensaverOfPanel,
    PANEL_CONFIG_FORMAT,
    PANEL_CONFIG_VERSION,
    panelConfigExportFileName,
    panelSettingStateIds,
    panelSettingStates,
    pagesWithStrippedSecrets,
    pageSecretFields,
    panelPagesWithSecrets,
    stripPageForExport,
    type ExportNative,
} from './panelConfigExport';

const TOPIC = 'nspanel/one';
const OTHER = 'nspanel/two';

function menu(uniqueName: string, assignment: MenuEntry['navigationAssignment']): MenuEntry {
    return {
        card: 'cardGrid',
        uniqueName,
        headline: uniqueName,
        pageItems: [
            {
                channelId: { valueStateId: 'a.0.x', unit: '', prefix: '', suffix: '', dateFormat: '' },
                itemId: `item_${uniqueName}`,
            },
        ],
        navigationAssignment: assignment,
    };
}

function alarm(pin: number): UnlockEntry {
    return {
        card: 'cardAlarm',
        uniqueName: 'alarm',
        headline: 'A',
        button1: '',
        button2: '',
        button3: '',
        button4: '',
        button5: '',
        button6: '',
        button7: '',
        button8: '',
        pin,
        navigationAssignment: [{ topic: TOPIC }],
    };
}

function qr(qrPass: string | undefined, qrCredentialId?: string): QREntry {
    return {
        card: 'cardQR',
        uniqueName: 'qr',
        headline: 'Wifi',
        selType: 1,
        ssidUrlTel: 'home',
        wlanhidden: false,
        wlantype: 'WPA2',
        qrPass,
        qrCredentialId,
        pwdhidden: true,
        setState: '',
        navigationAssignment: [{ topic: TOPIC }],
    };
}

function screensaver(name: string, panels: string[], notify?: string[]): ScreensaverEntry {
    return { name, mode: 'standard', panels, left: [], bottom: [], indicator: [], notify };
}

describe('lib/types/panelConfigExport', () => {
    describe('effectivePageAssignment', () => {
        it('own topic wins over all panels', () => {
            const page = menu('p', [
                { topic: ALL_PANELS_SPECIAL_ID, navigation: { next: 'a' } },
                { topic: TOPIC, navigation: { next: 'b' } },
            ]);
            expect(effectivePageAssignment(page, TOPIC)).to.deep.equal({ kind: 'own', navigation: { next: 'b' } });
        });
        it('all panels applies to every topic', () => {
            const page = menu('p', [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { prev: 'x' } }]);
            expect(effectivePageAssignment(page, OTHER)).to.deep.equal({ kind: 'all', navigation: { prev: 'x' } });
        });
        it('own topic without navigation excludes an all panels page', () => {
            const page = menu('p', [{ topic: ALL_PANELS_SPECIAL_ID }, { topic: TOPIC }]);
            expect(effectivePageAssignment(page, TOPIC)).to.equal(undefined);
        });
        it('own topic without navigation and without all panels is an assignment', () => {
            const page = menu('p', [{ topic: TOPIC }]);
            expect(effectivePageAssignment(page, TOPIC)).to.deep.equal({ kind: 'own', navigation: undefined });
        });
        it('other topic only: not on the panel', () => {
            expect(effectivePageAssignment(menu('p', [{ topic: OTHER }]), TOPIC)).to.equal(undefined);
            expect(effectivePageAssignment(menu('p', undefined), TOPIC)).to.equal(undefined);
        });
    });

    describe('stripPageForExport', () => {
        it('removes the assignments and leaves the original alone', () => {
            const page = menu('p', [{ topic: TOPIC }]);
            const { page: out, stripped } = stripPageForExport(page);
            expect(out).to.not.have.property('navigationAssignment');
            expect(stripped).to.deep.equal([]);
            expect(page.navigationAssignment).to.deep.equal([{ topic: TOPIC }]);
        });
        it('removes an own PIN', () => {
            const page = alarm(1234);
            const { page: out, stripped } = stripPageForExport(page);
            expect(out).to.not.have.property('pin');
            expect(stripped).to.deep.equal(['pin']);
            expect(page.pin).to.equal(1234);
        });
        it('keeps PIN -1 (global password of the instance)', () => {
            const { page: out, stripped } = stripPageForExport(alarm(-1));
            expect(out).to.have.property('pin', -1);
            expect(stripped).to.deep.equal([]);
        });
        it('removes the wifi password, keeps the credential id', () => {
            const { page: out, stripped } = stripPageForExport(qr('secret', 'wifi'));
            expect(out).to.not.have.property('qrPass');
            expect(out).to.have.property('qrCredentialId', 'wifi');
            expect(stripped).to.deep.equal(['qrPass']);
        });
        it('an empty wifi password is nothing to remove', () => {
            expect(stripPageForExport(qr('')).stripped).to.deep.equal([]);
            expect(stripPageForExport(qr(undefined)).stripped).to.deep.equal([]);
        });
        it('no secret survives in the file', () => {
            const native: ExportNative = { pageConfig: [alarm(4711), qr('wifiSecret99')] };
            const data = buildPanelConfigExport({
                native,
                panel: { id: 'a', topic: TOPIC, name: 'One' },
                states: {},
                now: new Date(0),
            });
            const text = JSON.stringify(data);
            expect(text).to.not.contain('4711');
            expect(text).to.not.contain('wifiSecret99');
            expect(pagesWithStrippedSecrets(data)).to.deep.equal(['alarm', 'qr']);
            expect(data.secretsIncluded).to.equal(false);
        });
        it('with includeSecrets the PIN and the password stay and the file says so', () => {
            const native: ExportNative = { pageConfig: [alarm(4711), qr('wifiSecret99')] };
            const data = buildPanelConfigExport({
                native,
                panel: { id: 'a', topic: TOPIC, name: 'One' },
                states: {},
                includeSecrets: true,
                now: new Date(0),
            });
            expect(data.secretsIncluded).to.equal(true);
            const byName = Object.fromEntries(data.groups.pages.pages.map(p => [p.page.uniqueName, p]));
            expect(byName.alarm.page).to.have.property('pin', 4711);
            expect(byName.alarm).to.not.have.property('strippedSecrets');
            expect(byName.qr.page).to.have.property('qrPass', 'wifiSecret99');
            expect(pagesWithStrippedSecrets(data)).to.deep.equal([]);
            expect(byName.qr.page).to.not.have.property('navigationAssignment');
        });
        it('stripPageForExport with includeSecrets keeps the fields', () => {
            const { page, stripped } = stripPageForExport(alarm(1234), true);
            expect(page).to.have.property('pin', 1234);
            expect(stripped).to.deep.equal([]);
        });
    });

    describe('secret detection', () => {
        it('pageSecretFields', () => {
            expect(pageSecretFields(alarm(1234))).to.deep.equal(['pin']);
            expect(pageSecretFields(alarm(0))).to.deep.equal(['pin']);
            expect(pageSecretFields(alarm(-1))).to.deep.equal([]);
            expect(pageSecretFields(qr('x'))).to.deep.equal(['qrPass']);
            expect(pageSecretFields(qr(''))).to.deep.equal([]);
            expect(pageSecretFields(menu('m', []))).to.deep.equal([]);
        });
        it('panelPagesWithSecrets lists only pages of the panel', () => {
            const other = { ...alarm(99), uniqueName: 'otherAlarm', navigationAssignment: [{ topic: OTHER }] };
            const native: ExportNative = { pageConfig: [alarm(4711), alarm(-1), qr('pw'), other] };
            native.pageConfig![1].uniqueName = 'globalAlarm';
            expect(panelPagesWithSecrets(native, TOPIC)).to.deep.equal([
                { uniqueName: 'alarm', fields: ['pin'] },
                { uniqueName: 'qr', fields: ['qrPass'] },
            ]);
            expect(panelPagesWithSecrets(native, 'nobody')).to.deep.equal([]);
        });
    });

    describe('exportPagesOfPanel', () => {
        const pages: PageConfigEntry[] = [
            menu('own', [{ topic: TOPIC, navigation: { next: 'all' } }, { topic: OTHER }]),
            menu('all', [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { prev: 'own' } }]),
            menu('excluded', [{ topic: ALL_PANELS_SPECIAL_ID }, { topic: TOPIC }]),
            menu('other', [{ topic: OTHER }]),
            menu('target', [{ topic: OTHER }]),
            {
                card: 'pageLink',
                uniqueName: 'link',
                target: 'target',
                navigationAssignment: [{ topic: TOPIC }],
            } satisfies PageLinkEntry,
        ];
        const group = exportPagesOfPanel({ pageConfig: pages }, TOPIC);

        it('takes own and all panels pages with the navigation of the panel', () => {
            const byName = Object.fromEntries(group.pages.map(p => [p.page.uniqueName, p]));
            expect(byName.own.assignment).to.equal('own');
            expect(byName.own.navigation).to.deep.equal({ next: 'all' });
            expect(byName.all.assignment).to.equal('all');
            expect(byName.all.navigation).to.deep.equal({ prev: 'own' });
            expect(byName.link.assignment).to.equal('own');
            expect(byName.link).to.not.have.property('navigation');
        });
        it('leaves out pages of other panels and excluded pages, lists the exclusions', () => {
            const names = group.pages.map(p => p.page.uniqueName);
            expect(names).to.not.include('other');
            expect(names).to.not.include('excluded');
            expect(group.excludedAllPages).to.deep.equal(['excluded']);
        });
        it('the target of a page link travels along, unassigned', () => {
            const target = group.pages.find(p => p.page.uniqueName === 'target');
            expect(target?.assignment).to.equal('none');
            expect(target?.page).to.not.have.property('navigationAssignment');
        });
        it('keeps the item ids', () => {
            const own = group.pages.find(p => p.page.uniqueName === 'own')?.page;
            expect(own && 'pageItems' in own ? own.pageItems[0]?.itemId : undefined).to.equal('item_own');
        });
        it('no pages: empty group', () => {
            expect(exportPagesOfPanel({}, TOPIC)).to.deep.equal({ pages: [], excludedAllPages: [] });
        });
    });

    describe('exportScreensaverOfPanel', () => {
        it('first entry of the panel, panels emptied, with its notifications', () => {
            const native: ExportNative = {
                screensaverConfig: [
                    screensaver('other', [OTHER]),
                    screensaver('mine', [OTHER, TOPIC], ['n1']),
                    screensaver('second', [TOPIC]),
                ],
                screensaverNotify: [
                    { id: 'n1', enabled: ['a.0.b'] },
                    { id: 'n2', enabled: ['a.0.c'] },
                ],
            };
            const group = exportScreensaverOfPanel(native, TOPIC);
            expect(group.entry?.name).to.equal('mine');
            expect(group.entry?.panels).to.deep.equal([]);
            expect(group.notify.map(n => n.id)).to.deep.equal(['n1']);
            expect(native.screensaverConfig?.[1].panels).to.deep.equal([OTHER, TOPIC]);
        });
        it('no entry: null', () => {
            expect(exportScreensaverOfPanel({ screensaverConfig: [] }, TOPIC)).to.deep.equal({
                entry: null,
                notify: [],
            });
        });
    });

    describe('exportMiscOfPanel', () => {
        it('keeps null buttons, leaves undefined out, takes the overrides of the panel and typed states', () => {
            const misc = exportMiscOfPanel(
                {
                    navigationOverrides: [
                        { panelTopic: TOPIC, page: 'p', navigation: { next: 'q' }, scriptLinks: {} },
                        { panelTopic: OTHER, page: 'x', navigation: {}, scriptLinks: {} },
                    ],
                },
                { topic: TOPIC, buttonLeft: null, noScript: true },
                {
                    'screenSaver.timeout': 30,
                    'dim.dayMode': false,
                    hideCards: 'wrong type',
                    buzzer: '1,2,3',
                    activated: null,
                },
            );
            expect(misc).to.have.property('buttonLeft', null);
            expect(misc).to.not.have.property('buttonRight');
            expect(misc.noScript).to.equal(true);
            expect(misc.navigationOverrides).to.deep.equal([{ page: 'p', navigation: { next: 'q' }, scriptLinks: {} }]);
            expect(misc.states).to.deep.equal({ 'screenSaver.timeout': 30, 'dim.dayMode': false });
            const json = JSON.parse(JSON.stringify(misc));
            expect(json).to.have.property('buttonLeft', null);
            expect(json).to.not.have.property('buttonRight');
        });
        it('noScript false is left out', () => {
            expect(exportMiscOfPanel({}, { topic: TOPIC }, {})).to.not.have.property('noScript');
        });
    });

    describe('buildPanelConfigExport', () => {
        it('format marker, version and source', () => {
            const data = buildPanelConfigExport({
                native: {},
                panel: { id: 'web_00', topic: 'web1', name: 'Phone', model: 'web-p', kind: 'web' },
                states: {},
                adapterVersion: '1.2.3',
                now: new Date('2026-11-11T10:00:00Z'),
            });
            expect(data.format).to.equal(PANEL_CONFIG_FORMAT);
            expect(data.version).to.equal(PANEL_CONFIG_VERSION);
            expect(data.adapterVersion).to.equal('1.2.3');
            expect(data.exportedAt).to.equal('2026-11-11T10:00:00.000Z');
            expect(data.source).to.deep.equal({
                id: 'web_00',
                topic: 'web1',
                name: 'Phone',
                model: 'web-p',
                kind: 'web',
            });
            expect(Object.keys(data.groups)).to.deep.equal(['pages', 'screensaver', 'misc']);
        });
        it('hardware panel defaults: model eu, kind tasmota', () => {
            const data = buildPanelConfigExport({ native: {}, panel: { topic: TOPIC }, states: {}, now: new Date() });
            expect(data.source.model).to.equal('eu');
            expect(data.source.kind).to.equal('tasmota');
            expect(data).to.not.have.property('adapterVersion');
        });
    });

    describe('panelConfigExportFileName', () => {
        it('safe name and local date', () => {
            expect(panelConfigExportFileName('Küche / Flur', new Date(2026, 0, 5))).to.equal(
                'nspanel-K_che_Flur-2026-01-05.json',
            );
            expect(panelConfigExportFileName('  ', new Date(2026, 10, 11))).to.equal('nspanel-panel-2026-11-11.json');
        });
    });

    describe('panelSettingStates', () => {
        type Node = { type?: string; common?: { type?: string; write?: boolean } } & Record<string, unknown>;
        const cmd: unknown = genericStateObjects.panel.panels.cmd;
        const lookup = (id: string): Node | undefined => {
            let node: unknown = cmd;
            for (const part of id.split('.')) {
                node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
            }
            return node && typeof node === 'object' ? (node as Node) : undefined;
        };
        it('every state exists in definition.ts, is writable and has the listed type', () => {
            for (const s of panelSettingStates) {
                const node = lookup(s.id);
                expect(node?.type, s.id).to.equal('state');
                expect(node?.common?.write, s.id).to.equal(true);
                expect(node?.common?.type, s.id).to.equal(s.type);
            }
        });
        it('full ids', () => {
            const ids = panelSettingStateIds('abc', 'nspanel-lovelace-ui.0');
            expect(ids['dim.standby']).to.equal('nspanel-lovelace-ui.0.panels.abc.cmd.dim.standby');
            expect(Object.keys(ids)).to.have.length(panelSettingStates.length);
        });
    });
});
