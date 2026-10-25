import { createHash } from 'node:crypto';
import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
    type VerifiedAuthenticationResponse,
    type VerifiedRegistrationResponse,
    type VerifyAuthenticationResponseOpts,
    type VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server';
import type { FidoCredentialStore } from './fido-store';

/** A challenge has to be answered within ... ms */
export const FIDO_CHALLENGE_TTL_MS = 120_000;
/** Failed verifications per source address and minute before 429 */
export const FIDO_ATTEMPTS_PER_MINUTE = 5;
/** Option requests (= new challenges) per source address and minute */
export const FIDO_OPTIONS_PER_MINUTE = 30;
/** Most challenges kept at once (oldest are dropped) */
const MAX_CHALLENGES = 1000;
/** Longest key name */
export const FIDO_NAME_MAX = 64;
/** Shown to the user as the account name in the authenticator */
const FIDO_USER_NAME = 'nspanel-web-panels';

/** Where the browser talks to: relying party id (host name) and origin */
export type FidoRelyingParty = { rpId: string; origin: string };

/** Result of a verification: ok or an error with HTTP status */
export type FidoResult<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

/** Verification functions (replaceable for tests - a real authenticator answer cannot be produced) */
export type FidoVerifiers = {
    registration: (opts: VerifyRegistrationResponseOpts) => Promise<VerifiedRegistrationResponse>;
    authentication: (opts: VerifyAuthenticationResponseOpts) => Promise<VerifiedAuthenticationResponse>;
};

export type FidoServiceOptions = {
    /** shown in the authenticator dialog */
    rpName: string;
    store: FidoCredentialStore;
    log: { debug: (msg: string) => void; warn: (msg: string) => void };
    /** clock (tests) */
    now?: () => number;
    verifiers?: FidoVerifiers;
};

/**
 * Counts events per source address in a sliding minute.
 */
export class RateLimiter {
    private readonly max: number;
    private readonly windowMs: number;
    private entries: Map<string, { count: number; resetAt: number }> = new Map();

    constructor(max: number, windowMs: number = 60_000) {
        this.max = max;
        this.windowMs = windowMs;
    }

    /**
     * Is the address over the limit?
     *
     * @param ip source address
     * @param now current time
     * @returns true if no more events are allowed right now
     */
    isLimited(ip: string, now: number = Date.now()): boolean {
        const entry = this.entries.get(ip);
        if (!entry) {
            return false;
        }
        if (entry.resetAt <= now) {
            this.entries.delete(ip);
            return false;
        }
        return entry.count >= this.max;
    }

    /**
     * Count one event.
     *
     * @param ip source address
     * @param now current time
     */
    hit(ip: string, now: number = Date.now()): void {
        let entry = this.entries.get(ip);
        if (entry && entry.resetAt <= now) {
            entry = undefined;
        }
        if (!entry) {
            entry = { count: 0, resetAt: now + this.windowMs };
            this.entries.set(ip, entry);
        }
        entry.count++;
        if (this.entries.size > 1000) {
            for (const [key, value] of this.entries) {
                if (value.resetAt <= now) {
                    this.entries.delete(key);
                }
            }
        }
    }

    /**
     * Forget an address (after success).
     *
     * @param ip source address
     */
    reset(ip: string): void {
        this.entries.delete(ip);
    }
}

/**
 * Relying party from the `Host` header of a request. WebAuthn does not allow IP addresses as
 * rpId, so those are rejected.
 *
 * @param hostHeader the `Host` header (`name[:port]`, `[v6]:port`)
 * @param port port of the server (used when the header has none)
 * @returns rpId and origin or an error text
 */
export function relyingPartyFromHost(hostHeader: string | undefined, port: number): FidoRelyingParty | string {
    const host = (hostHeader ?? '').trim();
    if (!host) {
        return 'missing Host header';
    }
    if (host.startsWith('[')) {
        return 'FIDO2 needs a host name - an IPv6 address cannot be used';
    }
    const colon = host.lastIndexOf(':');
    const name = (colon === -1 ? host : host.slice(0, colon)).toLowerCase();
    const portPart = colon === -1 ? String(port) : host.slice(colon + 1);
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.?$/.test(name)) {
        return 'FIDO2 needs a valid host name';
    }
    if (/^\d+(\.\d+){3}$/.test(name)) {
        return 'FIDO2 needs a host name - an IP address cannot be used';
    }
    if (!/^\d+$/.test(portPart)) {
        return 'invalid port in Host header';
    }
    const rpId = name.replace(/\.$/, '');
    const origin = portPart === '443' ? `https://${rpId}` : `https://${rpId}:${portPart}`;
    return { rpId, origin };
}

type PendingChallenge = { kind: 'register' | 'login'; expiresAt: number; name?: string };

/**
 * FIDO2/WebAuthn registration and login for the web panels (one shared "user", several keys).
 * Challenges live in memory, expire after 2 minutes and are consumed on first use.
 */
export class FidoService {
    private readonly rpName: string;
    private readonly store: FidoCredentialStore;
    private readonly log: FidoServiceOptions['log'];
    private readonly now: () => number;
    private readonly verifiers: FidoVerifiers;
    private readonly challenges: Map<string, PendingChallenge> = new Map();
    /** failed verifications per address */
    readonly failures = new RateLimiter(FIDO_ATTEMPTS_PER_MINUTE);
    /** option requests per address */
    readonly requests = new RateLimiter(FIDO_OPTIONS_PER_MINUTE);

    constructor(options: FidoServiceOptions) {
        this.rpName = options.rpName;
        this.store = options.store;
        this.log = options.log;
        this.now = options.now ?? ((): number => Date.now());
        this.verifiers = options.verifiers ?? {
            registration: verifyRegistrationResponse,
            authentication: verifyAuthenticationResponse,
        };
    }

    /** true if a key can be used for login */
    get hasCredentials(): boolean {
        return this.store.hasCredentials;
    }

    /** number of challenges waiting for an answer (tests) */
    get pendingChallenges(): number {
        this.sweep();
        return this.challenges.size;
    }

    /**
     * Options for `navigator.credentials.create()`.
     *
     * @param rp relying party of the request
     * @param name name of the new key
     * @returns the options (JSON) or an error
     */
    async registrationOptions(rp: FidoRelyingParty, name: string): Promise<FidoResult<object>> {
        const keyName = name.trim().slice(0, FIDO_NAME_MAX);
        if (!keyName) {
            return { ok: false, status: 400, error: 'name missing' };
        }
        const options = await generateRegistrationOptions({
            rpName: this.rpName,
            rpID: rp.rpId,
            userName: FIDO_USER_NAME,
            userDisplayName: this.rpName,
            userID: userId(),
            attestationType: 'none',
            excludeCredentials: this.store.list().map(c => ({ id: c.id, transports: c.transports })),
            authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
            timeout: FIDO_CHALLENGE_TTL_MS,
        });
        this.remember(options.challenge, {
            kind: 'register',
            expiresAt: this.now() + FIDO_CHALLENGE_TTL_MS,
            name: keyName,
        });
        return { ok: true, value: options };
    }

    /**
     * Verify the answer of `navigator.credentials.create()` and store the key.
     *
     * @param rp relying party of the request
     * @param body parsed JSON body (`{ response }` or the response itself)
     * @returns name of the stored key or an error
     */
    async verifyRegistration(rp: FidoRelyingParty, body: unknown): Promise<FidoResult<{ id: string; name: string }>> {
        const response = toRegistrationResponse(body);
        if (!response) {
            return { ok: false, status: 400, error: 'invalid response' };
        }
        let pending: PendingChallenge | undefined;
        let verification: VerifiedRegistrationResponse;
        try {
            verification = await this.verifiers.registration({
                response,
                expectedChallenge: (challenge: string): boolean => {
                    pending = this.consume(challenge, 'register');
                    return pending !== undefined;
                },
                expectedOrigin: rp.origin,
                expectedRPID: rp.rpId,
                requireUserVerification: false,
            });
        } catch (e) {
            this.log.debug(`FIDO2 registration rejected: ${e instanceof Error ? e.message : String(e)}`);
            return { ok: false, status: 400, error: pending ? 'verification failed' : 'unknown or expired challenge' };
        }
        if (!verification.verified || !pending) {
            return { ok: false, status: 400, error: 'verification failed' };
        }
        const credential = verification.registrationInfo.credential;
        const record = {
            id: credential.id,
            publicKey: Buffer.from(credential.publicKey).toString('base64url'),
            counter: credential.counter,
            transports: credential.transports,
            name: pending.name ?? 'Security key',
            createdAt: this.now(),
        };
        await this.store.add(record);
        this.log.debug(`FIDO2 key "${record.name}" registered`);
        return { ok: true, value: { id: record.id, name: record.name } };
    }

    /**
     * Options for `navigator.credentials.get()`; lists the registered keys as allowCredentials.
     *
     * @param rp relying party of the request
     * @returns the options (JSON) or an error
     */
    async authenticationOptions(rp: FidoRelyingParty): Promise<FidoResult<object>> {
        if (!this.store.hasCredentials) {
            return { ok: false, status: 404, error: 'no security key registered' };
        }
        const options = await generateAuthenticationOptions({
            rpID: rp.rpId,
            allowCredentials: this.store.list().map(c => ({ id: c.id, transports: c.transports })),
            userVerification: 'preferred',
            timeout: FIDO_CHALLENGE_TTL_MS,
        });
        this.remember(options.challenge, { kind: 'login', expiresAt: this.now() + FIDO_CHALLENGE_TTL_MS });
        return { ok: true, value: options };
    }

    /**
     * Verify the answer of `navigator.credentials.get()`; updates counter and last use.
     *
     * @param rp relying party of the request
     * @param body parsed JSON body (`{ response }` or the response itself)
     * @returns id and name of the key or an error
     */
    async verifyAuthentication(rp: FidoRelyingParty, body: unknown): Promise<FidoResult<{ id: string; name: string }>> {
        const response = toAuthenticationResponse(body);
        if (!response) {
            return { ok: false, status: 400, error: 'invalid response' };
        }
        const credential = this.store.get(response.id);
        if (!credential) {
            return { ok: false, status: 400, error: 'unknown security key' };
        }
        let pending: PendingChallenge | undefined;
        let verification: VerifiedAuthenticationResponse;
        try {
            verification = await this.verifiers.authentication({
                response,
                expectedChallenge: (challenge: string): boolean => {
                    pending = this.consume(challenge, 'login');
                    return pending !== undefined;
                },
                expectedOrigin: rp.origin,
                expectedRPID: rp.rpId,
                credential: {
                    id: credential.id,
                    publicKey: Uint8Array.from(Buffer.from(credential.publicKey, 'base64url')),
                    counter: credential.counter,
                    transports: credential.transports,
                },
                requireUserVerification: false,
            });
        } catch (e) {
            this.log.debug(`FIDO2 login rejected: ${e instanceof Error ? e.message : String(e)}`);
            return { ok: false, status: 400, error: pending ? 'verification failed' : 'unknown or expired challenge' };
        }
        if (!verification.verified || !pending) {
            return { ok: false, status: 400, error: 'verification failed' };
        }
        await this.store.touch(credential.id, verification.authenticationInfo.newCounter, this.now());
        this.log.debug(`FIDO2 login with key "${credential.name}"`);
        return { ok: true, value: { id: credential.id, name: credential.name } };
    }

    private remember(challenge: string, pending: PendingChallenge): void {
        this.sweep();
        if (this.challenges.size >= MAX_CHALLENGES) {
            const oldest = this.challenges.keys().next().value;
            if (oldest !== undefined) {
                this.challenges.delete(oldest);
            }
        }
        this.challenges.set(challenge, pending);
    }

    /**
     * Take a challenge out of the map - every challenge is good for one answer.
     *
     * @param challenge the challenge from the client data
     * @param kind register or login
     * @returns the pending entry, undefined if unknown, expired or of the other kind
     */
    private consume(challenge: string, kind: PendingChallenge['kind']): PendingChallenge | undefined {
        const pending = this.challenges.get(challenge);
        if (!pending) {
            return undefined;
        }
        this.challenges.delete(challenge);
        if (pending.kind !== kind || pending.expiresAt <= this.now()) {
            return undefined;
        }
        return pending;
    }

    private sweep(): void {
        const now = this.now();
        for (const [key, value] of this.challenges) {
            if (value.expiresAt <= now) {
                this.challenges.delete(key);
            }
        }
    }
}

/** stable user handle: the web panels are one "user" with several keys */
function userId(): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(createHash('sha256').update(FIDO_USER_NAME).digest());
}

type RegistrationResponseJSON = VerifyRegistrationResponseOpts['response'];
type AuthenticationResponseJSON = VerifyAuthenticationResponseOpts['response'];

/**
 * `{ response: {...} }` or the credential JSON itself - the common part of both answers.
 *
 * @param body parsed JSON body
 * @returns id, rawId and the inner response, undefined for a wrong shape
 */
function credentialJson(body: unknown): { id: string; rawId: string; response: Record<string, unknown> } | undefined {
    if (typeof body !== 'object' || body === null) {
        return undefined;
    }
    const b = body as Record<string, unknown>;
    const inner = b.response;
    const candidate: unknown = typeof inner === 'object' && inner !== null && 'rawId' in inner ? inner : b;
    if (typeof candidate !== 'object' || candidate === null) {
        return undefined;
    }
    const c = candidate as Record<string, unknown>;
    if (
        typeof c.id !== 'string' ||
        typeof c.rawId !== 'string' ||
        typeof c.response !== 'object' ||
        c.response === null
    ) {
        return undefined;
    }
    return { id: c.id, rawId: c.rawId, response: c.response as Record<string, unknown> };
}

function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

/**
 * The answer of `navigator.credentials.create()` with only the known fields.
 *
 * @param body parsed JSON body
 * @returns the response or undefined if the shape is wrong
 */
export function toRegistrationResponse(body: unknown): RegistrationResponseJSON | undefined {
    const c = credentialJson(body);
    if (!c || typeof c.response.clientDataJSON !== 'string' || typeof c.response.attestationObject !== 'string') {
        return undefined;
    }
    const transports = Array.isArray(c.response.transports)
        ? c.response.transports.filter((t): t is string => typeof t === 'string')
        : undefined;
    return {
        id: c.id,
        rawId: c.rawId,
        type: 'public-key',
        clientExtensionResults: {},
        response: {
            clientDataJSON: c.response.clientDataJSON,
            attestationObject: c.response.attestationObject,
            authenticatorData: optionalString(c.response.authenticatorData),
            publicKey: optionalString(c.response.publicKey),
            publicKeyAlgorithm:
                typeof c.response.publicKeyAlgorithm === 'number' ? c.response.publicKeyAlgorithm : undefined,
            transports,
        },
    };
}

/**
 * The answer of `navigator.credentials.get()` with only the known fields.
 *
 * @param body parsed JSON body
 * @returns the response or undefined if the shape is wrong
 */
export function toAuthenticationResponse(body: unknown): AuthenticationResponseJSON | undefined {
    const c = credentialJson(body);
    if (
        !c ||
        typeof c.response.clientDataJSON !== 'string' ||
        typeof c.response.authenticatorData !== 'string' ||
        typeof c.response.signature !== 'string'
    ) {
        return undefined;
    }
    return {
        id: c.id,
        rawId: c.rawId,
        type: 'public-key',
        clientExtensionResults: {},
        response: {
            clientDataJSON: c.response.clientDataJSON,
            authenticatorData: c.response.authenticatorData,
            signature: c.response.signature,
            userHandle: optionalString(c.response.userHandle),
        },
    };
}
