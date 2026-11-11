import { expect } from 'chai';
import { genericStateObjects } from '../const/definition';
import {
    ALL_PANELS_SPECIAL_ID,
    type MenuEntry,
    type PageConfigEntry,
    type QREntry,
    type ScreensaverEntry,
    type UnlockEntry,
} from './adminShareConfig';
import { buildPanelConfigExport, type ExportPanel } from './panelConfigExport';
import {
    applyPanelImport,
    configDiff,
    navigationDiff,
    panelConfiguredGroups,
    panelSettingDefaults,
    parsePanelConfigImport,
    planPanelImport,
    samePage,
    SCREENSAVER_CHOICE_KEY,
    type ImportNative,
    type PanelConfigImportFile,
    type PanelImportInput,
} from './panelConfigImport';

const SRC = 'nspanel/src';
const DST = 'nspanel/dst';
const OTHER = 'nspanel/other';

function channel(id: string): MenuEntry['pageItems'][number] {
    return { channelId: { valueStateId: id, unit: '', prefix: '', suffix: '', dateFormat: '' } };
}

function menu(
    uniqueName: string,
    assignment: MenuEntry['navigationAssignment'],
    extra: Partial<MenuEntry> = {},
): MenuEntry {
    return {
        card: 'cardGrid',
        uniqueName,
        headline: uniqueName,
        pageItems: [{ ...channel(`a.0.${uniqueName}`)!, itemId: `item_${uniqueName}` }],
        navigationAssignment: assignment,
        ...extra,
    };
}

function alarm(uniqueName: string, pin: number, assignment: UnlockEntry['navigationAssignment']): UnlockEntry {
    return {
        card: 'cardAlarm',
        uniqueName,
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
        navigationAssignment: assignment,
    };
}

function qr(uniqueName: string, qrPass: string, assignment: QREntry['navigationAssignment']): QREntry {
    return {
        card: 'cardQR',
        uniqueName,
        headline: 'Wifi',
        selType: 1,
        ssidUrlTel: 'home',
        wlanhidden: false,
        wlantype: 'WPA2',
        qrPass,
        pwdhidden: true,
        setState: '',
        navigationAssignment: assignment,
    };
}

function screensaver(name: string, panels: string[], extra: Partial<ScreensaverEntry> = {}): ScreensaverEntry {
    return { name, mode: 'standard', panels, left: [], bottom: [], indicator: [], ...extra };
}

const panels: ExportPanel[] = [
    { id: 'aa', topic: SRC, name: 'Source', model: 'eu' },
    { id: 'bb', topic: DST, name: 'Target', model: 'eu' },
    { id: 'cc', topic: OTHER, name: 'Other', model: 'eu' },
];

/**
 * @param native instance configuration
 * @param states settings states of the source
 * @param includeSecrets export with secrets
 * @returns the file of the source panel, parsed like an upload
 */
function exportOf(
    native: ImportNative,
    states: Record<string, unknown> = {},
    includeSecrets = false,
): PanelConfigImportFile {
    const data = buildPanelConfigExport({
        native,
        panel: native.panels?.find(p => p.topic === SRC) ?? panels[0],
        states,
        includeSecrets,
        now: new Date(0),
    });
    const parsed = parsePanelConfigImport(JSON.stringify(data));
    if (!parsed.ok) {
        throw new Error(parsed.error.key);
    }
    return parsed.file;
}

function input(native: ImportNative, file: PanelConfigImportFile, topic = DST, choices = {}): PanelImportInput {
    return { native, topic, file, groups: ['pages', 'screensaver', 'misc'], choices };
}

function names(pages: PageConfigEntry[] | undefined): string[] {
    return (pages ?? []).map(p => p.uniqueName);
}

function page(pages: PageConfigEntry[] | undefined, name: string): PageConfigEntry {
    const p = (pages ?? []).find(x => x.uniqueName === name);
    if (!p) {
        throw new Error(`missing ${name}`);
    }
    return p;
}

describe('lib/types/panelConfigImport', () => {
    describe('parsePanelConfigImport', () => {
        const valid = (): Record<string, unknown> =>
            JSON.parse(
                JSON.stringify(buildPanelConfigExport({ native: {}, panel: panels[0], states: {}, now: new Date(0) })),
            );

        it('accepts an export', () => {
            const r = parsePanelConfigImport(JSON.stringify(valid()));
            expect(r.ok).to.equal(true);
        });
        it('no JSON', () => {
            const r = parsePanelConfigImport('{nope');
            expect(r.ok ? '' : r.error.key).to.equal('importErrorJson');
        });
        it('wrong format marker', () => {
            const r = parsePanelConfigImport(JSON.stringify({ ...valid(), format: 'something' }));
            expect(r.ok ? '' : r.error.key).to.equal('importErrorFormat');
        });
        it('newer version', () => {
            const r = parsePanelConfigImport(JSON.stringify({ ...valid(), version: 99 }));
            expect(r.ok ? '' : r.error.key).to.equal('importErrorVersion');
        });
        it('broken page names the place', () => {
            const data = valid();
            (data.groups as { pages: { pages: unknown[] } }).pages.pages = [
                { page: { card: 'cardGrid' }, assignment: 'own' },
            ];
            const r = parsePanelConfigImport(JSON.stringify(data));
            expect(r.ok ? '' : r.error.key).to.equal('importErrorStructure');
            expect(r.ok ? '' : r.error.detail).to.equal('groups.pages.pages[0].page');
        });
        it('broken misc state value', () => {
            const data = valid();
            (data.groups as { misc: { states: unknown } }).misc.states = { timeout: { x: 1 } };
            const r = parsePanelConfigImport(JSON.stringify(data));
            expect(r.ok ? '' : r.error.detail).to.equal('groups.misc.states.timeout');
        });
        it('a missing group is fine and reported as missing', () => {
            const data = valid();
            delete (data.groups as Record<string, unknown>).screensaver;
            const r = parsePanelConfigImport(JSON.stringify(data));
            expect(r.ok).to.equal(true);
            if (r.ok) {
                const plan = planPanelImport(input({}, r.file));
                expect(plan.missingGroups).to.deep.equal(['screensaver']);
                expect(plan.groups).to.deep.equal(['pages', 'misc']);
            }
        });
    });

    describe('panelConfiguredGroups', () => {
        it('empty panel: nothing', () => {
            const native: ImportNative = {
                pageConfig: [menu('all', [{ topic: ALL_PANELS_SPECIAL_ID }])],
                panels,
            };
            expect(
                panelConfiguredGroups(native, DST, {
                    ...panelSettingDefaults,
                    mainNavigationPoint: 'x',
                    'screenSaver.layout': 3,
                }),
            ).to.deep.equal([]);
        });
        it('own pages, screensaver, buttons, overrides, states', () => {
            expect(panelConfiguredGroups({ pageConfig: [menu('p', [{ topic: DST }])] }, DST, {})).to.deep.equal([
                'pages',
            ]);
            expect(panelConfiguredGroups({ screensaverConfig: [screensaver('s', [DST])] }, DST, {})).to.deep.equal([
                'screensaver',
            ]);
            expect(panelConfiguredGroups({ panels: [{ topic: DST, buttonLeft: null }] }, DST, {})).to.deep.equal([
                'misc',
            ]);
            expect(
                panelConfiguredGroups(
                    { navigationOverrides: [{ panelTopic: DST, page: 'x', navigation: {}, scriptLinks: {} }] },
                    DST,
                    {},
                ),
            ).to.deep.equal(['misc']);
            expect(panelConfiguredGroups({}, DST, { 'screenSaver.timeout': 30 })).to.deep.equal(['misc']);
        });
        it('defaults match definition.ts', () => {
            for (const [id, def] of Object.entries(panelSettingDefaults)) {
                let node: unknown = genericStateObjects.panel.panels.cmd;
                for (const part of id.split('.')) {
                    node = (node as Record<string, unknown>)[part];
                }
                const common = (node as { common: { def?: unknown } }).common;
                if (common.def !== undefined) {
                    expect(common.def, id).to.equal(def);
                }
            }
        });
    });

    describe('samePage / configDiff', () => {
        it('ignores assignment, item ids, stripped secrets, key order and undefined', () => {
            const a = menu('p', [{ topic: SRC }], { hidden: undefined });
            const b: MenuEntry = JSON.parse(JSON.stringify({ ...menu('p', [{ topic: OTHER }]) }));
            b.pageItems[0]!.itemId = 'item_other';
            expect(samePage(a, b)).to.equal(true);
            expect(
                samePage(alarm('x', 1, []), { ...alarm('x', 1, []), pin: undefined } as unknown as PageConfigEntry, [
                    'pin',
                ]),
            ).to.equal(true);
            expect(samePage(alarm('x', 1, []), alarm('x', 2, []))).to.equal(false);
        });
        it('isMainPage and content count', () => {
            expect(samePage(menu('p', []), menu('p', [], { isMainPage: true }))).to.equal(false);
            expect(samePage(menu('p', []), menu('p', [], { headline: 'other' }))).to.equal(false);
        });
        it('readable differences', () => {
            const a = menu('p', [], { headline: 'Old', pageItems: [channel('a.0.x'), channel('a.0.y')] });
            const b = menu('p', [], {
                headline: 'New',
                isMainPage: true,
                pageItems: [{ ...channel('a.0.x')!, name: 'Lamp' }, undefined, channel('a.0.z')],
            });
            const diff = configDiff(a, b, ['navigationAssignment']);
            expect(diff).to.deep.include({ kind: 'field', field: 'headline', existing: 'Old', imported: 'New' });
            expect(diff).to.deep.include({ kind: 'field', field: 'isMainPage', existing: '', imported: 'true' });
            expect(diff).to.deep.include({
                kind: 'item',
                list: 'pageItems',
                position: 1,
                change: 'changed',
                label: 'Lamp',
                fields: ['name'],
                values: [{ field: 'name', existing: '', imported: 'Lamp' }],
            });
            expect(diff).to.deep.include({
                kind: 'item',
                list: 'pageItems',
                position: 2,
                change: 'removed',
                label: 'a.0.y',
            });
            expect(diff).to.deep.include({
                kind: 'item',
                list: 'pageItems',
                position: 3,
                change: 'added',
                label: 'a.0.z',
            });
            expect(navigationDiff({ next: 'a' }, { next: 'b', prev: 'c' })).to.deep.equal([
                { kind: 'navigation', link: 'prev', existing: '', imported: 'c' },
                { kind: 'navigation', link: 'next', existing: 'a', imported: 'b' },
            ]);
        });
    });

    describe('round trip into the same panel', () => {
        const native: ImportNative = {
            panels: [{ ...panels[0], buttonLeft: { mode: 'page', page: 'one' } }, panels[1]],
            pageConfig: [
                menu('one', [{ topic: SRC, navigation: { next: 'two' } }]),
                menu('two', [{ topic: SRC, navigation: { prev: 'one' } }, { topic: OTHER }]),
                menu('all', [{ topic: ALL_PANELS_SPECIAL_ID, navigation: { prev: 'one' } }]),
                alarm('lock', 1234, [{ topic: SRC }]),
            ],
            screensaverConfig: [
                screensaver('ss', [SRC], {
                    notify: ['n1'],
                    clockTimer: { enabled: true, activeState: '', dataState: '', itemId: 'item_one' },
                }),
            ],
            screensaverNotify: [{ id: 'n1', enabled: ['a.0.b'] }],
            navigationOverrides: [{ panelTopic: SRC, page: 'script', navigation: { next: 'one' }, scriptLinks: {} }],
        };
        const file = exportOf(native, { 'screenSaver.timeout': 20 });
        const plan = planPanelImport(input(native, file, SRC));

        it('everything identical, nothing to decide', () => {
            expect(plan.valid).to.equal(true);
            expect(plan.pages.map(p => [p.original, p.conflict, p.action])).to.deep.equal([
                ['one', 'identical', 'merge'],
                ['two', 'identical', 'merge'],
                ['all', 'identical', 'merge'],
                ['lock', 'identical', 'merge'],
            ]);
            expect(plan.screensaver?.action).to.equal('merge');
        });
        it('the configuration stays as it was', () => {
            const r = applyPanelImport(input(native, file, SRC), plan);
            expect(names(r.native.pageConfig)).to.deep.equal(['one', 'two', 'all', 'lock']);
            expect(page(r.native.pageConfig, 'one').navigationAssignment).to.deep.equal([
                { topic: SRC, navigation: { next: 'two' } },
            ]);
            expect(page(r.native.pageConfig, 'two').navigationAssignment).to.deep.equal([
                { topic: OTHER },
                { topic: SRC, navigation: { prev: 'one' } },
            ]);
            // the all page applies anyway
            expect(page(r.native.pageConfig, 'all').navigationAssignment).to.deep.equal([
                { topic: ALL_PANELS_SPECIAL_ID, navigation: { prev: 'one' } },
            ]);
            // the secret of the existing page is kept
            expect(page(r.native.pageConfig, 'lock')).to.have.property('pin', 1234);
            expect(r.report.secrets).to.deep.equal([]);
            expect(r.native.screensaverConfig).to.deep.equal(native.screensaverConfig);
            expect(r.native.screensaverNotify).to.deep.equal(native.screensaverNotify);
            expect(r.native.navigationOverrides).to.deep.equal(native.navigationOverrides);
            expect(r.native.panels?.[0].buttonLeft).to.deep.equal({ mode: 'page', page: 'one' });
            expect(r.states).to.deep.equal({ 'screenSaver.timeout': 20 });
        });
    });

    describe('import into another panel', () => {
        it('empty target: pages get an assignment of the target, screensaver gets the topic', () => {
            const native: ImportNative = {
                panels,
                pageConfig: [menu('one', [{ topic: SRC, navigation: { next: 'one' } }])],
                screensaverConfig: [screensaver('ss', [SRC])],
            };
            const file = exportOf(native);
            const plan = planPanelImport(input(native, file));
            const r = applyPanelImport(input(native, file), plan);
            expect(page(r.native.pageConfig, 'one').navigationAssignment).to.deep.equal([
                { topic: SRC, navigation: { next: 'one' } },
                { topic: DST, navigation: { next: 'one' } },
            ]);
            expect(r.native.screensaverConfig?.[0].panels).to.deep.equal([SRC, DST]);
            expect(r.report.merged).to.deep.equal(['one']);
        });
        it('removes the old own assignments of the target, pages stay', () => {
            const native: ImportNative = {
                panels,
                pageConfig: [
                    menu('one', [{ topic: SRC }]),
                    menu('old', [{ topic: DST }]),
                    menu('shared', [{ topic: DST }, { topic: OTHER }]),
                ],
            };
            const file = exportOf(native);
            const r = applyPanelImport(input(native, file), planPanelImport(input(native, file)));
            expect(names(r.native.pageConfig)).to.deep.equal(['one', 'old', 'shared']);
            expect(page(r.native.pageConfig, 'old').navigationAssignment).to.deep.equal([]);
            expect(page(r.native.pageConfig, 'shared').navigationAssignment).to.deep.equal([{ topic: OTHER }]);
        });
        it('new page into another instance: added with the target assignment', () => {
            const source: ImportNative = {
                panels,
                pageConfig: [menu('one', [{ topic: SRC, navigation: { next: 'x' } }])],
            };
            const file = exportOf(source);
            const target: ImportNative = { panels, pageConfig: [] };
            const plan = planPanelImport(input(target, file));
            expect(plan.pages[0].action).to.equal('add');
            const r = applyPanelImport(input(target, file), plan);
            expect(r.native.pageConfig).to.have.length(1);
            expect(page(r.native.pageConfig, 'one').navigationAssignment).to.deep.equal([
                { topic: DST, navigation: { next: 'x' } },
            ]);
            expect(r.report.added).to.deep.equal(['one']);
        });
        it('all page with other navigation on the target: own assignment with navigation (not an exclusion)', () => {
            const source: ImportNative = {
                panels,
                pageConfig: [
                    menu('all', [{ topic: ALL_PANELS_SPECIAL_ID }, { topic: SRC, navigation: { next: 'z' } }]),
                ],
            };
            const file = exportOf(source);
            const target: ImportNative = { panels, pageConfig: [menu('all', [{ topic: ALL_PANELS_SPECIAL_ID }])] };
            const r = applyPanelImport(input(target, file), planPanelImport(input(target, file)));
            expect(page(r.native.pageConfig, 'all').navigationAssignment).to.deep.equal([
                { topic: ALL_PANELS_SPECIAL_ID },
                { topic: DST, navigation: { next: 'z' } },
            ]);
        });
        it('all page without navigation stays without own assignment', () => {
            const source: ImportNative = { panels, pageConfig: [menu('all', [{ topic: ALL_PANELS_SPECIAL_ID }])] };
            const file = exportOf(source);
            const r = applyPanelImport(input(source, file), planPanelImport(input(source, file)));
            expect(page(r.native.pageConfig, 'all').navigationAssignment).to.deep.equal([
                { topic: ALL_PANELS_SPECIAL_ID },
            ]);
        });
        it('excluded all pages of the source are excluded on the target', () => {
            const native: ImportNative = {
                panels,
                pageConfig: [menu('all', [{ topic: ALL_PANELS_SPECIAL_ID }, { topic: SRC }])],
            };
            const file = exportOf(native);
            const r = applyPanelImport(input(native, file), planPanelImport(input(native, file)));
            expect(page(r.native.pageConfig, 'all').navigationAssignment).to.deep.equal([
                { topic: ALL_PANELS_SPECIAL_ID },
                { topic: SRC },
                { topic: DST },
            ]);
            expect(r.report.excludedAllPages).to.deep.equal(['all']);
        });
        it('link target travels unassigned', () => {
            const source: ImportNative = {
                panels,
                pageConfig: [
                    { card: 'pageLink', uniqueName: 'link', target: 'tgt', navigationAssignment: [{ topic: SRC }] },
                    menu('tgt', [{ topic: OTHER }]),
                ],
            };
            const file = exportOf(source);
            const r = applyPanelImport(input({ panels }, file), planPanelImport(input({ panels }, file)));
            expect(page(r.native.pageConfig, 'tgt').navigationAssignment).to.deep.equal([]);
            expect(page(r.native.pageConfig, 'link').navigationAssignment).to.deep.equal([
                { topic: DST, navigation: undefined },
            ]);
        });
    });

    describe('conflicts', () => {
        const source: ImportNative = {
            panels: [{ ...panels[0], buttonRight: { mode: 'page', page: 'a' } }, panels[1], panels[2]],
            pageConfig: [
                menu('a', [{ topic: SRC, navigation: { next: 'b' } }], { headline: 'Source A' }),
                menu('b', [{ topic: SRC, navigation: { prev: 'a' } }], {
                    pageItems: [{ ...channel('a.0.b')!, itemId: 'item_b', targetPage: 'a' }],
                }),
                menu('c', [{ topic: SRC }]),
            ],
            screensaverConfig: [
                screensaver('ss', [SRC], { indicator: [{ state: 'x', action: { kind: 'navigate', page: 'a' } }] }),
            ],
            navigationOverrides: [{ panelTopic: SRC, page: 'script', navigation: { next: 'a' }, scriptLinks: {} }],
        };
        const file = exportOf(source);
        // target instance: a differs, b and c equal to the source
        const target: ImportNative = {
            panels,
            pageConfig: [
                menu('a', [{ topic: OTHER }], { headline: 'Target A' }),
                menu('b', [{ topic: OTHER }], {
                    pageItems: [{ ...channel('a.0.b')!, itemId: 'item_b', targetPage: 'a' }],
                }),
                menu('c', [{ topic: OTHER }]),
            ],
            screensaverConfig: [
                screensaver('ss', [OTHER], { indicator: [{ state: 'x', action: { kind: 'navigate', page: 'a' } }] }),
            ],
        };

        it('different page: rename proposed; a page referencing it becomes different too (fixpoint)', () => {
            const plan = planPanelImport(input(target, file));
            expect(plan.pages.map(p => [p.original, p.conflict, p.action, p.name])).to.deep.equal([
                ['a', 'different', 'rename', 'a_dst'],
                ['b', 'different', 'rename', 'b_dst'],
                ['c', 'identical', 'merge', 'c'],
            ]);
            expect(plan.pages[0].sharedWith).to.deep.equal([OTHER]);
            expect(plan.renames).to.deep.equal({ a: 'a_dst', b: 'b_dst' });
            // the screensaver points to a -> renamed -> no longer identical, same name -> rename
            expect(plan.screensaver).to.include({ conflict: 'different', action: 'rename', name: 'ss_dst' });
        });
        it('apply remaps all references to the renamed pages', () => {
            const plan = planPanelImport(input(target, file));
            const r = applyPanelImport(input(target, file), plan);
            expect(names(r.native.pageConfig)).to.deep.equal(['a', 'b', 'c', 'a_dst', 'b_dst']);
            const b = page(r.native.pageConfig, 'b_dst') as MenuEntry;
            expect(b.pageItems[0]?.targetPage).to.equal('a_dst');
            expect(b.navigationAssignment).to.deep.equal([{ topic: DST, navigation: { prev: 'a_dst' } }]);
            expect(page(r.native.pageConfig, 'a_dst').navigationAssignment).to.deep.equal([
                { topic: DST, navigation: { next: 'b_dst' } },
            ]);
            // existing pages untouched
            expect(page(r.native.pageConfig, 'a').navigationAssignment).to.deep.equal([{ topic: OTHER }]);
            // item ids: b_dst got a new one (item_b is taken)
            expect(b.pageItems[0]?.itemId).to.not.equal('item_b');
            const ss = r.native.screensaverConfig?.find(e => e.name === 'ss_dst');
            expect(ss?.panels).to.deep.equal([DST]);
            expect(ss?.indicator[0]?.action?.page).to.equal('a_dst');
            expect(r.native.panels?.[1].buttonRight).to.deep.equal({ mode: 'page', page: 'a_dst' });
            expect(r.native.navigationOverrides).to.deep.equal([
                { panelTopic: DST, page: 'script', navigation: { next: 'a_dst' }, scriptLinks: {} },
            ]);
            expect(r.report.renamed).to.deep.equal([
                { from: 'a', to: 'a_dst' },
                { from: 'b', to: 'b_dst' },
            ]);
        });
        it('user name for a rename ripples as well', () => {
            const plan = planPanelImport(input(target, file, DST, { a: { action: 'rename', name: 'Alpha' } }));
            expect(plan.renames).to.deep.equal({ a: 'Alpha', b: 'b_dst' });
            const r = applyPanelImport(input(target, file, DST, { a: { action: 'rename', name: 'Alpha' } }), plan);
            expect((page(r.native.pageConfig, 'b_dst') as MenuEntry).pageItems[0]?.targetPage).to.equal('Alpha');
        });
        it('invalid names', () => {
            for (const [name, error] of [
                ['main', 'importNameMain'],
                ['c', 'importNameExists'],
                ['', 'importNameEmpty'],
                ['///x', 'importNameReserved'],
            ]) {
                const plan = planPanelImport(input(target, file, DST, { a: { action: 'rename', name } }));
                expect(plan.pages[0].nameError, name).to.equal(error);
                expect(plan.valid).to.equal(false);
            }
        });
        it('two renames to the same name', () => {
            const plan = planPanelImport(
                input(target, file, DST, { a: { action: 'rename', name: 'X' }, b: { action: 'rename', name: 'X' } }),
            );
            expect(plan.pages.map(p => p.nameError)).to.deep.equal(['importNameTwice', 'importNameTwice', undefined]);
            expect(plan.valid).to.equal(false);
        });
        it('replace: no rename, references stay, other panels keep the page', () => {
            const choices = { a: { action: 'replace' as const } };
            const plan = planPanelImport(input(target, file, DST, choices));
            expect(plan.pages.map(p => [p.original, p.action])).to.deep.equal([
                ['a', 'replace'],
                ['b', 'merge'],
                ['c', 'merge'],
            ]);
            const r = applyPanelImport(input(target, file, DST, choices), plan);
            const a = page(r.native.pageConfig, 'a') as MenuEntry;
            expect(a.headline).to.equal('Source A');
            expect(a.navigationAssignment).to.deep.equal([{ topic: OTHER }, { topic: DST, navigation: { next: 'b' } }]);
            expect(a.pageItems[0]?.itemId).to.equal('item_a');
            expect(r.report.replaced).to.deep.equal(['a']);
        });
        it('skip: nothing added, the existing page is not assigned', () => {
            const choices = { a: { action: 'skip' as const }, [SCREENSAVER_CHOICE_KEY]: { action: 'skip' as const } };
            const plan = planPanelImport(input(target, file, DST, choices));
            const r = applyPanelImport(input(target, file, DST, choices), plan);
            expect(page(r.native.pageConfig, 'a').navigationAssignment).to.deep.equal([{ topic: OTHER }]);
            expect(r.report.skipped).to.deep.equal(['a']);
            expect(r.native.screensaverConfig?.map(e => e.name)).to.deep.equal(['ss']);
            expect(r.report.screensaver).to.deep.equal({ action: 'skip', name: 'ss' });
        });
        it('screensaver replace keeps the other panels', () => {
            const choices = { [SCREENSAVER_CHOICE_KEY]: { action: 'replace' as const } };
            const plan = planPanelImport(input(target, file, DST, choices));
            expect(plan.screensaver?.sharedWith).to.deep.equal([OTHER]);
            const r = applyPanelImport(input(target, file, DST, choices), plan);
            const ss = r.native.screensaverConfig?.find(e => e.name === 'ss');
            expect(ss?.panels).to.deep.equal([OTHER, DST]);
            expect(ss?.indicator[0]?.action?.page).to.equal('a_dst');
        });
    });

    describe('secrets', () => {
        const source: ImportNative = {
            panels,
            pageConfig: [
                alarm('lock', 4711, [{ topic: SRC }]),
                qr('wifi', 'pw', [{ topic: SRC }]),
                alarm('glob', -1, [{ topic: SRC }]),
            ],
        };
        it('new pages without secrets get the safe value and are reported', () => {
            const file = exportOf(source);
            const r = applyPanelImport(input({ panels }, file), planPanelImport(input({ panels }, file)));
            expect(page(r.native.pageConfig, 'lock')).to.have.property('pin', -1);
            expect(page(r.native.pageConfig, 'wifi')).to.have.property('qrPass', '');
            expect(page(r.native.pageConfig, 'glob')).to.have.property('pin', -1);
            expect(r.report.secrets).to.deep.equal([
                { page: 'lock', fields: ['pin'] },
                { page: 'wifi', fields: ['qrPass'] },
            ]);
        });
        it('with secrets in the file they are taken over', () => {
            const file = exportOf(source, {}, true);
            const r = applyPanelImport(input({ panels }, file), planPanelImport(input({ panels }, file)));
            expect(page(r.native.pageConfig, 'lock')).to.have.property('pin', 4711);
            expect(r.report.secrets).to.deep.equal([]);
        });
        it('an existing page with another PIN is identical when the file has no PIN', () => {
            const file = exportOf(source);
            const target: ImportNative = { panels, pageConfig: [alarm('lock', 9999, [{ topic: OTHER }])] };
            const plan = planPanelImport(input(target, file));
            expect(plan.pages[0].conflict).to.equal('identical');
        });
        it('replace keeps the PIN of the replaced page', () => {
            const file = exportOf(source);
            const target: ImportNative = {
                panels,
                pageConfig: [{ ...alarm('lock', 9999, [{ topic: OTHER }]), headline: 'B' }],
            };
            const choices = { lock: { action: 'replace' as const } };
            const r = applyPanelImport(
                input(target, file, DST, choices),
                planPanelImport(input(target, file, DST, choices)),
            );
            expect(page(r.native.pageConfig, 'lock')).to.include({ pin: 9999, headline: 'A' });
            expect(r.report.secrets.map(s => s.page)).to.not.include('lock');
        });
    });

    describe('start page', () => {
        it('imported start page wins on the target, other panels keep the old one', () => {
            const source: ImportNative = { panels, pageConfig: [menu('home', [{ topic: SRC }], { isMainPage: true })] };
            const file = exportOf(source);
            const target: ImportNative = {
                panels,
                pageConfig: [
                    menu('oldMain', [{ topic: ALL_PANELS_SPECIAL_ID }], { isMainPage: true }),
                    menu('ownMain', [{ topic: OTHER }], { isMainPage: true }),
                ],
            };
            const r = applyPanelImport(input(target, file), planPanelImport(input(target, file)));
            expect(r.report.mainPage).to.equal('home');
            expect(r.report.mainPageRemoved).to.deep.equal(['oldMain']);
            expect(page(r.native.pageConfig, 'oldMain').navigationAssignment).to.deep.equal([
                { topic: ALL_PANELS_SPECIAL_ID },
                { topic: DST },
            ]);
            expect(page(r.native.pageConfig, 'ownMain').navigationAssignment).to.deep.equal([{ topic: OTHER }]);
        });
    });

    describe('item ids and the clock timer', () => {
        it('a colliding item id is renewed and the timer follows it', () => {
            const source: ImportNative = {
                panels,
                pageConfig: [menu('t', [{ topic: SRC }])],
                screensaverConfig: [
                    screensaver('ss', [SRC], {
                        clockTimer: { enabled: true, activeState: '', dataState: '', itemId: 'item_t' },
                    }),
                ],
            };
            const file = exportOf(source);
            // another page of the target uses item_t already, t itself is new
            const target: ImportNative = {
                panels,
                pageConfig: [
                    menu('x', [{ topic: OTHER }], { pageItems: [{ ...channel('a.0.q')!, itemId: 'item_t' }] }),
                ],
            };
            const r = applyPanelImport(input(target, file), planPanelImport(input(target, file)));
            const id = (page(r.native.pageConfig, 't') as MenuEntry).pageItems[0]?.itemId;
            expect(id).to.not.equal('item_t');
            expect(r.native.screensaverConfig?.[0].clockTimer?.itemId).to.equal(id);
        });
        it('merged page: the timer points to the item of the existing page', () => {
            const source: ImportNative = {
                panels,
                pageConfig: [menu('t', [{ topic: SRC }])],
                screensaverConfig: [
                    screensaver('ss', [SRC], {
                        clockTimer: { enabled: true, activeState: '', dataState: '', itemId: 'item_t' },
                    }),
                ],
            };
            const file = exportOf(source);
            const target: ImportNative = {
                panels,
                pageConfig: [
                    menu('t', [{ topic: OTHER }], { pageItems: [{ ...channel('a.0.t')!, itemId: 'item_zz' }] }),
                ],
            };
            const plan = planPanelImport(input(target, file));
            expect(plan.pages[0].action).to.equal('merge');
            const r = applyPanelImport(input(target, file), plan);
            expect(r.native.screensaverConfig?.[0].clockTimer?.itemId).to.equal('item_zz');
        });
    });

    describe('notifications', () => {
        it('identical reused, same id different renewed, missing added', () => {
            const source: ImportNative = {
                panels,
                screensaverConfig: [screensaver('ss', [SRC], { notify: ['same', 'clash', 'new'] })],
                screensaverNotify: [
                    { id: 'same', enabled: ['a'] },
                    { id: 'clash', enabled: ['b'] },
                    { id: 'new', enabled: ['c'] },
                ],
            };
            const file = exportOf(source);
            const target: ImportNative = {
                panels,
                screensaverNotify: [
                    { id: 'same', enabled: ['a'] },
                    { id: 'clash', enabled: ['other'] },
                ],
            };
            const r = applyPanelImport(input(target, file), planPanelImport(input(target, file)));
            const list = r.native.screensaverNotify ?? [];
            expect(list.map(n => n.id)).to.include.members(['same', 'clash', 'new']);
            expect(list).to.have.length(4);
            const renamed = r.report.notifyRenamed[0];
            expect(renamed.from).to.equal('clash');
            expect(r.native.screensaverConfig?.[0].notify).to.deep.equal(['same', renamed.to, 'new']);
            expect(list.find(n => n.id === renamed.to)?.enabled).to.deep.equal(['b']);
        });
        it('file without screensaver removes the topic from the entries', () => {
            const file = exportOf({ panels });
            const target: ImportNative = { panels, screensaverConfig: [screensaver('ss', [DST, OTHER])] };
            const r = applyPanelImport(input(target, file), planPanelImport(input(target, file)));
            expect(r.native.screensaverConfig?.[0].panels).to.deep.equal([OTHER]);
            expect(r.report.screensaver).to.deep.equal({ action: 'removed', name: '' });
        });
    });

    describe('misc', () => {
        it('buttons exactly, noScript, overrides replaced, layout skipped with an admin screensaver', () => {
            const source: ImportNative = {
                panels: [{ ...panels[0], buttonLeft: null }],
                screensaverConfig: [screensaver('ss', [SRC])],
            };
            const file = exportOf(source, {
                'screenSaver.layout': 2,
                'screenSaver.timeout': 40,
                mainNavigationPoint: 'main',
            });
            const target: ImportNative = {
                panels: [panels[0], { ...panels[1], buttonRight: { mode: 'page', page: 'x' }, noScript: true }],
                navigationOverrides: [
                    { panelTopic: DST, page: 'old', navigation: {}, scriptLinks: {} },
                    { panelTopic: OTHER, page: 'keep', navigation: {}, scriptLinks: {} },
                ],
            };
            const r = applyPanelImport(input(target, file), planPanelImport(input(target, file)));
            const dst = r.native.panels?.[1];
            expect(dst).to.have.property('buttonLeft', null);
            expect(dst).to.not.have.property('buttonRight');
            expect(dst).to.not.have.property('noScript');
            expect(r.native.navigationOverrides).to.deep.equal([
                { panelTopic: OTHER, page: 'keep', navigation: {}, scriptLinks: {} },
            ]);
            expect(r.states).to.deep.equal({ 'screenSaver.timeout': 40, mainNavigationPoint: 'main' });
        });
        it('only selected groups are touched', () => {
            const source: ImportNative = { panels, pageConfig: [menu('a', [{ topic: SRC }])] };
            const file = exportOf(source);
            const target: ImportNative = { panels, pageConfig: [menu('z', [{ topic: DST }])] };
            const r = applyPanelImport(
                { ...input(target, file), groups: ['misc'] },
                planPanelImport({ ...input(target, file), groups: ['misc'] }),
            );
            expect(r.native.pageConfig).to.equal(undefined);
            expect(r.native.screensaverConfig).to.equal(undefined);
        });
    });
});
