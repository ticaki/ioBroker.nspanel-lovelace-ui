import http from 'http';
import { BaseClass } from './library';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';

export class HttpServer extends BaseClass {
    fileVersion: string;
    server: http.Server;
    constructor(adapter: NspanelLovelaceUi, version: string, port: number) {
        super(adapter);
        this.fileVersion = version;
        this.server = http
            .createServer((req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/tft' });

                this.adapter.readFile(this.name, `nspanel-v${this.fileVersion}.tft`, (err, data) => {
                    if (err) {
                        res.writeHead(404);
                        res.write('File not found!', err => {
                            if (err) {
                                this.adapter.log.error(`Error writing file: ${err}`);
                            }
                            res.end();
                            this.server.close();
                        });
                    } else {
                        res.write(data, err => {
                            if (err) {
                                this.adapter.log.error(`Error writing file: ${err}`);
                            }
                            res.end();
                            this.server.close();
                        });
                    }
                });
            })
            .listen(port);
    }
    async delete(): Promise<void> {
        this.server.close();
    }
}
