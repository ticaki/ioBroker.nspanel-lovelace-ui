import { expect } from 'chai';
import sinon from 'sinon';
import { BaseTriggeredPage } from './baseClassPage';

/**
 * Triggers that arrive within `minUpdateInterval` are throttled. The deferred run must replay the
 * triggers that arrived in the window - not the first one again. Otherwise the screensaver lost its
 * minute trigger for the time whenever another item (weather, status icon) triggered just before.
 */

type Call = { dp: string; from: string };

class TestPage extends BaseTriggeredPage {
    calls: Call[] = [];

    constructor(perSource: boolean) {
        const noop = (): void => undefined;
        const adapter: any = {
            log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
            controller: {},
            unload: false,
            setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
            clearTimeout: (t: ReturnType<typeof setTimeout>) => clearTimeout(t),
        };
        super({ adapter, name: 'test', panel: { isOnline: true } });
        this.replayTriggerPerSource = perSource;
        this.neverDeactivateTrigger = true;
    }

    protected async onStateTrigger(dp: string, from: BaseTriggeredPage): Promise<void> {
        this.calls.push({ dp, from: from.name });
        return Promise.resolve();
    }
}

function source(name: string): BaseTriggeredPage {
    return { name } as BaseTriggeredPage;
}

describe('lib/classes/baseClassPage - throttled triggers', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    afterEach(() => {
        clock.restore();
    });

    it('replays every source once after the window (screensaver)', async () => {
        const page = new TestPage(true);
        const weather = source('weather');
        const time = source('time');

        await page.onStateTriggerSuperDoNotOverride('solar', weather);
        await page.onStateTriggerSuperDoNotOverride('solar', weather);
        await page.onStateTriggerSuperDoNotOverride('///time', time);
        await page.onStateTriggerSuperDoNotOverride('solar2', weather);
        expect(page.calls).to.deep.equal([{ dp: 'solar', from: 'weather' }]);

        await clock.tickAsync(400);
        expect(page.calls).to.deep.equal([
            { dp: 'solar', from: 'weather' },
            { dp: '///time', from: 'time' },
            { dp: 'solar2', from: 'weather' },
        ]);
    });

    it('replays only the last trigger when the page does not depend on the source', async () => {
        const page = new TestPage(false);

        await page.onStateTriggerSuperDoNotOverride('a', source('a'));
        await page.onStateTriggerSuperDoNotOverride('b', source('b'));
        await page.onStateTriggerSuperDoNotOverride('c', source('c'));
        await clock.tickAsync(400);
        expect(page.calls).to.deep.equal([
            { dp: 'a', from: 'a' },
            { dp: 'c', from: 'c' },
        ]);
    });

    it('does not replay without a trigger in the window', async () => {
        const page = new TestPage(true);

        await page.onStateTriggerSuperDoNotOverride('a', source('a'));
        await clock.tickAsync(1000);
        expect(page.calls).to.deep.equal([{ dp: 'a', from: 'a' }]);
    });
});
