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
var fido_store_exports = {};
__export(fido_store_exports, {
  FIDO_OBJECT_ID: () => FIDO_OBJECT_ID,
  FidoCredentialStore: () => FidoCredentialStore
});
module.exports = __toCommonJS(fido_store_exports);
const FIDO_OBJECT_ID = "web.fidoCredentials";
function isRecord(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value;
  return typeof v.id === "string" && v.id !== "" && typeof v.publicKey === "string" && typeof v.counter === "number" && typeof v.name === "string" && typeof v.createdAt === "number";
}
class FidoCredentialStore {
  adapter;
  credentials = [];
  loaded = false;
  constructor(adapter) {
    this.adapter = adapter;
  }
  /** true after `load()` */
  get isLoaded() {
    return this.loaded;
  }
  /**
   * Read the credentials from the object; creates the object when it does not exist.
   *
   * @returns the credentials
   */
  async load() {
    var _a;
    let obj;
    try {
      obj = await this.adapter.getObjectAsync(FIDO_OBJECT_ID);
    } catch (e) {
      this.adapter.log.warn(`Cannot read ${FIDO_OBJECT_ID}: ${String(e)}`);
      obj = void 0;
    }
    const raw = (_a = obj == null ? void 0 : obj.native) == null ? void 0 : _a.credentials;
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
  list() {
    return this.credentials.map((c) => ({ ...c, transports: c.transports ? [...c.transports] : void 0 }));
  }
  /**
   * Public summary for the admin.
   *
   * @returns name, times and transports of every credential
   */
  summaries() {
    return this.credentials.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt,
      transports: c.transports ? [...c.transports] : void 0
    }));
  }
  /** true if at least one key is registered */
  get hasCredentials() {
    return this.credentials.length > 0;
  }
  /**
   * One credential.
   *
   * @param id credential id (base64url)
   * @returns the credential or undefined
   */
  get(id) {
    const c = this.credentials.find((x) => x.id === id);
    return c ? { ...c } : void 0;
  }
  /**
   * Add a credential (replaces one with the same id).
   *
   * @param record the credential
   */
  async add(record) {
    this.credentials = this.credentials.filter((c) => c.id !== record.id);
    this.credentials.push({ ...record });
    await this.save();
  }
  /**
   * Remove a credential.
   *
   * @param id credential id
   * @returns true if it existed
   */
  async remove(id) {
    const before = this.credentials.length;
    this.credentials = this.credentials.filter((c) => c.id !== id);
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
  async touch(id, counter, now = Date.now()) {
    const c = this.credentials.find((x) => x.id === id);
    if (!c) {
      return;
    }
    c.counter = counter;
    c.lastUsedAt = now;
    await this.save();
  }
  async save() {
    const obj = {
      type: "meta",
      common: {
        name: "FIDO2 security keys of the web panels",
        type: "meta.user",
        expert: true
      },
      native: { credentials: this.credentials }
    };
    try {
      await this.adapter.setObjectAsync(FIDO_OBJECT_ID, obj);
    } catch (e) {
      this.adapter.log.error(`Cannot write ${FIDO_OBJECT_ID}: ${String(e)}`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FIDO_OBJECT_ID,
  FidoCredentialStore
});
//# sourceMappingURL=fido-store.js.map
