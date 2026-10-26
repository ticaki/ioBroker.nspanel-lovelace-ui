"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var fido_exports = {};
__export(fido_exports, {
  FIDO_ATTEMPTS_PER_MINUTE: () => FIDO_ATTEMPTS_PER_MINUTE,
  FIDO_CHALLENGE_TTL_MS: () => FIDO_CHALLENGE_TTL_MS,
  FIDO_NAME_MAX: () => FIDO_NAME_MAX,
  FIDO_OPTIONS_PER_MINUTE: () => FIDO_OPTIONS_PER_MINUTE,
  FidoService: () => FidoService,
  RateLimiter: () => RateLimiter,
  relyingPartyFromHost: () => relyingPartyFromHost,
  toAuthenticationResponse: () => toAuthenticationResponse,
  toRegistrationResponse: () => toRegistrationResponse
});
module.exports = __toCommonJS(fido_exports);
var import_node_crypto = require("node:crypto");
var import_server = require("@simplewebauthn/server");
const FIDO_CHALLENGE_TTL_MS = 12e4;
const FIDO_ATTEMPTS_PER_MINUTE = 5;
const FIDO_OPTIONS_PER_MINUTE = 30;
const MAX_CHALLENGES = 1e3;
const FIDO_NAME_MAX = 64;
const FIDO_USER_NAME = "nspanel-web-panels";
class RateLimiter {
  max;
  windowMs;
  entries = /* @__PURE__ */ new Map();
  constructor(max, windowMs = 6e4) {
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
  isLimited(ip, now = Date.now()) {
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
  hit(ip, now = Date.now()) {
    let entry = this.entries.get(ip);
    if (entry && entry.resetAt <= now) {
      entry = void 0;
    }
    if (!entry) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.entries.set(ip, entry);
    }
    entry.count++;
    if (this.entries.size > 1e3) {
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
  reset(ip) {
    this.entries.delete(ip);
  }
}
function relyingPartyFromHost(hostHeader, port) {
  const host = (hostHeader != null ? hostHeader : "").trim();
  if (!host) {
    return "missing Host header";
  }
  if (host.startsWith("[")) {
    return "FIDO2 needs a host name - an IPv6 address cannot be used";
  }
  const colon = host.lastIndexOf(":");
  const name = (colon === -1 ? host : host.slice(0, colon)).toLowerCase();
  const portPart = colon === -1 ? String(port) : host.slice(colon + 1);
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.?$/.test(name)) {
    return "FIDO2 needs a valid host name";
  }
  if (/^\d+(\.\d+){3}$/.test(name)) {
    return "FIDO2 needs a host name - an IP address cannot be used";
  }
  if (!/^\d+$/.test(portPart)) {
    return "invalid port in Host header";
  }
  const rpId = name.replace(/\.$/, "");
  const origin = portPart === "443" ? `https://${rpId}` : `https://${rpId}:${portPart}`;
  return { rpId, origin };
}
class FidoService {
  rpName;
  store;
  log;
  now;
  verifiers;
  challenges = /* @__PURE__ */ new Map();
  /** failed verifications per address */
  failures = new RateLimiter(FIDO_ATTEMPTS_PER_MINUTE);
  /** option requests per address */
  requests = new RateLimiter(FIDO_OPTIONS_PER_MINUTE);
  constructor(options) {
    var _a, _b;
    this.rpName = options.rpName;
    this.store = options.store;
    this.log = options.log;
    this.now = (_a = options.now) != null ? _a : (() => Date.now());
    this.verifiers = (_b = options.verifiers) != null ? _b : {
      registration: import_server.verifyRegistrationResponse,
      authentication: import_server.verifyAuthenticationResponse
    };
  }
  /** true if a key can be used for login */
  get hasCredentials() {
    return this.store.hasCredentials;
  }
  /** number of challenges waiting for an answer (tests) */
  get pendingChallenges() {
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
  async registrationOptions(rp, name) {
    const keyName = name.trim().slice(0, FIDO_NAME_MAX);
    if (!keyName) {
      return { ok: false, status: 400, error: "name missing" };
    }
    const options = await (0, import_server.generateRegistrationOptions)({
      rpName: this.rpName,
      rpID: rp.rpId,
      userName: FIDO_USER_NAME,
      userDisplayName: this.rpName,
      userID: userId(),
      attestationType: "none",
      excludeCredentials: this.store.list().map((c) => ({ id: c.id, transports: c.transports })),
      authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
      timeout: FIDO_CHALLENGE_TTL_MS
    });
    this.remember(options.challenge, {
      kind: "register",
      expiresAt: this.now() + FIDO_CHALLENGE_TTL_MS,
      name: keyName
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
  async verifyRegistration(rp, body) {
    var _a;
    const response = toRegistrationResponse(body);
    if (!response) {
      return { ok: false, status: 400, error: "invalid response" };
    }
    let pending;
    let verification;
    try {
      verification = await this.verifiers.registration({
        response,
        expectedChallenge: (challenge) => {
          pending = this.consume(challenge, "register");
          return pending !== void 0;
        },
        expectedOrigin: rp.origin,
        expectedRPID: rp.rpId,
        requireUserVerification: false
      });
    } catch (e) {
      this.log.debug(`FIDO2 registration rejected: ${e instanceof Error ? e.message : String(e)}`);
      return { ok: false, status: 400, error: pending ? "verification failed" : "unknown or expired challenge" };
    }
    if (!verification.verified || !pending) {
      return { ok: false, status: 400, error: "verification failed" };
    }
    const credential = verification.registrationInfo.credential;
    const record = {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports,
      name: (_a = pending.name) != null ? _a : "Security key",
      createdAt: this.now()
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
  async authenticationOptions(rp) {
    if (!this.store.hasCredentials) {
      return { ok: false, status: 404, error: "no security key registered" };
    }
    const options = await (0, import_server.generateAuthenticationOptions)({
      rpID: rp.rpId,
      allowCredentials: this.store.list().map((c) => ({ id: c.id, transports: c.transports })),
      userVerification: "preferred",
      timeout: FIDO_CHALLENGE_TTL_MS
    });
    this.remember(options.challenge, { kind: "login", expiresAt: this.now() + FIDO_CHALLENGE_TTL_MS });
    return { ok: true, value: options };
  }
  /**
   * Verify the answer of `navigator.credentials.get()`; updates counter and last use.
   *
   * @param rp relying party of the request
   * @param body parsed JSON body (`{ response }` or the response itself)
   * @returns id and name of the key or an error
   */
  async verifyAuthentication(rp, body) {
    const response = toAuthenticationResponse(body);
    if (!response) {
      return { ok: false, status: 400, error: "invalid response" };
    }
    const credential = this.store.get(response.id);
    if (!credential) {
      return { ok: false, status: 400, error: "unknown security key" };
    }
    let pending;
    let verification;
    try {
      verification = await this.verifiers.authentication({
        response,
        expectedChallenge: (challenge) => {
          pending = this.consume(challenge, "login");
          return pending !== void 0;
        },
        expectedOrigin: rp.origin,
        expectedRPID: rp.rpId,
        credential: {
          id: credential.id,
          publicKey: Uint8Array.from(Buffer.from(credential.publicKey, "base64url")),
          counter: credential.counter,
          transports: credential.transports
        },
        requireUserVerification: false
      });
    } catch (e) {
      this.log.debug(`FIDO2 login rejected: ${e instanceof Error ? e.message : String(e)}`);
      return { ok: false, status: 400, error: pending ? "verification failed" : "unknown or expired challenge" };
    }
    if (!verification.verified || !pending) {
      return { ok: false, status: 400, error: "verification failed" };
    }
    await this.store.touch(credential.id, verification.authenticationInfo.newCounter, this.now());
    this.log.debug(`FIDO2 login with key "${credential.name}"`);
    return { ok: true, value: { id: credential.id, name: credential.name } };
  }
  remember(challenge, pending) {
    this.sweep();
    if (this.challenges.size >= MAX_CHALLENGES) {
      const oldest = this.challenges.keys().next().value;
      if (oldest !== void 0) {
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
  consume(challenge, kind) {
    const pending = this.challenges.get(challenge);
    if (!pending) {
      return void 0;
    }
    this.challenges.delete(challenge);
    if (pending.kind !== kind || pending.expiresAt <= this.now()) {
      return void 0;
    }
    return pending;
  }
  sweep() {
    const now = this.now();
    for (const [key, value] of this.challenges) {
      if (value.expiresAt <= now) {
        this.challenges.delete(key);
      }
    }
  }
}
function userId() {
  return Uint8Array.from((0, import_node_crypto.createHash)("sha256").update(FIDO_USER_NAME).digest());
}
function credentialJson(body) {
  if (typeof body !== "object" || body === null) {
    return void 0;
  }
  const b = body;
  const inner = b.response;
  const candidate = typeof inner === "object" && inner !== null && "rawId" in inner ? inner : b;
  if (typeof candidate !== "object" || candidate === null) {
    return void 0;
  }
  const c = candidate;
  if (typeof c.id !== "string" || typeof c.rawId !== "string" || typeof c.response !== "object" || c.response === null) {
    return void 0;
  }
  return { id: c.id, rawId: c.rawId, response: c.response };
}
function optionalString(value) {
  return typeof value === "string" ? value : void 0;
}
function toRegistrationResponse(body) {
  const c = credentialJson(body);
  if (!c || typeof c.response.clientDataJSON !== "string" || typeof c.response.attestationObject !== "string") {
    return void 0;
  }
  const transports = Array.isArray(c.response.transports) ? c.response.transports.filter((t) => typeof t === "string") : void 0;
  return {
    id: c.id,
    rawId: c.rawId,
    type: "public-key",
    clientExtensionResults: {},
    response: {
      clientDataJSON: c.response.clientDataJSON,
      attestationObject: c.response.attestationObject,
      authenticatorData: optionalString(c.response.authenticatorData),
      publicKey: optionalString(c.response.publicKey),
      publicKeyAlgorithm: typeof c.response.publicKeyAlgorithm === "number" ? c.response.publicKeyAlgorithm : void 0,
      transports
    }
  };
}
function toAuthenticationResponse(body) {
  const c = credentialJson(body);
  if (!c || typeof c.response.clientDataJSON !== "string" || typeof c.response.authenticatorData !== "string" || typeof c.response.signature !== "string") {
    return void 0;
  }
  return {
    id: c.id,
    rawId: c.rawId,
    type: "public-key",
    clientExtensionResults: {},
    response: {
      clientDataJSON: c.response.clientDataJSON,
      authenticatorData: c.response.authenticatorData,
      signature: c.response.signature,
      userHandle: optionalString(c.response.userHandle)
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FIDO_ATTEMPTS_PER_MINUTE,
  FIDO_CHALLENGE_TTL_MS,
  FIDO_NAME_MAX,
  FIDO_OPTIONS_PER_MINUTE,
  FidoService,
  RateLimiter,
  relyingPartyFromHost,
  toAuthenticationResponse,
  toRegistrationResponse
});
//# sourceMappingURL=fido.js.map
