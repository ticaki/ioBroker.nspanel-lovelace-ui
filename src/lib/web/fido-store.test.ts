import { expect } from 'chai';
import { FIDO_OBJECT_ID, FidoCredentialStore, type FidoCredentialRecord, type FidoStoreAdapter } from './fido-store';

/**
 * What the object db hands back: the settable object plus its id (test double, hence the cast)
 *
 * @param id object id
 * @param obj the object as written
 * @returns the stored object
 */
function asStored(id: string, obj: ioBroker.SettableObject): ioBroker.Object {
    return { ...structuredClone(obj), _id: id } as unknown as ioBroker.Object;
}

type ObjectDb = Map<string, ioBroker.Object>;

/** what the store wrote, as plain data */
type Stored = { type: string; common: Record<string, unknown>; native: Record<string, unknown> };

function fakeAdapter(initial?: ioBroker.SettableObject): FidoStoreAdapter & {
    warnings: string[];
    stored: () => Stored | undefined;
} {
    const objects: ObjectDb = new Map();
    if (initial) {
        objects.set(FIDO_OBJECT_ID, asStored(FIDO_OBJECT_ID, initial));
    }
    const warnings: string[] = [];
    return {
        warnings,
        stored: (): Stored | undefined => {
            const o = objects.get(FIDO_OBJECT_ID);
            if (!o) {
                return undefined;
            }
            const plain: Stored = JSON.parse(
                JSON.stringify({ type: o.type, common: o.common ?? {}, native: o.native ?? {} }),
            );
            return plain;
        },
        log: {
            debug: (): void => undefined,
            warn: (msg: string): void => {
                warnings.push(msg);
            },
            error: (msg: string): void => {
                warnings.push(msg);
            },
        },
        getObjectAsync: async (id: string) => objects.get(id) ?? null,
        setObjectAsync: async (id: string, obj: ioBroker.SettableObject) => {
            objects.set(id, asStored(id, obj));
            return { id };
        },
    };
}

const KEY: FidoCredentialRecord = {
    id: 'a2V5MQ',
    publicKey: 'cHVibGljLWtleQ',
    counter: 0,
    transports: ['usb'],
    name: 'YubiKey kitchen',
    createdAt: 1000,
};

describe('lib/web/fido-store', () => {
    it('creates the object on first load and starts empty', async () => {
        const adapter = fakeAdapter();
        const store = new FidoCredentialStore(adapter);
        expect(store.isLoaded).to.equal(false);
        expect(await store.load()).to.deep.equal([]);
        expect(store.isLoaded).to.equal(true);
        const obj = adapter.stored();
        expect(obj?.type).to.equal('meta');
        expect(obj?.common.expert).to.equal(true);
        expect(obj?.native.credentials).to.deep.equal([]);
        expect(store.hasCredentials).to.equal(false);
    });

    it('adds, lists, summarises and removes credentials and persists every change', async () => {
        const adapter = fakeAdapter();
        const store = new FidoCredentialStore(adapter);
        await store.load();
        await store.add(KEY);
        await store.add({ ...KEY, id: 'a2V5Mg', name: 'Phone' });
        expect(store.hasCredentials).to.equal(true);
        expect(store.list().map(c => c.id)).to.deep.equal(['a2V5MQ', 'a2V5Mg']);
        expect(adapter.stored()?.native.credentials).to.have.length(2);
        // summaries hide the public key
        const summary = store.summaries()[0];
        expect(summary).to.deep.equal({
            id: 'a2V5MQ',
            name: 'YubiKey kitchen',
            createdAt: 1000,
            lastUsedAt: undefined,
            transports: ['usb'],
        });
        expect(summary).to.not.have.property('publicKey');
        // the same id replaces the entry
        await store.add({ ...KEY, name: 'renamed' });
        expect(store.list()).to.have.length(2);
        expect(store.get('a2V5MQ')?.name).to.equal('renamed');
        // remove
        expect(await store.remove('a2V5MQ')).to.equal(true);
        expect(await store.remove('a2V5MQ')).to.equal(false);
        expect(store.list().map(c => c.id)).to.deep.equal(['a2V5Mg']);
        expect(adapter.stored()?.native.credentials).to.have.length(1);
    });

    it('loads stored credentials and ignores invalid entries', async () => {
        const adapter = fakeAdapter({
            type: 'meta',
            common: { name: 'x', type: 'meta.user' },
            native: { credentials: [KEY, { id: 'broken' }, 'nonsense'] },
        });
        const store = new FidoCredentialStore(adapter);
        const list = await store.load();
        expect(list).to.deep.equal([KEY]);
        expect(adapter.warnings.join(' ')).to.contain('2 invalid credential(s) ignored');
    });

    it('updates counter and last use on touch', async () => {
        const adapter = fakeAdapter();
        const store = new FidoCredentialStore(adapter);
        await store.load();
        await store.add(KEY);
        await store.touch('a2V5MQ', 7, 5000);
        expect(store.get('a2V5MQ')).to.include({ counter: 7, lastUsedAt: 5000 });
        const stored = adapter.stored()?.native.credentials;
        expect(Array.isArray(stored) && stored[0]).to.include({ counter: 7, lastUsedAt: 5000 });
        // unknown id: no change, no error
        await store.touch('unknown', 1);
        expect(store.list()).to.have.length(1);
    });

    it('returns copies, not the internal records', async () => {
        const store = new FidoCredentialStore(fakeAdapter());
        await store.load();
        await store.add(KEY);
        const copy = store.list()[0];
        copy.name = 'changed';
        copy.transports?.push('nfc');
        expect(store.get('a2V5MQ')?.name).to.equal('YubiKey kitchen');
        expect(store.get('a2V5MQ')?.transports).to.deep.equal(['usb']);
    });
});
