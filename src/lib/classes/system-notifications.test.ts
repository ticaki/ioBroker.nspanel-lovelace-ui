import { expect } from 'chai';
import { SystemNotifications } from './system-notifications';

/**
 * A notification of a host must be recognised as already known. Before the fix the check compared
 * the category of the stored entry with the SCOPE of the new one, so the same notification was
 * appended again on every run - with `cleared: false`, which made an acknowledged notification
 * reappear on the panel.
 */

type Host = { scope: string; category: string; severity: string };

function makeAdapter(hostNotifications: Host[]): { adapter: any; sent: { command: string; message: any }[]; panelsObject: any } {
    const noop = (): void => undefined;
    const sent: { command: string; message: any }[] = [];
    const panelsObject: any = { native: {} };
    const adapter: any = {
        namespace: 'nspanel-lovelace-ui.0',
        unload: false,
        config: { testCase: true },
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        library: { getLocalLanguage: () => 'de' },
        controller: { notificationToPanel: async (): Promise<void> => undefined },
        setTimeout: (): undefined => undefined, // the delayed sort is not part of this test
        clearTimeout: noop,
        getObjectAsync: async (): Promise<any> => panelsObject,
        setObjectAsync: async (): Promise<void> => undefined,
        getObjectViewAsync: async (): Promise<any> => ({ rows: [{ id: 'system.host.test' }] }),
        sendToHostAsync: async (_host: string, command: string, message: any): Promise<any> => {
            sent.push({ command, message });
            if (command !== 'getNotifications') {
                return {};
            }
            const result: any = {};
            for (const n of hostNotifications) {
                result[n.scope] = result[n.scope] ?? { categories: {} };
                result[n.scope].categories[n.category] = {
                    name: { de: `${n.category} Name`, en: `${n.category} name` },
                    description: { de: `${n.category} Text`, en: `${n.category} text` },
                    severity: n.severity,
                };
            }
            return { result };
        },
    };
    return { adapter, sent, panelsObject };
}

const CHANGE_ID = 'system.host.test.notifications.system';

describe('lib/classes/system-notifications - a host notification is counted once', () => {
    it('does not append the same notification again on the second run', async () => {
        const { adapter } = makeAdapter([
            { scope: 'system', category: 'numberObjectsLimitExceeded', severity: 'alert' },
            { scope: 'admin', category: 'adapterUpdates', severity: 'notify' },
        ]);
        const sn = new SystemNotifications(adapter);

        await sn.onStateChange(CHANGE_ID, null);
        expect(sn.getCount()).to.equal(2);

        // the host still reports the same two notifications
        await sn.onStateChange(CHANGE_ID, null);
        expect(sn.getCount()).to.equal(2);
    });

    it('keeps an acknowledged notification acknowledged while the host still reports it', async () => {
        const { adapter, sent } = makeAdapter([
            { scope: 'system', category: 'numberObjectsLimitExceeded', severity: 'alert' },
        ]);
        const sn = new SystemNotifications(adapter);

        await sn.onStateChange(CHANGE_ID, null);
        expect(sn.getCount()).to.equal(1);

        await sn.clearNotification(); // "Clear all" on the panel
        expect(sn.getCount()).to.equal(0);
        expect(sent.filter(s => s.command === 'clearNotifications')).to.have.length(1);
        expect(sent[sent.length - 1].message).to.deep.equal({
            scopeFilter: 'system',
            categoryFilter: 'numberObjectsLimitExceeded',
        });

        // the host has not dropped it yet - it must not come back unacknowledged
        await sn.onStateChange(CHANGE_ID, null);
        expect(sn.getCount()).to.equal(0);
    });

    it('drops a stored notification when the host does not report it any more', async () => {
        const { adapter } = makeAdapter([
            { scope: 'system', category: 'numberObjectsLimitExceeded', severity: 'alert' },
        ]);
        const sn = new SystemNotifications(adapter);
        await sn.onStateChange(CHANGE_ID, null);
        expect(sn.getCount()).to.equal(1);

        adapter.sendToHostAsync = async (_h: string, command: string): Promise<any> =>
            command === 'getNotifications' ? { result: {} } : {};
        await sn.onStateChange(CHANGE_ID, null);
        expect(sn.getCount()).to.equal(0);
    });
});

describe('lib/classes/system-notifications - a stored list of an older version', () => {
    it('merges duplicates and keeps the acknowledgement of a copy', async () => {
        const { adapter, panelsObject } = makeAdapter([]);
        const entry = (cleared: boolean): any => ({
            id: 'system.numberObjectsLimitExceeded',
            headline: 'limit',
            text: 'limit',
            version: 0,
            severity: 'alert',
            ts: 0,
            cleared,
            scopeid: 'system',
            categoryid: 'numberObjectsLimitExceeded',
            host: 'system.host.test',
        });
        panelsObject.native.SystemNotifications = [entry(false), entry(true), entry(false)];

        const sn = new SystemNotifications(adapter);
        await sn.init(); // config.testCase stops before the host is asked
        expect(sn.getCount()).to.equal(0);
    });
});
