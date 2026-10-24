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
  WebServer: () => WebServer
});
module.exports = __toCommonJS(web_server_exports);
var http = __toESM(require("node:http"));
var fs = __toESM(require("node:fs"));
var path = __toESM(require("node:path"));
var import_ws = require("ws");
var import_library = require("../controller/library");
var import_web_protocol = require("./web-protocol");
const WS_PING_INTERVAL_MS = 3e4;
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
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8"
};
class WebServer extends import_library.BaseClass {
  manager;
  options;
  server;
  wss;
  pingInterval;
  alive = /* @__PURE__ */ new WeakMap();
  constructor(adapter, manager, options) {
    super(adapter, "WebServer");
    this.manager = manager;
    this.options = options;
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
    this.server = http.createServer((req, res) => {
      void this.onRequest(req, res);
    });
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
    this.log.info(`Web panels available at http://${this.displayHost()}:${port}/<topic>`);
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
   * Access check for every HTTP request and WebSocket upgrade. Always allowed for now - the
   * hook is the place for a token or an ioBroker login later.
   *
   * @param _req the request
   * @returns true if the request may proceed
   */
  authorize(_req) {
    return Promise.resolve(true);
  }
  async onRequest(req, res) {
    var _a;
    try {
      if (!await this.authorize(req)) {
        this.reply(res, 403, "text/plain; charset=utf-8", "Forbidden");
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        this.reply(res, 405, "text/plain; charset=utf-8", "Method not allowed");
        return;
      }
      const url = new URL((_a = req.url) != null ? _a : "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);
      if (pathname === "/" || pathname === "") {
        this.reply(res, 200, "text/html; charset=utf-8", this.indexPage());
        return;
      }
      if (pathname.startsWith("/ws/")) {
        this.reply(res, 426, "text/plain; charset=utf-8", "WebSocket endpoint");
        return;
      }
      const file = this.resolveStatic(pathname);
      if (file) {
        this.sendFile(res, file);
        return;
      }
      const topicOrId = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
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
  async onUpgrade(req, socket, head) {
    var _a;
    try {
      const url = new URL((_a = req.url) != null ? _a : "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);
      if (!this.wss || !pathname.startsWith("/ws/") || !await this.authorize(req)) {
        socket.destroy();
        return;
      }
      const topicOrId = pathname.slice(4).replace(/\/+$/, "");
      const sessionId = url.searchParams.get("session") || void 0;
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        void this.onConnection(ws, topicOrId, sessionId);
      });
    } catch (e) {
      this.log.error(`WebSocket upgrade failed: ${String(e)}`);
      socket.destroy();
    }
  }
  async onConnection(ws, topicOrId, sessionId) {
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
    const bound = { session: void 0 };
    ws.on("message", (data) => {
      if (!bound.session) {
        return;
      }
      const text = rawDataToString(data);
      const frame = (0, import_web_protocol.parseClientFrame)(text);
      if (!frame) {
        if (this.adapter.config.debugLogMqtt) {
          this.log.debug(`Ignore invalid frame from ${bound.session.panel.name}: ${text.slice(0, 200)}`);
        }
        return;
      }
      void this.manager.onClientFrame(bound.session, frame);
    });
    ws.on("close", () => {
      if (bound.session) {
        this.manager.detach(bound.session, client);
      }
    });
    ws.on("error", (e) => {
      this.log.debug(`WebSocket error (${topicOrId}): ${e.message}`);
    });
    bound.session = await this.manager.attach(topicOrId, sessionId, client);
    if (bound.session && ws.readyState !== ws.OPEN) {
      this.manager.detach(bound.session, client);
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
    res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-cache" });
    res.end(body);
  }
  displayHost() {
    return this.options.bind && this.options.bind !== "0.0.0.0" && this.options.bind !== "::" ? this.options.bind : "<host>";
  }
  indexPage() {
    const rows = this.manager.listPanels().map(
      (p) => `<li><a href="/${encodeURIComponent(p.topic)}">${escapeHtml(p.name)}</a> <small>${escapeHtml(p.topic)} \xB7 ${escapeHtml(p.model)} \xB7 ${p.sessions} session(s)</small></li>`
    ).join("");
    return page(
      "NSPanel Lovelace UI - Web panels",
      `<h1>Web panels</h1>${rows ? `<ul>${rows}</ul>` : "<p>No panels configured.</p>"}`
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
function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:2rem}a{color:#6cf}code{background:#222;padding:0 .3em}small{color:#999}</style></head><body>${body}</body></html>`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WebServer
});
//# sourceMappingURL=web-server.js.map
