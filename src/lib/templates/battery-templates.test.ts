/**
 * The battery templates on the real parts: template merge, search of the states below the object (mode auto),
 * StatesControler, Dataitem and PageItem. Only the adapter and the panel are replaced.
 *
 * `text.battery.channel` (alias channel `battery`): icon by charge level, flash and color by the power.
 * `text.battery` and `text.battery.bydhvs` must keep their payloads - their expected colors are fixed numbers,
 * recorded before the role `battery.power` existed.
 */
import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { Page } from '../classes/Page';
import { Color, type RGB } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getBatteryPowerColor } from '../const/tools';
import { StatesControler } from '../controller/states-controller';
import { PageItem } from '../pages/pageItem';
import { BATTERY_CHARGING_ICON_READ, BATTERY_ICON_READ } from './text';

const german = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../admin/i18n/de/translations.json'), 'utf8'),
) as Record<string, string>;

const NEUTRAL: RGB = { r: 10, g: 120, b: 230 };
const CHANNEL = 'alias.0.Akku';

type States = Record<string, unknown>;
type Objects = Record<string, ioBroker.Object>;

function stateObject(id: string, role: string, type: ioBroker.CommonType = 'number'): ioBroker.Object {
    return { _id: id, type: 'state', common: { name: id, role, type, read: true, write: false }, native: {} };
}

/**
 * the objects of a battery channel
 *
 * @param withPower the channel has the optional state POWER
 */
function channelObjects(withPower: boolean): Objects {
    const objects: Objects = {
        [CHANNEL]: { _id: CHANNEL, type: 'channel', common: { name: 'Akku', role: 'battery' }, native: {} },
        [`${CHANNEL}.ACTUAL`]: stateObject(`${CHANNEL}.ACTUAL`, 'value.battery'),
    };
    if (withPower) {
        objects[`${CHANNEL}.POWER`] = stateObject(`${CHANNEL}.POWER`, 'value.power');
    }
    return objects;
}

function resetObjectCache(): void {
    StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
    StatesControler.tempObjectDBTimeout = undefined;
}

/**
 * Builds the page item of a template like Page.init does and returns its payload.
 *
 * @param options the page item (template, dpInit and what a config overrides)
 * @param objects object database
 * @param states state values, a missing id has no value
 * @param card card of the page
 * @returns the payload and what was logged as warning or error
 */
async function payloadOf(
    options: Record<string, unknown>,
    objects: Objects,
    states: States,
    card = 'screensaver2',
): Promise<{ fields: string[]; logged: string[] }> {
    resetObjectCache();
    const logged: string[] = [];
    const noop = (): void => undefined;
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
        config: {},
        setInterval: (): undefined => undefined,
        clearInterval: noop,
        setTimeout: (): undefined => undefined,
        clearTimeout: noop,
        delay: async (): Promise<void> => undefined,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> => objects[id] ?? null,
        getForeignObjectsAsync: async (): Promise<Objects> => structuredClone(objects),
        getEnumsAsync: async (): Promise<Record<string, Record<string, never>>> => ({
            'enum.rooms': {},
            'enum.functions': {},
        }),
        getForeignStateAsync: async (id: string): Promise<unknown> =>
            id in states ? { val: states[id], ack: true, ts: 1, lc: 1, from: '' } : null,
    };
    const statesControler = new StatesControler(adapter);
    adapter.controller = { statesControler };
    const merged: any = await Page.prototype.getItemFromTemplate.call(
        // a template with a base template calls itself
        { log: adapter.log, dpInit: '', getItemFromTemplate: Page.prototype.getItemFromTemplate },
        structuredClone(options) as any,
    );
    merged.data = await statesControler.getDataItemsFromAuto(merged.dpInit, merged.data);
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: '0?4',
        name: String(options.template),
        log: adapter.log,
        adapter,
        library: adapter.library,
        config: merged,
        basePanel: { name: 'panel' },
        clockSourceListeners: new Set(),
        parent: { card, isScreensaver: card.startsWith('screensaver'), basePanel: { isOnline: true } },
        timeouts: {},
    });
    const data = await statesControler.createDataItems(merged.data, item, {}, 'data', merged.readOptions);
    Object.assign(item, { dataItems: { ...merged, data } });
    const fields = (await item.getPageItemPayload()).split('~');
    resetObjectCache();
    return { fields, logged };
}

/**
 * payload of the template `text.battery.channel` below the channel
 *
 * @param soc value of ACTUAL
 * @param power value of POWER; undefined: the channel has no state POWER
 * @param extra what a config adds to the page item
 * @param card card of the page
 */
async function channelPayload(
    soc: unknown,
    power?: unknown,
    extra: Record<string, unknown> = {},
    card?: string,
): Promise<string[]> {
    const states: States = { [`${CHANNEL}.ACTUAL`]: soc };
    if (power !== undefined) {
        states[`${CHANNEL}.POWER`] = power;
    }
    const { fields, logged } = await payloadOf(
        { template: 'text.battery.channel', dpInit: CHANNEL, ...extra },
        channelObjects(power !== undefined),
        states,
        card,
    );
    expect(logged, 'log').to.deep.equal([]);
    return fields;
}

/** one case of the templates that existed before: what is set and the payload fields icon name, color, text, value */
type LegacyCase = [
    template: 'text.battery' | 'text.battery.bydhvs',
    soc: number,
    /** text.battery: value of a constant entity3 of the config, null without; bydhvs: value of State.Power */
    third: boolean | number | null,
    readOptions: Record<string, number> | null,
    expected: [iconName: string, color: string, text: string, value: string],
];

/**
 * payload fields 2 to 5 of a case of {@link LegacyCase}
 *
 * @param template the template
 * @param soc charge level
 * @param third see {@link LegacyCase}
 * @param readOptions options of the template
 */
async function legacyPayload(
    template: LegacyCase[0],
    soc: number,
    third: LegacyCase[2],
    readOptions: LegacyCase[3],
): Promise<string[]> {
    if (template === 'text.battery') {
        const id = 'zigbee.0.sensor.battery';
        const { fields, logged } = await payloadOf(
            {
                template,
                dpInit: 'zigbee.0.sensor',
                ...(third === null ? {} : { data: { entity3: { value: { type: 'const', constVal: third } } } }),
            },
            { [id]: stateObject(id, 'value.battery') },
            { [id]: soc },
        );
        expect(logged, 'log').to.deep.equal([]);
        return fields.slice(2);
    }
    const socId = 'bydhvs.0.State.SOC';
    const powerId = 'bydhvs.0.State.Power';
    const { fields, logged } = await payloadOf(
        { template, dpInit: 'bydhvs.0', ...(readOptions ? { readOptions } : {}) },
        { [socId]: stateObject(socId, 'value.battery'), [powerId]: stateObject(powerId, 'value.power') },
        { [socId]: soc, [powerId]: third },
    );
    expect(logged, 'log').to.deep.equal([]);
    return fields.slice(2);
}

/** payloads of `text.battery` and `text.battery.bydhvs`, recorded before the role `battery.power` existed */
const LEGACY: LegacyCase[] = [
    ['text.battery', 0, null, null, ['battery-outline', '63488', 'Batterie', '0%']],
    ['text.battery', 0, true, null, ['battery-charging-outline', '63488', 'Batterie', '0%']],
    ['text.battery', 0, false, null, ['battery-outline', '63488', 'Batterie', '0%']],
    ['text.battery', 0, -500, null, ['battery-charging-outline', '63488', 'Batterie', '0%']],
    ['text.battery', 0, 0, null, ['battery-outline', '63488', 'Batterie', '0%']],
    ['text.battery', 5, null, null, ['battery-10', '63488', 'Batterie', '5%']],
    ['text.battery', 5, true, null, ['battery-charging-10', '63488', 'Batterie', '5%']],
    ['text.battery', 5, false, null, ['battery-10', '63488', 'Batterie', '5%']],
    ['text.battery', 5, -500, null, ['battery-charging-10', '63488', 'Batterie', '5%']],
    ['text.battery', 5, 0, null, ['battery-10', '63488', 'Batterie', '5%']],
    ['text.battery', 10, null, null, ['battery-10', '63488', 'Batterie', '10%']],
    ['text.battery', 10, true, null, ['battery-charging-10', '63488', 'Batterie', '10%']],
    ['text.battery', 10, false, null, ['battery-10', '63488', 'Batterie', '10%']],
    ['text.battery', 10, -500, null, ['battery-charging-10', '63488', 'Batterie', '10%']],
    ['text.battery', 10, 0, null, ['battery-10', '63488', 'Batterie', '10%']],
    ['text.battery', 30, null, null, ['battery-30', '17888', 'Batterie', '30%']],
    ['text.battery', 30, true, null, ['battery-charging-30', '17888', 'Batterie', '30%']],
    ['text.battery', 30, false, null, ['battery-30', '17888', 'Batterie', '30%']],
    ['text.battery', 30, -500, null, ['battery-charging-30', '17888', 'Batterie', '30%']],
    ['text.battery', 30, 0, null, ['battery-30', '17888', 'Batterie', '30%']],
    ['text.battery', 50, null, null, ['battery-50', '2016', 'Batterie', '50%']],
    ['text.battery', 50, true, null, ['battery-charging-50', '2016', 'Batterie', '50%']],
    ['text.battery', 50, false, null, ['battery-50', '2016', 'Batterie', '50%']],
    ['text.battery', 50, -500, null, ['battery-charging-50', '2016', 'Batterie', '50%']],
    ['text.battery', 50, 0, null, ['battery-50', '2016', 'Batterie', '50%']],
    ['text.battery', 54, null, null, ['battery-50', '2016', 'Batterie', '54%']],
    ['text.battery', 54, true, null, ['battery-charging-50', '2016', 'Batterie', '54%']],
    ['text.battery', 54, false, null, ['battery-50', '2016', 'Batterie', '54%']],
    ['text.battery', 54, -500, null, ['battery-charging-50', '2016', 'Batterie', '54%']],
    ['text.battery', 54, 0, null, ['battery-50', '2016', 'Batterie', '54%']],
    ['text.battery', 100, null, null, ['battery', '2016', 'Batterie', '100%']],
    ['text.battery', 100, true, null, ['battery-charging', '2016', 'Batterie', '100%']],
    ['text.battery', 100, false, null, ['battery', '2016', 'Batterie', '100%']],
    ['text.battery', 100, -500, null, ['battery-charging', '2016', 'Batterie', '100%']],
    ['text.battery', 100, 0, null, ['battery', '2016', 'Batterie', '100%']],
    ['text.battery.bydhvs', 0, -1200, null, ['battery-charging-outline', '63488', 'Batterie', '0%']],
    ['text.battery.bydhvs', 0, 0, null, ['battery-outline', '63488', 'Batterie', '0%']],
    ['text.battery.bydhvs', 0, 900, null, ['battery-outline', '63488', 'Batterie', '0%']],
    ['text.battery.bydhvs', 30, -1200, null, ['battery-charging-30', '17888', 'Batterie', '30%']],
    ['text.battery.bydhvs', 30, 0, null, ['battery-30', '17888', 'Batterie', '30%']],
    ['text.battery.bydhvs', 30, 900, null, ['battery-30', '17888', 'Batterie', '30%']],
    ['text.battery.bydhvs', 54, -1200, null, ['battery-charging-50', '2016', 'Batterie', '54%']],
    ['text.battery.bydhvs', 54, 0, null, ['battery-50', '2016', 'Batterie', '54%']],
    ['text.battery.bydhvs', 54, 900, null, ['battery-50', '2016', 'Batterie', '54%']],
    ['text.battery.bydhvs', 100, -1200, null, ['battery-charging', '2016', 'Batterie', '100%']],
    ['text.battery.bydhvs', 100, 0, null, ['battery', '2016', 'Batterie', '100%']],
    ['text.battery.bydhvs', 100, 900, null, ['battery', '2016', 'Batterie', '100%']],
    ['text.battery.bydhvs', 0, -1200, { min: 10, max: 90 }, ['battery-charging-outline', '63488', 'Batterie', '0%']],
    ['text.battery.bydhvs', 0, 0, { min: 10, max: 90 }, ['battery-outline', '63488', 'Batterie', '0%']],
    ['text.battery.bydhvs', 0, 900, { min: 10, max: 90 }, ['battery-outline', '63488', 'Batterie', '0%']],
    ['text.battery.bydhvs', 30, -1200, { min: 10, max: 90 }, ['battery-charging-30', '17888', 'Batterie', '25%']],
    ['text.battery.bydhvs', 30, 0, { min: 10, max: 90 }, ['battery-30', '17888', 'Batterie', '25%']],
    ['text.battery.bydhvs', 30, 900, { min: 10, max: 90 }, ['battery-30', '17888', 'Batterie', '25%']],
    ['text.battery.bydhvs', 54, -1200, { min: 10, max: 90 }, ['battery-charging-60', '2016', 'Batterie', '55%']],
    ['text.battery.bydhvs', 54, 0, { min: 10, max: 90 }, ['battery-60', '2016', 'Batterie', '55%']],
    ['text.battery.bydhvs', 54, 900, { min: 10, max: 90 }, ['battery-60', '2016', 'Batterie', '55%']],
    ['text.battery.bydhvs', 100, -1200, { min: 10, max: 90 }, ['battery-charging', '2016', 'Batterie', '100%']],
    ['text.battery.bydhvs', 100, 0, { min: 10, max: 90 }, ['battery', '2016', 'Batterie', '100%']],
    ['text.battery.bydhvs', 100, 900, { min: 10, max: 90 }, ['battery', '2016', 'Batterie', '100%']],
];

const icon = (name: string): string => Icons.GetIcon(name);
const color = (c: RGB): string => String(Color.rgb_dec565(c));

describe('lib/templates - battery', () => {
    let neutralBefore: RGB | string;
    before(() => {
        // the theme of the adapter replaces the placeholder at the start
        neutralBefore = Color.neutral;
        Color.neutral = NEUTRAL;
    });
    after(() => {
        Color.neutral = neutralBefore;
        resetObjectCache();
    });

    describe('read functions of the icon', () => {
        const read = (code: string, val: unknown): unknown => new Function('val', code)(val);

        it('follow the charge level in steps of ten', () => {
            const steps: [number, string][] = [
                [0, 'outline'],
                [4, 'outline'],
                [5, '10'],
                [14, '10'],
                [15, '20'],
                [50, '50'],
                [54, '50'],
                [55, '60'],
                [94, '90'],
                [95, ''],
                [100, ''],
            ];
            for (const [soc, step] of steps) {
                const suffix = step ? `-${step}` : '';
                expect(read(BATTERY_ICON_READ, soc), `${soc}`).to.equal(`battery${suffix}`);
                expect(read(BATTERY_CHARGING_ICON_READ, soc), `${soc} charging`).to.equal(`battery-charging${suffix}`);
            }
        });

        it('name icons the panel knows', () => {
            for (let soc = 0; soc <= 100; soc += 10) {
                for (const code of [BATTERY_ICON_READ, BATTERY_CHARGING_ICON_READ]) {
                    const name = String(read(code, soc));
                    expect(Icons.GetIcon(name), name).to.have.lengthOf(1);
                }
            }
        });
    });

    describe('text.battery.channel (alias channel battery)', () => {
        it('charging (power below 0): icon with flash by charge level, green', async () => {
            for (const [soc, name] of [
                [0, 'battery-charging-outline'],
                [50, 'battery-charging-50'],
                [100, 'battery-charging'],
            ] as const) {
                const fields = await channelPayload(soc, -1500);
                expect(fields, `${soc}`).to.deep.equal([
                    'text',
                    '0?4',
                    icon(name),
                    color(Color.Green),
                    german.Battery,
                    `${soc}%`,
                ]);
            }
        });

        it('discharging (power above 0): icon without flash by charge level, red', async () => {
            for (const [soc, name] of [
                [0, 'battery-outline'],
                [50, 'battery-50'],
                [100, 'battery'],
            ] as const) {
                const fields = await channelPayload(soc, 800);
                expect(fields, `${soc}`).to.deep.equal([
                    'text',
                    '0?4',
                    icon(name),
                    color(Color.Red),
                    german.Battery,
                    `${soc}%`,
                ]);
            }
        });

        it('power exactly 0: icon without flash, neutral color', async () => {
            for (const [soc, name] of [
                [0, 'battery-outline'],
                [50, 'battery-50'],
                [100, 'battery'],
            ] as const) {
                const fields = await channelPayload(soc, 0);
                expect(fields.slice(2, 4), `${soc}`).to.deep.equal([icon(name), color(NEUTRAL)]);
                expect(fields[5]).to.equal(`${soc}%`);
            }
        });

        it('no state POWER: icon without flash, neutral color', async () => {
            const fields = await channelPayload(50);
            expect(fields).to.deep.equal(['text', '0?4', icon('battery-50'), color(NEUTRAL), german.Battery, '50%']);
        });

        it('POWER without a value: icon without flash, neutral color', async () => {
            const fields = await channelPayload(50, null);
            expect(fields.slice(2, 4)).to.deep.equal([icon('battery-50'), color(NEUTRAL)]);
        });

        it('has no threshold around 0', async () => {
            expect((await channelPayload(50, -0.01)).slice(2, 4)).to.deep.equal([
                icon('battery-charging-50'),
                color(Color.Green),
            ]);
            expect((await channelPayload(50, 0.01)).slice(2, 4)).to.deep.equal([icon('battery-50'), color(Color.Red)]);
        });

        it('the color does not follow the charge level', async () => {
            for (const soc of [0, 5, 30, 100]) {
                expect((await channelPayload(soc, -1))[3], `${soc} charging`).to.equal(color(Color.Green));
                expect((await channelPayload(soc, 1))[3], `${soc} discharging`).to.equal(color(Color.Red));
                expect((await channelPayload(soc, 0))[3], `${soc} idle`).to.equal(color(NEUTRAL));
            }
        });

        it('shows the charge level in percent as the value', async () => {
            expect((await channelPayload(0, 0))[5]).to.equal('0%');
            expect((await channelPayload(54, 0))[5]).to.equal('54%');
            expect((await channelPayload(100, 0))[5]).to.equal('100%');
        });

        it('takes own colors for charging and discharging, neutral stays', async () => {
            const own = {
                color: {
                    true: { type: 'const', constVal: { r: 0, g: 0, b: 255 } },
                    false: { type: 'const', constVal: { r: 255, g: 255, b: 0 } },
                },
            };
            expect((await channelPayload(50, -1, own))[3]).to.equal(color({ r: 0, g: 0, b: 255 }));
            expect((await channelPayload(50, 1, own))[3]).to.equal(color({ r: 255, g: 255, b: 0 }));
            expect((await channelPayload(50, 0, own))[3]).to.equal(color(NEUTRAL));
            expect((await channelPayload(50, undefined, own))[3]).to.equal(color(NEUTRAL));
        });

        it('as a button (navigation item) keeps icon and color', async () => {
            const navi = { type: 'button', data: { setNavi: { type: 'const', constVal: 'main' } } };
            for (const card of ['cardGrid', 'cardEntities']) {
                const charging = await channelPayload(50, -1, navi, card);
                expect(charging.slice(0, 4), card).to.deep.equal([
                    'button',
                    '0?4',
                    icon('battery-charging-50'),
                    color(Color.Green),
                ]);
                expect((await channelPayload(50, 1, navi, card)).slice(2, 4), card).to.deep.equal([
                    icon('battery-50'),
                    color(Color.Red),
                ]);
                expect((await channelPayload(50, 0, navi, card)).slice(2, 4), card).to.deep.equal([
                    icon('battery-50'),
                    color(NEUTRAL),
                ]);
            }
        });

        it('on a card page: same icon, color and value as on the screensaver', async () => {
            for (const card of ['cardGrid', 'cardEntities']) {
                expect(await channelPayload(50, -1, {}, card), card).to.deep.equal(await channelPayload(50, -1));
                expect(await channelPayload(50, 0, {}, card), card).to.deep.equal(await channelPayload(50, 0));
            }
        });
    });

    describe('getBatteryPowerColor without configured colors', () => {
        it('falls back to the neutral color of the theme, whatever the power', async () => {
            for (const power of [-1, 0, 1, null]) {
                expect(await getBatteryPowerColor(undefined, power), String(power)).to.equal(color(NEUTRAL));
                expect(await getBatteryPowerColor({}, power), String(power)).to.equal(color(NEUTRAL));
            }
        });
    });

    describe('text.battery and text.battery.bydhvs stay as they were', () => {
        it('covers both templates, with and without charging, with and without options', () => {
            expect(LEGACY.filter(c => c[0] === 'text.battery')).to.have.length(35);
            expect(LEGACY.filter(c => c[0] === 'text.battery.bydhvs')).to.have.length(24);
            expect(LEGACY.some(c => c[4][0].startsWith('battery-charging'))).to.equal(true);
            expect(LEGACY.some(c => c[3] !== null)).to.equal(true);
        });

        for (const [template, soc, third, readOptions, expected] of LEGACY) {
            const label = `${template} ${soc} % / ${String(third)}${readOptions ? ` / ${JSON.stringify(readOptions)}` : ''}`;
            it(label, async () => {
                const [iconName, ...rest] = expected;
                expect(await legacyPayload(template, soc, third, readOptions)).to.deep.equal([icon(iconName), ...rest]);
            });
        }
    });
});
