/**
 * The templates `text.trash.*` on the real parts: template merge, StatesControler, Dataitem, PageItem and
 * Controller.getTrashDaten. Only the adapter and the panel are replaced.
 */
import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { Page } from '../classes/Page';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { trashPagesState } from '../const/definition';
import { Controller } from '../controller/controller';
import { StatesControler } from '../controller/states-controller';
import { PageItem } from '../pages/pageItem';
import { Screensaver } from '../pages/screensaver';
import { pageItemTemplates } from './templateArray';

type TemplateName = 'text.trash.next' | 'text.trash.afterNext';
type Message = { icon: string; color: { r: number; g: number; b: number }; text: string; text1: string };

const german = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../admin/i18n/de/translations.json'), 'utf8'),
) as Record<string, string>;

const yellow: Message = { icon: 'trash-can', color: { r: 255, g: 255, b: 0 }, text: 'Gelb', text1: 'today' };
const brown: Message = { icon: 'recycle', color: { r: 120, g: 70, b: 20 }, text: 'Bio', text1: 'tomorrow' };

/**
 * a date as `getTrashDataFromState` expects it, relative to today
 *
 * @param days days from today
 */
function dateIn(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

function trashEntry(uniqueName: string, trashState: string): Record<string, unknown> {
    return {
        card: 'cardTrash',
        uniqueName,
        countItems: 4,
        trashImport: true,
        trashState,
        items: [
            { textTrash: 'Gelb', customTrash: '', iconColor: '#ffff00', icon: 'trash-can' },
            { textTrash: 'Bio', customTrash: '', iconColor: '#784614', icon: 'recycle' },
        ],
    };
}

type Fixture = {
    adapter: any;
    states: StatesControler;
    controller: any;
    logged: string[];
    foreign: Record<string, unknown>;
    timers: { fn: () => unknown; delay: number; cleared: boolean }[];
};

function setup(pageConfig?: Record<string, unknown>[]): Fixture {
    const logged: string[] = [];
    const noop = (): void => undefined;
    const foreign: Record<string, unknown> = {};
    const timers: Fixture['timers'] = [];
    const adapter: any = {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'de',
        unload: false,
        log: {
            silly: noop,
            debug: noop,
            info: noop,
            warn: (s: string): void => void logged.push(s),
            error: (s: string): void => void logged.push(s),
        },
        library: { getTranslation: (s: string): string => german[s] ?? s },
        config: { pageConfig },
        setInterval: (): undefined => undefined,
        clearInterval: noop,
        setTimeout: (fn: () => unknown, delay: number): any => {
            const timer = { fn, delay, cleared: false };
            timers.push(timer);
            return timer;
        },
        clearTimeout: (timer: { cleared: boolean }): void => {
            timer.cleared = true;
        },
        delay: async (): Promise<void> => undefined,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        getForeignObjectAsync: async (): Promise<null> => null,
        getForeignStateAsync: async (id: string): Promise<unknown> => (id in foreign ? { val: foreign[id] } : null),
    };
    const states = new StatesControler(adapter);
    adapter.controller = { statesControler: states };
    const controller: any = Object.create(Controller.prototype);
    Object.assign(controller, {
        adapter,
        library: adapter.library,
        log: adapter.log,
        statesControler: states,
        trashPages: {},
        unload: false,
    });
    return { adapter, states, controller, logged, foreign, timers };
}

async function buildItem(
    fixture: Fixture,
    template: TemplateName,
    readOptions?: Record<string, string>,
    extra: Record<string, unknown> = {},
): Promise<PageItem> {
    const merged: any = await Page.prototype.getItemFromTemplate.call({ log: fixture.adapter.log, dpInit: '' }, {
        template,
        dpInit: '',
        modeScr: 'bottom',
        readOptions,
        ...extra,
    } as any);
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: '0?4',
        name: template,
        log: fixture.adapter.log,
        adapter: fixture.adapter,
        library: fixture.adapter.library,
        config: merged,
        basePanel: { name: 'panel' },
        clockSourceListeners: new Set(),
        parent: { card: 'screensaver2', isScreensaver: true, basePanel: { isOnline: true } },
        timeouts: {},
    });
    const data = await fixture.states.createDataItems(merged.data, item, {}, 'data', merged.readOptions);
    Object.assign(item, { dataItems: { ...merged, data }, canBeHidden: !!data.enabled });
    return item;
}

const payload = (m: Message, text: string): string =>
    ['text', '0?4', Icons.GetIcon(m.icon), String(Color.rgb_dec565(m.color)), 'Abfall', text].join('~');

async function runningFixture(pages: Record<string, unknown>): Promise<Fixture> {
    const fixture = setup();
    await fixture.controller.initTrashPagesState();
    await fixture.states.setInternalState(trashPagesState, pages, false);
    return fixture;
}

describe('lib/templates - text.trash.*', () => {
    describe('read functions', () => {
        const read = (template: TemplateName, val: unknown, options?: unknown): unknown => {
            const code = pageItemTemplates[template].data.enabled.read as string;
            return new Function('val', 'Color', 'language', 'lc', 'options', code)(val, Color, 'de', 0, options);
        };

        it('need nothing but a date, whatever the state holds', () => {
            for (const val of [null, undefined, '', 'text', 5, [], {}, { a: null }, { a: {} }, { a: [] }]) {
                expect(read('text.trash.next', val), JSON.stringify(val)).to.equal(false);
                expect(read('text.trash.afterNext', val, { page: 'a' }), JSON.stringify(val)).to.equal(false);
            }
        });

        it('do not take a member of Object as a page', () => {
            for (const page of ['constructor', '__proto__', 'toString']) {
                expect(read('text.trash.next', { a: [yellow] }, { page }), page).to.equal(false);
            }
        });

        it('accept a number and blanks as page id, blanks only as the first page', () => {
            expect(read('text.trash.next', { a: [], 5: [yellow] }, { page: 5 })).to.equal(true);
            expect(read('text.trash.next', { a: [yellow], b: [] }, { page: '  ' })).to.equal(true);
            expect(read('text.trash.next', { a: [], b: [yellow] }, { page: ' b ' })).to.equal(true);
        });
    });

    describe('payload', () => {
        it('shows the next and the one after next date with icon, color, headline and translated date', async () => {
            const fixture = await runningFixture({ a: [yellow, brown] });
            const next = await buildItem(fixture, 'text.trash.next');
            const afterNext = await buildItem(fixture, 'text.trash.afterNext');
            expect(await next.isEnabled()).to.equal(true);
            expect(await afterNext.isEnabled()).to.equal(true);
            expect(await next.getPageItemPayload()).to.equal(payload(yellow, german.today));
            expect(await afterNext.getPageItemPayload()).to.equal(payload(brown, german.tomorrow));
            expect(fixture.logged).to.deep.equal([]);
        });

        it('shortens a date with a 4 or 2 digit year to day.month, without a dot at the end', async () => {
            for (const text1 of ['24.12.2026', '24.12.26']) {
                const date = { ...yellow, text1 };
                const fixture = await runningFixture({ a: [date] });
                const next = await buildItem(fixture, 'text.trash.next');
                const afterNext = await buildItem(await runningFixture({ a: [brown, date] }), 'text.trash.afterNext');
                expect(await next.getPageItemPayload(), text1).to.equal(payload(date, '24.12'));
                expect(await afterNext.getPageItemPayload(), text1).to.equal(payload(date, '24.12'));
            }
        });

        it('passes on a weekday as the page shows it', async () => {
            for (const text1 of ['Montag', 'Mo']) {
                const day = { ...yellow, text1 };
                const fixture = await runningFixture({ a: [day] });
                const next = await buildItem(fixture, 'text.trash.next');
                expect(await next.getPageItemPayload(), text1).to.equal(payload(day, text1));
            }
        });

        it('touches nothing that is not a complete date', () => {
            const read = (text1: unknown): unknown => {
                const code = pageItemTemplates['text.trash.next'].data.text1.true.read as string;
                return new Function('val', 'Color', 'language', 'lc', 'options', code)(
                    { a: [{ text1 }] },
                    Color,
                    'de',
                    0,
                );
            };
            for (const text1 of ['today', 'tomorrow', '24.12', '24.12.', '24.12.123', 'am 24.12.2026', '1.2.2026']) {
                expect(read(text1), text1).to.equal(text1);
            }
            expect(read(undefined)).to.equal(null);
            expect(read(5)).to.equal(5);
        });

        it('hides the item with too few dates, without a word in the log', async () => {
            const fixture = await runningFixture({ a: [yellow] });
            expect(await (await buildItem(fixture, 'text.trash.next')).isEnabled()).to.equal(true);
            expect(await (await buildItem(fixture, 'text.trash.afterNext')).isEnabled()).to.equal(false);
            expect(fixture.logged).to.deep.equal([]);
        });

        it('hides the item with an empty state and without a trash page', async () => {
            const fixture = setup();
            await fixture.controller.initTrashPagesState();
            const item = await buildItem(fixture, 'text.trash.next');
            expect(await item.isEnabled()).to.equal(false);
            expect(fixture.logged).to.deep.equal([]);
        });

        it('picks the page of the option, the first without it, nothing with an unknown id', async () => {
            const fixture = await runningFixture({ a: [yellow], b: [brown] });
            const first = await buildItem(fixture, 'text.trash.next');
            const second = await buildItem(fixture, 'text.trash.next', { page: 'b' });
            const unknown = await buildItem(fixture, 'text.trash.next', { page: 'x' });
            expect(await first.getPageItemPayload()).to.equal(payload(yellow, german.today));
            expect(await second.getPageItemPayload()).to.equal(payload(brown, german.tomorrow));
            expect(await unknown.isEnabled()).to.equal(false);
            expect(fixture.logged).to.deep.equal([]);
        });

        it('does not fall back to another page when the first page has no dates', async () => {
            const fixture = await runningFixture({ a: [], b: [brown] });
            expect(await (await buildItem(fixture, 'text.trash.next')).isEnabled()).to.equal(false);
        });

        it('leaves the place of the hidden item out of the screensaver', async () => {
            const fixture = await runningFixture({ a: [yellow] });
            const saver = Object.create(Screensaver.prototype);
            Object.defineProperty(saver, 'mode', { value: 'standard' });
            Object.assign(saver, {
                config: { card: 'screensaver', model: 'eu' },
                step: 0,
                pageItems: [
                    await buildItem(fixture, 'text.trash.afterNext'),
                    await buildItem(fixture, 'text.trash.next'),
                ],
            });
            const message = await saver.getData(['bottom']);
            expect(message.options.bottom[0]).to.equal(
                [
                    '',
                    '',
                    Icons.GetIcon(yellow.icon),
                    String(Color.rgb_dec565(yellow.color)),
                    'Abfall',
                    german.today,
                ].join('~'),
            );
            expect(message.options.bottom[1]).to.equal('~~~~~');
        });

        it('a visibility of the user replaces the data item that hides the template', async () => {
            const fixture = await runningFixture({ a: [] });
            const item = await buildItem(fixture, 'text.trash.next', undefined, {
                data: { enabled: { type: 'const', constVal: true } },
            });
            expect(await item.isEnabled()).to.equal(true);
        });
    });

    describe('start order', () => {
        it('a data item without the internal state is dropped: the state has to exist before the panels', async () => {
            const fixture = setup();
            const item = await buildItem(fixture, 'text.trash.next');
            expect((item.dataItems as any).data.enabled).to.equal(undefined);
            expect(fixture.logged.some(l => l.includes(trashPagesState))).to.equal(true);
        });

        it('init creates the state, the first getTrashDaten fills it and triggers the item', async () => {
            const fixture = setup([trashEntry('a', 'ical.0.table')]);
            fixture.foreign['ical.0.table'] = [
                { _date: dateIn(0), event: 'Gelb' },
                { _date: dateIn(1), event: 'Bio' },
            ];
            await fixture.controller.initTrashPagesState();
            const item = await buildItem(fixture, 'text.trash.next');
            expect(await item.isEnabled()).to.equal(false);

            // PageItem.init activates the triggers of a screensaver item, also while it is hidden; the hidden
            // item has no payload yet, so the trigger goes through the item (triggerParent false) to the saver
            const updates: unknown[] = [];
            const parent = (item as any).parent;
            parent.basePanel.screenSaver = parent;
            parent.onStateTrigger = async (_id: string, from: unknown): Promise<void> => void updates.push(from);
            (item as any).onStateTriggerSuperDoNotOverride = (dp: string, from: unknown): Promise<void> =>
                (item as any).onStateTrigger(dp, from);
            await fixture.states.activateTrigger(item);

            await fixture.controller.getTrashDaten(true);
            expect(fixture.logged).to.deep.equal([]);
            expect(updates).to.deep.equal([item]);
            expect(await item.isEnabled()).to.equal(true);
            expect((await item.getPageItemPayload()).split('~').slice(4)).to.deep.equal(['Abfall', german.today]);
            expect(fixture.logged).to.deep.equal([]);
        });
    });

    describe('getTrashDaten', () => {
        const map = async (fixture: Fixture): Promise<Record<string, Message[]>> =>
            (await fixture.states.getState(trashPagesState))?.val as unknown as Record<string, Message[]>;

        it('keeps the pages in the order of the configuration, also when the first one fails at the start', async () => {
            const fixture = setup([trashEntry('a', 'ical.0.a'), trashEntry('b', 'ical.0.b')]);
            fixture.foreign['ical.0.b'] = [{ _date: dateIn(1), event: 'Bio' }];
            await fixture.controller.initTrashPagesState();
            await fixture.controller.getTrashDaten(true);
            const pages = await map(fixture);
            expect(Object.keys(pages)).to.deep.equal(['a', 'b']);
            expect(pages.a).to.deep.equal([]);
            expect(pages.b.map(m => m.text1)).to.deep.equal(['tomorrow']);
        });

        it('keeps the last dates of a failing source and updates the other page', async () => {
            const fixture = setup([trashEntry('a', 'ical.0.a'), trashEntry('b', 'ical.0.b')]);
            fixture.foreign['ical.0.a'] = [{ _date: dateIn(0), event: 'Gelb' }];
            fixture.foreign['ical.0.b'] = [{ _date: dateIn(0), event: 'Bio' }];
            await fixture.controller.initTrashPagesState();
            await fixture.controller.getTrashDaten(true);

            fixture.foreign['ical.0.a'] = 'no json';
            fixture.foreign['ical.0.b'] = [{ _date: dateIn(1), event: 'Bio' }];
            await fixture.controller.getTrashDaten();
            const pages = await map(fixture);
            expect(pages.a.map(m => m.text1)).to.deep.equal(['today']);
            expect(pages.b.map(m => m.text1)).to.deep.equal(['tomorrow']);
        });

        it('leaves the state of the single page as it was', async () => {
            const fixture = setup([trashEntry('a', 'ical.0.a')]);
            fixture.foreign['ical.0.a'] = [{ _date: dateIn(0), event: 'Gelb' }];
            await fixture.controller.initTrashPagesState();
            await fixture.controller.getTrashDaten(true);
            const single = (await fixture.states.getState('///pageTrash_a'))?.val as unknown as Message[];
            expect(single.map(m => m.text)).to.deep.equal(['Gelb']);
        });

        it('writes a new object each time, the same one would not trigger', async () => {
            const fixture = setup([trashEntry('a', 'ical.0.a')]);
            fixture.foreign['ical.0.a'] = [{ _date: dateIn(0), event: 'Gelb' }];
            await fixture.controller.initTrashPagesState();
            await fixture.controller.getTrashDaten(true);
            const before = await map(fixture);
            await fixture.controller.getTrashDaten();
            expect(await map(fixture)).to.not.equal(before);
        });
    });

    describe('daily update at 00:01', () => {
        it('plans the next run with the adapter timer, at a time up to one day ahead', () => {
            const fixture = setup();
            fixture.controller.scheduleTrashRefresh();
            expect(fixture.timers).to.have.length(1);
            expect(fixture.timers[0].delay).to.be.greaterThan(0);
            expect(fixture.timers[0].delay).to.be.at.most(25 * 3_600_000);
        });

        it('runs getTrashDaten without init and plans the next run', async () => {
            const fixture = setup();
            const calls: unknown[][] = [];
            fixture.controller.getTrashDaten = async (...args: unknown[]): Promise<void> => void calls.push(args);
            fixture.controller.scheduleTrashRefresh();
            await fixture.timers[0].fn();
            expect(calls).to.deep.equal([[]]);
            expect(fixture.timers).to.have.length(2);
        });

        it('plans the next run although getTrashDaten fails', async () => {
            const fixture = setup();
            fixture.controller.getTrashDaten = async (): Promise<void> => {
                throw new Error('boom');
            };
            fixture.controller.scheduleTrashRefresh();
            await fixture.timers[0].fn();
            expect(fixture.timers).to.have.length(2);
            expect(fixture.logged.some(l => l.includes('boom'))).to.equal(true);
        });

        it('plans nothing after the unload, also when a run ends during the unload', async () => {
            const fixture = setup();
            fixture.controller.getTrashDaten = async (): Promise<void> => {
                fixture.controller.unload = true;
            };
            fixture.controller.scheduleTrashRefresh();
            await fixture.timers[0].fn();
            expect(fixture.timers).to.have.length(1);
            fixture.controller.scheduleTrashRefresh();
            expect(fixture.timers).to.have.length(1);
        });

        it('clears the timer in delete', async () => {
            const fixture = setup();
            fixture.controller.scheduleTrashRefresh();
            fixture.controller.statesControler = undefined;
            Object.assign(fixture.controller, { panels: [], systemNotification: undefined });
            await fixture.controller.delete().catch(() => undefined);
            expect(fixture.timers[0].cleared).to.equal(true);
        });
    });
});
