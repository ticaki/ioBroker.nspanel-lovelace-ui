'use strict';

/**
 * Local end-to-end test: `npm run test:e2e` (see test/e2e/README.md).
 *
 * @iobroker/testing sets up a fresh js-controller with own databases, the adapter starts with the admin
 * configuration of fixtures/config.js, a virtual NSPanel (MQTT) and a virtual web panel (WebSocket) connect
 * and the scenarios press buttons and check single fields of the payloads and the states. Every payload is checked
 * against the HMI protocol (lib/payload-validator.js), every step compares the end state of both panels with a
 * snapshot (lib/snapshot.js, __snapshots__/e2e.snap.json).
 *
 * All scenarios run in ONE suite (one adapter start) in the order below - later scenarios build on the
 * page the earlier ones left the panels on, each scenario starts with going back to a known page.
 */
const fs = require('node:fs');
const path = require('node:path');
const env = require('./lib/env');
const { tests } = require('@iobroker/testing');
const { E2EContext } = require('./lib/context');
const snapshot = require('./lib/snapshot');

const scenarios = [
    require('./scenarios/01-startup'),
    require('./scenarios/02-navigation'),
    require('./scenarios/03-switching'),
    require('./scenarios/04-popups'),
    require('./scenarios/05-screensaver'),
    require('./scenarios/06-screensaver-modes'),
    require('./scenarios/07-popup-notify3'),
    require('./scenarios/08-screensaver-notify'),
    require('./scenarios/09-battery'),
];

console.log(
    `E2E: temp dir ${env.tmpRoot}, ports objects ${env.ports.objects} states ${env.ports.states} ` +
        `mqtt ${env.ports.mqtt} web ${env.ports.web}`,
);

tests.integration(env.adapterDir, {
    controllerVersion: '6.0.11',
    loglevel: env.logLevel,
    ports: { objects: env.ports.objects, states: env.ports.states },

    defineAdditionalTests({ suite }) {
        suite('E2E', getHarness => {
            const ctx = new E2EContext(env.ports);
            snapshot.init(ctx);

            before(async function () {
                this.timeout(120_000);
                await ctx.prepare(getHarness());
                await ctx.startAdapter();
                await ctx.connectPanels();
            });

            after(async function () {
                this.timeout(30_000);
                await ctx.closePanels();
                snapshot.save();
                if (process.env.E2E_DUMP) {
                    // all payloads of both panels, for writing new assertions
                    const file = path.join(env.tmpRoot, 'payloads.log');
                    const lines = [
                        ...ctx.nspanel.entries.map(e => `nspanel ${e.index} ${e.payload}`),
                        ...ctx.web.entries.map(e => `web ${e.index} ${e.payload}`),
                    ];
                    fs.writeFileSync(file, `${lines.join('\n')}\n`);
                    console.log(`E2E: payloads written to ${file}`);
                }
                const errors = ctx.adapterErrors();
                if (errors.length) {
                    console.log(`E2E: adapter logged ${errors.length} error(s):\n  ${errors.join('\n  ')}`);
                }
            });

            for (const scenario of scenarios) {
                scenario(ctx);
            }
            snapshot.staleCheck();
        });
    },
});
