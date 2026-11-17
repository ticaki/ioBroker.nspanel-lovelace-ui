'use strict';

/**
 * Environment of the E2E run - evaluated once when the spec file is loaded (mocha loads it synchronously,
 * the options of `tests.integration()` must be known then).
 *
 * - free ports for the objects/states DB, the MQTT broker and the web panel server of the adapter: the
 *   operating system picks them (port 0), so the run never collides with a dev-server or another test run
 * - an own temp directory per adapter directory: `@iobroker/testing` installs the js-controller into
 *   `os.tmpdir()/test-iobroker.<adapter>` - with an own TMPDIR the E2E run does not share it with
 *   `npm run test:integration` or with a run in another worktree
 */
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const adapterDir = path.join(__dirname, '..', '..', '..');

/**
 * Asks the OS for `count` distinct free TCP ports (synchronously, in a child process).
 *
 * @param {number} count number of ports
 * @returns {number[]} the ports
 */
function freePortsSync(count) {
    const script = `
        const net = require('net');
        const servers = [];
        const ports = [];
        let open = ${count};
        for (let i = 0; i < ${count}; i++) {
            const s = net.createServer();
            servers.push(s);
            s.listen(0, '127.0.0.1', () => {
                ports.push(s.address().port);
                if (--open === 0) {
                    Promise.all(servers.map(x => new Promise(r => x.close(r)))).then(() => {
                        process.stdout.write(JSON.stringify(ports));
                    });
                }
            });
        }`;
    const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
    return JSON.parse(out);
}

const [objectsPort, statesPort, mqttPort, webPort] = freePortsSync(4);

const hash = crypto.createHash('sha1').update(adapterDir).digest('hex').slice(0, 8);
const tmpRoot = path.join(os.tmpdir(), `nspanel-e2e-${hash}`);
fs.mkdirSync(tmpRoot, { recursive: true });
// os.tmpdir() of the adapter / controller child processes ...
process.env.TMPDIR = tmpRoot;
// ... and of this process: Node reads TMPDIR only once, a later change of process.env is not seen
os.tmpdir = () => tmpRoot;

module.exports = {
    adapterDir,
    tmpRoot,
    ports: { objects: objectsPort, states: statesPort, mqtt: mqttPort, web: webPort },
    logLevel: process.env.E2E_LOGLEVEL || 'info',
};
