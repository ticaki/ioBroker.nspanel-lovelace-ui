'use strict';

const { expect } = require('chai');
const { isMenuUpdate, parseMenuUpdate, pageTypeOf, icon } = require('../lib/protocol');
const { protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 1: startup. The NSPanel connects to the broker of the adapter, gets the startup page offered and
 * answers with its startup event, the adapter asks Tasmota for its status and shows the start page. The web
 * panel connects, gets `hello` and then the same start page as `cmd` frames, which it acknowledges.
 *
 * The connection itself is made in the suite setup (E2EContext.connectPanels) - here the recorded way is checked.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('01 Startup', () => {
        const { NSPANEL, WEBPANEL, HEADLINES, NAMES } = ctx.config;

        describe('NSPanel (MQTT)', () => {
            step(
                'is offered the startup page, then gets the start page with its items',
                () => {
                    const types = ctx.nspanel.payloads().map(pageTypeOf).filter(Boolean);
                    expect(types).to.include('pageStartup');
                    // the first page after the (last) startup page is the start page
                    expect(types[types.lastIndexOf('pageStartup') + 1]).to.equal('cardGrid');
                    const page = parseMenuUpdate(ctx.nspanel.findLast(isMenuUpdate(HEADLINES.main)));
                    // items in the order of the admin configuration, 6 places of the grid (eu), the rest empty
                    expect(page.items).to.have.length(6);
                    expect(page.items.map(i => i.name)).to.deep.equal([
                        NAMES.socket,
                        NAMES.light,
                        NAMES.blind,
                        NAMES.toSub,
                        '',
                        '',
                    ]);
                    expect(page.items.map(i => i.type)).to.deep.equal([
                        'switch',
                        'light2',
                        'shutter2',
                        'button',
                        '',
                        '',
                    ]);
                    const [socket, light, blind] = page.items;
                    // off: value 0
                    expect(socket.value).to.equal('0');
                    expect(light.value).to.equal('0');
                    // blind: up|stop|down icons and their status (position 50: all enabled)
                    expect(blind.value.split('|')).to.deep.equal([
                        icon('arrow-up'),
                        icon('stop'),
                        icon('arrow-down'),
                        'enable',
                        'enable',
                        'enable',
                    ]);
                    for (const item of page.items.slice(0, 4)) {
                        expect(item.id, `id of ${item.name}`).to.match(/^\d+\?\d+$/);
                        expect([...item.icon], `icon of ${item.name}`).to.have.length(1);
                        expect(item.color, `color of ${item.name}`).to.match(/^\d+$/);
                    }
                    // navigation: next arrow on the right
                    expect(page.right.id).to.equal('bSubNext');
                    expect(page.right.icon).to.equal(icon('arrow-right-bold'));
                },
                { fromStart: true },
            );

            step('asks Tasmota for status, relays and driver version', () => {
                const cmds = ctx.nspanel.tasmotaCommands.map(c => c.topic.toUpperCase());
                expect(cmds).to.include.members(['STATUS0', 'POWER1', 'POWER2', 'GETDRIVERVERSION']);
            });

            step('sends the display settings (dimmode, timeout)', async () => {
                // dimmode~<standby>~<active>~<background>~<foreground>
                const dim = (await ctx.nspanel.waitFor('dimmode~')).split('~');
                expect(dim).to.have.length(5);
                expect(Number(dim[1])).to.be.within(0, 100);
                expect(Number(dim[2])).to.be.within(0, 100);
                const timeout = await ctx.nspanel.waitFor('timeout~');
                expect(Number(timeout.split('~')[1])).to.be.greaterThan(0);
            });

            step('goes online and stores the Tasmota / driver infos', async () => {
                await ctx.waitForValue(ctx.panelState(NSPANEL.id, 'info.isOnline'), true, 15_000);
                await ctx.waitForValue(ctx.panelState(NSPANEL.id, 'info.nspanel.berryDriverVersion'), 11);
                // panels.<id>.status: 4 = online (panelStatusStates)
                await ctx.waitForValue(ctx.panelState(NSPANEL.id, 'status'), 4);
                // STATUS0 of Tasmota is stored as it came
                const status0 = await ctx.waitForState(ctx.panelState(NSPANEL.id, 'info.status'), v => !!v);
                expect(JSON.parse(String(status0.val)).StatusNET.Mac).to.equal(NSPANEL.mac);
            });
        });

        describe('Web panel (WebSocket)', () => {
            step('gets hello with topic, id and model of the admin table', () => {
                const hello = ctx.webHello;
                expect(hello.t).to.equal('hello');
                expect(hello.topic).to.equal(WEBPANEL.topic);
                expect(hello.name).to.equal(WEBPANEL.id);
                expect(hello.model).to.equal(WEBPANEL.model);
                expect(hello.kind).to.equal('web');
            });

            step(
                'receives the start page as cmd frames and acknowledges every seq',
                () => {
                    const types = ctx.web.payloads().map(pageTypeOf).filter(Boolean);
                    expect(types[0]).to.equal('cardGrid');
                    const page = parseMenuUpdate(ctx.web.findLast(isMenuUpdate(HEADLINES.main)));
                    expect(page.items.map(i => i.name)).to.deep.equal([
                        NAMES.socket,
                        NAMES.light,
                        NAMES.blind,
                        NAMES.toSub,
                        '',
                        '',
                    ]);
                    expect(page.items[0].type).to.equal('switch');
                    const cmdFrames = ctx.web.frames.filter(f => f.t === 'cmd');
                    expect(cmdFrames.length).to.be.greaterThan(1);
                    const seqs = cmdFrames.map(f => f.seq);
                    expect(seqs.every(s => Number.isInteger(s))).to.equal(true);
                    expect(new Set(seqs).size).to.equal(seqs.length);
                    expect(ctx.web.acked).to.include.members(seqs);
                },
                { fromStart: true },
            );

            step('goes online', async () => {
                await ctx.waitForValue(ctx.panelState(WEBPANEL.id, 'info.isOnline'), true, 15_000);
            });
        });

        protocolCheck(ctx);
    });
};
