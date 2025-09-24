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
  HttpServer: () => HttpServer
});
module.exports = __toCommonJS(http_server_exports);
var import_http = __toESM(require("http"));
var import_library = require("../controller/library");
var import_fs = __toESM(require("fs"));
class HttpServer extends import_library.BaseClass {
  server;
  constructor(adapter, name, ip, port, fileName) {
    super(adapter, name);
    this.log.debug(`Starting http server on ${ip}:${port} to serve ${fileName}`);
    this.server = import_http.default.createServer({ keepAlive: true }, (req, res) => {
      this.log.debug(`Request received: ${req.url}`);
      import_fs.default.stat(fileName + req.url, (err, stats) => {
        if (err) {
          res.writeHead(404);
          res.write("File not found!", (err2) => {
            if (err2) {
              this.adapter.log.error(`Error writing file: ${err2}`);
            }
            res.end();
          });
        } else {
          this.log.debug(`Content-Length: ${stats.size} bytes`);
          res.writeHead(200, {
            Server: "nginx",
            // Simuliere den Original-Server
            Date: (/* @__PURE__ */ new Date()).toUTCString(),
            // Muss korrekt sein
            "Content-Length": stats.size,
            Connection: "keep-alive",
            "Last-Modified": stats.mtime.toUTCString(),
            ETag: `"${stats.size.toString(16)}-${Date.now().toString(16)}"`,
            "Accept-Ranges": "bytes"
          });
          const fileStream = import_fs.default.createReadStream(fileName + req.url, { highWaterMark: 64 * 1024 });
          fileStream.pipe(res);
        }
      });
    }).listen(port, ip);
  }
  async delete() {
    this.log.debug("Closing http server");
    this.server.close();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpServer
});
//# sourceMappingURL=http-server.js.map
