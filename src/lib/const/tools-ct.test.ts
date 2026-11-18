import { expect } from 'chai';
import { getSliderCTFromValue, setSliderCTFromValue } from './tools';

/**
 * Colour temperature slider of popupLight: slider 0 = cold, 100 = warm.
 * kelvin: high value = cold, mired: high value = warm.
 * Range: minScale/maxScale of the item when both are numbers, else common.min/max of the state, else
 * 2200-6500 K / 153-500 mired. Results are limited to 0..100 and min..max.
 */

type CtItem = Parameters<typeof getSliderCTFromValue>[0];

interface CtOptions {
    /** value of the state, null = state without value */
    value?: number | null;
    /** undefined = item without mode */
    mode?: string;
    common?: { min: number; max: number };
    /** minScale/maxScale, null = they return null */
    scale?: { min: number | null; max: number | null };
    /** item without value data item */
    noValue?: boolean;
}

/**
 * Slim stand-in for the ct item: the value data item (getNumber/setState/common), mode and scale
 * (getString/getNumber).
 *
 * @param opts how the item looks
 */
function ctItem(opts: CtOptions): { item: CtItem; written: (number | undefined)[] } {
    const written: (number | undefined)[] = [];
    let stored = opts.value;
    const value = {
        common: opts.common ? { min: opts.common.min, max: opts.common.max } : {},
        getNumber: async (): Promise<number | null> => stored ?? null,
        setState: async (v: number): Promise<void> => {
            stored = v;
            written.push(v);
        },
    };
    const num = (n: number | null): unknown => ({ getNumber: async (): Promise<number | null> => n });
    const item = {
        value: opts.noValue ? undefined : value,
        mode: opts.mode === undefined ? undefined : { getString: async (): Promise<string | undefined> => opts.mode },
        minScale: opts.scale ? num(opts.scale.min) : undefined,
        maxScale: opts.scale ? num(opts.scale.max) : undefined,
    };
    return { item: item as unknown as CtItem, written };
}

async function get(opts: CtOptions): Promise<string | null> {
    return getSliderCTFromValue(ctItem(opts).item);
}

async function set(opts: CtOptions, slider: number): Promise<(number | undefined)[]> {
    const { item, written } = ctItem(opts);
    await setSliderCTFromValue(item, slider);
    return written;
}

/** all branches: state value at slider 0 (cold), 50 and 100 (warm) */
const BRANCHES: { name: string; opts: CtOptions; cold: number; mid: number; warm: number }[] = [
    { name: 'default, kelvin', opts: { mode: 'kelvin' }, cold: 6500, mid: 4350, warm: 2200 },
    { name: 'default, without mode (kelvin)', opts: {}, cold: 6500, mid: 4350, warm: 2200 },
    // 326.5 is rounded up
    { name: 'default, mired', opts: { mode: 'mired' }, cold: 153, mid: 327, warm: 500 },
    {
        name: 'minScale/maxScale, kelvin',
        opts: { mode: 'kelvin', scale: { min: 2000, max: 6000 } },
        cold: 6000,
        mid: 4000,
        warm: 2000,
    },
    {
        name: 'minScale/maxScale, without mode (kelvin)',
        opts: { scale: { min: 2000, max: 6000 } },
        cold: 6000,
        mid: 4000,
        warm: 2000,
    },
    {
        name: 'minScale/maxScale, mired',
        opts: { mode: 'mired', scale: { min: 150, max: 550 } },
        cold: 150,
        mid: 350,
        warm: 550,
    },
    {
        name: 'common min/max, kelvin',
        opts: { mode: 'kelvin', common: { min: 2000, max: 6000 } },
        cold: 6000,
        mid: 4000,
        warm: 2000,
    },
    {
        name: 'common min/max, without mode (kelvin)',
        opts: { common: { min: 2000, max: 6000 } },
        cold: 6000,
        mid: 4000,
        warm: 2000,
    },
    {
        name: 'common min/max, mired',
        opts: { mode: 'mired', common: { min: 150, max: 550 } },
        cold: 150,
        mid: 350,
        warm: 550,
    },
];

describe('lib/const/tools colour temperature slider', () => {
    describe('getSliderCTFromValue', () => {
        for (const b of BRANCHES) {
            it(`${b.name}: cold is 0, warm is 100, the middle 50`, async () => {
                expect(await get({ ...b.opts, value: b.cold })).to.equal('0');
                expect(await get({ ...b.opts, value: b.warm })).to.equal('100');
                expect(await get({ ...b.opts, value: b.mid })).to.equal('50');
            });
        }

        it('default kelvin: 6500 K is 0, 2200 K is 100, 3275 K is 75', async () => {
            expect(await get({ mode: 'kelvin', value: 6500 })).to.equal('0');
            expect(await get({ mode: 'kelvin', value: 2200 })).to.equal('100');
            expect(await get({ mode: 'kelvin', value: 3275 })).to.equal('75');
        });

        it('default mired: 153 is 0, 500 is 100, 240 is 25', async () => {
            expect(await get({ mode: 'mired', value: 153 })).to.equal('0');
            expect(await get({ mode: 'mired', value: 500 })).to.equal('100');
            expect(await get({ mode: 'mired', value: 240 })).to.equal('25');
        });

        it('minScale/maxScale win over common min/max', async () => {
            const opts = { mode: 'kelvin', scale: { min: 2000, max: 6000 }, common: { min: 1000, max: 10_000 } };
            expect(await get({ ...opts, value: 6000 })).to.equal('0');
            expect(await get({ ...opts, value: 2000 })).to.equal('100');
        });

        it('without item: null', async () => {
            expect(await getSliderCTFromValue(undefined)).to.equal(null);
        });

        it('value null or no value item: null', async () => {
            expect(await get({ mode: 'kelvin', value: null })).to.equal(null);
            expect(await get({ mode: 'kelvin', value: undefined })).to.equal(null);
            expect(await get({ mode: 'kelvin', noValue: true })).to.equal(null);
        });

        it('minScale/maxScale return null: common min/max of the state', async () => {
            const common = { min: 2000, max: 6000 };
            expect(await get({ mode: 'kelvin', value: 6000, common, scale: { min: null, max: 9000 } })).to.equal('0');
            expect(await get({ mode: 'kelvin', value: 2000, common, scale: { min: 1000, max: null } })).to.equal('100');
            expect(await get({ mode: 'kelvin', value: 3000, common, scale: { min: null, max: null } })).to.equal('75');
            const mired = { min: 150, max: 550 };
            expect(await get({ mode: 'mired', value: 150, common: mired, scale: { min: null, max: 9 } })).to.equal('0');
            expect(await get({ mode: 'mired', value: 550, common: mired, scale: { min: 9, max: null } })).to.equal(
                '100',
            );
            expect(await get({ mode: 'mired', value: 250, common: mired, scale: { min: null, max: null } })).to.equal(
                '25',
            );
        });

        it('minScale/maxScale return null and no common min/max: defaults', async () => {
            const scale = { min: null, max: 6000 };
            expect(await get({ mode: 'kelvin', value: 6500, scale })).to.equal('0');
            expect(await get({ mode: 'kelvin', value: 2200, scale })).to.equal('100');
            expect(await get({ mode: 'kelvin', value: 4350, scale })).to.equal('50');
            expect(await get({ mode: 'mired', value: 153, scale })).to.equal('0');
            expect(await get({ mode: 'mired', value: 500, scale })).to.equal('100');
            expect(await get({ mode: 'mired', value: 240, scale })).to.equal('25');
        });

        it('values outside the range are limited to 0..100', async () => {
            expect(await get({ mode: 'kelvin', value: 7000 })).to.equal('0');
            expect(await get({ mode: 'kelvin', value: 1800 })).to.equal('100');
            expect(await get({ mode: 'mired', value: 100 })).to.equal('0');
            expect(await get({ mode: 'mired', value: 600 })).to.equal('100');
            const scale = { min: 2000, max: 6000 };
            expect(await get({ mode: 'kelvin', value: 6100, scale })).to.equal('0');
            expect(await get({ mode: 'kelvin', value: 1900, scale })).to.equal('100');
            const common = { min: 150, max: 550 };
            expect(await get({ mode: 'mired', value: 140, common })).to.equal('0');
            expect(await get({ mode: 'mired', value: 560, common })).to.equal('100');
        });

        it('min equal to max: null instead of NaN', async () => {
            expect(await get({ mode: 'kelvin', value: 4000, common: { min: 4000, max: 4000 } })).to.equal(null);
        });
    });

    describe('setSliderCTFromValue', () => {
        for (const b of BRANCHES) {
            it(`${b.name}: 0 writes cold, 100 warm, 50 the middle`, async () => {
                expect(await set(b.opts, 0)).to.deep.equal([b.cold]);
                expect(await set(b.opts, 100)).to.deep.equal([b.warm]);
                expect(await set(b.opts, 50)).to.deep.equal([b.mid]);
            });
        }

        it('default kelvin: 0 writes 6500 K, 100 writes 2200 K, 25 writes 5425 K', async () => {
            expect(await set({ mode: 'kelvin' }, 0)).to.deep.equal([6500]);
            expect(await set({ mode: 'kelvin' }, 100)).to.deep.equal([2200]);
            expect(await set({ mode: 'kelvin' }, 25)).to.deep.equal([5425]);
        });

        it('default mired: 0 writes 153, 100 writes 500, 25 writes 240', async () => {
            expect(await set({ mode: 'mired' }, 0)).to.deep.equal([153]);
            expect(await set({ mode: 'mired' }, 100)).to.deep.equal([500]);
            expect(await set({ mode: 'mired' }, 25)).to.deep.equal([240]);
        });

        it('minScale/maxScale win over common min/max', async () => {
            const opts = { mode: 'kelvin', scale: { min: 2000, max: 6000 }, common: { min: 1000, max: 10_000 } };
            expect(await set(opts, 0)).to.deep.equal([6000]);
            expect(await set(opts, 100)).to.deep.equal([2000]);
        });

        it('without item or without value item: nothing is written', async () => {
            await setSliderCTFromValue(undefined, 50);
            expect(await set({ mode: 'kelvin', noValue: true }, 50)).to.deep.equal([]);
        });

        it('minScale/maxScale return null: common min/max of the state', async () => {
            const common = { min: 2000, max: 6000 };
            expect(await set({ mode: 'kelvin', common, scale: { min: null, max: 9000 } }, 0)).to.deep.equal([6000]);
            expect(await set({ mode: 'kelvin', common, scale: { min: 1000, max: null } }, 100)).to.deep.equal([2000]);
            expect(await set({ mode: 'kelvin', common, scale: { min: null, max: null } }, 75)).to.deep.equal([3000]);
            const mired = { min: 150, max: 550 };
            expect(await set({ mode: 'mired', common: mired, scale: { min: null, max: 9 } }, 0)).to.deep.equal([150]);
            expect(await set({ mode: 'mired', common: mired, scale: { min: 9, max: null } }, 100)).to.deep.equal([550]);
            expect(await set({ mode: 'mired', common: mired, scale: { min: null, max: null } }, 25)).to.deep.equal([
                250,
            ]);
        });

        it('minScale/maxScale return null and no common min/max: defaults', async () => {
            const scale = { min: 150, max: null };
            expect(await set({ mode: 'kelvin', scale }, 0)).to.deep.equal([6500]);
            expect(await set({ mode: 'kelvin', scale }, 100)).to.deep.equal([2200]);
            expect(await set({ mode: 'kelvin', scale }, 50)).to.deep.equal([4350]);
            expect(await set({ mode: 'mired', scale }, 0)).to.deep.equal([153]);
            expect(await set({ mode: 'mired', scale }, 100)).to.deep.equal([500]);
            expect(await set({ mode: 'mired', scale }, 25)).to.deep.equal([240]);
        });

        it('slider values outside 0..100 are limited: -10 writes cold, 120 warm', async () => {
            expect(await set({ mode: 'kelvin' }, -10)).to.deep.equal([6500]);
            expect(await set({ mode: 'kelvin' }, 120)).to.deep.equal([2200]);
            expect(await set({ mode: 'mired' }, -10)).to.deep.equal([153]);
            expect(await set({ mode: 'mired' }, 120)).to.deep.equal([500]);
            const scale = { min: 2000, max: 6000 };
            expect(await set({ mode: 'kelvin', scale }, -10)).to.deep.equal([6000]);
            expect(await set({ mode: 'kelvin', scale }, 120)).to.deep.equal([2000]);
            const common = { min: 150, max: 550 };
            expect(await set({ mode: 'mired', common }, -10)).to.deep.equal([150]);
            expect(await set({ mode: 'mired', common }, 120)).to.deep.equal([550]);
        });

        it('a slider value that is no number writes nothing', async () => {
            expect(await set({ mode: 'kelvin' }, Number.NaN)).to.deep.equal([]);
        });
    });

    describe('round trip: set, then get returns the slider value', () => {
        for (const b of BRANCHES) {
            it(b.name, async () => {
                const { item } = ctItem(b.opts);
                for (const v of [0, 1, 10, 25, 33, 50, 67, 75, 90, 99, 100]) {
                    await setSliderCTFromValue(item, v);
                    expect(await getSliderCTFromValue(item)).to.equal(String(v));
                }
            });
        }
    });
});
