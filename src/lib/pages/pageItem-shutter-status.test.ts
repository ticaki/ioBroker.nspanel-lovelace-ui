import { expect } from 'chai';
import { PageItem } from './pageItem';
import { Dataitem } from '../controller/data-item';

type Status = [up: string, stop: string, down: string];

/**
 * Shutter item without constructor: entity1 is a const value, up/stop/down are writable.
 *
 * @param type item type (`shutter` or `shutter2`)
 * @param value value of entity1
 * @param shutterClosedIsZero adapter option
 * @returns the item
 */
function shutterItem(type: 'shutter' | 'shutter2', value: boolean | number, shutterClosedIsZero = false): PageItem {
    const noop = (): void => undefined;
    const log = { debug: noop, warn: noop, error: noop, info: noop, silly: noop };
    const controller = { statesControler: { activateTrigger: async (): Promise<void> => undefined } };
    const adapter: unknown = { log, controller, config: { shutterClosedIsZero } };
    const c = (v: string | boolean | number): Dataitem =>
        new Dataitem(adapter, { type: 'const', constVal: v }, {} as never, {} as never);
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: 'test',
        log,
        config: { role: 'gate' },
        adapter,
        library: { getTranslation: (k: string): string => k },
        parent: { card: 'cardEntities' },
        isEnabled: async (): Promise<boolean> => true,
        tempData: [true, true, true],
        dataItems: {
            type,
            role: 'gate',
            data: {
                entity1: { value: c(value) },
                up: c(true),
                stop: c(true),
                down: c(true),
            },
        },
    });
    return item;
}

/**
 * Status of up, stop and down in the row of the list.
 *
 * @param type item type
 * @param value value of entity1
 * @param shutterClosedIsZero adapter option
 * @returns the three states
 */
async function rowStatus(
    type: 'shutter' | 'shutter2',
    value: boolean | number,
    shutterClosedIsZero = false,
): Promise<Status> {
    const payload = await shutterItem(type, value, shutterClosedIsZero).getPageItemPayload();
    const parts = payload.split('~').pop()?.split('|') ?? [];
    return [parts[3], parts[4], parts[5]];
}

/**
 * Status of up, stop and down in the shutter popup.
 *
 * @param value value of entity1
 * @param shutterClosedIsZero adapter option
 * @returns the three states
 */
async function popupStatus(value: boolean | number, shutterClosedIsZero = false): Promise<Status> {
    const payload = (await shutterItem('shutter', value, shutterClosedIsZero).GeneratePopup('popupShutter')) ?? '';
    const parts = payload.split('~');
    return [parts[9], parts[10], parts[11]];
}

describe('lib/pages/pageItem - shutter up/stop/down by status', () => {
    for (const type of ['shutter', 'shutter2'] as const) {
        describe(`row of ${type}`, () => {
            it('boolean true (open): up disabled', async () => {
                expect(await rowStatus(type, true)).to.deep.equal(['disable', 'enable', 'enable']);
            });
            it('boolean false (closed): down disabled', async () => {
                expect(await rowStatus(type, false)).to.deep.equal(['enable', 'enable', 'disable']);
            });
            it('number: 0 % closed = 100 open -> up disabled, 100 % closed = 0 -> down disabled', async () => {
                expect(await rowStatus(type, 0)).to.deep.equal(['disable', 'enable', 'enable']);
                expect(await rowStatus(type, 100)).to.deep.equal(['enable', 'enable', 'disable']);
                expect(await rowStatus(type, 50)).to.deep.equal(['enable', 'enable', 'enable']);
            });
            it('number with shutterClosedIsZero: 100 open, 0 closed', async () => {
                expect(await rowStatus(type, 100, true)).to.deep.equal(['disable', 'enable', 'enable']);
                expect(await rowStatus(type, 0, true)).to.deep.equal(['enable', 'enable', 'disable']);
            });
        });
    }

    describe('popupShutter', () => {
        it('boolean true (open): up disabled, stop stays enabled', async () => {
            expect(await popupStatus(true)).to.deep.equal(['disable', 'enable', 'enable']);
        });
        it('boolean false (closed): down disabled, stop stays enabled', async () => {
            expect(await popupStatus(false)).to.deep.equal(['enable', 'enable', 'disable']);
        });
        it('number: unchanged (100 open after conversion -> up disabled, 0 -> down disabled)', async () => {
            expect(await popupStatus(0)).to.deep.equal(['disable', 'enable', 'enable']);
            expect(await popupStatus(100)).to.deep.equal(['enable', 'enable', 'disable']);
            expect(await popupStatus(50)).to.deep.equal(['enable', 'enable', 'enable']);
            expect(await popupStatus(100, true)).to.deep.equal(['disable', 'enable', 'enable']);
        });
    });
});
