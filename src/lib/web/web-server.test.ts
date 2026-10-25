import { expect } from 'chai';
import * as https from 'node:https';
import * as net from 'node:net';
import {
    PIN_ATTEMPTS_PER_MINUTE,
    PinGuard,
    WEB_TOKEN_COOKIE,
    WebServer,
    type WebServerOptions,
    parseCookies,
    pinToken,
    safeNext,
} from './web-server';
import type { VirtualPanelManager } from './virtual-panel-manager';
import { FidoService, type FidoVerifiers } from './fido';
import { FidoCredentialStore } from './fido-store';

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

const SECRET = 'instance-secret';

/** Self-signed test certificate (EC P-256, CN=nspanel-web-test, valid 100 years) - tests only */
const TEST_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPHcmyjwln3x1vYOl
oPdKrTFb6TILBe1L6EE6J2m7ce2hRANCAAR1hsIEL8E4yEJeX1+VZeBpVxgli8Ay
r7BMpH3BUXJvclbWDoJWU5nDMia5O0phUGlHC5j1rAzjmNRZHVoVrW2E
-----END PRIVATE KEY-----
`;
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIBjDCCATOgAwIBAgIUGbPhuLbxOareQCbHgJBr4DDP+PMwCgYIKoZIzj0EAwIw
GzEZMBcGA1UEAwwQbnNwYW5lbC13ZWItdGVzdDAgFw0yNjEwMjUwODA1NDNaGA8y
MTI2MTAwMTA4MDU0M1owGzEZMBcGA1UEAwwQbnNwYW5lbC13ZWItdGVzdDBZMBMG
ByqGSM49AgEGCCqGSM49AwEHA0IABHWGwgQvwTjIQl5fX5Vl4GlXGCWLwDKvsEyk
fcFRcm9yVtYOglZTmcMyJrk7SmFQaUcLmPWsDOOY1FkdWhWtbYSjUzBRMB0GA1Ud
DgQWBBTZq1MTZ2U69g3m2hAQ36WEFF5M7DAfBgNVHSMEGDAWgBTZq1MTZ2U69g3m
2hAQ36WEFF5M7DAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0cAMEQCIFTl
QSxAmnKg/aKVpb0xaspI9ewG4+IGp/uVzsHX+t9lAiBVwADoM5nsxGnZQwMh+ub2
qMH+xs/OZee1u6kG6epCXQ==
-----END CERTIFICATE-----
`;

type FakeAdapter = {
    log: Record<'silly' | 'debug' | 'info' | 'warn' | 'error', (msg: string) => void>;
    logged: { level: string; msg: string }[];
    getPortAsync: (port: number) => Promise<number>;
};

function fakeAdapter(): FakeAdapter & Record<string, unknown> {
    const logged: { level: string; msg: string }[] = [];
    const logger =
        (level: string) =>
        (msg: string): void => {
            logged.push({ level, msg });
        };
    return {
        log: {
            silly: logger('silly'),
            debug: logger('debug'),
            info: logger('info'),
            warn: logger('warn'),
            error: logger('error'),
        },
        logged,
        config: { debugLogMqtt: false },
        unload: false,
        library: {},
        namespace: 'nspanel-lovelace-ui.0',
        getPortAsync: async (port: number): Promise<number> => port,
        setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
        clearTimeout: (t: ReturnType<typeof setTimeout>) => clearTimeout(t),
        setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
        clearInterval: (t: ReturnType<typeof setInterval>) => clearInterval(t),
    };
}

const fakeManager = { listPanels: () => [], hasPanel: () => false } as unknown as VirtualPanelManager;

function server(pin: string, extra: Partial<WebServerOptions> = {}, adapter: FakeAdapter = fakeAdapter()): WebServer {
    return new WebServer(adapter as any, fakeManager, {
        port: 0,
        bind: '127.0.0.1',
        wwwPath: '/nonexistent',
        pin,
        secret: SECRET,
        wrongPinDelayMs: 0,
        ...extra,
    });
}

/** a free TCP port on 127.0.0.1 */
function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once('error', reject);
        probe.listen(0, '127.0.0.1', () => {
            const address = probe.address();
            const port = typeof address === 'object' && address ? address.port : 0;
            probe.close(() => resolve(port));
        });
    });
}

/**
 * GET over TLS, the self-signed certificate is accepted
 *
 * @param port port of the server
 * @param path request path
 * @returns status, headers and body
 */
function httpsGet(
    port: number,
    path: string,
): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }> {
    return new Promise((resolve, reject) => {
        const req = https.request({ host: '127.0.0.1', port, path, method: 'GET', rejectUnauthorized: false }, res => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => (body += chunk));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

describe('lib/web/web-server - pinToken', () => {
    it('is an HMAC-SHA256 of the PIN with the instance secret, empty for an empty PIN', () => {
        const token = pinToken(SECRET, '1234');
        expect(token).to.match(/^[0-9a-f]{64}$/);
        expect(pinToken(SECRET, '1234')).to.equal(token);
        expect(pinToken(SECRET, '1235')).to.not.equal(token);
        expect(pinToken('other-secret', '1234')).to.not.equal(token);
        expect(pinToken(SECRET, '')).to.equal('');
    });
});

describe('lib/web/web-server - helpers', () => {
    it('parses cookies', () => {
        expect(parseCookies(undefined)).to.deep.equal({});
        expect(parseCookies('a=1; nspanel_web_token=abc ; b=x%20y; broken')).to.deep.equal({
            a: '1',
            nspanel_web_token: 'abc',
            b: 'x y',
        });
    });

    it('only allows local paths as next', () => {
        expect(safeNext('/emu_topic')).to.equal('/emu_topic');
        expect(safeNext('/')).to.equal('/');
        expect(safeNext(undefined)).to.equal('/');
        expect(safeNext('')).to.equal('/');
        expect(safeNext('//evil.example')).to.equal('/');
        expect(safeNext('http://evil.example')).to.equal('/');
        expect(safeNext('emu_topic')).to.equal('/');
    });
});

describe('lib/web/web-server - PinGuard', () => {
    it('accepts the right PIN, rejects a wrong one and limits attempts per address', () => {
        const guard = new PinGuard(SECRET, '1234');
        expect(guard.enabled).to.equal(true);
        expect(guard.check('10.0.0.1', '1234', 1000)).to.equal('ok');
        for (let i = 0; i < PIN_ATTEMPTS_PER_MINUTE; i++) {
            expect(guard.check('10.0.0.1', '0000', 1000)).to.equal('wrong');
        }
        expect(guard.check('10.0.0.1', '0000', 1000)).to.equal('limited');
        // even the right PIN is refused while limited
        expect(guard.check('10.0.0.1', '1234', 1000)).to.equal('limited');
        // another address is not affected
        expect(guard.check('10.0.0.2', '1234', 1000)).to.equal('ok');
        // the window is over after a minute
        expect(guard.check('10.0.0.1', '1234', 1000 + 60_000)).to.equal('ok');
    });

    it('validates tokens', () => {
        const guard = new PinGuard(SECRET, '1234');
        expect(guard.isValidToken(pinToken(SECRET, '1234'))).to.equal(true);
        expect(guard.isValidToken(pinToken(SECRET, '0000'))).to.equal(false);
        expect(guard.isValidToken('')).to.equal(false);
        expect(guard.isValidToken(undefined)).to.equal(false);
    });

    it('is open without PIN', () => {
        const guard = new PinGuard(SECRET, '');
        expect(guard.enabled).to.equal(false);
        expect(guard.isValidToken(undefined)).to.equal(true);
        expect(guard.check('10.0.0.1', 'anything')).to.equal('ok');
    });
});

describe('lib/web/web-server - WebServer.authorize', () => {
    it('allows everything without PIN', () => {
        const s = server('');
        expect(s.authorize({ url: '/emu_topic', headers: {} })).to.equal(true);
        expect(s.authorize({ url: '/ws/emu_topic', headers: { cookie: 'x=y' } })).to.equal(true);
    });

    it('accepts the token cookie or ?token=, nothing else', () => {
        const s = server('1234');
        const token = pinToken(SECRET, '1234');
        expect(s.authorize({ url: '/emu_topic', headers: {} })).to.equal(false);
        expect(s.authorize({ url: '/emu_topic', headers: { cookie: `${WEB_TOKEN_COOKIE}=${token}` } })).to.equal(true);
        expect(s.authorize({ url: '/emu_topic', headers: { cookie: `${WEB_TOKEN_COOKIE}=wrong` } })).to.equal(false);
        expect(s.authorize({ url: `/ws/emu_topic?token=${token}`, headers: {} })).to.equal(true);
        expect(s.authorize({ url: `/ws/emu_topic?token=${token}x`, headers: {} })).to.equal(false);
        // the PIN itself is not a token
        expect(s.authorize({ url: `/ws/emu_topic?token=1234`, headers: {} })).to.equal(false);
    });
});

describe('lib/web/web-server - cookie', () => {
    it('marks the token cookie Secure only over https', () => {
        const tls = { key: TEST_KEY, cert: TEST_CERT };
        const plain = server('1234');
        expect(plain.secure).to.equal(false);
        expect(plain.protocol).to.equal('http');
        expect(plain.tokenCookie()).to.equal(
            `${WEB_TOKEN_COOKIE}=${pinToken(SECRET, '1234')}; Path=/; Max-Age=315360000; SameSite=Lax; HttpOnly`,
        );
        const secure = server('1234', { tls });
        expect(secure.secure).to.equal(true);
        expect(secure.protocol).to.equal('https');
        expect(secure.tokenCookie()).to.match(/; HttpOnly; Secure$/);
    });
});

describe('lib/web/web-server - https', () => {
    it('serves the panel list and sets a Secure cookie over TLS, logs an https address', async function () {
        this.timeout(10_000);
        const adapter = fakeAdapter();
        const port = await freePort();
        const s = server('1234', { port, tls: { key: TEST_KEY, cert: TEST_CERT } }, adapter);
        try {
            expect(await s.start()).to.equal(true);
            const started = adapter.logged.find(l => l.level === 'info' && l.msg.includes('Web panels available at'));
            expect(started?.msg).to.equal(`[WebServer] Web panels available at https://127.0.0.1:${port}/<topic>`);

            // without PIN: the PIN page over TLS
            const unauthorized = await httpsGet(port, '/');
            expect(unauthorized.status).to.equal(401);
            expect(unauthorized.body).to.contain('protected by a PIN');

            // ?pin= sets the cookie with Secure and redirects
            const login = await httpsGet(port, '/?pin=1234');
            expect(login.status).to.equal(302);
            expect(login.headers.location).to.equal('/');
            const cookie = ([] as string[]).concat(login.headers['set-cookie'] ?? []).join('\n');
            expect(cookie).to.contain(`${WEB_TOKEN_COOKIE}=${pinToken(SECRET, '1234')}`);
            expect(cookie).to.match(/; Secure(;|$)/m);

            // a websocket path answered over plain GET is still 426 (the upgrade runs over the same server)
            const ws = await httpsGet(port, '/ws/emu_topic');
            expect(ws.status).to.equal(426);
        } finally {
            await s.stop();
        }
    });

    it('does not start with an unusable certificate', async () => {
        const adapter = fakeAdapter();
        const port = await freePort();
        const s = server('', { port, tls: { key: 'not a key', cert: TEST_CERT } }, adapter);
        expect(await s.start()).to.equal(false);
        const error = adapter.logged.find(l => l.level === 'error');
        expect(error?.msg).to.contain('certificate is not usable');
        await s.stop();
    });

    it('logs a plain http address without tls', async () => {
        const adapter = fakeAdapter();
        const port = await freePort();
        const s = server('', { port }, adapter);
        try {
            expect(await s.start()).to.equal(true);
            const started = adapter.logged.find(l => l.level === 'info' && l.msg.includes('Web panels available at'));
            expect(started?.msg).to.equal(`[WebServer] Web panels available at http://127.0.0.1:${port}/<topic>`);
        } finally {
            await s.stop();
        }
    });
});

/**
 * POST JSON over TLS with a host name in the Host header (FIDO2 needs one)
 *
 * @param port port of the server
 * @param path request path
 * @param body JSON body
 * @param headers extra headers (Cookie, Host)
 * @returns status, headers and parsed body
 */
function httpsPost(
    port: number,
    path: string,
    body: unknown,
    headers: Record<string, string> = {},
): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; json: any }> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request(
            {
                host: '127.0.0.1',
                port,
                path,
                method: 'POST',
                rejectUnauthorized: false,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                    Host: `panel.home.lan:${port}`,
                    ...headers,
                },
            },
            res => {
                let text = '';
                res.setEncoding('utf8');
                res.on('data', chunk => (text += chunk));
                res.on('end', () => {
                    let json: any = undefined;
                    try {
                        json = text ? JSON.parse(text) : undefined;
                    } catch {
                        json = text;
                    }
                    resolve({ status: res.statusCode ?? 0, headers: res.headers, json });
                });
            },
        );
        req.on('error', reject);
        req.end(data);
    });
}

function fidoStore(): FidoCredentialStore {
    const objects = new Map<string, ioBroker.Object>();
    return new FidoCredentialStore({
        log: { debug: (): void => undefined, warn: (): void => undefined, error: (): void => undefined },
        getObjectAsync: async (id: string) => objects.get(id) ?? null,
        setObjectAsync: async (id: string, obj: ioBroker.SettableObject) => {
            objects.set(id, asStored(id, obj));
            return { id };
        },
    });
}

/** verifier that accepts every answer whose challenge is known (no signature check) */
function acceptingVerifiers(): FidoVerifiers {
    return {
        registration: async opts => {
            const challenge = JSON.parse(
                Buffer.from(opts.response.response.clientDataJSON, 'base64url').toString(),
            ).challenge;
            if (typeof opts.expectedChallenge !== 'function' || !(await opts.expectedChallenge(challenge))) {
                throw new Error('challenge');
            }
            return {
                verified: true,
                registrationInfo: {
                    fmt: 'none',
                    aaguid: '0',
                    credential: {
                        id: opts.response.id,
                        publicKey: Uint8Array.from([1]),
                        counter: 0,
                        transports: ['usb'],
                    },
                    credentialType: 'public-key',
                    attestationObject: Uint8Array.from([]),
                    userVerified: false,
                    credentialDeviceType: 'singleDevice',
                    credentialBackedUp: false,
                    origin: 'x',
                },
            };
        },
        authentication: async opts => {
            const challenge = JSON.parse(
                Buffer.from(opts.response.response.clientDataJSON, 'base64url').toString(),
            ).challenge;
            if (typeof opts.expectedChallenge !== 'function' || !(await opts.expectedChallenge(challenge))) {
                throw new Error('challenge');
            }
            return {
                verified: true,
                authenticationInfo: {
                    credentialID: opts.credential.id,
                    newCounter: 1,
                    userVerified: false,
                    credentialDeviceType: 'singleDevice',
                    credentialBackedUp: false,
                    origin: 'x',
                    rpID: 'panel.home.lan',
                },
            };
        },
    };
}

function answerFor(challenge: string, kind: 'register' | 'login', id = 'Y3JlZC0x'): unknown {
    const clientDataJSON = Buffer.from(JSON.stringify({ challenge })).toString('base64url');
    return {
        id,
        rawId: id,
        type: 'public-key',
        clientExtensionResults: {},
        response:
            kind === 'register'
                ? { clientDataJSON, attestationObject: 'AAAA', transports: ['usb'] }
                : { clientDataJSON, authenticatorData: 'AAAA', signature: 'BBBB' },
    };
}

describe('lib/web/web-server - FIDO2 routes', () => {
    const tls = { key: TEST_KEY, cert: TEST_CERT };
    const noLog = { debug: (): void => undefined, warn: (): void => undefined };

    it('answers 404 on every FIDO2 route while FIDO2 is off (https without service, http with service)', async () => {
        const port = await freePort();
        const s = server('1234', { port, tls });
        try {
            expect(await s.start()).to.equal(true);
            expect(s.fido).to.equal(undefined);
            expect((await httpsGet(port, '/auth/fido/register')).status).to.equal(404);
            expect((await httpsPost(port, '/auth/fido/login/options', {})).status).to.equal(404);
        } finally {
            await s.stop();
        }
        // a service without tls is ignored (browsers refuse WebAuthn on http anyway)
        const store = fidoStore();
        await store.load();
        const plain = server('1234', { fido: new FidoService({ rpName: 'x', store, log: noLog }) });
        expect(plain.fido).to.equal(undefined);
    });

    it('protects the register page and its routes with the PIN token, serves options and rejects garbage', async function () {
        this.timeout(10_000);
        const store = fidoStore();
        await store.load();
        const fido = new FidoService({ rpName: 'NSPanel', store, log: noLog });
        const port = await freePort();
        const s = server('1234', { port, tls, fido });
        const token = pinToken(SECRET, '1234');
        const cookie = { Cookie: `${WEB_TOKEN_COOKIE}=${token}` };
        try {
            expect(await s.start()).to.equal(true);
            // register page: 401 (PIN page) without token, 200 with token
            const denied = await httpsGet(port, '/auth/fido/register');
            expect(denied.status).to.equal(401);
            expect(denied.body).to.contain('protected by a PIN');
            const allowed = await httpsGet(port, `/auth/fido/register?token=${token}`);
            expect(allowed.status).to.equal(200);
            expect(allowed.body).to.contain('Register a security key');
            expect(allowed.body).to.contain('host name');
            expect(allowed.body).to.contain('trust the certificate');
            // options need the token too
            expect((await httpsPost(port, '/auth/fido/register/options', { name: 'k' })).status).to.equal(401);
            const options = await httpsPost(port, '/auth/fido/register/options', { name: 'Kitchen' }, cookie);
            expect(options.status).to.equal(200);
            expect(options.json.challenge).to.be.a('string');
            expect(options.json.rp.id).to.equal('panel.home.lan');
            // an IP address in the Host header is refused
            const ip = await httpsPost(
                port,
                '/auth/fido/register/options',
                { name: 'k' },
                { ...cookie, Host: `127.0.0.1:${port}` },
            );
            expect(ip.status).to.equal(400);
            expect(ip.json.error).to.contain('IP address');
            // garbage -> 400, invalid JSON -> 400
            const garbage = await httpsPost(port, '/auth/fido/register/verify', { nonsense: 1 }, cookie);
            expect(garbage.status).to.equal(400);
            expect(garbage.json.error).to.equal('invalid response');
            // no key registered: login options 404, PIN page without the FIDO button
            expect((await httpsPost(port, '/auth/fido/login/options', {})).status).to.equal(404);
            expect((await httpsGet(port, '/')).body).to.not.contain('fido-login');
            // the panel list links the register page
            expect((await httpsGet(port, `/?token=${token}`)).body).to.contain('/auth/fido/register');
        } finally {
            await s.stop();
        }
    });

    it('registers a key, shows the login button, logs in with the cookie and limits failures', async function () {
        this.timeout(10_000);
        const store = fidoStore();
        await store.load();
        const fido = new FidoService({ rpName: 'NSPanel', store, log: noLog, verifiers: acceptingVerifiers() });
        const port = await freePort();
        const adapter = fakeAdapter();
        const s = server('1234', { port, tls, fido }, adapter);
        const token = pinToken(SECRET, '1234');
        const cookie = { Cookie: `${WEB_TOKEN_COOKIE}=${token}` };
        try {
            expect(await s.start()).to.equal(true);
            const options = await httpsPost(port, '/auth/fido/register/options', { name: 'Kitchen' }, cookie);
            const registered = await httpsPost(
                port,
                '/auth/fido/register/verify',
                answerFor(options.json.challenge, 'register'),
                cookie,
            );
            expect(registered.status).to.equal(200);
            expect(registered.json).to.deep.equal({ id: 'Y3JlZC0x', name: 'Kitchen' });
            expect(store.get('Y3JlZC0x')?.name).to.equal('Kitchen');

            // now the PIN page offers the key
            const pinPage = await httpsGet(port, '/emu_topic');
            expect(pinPage.status).to.equal(401);
            expect(pinPage.body).to.contain('fido-login');
            expect(pinPage.body).to.contain('/auth/fido/login/options');

            // login without any token
            const loginOptions = await httpsPost(port, '/auth/fido/login/options', {});
            expect(loginOptions.status).to.equal(200);
            expect(loginOptions.json.allowCredentials.map((c: { id: string }) => c.id)).to.deep.equal(['Y3JlZC0x']);
            const login = await httpsPost(port, '/auth/fido/login/verify', {
                response: answerFor(loginOptions.json.challenge, 'login'),
                next: '/emu_topic',
            });
            expect(login.status).to.equal(200);
            expect(login.json).to.deep.equal({ ok: true, redirect: '/emu_topic', key: 'Kitchen' });
            const setCookie = ([] as string[]).concat(login.headers['set-cookie'] ?? []).join('\n');
            expect(setCookie).to.contain(`${WEB_TOKEN_COOKIE}=${token}`);
            expect(setCookie).to.match(/; Secure(;|$)/m);
            expect(store.get('Y3JlZC0x')?.lastUsedAt).to.be.a('number');

            // replayed challenge fails; after 5 failures the address is limited
            for (let i = 0; i < PIN_ATTEMPTS_PER_MINUTE; i++) {
                const bad = await httpsPost(port, '/auth/fido/login/verify', {
                    response: answerFor(loginOptions.json.challenge, 'login'),
                });
                expect(bad.status).to.equal(400);
                expect(bad.headers['set-cookie']).to.equal(undefined);
            }
            const limited = await httpsPost(port, '/auth/fido/login/verify', {
                response: answerFor(loginOptions.json.challenge, 'login'),
            });
            expect(limited.status).to.equal(429);
        } finally {
            await s.stop();
        }
    });

    it('sets no cookie on FIDO2 login when no PIN is configured', async function () {
        this.timeout(10_000);
        const store = fidoStore();
        await store.load();
        await store.add({ id: 'Y3JlZC0x', publicKey: 'AQ', counter: 0, name: 'k', createdAt: 1 });
        const fido = new FidoService({ rpName: 'NSPanel', store, log: noLog, verifiers: acceptingVerifiers() });
        const port = await freePort();
        const s = server('', { port, tls, fido });
        try {
            expect(await s.start()).to.equal(true);
            const loginOptions = await httpsPost(port, '/auth/fido/login/options', {});
            const login = await httpsPost(port, '/auth/fido/login/verify', {
                response: answerFor(loginOptions.json.challenge, 'login'),
                next: 'https://evil.example/',
            });
            expect(login.status).to.equal(200);
            expect(login.json.redirect).to.equal('/');
            expect(login.headers['set-cookie']).to.equal(undefined);
        } finally {
            await s.stop();
        }
    });
});
