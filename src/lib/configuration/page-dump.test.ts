import { expect } from 'chai';
import type { PageConfigEntry } from '../types/adminShareConfig';
import { isPageDumpRequest, pageDumpFileName, parsePageDumpList } from '../types/pageDump';
import {
    buildPageDump,
    findGlobalPage,
    findScriptPage,
    scriptScreensaverSection,
    stripRuntimeSecrets,
    toPlainJson,
    type PageDumpInput,
    type PanelPageDumpRuntime,
} from './page-dump';

const TOPIC = 'nspanel/test';

function input(runtime: PanelPageDumpRuntime, extra: Partial<PageDumpInput> = {}): PageDumpInput {
    return {
        panel: { topic: TOPIC, name: 'Test', model: 'eu', kind: 'tasmota', noScript: false },
        runtime,
        native: {},
        scriptConfigRaw: [],
        globalConfigRaw: undefined,
        now: new Date('2026-11-18T10:00:00Z'),
        ...extra,
    };
}

describe('page dump', () => {
    describe('toPlainJson', () => {
        it('turns RegExp into text, drops functions and undefined, marks cycles', () => {
            const obj: Record<string, unknown> = { re: /^a\.b/, f: () => 1, u: undefined, list: [undefined, 1] };
            obj.self = obj;
            expect(toPlainJson(obj)).to.deep.equal({ re: '/^a\\.b/', list: [null, 1], self: '[circular]' });
        });
        it('keeps a shared object that is no cycle', () => {
            const shared = { a: 1 };
            expect(toPlainJson({ x: shared, y: shared })).to.deep.equal({ x: { a: 1 }, y: { a: 1 } });
        });
    });

    describe('stripRuntimeSecrets', () => {
        it('removes a constant PIN of an alarm page', () => {
            const config = { card: 'cardAlarm', data: { pin: { type: 'const', constVal: '1234' }, headline: 'x' } };
            expect(stripRuntimeSecrets(config)).to.deep.equal(['pin']);
            expect(config.data).to.not.have.property('pin');
        });
        it('keeps the global password marker -1 and a state', () => {
            const global = { card: 'cardAlarm', data: { pin: { type: 'const', constVal: '-1' } } };
            expect(stripRuntimeSecrets(global)).to.deep.equal([]);
            const state = { card: 'cardAlarm', data: { pin: { type: 'state', dp: 'a.b' } } };
            expect(stripRuntimeSecrets(state)).to.deep.equal([]);
        });
        it('removes the wifi password of a QR page', () => {
            const config = { card: 'cardQR', data: { password: { type: 'const', constVal: 'secret' } } };
            expect(stripRuntimeSecrets(config)).to.deep.equal(['password']);
            expect(config.data).to.deep.equal({});
        });
    });

    describe('script and global sections', () => {
        const script = {
            panelTopic: TOPIC,
            weatherEntity: 'accuweather.0',
            favoritScreensaverEntity: [{ ScreensaverEntity: 'a' }],
            pages: [
                { uniqueName: 'main', type: 'cardGrid' },
                { globalLink: 'g1', uniqueName: 'renamed' },
            ],
            subPages: [{ uniqueName: 'sub', type: 'cardEntities' }],
        };
        const global = { type: 'globalConfig', subPages: [{ uniqueName: 'g1' }, { uniqueName: 'g2' }] };

        it('finds a page in pages and subPages', () => {
            expect(findScriptPage(script, 'main')?.list).to.equal('pages');
            expect(findScriptPage(script, 'sub')?.list).to.equal('subPages');
            expect(findScriptPage(script, 'renamed')).to.equal(undefined);
        });
        it('finds a global page through its link or by name', () => {
            expect(findGlobalPage(script, global, 'renamed')).to.deep.equal({
                link: { globalLink: 'g1', uniqueName: 'renamed' },
                page: { uniqueName: 'g1' },
            });
            expect(findGlobalPage(script, global, 'g2')).to.deep.equal({ page: { uniqueName: 'g2' } });
            expect(findGlobalPage(script, global, 'none')).to.equal(undefined);
        });
        it('takes the screensaver fields of a script', () => {
            expect(scriptScreensaverSection(script)).to.deep.equal({
                weatherEntity: 'accuweather.0',
                favoritScreensaverEntity: [{ ScreensaverEntity: 'a' }],
            });
        });
    });

    describe('buildPageDump', () => {
        it('admin page: stored entry without PIN, runtime without PIN, assignment kept', () => {
            const entry = {
                card: 'cardAlarm',
                uniqueName: 'alarm',
                headline: 'Alarm',
                pin: 4711,
                navigationAssignment: [{ topic: TOPIC, navigation: { prev: 'main' } }],
            } as unknown as PageConfigEntry;
            const dump = buildPageDump(
                input(
                    {
                        name: 'alarm',
                        kind: 'page',
                        card: 'cardAlarm',
                        origin: 'admin',
                        adminPageName: 'alarm',
                        navigation: { prev: 'main' },
                        config: { card: 'cardAlarm', data: { pin: { type: 'const', constVal: '4711' } } },
                        pageItems: [],
                    },
                    { native: { pageConfig: [entry] } },
                ),
            );
            const text = JSON.stringify(dump);
            expect(text).to.not.contain('4711');
            expect(dump.stored).to.deep.include({
                admin: {
                    page: {
                        card: 'cardAlarm',
                        uniqueName: 'alarm',
                        headline: 'Alarm',
                        navigationAssignment: [{ topic: TOPIC, navigation: { prev: 'main' } }],
                    },
                    assignment: { kind: 'own', navigation: { prev: 'main' } },
                    strippedSecrets: ['pin'],
                },
            });
            expect(dump.runtime).to.deep.include({ strippedSecrets: ['pin'] });
        });

        it('script page: raw section and page items with role and setNavi', () => {
            const item = { type: 'button', role: 'indicator', data: { setNavi: { type: 'const', constVal: 'sub' } } };
            const dump = buildPageDump(
                input(
                    {
                        name: 'main',
                        kind: 'page',
                        card: 'cardGrid',
                        origin: 'script',
                        config: { card: 'cardGrid', data: {} },
                        pageItems: [item, undefined],
                    },
                    { scriptConfigRaw: [{ panelTopic: TOPIC, pages: [{ uniqueName: 'main', items: [] }] }] },
                ),
            );
            expect(dump.stored).to.deep.equal({ script: { list: 'pages', page: { uniqueName: 'main', items: [] } } });
            expect(dump.runtime).to.deep.include({ pageItems: [item, null] });
            expect(dump.page).to.deep.equal({ name: 'main', kind: 'page', card: 'cardGrid', origin: 'script' });
        });

        it('admin screensaver: entry of the panel with its notifications', () => {
            const dump = buildPageDump(
                input(
                    {
                        name: 'scr',
                        kind: 'screensaver',
                        card: 'screensaver2',
                        origin: 'admin',
                        mode: 'advanced',
                        config: { card: 'screensaver2' },
                        pageItems: [],
                    },
                    {
                        native: {
                            screensaverConfig: [
                                { name: 'scr', mode: 'advanced', panels: [TOPIC] } as unknown as NonNullable<
                                    PageDumpInput['native']['screensaverConfig']
                                >[number],
                            ],
                        },
                    },
                ),
            );
            const stored = dump.stored as { admin: { entry: { panels: string[] } } };
            expect(stored.admin.entry.panels).to.deep.equal([]);
            expect(dump.runtime).to.deep.include({ mode: 'advanced' });
        });
    });

    describe('shared helpers', () => {
        it('validates requests and lists', () => {
            expect(isPageDumpRequest({ panelTopic: 'a', page: 'b', kind: 'page' })).to.equal(true);
            expect(isPageDumpRequest({ panelTopic: 'a', page: '', kind: 'page' })).to.equal(false);
            expect(isPageDumpRequest({ panelTopic: 'a', page: 'b', kind: 'x' })).to.equal(false);
            expect(
                parsePageDumpList({
                    result: [
                        { panelTopic: 't', panelName: 'n', page: 'p', kind: 'page', card: 'cardGrid' },
                        { panelTopic: 't' },
                    ],
                }),
            ).to.have.length(1);
            expect(parsePageDumpList({})).to.equal(undefined);
        });
        it('builds a safe file name', () => {
            expect(pageDumpFileName('Küche 1', 'main/x', new Date(2026, 10, 8))).to.equal(
                'nspanel-page-K_che_1-main_x-2026-11-08.json',
            );
        });
    });
});
