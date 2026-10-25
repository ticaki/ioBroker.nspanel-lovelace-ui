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
var web_server_exports = {};
__export(web_server_exports, {
  PIN_ATTEMPTS_PER_MINUTE: () => PIN_ATTEMPTS_PER_MINUTE,
  PinGuard: () => PinGuard,
  WEB_TOKEN_COOKIE: () => WEB_TOKEN_COOKIE,
  WebServer: () => WebServer,
  parseCookies: () => parseCookies,
  pinToken: () => pinToken,
  safeNext: () => safeNext
});
module.exports = __toCommonJS(web_server_exports);
var http = __toESM(require("node:http"));
var https = __toESM(require("node:https"));
var fs = __toESM(require("node:fs"));
var path = __toESM(require("node:path"));
var import_node_crypto = require("node:crypto");
var import_ws = require("ws");
var import_library = require("../controller/library");
var import_web_protocol = require("./web-protocol");
var import_fido = require("./fido");
const WS_PING_INTERVAL_MS = 3e4;
const WEB_TOKEN_COOKIE = "nspanel_web_token";
const WEB_TOKEN_COOKIE_MAX_AGE = 31536e4;
const WRONG_PIN_DELAY_MS = 1e3;
const PIN_ATTEMPTS_PER_MINUTE = 5;
const PIN_ATTEMPT_WINDOW_MS = 6e4;
const PUBLIC_STATIC_PREFIXES = ["/assets/", "/fonts/", "/icons/"];
const MAX_AUTH_BODY = 4096;
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8"
};
function pinToken(secret, pin) {
  if (!pin) {
    return "";
  }
  return (0, import_node_crypto.createHmac)("sha256", secret).update(pin).digest("hex");
}
function parseCookies(header) {
  const result = {};
  if (!header) {
    return result;
  }
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const name = part.slice(0, eq).trim();
    if (!name) {
      continue;
    }
    try {
      result[name] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      result[name] = part.slice(eq + 1).trim();
    }
  }
  return result;
}
function safeNext(next) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}
function tokensEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && ba.length > 0 && (0, import_node_crypto.timingSafeEqual)(ba, bb);
}
class PinGuard {
  token;
  pin;
  attempts = /* @__PURE__ */ new Map();
  constructor(secret, pin) {
    this.pin = pin;
    this.token = pinToken(secret, pin);
  }
  /** true if a PIN is set */
  get enabled() {
    return this.pin !== "";
  }
  /** the token a browser has to present */
  get expectedToken() {
    return this.token;
  }
  /**
   * Is this token the current one?
   *
   * @param token token from cookie or query
   * @returns true if it grants access (always true without PIN)
   */
  isValidToken(token) {
    if (!this.enabled) {
      return true;
    }
    return typeof token === "string" && tokensEqual(token, this.token);
  }
  /**
   * Check an entered PIN.
   *
   * @param ip source address (rate limit)
   * @param pin the entered PIN
   * @param now current time (tests)
   * @returns ok, wrong or limited (too many wrong PINs from this address)
   */
  check(ip, pin, now = Date.now()) {
    if (!this.enabled) {
      return "ok";
    }
    let entry = this.attempts.get(ip);
    if (entry && entry.resetAt <= now) {
      this.attempts.delete(ip);
      entry = void 0;
    }
    if (entry && entry.count >= PIN_ATTEMPTS_PER_MINUTE) {
      return "limited";
    }
    if (tokensEqual(pin, this.pin)) {
      this.attempts.delete(ip);
      return "ok";
    }
    if (!entry) {
      entry = { count: 0, resetAt: now + PIN_ATTEMPT_WINDOW_MS };
      this.attempts.set(ip, entry);
    }
    entry.count++;
    if (this.attempts.size > 1e3) {
      for (const [key, value] of this.attempts) {
        if (value.resetAt <= now) {
          this.attempts.delete(key);
        }
      }
    }
    return "wrong";
  }
}
class WebServer extends import_library.BaseClass {
  manager;
  options;
  guard;
  server;
  wss;
  pingInterval;
  alive = /* @__PURE__ */ new WeakMap();
  constructor(adapter, manager, options) {
    super(adapter, "WebServer");
    this.manager = manager;
    this.options = options;
    this.guard = new PinGuard(options.secret, options.pin);
  }
  /** true if the server speaks HTTPS (and WSS) */
  get secure() {
    return this.options.tls !== void 0;
  }
  /** `https` or `http` - the scheme browsers reach the server with */
  get protocol() {
    return this.secure ? "https" : "http";
  }
  /** the FIDO2 service when FIDO2 login is active (needs tls) */
  get fido() {
    return this.secure ? this.options.fido : void 0;
  }
  /**
   * Start listening.
   *
   * @returns true if the server is up
   */
  async start() {
    if (this.server) {
      return true;
    }
    const port = this.options.port;
    if (!port || port < 1 || port > 65535) {
      this.log.error(`Invalid web panel port ${port} - web panels are disabled`);
      return false;
    }
    const free = await this.adapter.getPortAsync(port);
    if (free !== port) {
      this.log.error(
        `Web panel port ${port} is already in use (next free port: ${free}) - web panels are disabled`
      );
      return false;
    }
    this.wss = new import_ws.WebSocketServer({ noServer: true });
    const handler = (req, res) => {
      void this.onRequest(req, res);
    };
    if (this.options.tls) {
      try {
        this.server = https.createServer(
          { key: this.options.tls.key, cert: this.options.tls.cert, ca: this.options.tls.ca },
          handler
        );
      } catch (e) {
        this.log.error(`Web panel certificate is not usable: ${String(e)} - web panels are disabled`);
        this.wss.close();
        this.wss = void 0;
        return false;
      }
    } else {
      this.server = http.createServer(handler);
    }
    this.server.on("upgrade", (req, socket, head) => {
      void this.onUpgrade(req, socket, head);
    });
    this.server.on("error", (e) => {
      this.log.error(`Web server error: ${e.message}`);
    });
    await new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(port, this.options.bind, () => {
        this.server.off("error", reject);
        resolve();
      });
    }).catch((e) => {
      this.log.error(`Web server could not listen on ${this.options.bind}:${port}: ${e.message}`);
      this.server = void 0;
    });
    if (!this.server) {
      return false;
    }
    this.pingInterval = this.adapter.setInterval(() => this.pingClients(), WS_PING_INTERVAL_MS);
    this.log.info(`Web panels available at ${this.protocol}://${this.displayHost()}:${port}/<topic>`);
    if (!this.guard.enabled) {
      this.log.warn("No PIN set for the web panels - everyone who reaches the port can use them");
    }
    return true;
  }
  async stop() {
    if (this.pingInterval) {
      this.adapter.clearInterval(this.pingInterval);
      this.pingInterval = void 0;
    }
    if (this.wss) {
      for (const ws of this.wss.clients) {
        ws.terminate();
      }
      this.wss.close();
      this.wss = void 0;
    }
    if (this.server) {
      const server = this.server;
      this.server = void 0;
      await new Promise((resolve) => {
        var _a;
        server.close(() => resolve());
        (_a = server.closeAllConnections) == null ? void 0 : _a.call(server);
      });
    }
  }
  async delete() {
    await this.stop();
    await super.delete();
  }
  /**
   * Access check for HTTP requests and WebSocket upgrades: a valid token in the cookie or in
   * `?token=`. Always true without PIN.
   *
   * @param req the request
   * @returns true if the request may proceed
   */
  authorize(req) {
    var _a;
    if (!this.guard.enabled) {
      return true;
    }
    const cookie = parseCookies(req.headers.cookie)[WEB_TOKEN_COOKIE];
    if (this.guard.isValidToken(cookie)) {
      return true;
    }
    const token = new URL((_a = req.url) != null ? _a : "/", "http://localhost").searchParams.get("token");
    return token !== null && this.guard.isValidToken(token);
  }
  async onRequest(req, res) {
    var _a, _b;
    try {
      const url = new URL((_a = req.url) != null ? _a : "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);
      if (req.method === "POST" && pathname === "/auth") {
        await this.onAuthPost(req, res);
        return;
      }
      if (pathname === "/auth/fido" || pathname.startsWith("/auth/fido/")) {
        await this.onFido(req, res, pathname, url);
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        this.reply(res, 405, "text/plain; charset=utf-8", "Method not allowed");
        return;
      }
      if (pathname === "/auth/check") {
        if (this.authorize(req)) {
          res.writeHead(204, { "Cache-Control": "no-store" });
          res.end();
        } else {
          this.reply(res, 401, "text/plain; charset=utf-8", "Unauthorized");
        }
        return;
      }
      if (pathname.startsWith("/ws/")) {
        this.reply(res, 426, "text/plain; charset=utf-8", "WebSocket endpoint");
        return;
      }
      if (PUBLIC_STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
        const file2 = this.resolveStatic(pathname);
        if (file2) {
          this.sendFile(res, file2);
        } else {
          this.reply(res, 404, "text/plain; charset=utf-8", "Not found");
        }
        return;
      }
      const topicOrId = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
      if (url.searchParams.has("pin") && !this.resolveStatic(pathname)) {
        const result = this.guard.check(remoteAddress(req), (_b = url.searchParams.get("pin")) != null ? _b : "");
        if (result === "ok") {
          res.writeHead(302, {
            Location: pathname,
            "Set-Cookie": this.tokenCookie(),
            "Cache-Control": "no-store"
          });
          res.end();
          return;
        }
        await this.rejectPin(res, result, pathname);
        return;
      }
      if (!this.authorize(req)) {
        this.reply(res, 401, "text/html; charset=utf-8", this.pinPage(pathname));
        return;
      }
      if (pathname === "/" || pathname === "") {
        this.reply(res, 200, "text/html; charset=utf-8", this.indexPage());
        return;
      }
      const file = this.resolveStatic(pathname);
      if (file) {
        this.sendFile(res, file);
        return;
      }
      if (!this.manager.hasPanel(topicOrId)) {
        this.reply(res, 404, "text/html; charset=utf-8", this.notFoundPage(topicOrId));
        return;
      }
      const index = this.resolveStatic("/index.html");
      if (index) {
        this.sendFile(res, index);
      } else {
        this.reply(res, 200, "text/html; charset=utf-8", this.missingFrontendPage(topicOrId));
      }
    } catch (e) {
      this.log.error(`Web request failed: ${String(e)}`);
      if (!res.headersSent) {
        this.reply(res, 500, "text/plain; charset=utf-8", "Internal error");
      }
    }
  }
  /**
   * The PIN form: `pin` and `next` (urlencoded). Sets the cookie and redirects to `next`.
   *
   * @param req the request
   * @param res the response
   */
  async onAuthPost(req, res) {
    var _a;
    const body = await readBody(req, MAX_AUTH_BODY);
    const form = new URLSearchParams(body);
    const next = safeNext(form.get("next"));
    if (!this.guard.enabled) {
      res.writeHead(303, { Location: next, "Cache-Control": "no-store" });
      res.end();
      return;
    }
    const result = this.guard.check(remoteAddress(req), (_a = form.get("pin")) != null ? _a : "");
    if (result === "ok") {
      res.writeHead(303, { Location: next, "Set-Cookie": this.tokenCookie(), "Cache-Control": "no-store" });
      res.end();
      return;
    }
    await this.rejectPin(res, result, next);
  }
  /**
   * FIDO2 routes. All answer 404 while FIDO2 is off (no tls or not enabled).
   *
   * - `GET  /auth/fido/register`          page to register a key - needs the PIN token
   * - `POST /auth/fido/register/options`  `{ name }` -> creation options (needs the PIN token)
   * - `POST /auth/fido/register/verify`   credential JSON -> stores the key (needs the PIN token)
   * - `POST /auth/fido/login/options`     -> request options
   * - `POST /auth/fido/login/verify`      `{ response, next }` -> sets the PIN cookie, `{ ok, redirect }`
   *
   * @param req the request
   * @param res the response
   * @param pathname decoded path
   * @param url parsed url
   */
  async onFido(req, res, pathname, url) {
    var _a, _b, _c;
    const fido = this.fido;
    if (!fido) {
      this.reply(res, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }
    const ip = remoteAddress(req);
    if (req.method === "GET" && pathname === "/auth/fido/register") {
      if (!this.authorize(req)) {
        this.reply(res, 401, "text/html; charset=utf-8", this.pinPage(pathname));
        return;
      }
      this.reply(res, 200, "text/html; charset=utf-8", this.fidoRegisterPage(url));
      return;
    }
    if (req.method !== "POST") {
      this.reply(res, 405, "text/plain; charset=utf-8", "Method not allowed");
      return;
    }
    const rp = (0, import_fido.relyingPartyFromHost)(req.headers.host, this.options.port);
    if (typeof rp === "string") {
      this.replyJson(res, 400, { error: rp });
      return;
    }
    let body;
    try {
      const text = await readBody(req, MAX_AUTH_BODY * 16);
      body = text ? JSON.parse(text) : {};
    } catch {
      this.replyJson(res, 400, { error: "invalid JSON" });
      return;
    }
    const data = typeof body === "object" && body !== null ? body : {};
    switch (pathname) {
      case "/auth/fido/register/options": {
        if (!this.authorize(req)) {
          this.replyJson(res, 401, { error: "unauthorized" });
          return;
        }
        if (fido.requests.isLimited(ip)) {
          this.replyJson(res, 429, { error: "too many requests" });
          return;
        }
        fido.requests.hit(ip);
        const result = await fido.registrationOptions(rp, typeof data.name === "string" ? data.name : "");
        this.replyFidoResult(res, result);
        return;
      }
      case "/auth/fido/register/verify": {
        if (!this.authorize(req)) {
          this.replyJson(res, 401, { error: "unauthorized" });
          return;
        }
        if (fido.failures.isLimited(ip)) {
          this.replyJson(res, 429, { error: "too many attempts - wait a minute" });
          return;
        }
        const result = await fido.verifyRegistration(rp, body);
        if (!result.ok) {
          fido.failures.hit(ip);
          await this.wait((_a = this.options.wrongPinDelayMs) != null ? _a : WRONG_PIN_DELAY_MS);
        } else {
          fido.failures.reset(ip);
        }
        this.replyFidoResult(res, result);
        return;
      }
      case "/auth/fido/login/options": {
        if (fido.requests.isLimited(ip)) {
          this.replyJson(res, 429, { error: "too many requests" });
          return;
        }
        fido.requests.hit(ip);
        const result = await fido.authenticationOptions(rp);
        this.replyFidoResult(res, result);
        return;
      }
      case "/auth/fido/login/verify": {
        if (fido.failures.isLimited(ip)) {
          this.replyJson(res, 429, { error: "too many attempts - wait a minute" });
          return;
        }
        const result = await fido.verifyAuthentication(rp, (_b = data.response) != null ? _b : body);
        if (!result.ok) {
          fido.failures.hit(ip);
          await this.wait((_c = this.options.wrongPinDelayMs) != null ? _c : WRONG_PIN_DELAY_MS);
          this.replyFidoResult(res, result);
          return;
        }
        fido.failures.reset(ip);
        const redirect = safeNext(typeof data.next === "string" ? data.next : "/");
        const headers = {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        };
        if (this.guard.enabled) {
          headers["Set-Cookie"] = this.tokenCookie();
        }
        res.writeHead(200, headers);
        res.end(JSON.stringify({ ok: true, redirect, key: result.value.name }));
        return;
      }
      default:
        this.reply(res, 404, "text/plain; charset=utf-8", "Not found");
    }
  }
  replyFidoResult(res, result) {
    if (result.ok) {
      this.replyJson(res, 200, result.value);
    } else {
      this.replyJson(res, result.status, { error: result.error });
    }
  }
  replyJson(res, status, body) {
    this.reply(res, status, "application/json; charset=utf-8", JSON.stringify(body));
  }
  async rejectPin(res, result, next) {
    var _a;
    if (result === "limited") {
      this.reply(res, 429, "text/html; charset=utf-8", this.pinPage(next, "Too many attempts - wait a minute."));
      return;
    }
    await this.wait((_a = this.options.wrongPinDelayMs) != null ? _a : WRONG_PIN_DELAY_MS);
    this.reply(res, 401, "text/html; charset=utf-8", this.pinPage(next, "Wrong PIN."));
  }
  wait(ms) {
    if (ms <= 0 || this.unload || this.adapter.unload) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.adapter.setTimeout(() => resolve(), ms);
    });
  }
  /**
   * The `Set-Cookie` value of the PIN token; over HTTPS the cookie is marked `Secure`.
   *
   * @returns the header value
   */
  tokenCookie() {
    const secure = this.secure ? "; Secure" : "";
    return `${WEB_TOKEN_COOKIE}=${this.guard.expectedToken}; Path=/; Max-Age=${WEB_TOKEN_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`;
  }
  async onUpgrade(req, socket, head) {
    var _a;
    try {
      const url = new URL((_a = req.url) != null ? _a : "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);
      if (!this.wss || !pathname.startsWith("/ws/")) {
        socket.destroy();
        return;
      }
      if (!this.authorize(req)) {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
        socket.destroy();
        return;
      }
      const topicOrId = pathname.slice(4).replace(/\/+$/, "");
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        void this.onConnection(ws, topicOrId);
      });
    } catch (e) {
      this.log.error(`WebSocket upgrade failed: ${String(e)}`);
      socket.destroy();
    }
  }
  async onConnection(ws, topicOrId) {
    this.alive.set(ws, true);
    ws.on("pong", () => this.alive.set(ws, true));
    const client = {
      send: (frame) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(frame));
        }
      },
      close: (reason) => {
        if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
          ws.close(1e3, reason.slice(0, 120));
        }
      }
    };
    const bound = { entry: void 0 };
    ws.on("message", (data) => {
      if (!bound.entry) {
        return;
      }
      const text = rawDataToString(data);
      const frame = (0, import_web_protocol.parseClientFrame)(text);
      if (!frame) {
        if (this.adapter.config.debugLogMqtt) {
          this.log.debug(`Ignore invalid frame from ${bound.entry.topic}: ${text.slice(0, 200)}`);
        }
        return;
      }
      void this.manager.onClientFrame(bound.entry, frame);
    });
    ws.on("close", () => {
      if (bound.entry) {
        this.manager.detach(bound.entry, client);
      }
    });
    ws.on("error", (e) => {
      this.log.debug(`WebSocket error (${topicOrId}): ${e.message}`);
    });
    bound.entry = await this.manager.attach(topicOrId, client);
    if (bound.entry && ws.readyState !== ws.OPEN) {
      this.manager.detach(bound.entry, client);
    }
  }
  pingClients() {
    if (!this.wss) {
      return;
    }
    for (const ws of this.wss.clients) {
      if (this.alive.get(ws) === false) {
        ws.terminate();
        continue;
      }
      this.alive.set(ws, false);
      ws.ping();
    }
  }
  /**
   * Absolute path of a file under www/.
   *
   * @param pathname the request path
   * @returns the file, undefined if it does not exist or leaves the directory
   */
  resolveStatic(pathname) {
    const root = path.resolve(this.options.wwwPath);
    const file = path.resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + path.sep)) {
      return void 0;
    }
    try {
      return fs.statSync(file).isFile() ? file : void 0;
    } catch {
      return void 0;
    }
  }
  sendFile(res, file) {
    var _a;
    const type = (_a = CONTENT_TYPES[path.extname(file).toLowerCase()]) != null ? _a : "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": file.endsWith("index.html") ? "no-cache" : "public, max-age=3600"
    });
    const stream = fs.createReadStream(file);
    stream.on("error", (e) => {
      this.log.warn(`Cannot read ${file}: ${e.message}`);
      res.destroy();
    });
    stream.pipe(res);
  }
  reply(res, status, type, body) {
    res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  }
  displayHost() {
    return this.options.bind && this.options.bind !== "0.0.0.0" && this.options.bind !== "::" ? this.options.bind : "<host>";
  }
  indexPage() {
    const rows = this.manager.listPanels().map(
      (p) => `<li><a href="/${encodeURIComponent(p.topic)}">${escapeHtml(p.name)}</a> <small>${escapeHtml(p.topic)} \xB7 ${escapeHtml(p.model)} \xB7 ${p.kind === "web" ? "web panel" : "NSPanel"} \xB7 ${p.clients} client(s)</small></li>`
    ).join("");
    const fidoLink = this.fido ? `<p><a href="/auth/fido/register">Register a security key (FIDO2)</a> - <small>login alternative to the PIN${this.fido.hasCredentials ? "" : ", none registered yet"}</small></p>` : "";
    return page(
      "NSPanel Lovelace UI - Web panels",
      `<h1>Web panels</h1>${rows ? `<ul>${rows}</ul>` : "<p>No panels configured.</p>"}${fidoLink}`
    );
  }
  pinPage(next, error = "") {
    const safe = safeNext(next);
    const fido = this.fido;
    const fidoPart = fido && fido.hasCredentials ? `<p><button type="button" id="fido-login">Sign in with a security key</button></p><p class="error" id="fido-error"></p><script>${fidoScript()}document.getElementById('fido-login').addEventListener('click',function(){nsFido.login(${JSON.stringify(safe)},document.getElementById('fido-error'));});</script>` : "";
    return page(
      "NSPanel Lovelace UI - PIN",
      `<h1>Web panel</h1><p>This web panel is protected by a PIN.</p><form method="post" action="/auth"><input type="hidden" name="next" value="${escapeHtml(safe)}"><label>PIN <input type="password" name="pin" autofocus autocomplete="current-password" inputmode="numeric"></label> <button type="submit">Open</button></form>${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}${fidoPart}`
    );
  }
  /**
   * Page to register a FIDO2 security key (only reachable with a valid PIN token).
   *
   * @param url the request url (`?next=` is where the "back" link goes)
   * @returns html
   */
  fidoRegisterPage(url) {
    var _a;
    const back = safeNext(url.searchParams.get("next"));
    const keys = ((_a = this.fido) == null ? void 0 : _a.hasCredentials) ? "" : "<p><small>No security key is registered yet.</small></p>";
    return page(
      "NSPanel Lovelace UI - Security key",
      `<h1>Register a security key</h1><p>A FIDO2 security key (or a passkey of this device) can be used instead of the PIN to open the web panels.</p><p><strong>Requirements</strong></p><ul><li>The web panels are served over <strong>HTTPS</strong> (this page already is).</li><li>The address in the browser is a <strong>host name</strong> (DNS), not an IP address - WebAuthn does not work with IP addresses.</li><li>The browser has to <strong>trust the certificate</strong>. A self-signed certificate works when it is installed as trusted in the browser or the system.</li></ul>${keys}<form id="fido-form"><label>Name of the key <input type="text" id="fido-name" maxlength="64" autofocus required placeholder="e.g. YubiKey kitchen"></label> <button type="submit">Register</button></form><p class="error" id="fido-error"></p><p id="fido-ok"></p><p><a href="${escapeHtml(back)}">Back</a></p><script>${fidoScript()}document.getElementById('fido-form').addEventListener('submit',function(e){e.preventDefault();nsFido.register(document.getElementById('fido-name').value,document.getElementById('fido-error'),document.getElementById('fido-ok'));});</script>`
    );
  }
  notFoundPage(topicOrId) {
    return page(
      "Panel not found",
      `<h1>Panel not found</h1><p>No panel with topic or id <code>${escapeHtml(topicOrId)}</code>.</p><p><a href="/">All panels</a></p>`
    );
  }
  missingFrontendPage(topicOrId) {
    return page(
      "Frontend missing",
      `<h1>Frontend missing</h1><p>The panel <code>${escapeHtml(topicOrId)}</code> exists, but <code>www/index.html</code> was not found. Build the frontend with <code>npm run build:web</code>.</p>`
    );
  }
}
function remoteAddress(req) {
  var _a, _b;
  return (_b = (_a = req.socket) == null ? void 0 : _a.remoteAddress) != null ? _b : "unknown";
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}
function rawDataToString(data) {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString();
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString();
  }
  return data.toString();
}
function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (c) => {
      var _a;
      return (_a = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]) != null ? _a : c;
    }
  );
}
function fidoScript() {
  return `var nsFido=(function(){function dec(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}function enc(buf){var a=new Uint8Array(buf),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');}function creds(list){return (list||[]).map(function(c){return Object.assign({},c,{id:dec(c.id)});});}function toCreate(o){o=Object.assign({},o);o.challenge=dec(o.challenge);o.user=Object.assign({},o.user,{id:dec(o.user.id)});o.excludeCredentials=creds(o.excludeCredentials);return o;}function toGet(o){o=Object.assign({},o);o.challenge=dec(o.challenge);o.allowCredentials=creds(o.allowCredentials);return o;}function serialize(c){var r=c.response,out={id:c.id,rawId:enc(c.rawId),type:c.type,authenticatorAttachment:c.authenticatorAttachment||undefined,clientExtensionResults:c.getClientExtensionResults?c.getClientExtensionResults():{},response:{clientDataJSON:enc(r.clientDataJSON)}};if(r.attestationObject){out.response.attestationObject=enc(r.attestationObject);if(r.getTransports)out.response.transports=r.getTransports();}if(r.authenticatorData&&r.signature){out.response.authenticatorData=enc(r.authenticatorData);out.response.signature=enc(r.signature);if(r.userHandle)out.response.userHandle=enc(r.userHandle);}return out;}function post(url,body){return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)}).then(function(res){return res.json().catch(function(){return {};}).then(function(j){if(!res.ok)throw new Error(j.error||('HTTP '+res.status));return j;});});}function check(){if(!window.isSecureContext||!navigator.credentials||!window.PublicKeyCredential)throw new Error('WebAuthn is not available here - use https with a host name');}function fail(el,e){el.textContent=(e&&e.message)||String(e);}return {register:function(name,errEl,okEl){errEl.textContent='';okEl.textContent='';try{check();}catch(e){fail(errEl,e);return;}post('/auth/fido/register/options',{name:name}).then(function(o){return navigator.credentials.create({publicKey:toCreate(o)});}).then(function(c){return post('/auth/fido/register/verify',serialize(c));}).then(function(r){okEl.textContent='Security key "'+r.name+'" registered. You can sign in with it from now on.';}).catch(function(e){fail(errEl,e);});},login:function(next,errEl){errEl.textContent='';try{check();}catch(e){fail(errEl,e);return;}post('/auth/fido/login/options',{}).then(function(o){return navigator.credentials.get({publicKey:toGet(o)});}).then(function(c){return post('/auth/fido/login/verify',{response:serialize(c),next:next});}).then(function(r){location.href=r.redirect||'/';}).catch(function(e){fail(errEl,e);});}};})();`;
}
function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:2rem}a{color:#6cf}code{background:#222;padding:0 .3em}small{color:#999}input{font:inherit;padding:.4em .6em;border:1px solid #444;border-radius:4px;background:#222;color:#eee}button{font:inherit;padding:.4em 1em;border:0;border-radius:4px;background:#6cf;color:#111;cursor:pointer}.error{color:#f66}</style></head><body>${body}</body></html>`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PIN_ATTEMPTS_PER_MINUTE,
  PinGuard,
  WEB_TOKEN_COOKIE,
  WebServer,
  parseCookies,
  pinToken,
  safeNext
});
//# sourceMappingURL=web-server.js.map
