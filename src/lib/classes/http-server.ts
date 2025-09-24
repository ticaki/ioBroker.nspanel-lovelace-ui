import http from 'http';
import { BaseClass } from '../controller/library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import fs from 'fs';

export class HttpServer extends BaseClass {
    server: http.Server;
    constructor(adapter: NspanelLovelaceUi, name: string, ip: string, port: number, fileName: string) {
        super(adapter, name);
        this.log.debug(`Starting http server on ${ip}:${port} to serve ${fileName}`);
        this.server = http
            .createServer({ keepAlive: true }, (req, res) => {
                this.log.debug(`Request received: ${req.url}`);

                fs.stat(fileName + req.url, (err, stats) => {
                    if (err) {
                        res.writeHead(404);
                        res.write('File not found!', err => {
                            if (err) {
                                this.adapter.log.error(`Error writing file: ${err}`);
                            }
                            res.end();
                            //void this.delete();
                        });
                    } else {
                        this.log.debug(`Content-Length: ${stats.size} bytes`);
                        res.writeHead(200, {
                            Server: 'nginx', // Simuliere den Original-Server
                            Date: new Date().toUTCString(), // Muss korrekt sein
                            'Content-Length': stats.size,
                            Connection: 'keep-alive',
                            'Last-Modified': stats.mtime.toUTCString(),
                            ETag: `"${stats.size.toString(16)}-${Date.now().toString(16)}"`,
                            'Accept-Ranges': 'bytes',
                        });
                        const fileStream = fs.createReadStream(fileName + req.url, { highWaterMark: 64 * 1024 });
                        fileStream.pipe(res);

                        //void this.delete();
                    }
                });
            })
            .listen(port, ip);
    }
    async delete(): Promise<void> {
        this.log.debug('Closing http server');
        this.server.close();
    }
}
