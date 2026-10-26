import { expect } from 'chai';
import {
    FIDO_ATTEMPTS_PER_MINUTE,
    FIDO_CHALLENGE_TTL_MS,
    FidoService,
    RateLimiter,
    relyingPartyFromHost,
    toAuthenticationResponse,
    toRegistrationResponse,
    type FidoVerifiers,
} from './fido';
import { FidoCredentialStore, type FidoStoreAdapter } from './fido-store';

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

function memoryStore(): FidoCredentialStore {
    const objects = new Map<string, ioBroker.Object>();
    const adapter = {
        log: { debug: (): void => undefined, warn: (): void => undefined, error: (): void => undefined },
        getObjectAsync: async (id: string) => objects.get(id) ?? null,
        setObjectAsync: (async (id: string, obj: ioBroker.SettableObject) => {
            objects.set(id, asStored(id, obj));
            return { id };
        }) as FidoStoreAdapter['setObjectAsync'],
    };
    return new FidoCredentialStore(adapter);
}

const RP = { rpId: 'panel.home.lan', origin: 'https://panel.home.lan:8090' };
const noLog = { debug: (): void => undefined, warn: (): void => undefined };

/** a syntactically complete registration answer (content is nonsense) */
function registrationAnswer(): unknown {
    return {
        id: 'Y3JlZC0x',
        rawId: 'Y3JlZC0x',
        type: 'public-key',
        clientExtensionResults: {},
        response: { clientDataJSON: 'e30', attestationObject: 'AAAA', transports: ['usb'] },
    };
}

function authenticationAnswer(id: string = 'Y3JlZC0x'): unknown {
    return {
        id,
        rawId: id,
        type: 'public-key',
        clientExtensionResults: {},
        response: { clientDataJSON: 'e30', authenticatorData: 'AAAA', signature: 'BBBB' },
    };
}

/**
 * Verifiers that behave like the library but do not check signatures: they call
 * `expectedChallenge` with the challenge given here and answer verified = true.
 *
 * @param challenge returns the challenge the fake authenticator "signed"
 * @param publicKey public key the fake registration reports
 * @returns the verifier pair
 */
function fakeVerifiers(challenge: () => string, publicKey = Uint8Array.from([1, 2, 3])): FidoVerifiers {
    const expect_ = async (opts: {
        expectedChallenge: string | ((c: string) => boolean | Promise<boolean>);
    }): Promise<boolean> =>
        typeof opts.expectedChallenge === 'function' ? await opts.expectedChallenge(challenge()) : false;
    return {
        registration: async opts => {
            if (!(await expect_(opts))) {
                throw new Error('Unexpected registration response challenge');
            }
            return {
                verified: true,
                registrationInfo: {
                    fmt: 'none',
                    aaguid: '0',
                    credential: { id: opts.response.id, publicKey, counter: 0, transports: ['usb'] },
                    credentialType: 'public-key',
                    attestationObject: Uint8Array.from([]),
                    userVerified: false,
                    credentialDeviceType: 'singleDevice',
                    credentialBackedUp: false,
                    origin: RP.origin,
                    rpID: RP.rpId,
                },
            };
        },
        authentication: async opts => {
            if (!(await expect_(opts))) {
                throw new Error('Unexpected authentication response challenge');
            }
            return {
                verified: true,
                authenticationInfo: {
                    credentialID: opts.credential.id,
                    newCounter: opts.credential.counter + 1,
                    userVerified: false,
                    credentialDeviceType: 'singleDevice',
                    credentialBackedUp: false,
                    origin: RP.origin,
                    rpID: RP.rpId,
                },
            };
        },
    };
}

describe('lib/web/fido - RateLimiter', () => {
    it('limits after max hits within the window and forgets afterwards', () => {
        const limiter = new RateLimiter(3, 1000);
        expect(limiter.isLimited('a', 0)).to.equal(false);
        limiter.hit('a', 0);
        limiter.hit('a', 10);
        expect(limiter.isLimited('a', 20)).to.equal(false);
        limiter.hit('a', 30);
        expect(limiter.isLimited('a', 40)).to.equal(true);
        expect(limiter.isLimited('b', 40)).to.equal(false);
        expect(limiter.isLimited('a', 1001)).to.equal(false);
        limiter.hit('a', 1002);
        limiter.hit('a', 1003);
        limiter.hit('a', 1004);
        expect(limiter.isLimited('a', 1005)).to.equal(true);
        limiter.reset('a');
        expect(limiter.isLimited('a', 1006)).to.equal(false);
    });
});

describe('lib/web/fido - relyingPartyFromHost', () => {
    it('derives rpId and origin from the Host header', () => {
        expect(relyingPartyFromHost('panel.home.lan:8090', 8090)).to.deep.equal(RP);
        expect(relyingPartyFromHost('Panel.Home.LAN', 8090)).to.deep.equal(RP);
        expect(relyingPartyFromHost('panel.home.lan:443', 443)).to.deep.equal({
            rpId: 'panel.home.lan',
            origin: 'https://panel.home.lan',
        });
        expect(relyingPartyFromHost('nspanel', 8090)).to.deep.equal({
            rpId: 'nspanel',
            origin: 'https://nspanel:8090',
        });
    });

    it('rejects IP addresses, missing and malformed hosts', () => {
        expect(relyingPartyFromHost('192.168.178.65:8090', 8090)).to.be.a('string').and.contain('IP address');
        expect(relyingPartyFromHost('[::1]:8090', 8090)).to.be.a('string').and.contain('IPv6');
        expect(relyingPartyFromHost(undefined, 8090)).to.be.a('string');
        expect(relyingPartyFromHost('bad host', 8090)).to.be.a('string');
        expect(relyingPartyFromHost('panel:abc', 8090)).to.be.a('string').and.contain('port');
    });
});

describe('lib/web/fido - response parsing', () => {
    it('accepts the credential JSON directly or wrapped in { response }', () => {
        const direct = toRegistrationResponse(registrationAnswer());
        expect(direct?.id).to.equal('Y3JlZC0x');
        expect(direct?.response.transports).to.deep.equal(['usb']);
        expect(toRegistrationResponse({ response: registrationAnswer() })?.id).to.equal('Y3JlZC0x');
        expect(toAuthenticationResponse(authenticationAnswer())?.response.signature).to.equal('BBBB');
    });

    it('rejects wrong shapes', () => {
        expect(toRegistrationResponse(null)).to.equal(undefined);
        expect(toRegistrationResponse({})).to.equal(undefined);
        expect(toRegistrationResponse({ id: 'x', rawId: 'x', response: {} })).to.equal(undefined);
        expect(toRegistrationResponse(authenticationAnswer())).to.equal(undefined);
        expect(toAuthenticationResponse(registrationAnswer())).to.equal(undefined);
    });
});

describe('lib/web/fido - FidoService', () => {
    it('creates registration options with challenge and rpId and remembers the challenge', async () => {
        const store = memoryStore();
        await store.load();
        const service = new FidoService({ rpName: 'NSPanel', store, log: noLog });
        const result = await service.registrationOptions(RP, '  Kitchen key  ');
        expect(result.ok).to.equal(true);
        if (!result.ok) {
            return;
        }
        const options = result.value as { challenge: string; rp: { id: string; name: string }; user: { name: string } };
        expect(options.challenge).to.be.a('string').with.length.greaterThan(20);
        expect(options.rp).to.deep.equal({ id: RP.rpId, name: 'NSPanel' });
        expect(options.user.name).to.equal('nspanel-web-panels');
        expect(service.pendingChallenges).to.equal(1);
        expect((await service.registrationOptions(RP, '   ')).ok).to.equal(false);
    });

    it('needs a registered key for login options', async () => {
        const store = memoryStore();
        await store.load();
        const service = new FidoService({ rpName: 'NSPanel', store, log: noLog });
        const none = await service.authenticationOptions(RP);
        expect(none.ok).to.equal(false);
        expect(none.ok || none.status).to.equal(404);
        await store.add({ id: 'Y3JlZC0x', publicKey: 'AQID', counter: 0, name: 'k', createdAt: 1 });
        const result = await service.authenticationOptions(RP);
        expect(result.ok).to.equal(true);
        if (result.ok) {
            const options = result.value as { challenge: string; rpId: string; allowCredentials: { id: string }[] };
            expect(options.rpId).to.equal(RP.rpId);
            expect(options.challenge).to.be.a('string');
            expect(options.allowCredentials.map(c => c.id)).to.deep.equal(['Y3JlZC0x']);
        }
    });

    it('rejects broken answers with 400 (real verifier)', async () => {
        const store = memoryStore();
        await store.load();
        const service = new FidoService({ rpName: 'NSPanel', store, log: noLog });
        expect(await service.verifyRegistration(RP, { nonsense: true })).to.deep.equal({
            ok: false,
            status: 400,
            error: 'invalid response',
        });
        // complete shape but garbage content: the library throws, no challenge was issued
        const garbage = await service.verifyRegistration(RP, registrationAnswer());
        expect(garbage.ok).to.equal(false);
        expect(garbage.ok || garbage.status).to.equal(400);
        const login = await service.verifyAuthentication(RP, authenticationAnswer());
        expect(login).to.deep.equal({ ok: false, status: 400, error: 'unknown security key' });
        expect(store.hasCredentials).to.equal(false);
    });

    it('stores the key on a verified registration and logs in with it (mocked verifier)', async () => {
        const store = memoryStore();
        await store.load();
        let now = 1_000_000;
        let issued = '';
        const service = new FidoService({
            rpName: 'NSPanel',
            store,
            log: noLog,
            now: () => now,
            verifiers: fakeVerifiers(() => issued),
        });
        const options = await service.registrationOptions(RP, 'Kitchen key');
        if (!options.ok) {
            throw new Error('options failed');
        }
        issued = (options.value as { challenge: string }).challenge;
        const registered = await service.verifyRegistration(RP, registrationAnswer());
        expect(registered).to.deep.equal({ ok: true, value: { id: 'Y3JlZC0x', name: 'Kitchen key' } });
        expect(store.get('Y3JlZC0x')).to.include({ name: 'Kitchen key', counter: 0, createdAt: now });
        expect(store.get('Y3JlZC0x')?.publicKey).to.equal(Buffer.from([1, 2, 3]).toString('base64url'));
        expect(service.pendingChallenges).to.equal(0);
        expect(service.hasCredentials).to.equal(true);

        // the same challenge cannot be used twice
        const replay = await service.verifyRegistration(RP, registrationAnswer());
        expect(replay.ok).to.equal(false);
        expect(replay.ok || replay.error).to.equal('unknown or expired challenge');

        // login
        const loginOptions = await service.authenticationOptions(RP);
        if (!loginOptions.ok) {
            throw new Error('login options failed');
        }
        issued = (loginOptions.value as { challenge: string }).challenge;
        now += 5000;
        const login = await service.verifyAuthentication(RP, authenticationAnswer());
        expect(login).to.deep.equal({ ok: true, value: { id: 'Y3JlZC0x', name: 'Kitchen key' } });
        expect(store.get('Y3JlZC0x')).to.include({ counter: 1, lastUsedAt: now });

        // a login challenge is not good for a registration and vice versa
        const mixed = await service.authenticationOptions(RP);
        if (mixed.ok) {
            issued = (mixed.value as { challenge: string }).challenge;
        }
        const wrongKind = await service.verifyRegistration(RP, registrationAnswer());
        expect(wrongKind.ok).to.equal(false);
    });

    it('expires challenges after two minutes', async () => {
        const store = memoryStore();
        await store.load();
        let now = 0;
        let issued = '';
        const service = new FidoService({
            rpName: 'NSPanel',
            store,
            log: noLog,
            now: () => now,
            verifiers: fakeVerifiers(() => issued),
        });
        const options = await service.registrationOptions(RP, 'late');
        if (options.ok) {
            issued = (options.value as { challenge: string }).challenge;
        }
        now = FIDO_CHALLENGE_TTL_MS + 1;
        const result = await service.verifyRegistration(RP, registrationAnswer());
        expect(result.ok).to.equal(false);
        expect(result.ok || result.error).to.equal('unknown or expired challenge');
        expect(service.pendingChallenges).to.equal(0);
    });

    it('exposes the limiters with the PIN limits', () => {
        const service = new FidoService({ rpName: 'x', store: memoryStore(), log: noLog });
        for (let i = 0; i < FIDO_ATTEMPTS_PER_MINUTE; i++) {
            expect(service.failures.isLimited('ip', 0)).to.equal(false);
            service.failures.hit('ip', 0);
        }
        expect(service.failures.isLimited('ip', 0)).to.equal(true);
    });
});
