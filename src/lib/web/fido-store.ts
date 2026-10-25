import type { AdapterClassDefinition } from '../controller/library';

/** Object (below the instance namespace) that holds the registered FIDO2 credentials */
export const FIDO_OBJECT_ID = 'web.fidoCredentials';

/** One registered security key (public data only, no secret) */
export type FidoCredentialRecord = {
    /** credential id, base64url */
    id: string;
    /** COSE public key, base64url */
    publicKey: string;
    /** signature counter of the authenticator (0 for most passkeys) */
    counter: number;
    /** transports the authenticator reported (usb, nfc, ble, internal, hybrid) */
    transports?: string[];
    /** name the user gave the key */
    name: string;
    /** registration time (ms since epoch) */
    createdAt: number;
    /** last successful login (ms since epoch) */
    lastUsedAt?: number;
};

/** What the admin shows: everything but the public key */
export type FidoCredentialSummary = Omit<FidoCredentialRecord, 'publicKey' | 'counter'>;

/** The adapter functions the store needs */
export type FidoStoreAdapter = Pick<AdapterClassDefinition, 'getObjectAsync' | 'setObjectAsync'> & {
    log: Pick<ioBroker.Log, 'debug' | 'warn' | 'error'>;
};

function isRecord(value: unknown): value is FidoCredentialRecord {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        v.id !== '' &&
        typeof v.publicKey === 'string' &&
        typeof v.counter === 'number' &&
        typeof v.name === 'string' &&
        typeof v.createdAt === 'number'
    );
}

/**
 * Registered FIDO2 credentials of the web panels, persisted in the object
 * `<namespace>.web.fidoCredentials` (`native.credentials`). Only public keys are stored; the
 * object is still marked as expert. Only the adapter writes it.
 */
export class FidoCredentialStore {
    private readonly adapter: FidoStoreAdapter;
    private credentials: FidoCredentialRecord[] = [];
    private loaded = false;

    constructor(adapter: FidoStoreAdapter) {
        this.adapter = adapter;
    }

    /** true after `load()` */
    get isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * Read the credentials from the object; creates the object when it does not exist.
     *
     * @returns the credentials
     */
    async load(): Promise<FidoCredentialRecord[]> {
        let obj: ioBroker.Object | null | undefined;
        try {
            obj = await this.adapter.getObjectAsync(FIDO_OBJECT_ID);
        } catch (e) {
            this.adapter.log.warn(`Cannot read ${FIDO_OBJECT_ID}: ${String(e)}`);
            obj = undefined;
        }
        const raw: unknown = obj?.native?.credentials;
        const list = Array.isArray(raw) ? raw : [];
        const valid = list.filter(isRecord);
        if (valid.length !== list.length) {
            this.adapter.log.warn(`${FIDO_OBJECT_ID}: ${list.length - valid.length} invalid credential(s) ignored`);
        }
        this.credentials = valid;
        this.loaded = true;
        if (!obj) {
            await this.save();
        }
        return this.list();
    }

    /**
     * All credentials (copies).
     *
     * @returns the credentials
     */
    list(): FidoCredentialRecord[] {
        return this.credentials.map(c => ({ ...c, transports: c.transports ? [...c.transports] : undefined }));
    }

    /**
     * Public summary for the admin.
     *
     * @returns name, times and transports of every credential
     */
    summaries(): FidoCredentialSummary[] {
        return this.credentials.map(c => ({
            id: c.id,
            name: c.name,
            createdAt: c.createdAt,
            lastUsedAt: c.lastUsedAt,
            transports: c.transports ? [...c.transports] : undefined,
        }));
    }

    /** true if at least one key is registered */
    get hasCredentials(): boolean {
        return this.credentials.length > 0;
    }

    /**
     * One credential.
     *
     * @param id credential id (base64url)
     * @returns the credential or undefined
     */
    get(id: string): FidoCredentialRecord | undefined {
        const c = this.credentials.find(x => x.id === id);
        return c ? { ...c } : undefined;
    }

    /**
     * Add a credential (replaces one with the same id).
     *
     * @param record the credential
     */
    async add(record: FidoCredentialRecord): Promise<void> {
        this.credentials = this.credentials.filter(c => c.id !== record.id);
        this.credentials.push({ ...record });
        await this.save();
    }

    /**
     * Remove a credential.
     *
     * @param id credential id
     * @returns true if it existed
     */
    async remove(id: string): Promise<boolean> {
        const before = this.credentials.length;
        this.credentials = this.credentials.filter(c => c.id !== id);
        if (this.credentials.length === before) {
            return false;
        }
        await this.save();
        return true;
    }

    /**
     * Record a successful login: new counter and time.
     *
     * @param id credential id
     * @param counter counter reported by the authenticator
     * @param now time of the login
     */
    async touch(id: string, counter: number, now: number = Date.now()): Promise<void> {
        const c = this.credentials.find(x => x.id === id);
        if (!c) {
            return;
        }
        c.counter = counter;
        c.lastUsedAt = now;
        await this.save();
    }

    private async save(): Promise<void> {
        const obj: ioBroker.SettableObject = {
            type: 'meta',
            common: {
                name: 'FIDO2 security keys of the web panels',
                type: 'meta.user',
                expert: true,
            },
            native: { credentials: this.credentials },
        };
        try {
            await this.adapter.setObjectAsync(FIDO_OBJECT_ID, obj);
        } catch (e) {
            this.adapter.log.error(`Cannot write ${FIDO_OBJECT_ID}: ${String(e)}`);
        }
    }
}
