import http from 'http';
import { BaseClass } from './library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import fs from 'fs';

export class HttpServer extends BaseClass {
    server: http.Server;
    constructor(adapter: NspanelLovelaceUi, name: string, ip: string, port: number, fileName: string) {
        super(adapter, name);
        this.log.debug(`Starting http server on ${ip}:${port} to serve ${fileName}`);
        this.server = http
            .createServer((req, res) => {
                this.log.debug(`Request received: ${req.url}`);
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

                fs.readFile(fileName + req.url, (err, data) => {
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
                        res.writeHead(200, {
                            'Content-Type': 'application/octet-stream',
                            'Content-Length': data.byteLength,
                            'Accept-Ranges': 'bytes',
                        });
                        res.write(data, err => {
                            if (err) {
                                this.adapter.log.error(`Error writing file: ${err}`);
                            }
                            res.end();
                            //void this.delete();
                        });
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
