"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var http_server_exports = {};
__export(http_server_exports, {
  HTTPServerClass: () => HTTPServerClass,
  NoopFileResolver: () => NoopFileResolver,
  ProxyCacheResolver: () => ProxyCacheResolver,
  defaultTftStorageDir: () => defaultTftStorageDir,
  extractModelFromFilename: () => extractModelFromFilename,
  parseRangeHeader: () => parseRangeHeader,
  resolveRange: () => resolveRange
});
module.exports = __toCommonJS(http_server_exports);
var http = __toESM(require("node:http"));
var fs = __toESM(require("node:fs"));
var fsp = __toESM(require("node:fs/promises"));
var path = __toESM(require("node:path"));
var os = __toESM(require("node:os"));
var import_node_buffer = require("node:buffer");
var import_library = require("../controller/library");
class NoopFileResolver {
  async resolve(_file) {
    return null;
  }
}
const TFT_FILENAME_RE = /^[A-Za-z0-9._-]+\.tft$/;
const MODEL_FROM_FILENAME_RE = /^(nspanel(?:-[a-z]+)*?)-v\d/;
const DEFAULT_KEEP_PER_MODEL = 2;
const DOWNLOAD_TIMEOUT_MS = 3e4;
function defaultTftStorageDir() {
  return path.join(os.tmpdir(), "iobroker-nspanel-tft");
}
function extractModelFromFilename(filename) {
  const m = MODEL_FROM_FILENAME_RE.exec(filename);
  return m ? m[1] : null;
}
class ProxyCacheResolver {
  cacheDir;
  upstreamBase;
  keepPerModel;
  locks = /* @__PURE__ */ new Map();
  log;
  constructor(cacheDir, upstreamBase, log, keepPerModel = DEFAULT_KEEP_PER_MODEL) {
    this.cacheDir = cacheDir;
    this.upstreamBase = upstreamBase.replace(/\/+$/, "");
    this.log = log;
    this.keepPerModel = Math.max(1, keepPerModel);
  }
  async resolve(file) {
    if (!TFT_FILENAME_RE.test(file)) {
      return null;
    }
    const target = path.join(this.cacheDir, file);
    try {
      const st = await fsp.stat(target);
      return st.isFile() ? { absolutePath: target, size: st.size } : null;
    } catch {
      return null;
    }
  }
  async ensureCached(file) {
    if (!TFT_FILENAME_RE.test(file)) {
      this.log.warn(`Rejected non-.tft filename: ${file}`);
      return null;
    }
    const existing = await this.resolve(file);
    if (existing) {
      return existing;
    }
    const inflight = this.locks.get(file);
    if (inflight) {
      await inflight;
      return this.resolve(file);
    }
    const lock = (async () => {
      try {
        await this.downloadWithRetry(file);
      } finally {
        this.locks.delete(file);
      }
    })();
    this.locks.set(file, lock);
    try {
      await lock;
    } catch (e) {
      this.log.error(
        `Failed to fetch TFT "${file}" from upstream: ${e instanceof Error ? e.message : String(e)}`
      );
      return null;
    }
    const result = await this.resolve(file);
    if (result) {
      try {
        await this.enforceLRU(file);
      } catch (e) {
        this.log.warn(`LRU cleanup failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return result;
  }
  async downloadWithRetry(file) {
    const url = `${this.upstreamBase}/${encodeURIComponent(file)}`;
    let lastErr;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.downloadOnce(url, file);
        return;
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        if (attempt < 2) {
          this.log.warn(`Upstream download attempt ${attempt} failed for ${file}: ${msg} \u2014 retrying once.`);
        } else {
          this.log.warn(`Upstream download attempt ${attempt} failed for ${file}: ${msg}`);
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
  async downloadOnce(url, file) {
    await fsp.mkdir(this.cacheDir, { recursive: true });
    const tmp = path.join(this.cacheDir, `${file}.partial`);
    const final = path.join(this.cacheDir, file);
    try {
      await fsp.unlink(tmp);
    } catch {
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    let out = null;
    try {
      const resp = await fetch(url, { signal: controller.signal, redirect: "follow" });
      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText} for ${url}`);
      }
      this.log.info(`Downloading TFT from ${url} (status ${resp.status})`);
      out = fs.createWriteStream(tmp);
      const writeStream = out;
      const reader = resp.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (value && value.byteLength) {
            if (!writeStream.write(import_node_buffer.Buffer.from(value))) {
              await new Promise((resolve) => writeStream.once("drain", () => resolve()));
            }
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
        }
      }
      await new Promise((resolve, reject) => {
        writeStream.end(() => resolve());
        writeStream.once("error", reject);
      });
      out = null;
      await fsp.rename(tmp, final);
      this.log.info(`Cached TFT to ${final}`);
    } catch (e) {
      if (out) {
        try {
          out.destroy();
        } catch {
        }
      }
      try {
        await fsp.unlink(tmp);
      } catch {
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  async enforceLRU(justAdded) {
    const model = extractModelFromFilename(justAdded);
    if (!model) {
      return;
    }
    const names = await fsp.readdir(this.cacheDir).catch(() => []);
    const candidates = [];
    for (const n of names) {
      if (!TFT_FILENAME_RE.test(n) || extractModelFromFilename(n) !== model) {
        continue;
      }
      try {
        const st = await fsp.stat(path.join(this.cacheDir, n));
        candidates.push({ name: n, mtimeMs: st.mtimeMs });
      } catch {
      }
    }
    if (candidates.length <= this.keepPerModel) {
      return;
    }
    candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const toDelete = candidates.slice(this.keepPerModel);
    for (const e of toDelete) {
      try {
        await fsp.unlink(path.join(this.cacheDir, e.name));
        this.log.info(`LRU cleanup: removed "${e.name}" (keep ${this.keepPerModel} per model "${model}")`);
      } catch (err) {
        this.log.warn(
          `LRU cleanup: failed to remove "${e.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }
}
function parseRangeHeader(header) {
  if (!header) {
    return null;
  }
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) {
    return null;
  }
  const startStr = m[1];
  const endStr = m[2];
  if (startStr === "" && endStr === "") {
    return null;
  }
  if (startStr === "") {
    const suffix = Number(endStr);
    return Number.isFinite(suffix) ? { suffix } : null;
  }
  const start = Number(startStr);
  if (!Number.isFinite(start)) {
    return null;
  }
  if (endStr === "") {
    return { start };
  }
  const end = Number(endStr);
  if (!Number.isFinite(end)) {
    return null;
  }
  return { start, end };
}
function resolveRange(range, size) {
  if (size <= 0) {
    return null;
  }
  if (!range) {
    return { start: 0, end: size - 1, length: size, full: true };
  }
  let start;
  let end = size - 1;
  if (range.suffix !== void 0) {
    if (range.suffix <= 0) {
      return null;
    }
    start = Math.max(0, size - range.suffix);
  } else {
    if (range.start === void 0) {
      return null;
    }
    start = range.start;
    if (range.end !== void 0) {
      end = Math.min(range.end, size - 1);
    }
  }
  if (start < 0 || start >= size || start > end) {
    return null;
  }
  return { start, end, length: end - start + 1, full: false };
}
const DEFAULT_IDLE_SHUTDOWN_MS = 10 * 60 * 1e3;
class HTTPServerClass extends import_library.BaseClass {
  server;
  port = 0;
  bindAddress;
  requestedPort;
  resolver;
  ready = false;
  idleShutdownMs;
  idleTimer;
  activeRequests = 0;
  startInflight;
  /**
   * Build (without listening) an on-demand HTTP server. Call `ensureStarted()` to listen.
   *
   * @param adapter ioBroker adapter instance (for logging).
   * @param port TCP port to bind (`0` lets the OS choose a free port).
   * @param bindAddress IP address to bind to (e.g. `0.0.0.0`).
   * @param resolver Resolver providing TFT files & ranges to serve.
   * @param idleShutdownMs Time (ms) of inactivity after which the server auto-stops.
   */
  static createHTTPServer(adapter, port, bindAddress, resolver, idleShutdownMs = DEFAULT_IDLE_SHUTDOWN_MS) {
    return new HTTPServerClass(adapter, port, bindAddress, resolver, idleShutdownMs);
  }
  constructor(adapter, port, bindAddress, resolver, idleShutdownMs = DEFAULT_IDLE_SHUTDOWN_MS) {
    super(adapter, "httpServer");
    this.bindAddress = bindAddress;
    this.requestedPort = port;
    this.resolver = resolver;
    this.idleShutdownMs = idleShutdownMs;
    this.server = http.createServer((req, res) => {
      void this.handleRequest(req, res);
    });
    this.server.on("error", (err) => {
      this.log.error(`HTTP server error: ${String(err)}`);
    });
  }
  setFileResolver(resolver) {
    this.resolver = resolver;
  }
  async ensureCached(file) {
    if (typeof this.resolver.ensureCached === "function") {
      return this.resolver.ensureCached(file);
    }
    return this.resolver.resolve(file);
  }
  /**
   * Reset the idle-shutdown timer. Call when a flash trigger is dispatched so the
   * 10-min window counts from the trigger, not just from the first Tasmota request.
   */
  noteActivity() {
    if (this.ready) {
      this.scheduleIdleShutdown();
    }
  }
  async handleRequest(req, res) {
    this.activeRequests++;
    this.cancelIdleTimer();
    const onDone = () => {
      if (this.activeRequests > 0) {
        this.activeRequests--;
      }
      this.scheduleIdleShutdown();
    };
    let doneFired = false;
    const safeDone = () => {
      if (doneFired) {
        return;
      }
      doneFired = true;
      onDone();
    };
    res.on("finish", safeDone);
    res.on("close", safeDone);
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.statusCode = 405;
        res.setHeader("Allow", "GET, HEAD");
        res.end();
        return;
      }
      let urlPath;
      try {
        urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      } catch {
        res.statusCode = 400;
        res.end();
        return;
      }
      const filename = path.basename(urlPath);
      if (!filename || filename === "/" || filename === "." || filename === "..") {
        res.statusCode = 404;
        res.end();
        return;
      }
      const file = await this.resolver.resolve(filename);
      if (!file) {
        res.statusCode = 404;
        res.end();
        return;
      }
      const range = parseRangeHeader(req.headers.range);
      const resolved = resolveRange(range, file.size);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Type", "application/octet-stream");
      if (range && !resolved) {
        res.statusCode = 416;
        res.setHeader("Content-Range", `bytes */${file.size}`);
        res.end();
        return;
      }
      if (!resolved) {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (range) {
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${resolved.start}-${resolved.end}/${file.size}`);
      } else {
        res.statusCode = 200;
      }
      res.setHeader("Content-Length", String(resolved.length));
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      const stream = fs.createReadStream(file.absolutePath, { start: resolved.start, end: resolved.end });
      stream.on("error", (err) => {
        this.log.error(`Stream error for "${filename}": ${err.message}`);
        if (!res.headersSent) {
          res.statusCode = 500;
        }
        res.end();
      });
      stream.pipe(res);
    } catch (e) {
      this.log.error(`Unhandled request error: ${e instanceof Error ? e.message : String(e)}`);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end();
      }
    }
  }
  /**
   * Start listening on demand. Idempotent: returns immediately if already ready or
   * piggy-backs on an in-flight start. On success, arms the idle-shutdown timer.
   */
  async ensureStarted() {
    if (this.ready) {
      this.scheduleIdleShutdown();
      return true;
    }
    if (this.startInflight) {
      return this.startInflight;
    }
    const p = (async () => {
      try {
        await this.start(this.requestedPort);
        this.scheduleIdleShutdown();
        return true;
      } catch (e) {
        this.log.error(`Failed to start HTTP server: ${e instanceof Error ? e.message : String(e)}`);
        return false;
      } finally {
        this.startInflight = void 0;
      }
    })();
    this.startInflight = p;
    return p;
  }
  scheduleIdleShutdown() {
    this.cancelIdleTimer();
    if (!this.ready || this.activeRequests > 0) {
      return;
    }
    this.idleTimer = setTimeout(() => {
      this.idleTimer = void 0;
      if (this.activeRequests > 0 || !this.ready) {
        return;
      }
      void this.stop();
    }, this.idleShutdownMs);
    if (typeof this.idleTimer.unref === "function") {
      this.idleTimer.unref();
    }
  }
  cancelIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = void 0;
    }
  }
  async start(requestedPort) {
    const tryListen = (p) => new Promise((resolve, reject) => {
      const onError = (err) => {
        this.server.removeListener("error", onError);
        reject(err);
      };
      this.server.once("error", onError);
      this.server.listen(p, this.bindAddress, () => {
        this.server.removeListener("error", onError);
        resolve();
      });
    });
    try {
      await tryListen(requestedPort);
    } catch (err) {
      if (requestedPort !== 0 && err && err.code === "EADDRINUSE") {
        this.log.warn(`Port ${requestedPort} is in use, picking a free port instead.`);
        await tryListen(0);
      } else {
        throw err;
      }
    }
    const addr = this.server.address();
    if (addr && typeof addr === "object") {
      this.port = addr.port;
    }
    this.ready = true;
    this.log.info(`HTTP server listening on http://${this.bindAddress}:${this.port}`);
  }
  /**
   * Graceful stop: lets in-flight responses finish. After stop(), the server can be
   * relisten()ed via ensureStarted() — Node's http.Server allows reuse after close.
   */
  async stop() {
    this.cancelIdleTimer();
    if (!this.ready) {
      return;
    }
    this.ready = false;
    await new Promise((resolve) => {
      this.server.close((err) => {
        if (err) {
          this.log.warn(`Error closing HTTP server: ${err.message}`);
        }
        resolve();
      });
    });
    this.log.info("HTTP server stopped (idle).");
  }
  destroy() {
    void this.delete();
    this.cancelIdleTimer();
    if (this.ready) {
      try {
        this.server.close();
        if (typeof this.server.closeAllConnections === "function") {
          this.server.closeAllConnections();
        }
      } catch (e) {
        this.log.warn(`Error closing HTTP server: ${e instanceof Error ? e.message : String(e)}`);
      }
      this.ready = false;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HTTPServerClass,
  NoopFileResolver,
  ProxyCacheResolver,
  defaultTftStorageDir,
  extractModelFromFilename,
  parseRangeHeader,
  resolveRange
});
//# sourceMappingURL=http-server.js.map
