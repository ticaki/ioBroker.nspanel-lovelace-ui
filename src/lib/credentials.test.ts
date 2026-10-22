import { expect } from 'chai';
import { fingerprintCredential, isCredentialId, resolveLogin, resolveSecret } from './credentials';

type FakeAdapter = ioBroker.Adapter & { warnings: string[] };

/**
 * Builds the smallest adapter stand-in `@iobroker/adapter-core/credentials` needs: object lookup
 * and decryption. Encrypted values are marked with the prefix `enc:` instead of real ciphertext.
 *
 * @param objects - the credential objects by id
 * @returns the fake adapter, collecting warnings
 */
function fakeAdapter(objects: Record<string, ioBroker.AnyObject | null>): FakeAdapter {
    const warnings: string[] = [];
    return {
        warnings,
        log: {
            warn: (m: string) => warnings.push(m),
            debug: () => undefined,
            info: () => undefined,
            error: () => undefined,
        },
        decrypt: (v: string) => {
            if (!v.startsWith('enc:')) {
                throw new Error('bad decrypt');
            }
            return v.substring(4);
        },
        getForeignObjectAsync: (id: string) => Promise.resolve(objects[id] ?? null),
    } as unknown as FakeAdapter;
}

function loginCredential(login: string, password: string): ioBroker.AnyObject {
    return {
        _id: 'system.credentials.mqtt',
        type: 'config',
        common: { name: 'MQTT broker' },
        native: { type: 'custom', form: 'login', version: 1, encryptedFields: ['password'], login, password },
    } as unknown as ioBroker.AnyObject;
}

function keyCredential(key: string): ioBroker.AnyObject {
    return {
        _id: 'system.credentials.wifi',
        type: 'config',
        common: { name: 'Guest wifi' },
        native: { type: 'custom', form: 'key', version: 1, encryptedFields: ['key'], key },
    } as unknown as ioBroker.AnyObject;
}

describe('lib/credentials - isCredentialId', () => {
    it('accepts only ids below system.credentials.', () => {
        expect(isCredentialId('system.credentials.mqtt')).to.equal(true);
        expect(isCredentialId('system.credentials.')).to.equal(false);
        expect(isCredentialId('mqtt')).to.equal(false);
        expect(isCredentialId('')).to.equal(false);
        expect(isCredentialId(undefined)).to.equal(false);
    });
});

describe('lib/credentials - resolveLogin', () => {
    it('takes login and password from the credential', async () => {
        const adapter = fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'enc:s3cret') });
        const r = await resolveLogin(adapter, 'system.credentials.mqtt', 'legacyUser', 'legacyPass');
        expect(r).to.deep.equal({ source: 'credential', login: 'iob', password: 's3cret', name: 'MQTT broker' });
        expect(adapter.warnings).to.deep.equal([]);
    });

    it('uses the legacy fields without a credential id', async () => {
        const r = await resolveLogin(fakeAdapter({}), '', 'legacyUser', 'legacyPass');
        expect(r).to.deep.equal({ source: 'legacy', login: 'legacyUser', password: 'legacyPass' });
    });

    it('falls back to the legacy fields when the credential was deleted', async () => {
        const adapter = fakeAdapter({});
        const r = await resolveLogin(adapter, 'system.credentials.mqtt', 'legacyUser', 'legacyPass');
        expect(r).to.deep.equal({ source: 'legacy', login: 'legacyUser', password: 'legacyPass' });
        expect(adapter.warnings).to.have.length(1);
        expect(adapter.warnings[0]).to.include('not found');
    });

    it('rejects a key credential because it has no login', async () => {
        const adapter = fakeAdapter({ 'system.credentials.wifi': keyCredential('enc:abc') });
        const r = await resolveLogin(adapter, 'system.credentials.wifi', 'legacyUser', 'legacyPass');
        expect(r.source).to.equal('legacy');
        expect(adapter.warnings[0]).to.include('login & password');
    });

    it('survives a decryption error and reports none without legacy values', async () => {
        const adapter = fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'garbage') });
        const r = await resolveLogin(adapter, 'system.credentials.mqtt', '', '');
        expect(r).to.deep.equal({ source: 'none', login: '', password: '' });
        expect(adapter.warnings[0]).to.include('bad decrypt');
    });

    it('never puts the secret into the log', async () => {
        const adapter = fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'enc:s3cret') });
        await resolveLogin(adapter, 'system.credentials.mqtt', '', '');
        await resolveLogin(adapter, 'system.credentials.other', '', 'legacyPass');
        expect(JSON.stringify(adapter.warnings)).to.not.include('s3cret');
        expect(JSON.stringify(adapter.warnings)).to.not.include('legacyPass');
    });
});

describe('lib/credentials - resolveSecret', () => {
    it('takes the key of a key credential', async () => {
        const adapter = fakeAdapter({ 'system.credentials.wifi': keyCredential('enc:wifi-pass') });
        const r = await resolveSecret(adapter, 'system.credentials.wifi', 'legacy');
        expect(r).to.deep.equal({ source: 'credential', secret: 'wifi-pass', name: 'Guest wifi' });
    });

    it('accepts a login credential and uses its password', async () => {
        const adapter = fakeAdapter({ 'system.credentials.mqtt': loginCredential('admin', 'enc:web-pass') });
        const r = await resolveSecret(adapter, 'system.credentials.mqtt', '');
        expect(r).to.deep.equal({ source: 'credential', secret: 'web-pass', name: 'MQTT broker' });
    });

    it('uses the legacy value without a credential id and reports none when both are empty', async () => {
        expect(await resolveSecret(fakeAdapter({}), undefined, 'legacy')).to.deep.equal({
            source: 'legacy',
            secret: 'legacy',
        });
        expect(await resolveSecret(fakeAdapter({}), '', '')).to.deep.equal({ source: 'none', secret: '' });
    });

    it('falls back with a warning when the credential is empty', async () => {
        const adapter = fakeAdapter({ 'system.credentials.wifi': keyCredential('') });
        const r = await resolveSecret(adapter, 'system.credentials.wifi', 'legacy');
        expect(r).to.deep.equal({ source: 'legacy', secret: 'legacy' });
        expect(adapter.warnings[0]).to.include('is empty');
    });
});

describe('lib/credentials - fingerprintCredential', () => {
    it('is stable for unchanged values', async () => {
        const adapter = fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'enc:s3cret') });
        const first = await fingerprintCredential(adapter, 'system.credentials.mqtt');
        const second = await fingerprintCredential(adapter, 'system.credentials.mqtt');
        expect(first).to.be.a('string');
        expect(second).to.equal(first);
    });

    it('does not change when only the display name changes', async () => {
        const before = loginCredential('iob', 'enc:s3cret');
        const first = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.mqtt': before }),
            'system.credentials.mqtt',
        );
        const renamed = loginCredential('iob', 'enc:s3cret');
        (renamed.common as Record<string, unknown>).name = 'Broker im Keller';
        const second = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.mqtt': renamed }),
            'system.credentials.mqtt',
        );
        expect(second).to.equal(first);
    });

    it('changes when the password changes', async () => {
        const first = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'enc:s3cret') }),
            'system.credentials.mqtt',
        );
        const second = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'enc:other') }),
            'system.credentials.mqtt',
        );
        expect(second).to.not.equal(first);
    });

    it('changes when the login changes', async () => {
        const first = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'enc:s3cret') }),
            'system.credentials.mqtt',
        );
        const second = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.mqtt': loginCredential('other', 'enc:s3cret') }),
            'system.credentials.mqtt',
        );
        expect(second).to.not.equal(first);
    });

    it('tells a login credential apart from a key credential with the same secret', async () => {
        const login = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.x': loginCredential('', 'enc:same') }),
            'system.credentials.x',
        );
        const key = await fingerprintCredential(
            fakeAdapter({ 'system.credentials.x': keyCredential('enc:same') }),
            'system.credentials.x',
        );
        expect(login).to.not.equal(key);
    });

    it('returns undefined when the credential is gone or cannot be decrypted', async () => {
        expect(await fingerprintCredential(fakeAdapter({}), 'system.credentials.mqtt')).to.equal(undefined);
        const broken = fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'garbage') });
        expect(await fingerprintCredential(broken, 'system.credentials.mqtt')).to.equal(undefined);
    });

    it('never puts the secret into the fingerprint or the log', async () => {
        const adapter = fakeAdapter({ 'system.credentials.mqtt': loginCredential('iob', 'enc:s3cret') });
        const fp = await fingerprintCredential(adapter, 'system.credentials.mqtt');
        expect(fp).to.not.include('s3cret');
        expect(JSON.stringify(adapter.warnings)).to.not.include('s3cret');
    });
});
