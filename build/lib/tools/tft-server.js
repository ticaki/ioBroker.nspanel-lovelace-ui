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
var tft_server_exports = {};
__export(tft_server_exports, {
  TFT_IDLE_TIMEOUT_MS: () => TFT_IDLE_TIMEOUT_MS,
  TFT_MAX_CHUNK_SIZE: () => TFT_MAX_CHUNK_SIZE,
  TFT_MAX_SERVE_MS: () => TFT_MAX_SERVE_MS,
  TFT_MAX_SIZE: () => TFT_MAX_SIZE,
  TftServer: () => TftServer,
  isUsableServerIp: () => isUsableServerIp,
  parseRange: () => parseRange,
  parseTftChunkMessage: () => parseTftChunkMessage,
  parseTftStartMessage: () => parseTftStartMessage,
  safeTftName: () => safeTftName,
  tftUploadDir: () => tftUploadDir
});
module.exports = __toCommonJS(tft_server_exports);
var fs = __toESM(require("node:fs"));
var http = __toESM(require("node:http"));
var os = __toESM(require("node:os"));
var path = __toESM(require("node:path"));
const TFT_MAX_SIZE = 16 * 1024 * 1024;
const TFT_MAX_CHUNK_SIZE = 1024 * 1024;
const TFT_IDLE_TIMEOUT_MS = 5 * 60 * 1e3;
const TFT_MAX_SERVE_MS = 45 * 60 * 1e3;
const PARTIAL_NAME = "upload.part";
function tftUploadDir(namespace) {
  return path.join(os.tmpdir(), `${namespace.replace(/[^A-Za-z0-9._-]/g, "_")}-custom-tft`);
}
function parseTftChunkMessage(value) {
  if (typeof value !== "object" || value === null) {
    return void 0;
  }
  if (!("uploadId" in value) || !("fileName" in value) || !("size" in value) || !("offset" in value)) {
    return void 0;
  }
  if (!("data" in value)) {
    return void 0;
  }
  const { uploadId, fileName, size, offset, data } = value;
  if (typeof uploadId !== "string" || !uploadId || typeof fileName !== "string" || typeof data !== "string") {
    return void 0;
  }
  if (typeof size !== "number" || !Number.isInteger(size) || typeof offset !== "number") {
    return void 0;
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return void 0;
  }
  return { uploadId, fileName, size, offset, data };
}
function parseTftStartMessage(value) {
  if (typeof value !== "object" || value === null || !("uploadId" in value) || !("target" in value)) {
    return void 0;
  }
  const { uploadId, target } = value;
  if (typeof uploadId !== "string" || !uploadId || typeof target !== "string" || !target) {
    return void 0;
  }
  const ip = "internalServerIp" in value ? value.internalServerIp : void 0;
  return { uploadId, target, internalServerIp: typeof ip === "string" ? ip : void 0 };
}
function isUsableServerIp(ip) {
  if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return false;
  }
  const parts = ip.split(".").map(Number);
  return parts.every((n) => n <= 255) && parts[0] !== 127 && parts[0] !== 0;
}
function safeTftName(fileName) {
  const base = path.basename(fileName).replace(/\.tft$/i, "");
  const clean = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  return `${clean || "custom"}.tft`;
}
function parseRange(header, size) {
  if (header === void 0) {
    return void 0;
  }
  const match = /^\s*bytes\s*=\s*(\d+)\s*-\s*(\d*)\s*$/i.exec(header);
  if (!match) {
    return null;
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start >= size || end < start) {
    return null;
  }
  return { start, end };
}
class TftServer {
  constructor(host) {
    this.host = host;
    this.dir = tftUploadDir(host.namespace);
  }
  server;
  idleTimer;
  maxTimer;
  activeRequests = 0;
  idleTimeoutMs = TFT_IDLE_TIMEOUT_MS;
  upload;
  /** file that is served, removed on stop */
  servedFile;
  dir;
  /** true while a file is served */
  get running() {
    return this.server !== void 0;
  }
  /**
   * Adds a chunk of an upload. The chunks must arrive in order, starting at offset 0; offset 0
   * starts a new upload.
   *
   * @param chunk chunk from the admin
   * @returns the error key or undefined
   */
  async addChunk(chunk) {
    if (chunk.offset === 0) {
      this.upload = void 0;
      if (!chunk.fileName.toLowerCase().endsWith(".tft")) {
        return "customTftWrongExtension";
      }
      if (chunk.size > TFT_MAX_SIZE) {
        return "customTftTooLarge";
      }
      if (chunk.size <= 0) {
        return "customTftEmpty";
      }
      await this.stop();
      await this.removeUploads();
      await fs.promises.mkdir(this.dir, { recursive: true });
      await fs.promises.writeFile(path.join(this.dir, PARTIAL_NAME), Buffer.alloc(0));
      this.upload = { uploadId: chunk.uploadId, fileName: chunk.fileName, size: chunk.size, received: 0 };
    }
    const upload = this.upload;
    if (!upload || upload.uploadId !== chunk.uploadId || upload.size !== chunk.size || upload.received !== chunk.offset) {
      await this.dropUpload();
      return "customTftUploadBroken";
    }
    const bytes = Buffer.from(chunk.data, "base64");
    if (bytes.length === 0 || bytes.length > TFT_MAX_CHUNK_SIZE || chunk.offset + bytes.length > chunk.size) {
      await this.dropUpload();
      return "customTftUploadBroken";
    }
    try {
      await fs.promises.appendFile(path.join(this.dir, PARTIAL_NAME), bytes);
    } catch (e) {
      this.host.log.warn(`Custom TFT: chunk could not be written: ${String(e)}`);
      await this.dropUpload();
      return "customTftUploadBroken";
    }
    upload.received += bytes.length;
    return void 0;
  }
  /**
   * Serves a complete upload.
   *
   * @param uploadId id of the upload
   * @param idleTimeoutMs stop after this time without a running request
   * @param maxServeMs stop after this time at the latest
   * @returns port and URL path of the file, or the error key
   */
  async serve(uploadId, idleTimeoutMs = TFT_IDLE_TIMEOUT_MS, maxServeMs = TFT_MAX_SERVE_MS) {
    const upload = this.upload;
    if (!upload || upload.uploadId !== uploadId || upload.received !== upload.size) {
      return { error: "customTftUploadBroken" };
    }
    this.upload = void 0;
    await this.stopServer();
    const name = safeTftName(upload.fileName);
    const urlPath = `/${name}`;
    const filePath = path.join(this.dir, name);
    try {
      await fs.promises.rename(path.join(this.dir, PARTIAL_NAME), filePath);
    } catch (e) {
      this.host.log.warn(`Custom TFT: upload could not be stored: ${String(e)}`);
      await this.removeUploads();
      return { error: "customTftUploadBroken" };
    }
    this.servedFile = filePath;
    const size = upload.size;
    this.activeRequests = 0;
    this.idleTimeoutMs = idleTimeoutMs;
    const server = http.createServer((req, res) => {
      this.onRequest(server, req, res, urlPath, filePath, size);
    });
    server.on("error", (e) => {
      this.host.log.warn(`TFT server error: ${e.message}`);
    });
    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, () => {
          server.off("error", reject);
          resolve();
        });
      });
    } catch (e) {
      this.host.log.error(`Custom TFT: server could not listen: ${String(e)}`);
      await this.stop();
      return { error: "customTftServerError" };
    }
    this.server = server;
    const address = server.address();
    const port = address !== null && typeof address === "object" ? address.port : 0;
    this.maxTimer = this.host.setTimeout(() => {
      this.maxTimer = void 0;
      this.host.log.info(`TFT server for ${name} stopped after the maximum serve time`);
      void this.stop();
    }, maxServeMs);
    this.armIdleTimer();
    this.host.log.info(`TFT server for ${name} (${size} bytes) listens on port ${port}`);
    return { port, urlPath };
  }
  /** Stops the server and removes the served file. A running upload is kept. */
  async stop() {
    await this.stopServer();
    const file = this.servedFile;
    this.servedFile = void 0;
    if (file) {
      await this.removeFile(file);
    }
  }
  /** Stops everything and removes all files of the upload directory (adapter unload). */
  async delete() {
    this.upload = void 0;
    await this.stop();
    await this.removeUploads();
  }
  async stopServer() {
    this.clearIdleTimer();
    if (this.maxTimer) {
      this.host.clearTimeout(this.maxTimer);
      this.maxTimer = void 0;
    }
    const server = this.server;
    this.server = void 0;
    if (server) {
      await new Promise((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
      this.host.log.debug("TFT server stopped");
    }
  }
  async dropUpload() {
    this.upload = void 0;
    await this.removeFile(path.join(this.dir, PARTIAL_NAME));
  }
  /** Removes the TFT files and the partial file of earlier uploads - only in {@link dir}. */
  async removeUploads() {
    let names;
    try {
      names = await fs.promises.readdir(this.dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (name === PARTIAL_NAME || name.toLowerCase().endsWith(".tft")) {
        await this.removeFile(path.join(this.dir, name));
      }
    }
  }
  async removeFile(file) {
    try {
      await fs.promises.rm(file, { force: true });
    } catch (e) {
      this.host.log.warn(`Custom TFT: ${file} could not be removed: ${String(e)}`);
    }
  }
  onRequest(server, req, res, urlPath, filePath, size) {
    var _a;
    if (req.method !== "GET" || req.url !== urlPath) {
      res.writeHead(404, { Connection: "close" }).end();
      return;
    }
    const client = (_a = req.socket.remoteAddress) != null ? _a : "";
    const rangeHeader = req.headers.range;
    const range = parseRange(rangeHeader, size);
    if (range === null) {
      this.host.log.debug(`TFT request from ${client} with unsatisfiable range ${rangeHeader}`);
      res.writeHead(416, { "Content-Range": `bytes */${size}`, Connection: "close" }).end();
      return;
    }
    const start = range ? range.start : 0;
    const end = range ? range.end : size - 1;
    this.host.log.debug(`TFT ${urlPath} requested by ${client}, bytes ${start}-${end}`);
    this.activeRequests++;
    this.clearIdleTimer();
    let done = false;
    const finished = () => {
      if (done) {
        return;
      }
      done = true;
      this.activeRequests--;
      if (this.server === server && this.activeRequests <= 0) {
        this.activeRequests = 0;
        this.armIdleTimer();
      }
    };
    res.on("close", finished);
    const headers = {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      Connection: "close"
    };
    if (range) {
      headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    }
    res.writeHead(range ? 206 : 200, headers);
    const stream = fs.createReadStream(filePath, { start, end });
    stream.on("error", (e) => {
      this.host.log.warn(`TFT file could not be read: ${e.message}`);
      res.destroy();
    });
    stream.pipe(res);
  }
  armIdleTimer() {
    this.clearIdleTimer();
    this.idleTimer = this.host.setTimeout(() => {
      this.idleTimer = void 0;
      if (this.activeRequests > 0) {
        return;
      }
      this.host.log.info("TFT server stopped - no more requests");
      void this.stop();
    }, this.idleTimeoutMs);
  }
  clearIdleTimer() {
    if (this.idleTimer) {
      this.host.clearTimeout(this.idleTimer);
      this.idleTimer = void 0;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TFT_IDLE_TIMEOUT_MS,
  TFT_MAX_CHUNK_SIZE,
  TFT_MAX_SERVE_MS,
  TFT_MAX_SIZE,
  TftServer,
  isUsableServerIp,
  parseRange,
  parseTftChunkMessage,
  parseTftStartMessage,
  safeTftName,
  tftUploadDir
});
//# sourceMappingURL=tft-server.js.map
