import {
    SENDTO_GET_PANEL_NAVIGATION_COMMAND,
    SAVE_PANEL_NAVIGATION_COMMAND,
    SENDTO_GET_PAGES_COMMAND,
    SENDTO_GET_PANELS_COMMAND,
    SENDTO_GET_PAGE_ITEM_TEMPLATES_COMMAND,
    SENDTO_GET_MEDIA_PLAYER_COMMAND,
    SENDTO_GET_PAGES_All_COMMAND,
    SENDTO_CONVERT_SCRIPT_COMMAND,
    ALL_PANELS_SPECIAL_ID,
    migrateLegacyCharts,
    migrateLegacyPower,
    legacyPowerStates,
} from './lib/types/adminShareConfig';
/*
 * Created with @iobroker/create-adapter v2.5.0..
 */
//FlashNextionAdv0 ${this.config.tftUrl}/nspanel-v4.6.0.tft ist die 55
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { Library } from './lib/controller/library';
import 'source-map-support/register';
// Load your modules here, e.g.:

import * as MQTT from './lib/classes/mqtt';
import { Controller } from './lib/controller/controller';
import { VirtualPanelManager, legacyWebPanelTree, removeLegacyWebPanelTrees } from './lib/web/virtual-panel-manager';
import { WebServer, type WebServerTls } from './lib/web/web-server';
import { FidoService } from './lib/web/fido';
import { FidoCredentialStore } from './lib/web/fido-store';
import { Icons } from './lib/const/icon_mapping';
import * as definition from './lib/const/definition';
import { ConfigManager, NoPanelsConfiguredError } from './lib/classes/config-manager';
import { pageItemTemplateInfos } from './lib/templates/template-info';
import { mediaPlayerInfo } from './lib/configuration/admin-media';
import type { Panel, panelConfigPartial } from './lib/controller/panel';
import { generateAliasDocumentation } from './lib/tools/readme';
import { TftServer, isUsableServerIp, parseTftChunkMessage, parseTftStartMessage } from './lib/tools/tft-server';
import { redactSecretsInText, stringifyForLog } from './lib/tools/redact';
import { formatErrorForLog } from './lib/tools/error-format';
import {
    getBerryCommitCommand,
    findBerryInstallTopic,
    getBerryDownloadCommand,
    getBerryLegacyInstallCommand,
    getBerryRestoreCommand,
    getTasmotaCommandUrl,
    BERRY_FLASH_MODE_COMMAND,
    isBerryFlashing,
    type TasmotaLogin,
} from './lib/tools/berry-install';
import {
    buildTestObjects,
    createTestObjects,
    CREATE_TEST_STATES_COMMAND,
    parseTestStatesFile,
} from './lib/tools/test-states';
import { fingerprintCredential, isCredentialId, resolveLogin, resolveSecret } from './lib/credentials';
import { URL } from 'node:url';
import type * as pages from './lib/types/pages';
import * as fs from 'node:fs';
import type { NavigationItemConfig } from './lib/classes/navigation';
import {
    adminReplacedPageIds,
    applyNavigationOverrides,
    scriptLinksByPage,
} from './lib/configuration/navigation-overrides';
import { applyAdminButtons } from './lib/configuration/panel-buttons';
import { checkScriptConfigTopics, findPanelEntry, isNoScriptPanel } from './lib/configuration/no-script';
import { buildPageDump } from './lib/configuration/page-dump';
import { NsPanelTsImport, isNsPanelTsConvertRequest } from './lib/configuration/nspanelts-import-runner';
import {
    SENDTO_PAGE_DUMP_COMMAND,
    SENDTO_PAGE_DUMP_LIST_COMMAND,
    isPageDumpRequest,
    type PageDumpListEntry,
} from './lib/types/pageDump';
import {
    applyPendingScriptConversions,
    isPendingScriptConversion,
    ScriptToAdminRunner,
} from './lib/configuration/script-to-admin-runner';
import { adminPageItemToScriptItem } from './lib/configuration/admin-page-item';
import { deviceDetailsInfo } from './lib/configuration/admin-device-details';
import { buildDevicePage, devicePageName } from './lib/pages/device-page';
import { isPageItemWithoutTemplate } from './lib/types/type-pageItem';
import {
    deviceDetailsRuntimeOf,
    deviceShortPressOf,
    SENDTO_GET_DEVICE_DETAILS_COMMAND,
} from './lib/types/deviceDetails';
import path from 'node:path';
import { testScriptConfig } from './lib/const/test';
import type {
    NavigationSavePayload,
    PanelListEntry,
    PanelInfo,
    PageConfig,
    AdminPageItemConfig,
} from './lib/types/adminShareConfig';
import { isTasmotaStatusNet } from './lib/types/function-and-const';
import type { oldQRType } from './lib/types/types';
import iCal from 'node-ical';
import type { NSPanel } from './lib/types/NSPanel';
import { getTasmotaVersionFromJson } from './lib/const/tools';
import { driverGeneration, isEmulatorDriverVersion, parseDriverVersion } from './lib/const/berry-driver';
import {
    matchPanelForSetup,
    migrateScriptConfigTopic,
    replacePanelTopicInScript,
    SCRIPT_END_STOP_TOKEN,
} from './lib/tools/panel-setup';

/** Zwischenstand einer laufenden Panel-Einrichtung, siehe `nsPanelInitStep1` */
interface NsPanelInitSession {
    /** der Panel-Eintrag der Adapterkonfiguration, in Schritt 2 gefüllt */
    item: ioBroker.AdapterConfig['panels'][number];
    /** true, wenn das Panel noch nicht in der Konfiguration steht */
    isNew: boolean;
    /**
     * Topic, unter dem die laufende Panel-Instanz bekannt ist - bei einem bestehenden Panel das bisherige
     * Topic aus der Konfiguration (es kann sich bei der Einrichtung ändern), sonst das neue
     */
    panelTopic: string;
    /**
     * Name des Panels vor der Einrichtung - bei einem bestehenden Panel der bisherige Name aus der Konfiguration,
     * sonst leer. Schritt 2 überschreibt den Namen in `item`, für das Umbenennen des Skripts wird er hier gesichert.
     */
    panelName: string;
    /** true, wenn statt eines Panels der Emulator antwortet - dann entfallen Berry und TFT */
    isEmulator: boolean;
    /** Zeitpunkt des letzten Schritts, für das Aufräumen abgebrochener Einrichtungen */
    ts: number;
}

/** Eine abgebrochene Einrichtung wird nach dieser Zeit vergessen */
const NS_PANEL_INIT_SESSION_TTL = 600_000;

class NspanelLovelaceUi extends utils.Adapter {
    library: Library;
    mqttClient: MQTT.MQTTClientClass | undefined;
    mqttServer: MQTT.MQTTServerClass | undefined;
    controller: Controller | undefined;
    /** HTTP/WebSocket server of the web panels, undefined when disabled */
    webServer: WebServer | undefined;
    /** registered FIDO2 keys of the web panels (loaded on demand) */
    private fidoStore: FidoCredentialStore | undefined;
    /** upload and short-lived HTTP server for a custom TFT (admin tab developer), created on demand */
    private tftServer: TftServer | undefined;
    unload: boolean = false;
    testSuccessful: boolean = true;
    timeoutAdmin: ioBroker.Timeout | undefined;
    timeoutAdmin2: ioBroker.Timeout | undefined;
    timeoutAdminArray: (ioBroker.Timeout | undefined)[] = [];

    intervalAdminArray: (ioBroker.Interval | undefined)[] = [];

    mainConfiguration: panelConfigPartial[] | undefined;

    testCaseConfig: any; // just for testing
    scriptConfigBacklog: any[] = [];

    fetchs: Map<AbortController, ioBroker.Timeout | undefined> = new Map();

    paused: boolean = false;
    public versionJson: { data: Record<string, string>; timestamp: number } | undefined = undefined;
    /** Zwischenstände der dreistufigen Panel-Einrichtung, nach Topic */
    private nsPanelInitSessions: Map<string, NsPanelInitSession> = new Map();
    /** Zentrale Credentials dieser Instanz: Id -> Fingerabdruck der Werte beim letzten Auflösen */
    private watchedCredentials: Map<string, string | undefined> = new Map();
    /** Credentials, deren Änderung noch zu prüfen ist - siehe onObjectChange */
    private pendingCredentialChecks: Set<string> = new Set();
    /** Entprellung der Credential-Prüfung */
    private credentialCheckTimer: ioBroker.Timeout | undefined;
    /** Wartezeit der Entprellung in ms - mehrere Speicherklicks im Admin ergeben so eine Prüfung */
    private static readonly CREDENTIAL_CHECK_DELAY_MS = 2500;
    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'nspanel-lovelace-ui',
            useFormatDate: true,
        });
        this.library = new Library(this);
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        // init some propertys so we dont need undefined checks
    }

    /**
     * Applies the navigation overrides of the admin (`native.navigationOverrides`) to the script
     * navigation of one panel, before the panel is created from it. What the script says is kept
     * next to it, so the admin can show both and tell a changed script from the override.
     *
     * @param panelConfig Converted configuration of the panel - changed in place.
     * @param panelTopic Topic of the panel.
     */
    private applyNavigationOverridesTo(panelConfig: Partial<panelConfigPartial>, panelTopic: string): void {
        if (!Array.isArray(panelConfig.navigation)) {
            return;
        }
        panelConfig.scriptNavigationLinks = scriptLinksByPage(panelConfig.navigation);
        const overrides = Array.isArray(this.config.navigationOverrides) ? this.config.navigationOverrides : [];
        if (overrides.length === 0) {
            panelConfig.navigationOverrideStates = {};
            return;
        }
        // The same rule admin.ts applies: such a script page is taken out again, an override for
        // it would be lost silently
        const replaced = adminReplacedPageIds(
            Array.isArray(this.config.pageConfig) ? this.config.pageConfig : [],
            panelTopic,
            !!this.config.adminOverridesScriptPages,
        );
        const result = applyNavigationOverrides(
            panelConfig.navigation,
            overrides,
            panelTopic,
            panelConfig.generatedPageIds ?? [],
            replaced,
        );
        panelConfig.navigation = result.navigation;
        panelConfig.navigationOverrideStates = Object.fromEntries(result.states);
        for (const item of result.skipped) {
            const text = `navigation override for page ${item.page} of ${panelTopic} ignored: `;
            switch (item.reason) {
                case 'generated':
                    this.log.warn(`${text}generated page`);
                    break;
                case 'replaced':
                    this.log.warn(`${text}page is replaced by the admin configuration`);
                    break;
                case 'unsupported':
                    this.log.warn(`${text}navigation node name differs from the page id`);
                    break;
                default:
                    // The override was made from the flow, so the page existed - it is gone from the
                    // script since (or the panel runs without one). Nothing is broken, the override
                    // simply waits for the page to come back.
                    this.log.info(`${text}page not found in the script configuration`);
                    break;
            }
        }
        for (const [page, state] of result.states) {
            if (state.stale) {
                this.log.info(
                    `navigation override for page ${page} of ${panelTopic}: the script navigation changed since the override was made - check the navigation flow in the admin`,
                );
            }
        }
    }

    /**
     * Reloads every running panel marked "panel uses no script" with the adapter default configuration
     * (+ the global script configuration, merged by the config manager) - after the global script changed.
     * Nothing is stored: the stored script configuration of such a panel stays untouched.
     *
     * @returns messages for the sender
     */
    private async reloadNoScriptPanels(): Promise<string[]> {
        const messages: string[] = [];
        for (const panel of this.config.panels || []) {
            if (!panel || !panel.topic || panel.noScript !== true || this.unload) {
                continue;
            }
            if (!this.controller?.panels.some(p => p && p.topic === panel.topic)) {
                continue;
            }
            const manager = new ConfigManager(this, true);
            try {
                const c = await manager.setScriptConfig(ConfigManager.getDefaultScriptConfig(panel.topic, true));
                if (c.panelConfig) {
                    c.panelConfig.model = panel.model || 'eu';
                    const state = await this.reloadPanelWithConfig(c.panelConfig, messages);
                    if (state === 'stopping') {
                        break;
                    }
                } else {
                    messages.push(...c.messages);
                }
            } finally {
                await manager.delete();
            }
        }
        return messages;
    }

    /**
     * Reloads a panel with a freshly converted configuration: merges it with the stored configuration of the
     * other panels (the same way the adapter start does), applies the admin buttons and navigation overrides,
     * removes the running panel and adds it again.
     *
     * @param panelConfig configuration of the panel as `ConfigManager.setScriptConfig` returns it
     * @param messages receives the messages for the sender
     * @returns 'reloaded', 'failed' or 'stopping' when the adapter unloads meanwhile
     */
    private async reloadPanelWithConfig(
        panelConfig: Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
            navigation: NavigationItemConfig[];
            pages: pages.PageBase[];
        },
        messages: string[],
    ): Promise<'reloaded' | 'failed' | 'stopping'> {
        // Merge with the stored configuration of the other panels, the
        // same way the adapter start does. Without it the reloaded
        // panel would lose the pages of all other panels and could no
        // longer navigate to them.
        const others: Partial<panelConfigPartial>[] = [];
        const instanceObj = await this.getForeignObjectAsync(this.namespace);
        const stored = instanceObj?.native?.scriptConfig;
        if (Array.isArray(stored)) {
            for (const item of stored as Partial<panelConfigPartial>[]) {
                if (
                    item &&
                    item.topic &&
                    item.topic !== panelConfig.topic &&
                    this.config.panels.findIndex(a => a.topic === item.topic) !== -1 &&
                    // its stored script configuration is not used at adapter start either
                    !isNoScriptPanel(this.config.panels, item.topic)
                ) {
                    others.push(item);
                }
            }
        }
        const panelTopic = panelConfig.topic ?? '';
        this.applyAdminButtonsTo(
            panelConfig,
            this.config.panels.find(p => p && p.topic === panelTopic),
        );
        this.applyNavigationOverridesTo(panelConfig, panelTopic);
        const arr = await ConfigManager.getConfig(this, [panelConfig, ...others]);
        if (arr && arr.length > 0) {
            const config = arr[0];
            if (this.controller && config) {
                const topic = config.topic;

                if (topic) {
                    const index = this.config.panels.findIndex(p => p.topic === topic);
                    if (index !== -1) {
                        const indexC = this.controller.panels.findIndex(a => a.topic === topic);
                        if (indexC !== -1) {
                            config.model = this.config.panels[index].model;
                            await this.controller.removePanel(this.controller.panels[indexC]);

                            if (this.unload) {
                                return 'stopping';
                            }
                            await this.delay(1000);

                            if (this.unload) {
                                return 'stopping';
                            }
                        }
                        const done = await this.controller.addPanel(config);
                        if (done) {
                            const name = config.name || config.topic;
                            const msg = `✅ Panel "${name}" reloaded with updated configuration.`;
                            this.log.info(msg);
                            messages.push(msg);
                            return 'reloaded';
                        }
                        const msg = `Panel ${topic} found but could not be reloaded. Check log for details.`;
                        this.log.error(msg);
                        messages.push(msg);
                    } else {
                        messages.push(
                            `Panel ${topic} not found in Adapter configuration. Check Admin configuration for correct panel topic.`,
                        );
                    }
                } else {
                    messages.push(`Panel ${topic} not found in script. Configuration saved. Adapter restart required!`);
                }
            } else {
                messages.push(
                    this.controller
                        ? `Controller not exist.  Configuration saved. Adapter restart required!`
                        : `Config not exist. `,
                );
            }
        } else {
            messages.push(`No config found after conversion`);
        }
        return 'failed';
    }

    /**
     * Applies the hardware button actions of the admin (`native.panels[].buttonLeft/buttonRight`)
     * to the configuration of one panel, before the panel is created from it. A side configured in
     * the admin wins over the configuration script, an untouched side keeps the script value.
     *
     * @param panelConfig Converted configuration of the panel - changed in place.
     * @param item Panel entry of the admin table.
     */
    private applyAdminButtonsTo(
        panelConfig: Partial<panelConfigPartial>,
        item: ioBroker.AdapterConfig['panels'][number] | undefined,
    ): void {
        const result = applyAdminButtons(panelConfig.buttons, item);
        panelConfig.buttons = result.buttons;
        for (const side of result.invalid) {
            this.log.warn(
                `The ${side} hardware button of ${item?.topic ?? '?'} is configured wrongly in the admin - the configuration script decides`,
            );
        }
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        // this.config.deactivateDebugLog = true; // just for testing
        // rewrite log functions to reduce log output while developing. Add silly log for important debug messages.
        // remove silly logs after testing to reduce log output
        if (this.config.deactivateDebugLog) {
            this.log.debug = (_msg: string) => {};
            this.log.silly = this.log.info;
        }
        await this.extendForeignObjectAsync(this.namespace, {
            type: 'meta',
            common: { name: { en: 'Nspanel Instance', de: 'Nspanel Instanze' }, type: 'meta.folder' },
            native: {},
        });

        if (this.config.forceTFTVersion) {
            this.log.warn(
                `⚠️  TFT firmware is pinned to version ${this.config.forceTFTVersion}. Remember: you will always stay on this version until you change it.`,
            );
            if (this.config.forceTFTVersion === '0.0.0') {
                this.log.warn(
                    `⚠️  Developer version of the TFT firmware is used. This version may be unstable and have bugs! No support in the forum!`,
                );
            }
        }

        if (this.config.fixBrokenCommonTypes) {
            //fix broken common.type in alias.0 from iobroker.device
            const states = await this.getForeignObjectsAsync('alias.0.*');
            this.log.info('Fix broken common.type in alias.0');
            if (states) {
                for (const id in states) {
                    if (
                        states[id] &&
                        states[id].type === 'state' &&
                        states[id].common &&
                        String(states[id].common.type) === 'state'
                    ) {
                        this.log.warn(`Fix broken common.type in ${id} set to 'mixed'`);
                        states[id].common.type = 'mixed';
                        await this.extendForeignObjectAsync(id, states[id]);
                    }
                }
            }
        }
        const o = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
        if (o && o.native) {
            let change = false;
            const native = o.native as any;
            if (native.fixBrokenCommonTypes === true) {
                native.fixBrokenCommonTypes = false;
                change = true;
            }
            native.pageConfig = native.pageConfig || [];
            if (native.pageUnlockConfig && !native.pageConfig) {
                native.pageConfig = native.pageUnlockConfig;
                delete native.pageUnlockConfig;
                change = true;
            }
            if (native.pageQRdata) {
                // the old table kept the wifi password as an index into the encrypted fields pageQRpwd1..3,
                // the new entry has no counterpart for that - the password has to be entered again
                const pagesWithoutPassword: string[] = [];
                native.pageQRdata.forEach((page: oldQRType) => {
                    const temp: PageConfig = {
                        card: 'cardQR',
                        uniqueName: page.pageName,
                        headline: page.headline,
                        selType: page.selType,
                        ssidUrlTel: page.SSIDURLTEL,
                        wlantype: page.wlantype,
                        setState: page.setState || '',
                        wlanhidden: page.wlanhidden || false,
                        pwdhidden: page.pwdhidden || false,
                        hidden: page.hiddenByTrigger || false,
                        alwaysOn: page.alwaysOnDisplay ? 'always' : 'none',
                    };
                    if (page.selType === 1 && page.wlantype !== 'nopass') {
                        pagesWithoutPassword.push(page.pageName);
                    }

                    native.pageConfig.push(temp);
                });
                if (pagesWithoutPassword.length > 0) {
                    this.log.warn(
                        `QR pages moved from the old table to the page configuration: ${pagesWithoutPassword.join(', ')}. The wifi password was not taken over - please enter it again in the admin (page editor, wifi password or credential).`,
                    );
                }
                delete native.pageQRdata;
                change = true;
            }
            // old admin table "Page Chart": the pages move into pageConfig and keep their navigation
            // from the script until one is assigned in the admin; the table is removed afterwards
            if (native.pageChartdata !== undefined) {
                const migrated = migrateLegacyCharts(
                    Array.isArray(native.pageChartdata) ? native.pageChartdata : [],
                    native.pageConfig,
                );
                for (const msg of migrated.messages) {
                    this.log.warn(msg);
                }
                if (migrated.changed) {
                    const count = migrated.entries.length - native.pageConfig.length;
                    native.pageConfig = migrated.entries;
                    this.log.info(
                        `Moved ${count} chart page(s) from the table "Page Chart" to the page configuration.`,
                    );
                }
                delete native.pageChartdata;
                change = true;
            }
            // old admin table "Page Power": same transition as the charts; a value takes the unit of its
            // state object, as the old table path displayed it
            if (native.pagePowerdata !== undefined) {
                const rows = Array.isArray(native.pagePowerdata) ? native.pagePowerdata : [];
                const stateUnits: Record<string, string> = {};
                for (const id of legacyPowerStates(rows)) {
                    try {
                        const o = await this.getForeignObjectAsync(id);
                        if (o?.common && typeof o.common.unit === 'string' && o.common.unit) {
                            stateUnits[id] = o.common.unit;
                        }
                    } catch {
                        // invalid id - keeps the unit of the table
                    }
                }
                const migrated = migrateLegacyPower(rows, native.pageConfig, stateUnits);
                for (const msg of migrated.messages) {
                    this.log.warn(msg);
                }
                if (migrated.changed) {
                    const count = migrated.entries.length - native.pageConfig.length;
                    native.pageConfig = migrated.entries;
                    this.log.info(
                        `Moved ${count} power page(s) from the table "Page Power" to the page configuration.`,
                    );
                }
                delete native.pagePowerdata;
                change = true;
            }
            if (!this.config.versionJsonUrl || !this.config.tftUrl || !this.config.berryUrl) {
                try {
                    const iopackage = JSON.parse(
                        fs.readFileSync(path.join(__dirname, '..', 'io-package.json'), 'utf-8'),
                    );
                    native.versionJsonUrl = iopackage.native.versionJsonUrl || '';
                    native.tftUrl = iopackage.native.tftUrl || '';
                    native.berryUrl = iopackage.native.berryUrl || '';
                    change = true;
                } catch (e: unknown) {
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    this.log.error(`Error while reading io-package.json for default URLs: ${errorMessage}`);
                }
            }

            // a script conversion (sendTo convertScriptToAdmin) the adapter did not finish: its admin part is
            // parked in the meta object - applied here, the parked entry is removed after the instance write
            const meta = await this.getForeignObjectAsync(this.namespace);
            let parkedMeta: typeof meta;
            const parkedList: unknown[] = Array.isArray(meta?.native?.pendingScriptConversion)
                ? meta.native.pendingScriptConversion
                : [];
            if (meta && parkedList.length > 0) {
                const parked = parkedList.filter(isPendingScriptConversion);
                const topics = parked.map(p => p.panelTopic).join(', ');
                meta.native.pendingScriptConversion = [];
                if (applyPendingScriptConversions(native, parked, this.log)) {
                    this.log.warn(
                        `Applied the parked script conversion of panel(s) ${topics} to the admin configuration`,
                    );
                    parkedMeta = meta;
                    change = true;
                } else {
                    this.log.info(`Parked script conversion of panel(s) ${topics}: everything is already in the admin`);
                    await this.setForeignObjectAsync(this.namespace, meta);
                }
            }

            if (change) {
                const uniquePages = new Map();
                for (const p of native.pageConfig ?? []) {
                    if (p?.uniqueName) {
                        if (uniquePages.has(p.uniqueName)) {
                            this.log.warn(`Duplicate uniqueName '${p.uniqueName}' found in pageConfig!`);
                            continue;
                        }
                        uniquePages.set(p.uniqueName, p);
                    }
                }
                native.pageConfig = [...uniquePages.values()];
                await this.setForeignObject(`system.adapter.${this.namespace}`, o);
                if (parkedMeta) {
                    await this.setForeignObjectAsync(this.namespace, parkedMeta);
                }
                this.log.warn(`Updated configuration of ${this.namespace} to the latest version. Restart adapter!`);
                return;
            }
        }

        await generateAliasDocumentation();
        if (this.config.testCase) {
            this.log.warn('Testcase mode!');
        }

        if (this.config.weatherEntity === undefined || typeof this.config.weatherEntity !== 'string') {
            this.config.weatherEntity = '';
        } else if (
            this.config.weatherEntity !== '' &&
            definition.weatherEntities.findIndex(a => this.config.weatherEntity.startsWith(a)) === -1
        ) {
            this.log.error(
                `Invalid weatherEntity index, set to ${this.config.weatherEntity}. Report this to the developer! Use custom.`,
            );
            this.config.weatherEntity = '';
        }

        await this.applyCredentials();

        //try {

        let pauseAdapter = false;
        this.mainConfiguration = [];
        const obj = await this.getForeignObjectAsync(this.namespace);
        if (obj && obj.native) {
            const config = [];
            const scriptConfigRaw: any[] = Array.isArray(obj.native.scriptConfigRaw) ? obj.native.scriptConfigRaw : [];
            const scriptConfig: any[] = Array.isArray(obj.native.scriptConfig) ? obj.native.scriptConfig : [];
            const panelsText = (this.config.panels || []).map(a => `[${a.name}#${a.topic}]`).join(', ');
            const configsText = scriptConfigRaw.map(a => `${a.panelTopic}`).join(', ');

            // Überblicks-Logs
            this.log.info(`Configured panels: name#topic -> ${panelsText}`);
            this.log.info(`Found ${scriptConfigRaw.length} script configs for topics: ${configsText}`);
            this.log.info(
                `Detailed configuration checks are suppressed here. Full validation output is only shown when the configuration script is sent to the adapter.`,
            );

            const manager = new ConfigManager(this, true);
            manager.log.warn = function (_msg: string) {
                // silence ConfigManager warnings
            };

            for (const a of this.config.panels || []) {
                if (!a || !a.topic) {
                    continue;
                }

                let usedConfig: 'raw' | 'converted' | 'default' | null = null;
                let rawFound = false;
                let rawConversionFailed = false;
                // The configuration chosen for this panel - gets the navigation overrides of the
                // admin applied before it is used
                let chosen: Partial<panelConfigPartial> | undefined;

                // "panel uses no script": a stored script configuration of this panel is left in place (for
                // the case the check mark is removed again) but not used - admin + global script only
                const noScript = a.noScript === true;

                // 1) RAW versuchen
                const raw = noScript
                    ? undefined
                    : scriptConfigRaw.find((b: { panelTopic: string }) => b.panelTopic === a.topic);
                if (raw) {
                    rawFound = true;
                    const c = await manager.setScriptConfig(raw);
                    if (c && c.messages && c.messages.length > 0) {
                        if (!c.messages[0].startsWith('Panel')) {
                            this.log.warn(c.messages[0]);
                        }
                    }
                    if (c && c.panelConfig) {
                        c.panelConfig.model = a.model || 'eu';
                        chosen = c.panelConfig;
                        usedConfig = 'raw';
                    } else {
                        rawConversionFailed = true; // RAW existiert, aber Umwandlung fehlgeschlagen
                    }
                }

                // 2) Fallback: converted
                if (!usedConfig && !noScript) {
                    const conv = scriptConfig.find((b: { topic: string }) => b.topic === a.topic);
                    if (conv) {
                        conv.model = a.model || 'eu';
                        chosen = conv;
                        usedConfig = 'converted';
                    }
                }

                // 3) Fallback: kein Skript - die Admin-Konfiguration reicht, das Skript-Template ohne Inhalt dient als Basis
                if (!usedConfig && !rawFound) {
                    const c = await manager.setScriptConfig(ConfigManager.getDefaultScriptConfig(a.topic, noScript));
                    if (c && c.panelConfig) {
                        c.panelConfig.model = a.model || 'eu';
                        chosen = c.panelConfig;
                        usedConfig = 'default';
                    }
                }

                if (chosen) {
                    this.applyAdminButtonsTo(chosen, a);
                    this.applyNavigationOverridesTo(chosen, a.topic);
                    config.push(chosen);
                }

                // 4) Ergebnis-Log pro Panel
                if (!usedConfig) {
                    this.log.warn(`No usable config found for ${a.topic}`);
                    await manager.delete();
                } else if (usedConfig === 'raw') {
                    this.log.debug(`Config for ${a.topic}: raw`);
                } else if (usedConfig === 'default') {
                    this.log.info(
                        noScript
                            ? `Panel ${a.name || a.topic} without script - admin configuration only`
                            : `No script config for ${a.topic} - using the admin configuration only`,
                    );
                } else {
                    // usedConfig === 'converted'
                    if (rawFound && rawConversionFailed) {
                        this.log.warn(
                            `Config for ${a.topic}: converted (RAW conversion failed). ` +
                                `Please update the configuration script and send it to the adapter again.`,
                        );
                    } else {
                        this.log.warn(`Config for ${a.topic}: converted`);
                    }
                }
            }
            try {
                this.mainConfiguration = await ConfigManager.getConfig(this, config);
            } catch (e: any) {
                if (e instanceof NoPanelsConfiguredError) {
                    this.log.info(e.message);
                } else {
                    this.log.error(`Error in configuration: ${e.message}`);
                }
                this.mainConfiguration = [];
                pauseAdapter = true;
            }
        }

        if (this.config.mqttServer && this.config.mqttPort && this.config.mqttUsername) {
            this.config.mqttPassword = this.config.mqttPassword || '';

            const port = await this.getPortAsync(this.config.mqttPort);
            if (port != this.config.mqttPort) {
                this.log.error(`Port ${this.config.mqttPort} is already in use!`);
                this.log.error(`Please change the port in the admin settings to ${port}!`);
                this.log.error('Stopping adapter!');
                if (this.stop) {
                    await this.stop();
                }
                return;
            }
            this.mqttServer = await MQTT.MQTTServerClass.createMQTTServer(
                this,
                this.config.mqttPort,
                this.config.mqttUsername,
                this.config.mqttPassword,
                './mqtt',
                this.config.testCase,
            );
            this.config.mqttIp = '127.0.0.1';
        }

        if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword)) {
            this.log.error('Invalid admin configuration for mqtt!');
            this.testSuccessful = false;
            return;
        }

        //check config
        try {
            Icons.adapter = this;
            await this.library.init();
            const states = await this.getStatesAsync('*');
            await this.library.initStates(states);
            // web clones share the tree of their hardware panel now - the trees of former web panels are dead
            await removeLegacyWebPanelTrees(this);
            this.mqttClient = new MQTT.MQTTClientClass(
                this,
                this.config.mqttIp,
                this.config.mqttPort,
                this.config.mqttUsername,
                this.config.mqttPassword,
                this.config.mqttServer,
                async (topic, message) => {
                    this.log.debug(`${topic} ${message}`);
                },
            );
            if (!this.mqttClient) {
                return;
            }
            await this.mqttClient.waitConnectAsync(5000);
            if (pauseAdapter) {
                return;
            }
            await this.onMqttConnect();
            // 1 ms: only gives the event loop some air, no need to wait longer
            await this.delay(1);
            // set all .info.nspanel.isOnline to false
            for (const id in states) {
                if (id.endsWith('.info.isOnline') && !legacyWebPanelTree(id.replace(`${this.namespace}.`, ''))) {
                    await this.library.writedp(id, false, definition.genericStateObjects.panel.panels.info.isOnline);
                }
            }
            this.log.debug('Check configuration!');

            if (!this.config.pw1 || typeof this.config.pw1 !== 'string') {
                this.log.warn('No pin entered for the service page! Please set a pin in the admin settings!');
            }

            /*const test = await this.getObjectViewAsync('system', 'instance', {
                startkey: `system.adapter`,
                endkey: `system.adapter}`,
            });
            this.log.debug(JSON.stringify(test));*/

            if (this.config.testCase) {
                await this.extendForeignObjectAsync('0_userdata.0.boolean', {
                    type: 'state',
                    common: { name: 'boolean', type: 'boolean' },
                    native: {},
                });
                await this.extendForeignObjectAsync('0_userdata.0.number', {
                    type: 'state',
                    common: { name: 'number', type: 'number' },
                    native: {},
                });
                await this.extendForeignObjectAsync('0_userdata.0.string', {
                    type: 'state',
                    common: { name: 'string', type: 'string' },
                    native: {},
                });
                await this.onMessage({
                    _id: Date.now(),
                    message: testScriptConfig,
                    command: 'ScriptConfig',
                    from: 'system.adapter.admin.0',
                    callback: () => {},
                } as unknown as ioBroker.Message);
                await this.delay(1000);
                this.mainConfiguration = this.testCaseConfig;
                const test = new MQTT.MQTTClientClass(
                    this,
                    this.config.mqttIp,
                    this.config.mqttPort,
                    this.config.mqttUsername,
                    this.config.mqttPassword,
                    this.config.mqttServer,
                    async (topic, message) => {
                        this.log.debug(`${topic} ${message}`);
                    },
                );
                await test.waitConnectAsync(5000);

                await test.subscribe('test/123456/cmnd/#', async (topic, message) => {
                    this.log.debug(`Testcase ${topic}`);
                    if (message === 'pageType~pageStartup') {
                        await test.publish('test/123456/stat/RESULT', '{"CustomSend": "Done"}');
                        await test.publish('test/123456/tele/RESULT', '{"CustomRecv":"event,startup,54,eu"}');
                    } else if (topic === 'test/123456/cmnd/STATUS0') {
                        await test.publish(
                            'test/123456/stat/STATUS0',
                            '{"Status":{"Module":0,"DeviceName":"NSPanel 4 Test","FriendlyName":["Tasmota",""],"Topic":"ns_panel4","ButtonTopic":"0","Power":"00","PowerLock":"00",' +
                                '"PowerOnState":3,"LedState":1,"LedMask":"FFFF","SaveData":1,"SaveState":1,"SwitchTopic":"0","SwitchMode":' +
                                '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ButtonRetain":0,"SwitchRetain":0,"SensorRetain":0,"PowerRetain":0,"InfoRetain":0,' +
                                '"StateRetain":0,"StatusRetain":0},"StatusPRM":{"Baudrate":115200,"SerialConfig":"8N1","GroupTopic":"tasmotas",' +
                                '"OtaUrl":"http://ota.tasmota.com/tasmota32/release/tasmota32-nspanel.bin","RestartReason":"Vbat power on reset","Uptime":"0T00:07:28","StartupUTC":' +
                                '"2025-02-19T09:23:29","Sleep":50,"CfgHolder":4617,"BootCount":59,"BCResetTime":"2024-01-06T17:11:30","SaveCount":110},"StatusFWR":{"Version":"14.4.1(release-nspanel)",' +
                                '"BuildDateTime":"2024-12-15T13:33:11","Core":"3_1_0","SDK":"5.3.2","CpuFrequency":160,"Hardware":"ESP32-D0WD-V3 v3.1","CR":"502/699"},"StatusLOG":{"SerialLog":2,' +
                                '"WebLog":1,"MqttLog":3,"SysLog":0,"LogHost":"","LogPort":514,"SSId":["xxx",""],"TelePeriod":300,"Resolution":"558180C0","SetOption":' +
                                '["00008009","2805C80001000600003C5A0A192800000000","00000080","00006000","00004000","00000000"]},"StatusMEM":{"ProgramSize":2017,"Free":862,"Heap":148,"StackLowMark":' +
                                '3,"PsrMax":2048,"PsrFree":2025,"ProgramFlashSize":4096,"FlashSize":4096,"FlashChipId":"16405E","FlashFrequency":40,"FlashMode":"DIO","Features":["0809",' +
                                '"9F9AD7DF","0015A001","B7F7BFCF","05DA9BC4","E0360DC7","480840D2","20200000","D4BC482D","810A80F1","00000014"],"Drivers":"1,2,!3,!4,!5,7,!8,9,10,11,12,!14,!16,' +
                                '!17,!20,!21,24,26,!27,29,!34,!35,38,50,52,!59,!60,62,!63,!66,!67,!68,!73,!75,82,!86,!87,!88,!121","Sensors":"1,2,3,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,' +
                                '21,22,26,31,34,37,39,40,42,43,45,51,52,55,56,58,59,64,66,67,74,85,92,95,98,103,105,109,127","I2CDriver":"7,8,9,10,11,12,13,14,15,17,18,20,24,29,31,36,41,42,44,46,48,58' +
                                ',62,65,69,76,77,82,89"},"StatusNET":{"Hostname":"ns-panel4-0112","IPAddress":"192.168.178.174","Gateway":"192.168.178.1","Subnetmask":"255.255.254.0","DNSServer1":' +
                                '"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"A0:B7:A5:54:C0:71","IP6Global":"","IP6Local":"xxx","Ethernet":{"Hostname":"","IPAddress":"0.0.0.0","Gateway":"0.0.0.0",' +
                                '"Subnetmask":"0.0.0.0","DNSServer1":"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"00:00:00:00:00:00","IP6Global":"","IP6Local":""},"Webserver":2,"HTTP_API":1,' +
                                '"WifiConfig":4,"WifiPower":16.0},"StatusMQT":{"MqttHost":"xxx","MqttPort":1883,"MqttClientMask":"ns_panel4","MqttClient":"ns_panel4","MqttUser":"xxx","MqttCount":1,' +
                                '"MAX_PACKET_SIZE":1200,"KEEPALIVE":30,"SOCKET_TIMEOUT":4},"StatusTIM":{"UTC":"2025-02-19T09:30:57Z","Local":"2025-02-19T10:30:57","StartDST":"2025-03-30T02:00:00",' +
                                '"EndDST":"2025-10-26T03:00:00","Timezone":"+01:00","Sunrise":"07:50","Sunset":"18:17"},"StatusSNS":{"Time":"2025-02-19T10:30:57","ANALOG":{"Temperature1":-3.2},"TempUnit"' +
                                ':"C"},"StatusSTS":{"Time":"2025-02-19T10:30:57","Uptime":"0T00:07:28","UptimeSec":448,"Heap":146,"SleepMode":"Dynamic","Sleep":50,"LoadAvg":19,"MqttCount":1,"Berry":' +
                                '{"HeapUsed":16,"Objects":212},"POWER1":"OFF","POWER2":"OFF","Wifi":{"AP":1,"SSId":"Keller","BSSId":"DC:15:C8:EB:3E:B8","Channel":7,"Mode":"HT40","RSSI":46,"Signal":-77,' +
                                '"LinkCount":1,"Downtime":"0T00:00:03"}}}',
                        );
                    }
                });
            }
            if (
                !this.mainConfiguration ||
                !Array.isArray(this.mainConfiguration) ||
                this.mainConfiguration.length === 0
            ) {
                await this.delay(100);
                await this.mqttClient.destroy();
                await this.delay(100);
                this.paused = true;
                this.log.error('No configuration - adapter on hold!');
                return;
            }
            this.mainConfiguration = structuredClone(this.mainConfiguration);
            let counter = 0;
            for (const a of this.mainConfiguration) {
                try {
                    if (a && a.pages) {
                        const names: string[] = [];
                        for (const p of a.pages) {
                            counter++;
                            if (!('uniqueID' in p)) {
                                continue;
                            }
                            if (
                                p.config?.card === 'screensaver' ||
                                p.config?.card === 'screensaver2' ||
                                p.config?.card === 'screensaver3' ||
                                p.config?.card === 'screensaver5'
                            ) {
                                p.uniqueID = `#${p.uniqueID}`;
                            }
                            if (names.indexOf(p.uniqueID) !== -1) {
                                throw new Error(
                                    `PanelTopic: ${a.topic} uniqueID ${p.uniqueID} is double! Ignore this panel!`,
                                );
                            }
                            names.push(p.uniqueID);
                        }
                    }
                } catch (e: any) {
                    const index = this.mainConfiguration.findIndex(b => b === a);
                    this.mainConfiguration.splice(index, 1);
                    this.log.error(`Error: ${e}`);
                }
            }
            await this.subscribeStatesAsync('*');

            if (counter === 0) {
                return;
            }
            const mem = process.memoryUsage().heapUsed / 1024;
            this.log.debug(String(`${mem}k`));
            // an instance created before this option exists has no value yet - enabled by default
            const webEnabled = this.config.webEnabled !== false;
            this.controller = new Controller(this, {
                mqttClient: this.mqttClient,
                name: 'controller',
                panels: structuredClone(this.mainConfiguration),
                // standalone web panels take their channel from the manager while the controller creates the panels
                createVirtualPanelManager: webEnabled ? c => new VirtualPanelManager(this, c) : undefined,
            });
            await this.startWebServer(this.controller);

            /*setInterval(() => {
                this.log.debug(
                    `${Math.trunc(mem)}k/${String(Math.trunc(process.memoryUsage().heapUsed / 1024))}k Start/Jetzt: `,
                );
                }, 60000);*/
        } catch (e: any) {
            this.testSuccessful = false;
            this.log.error(`Error onReady: ${e}`);
        }
    }

    /**
     * Start the HTTP/WebSocket server of the web panels (browser shows the panel UI).
     *
     * @param controller the controller owning the panels
     */
    private async startWebServer(controller: Controller): Promise<void> {
        const manager = controller.virtualPanelManager;
        if (!manager) {
            this.log.debug('Web panels are disabled');
            return;
        }
        // the PIN token is an HMAC with the instance secret - the same secret the credentials use
        let secret = '';
        try {
            const systemConfig = await this.getForeignObjectAsync('system.config');
            secret = typeof systemConfig?.native?.secret === 'string' ? systemConfig.native.secret : '';
        } catch {
            // handled below
        }
        if (!secret) {
            this.log.warn('system.config has no secret - the PIN token of the web panels uses a fallback key');
            secret = this.namespace;
        }
        // HTTPS: ioBroker certificates by name; missing or unreadable certificates disable the web
        // panels - no silent fallback to plain http
        let tls: WebServerTls | undefined;
        if (this.config.webSecure) {
            tls = await this.loadWebCertificates();
            if (!tls) {
                return;
            }
        }
        // FIDO2 login only over HTTPS - browsers refuse WebAuthn on plain http anyway
        let fido: FidoService | undefined;
        if (this.config.webFido) {
            if (!tls) {
                this.log.info('Web panels: FIDO2 needs HTTPS - disabled');
            } else {
                const store = await this.getFidoStore();
                fido = new FidoService({ rpName: 'NSPanel Lovelace UI', store, log: this.log });
                this.log.info(
                    `Web panels: FIDO2 login enabled (${store.list().length} security key(s) registered, register at /auth/fido/register)`,
                );
            }
        }
        this.webServer = new WebServer(this, manager, {
            port: Number(this.config.webPort) || 8090,
            bind: this.config.webBind || '0.0.0.0',
            host: typeof this.config.webHost === 'string' ? this.config.webHost.trim() : '',
            wwwPath: path.join(__dirname, '..', 'www'),
            // a PIN typed as digits may arrive as a number
            pin: this.config.webPin == null ? '' : String(this.config.webPin).trim(),
            secret,
            tls,
            fido,
        });
        if (!(await this.webServer.start())) {
            // the manager stays: the standalone web panels keep their channels, only no browser can reach them
            await this.webServer.delete();
            this.webServer = undefined;
        }
    }

    /**
     * The FIDO2 credential store, loaded from `web.fidoCredentials` on first use.
     *
     * @returns the store
     */
    private async getFidoStore(): Promise<FidoCredentialStore> {
        if (!this.fidoStore) {
            this.fidoStore = new FidoCredentialStore(this);
        }
        if (!this.fidoStore.isLoaded) {
            await this.fidoStore.load();
        }
        return this.fidoStore;
    }

    /**
     * Load the ioBroker certificates (`system.certificates`) selected for the web panels.
     *
     * @returns key, cert and chain - undefined (with an error log) if they are missing or empty
     */
    private async loadWebCertificates(): Promise<WebServerTls | undefined> {
        const publicName = String(this.config.webCertPublic || '').trim();
        const privateName = String(this.config.webCertPrivate || '').trim();
        const chainedName = String(this.config.webCertChained || '').trim();
        if (!publicName || !privateName) {
            this.log.error(
                'Web panels: HTTPS is enabled but no public/private certificate is selected - web panels are disabled',
            );
            return undefined;
        }
        try {
            const [certs] = await this.getCertificatesAsync(publicName, privateName, chainedName || undefined);
            if (!certs || !certs.key || !certs.cert) {
                throw new Error('certificate or key is empty');
            }
            return { key: certs.key, cert: certs.cert, ca: certs.ca };
        } catch (e) {
            this.log.error(
                `Web panels: cannot load the certificates "${publicName}"/"${privateName}"${chainedName ? `/"${chainedName}"` : ''} from system.certificates: ${
                    e instanceof Error ? e.message : String(e)
                } - web panels are disabled`,
            );
            return undefined;
        }
    }

    private onMqttConnect = async (): Promise<void> => {
        const _helper = async (tasmota: any): Promise<void> => {
            try {
                const state = this.library.readdb(`panels.${tasmota.id}.info.nspanel.firmwareUpdate`);
                if (state && typeof state.val === 'number' && state.val >= 100) {
                    if (await this.isTasmotaFlashing(tasmota.ip)) {
                        this.log.info(`Panel with ip ${tasmota.ip} is flashing a TFT right now - no restart sent.`);
                        return;
                    }
                    this.log.debug(`Force an MQTT reconnect from the Nspanel with the ip ${tasmota.ip} in 10 seconds!`);
                    await this.fetch(
                        `http://${tasmota.ip}/cm?` +
                            `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                            `&cmnd=Restart 1`,
                    );
                } else {
                    this.log.debug(`Panel with ip ${tasmota.ip}: no pending firmware update, no restart needed`);
                }
            } catch (e: unknown) {
                this.log.warn(
                    `Error: This usually means that the NSpanel with ip ${tasmota.ip} is not online or has not been set up properly in the configuration! Error: ${formatErrorForLog(e)}`,
                );
            }
        };
        for (const tasmota of this.config.panels) {
            if (!tasmota || !tasmota.ip || tasmota.kind === 'web') {
                continue;
            }
            // a panel switched off via panels.<id>.cmd.activated must not be restarted either
            if (!this.library.isPanelActivated(tasmota.id)) {
                this.log.debug(`Panel ${tasmota.id} is deactivated, no restart request sent.`);
                continue;
            }
            void _helper(tasmota);
        }
        await this.setState('info.connection', true, true);
    };

    /**
     * Asks the berry driver of a Tasmota device whether it is flashing a TFT right now.
     *
     * @param tasmotaIP ip of the Tasmota device
     * @returns true only if the driver answered `{"Br":"1"}` - false for any other answer or error
     */
    private async isTasmotaFlashing(tasmotaIP: string): Promise<boolean> {
        try {
            const result = await this.fetch(
                getTasmotaCommandUrl(tasmotaIP, BERRY_FLASH_MODE_COMMAND, this.getTasmotaLogin()),
                undefined,
                5000,
            );
            return isBerryFlashing(result);
        } catch (e) {
            this.log.debug(`Panel with ip ${tasmotaIP}: flash mode query failed: ${formatErrorForLog(e)}`);
            return false;
        }
    }

    async fetch(url: string, init?: RequestInit, timeout = 30_000): Promise<unknown> {
        const controller = new AbortController();

        // 30 seconds timeout
        const timeoutId = this.setTimeout(() => {
            // Abort and remove entry to avoid leak
            try {
                controller.abort();
            } catch {
                // ignore
            }
            this.fetchs.delete(controller);
        }, timeout);

        this.fetchs.set(controller, timeoutId);

        try {
            const response = await fetch(url, {
                ...init,
                method: init?.method ?? 'GET',
                signal: controller.signal,
            });
            if (response.status === 200) {
                return await response.json();
            }
            throw new Error({ status: response.status, statusText: response.statusText } as any);
        } finally {
            // always clear timeout and remove the controller
            const id = this.fetchs.get(controller);
            if (typeof id !== 'undefined') {
                this.clearTimeout(id);
            }
            this.fetchs.delete(controller);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances.
     *
     * @param callback Callback so the adapter can finish what it has to do.
     */
    private async onUnload(callback: () => void): Promise<void> {
        try {
            this.unload = true;
            this.nsPanelInitSessions.clear();
            if (this.credentialCheckTimer) {
                this.clearTimeout(this.credentialCheckTimer);
                this.credentialCheckTimer = undefined;
            }
            this.pendingCredentialChecks.clear();
            for (const id of this.watchedCredentials.keys()) {
                try {
                    await this.unsubscribeForeignObjectsAsync(id);
                } catch {
                    // ignore - the process ends anyway
                }
            }
            this.watchedCredentials.clear();
            if (this.timeoutAdmin) {
                this.clearTimeout(this.timeoutAdmin);
            }
            if (this.timeoutAdmin2) {
                this.clearTimeout(this.timeoutAdmin2);
            }
            for (const [controller, timeoutId] of this.fetchs.entries()) {
                try {
                    if (timeoutId) {
                        this.clearTimeout(timeoutId);
                    }
                    controller.abort();
                } catch {
                    // ignore errors during abort/clear
                }
            }
            this.fetchs.clear();

            this.timeoutAdminArray.forEach(a => {
                if (a) {
                    this.clearTimeout(a);
                }
            });
            this.intervalAdminArray.forEach(a => {
                if (a) {
                    this.clearInterval(a);
                }
            });
            // the controller first: it says `bye shutdown` to the browsers of the web panels,
            // which only arrives while the web server still has their sockets
            if (this.controller) {
                await this.controller.delete();
            }
            if (this.webServer) {
                await this.webServer.delete();
                this.webServer = undefined;
            }
            if (this.tftServer) {
                await this.tftServer.delete();
                this.tftServer = undefined;
            }
            if (this.mqttClient) {
                await this.mqttClient.destroy();
            }
            if (this.mqttServer) {
                this.mqttServer.destroy();
            }
            callback();
        } catch {
            callback();
        }
    }

    /**
     * Replaces the login fields of the instance settings by the values of the selected central
     * credentials (Admin → System settings → Credentials) - in memory only, the stored
     * configuration stays untouched - and subscribes to those credentials, so a change in the
     * admin is reported in the log (it takes effect with the next restart).
     *
     * Every field keeps its legacy value if no credential is selected or the credential cannot be
     * read, so existing configurations run unchanged. The internal MQTT server always uses the
     * generated login of the instance settings - a credential only applies to an external broker.
     */
    private async applyCredentials(): Promise<void> {
        const ids = new Set<string>();

        if (!this.config.mqttServer && isCredentialId(this.config.mqttCredentialId)) {
            ids.add(this.config.mqttCredentialId);
            const mqtt = await resolveLogin(
                this,
                this.config.mqttCredentialId,
                this.config.mqttUsername,
                this.config.mqttPassword,
            );
            if (mqtt.source === 'credential') {
                this.config.mqttUsername = mqtt.login;
                this.config.mqttPassword = mqtt.password;
                this.log.info(`MQTT login taken from credential "${mqtt.name}"`);
            }
        }

        if (this.config.useTasmotaAdmin && isCredentialId(this.config.tasmotaCredentialId)) {
            ids.add(this.config.tasmotaCredentialId);
            const tasmota = await resolveSecret(
                this,
                this.config.tasmotaCredentialId,
                this.config.tasmotaAdminPassword,
            );
            if (tasmota.source === 'credential') {
                this.config.tasmotaAdminPassword = tasmota.secret;
                this.log.info(`Tasmota WebUI password taken from credential "${tasmota.name}"`);
            }
        }

        // QR pages are resolved when the pages are built (AdminConfiguration), here they are only watched
        for (const entry of this.config.pageConfig ?? []) {
            if (entry.card === 'cardQR' && isCredentialId(entry.qrCredentialId)) {
                ids.add(entry.qrCredentialId);
            }
        }

        for (const id of ids) {
            try {
                await this.subscribeForeignObjectsAsync(id);
                // Fingerabdruck merken, damit onObjectChange eine echte Wertänderung von einer
                // Umbenennung unterscheiden kann
                this.watchedCredentials.set(id, await fingerprintCredential(this, id));
            } catch (e: unknown) {
                this.log.warn(`Cannot watch credential "${id}": ${e instanceof Error ? e.message : String(e)}`);
            }
        }
    }

    /**
     * Is called if a subscribed object changes - the central credentials and the objects of the
     * datapoints the panels show. The latter go to the states controller, the rest is about credentials.
     *
     * A deletion is only reported: the adapter keeps running with the values it read at startup,
     * and after the next restart the fields of the instance settings apply again. A change is
     * checked - but not immediately, because the admin fires an event for every edit and saving a
     * credential can produce several of them. See checkCredentialChanges.
     *
     * @param id   The id of the object that changed
     * @param obj  The new object, null if it was deleted
     */
    private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
        if (this.unload) {
            return;
        }
        // objects of the datapoints the panels show (states controller subscribes them)
        this.controller?.statesControler?.onObjectChange(id, obj);
        if (!this.watchedCredentials.has(id)) {
            return;
        }
        if (!obj) {
            this.log.warn(
                `Credential "${id}" was deleted - after a restart the fields of the instance settings are used instead`,
            );
            return;
        }
        this.pendingCredentialChecks.add(id);
        if (this.credentialCheckTimer) {
            this.clearTimeout(this.credentialCheckTimer);
        }
        this.credentialCheckTimer = this.setTimeout(() => {
            this.credentialCheckTimer = undefined;
            void this.checkCredentialChanges();
        }, NspanelLovelaceUi.CREDENTIAL_CHECK_DELAY_MS);
    }

    /**
     * Checks the credentials that reported a change and restarts the adapter if one of them really
     * carries other values now.
     *
     * The adapter reads its credentials once at startup and keeps the values in memory, so a new
     * password only takes effect after a restart. Restarting on every object change would be
     * annoying though: renaming a credential or changing its icon fires the same event. Therefore
     * the values are compared by fingerprint, and only a real change restarts the adapter.
     *
     * A credential that cannot be read at this moment (deleted, or encrypted with another system
     * secret) does not restart anything - it keeps its previous fingerprint and is reported by
     * resolveLogin/resolveSecret on the next start.
     */
    private async checkCredentialChanges(): Promise<void> {
        const ids = [...this.pendingCredentialChecks];
        this.pendingCredentialChecks.clear();
        for (const id of ids) {
            if (this.unload || !this.watchedCredentials.has(id)) {
                return;
            }
            const current = await fingerprintCredential(this, id);
            if (current === undefined) {
                continue;
            }
            const previous = this.watchedCredentials.get(id);
            if (previous === undefined) {
                // beim Start nicht lesbar gewesen, jetzt schon - merken, aber nicht neu starten
                this.watchedCredentials.set(id, current);
                continue;
            }
            if (current !== previous) {
                this.watchedCredentials.set(id, current);
                this.log.info(`Credential "${id}" has new values - restarting the adapter to apply them`);
                this.restart();
                return;
            }
            this.log.debug(`Credential "${id}" changed, but its values are the same - no restart`);
        }
    }

    /**
     * Is called if a subscribed state changes
     *
     * @param id   The id of the state that changed
     * @param state The state object holding the new value and meta information of the state
     */
    private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (state) {
            if (this.controller) {
                await this.controller.statesControler.onStateChange(id, state);
            }
        } else {
            // The state was deleted
            // this.log.info(`state ${id} deleted`);
            this.controller?.statesControler.onStateDeleted(id);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Somee message was sent to this instance over message box. Used by email, pushover, text2speech,
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        if (typeof obj === 'object' && obj.message !== undefined && obj.command) {
            this.log.debug(stringifyForLog(obj));
            if (obj.command === 'tftInstallSendToMQTT') {
                if (obj.message.online === 'no') {
                    obj.command = 'tftInstallSendTo';
                }
            }
            const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;
            switch (obj.command) {
                case SENDTO_GET_PAGES_COMMAND: {
                    let names: string[] = [];
                    if (obj?.message?.panelTopic) {
                        if (this.controller?.panels) {
                            if (obj.message.panelTopic === ALL_PANELS_SPECIAL_ID) {
                                const temp: Set<string> = new Set();
                                this.controller.panels.forEach(a => {
                                    const b = a.navigation
                                        .getDatabase()
                                        .map(b => b?.page?.name)
                                        .filter(a => a != null);
                                    if (temp.size === 0) {
                                        for (const c of b) {
                                            if (c) {
                                                temp.add(c);
                                            }
                                        }
                                    } else {
                                        const lookup = new Set(b.filter(Boolean));

                                        const toRemove = [];
                                        for (const t of temp) {
                                            if (!lookup.has(t)) {
                                                toRemove.push(t);
                                            }
                                        }
                                        for (const r of toRemove) {
                                            temp.delete(r);
                                        }
                                    }
                                });

                                names = Array.from(temp);
                            } else {
                                const panel = this.controller.panels.find(a => a.topic === obj.message.panelTopic);
                                if (panel) {
                                    const db = panel.navigation.getDatabase();

                                    if (db) {
                                        for (const p of db) {
                                            if (p?.page) {
                                                names.push(p.page.name);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_PAGES_All_COMMAND: {
                    let names: string[] = [];
                    if (this.controller?.panels) {
                        for (const panel of this.controller.panels) {
                            if (panel) {
                                const db = panel.navigation.getDatabase();

                                if (db) {
                                    for (const p of db) {
                                        if (p?.page) {
                                            names.push(p.page.name);
                                        }
                                    }
                                }
                            }
                        }
                        names = Array.from(new Set(names));
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_PANELS_COMMAND: {
                    const names: PanelInfo[] = [];
                    if (this.controller?.panels) {
                        for (const p of this.controller.panels) {
                            // a web clone is the same panel as its hardware panel
                            if (p && !p.isClone) {
                                names.push({ panelTopic: p.topic, friendlyName: p.friendlyName || p.name });
                            }
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
                    }
                    break;
                }
                case SAVE_PANEL_NAVIGATION_COMMAND: {
                    if (obj.message && this.controller?.panels) {
                        const data = obj.message as NavigationSavePayload;
                        const panel =
                            this.controller.panels.find(a => a.name === data.panelName && !a.isClone) ??
                            this.controller.panels.find(a => a.name === data.panelName);
                        if (panel) {
                            await panel.saveNavigationMapDeprecated(data.pages);
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_PANEL_NAVIGATION_COMMAND: {
                    const nav: PanelListEntry[] = [];

                    if (this.controller?.panels) {
                        for (const p of this.controller.panels) {
                            if (p && !p.isClone) {
                                nav.push(await p.getNavigationArrayForFlow());
                            }
                        }
                    } else {
                        break;
                    }

                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { result: nav }, obj.callback);
                    }

                    break;
                }
                case SENDTO_PAGE_DUMP_LIST_COMMAND: {
                    this.answerMessage(obj, { result: this.pageDumpList() });
                    break;
                }
                case SENDTO_PAGE_DUMP_COMMAND: {
                    this.answerMessage(obj, await this.pageDump(obj.message));
                    break;
                }
                case 'getWeatherEntity': {
                    const adapterObj = await this.getObjectViewAsync('system', 'instance', {
                        startkey: 'system.adapter.',
                        endkey: 'system.adapter.\u9999',
                    });
                    const adapters: string[] = [];
                    if (adapterObj && adapterObj.rows && adapterObj.rows.length > 0) {
                        for (const r of adapterObj.rows) {
                            if (r && r.id && definition.weatherEntities.findIndex(a => r.id.includes(a)) !== -1) {
                                adapters.push(r.id.replace('system.adapter.', ''));
                            }
                        }
                    }
                    const result = adapters.sort().map(a => {
                        return { value: a, label: a };
                    });
                    result.unshift({ label: this.library.getTranslation('custom'), value: '' });

                    if (obj.callback) {
                        this.sendTo(
                            obj.from,
                            obj.command,
                            result ? result : [{ label: 'Not available', value: '' }],
                            obj.callback,
                        );
                    }
                    break;
                }
                case SENDTO_GET_MEDIA_PLAYER_COMMAND: {
                    const message: unknown = obj.message;
                    const id = message && typeof message === 'object' && 'id' in message ? message.id : undefined;
                    const result = await mediaPlayerInfo(this, id);
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, result, obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_DEVICE_DETAILS_COMMAND: {
                    const message: unknown = obj.message;
                    const id = message && typeof message === 'object' && 'id' in message ? message.id : undefined;
                    const result = await deviceDetailsInfo(this, id);
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, result, obj.callback);
                    }
                    break;
                }
                case SENDTO_GET_PAGE_ITEM_TEMPLATES_COMMAND: {
                    // the admin bundle must not import the templates (colord, adapter types) - the admin asks here
                    const result = pageItemTemplateInfos();
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, result, obj.callback);
                    }
                    break;
                }
                case 'config': {
                    const obj1 = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
                    if (
                        obj1 &&
                        obj1.native &&
                        JSON.stringify(obj1.native.Testconfig2) !== JSON.stringify(obj.message)
                    ) {
                        obj1.native.Testconfig2 = obj.message;
                        await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, obj1);
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case 'updateCustom': {
                    if (obj.message && obj.message.state) {
                        const state = await this.getForeignObjectAsync(obj.message.state);
                        if (state && state.common && state.common.custom && state.common.custom[this.namespace]) {
                            this.log.debug(`updateCustom ${JSON.stringify(state.common.custom[this.namespace])}`);
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case 'CheckPageItemConfig': {
                    let messages: string[] = [];
                    let error: string | undefined = undefined;
                    if (obj.message && obj.message.item && obj.message.page) {
                        const result = await this.convertAdminPageItemToPageItemConfig(
                            obj.message.item,
                            obj.message.page,
                            messages,
                        );
                        messages = result.messages;
                        error = result.error;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { messages, error }, obj.callback);
                    }
                    break;
                }
                case 'ScriptConfigGlobal': {
                    const manager = new ConfigManager(this);
                    try {
                        let r: {
                            messages: string[];
                            panelConfig:
                                | (Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
                                      navigation: NavigationItemConfig[];
                                      pages: pages.PageBase[];
                                  })
                                | undefined;
                        } = { messages: [], panelConfig: undefined };
                        const config = structuredClone(obj.message.panelTopic);
                        r = await manager.setScriptConfig({ ...obj.message, panelTopic: config });
                        await manager.delete();
                        const result = r.messages;
                        // the global script is the only script source of the panels marked "panel uses no
                        // script" - reload them now, the other panels get it with their next script run
                        if (!this.config.testCase && this.controller) {
                            result.push(...(await this.reloadNoScriptPanels()));
                        }
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, result, obj.callback);
                        }
                    } catch (e: any) {
                        this.log.error(`Error in script config processing: ${e.message}`);
                        if (obj.callback) {
                            this.sendTo(
                                obj.from,
                                obj.command,
                                `Error in script config processing: ${e.message}`,
                                obj.callback,
                            );
                        }
                    }
                    break;
                }
                case 'ScriptConfig': {
                    //this.log.debug(`ScriptConfig ${JSON.stringify(obj.message)}`);
                    let result = ['something went wrong'];
                    if (obj.message) {
                        if (this.scriptConfigBacklog.length > 3) {
                            if (obj.callback) {
                                this.sendTo(
                                    obj.from,
                                    obj.command,
                                    `⚠️ Too many configuration changes at once. Please wait a few seconds.`,
                                    obj.callback,
                                );
                            }
                            break;
                        }
                        this.scriptConfigBacklog.push(obj);
                        if (this.scriptConfigBacklog.length > 1) {
                            break;
                        }

                        while (this.scriptConfigBacklog[0] != null) {
                            const manager = new ConfigManager(this);
                            const obj = this.scriptConfigBacklog[0];
                            //try {
                            let r: {
                                messages: string[];
                                panelConfig:
                                    | (Omit<Partial<panelConfigPartial>, 'pages' | 'navigation'> & {
                                          navigation: NavigationItemConfig[];
                                          pages: pages.PageBase[];
                                      })
                                    | undefined;
                            } = { messages: [], panelConfig: undefined };
                            // a local panel script for a panel marked "panel uses no script" is rejected
                            // completely (not stored, panel not reloaded) - the global script always passes
                            const topicCheck = checkScriptConfigTopics(this.config.panels, obj.message);
                            for (const text of topicCheck.rejected) {
                                this.log.error(text);
                            }
                            if (topicCheck.rejected.length > 0 && topicCheck.accepted.length === 0) {
                                await manager.delete();
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, topicCheck.rejected, obj.callback);
                                }
                                this.scriptConfigBacklog.shift();
                                continue;
                            }
                            if (obj.message.panelTopic && Array.isArray(obj.message.panelTopic)) {
                                const topics: unknown[] =
                                    topicCheck.rejected.length > 0
                                        ? topicCheck.accepted
                                        : JSON.parse(JSON.stringify(obj.message.panelTopic));
                                for (const a of topics) {
                                    r = await manager.setScriptConfig({ ...obj.message, panelTopic: a });
                                }
                            } else {
                                r = await manager.setScriptConfig(obj.message);
                            }
                            r.messages.unshift(...topicCheck.rejected);
                            //this.log.debug(`ScriptConfig result ${JSON.stringify(r.panelConfig)}`);
                            if (this.config.testCase) {
                                this.testCaseConfig = [r.panelConfig];
                            } else {
                                let reloaded = false;
                                //try {

                                if (r.panelConfig) {
                                    const state = await this.reloadPanelWithConfig(r.panelConfig, r.messages);
                                    if (state === 'stopping') {
                                        if (obj.callback) {
                                            this.sendTo(obj.from, obj.command, 'Adapter is stopping', obj.callback);
                                        }
                                        return;
                                    }
                                    reloaded = state === 'reloaded';
                                } else {
                                    r.messages.push(`Invalid configuration!`);
                                }
                                /*} catch (e: any) {
                                        this.log.error(`Error in configuration: ${e.message}`);
                                    }*/
                                if (!reloaded) {
                                    let msg = '';
                                    if (this.paused) {
                                        msg = `❌ Adapter is paused try to restart it by itself. Check logs for more details.`;
                                        this.log.info(msg);
                                        result = r.messages;
                                        if (obj.callback) {
                                            this.sendTo(obj.from, obj.command, result, obj.callback);
                                        }
                                        await manager.delete();
                                        this.restart();
                                        return;
                                    }
                                    msg = `❌ Panel was not restarted due to configuration errors or missing panel instance. Please verify the panel topic and base configuration.`;

                                    this.log.info(msg);
                                    r.messages.push(msg);
                                }
                            }
                            await manager.delete();
                            result = r.messages;
                            if (obj.callback) {
                                this.sendTo(obj.from, obj.command, result, obj.callback);
                            }
                            /*} catch (e: any) {
                                this.log.error(`Error in script config processing: ${e.message}`);
                                if (obj.callback) {
                                    this.sendTo(
                                        obj.from,
                                        obj.command,
                                        `Error in script config processing: ${e.message}`,
                                        obj.callback,
                                    );
                                }
                            }*/
                            this.scriptConfigBacklog.shift();
                            if (this.scriptConfigBacklog.length > 0) {
                                await this.delay(3000);
                            }
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, 'something when wrong', obj.callback);
                    }
                    break;
                }
                case SENDTO_CONVERT_SCRIPT_COMMAND: {
                    // conversion of a configuration script into the admin configuration (admin tab maintain);
                    // the runner answers before it writes the instance object, that write restarts the adapter
                    const runner = new ScriptToAdminRunner({
                        adapter: this,
                        createConfigStore: () => new ConfigManager(this),
                        screensaverMode: topic =>
                            this.controller?.panels.find(p => p && p.topic === topic)?.screenSaver?.mode,
                    });
                    await runner.run(obj.message, answer => {
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, answer, obj.callback);
                        }
                    });
                    break;
                }
                case 'setPopupNotification': {
                    if (this.controller?.panels?.some(p => p.status === 'online') && obj.message) {
                        await this.controller.setPopupNotification(obj.message);
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                        }
                    } else {
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { error: 'No Panels Online' }, obj.callback);
                        }
                    }
                    break;
                }

                case 'testCase': {
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { testSuccessful: this.testSuccessful }, obj.callback);
                    }
                    break;
                }
                case CREATE_TEST_STATES_COMMAND: {
                    // developer button: objects of the test environment, only the missing ones
                    try {
                        const file = path.join(__dirname, '..', 'templates', 'test-states.json');
                        const data = parseTestStatesFile(await fs.promises.readFile(file, 'utf-8'));
                        const result = await createTestObjects(this, buildTestObjects(data), (id, error) =>
                            this.log.warn(`Test states: ${id} not created: ${String(error)}`),
                        );
                        this.log.info(
                            `Test states: ${result.created} objects created (${result.values} values set), ` +
                                `${result.skipped} existed already, ${result.failed} failed`,
                        );
                        const text = this.library
                            .getTranslation('createTestStatesResult')
                            .replace('%c', String(result.created))
                            .replace('%s', String(result.skipped))
                            .replace('%f', String(result.failed));
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { result: text }, obj.callback);
                        }
                    } catch (error) {
                        this.log.error(`Test states: ${String(error)}`);
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { error: String(error) }, obj.callback);
                        }
                    }
                    break;
                }
                case 'webFidoList': {
                    // registered FIDO2 keys for the admin (public data only)
                    try {
                        const store = await this.getFidoStore();
                        if (obj.callback) {
                            this.sendTo(
                                obj.from,
                                obj.command,
                                {
                                    credentials: store.summaries(),
                                    active: this.webServer?.fido !== undefined,
                                    configured: !!this.config.webFido,
                                    secure: !!this.config.webSecure,
                                },
                                obj.callback,
                            );
                        }
                    } catch (e) {
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { error: String(e) }, obj.callback);
                        }
                    }
                    break;
                }
                case 'webFidoDelete': {
                    const id =
                        typeof obj.message === 'object' && obj.message && typeof obj.message.id === 'string'
                            ? obj.message.id
                            : '';
                    try {
                        const store = await this.getFidoStore();
                        const removed = id ? await store.remove(id) : false;
                        if (removed) {
                            this.log.info('Web panels: a FIDO2 security key was removed via the admin');
                        }
                        if (obj.callback) {
                            this.sendTo(
                                obj.from,
                                obj.command,
                                { ok: removed, credentials: store.summaries() },
                                obj.callback,
                            );
                        }
                    } catch (e) {
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { error: String(e) }, obj.callback);
                        }
                    }
                    break;
                }
                case 'getTasmotaDevices': {
                    if (this.config.panels) {
                        const devices = this.config.panels
                            .filter(a => a && a.kind !== 'web')
                            .map(a => {
                                return { label: `${a.ip} (${a.name})`, value: a.ip };
                            });
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, devices, obj.callback);
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'nsPanelInit': {
                    // Der Ablauf ist seit 1.0.2 in drei Schritte geteilt - dieser Befehl kommt nur
                    // noch aus einem Admin-Tab, der das alte Bundle geladen hat.
                    this.log.warn('Received the outdated nsPanelInit command, the admin page has to be reloaded!');
                    this.answerMessage(obj, { error: 'sendToReloadAdmin' });
                    break;
                }

                case 'nsPanelInitStep1': {
                    await this.nsPanelInitStep1(obj);
                    break;
                }

                case 'nsPanelInitStep2': {
                    await this.nsPanelInitStep2(obj);
                    break;
                }

                case 'nsPanelInitStep3': {
                    await this.nsPanelInitStep3(obj);
                    break;
                    //Backlog UrlFetch https://raw.githubusercontent.com/joBr99/nspanel-lovelace-ui/main/tasmota/autoexec.be; Restart 1
                    //Backlog UpdateDriverVersion https://raw.githubusercontent.com/joBr99/nspanel-lovelace-ui/main/tasmota/autoexec.be; Restart 1
                }

                case 'berryInstallSendTo': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP) {
                            try {
                                let result: Record<string, string> | undefined = undefined;

                                result = await this.getVersionsJson();
                                if (!result) {
                                    this.log.error('No version found!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail5' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }

                                const version = obj.message.useBetaTFT
                                    ? result[`berry-beta`].split('_')[0]
                                    : result.berry.split('_')[0];
                                const tasmotaIP: string = obj.message.tasmotaIP;
                                const topic = this.mqttClient
                                    ? findBerryInstallTopic(obj.message.topic, tasmotaIP, this.config.panels)
                                    : undefined;
                                const restart = obj.message.restart === true;

                                this.log.info(`Installing berry on tasmota with IP ${tasmotaIP}`);
                                if (this.mqttClient && topic) {
                                    // safe install: autoexec.be -> autoexec.bak, download, then commit or restore
                                    await this.fetch(this.getBerryInstallUrl(tasmotaIP, version));
                                    try {
                                        await this.mqttClient.waitTasmotaUrlFetch(topic, 10_000);
                                    } catch (e: unknown) {
                                        this.log.error(
                                            `Did not receive download confirmation from tasmota ${tasmotaIP} after berry install${restart ? ' - no restart' : ''}: ${String(e)}`,
                                        );
                                        await this.finishBerryInstall(tasmotaIP, false, false);
                                        if (obj.callback) {
                                            this.sendTo(
                                                obj.from,
                                                obj.command,
                                                { error: 'sendToRequestFailBerry' },
                                                obj.callback,
                                            );
                                        }
                                        break;
                                    }
                                    if (restart) {
                                        this.log.info(`Restarting tasmota with IP ${tasmotaIP} after berry install`);
                                    }
                                    // renames autoexec.bak to autoexec.old (and restarts) in one backlog
                                    await this.finishBerryInstall(tasmotaIP, true, restart);
                                } else {
                                    // no topic known - no confirmation possible: old command sequence and behavior
                                    await this.fetch(
                                        getTasmotaCommandUrl(
                                            tasmotaIP,
                                            getBerryLegacyInstallCommand(this.config.berryUrl, version),
                                            this.getTasmotaLogin(),
                                        ),
                                    );
                                    if (restart) {
                                        await this.delay(3000);
                                        this.log.info(`Restarting tasmota with IP ${tasmotaIP} after berry install`);
                                        await this.fetch(this.getRestartTasmotaUrl(tasmotaIP));
                                    }
                                }
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: unknown) {
                                this.log.error(`Error: while installing berry - ${formatErrorForLog(e)}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail6' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'tftInstallSendTo': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP /*&& obj.message.internalServerIp*/) {
                            try {
                                const cmnd = await this.getTFTVersionOnline(
                                    obj.message.model,
                                    obj.message.useBetaTFT,
                                    this.config.forceTFTVersion,
                                );
                                if (!cmnd) {
                                    this.log.error('No version found!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail7' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=Backlog ${cmnd}`;
                                this.log.debug(redactSecretsInText(url));
                                await this.markTftFlashStarting(
                                    this.config.panels.find(p => p && p.ip === obj.message.tasmotaIP)?.id,
                                );
                                await this.fetch(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: unknown) {
                                this.log.error(`Error: ${formatErrorForLog(e)}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail8' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'tftInstallSendToMQTT': {
                    if (obj.message) {
                        if (obj.message.topic /*&& obj.message.internalServerIp*/) {
                            try {
                                const cmnd = await this.getTFTVersionOnline(
                                    obj.message.model,
                                    obj.message.useBetaTFT,
                                    this.config.forceTFTVersion,
                                );
                                if (!cmnd) {
                                    this.log.error('No version found!');
                                    if (obj.callback) {
                                        this.sendTo(
                                            obj.from,
                                            obj.command,
                                            { error: 'sendToRequestFail9' },
                                            obj.callback,
                                        );
                                    }
                                    break;
                                }

                                if (this.controller?.panels) {
                                    const index = this.controller.panels.findIndex(a => a.topic === obj.message.topic);
                                    if (index !== -1) {
                                        const panel = this.controller.panels[index];
                                        await this.markTftFlashStarting(panel.name);
                                        panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                                        await this.delay(100);
                                        panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, ``);
                                    }
                                }

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: any) {
                                this.log.error(`Error: ${e}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail10' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }

                case 'getRandomMqttCredentials': {
                    if (obj.message) {
                        const allowedChars: string[] = [
                            ...'abcdefghijklmnopqrstuvwxyz',
                            ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                            ...'0123456789',
                            ...'()*+-.:<=>[]_',
                        ];
                        const allowedCharsUser: string[] = [
                            ...'abcdefghijklmnopqrstuvwxyz',
                            ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // c|Yh7Pe<&1ap34t/]S&TxDwL&KDWqW-Se_D@vtXh,z]|T[RIqLgz.>^3H1j<
                        ];
                        const passwordLength = 50;
                        const usernameLength = 15;
                        const getString = (c: string[], length: number): string => {
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                const random = Math.floor(Math.random() * c.length);
                                result += c[random];
                            }
                            return result;
                        };

                        const result = {
                            native: {
                                mqttUsername: getString(allowedCharsUser, usernameLength),
                                mqttPassword: getString(allowedChars, passwordLength),
                                mqttPort: await this.getPortAsync(8883),
                                saveConfig: true,
                            },
                        };
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, result, obj.callback);
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'error' }, obj.callback);
                    }
                    break;
                }
                case 'tasmotaRestartSendTo': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP /*&& obj.message.internalServerIp*/) {
                            try {
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=Restart 1`;
                                this.log.debug(redactSecretsInText(url));
                                await this.fetch(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: unknown) {
                                this.log.error(`Error: ${formatErrorForLog(e)}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail11' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'resetTasmota': {
                    if (obj.message) {
                        if (obj.message.tasmotaIP /*&& obj.message.internalServerIp*/) {
                            try {
                                const url =
                                    `http://${obj.message.tasmotaIP}/cm?` +
                                    `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                                    `&cmnd=reset 4`;
                                this.log.debug(`Reset to factory defaults tasmota with IP ${obj.message.tasmotaIP}`);
                                await this.fetch(url);

                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, [], obj.callback);
                                }
                            } catch (e: unknown) {
                                this.log.error(`Error: ${formatErrorForLog(e)}`);
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToRequestFail12' }, obj.callback);
                                }
                            }
                            break;
                        }
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }

                case 'refreshMaintainTable': {
                    const added: string[] = [];
                    let result: any[] = [];
                    const flashingText = this.library.getTranslation('Updating');
                    const flashingObj: Record<string, string> = {};

                    let file = undefined;
                    if (fs.existsSync(path.join(__dirname, '../script'))) {
                        file = fs.readFileSync(
                            path.join(__dirname, '../script/example_sendTo_script_iobroker.ts'),
                            'utf8',
                        );
                    }
                    const vTemp = file?.match(/const version = '(\d+\.\d+\.\d+)';/) || [];
                    const version = vTemp[1] ? vTemp[1] : '';

                    for (let a = 0; a < this.config.panels.length; a++) {
                        const panel = this.config.panels[a];
                        if (!panel || panel.kind === 'web') {
                            continue;
                        }
                        const state = this.library.readdb(`panels.${panel.id}.info.nspanel.firmwareUpdate`);
                        if (state && typeof state.val === 'number' && state.val < 100) {
                            flashingObj[panel.id] = `${flashingText}: ${state.val}%`;
                        }
                    }

                    const compareSemver = (a: string, b: string): number => {
                        const pa = a.split('.').map(Number);
                        const pb = b.split('.').map(Number);
                        for (let i = 0; i < 3; i++) {
                            if (pa[i] > pb[i]) {
                                return 1;
                            }
                            if (pa[i] < pb[i]) {
                                return -1;
                            }
                        }
                        return 0;
                    };

                    // Berry driver generation online ("11" or "11_…"), only fetched if a Tasmota panel exists
                    let berryOnline = 0;
                    if (this.controller?.panels.some(a => !a.isVirtual)) {
                        const versions = await this.getVersionsJson();
                        const useBeta =
                            typeof obj.message?.useBetaTFT === 'boolean'
                                ? obj.message.useBetaTFT
                                : !!this.config.useBetaTFT;
                        const entry = versions ? (useBeta ? versions['berry-beta'] : versions.berry) : undefined;
                        const parsed = entry ? parseInt(String(entry).split('_')[0]) : NaN;
                        berryOnline = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
                    }

                    if (this.controller?.panels) {
                        const updateText = this.library.getTranslation('updateAvailable');
                        const downgradeText = this.library.getTranslation('downgradeAvailable');
                        const checkText = this.library.getTranslation('check!');
                        const temp = [];
                        for (const a of this.controller.panels) {
                            if (a.isClone) {
                                // a web clone is the hardware panel seen in a browser - one row per panel
                                continue;
                            }
                            let check = false;
                            let check_tasmota = false;
                            let check_tft = false;
                            let check_script = false;
                            let tv = '';
                            let nv = '';
                            let sv = '';
                            const ft = flashingObj[a.name];
                            const scriptId = this.library.cleandp(
                                `${scriptPath}.${this.library.cleandp(a.friendlyName, false, true)}`,
                            );
                            const o = await this.getForeignObjectAsync(scriptId);
                            // "panel uses no script": no version check, no script update
                            const noScript = isNoScriptPanel(this.config.panels, a.topic);
                            if (o && !noScript) {
                                const temp = o.common.source.match(/const.version.+'(\d+\.\d+\.\d+)';/)?.[1] ?? '';
                                if (temp !== version) {
                                    check = true;
                                    check_script = true;
                                    sv = `${temp} (${updateText}: v${version})`;
                                } else {
                                    sv = temp;
                                }
                            }
                            if (a.info) {
                                if (a.info.tasmota?.firmwareversion) {
                                    const temp = a.info.tasmota.firmwareversion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1]) {
                                        tv = `${temp[1]}`;
                                    }
                                }
                                if (a.info.tasmota?.onlineVersion && tv) {
                                    const temp = a.info.tasmota.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1]) {
                                        const cmp = compareSemver(temp[1], tv);
                                        if (cmp > 0) {
                                            tv += ` (${updateText})`;
                                            check = true;
                                            check_tasmota = true;
                                        } else if (cmp < 0) {
                                            tv += ` (${downgradeText})`;
                                            check_tasmota = true;
                                        }
                                    }
                                }
                                tv = tv ? `v${tv}` : '';
                                if (a.info.nspanel?.displayVersion) {
                                    const temp = a.info.nspanel.displayVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1]) {
                                        nv = `${temp[1]}`;
                                    }
                                }
                                if (a.info.nspanel?.onlineVersion && nv) {
                                    const temp = a.info.nspanel.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                                    if (temp && temp[1]) {
                                        const cmp = compareSemver(temp[1], nv);
                                        if (nv === '0.0.0') {
                                            nv += ` (Developer version!)`;
                                            check = true;
                                            check_tft = true;
                                        } else if (cmp > 0) {
                                            nv += ` (${updateText})`;
                                            check = true;
                                            check_tft = true;
                                        } else if (cmp < 0) {
                                            nv += ` (${downgradeText})`;
                                            check = true;
                                            check_tft = true;
                                        }
                                    }
                                }
                                nv = nv ? `v${nv}` : '';
                            }
                            // Berry driver: integer generation from nlui_driver_version,
                            // negative = emulator (absolute value = generation, -1 = old emulator), 0 = unknown
                            const bv = parseDriverVersion(a.info?.nspanel?.berryDriverVersion);
                            const isEmulator = isEmulatorDriverVersion(bv);
                            const noBerry = a.isVirtual || isEmulator;
                            let check_berry = false;
                            let bvText = '???';
                            if (isEmulator) {
                                // generation of the emulator driver, empty for the old emulator (-1); no update hint
                                const gen = driverGeneration(bv);
                                bvText = gen > 1 ? `${gen}` : '';
                            } else if (noBerry) {
                                bvText = '---';
                            } else if (bv > 0) {
                                bvText = `${bv}`;
                                if (berryOnline > 0 && berryOnline !== bv) {
                                    bvText += ` (${berryOnline > bv ? updateText : downgradeText}: ${berryOnline})`;
                                    check = true;
                                    check_berry = true;
                                }
                            }
                            added.push(a.topic);

                            temp.push({
                                _check: check,
                                _check_tasmota: check_tasmota,
                                _check_tft: check_tft,
                                _check_script: check_script,
                                _check_berry: check_berry,
                                _Headline: `${a.friendlyName} (${ft ? ft : `${check ? checkText : `${a.isOnline ? 'online' : a.flashing ? `flashing` : 'offline'}`}`})`,
                                _name: a.friendlyName,
                                _ip: a.isVirtual
                                    ? ''
                                    : a.info?.tasmota?.net?.IPAddress
                                      ? a.info.tasmota.net.IPAddress
                                      : 'offline - waiting',
                                _online: a.isOnline && a.initDone ? 'yes' : 'no',
                                _flashing: a.flashing,
                                _topic: a.topic,
                                _id: a.info?.tasmota?.net?.Mac ? a.info.tasmota.net.Mac : '',
                                _tftVersion: nv ? nv : '???',
                                _tasmotaVersion: tv ? tv : '???',
                                _berryVersion: bvText,
                                _noBerry: noBerry,
                                _isEmulator: isEmulator,
                                _ScriptVersion: noScript ? '---' : sv ? `v${sv}` : '???',
                                _noScript: noScript,
                                _nsPanelModel: a.isVirtual
                                    ? a.info.nspanel.model
                                    : a.info?.nspanel?.model
                                      ? a.info.nspanel.model == 'eu'
                                          ? ''
                                          : a.info.nspanel.model
                                      : '',
                            });
                        }
                        result = result.concat(temp);
                    }
                    if (this.config.panels) {
                        const temp2 = this.config.panels.filter(a => {
                            return added.findIndex(b => b === a.topic) === -1;
                        });
                        const temp = [];
                        for (const a of temp2) {
                            const ft = flashingObj[a.name];
                            const noScript = a.noScript === true;
                            let sv = version;
                            const scriptId = this.library.cleandp(
                                `${scriptPath}.${this.library.cleandp(a.name, false, true)}`,
                            );
                            const o = await this.getForeignObjectAsync(scriptId);
                            if (o) {
                                const temp = o.common.source.match(/const.version.+'(\d+\.\d+\.\d+)';/)?.[1] ?? '';
                                if (temp !== version) {
                                    sv = temp ? temp : version;
                                }
                            }
                            temp.push({
                                _check: false,
                                _Headline: `${a.name} (${
                                    ft
                                        ? ft
                                        : `${
                                              this.mainConfiguration
                                                  ? this.mainConfiguration.findIndex(b => b.topic === a.topic) === -1
                                                      ? 'Missing configuration!'
                                                      : 'offline - waiting'
                                                  : 'offline'
                                          }`
                                })`,
                                _name: a.name,
                                _ip: this.mainConfiguration
                                    ? this.mainConfiguration.findIndex(b => b.topic === a.topic) === -1
                                        ? 'Missing configuration!'
                                        : 'offline - waiting'
                                    : 'offline',
                                _online: 'no',
                                _topic: a.topic,
                                _id: '',
                                _tftVersion: '---',
                                _tasmotaVersion: '---',
                                _berryVersion: '---',
                                _noBerry: a.kind === 'web',
                                _ScriptVersion: noScript ? '---' : sv ? `v${sv}` : '???',
                                _noScript: noScript,
                                _nsPanelModel: a.model,
                            });
                        }
                        result = result.concat(temp);
                    }
                    if (result.length > 0) {
                        result.sort((a, b) => a._name.localeCompare(b._name));
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { native: { _maintainPanels: result } }, obj.callback);
                        }
                        break;
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                    break;
                }
                case 'createScript': {
                    if (isNoScriptPanel(this.config.panels, obj.message?.topic)) {
                        const panel = findPanelEntry(this.config.panels, obj.message.topic);
                        const text = `Panel ${panel?.name || obj.message.topic} uses no script - no panel script is created or updated`;
                        this.log.warn(text);
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { error: text }, obj.callback);
                        }
                        break;
                    }
                    const result = await this.createConfigurationScript(obj.message.name, obj.message.topic);
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, result, obj.callback);
                    }
                    break;
                }
                case 'nspanelTsList':
                case 'nspanelTsConvert': {
                    let answer: unknown;
                    try {
                        const importer = this.nsPanelTsImport();
                        if (obj.command === 'nspanelTsList') {
                            answer = { scripts: await importer.list() };
                        } else if (isNsPanelTsConvertRequest(obj.message)) {
                            answer = await importer.convert(obj.message);
                        } else {
                            answer = { error: 'invalid message' };
                        }
                    } catch (e: unknown) {
                        this.log.error(`${obj.command}: ${formatErrorForLog(e)}`);
                        answer = { error: String(e) };
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, answer, obj.callback);
                    }
                    break;
                }
                case 'getIcons': {
                    const icons = Array.from(Icons.iconMap, ([name]) => name).map(a => {
                        return { label: a, value: a };
                    });
                    this.sendTo(obj.from, obj.command, icons, obj.callback);
                    break;
                }
                case 'getIconBase64': {
                    try {
                        if (fs.existsSync(path.join(__dirname, '../script'))) {
                            const fileContent = fs.readFileSync(path.join(__dirname, '../script/icons.json'), 'utf-8');
                            const icons = JSON.parse(fileContent);
                            const index = icons.findIndex((a: { name: string }) => a.name === obj.message.icon);
                            let img = '';
                            if (index !== -1) {
                                img = icons[index].base64;
                            }
                            this.sendTo(obj.from, obj.command, img, obj.callback);
                        }
                    } catch (error) {
                        console.error('Fehler beim Verarbeiten der Datei:', error);
                    }

                    break;
                }
                case 'updateTasmota': {
                    let language = this.library.getLocalLanguage();
                    language = language === 'zh-cn' ? 'en' : language;
                    const result = await this.getVersionsJson();
                    const msg: unknown = obj.message;
                    const msgBeta =
                        msg && typeof msg === 'object' && 'useBetaTFT' in msg && typeof msg.useBetaTFT === 'boolean'
                            ? msg.useBetaTFT
                            : undefined;
                    const tasmotaVersion = getTasmotaVersionFromJson(
                        result,
                        msgBeta ?? this.config.useBetaTFT === true,
                    );
                    if (tasmotaVersion) {
                        const cmnd = `OtaUrl http://ota.tasmota.com/tasmota32/release-${tasmotaVersion}/tasmota32-${language.toUpperCase()}.bin; Upgrade 1`;

                        if (this.controller?.panels) {
                            const index = this.controller.panels.findIndex(a => a.topic === obj.message.topic);
                            if (index !== -1) {
                                const panel = this.controller.panels[index];
                                panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                            }
                        }
                    } else {
                        this.log.warn(`Error getting Tasmota version!`);
                    }
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case 'customTftUpload': {
                    const chunk = parseTftChunkMessage(obj.message);
                    let error: string | undefined = 'sendToAnyError';
                    if (chunk) {
                        try {
                            this.tftServer ??= new TftServer(this);
                            error = await this.tftServer.addChunk(chunk);
                        } catch (e) {
                            this.log.warn(`Custom TFT: upload failed: ${String(e)}`);
                            error = 'customTftUploadBroken';
                        }
                    }
                    this.answerMessage(obj, error ? { error } : { result: 'ok' });
                    break;
                }
                case 'customTftStart': {
                    await this.customTftStart(obj);
                    break;
                }
                case 'customTftPanels': {
                    this.answerMessage(obj, {
                        panels: this.customTftPanels().map(p => ({ topic: p.topic, name: p.friendlyName || p.name })),
                    });
                    break;
                }
                case 'openTasmotaConsole':
                case 'openLinkToTasmota': {
                    if (obj.callback) {
                        this.sendTo(
                            obj.from,
                            obj.command,
                            {
                                openUrl: `http://${obj.message.ip}:80/${obj.command === 'openTasmotaConsole' ? 'cs?' : ''}`,
                                saveConfig: false,
                            },
                            obj.callback,
                        );
                    }
                    break;
                }
                case 'openLinkAliasTable': {
                    if (obj.callback) {
                        this.sendTo(
                            obj.from,
                            obj.command,
                            {
                                openUrl: obj.message.url,
                                saveConfig: false,
                            },
                            obj.callback,
                        );
                    }
                    break;
                }
                case 'screensaverNotify': {
                    // sendTo('nspanel-lovelace-ui.0', 'screensaverNotify', { panel: 'panelTopic', heading: 'Heading', text: 'Text', enabled: true });
                    // with `id`: a queue entry with the fields of setPopupNotification (headline, priority, icon, type ...)
                    let notifySent = false;
                    if (this.controller?.panels) {
                        notifySent = await this.controller.screensaverNotify(obj.message);
                    } else {
                        this.log.warn(`screensaverNotify: ${JSON.stringify(obj.message)} - controller not ready!`);
                    }
                    this.answerMessage(obj, notifySent ? { result: 'ok' } : { error: 'sendToAnyError' });
                    break;
                }
                case 'screensaverClockBlink': {
                    // sendTo('nspanel-lovelace-ui.0', 'screensaverClockBlink', { panel: 'panelTopic', enabled: true });
                    let blinkSent = false;
                    if (obj.message?.panel && this.controller?.panels) {
                        const panel = this.controller.panels.find(a => a.topic === obj.message.panel);
                        if (panel?.screenSaver) {
                            await panel.statesControler.setInternalState(
                                `${panel.name}/cmd/screensaverClockBlink`,
                                !!obj.message.enabled,
                                false,
                            );
                            blinkSent = true;
                        } else {
                            this.log.warn(`Panel ${obj.message.panel} not exists!`);
                        }
                    } else {
                        this.log.warn(
                            `Missing panel in screensaverClockBlink: ${JSON.stringify(obj.message)} or controller not ready!`,
                        );
                    }
                    this.answerMessage(obj, blinkSent ? { result: 'ok' } : { error: 'sendToAnyError' });
                    break;
                }
                case 'buzzer': {
                    // sendTo('nspanel-lovelace-ui.0', 'buzzer', { panel: 'panelTopic', command: '1,2,3,0xF54' });
                    if (obj.message?.panel && this.controller?.panels) {
                        const panel = this.controller.panels.find(a => a.topic === obj.message.panel);
                        if (panel && typeof obj.message.command === 'string' && obj.message.command.trim()) {
                            await panel.statesControler.setInternalState(
                                `${panel.name}/cmd/buzzer`,
                                obj.message.command.trim(),
                                false,
                            );
                        } else {
                            this.log.warn(`Panel ${obj.message.panel} not found or invalid buzzer command!`);
                        }
                    } else {
                        this.log.warn(
                            `Missing panel or command in buzzer: ${JSON.stringify(obj.message)} or controller not ready!`,
                        );
                    }
                    // Send response in callback if required
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                    break;
                }
                case 'uploadIcs': {
                    if (obj.command === 'uploadIcs') {
                        try {
                            const { filename, content } = obj.message as { filename: string; content: string };

                            // Speichern der Datei im ioBroker-Dateisystem
                            await this.writeFileAsync(this.namespace, filename, content);
                            this.log.info(`ICS-Datei in ioBroker-Dateisystem gespeichert : ${filename}`);

                            const data = iCal.parseICS(content);

                            const eventNames = new Set<string>();
                            for (const k in data) {
                                const component = data[k];
                                if (component && component.type === 'VEVENT') {
                                    const eventSummary = component.summary !== undefined ? component.summary : null;
                                    const eventName =
                                        typeof eventSummary === 'string' ? eventSummary : (eventSummary as any)?.val;

                                    if (eventName && typeof eventName === 'string' && eventName.trim() !== '') {
                                        eventNames.add(eventName);
                                    }
                                }
                            }
                            const events = Array.from(eventNames).map(name => ({ summary: name }));
                            this.log.debug(
                                `ICS-Datei verarbeitet. Folgende Ereignisse gefunden: ${JSON.stringify(events)}`,
                            );

                            // Antwort senden
                            if (obj.callback) {
                                this.sendTo(
                                    obj.from,
                                    obj.command,
                                    { success: true, path: filename, events: events },
                                    obj.callback,
                                );
                            }
                        } catch (error: any) {
                            this.log.error(`Fehler beim ICS-Upload: ${error}`);
                            if (obj.callback) {
                                this.sendTo(
                                    obj.from,
                                    obj.command,
                                    { success: false, error: error.message },
                                    obj.callback,
                                );
                            }
                        }
                    }
                    break;
                }
                default: {
                    // Send response in callback if required
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: 'sendToAnyError' }, obj.callback);
                    }
                }
            }
        } else {
            if (obj.callback) {
                this.sendTo(obj.from, obj.command, { error: 'failed' }, obj.callback);
            }
        }
    }

    async writeStateExternalAsync(dp: string, val: ioBroker.StateValue): Promise<void> {
        if (dp.startsWith(this.namespace)) {
            return;
        }
        await this.setForeignStateAsync(dp, val, false);
    }
    /**
     * Message for a script update that cannot find the token which separates the user configuration from the
     * script code - names where the token is missing.
     *
     * @param scriptId id of the script
     * @param token name of the token for the message
     * @param places where the token was searched and whether it was found
     * @returns the message
     */
    private scriptTokenError(scriptId: string, token: string, places: { found: boolean; where: string }[]): string {
        const missing = places
            .filter(p => !p.found)
            .map(p => p.where)
            .join(' and ');
        return `Update script ${scriptId} failed: the ${token} line was not found in ${missing}`;
    }

    async createGlobalConfigurationScript(): Promise<any> {
        const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;

        const folder: ioBroker.ChannelObject = {
            type: 'channel',
            _id: scriptPath,
            common: {
                name: this.namespace,
                expert: true,
            },
            native: {},
        };
        await this.extendForeignObjectAsync(scriptPath, folder);

        // Skript erstellen
        const scriptId = this.library.cleandp(`${scriptPath}.globalPageConfig`);
        this.log.debug(`Create/Update script ${scriptId}`);
        if (fs.existsSync(path.join(__dirname, '../script'))) {
            let file = fs.readFileSync(path.join(__dirname, '../script/globalPageConfig.ts'), 'utf8');
            const baseFile = fs.readFileSync(
                path.join(__dirname, '../script/example_sendTo_script_iobroker.ts'),
                'utf8',
            );

            const o = await this.getForeignObjectAsync(scriptId);
            if (baseFile && file) {
                file = file.replace(
                    /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfigGlobal',/,
                    `await sendToAsync('${this.namespace}', 'ScriptConfigGlobal',`,
                );
                const token = 'stopScript(scriptName, undefined)';
                if (o) {
                    const indexFrom = baseFile.indexOf(token);
                    const indexTo = o.common.source.indexOf(token);
                    if (indexFrom !== -1 && indexTo !== -1) {
                        this.log.info(`Update script ${scriptId}`);
                        file = o.common.source.substring(0, indexTo) + baseFile.substring(indexFrom);
                    } else {
                        const error = this.scriptTokenError(scriptId, token, [
                            { found: indexFrom !== -1, where: 'the template example_sendTo_script_iobroker.ts' },
                            { found: indexTo !== -1, where: 'the existing script' },
                        ]);
                        this.log.error(error);
                        return { error };
                    }
                    this.log.info(`Update global script ${scriptId}`);
                } else {
                    const indexFrom = baseFile.indexOf(token);
                    const indexTo = file.indexOf(token);
                    if (indexFrom !== -1 && indexTo !== -1) {
                        this.log.info(`Update script ${scriptId}`);
                        file = file.substring(0, indexTo) + baseFile.substring(indexFrom);
                    } else {
                        const error = this.scriptTokenError(scriptId, token, [
                            { found: indexFrom !== -1, where: 'the template example_sendTo_script_iobroker.ts' },
                            { found: indexTo !== -1, where: 'the template globalPageConfig.ts' },
                        ]);
                        this.log.error(error);
                        return { error };
                    }
                    this.log.info(`Create global script ${scriptId}`);
                }
                const script: ioBroker.ScriptObject = {
                    type: 'script',
                    _id: scriptId,
                    common: {
                        name: 'Global page configuration',
                        engineType: 'TypeScript/ts',
                        engine: `system.adapter.javascript.0`,
                        source: file,
                        debug: false,
                        verbose: false,
                        enabled: o?.common.enabled ?? true,
                    },
                    native: {},
                };
                await this.extendForeignObjectAsync(scriptId, script);
                return [];
            }
        }
    }
    /**
     * Baut die Kommando-URL für ein Tasmota-Gerät.
     *
     * @param tasmotaIP - IP-Adresse des Tasmota-Geräts
     * @param command - der Wert für `cmnd`, bereits fertig kodiert
     * @returns die vollständige URL
     */
    private getTasmotaCommandUrl(tasmotaIP: string, command: string): string {
        return (
            `http://${tasmotaIP}/cm?` +
            `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
            `&cmnd=${command}`
        );
    }

    /**
     * Panels that can flash a custom TFT: hardware panels with the real berry driver (version > 0) -
     * no web panels, no emulator (negative version) and no panel without a reported driver (0).
     *
     * @returns the panels
     */
    private customTftPanels(): Panel[] {
        return (this.controller?.panels ?? []).filter(
            p => !p.isVirtual && parseDriverVersion(p.info.nspanel.berryDriverVersion) > 0,
        );
    }

    /**
     * Admin tab developer: serves an uploaded custom TFT on a free port and tells the selected
     * panel(s) to flash it - the same command as the regular TFT update (`FlashNextionAdv0 <url>`),
     * only with the URL of the local server. Only the start is reported, not the flash.
     *
     * Message: `{ uploadId, target ('*' = all panels or a topic), internalServerIp? }` - the file was
     * sent before in chunks with `customTftUpload`.
     *
     * @param obj the message from the admin
     */
    private async customTftStart(obj: ioBroker.Message): Promise<void> {
        const msg = parseTftStartMessage(obj.message);
        if (!msg) {
            this.answerMessage(obj, { error: 'sendToAnyError' });
            return;
        }
        const serverIp = [msg.internalServerIp, this.config.internalServerIp].find(isUsableServerIp);
        if (!serverIp) {
            this.log.warn('Custom TFT: the IP of the ioBroker (internalServerIp) is not set');
            this.answerMessage(obj, { error: 'customTftNoServerIp' });
            return;
        }
        const panels = this.customTftPanels().filter(p => msg.target === '*' || p.topic === msg.target);
        if (panels.length === 0) {
            this.answerMessage(obj, { error: 'customTftNoPanel' });
            return;
        }
        if (!this.tftServer) {
            this.answerMessage(obj, { error: 'customTftUploadBroken' });
            return;
        }
        try {
            const served = await this.tftServer.serve(msg.uploadId);
            if ('error' in served) {
                this.answerMessage(obj, { error: served.error });
                return;
            }
            const cmnd = `FlashNextionAdv0 http://${serverIp}:${served.port}${served.urlPath}`;
            for (const panel of panels) {
                this.log.info(`Custom TFT: sending '${cmnd}' to ${panel.topic}`);
                await this.markTftFlashStarting(panel.name);
                panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                await this.delay(100);
                panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, ``);
            }
            this.answerMessage(obj, { result: 'ok', count: panels.length });
        } catch (e) {
            this.log.error(`Custom TFT: could not start the TFT server: ${String(e)}`);
            this.answerMessage(obj, { error: 'customTftServerError' });
        }
    }

    /**
     * Antwortet auf eine sendTo-Nachricht, sofern sie einen Callback hat.
     *
     * @param obj - die sendTo-Nachricht
     * @param payload - die Antwort für den Admin
     */
    /**
     * Admin tab developer: all pages and screensavers of all panels for the page dump (web clones left out, they
     * are the same panel as their hardware panel).
     *
     * @returns one entry per page
     */
    private pageDumpList(): PageDumpListEntry[] {
        const out: PageDumpListEntry[] = [];
        for (const panel of this.controller?.panels ?? []) {
            if (!panel || panel.isClone) {
                continue;
            }
            const panelName = panel.friendlyName || panel.name;
            for (const p of panel.getPageDumpPages()) {
                out.push({ panelTopic: panel.topic, panelName, ...p });
            }
        }
        return out;
    }

    /**
     * Admin tab developer: dump of one page or screensaver - stored and runtime configuration, secrets removed.
     *
     * @param message the request (panelTopic, page, kind)
     * @returns `{ result: <dump> }` or `{ error: <i18n key> }`
     */
    private async pageDump(message: unknown): Promise<Record<string, unknown>> {
        if (!isPageDumpRequest(message)) {
            return { error: 'pageDumpNotFound' };
        }
        const panel = this.controller?.panels.find(p => p && !p.isClone && p.topic === message.panelTopic);
        const runtime = panel?.getPageDumpRuntime(message.kind, message.page);
        if (!panel || !runtime) {
            return { error: 'pageDumpNotFound' };
        }
        let scriptConfigRaw: unknown = undefined;
        let globalConfigRaw: unknown = undefined;
        try {
            const meta = await this.getForeignObjectAsync(this.namespace);
            scriptConfigRaw = meta?.native?.scriptConfigRaw;
            globalConfigRaw = meta?.native?.globalConfigRaw;
        } catch (e) {
            this.log.warn(`Page dump: cannot read the script configuration: ${String(e)}`);
        }
        return {
            result: buildPageDump({
                panel: {
                    topic: panel.topic,
                    name: panel.friendlyName || panel.name,
                    model: panel.info.nspanel.model,
                    kind: panel.options.kind === 'web' ? 'web' : 'tasmota',
                    noScript: isNoScriptPanel(this.config.panels, panel.topic),
                },
                runtime,
                native: this.config,
                scriptConfigRaw,
                globalConfigRaw,
                adapterVersion: this.version,
                now: new Date(),
            }),
        };
    }

    private answerMessage(obj: ioBroker.Message, payload: Record<string, unknown>): void {
        if (obj.callback) {
            this.sendTo(obj.from, obj.command, payload, obj.callback);
        }
    }

    /**
     * Holt den Zwischenstand einer laufenden Einrichtung und beantwortet die Nachricht selbst,
     * wenn es keinen gibt.
     *
     * @param obj - die sendTo-Nachricht
     * @returns Topic und Zwischenstand oder null, wenn die Nachricht bereits beantwortet wurde
     */
    private getNsPanelInitSession(obj: ioBroker.Message): { topic: string; session: NsPanelInitSession } | null {
        this.purgeNsPanelInitSessions();
        const topic: string | undefined = obj.message?.tasmotaTopic;
        const session = topic ? this.nsPanelInitSessions.get(topic) : undefined;
        if (!topic || !session) {
            this.log.warn(`No running setup found for topic ${topic ?? 'unknown'}!`);
            this.answerMessage(obj, { error: 'sendToInitSessionLost' });
            return null;
        }
        return { topic, session };
    }

    /**
     * Schritt 1 von 3 der Panel-Einrichtung: MQTT-Zugang übertragen und den Neustart abwarten.
     *
     * Die Einrichtung ist auf drei sendTo-Aufrufe verteilt, weil der Admin jede Antwort verwirft,
     * die länger als 30 Sekunden auf sich warten lässt (`socket.io.js`, `withCallback`: der
     * Callback wird nach 30 s mit dem String `timeout` aufgerufen und verworfen). Der komplette
     * Ablauf dauert rund 40 Sekunden, jeder einzelne Schritt bleibt deutlich darunter und meldet
     * seinen Meilenstein zurück.
     *
     * @param obj - die sendTo-Nachricht aus dem Admin
     */
    private async nsPanelInitStep1(obj: ioBroker.Message): Promise<void> {
        const msg = obj.message;
        // Ein fehlendes mqttServer bedeutet schlicht, dass der interne Broker nicht genutzt wird.
        const useInternalServer = !(msg?.mqttServer == null || msg.mqttServer === false || msg.mqttServer === 'false');
        // With a central credential (external broker only) the admin only knows its id - the values are resolved here
        if (!useInternalServer && isCredentialId(msg?.mqttCredentialId)) {
            const mqtt = await resolveLogin(this, msg.mqttCredentialId, msg.mqttUsername, msg.mqttPassword);
            if (mqtt.source === 'credential') {
                msg.mqttUsername = mqtt.login;
                msg.mqttPassword = mqtt.password;
            }
        }
        const missing: string[] = [];
        for (const field of ['tasmotaIP', 'tasmotaName', 'tasmotaTopic', 'mqttPort', 'mqttUsername', 'mqttPassword']) {
            if (!msg?.[field]) {
                missing.push(field);
            }
        }
        // Je nach Broker wird entweder die Adresse des internen Servers oder die des externen gebraucht.
        if (useInternalServer ? !msg?.internalServerIp : !msg?.mqttIp) {
            missing.push(useInternalServer ? 'internalServerIp' : 'mqttIp');
        }
        if (missing.length > 0) {
            this.log.warn(`nsPanelInit: the message from the admin is missing: ${missing.join(', ')}!`);
            this.answerMessage(obj, { error: 'sendToAnyError' });
            return;
        }
        msg.mqttServer = useInternalServer;

        const topic: string = msg.tasmotaTopic;
        // Until the device is assigned by its MAC, the running panel instance with the topic of the request
        // receives the error status; after the assignment it is the instance of the matched entry.
        let panel: Panel | undefined = this.controller?.panels.find(a => a.topic === topic);
        try {
            if (!(await this.getVersionsJson())) {
                this.log.error(
                    'Could not fetch version json! Check your internet connection and the url in the adapter configuration!',
                );
                this.answerMessage(obj, { error: 'sendToVersionJsonFetchFailed' });
                return;
            }

            let u = new URL(this.getTasmotaCommandUrl(msg.tasmotaIP, `status 5`));
            this.log.debug(`Requesting tasmota status 5 with url: ${redactSecretsInText(u.href)}`);
            // The first request tells whether the panel answers at all. Since Tasmota 15.4.0.2 the HTTP API is
            // off after flashing (SetOption128) - the admin gets its own hint for this case.
            let r: unknown;
            try {
                r = await this.fetch(u.href);
            } catch (e: unknown) {
                this.failNsPanelInitStep1(obj, topic, panel, msg.tasmotaIP, e, 'sendToTasmotaNotReachable');
                return;
            }
            this.log.debug(`Response from tasmota status 5: ${JSON.stringify(r)}`);
            if (!isTasmotaStatusNet(r) || !r || !r.StatusNET || !r.StatusNET.Mac) {
                this.log.warn(`Device with topic ${topic} not found!`);
                this.answerMessage(obj, { error: 'sendToDeviceNotFound' });
                if (panel) {
                    void panel.setStatus('error');
                }
                return;
            }

            // Das Gerät wird über seine MAC wiedererkannt - Name, Topic und IP dürfen sich ändern.
            const panels = this.config.panels ?? [];
            // Namen kollidieren, wenn sie dieselbe Skript-ID ergeben.
            const match = matchPanelForSetup(
                panels,
                this.library.cleandp(r.StatusNET.Mac),
                topic,
                msg.tasmotaName,
                name => this.configurationScriptId(name),
            );
            if ('error' in match) {
                const other = panels[match.conflictIndex];
                this.log.error(
                    match.error === 'sendToNameInUse'
                        ? `The name ${msg.tasmotaName} is already used by the panel ${other?.name ?? ''} (${other?.topic ?? ''}) - choose another name!`
                        : `The topic ${topic} is already used by the panel ${other?.name ?? ''}!`,
                );
                this.answerMessage(obj, { error: match.error });
                return;
            }
            const item: (typeof panels)[number] = match.isNew
                ? { name: '', ip: '', topic: '', id: '', model: 'eu' }
                : panels[match.index];
            const panelTopic = match.isNew ? topic : item.topic;
            panel = this.controller?.panels.find(a => a.topic === panelTopic);
            if (panel) {
                void panel.setStatus('setup');
            }

            const appendix = r.StatusNET.Mac.replace(/:/g, '').slice(-6);
            const mqttClientId = `${this.library.cleandp(msg.tasmotaName)}-${appendix}`;
            const url: string =
                ` MqttHost ${msg.mqttServer ? msg.internalServerIp : msg.mqttIp};` +
                ` MqttPort ${msg.mqttPort}; MqttUser ${msg.mqttUsername}; MqttPassword ${msg.mqttPassword};` +
                ` FullTopic ${`${topic}/%prefix%/`.replaceAll('//', '/')};` +
                ` MqttRetry 10; FriendlyName1 ${msg.tasmotaName}; Hostname ${msg.tasmotaName.replaceAll(/[^a-zA-Z0-9_-]/g, '_')};` +
                ` MqttClient ${mqttClientId};` +
                ` ${msg.mqttServer ? 'SetOption132 1; SetOption103 1 ' : 'SetOption132 0; SetOption103 0'}; Restart 1`;
            u = new URL(this.getTasmotaCommandUrl(msg.tasmotaIP, `Backlog${encodeURIComponent(url)}`));
            this.log.debug(
                `Sending mqtt config & base config to tasmota with IP ${msg.tasmotaIP} and name ${msg.tasmotaName}.`,
            );
            this.log.info(
                `Sending mqtt config & base config to tasmota: ${msg.tasmotaIP} with user ${msg.mqttUsername} && ***`,
            );
            await this.fetch(u.href);
            this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 60_000));

            this.purgeNsPanelInitSessions();
            this.nsPanelInitSessions.set(topic, {
                item,
                isNew: match.isNew,
                panelTopic,
                panelName: match.isNew ? '' : item.name,
                isEmulator: false,
                ts: Date.now(),
            });
            this.answerMessage(obj, { result: 'sendToNSPanelInitStep1Done', step: 1 });
        } catch (e: unknown) {
            this.failNsPanelInitStep1(obj, topic, panel, msg.tasmotaIP, e, 'sendToRequestFail4');
        }
    }

    /**
     * Beendet Schritt 1 der Panel-Einrichtung nach einem Fehler: Session verwerfen, Fehler loggen,
     * Panel-Status auf 'error' setzen und dem Admin den Fehlerkey antworten.
     *
     * @param obj - die sendTo-Nachricht aus dem Admin
     * @param topic - Topic der Einrichtung
     * @param panel - laufende Panel-Instanz, falls vorhanden
     * @param tasmotaIP - IP-Adresse des Tasmota-Geräts, falls bekannt
     * @param e - der aufgetretene Fehler
     * @param errorKey - Übersetzungskey für den Admin
     */
    private failNsPanelInitStep1(
        obj: ioBroker.Message,
        topic: string,
        panel: Panel | undefined,
        tasmotaIP: string | undefined,
        e: unknown,
        errorKey: 'sendToTasmotaNotReachable' | 'sendToRequestFail4',
    ): void {
        this.nsPanelInitSessions.delete(topic);
        this.logNsPanelInitError(1, tasmotaIP, e);
        if (panel) {
            void panel.setStatus('error');
        }
        this.answerMessage(obj, { error: errorKey });
    }

    /**
     * Schritt 2 von 3 der Panel-Einrichtung: Template, Zeitzone und Messbereich übertragen,
     * danach die Treiberversion abfragen.
     *
     * @param obj - die sendTo-Nachricht aus dem Admin
     */
    private async nsPanelInitStep2(obj: ioBroker.Message): Promise<void> {
        const found = this.getNsPanelInitSession(obj);
        if (!found) {
            return;
        }
        const { topic, session } = found;
        const msg = obj.message;
        const panel = this.controller?.panels.find(a => a.topic === session.panelTopic);
        try {
            let u = new URL(
                this.getTasmotaCommandUrl(
                    msg.tasmotaIP,
                    `Backlog${encodeURIComponent(
                        ` WebLog 2;SetOption111 1; template {"NAME":"${msg.tasmotaName}", "GPIO":[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0],"FLAG":0,"BASE":1};` +
                            ` Module 0;${this.config.timezone ? definition.getTasmotaTimeZone(this.config.timezone) : ''}; restart 1`,
                    )}`,
                ),
            );
            await this.fetch(u.href);
            this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 60_000));

            u = new URL(this.getTasmotaCommandUrl(msg.tasmotaIP, `status 0`));
            const r = await this.fetch(u.href);
            if (!isTasmotaStatusNet(r) || !r || !r.StatusNET || !r.StatusNET.Mac) {
                this.log.warn(`Device with topic ${topic} not found!`);
                this.answerMessage(obj, { error: 'sendToDeviceNotFound' });
                if (panel) {
                    void panel.setStatus('error');
                }
                return;
            }

            u = new URL(this.getTasmotaCommandUrl(msg.tasmotaIP, encodeURIComponent(`AdcParam 2,14600,10000,3950`)));
            await this.fetch(u.href);
            await this.delay(150);

            session.item.model = msg.model || 'eu';
            session.item.name = msg.tasmotaName;
            session.item.topic = topic;
            session.item.id = this.library.cleandp(r.StatusNET.Mac);
            session.item.ip = r.StatusNET.IPAddress;

            let driver: Record<string, string> | undefined = undefined;
            try {
                driver = (await this.fetch(
                    this.getTasmotaCommandUrl(msg.tasmotaIP, `GetDriverVersion`),
                    undefined,
                    3000,
                )) as Record<string, string> | undefined;
            } catch {
                //ignore
            }
            session.isEmulator = isEmulatorDriverVersion(driver?.nlui_driver_version);
            session.ts = Date.now();

            this.answerMessage(obj, { result: 'sendToNSPanelInitStep2Done', step: 2 });
        } catch (e: unknown) {
            this.nsPanelInitSessions.delete(topic);
            this.logNsPanelInitError(2, msg.tasmotaIP, e);
            if (panel) {
                void panel.setStatus('error');
            }
            this.answerMessage(obj, { error: 'sendToRequestFail4' });
        }
    }

    /**
     * Schritt 3 von 3 der Panel-Einrichtung: Berry-Treiber und TFT installieren, das
     * Konfigurationsskript anlegen und die Panelliste an den Admin zurückgeben.
     *
     * @param obj - die sendTo-Nachricht aus dem Admin
     */
    private async nsPanelInitStep3(obj: ioBroker.Message): Promise<void> {
        const found = this.getNsPanelInitSession(obj);
        if (!found) {
            return;
        }
        const { topic, session } = found;
        const msg = obj.message;
        const panel = this.controller?.panels.find(a => a.topic === session.panelTopic);
        try {
            const versionsJson = await this.getVersionsJson();
            if (!session.isEmulator) {
                try {
                    if (!versionsJson) {
                        this.log.error('No version found!');
                        this.answerMessage(obj, { error: 'sendToRequestFail1' });
                        if (panel) {
                            void panel.setStatus('error');
                        }
                        return;
                    }

                    if (!(await this.checkTasmotaHasInternetAccess(msg.tasmotaIP, topic, this.config.berryUrl))) {
                        this.answerMessage(obj, { error: 'sendToNoInternetAccess' });
                        if (panel) {
                            void panel.setStatus('error');
                        }
                        return;
                    }
                    const version = msg.useBetaTFT
                        ? versionsJson[`berry-beta`].split('_')[0]
                        : versionsJson.berry.split('_')[0];
                    const url = this.getBerryInstallUrl(msg.tasmotaIP, version);
                    this.log.info(`Installing berry on tasmota with IP ${msg.tasmotaIP}, name ${msg.tasmotaName}.`);
                    this.log.debug(`URL: ${redactSecretsInText(url)}`);
                    await this.fetch(url);
                    try {
                        this.mqttClient && (await this.mqttClient.waitTasmotaUrlFetch(topic, 5000));
                    } catch (e: unknown) {
                        this.log.error(
                            `Did not receive download confirmation from tasmota ${msg.tasmotaIP} after berry install: ${String(e)}`,
                        );
                        await this.finishBerryInstall(msg.tasmotaIP, false, false);
                        this.answerMessage(obj, { error: 'sendToRequestFailBerry' });
                        return;
                    }

                    // renames autoexec.bak to autoexec.old and restarts Tasmota in one backlog
                    await this.finishBerryInstall(msg.tasmotaIP, true, true);
                    this.mqttClient && (await this.mqttClient.waitPanelConnectAsync(topic, 20_000));
                    await this.delay(1000);
                } catch (e: unknown) {
                    this.log.error(`Error: while installing berry - ${formatErrorForLog(e)}`);
                    if (panel) {
                        void panel.setStatus('error');
                    }
                }

                try {
                    await this.delay(1500);
                    const cmnd = await this.getTFTVersionOnline(
                        msg.model,
                        msg.useBetaTFT,
                        this.config.forceTFTVersion,
                        versionsJson,
                    );
                    if (!cmnd) {
                        this.log.error('No version found!');
                        this.answerMessage(obj, { error: 'sendToRequestFail2' });
                        if (panel) {
                            void panel.setStatus('error');
                        }
                        return;
                    }
                    if (this.mqttClient) {
                        await this.markTftFlashStarting(session.item.id);
                        await this.mqttClient.publish(`${topic}/cmnd/Backlog`, `${cmnd}`);
                        await this.delay(100);
                        await this.mqttClient.publish(`${topic}/cmnd/Backlog`, ``);
                    }
                    this.log.info(`Installing tft on tasmota with IP ${msg.tasmotaIP} and name ${msg.tasmotaName}.`);
                } catch (e: unknown) {
                    this.log.error(`Error: ${String(e)}`);
                    this.answerMessage(obj, { error: 'sendToRequestFail3' });
                    if (panel) {
                        void panel.setStatus('error');
                    }
                    return;
                }
            } else {
                this.log.info(
                    `Emulator detected on tasmota with IP ${msg.tasmotaIP} and name ${msg.tasmotaName}, skipping berry install.`,
                );
            }

            // bestehendes Panel: was am alten Topic oder Namen hängt, zieht mit (#899)
            const previous = session.isNew ? undefined : { name: session.panelName, topic: session.panelTopic };
            let renamedScript: { from: string; to: string } | undefined;
            if (session.item.noScript === true) {
                // "panel uses no script": only the global script is kept up to date
                await this.createGlobalConfigurationScript();
            } else {
                if (previous) {
                    renamedScript = await this.moveConfigurationScript(previous, {
                        name: session.item.name,
                        topic: session.item.topic,
                    });
                }
                await this.createConfigurationScript(session.item.name, session.item.topic);
            }
            if (previous && (previous.topic !== session.item.topic || renamedScript)) {
                await this.migrateScriptConfigOfPanel(previous.topic, session.item.topic, renamedScript);
            }

            const panels = this.config.panels ?? [];
            if (session.isNew && !panels.includes(session.item)) {
                panels.push(session.item);
            }
            this.nsPanelInitSessions.delete(topic);
            this.answerMessage(obj, {
                result: session.isNew ? 'sendToNSPanelInitDataSuccess' : 'sendToNSPanelUpdateDataSuccess',
                native: { panels: panels },
                saveConfig: true,
                step: 3,
            });
        } catch (e: unknown) {
            this.nsPanelInitSessions.delete(topic);
            this.logNsPanelInitError(3, msg.tasmotaIP, e);
            if (panel) {
                void panel.setStatus('error');
            }
            this.answerMessage(obj, { error: 'sendToRequestFail4' });
        }
    }

    /**
     * Verwirft Zwischenstände von Einrichtungen, die der Admin nicht zu Ende geführt hat.
     */
    private purgeNsPanelInitSessions(): void {
        const now = Date.now();
        for (const [key, session] of this.nsPanelInitSessions) {
            if (now - session.ts > NS_PANEL_INIT_SESSION_TTL) {
                this.log.debug(`Discarding the unfinished panel setup for topic ${key}.`);
                this.nsPanelInitSessions.delete(key);
            }
        }
    }

    /**
     * Schreibt einen Fehler aus der Panel-Einrichtung ins Log.
     *
     * @param step - die Nummer des Schritts, in dem der Fehler auftrat
     * @param tasmotaIP - IP-Adresse des Tasmota-Geräts, falls bekannt
     * @param e - der aufgetretene Fehler
     */
    private logNsPanelInitError(step: number, tasmotaIP: string | undefined, e: unknown): void {
        const stack = formatErrorForLog(e, true);
        this.log.error(
            `Error in nsPanelInit step ${step} while sending config to tasmota (${tasmotaIP ?? 'unknown IP'}): ${stack}`,
        );
    }

    /**
     * @returns id of the folder the configuration scripts of this instance are created in
     */
    private configurationScriptFolder(): string {
        return `script.js.${this.library.cleandp(this.namespace, false, true)}`;
    }

    /**
     * @param panelName name of the panel
     * @returns id of the configuration script of the panel
     */
    private configurationScriptId(panelName: string): string {
        return this.library.cleandp(
            `${this.configurationScriptFolder()}.${this.library.cleandp(panelName, false, true)}`,
        );
    }

    /**
     * Setup of an existing panel with a new name and/or topic (#899): prepares its configuration script before
     * `createConfigurationScript` brings the template part up to date.
     *
     * - Topic changed: `panelTopic` in the user part of the script gets the new topic.
     * - Name changed (other script id): when the script of the old name exists and none of the new name, the script
     *   is moved to the new id (user part kept, `common.name` = new name, other common fields such as `enabled`
     *   taken over) and the old object is deleted. When the script of the new name exists already, nothing is
     *   moved or deleted (warning). Without a script of the old name nothing happens here.
     *
     * @param previous name and topic of the panel before the setup
     * @param previous.name name before the setup
     * @param previous.topic topic before the setup
     * @param next name and topic of the panel after the setup
     * @param next.name name after the setup
     * @param next.topic topic after the setup
     * @returns old and new script id when the script was moved, otherwise undefined
     */
    private async moveConfigurationScript(
        previous: { name: string; topic: string },
        next: { name: string; topic: string },
    ): Promise<{ from: string; to: string } | undefined> {
        if (!previous.name || !next.name || !next.topic) {
            return undefined;
        }
        const topicChanged = previous.topic !== next.topic;
        const fromId = this.configurationScriptId(previous.name);
        const toId = this.configurationScriptId(next.name);
        try {
            const from = await this.getForeignObjectAsync(fromId);
            if (!from || from.type !== 'script' || typeof from.common?.source !== 'string') {
                return undefined;
            }
            const retopic = (source: string): string => {
                if (!topicChanged) {
                    return source;
                }
                const r = replacePanelTopicInScript(source, previous.topic, next.topic);
                if (r.count === 0) {
                    this.log.warn(
                        `Script ${fromId}: no panelTopic '${previous.topic}' found in the configuration part - set the new topic '${next.topic}' there by hand!`,
                    );
                }
                return r.source;
            };

            if (fromId === toId) {
                const source = retopic(from.common.source);
                if (source !== from.common.source) {
                    await this.extendForeignObjectAsync(fromId, { common: { source } });
                    this.log.info(`Script ${fromId}: panelTopic changed from ${previous.topic} to ${next.topic}`);
                }
                return undefined;
            }

            if (await this.getForeignObjectAsync(toId)) {
                this.log.warn(
                    `Panel renamed from ${previous.name} to ${next.name}, but the script ${toId} exists already - ${fromId} is kept, check both scripts!`,
                );
                return undefined;
            }

            const script: ioBroker.ScriptObject = {
                _id: toId,
                type: 'script',
                common: { ...from.common, name: next.name, source: retopic(from.common.source) },
                native: from.native ?? {},
            };
            await this.setForeignObjectAsync(toId, script);
            await this.delForeignObjectAsync(fromId);
            this.log.info(`Panel renamed from ${previous.name} to ${next.name}: script ${fromId} moved to ${toId}`);
            return { from: fromId, to: toId };
        } catch (e: unknown) {
            this.log.error(`Error while moving the script ${fromId} to ${toId}: ${String(e)}`);
            return undefined;
        }
    }

    /**
     * Moves the script configuration of a panel in the meta object to its new topic and/or script id
     * (see `migrateScriptConfigTopic`).
     *
     * @param oldTopic topic before the setup
     * @param newTopic topic after the setup
     * @param script old and new script id when the configuration script was moved
     */
    private async migrateScriptConfigOfPanel(
        oldTopic: string,
        newTopic: string,
        script: { from: string; to: string } | undefined,
    ): Promise<void> {
        try {
            const meta = await this.getForeignObjectAsync(this.namespace);
            if (!meta?.native) {
                return;
            }
            const r = migrateScriptConfigTopic(meta.native, oldTopic, newTopic, script);
            if (!r.scriptConfigRaw && !r.scriptConfig) {
                return;
            }
            if (r.scriptConfigRaw) {
                meta.native.scriptConfigRaw = r.scriptConfigRaw;
            }
            if (r.scriptConfig) {
                meta.native.scriptConfig = r.scriptConfig;
            }
            await this.setForeignObjectAsync(this.namespace, meta);
            const dropped = r.dropped ? `, ${r.dropped} old entries of ${newTopic} dropped` : '';
            const renamed = script ? `, script ${script.from} -> ${script.to}` : '';
            this.log.info(`Script configuration moved from ${oldTopic} to ${newTopic}${renamed}${dropped}`);
        } catch (e: unknown) {
            this.log.error(`Error while moving the script configuration from ${oldTopic} to ${newTopic}: ${String(e)}`);
        }
    }

    /**
     * The NSPanelTs import (old standalone script → configuration script of this instance).
     *
     * @returns the importer
     */
    private nsPanelTsImport(): NsPanelTsImport {
        return new NsPanelTsImport({
            adapter: this,
            folder: this.configurationScriptFolder(),
            scriptIdFor: name => this.configurationScriptId(name),
            template: fs.readFileSync(path.join(__dirname, '../script/example_sendTo_script_iobroker.ts'), 'utf8'),
            endToken: SCRIPT_END_STOP_TOKEN,
            panelNames: (this.config.panels ?? [])
                .filter(p => p && p.kind !== 'web' && typeof p.name === 'string' && p.name)
                .map(p => p.name),
        });
    }

    async createConfigurationScript(panelName: string, panelTopic: string): Promise<any> {
        // the panel script is written in any case; a failed global script is reported at the end
        const globalResult = await this.createGlobalConfigurationScript();

        const scriptPath = this.configurationScriptFolder();

        const folder: ioBroker.ChannelObject = {
            type: 'channel',
            _id: scriptPath,
            common: {
                name: this.namespace,
                expert: true,
            },
            native: {},
        };
        await this.extendForeignObjectAsync(scriptPath, folder);

        // Skript erstellen
        const scriptId = this.configurationScriptId(panelName);
        this.log.debug(`Create script ${scriptId}`);
        if (fs.existsSync(path.join(__dirname, '../script')) && panelName && panelTopic) {
            let file = fs.readFileSync(path.join(__dirname, '../script/example_sendTo_script_iobroker.ts'), 'utf8');
            const o = await this.getForeignObjectAsync(scriptId);
            if (file) {
                file = file.replace(`panelTopic: 'topic',`, `panelTopic: '${panelTopic}',`);
                file = file.replace(
                    /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfig',/,
                    `await sendToAsync('${this.namespace}', 'ScriptConfig',`,
                );
                if (o) {
                    const token = SCRIPT_END_STOP_TOKEN;
                    const indexFrom = file.indexOf(token);
                    const indexTo = o.common.source.indexOf(token);
                    if (indexFrom !== -1 && indexTo !== -1) {
                        this.log.info(`Update script ${scriptId}`);
                        file = o.common.source.substring(0, indexTo) + file.substring(indexFrom);
                    } else {
                        const error = this.scriptTokenError(scriptId, 'END STOP', [
                            { found: indexFrom !== -1, where: 'the template example_sendTo_script_iobroker.ts' },
                            { found: indexTo !== -1, where: 'the existing script' },
                        ]);
                        this.log.warn(error);
                        return { error };
                    }
                } else {
                    this.log.info(`Create script ${scriptId}`);
                }
                const script: ioBroker.ScriptObject = {
                    type: 'script',
                    _id: scriptId,
                    common: {
                        name: panelName,
                        engineType: 'TypeScript/ts',
                        engine: `system.adapter.javascript.0`,
                        source: file,
                        debug: false,
                        verbose: false,
                        enabled: o?.common.enabled ?? true,
                    },
                    native: {},
                };
                await this.extendForeignObjectAsync(scriptId, script);
                return globalResult?.error ? globalResult : [];
            }
        }
    }
    async getVersionsJson(): Promise<Record<string, string> | undefined> {
        try {
            if (this.versionJson && Date.now() - this.versionJson.timestamp < 60 * 60 * 1000) {
                return this.versionJson.data;
            }
            const result = (await this.fetch(this.config.versionJsonUrl)) as Record<string, string> | undefined;
            if (result) {
                this.versionJson = { data: result, timestamp: Date.now() };
                return result;
            }
            this.log.error('No version data received.');
            return undefined;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log.error(`Error fetching version data: ${errorMessage}`);
            return undefined;
        }
    }
    async getTFTVersionOnline(
        m: string,
        beta: boolean,
        alpha: string,
        result?: Record<string, string>,
    ): Promise<string | null> {
        if (!result) {
            result = await this.getVersionsJson();
        }
        const data = result;
        if (!data) {
            this.log.error('No version data received.');
            return null;
        }
        data['tft-alpha'] = alpha;

        const modelSuffix = m && m !== 'eu' ? `-${m}` : '';
        const alphaKey = alpha ? `tft${modelSuffix}-alpha` : '';
        const betaKey = beta ? `tft${modelSuffix}-beta` : '';
        const defaultKey = `tft${modelSuffix}`;

        let entry = alpha && data[alphaKey] ? data[alphaKey] : '';
        entry = !entry && beta && data[betaKey] ? data[betaKey] : entry;
        entry = !entry && data[defaultKey] ? data[defaultKey] : entry;

        if (!entry) {
            this.log.error(`No version entry for key "${defaultKey}".`);
            return null;
        }

        const version = String(entry).split('_')[0]; // z.B. "1.2.3" aus "1.2.3_filename"
        if (!version) {
            this.log.error(`Invalid version in entry for "${defaultKey}": ${entry}`);
            return null;
        }

        const fileName = `nspanel${modelSuffix}-v${version}.tft`;
        const url = `${this.config.tftUrl}/${encodeURIComponent(fileName)}`;
        const cmnd = `FlashNextionAdv0 ${url}`;

        if (alpha) {
            this.log.warn(`⚠️  Installing pinned ${alpha} TFT firmware – for testing only.`);
        }

        this.log.debug(cmnd);
        return cmnd;
    }
    /**
     * Sets `firmwareUpdate` to 0 right before a TFT flash is sent: the panel reports its first
     * progress only after skipping the unchanged data (often 45 s or more), until then the value of
     * the last flash (100) would let `onMqttConnect` restart Tasmota in the middle of the flash.
     * The panel sets 100 again with `Flashing: done` or with its next startup event.
     *
     * @param panelId id of the panel (`panels.<id>`), nothing happens without one
     */
    private async markTftFlashStarting(panelId: string | undefined): Promise<void> {
        if (!panelId) {
            return;
        }
        await this.library.writedp(
            `panels.${panelId}.info.nspanel.firmwareUpdate`,
            0,
            definition.genericStateObjects.panel.panels.info.nspanel.firmwareUpdate,
        );
    }
    /** @returns login of the Tasmota web interface from the adapter config */
    private getTasmotaLogin(): TasmotaLogin {
        return { useAdmin: this.config.useTasmotaAdmin, password: this.config.tasmotaAdminPassword };
    }
    /**
     * Url of the first berry install step: the running `autoexec.be` is renamed to `autoexec.bak`,
     * then the new driver is downloaded. Must be followed by `finishBerryInstall`.
     *
     * @param tasmotaIP ip of the Tasmota device
     * @param version driver version to download
     * @returns the url
     */
    getBerryInstallUrl(tasmotaIP: string, version: string): string {
        return getTasmotaCommandUrl(
            tasmotaIP,
            getBerryDownloadCommand(this.config.berryUrl, version),
            this.getTasmotaLogin(),
        );
    }
    /**
     * Second berry install step after the `UrlFetch` result.
     * Success: `autoexec.bak` becomes `autoexec.old`, optional restart in the same backlog.
     * Failure: a partial `autoexec.be` is deleted and `autoexec.bak` is restored as `autoexec.be`.
     *
     * @param tasmotaIP ip of the Tasmota device
     * @param success true when Tasmota confirmed the download
     * @param restart true: restart Tasmota after a successful install
     */
    private async finishBerryInstall(tasmotaIP: string, success: boolean, restart: boolean): Promise<void> {
        const login = this.getTasmotaLogin();
        if (success) {
            await this.fetch(getTasmotaCommandUrl(tasmotaIP, getBerryCommitCommand(restart), login));
            return;
        }
        try {
            await this.fetch(getTasmotaCommandUrl(tasmotaIP, getBerryRestoreCommand(), login));
            this.log.warn(
                `Berry driver download on tasmota ${tasmotaIP} failed - the previous autoexec.be was restored.`,
            );
        } catch (e: unknown) {
            this.log.error(
                `Berry driver download on tasmota ${tasmotaIP} failed and restoring autoexec.bak to autoexec.be failed too: ${formatErrorForLog(e)}`,
            );
        }
    }
    getRestartTasmotaUrl(tasmotaIP: string): string {
        return (
            `http://${tasmotaIP}/cm?` +
            `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
            `&cmnd=Restart%201`
        );
    }

    async checkTasmotaHasInternetAccess(tasmotaIP: string, topic: string, testUrl: string): Promise<boolean> {
        try {
            const hostname = new URL(testUrl).hostname;
            const url =
                `http://${tasmotaIP}/cm?` +
                `${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}` +
                `&cmnd=Ping%20${encodeURIComponent(hostname)}`;

            await this.fetch(url);
            this.mqttClient && (await this.mqttClient.waitTasmotaHasInternet(topic, 5000, hostname));
            this.log.debug(`Tasmota device at ${tasmotaIP} has internet access.`);
            return true;
        } catch (error: unknown) {
            this.log.error(
                `Error checking internet access for Tasmota device at ${tasmotaIP}: ${formatErrorForLog(error)}`,
            );
            return false;
        }
    }
    async convertAdminPageItemToPageItemConfig(
        preItem: AdminPageItemConfig | undefined,
        /** the page of the item; `alwaysOn` is handed on to the page generated from the item (device page) */
        prePage: { card: string; uniqueName: string; alwaysOn?: 'none' | 'always' | 'action' | 'ignore' },
        messages: string[],
    ): Promise<{
        pageItem: NSPanel.PageItemDataItemsOptions | undefined;
        messages: string[];
        error: string | undefined;
        /**
         * page the config manager generated from the item (`media-<id>` behind a media item, the device page of a
         * device item) - the caller adds it
         */
        pageConfig?: ScriptConfig.PageType;
        /**
         * the messages nobody has logged yet (the config manager logs its own): the slots of a device page that were
         * left out - the admin configuration logs them with page and item
         */
        unloggedMessages?: string[];
    }> {
        let error: string | undefined = undefined;
        const unloggedMessages: string[] = [];
        let pageItem: NSPanel.PageItemDataItemsOptions | undefined = undefined;
        let pageConfig: ScriptConfig.PageType | undefined = undefined;
        if (preItem && prePage) {
            const manager = new ConfigManager(this);
            // device with details without own state or channel: an item without name shows the name of the device
            const shortPress = preItem.device && !preItem.useNative ? deviceShortPressOf(preItem.device) : undefined;
            if (
                !preItem.name &&
                preItem.device &&
                (shortPress === 'none' || shortPress === 'navigation' || shortPress === 'devicePage')
            ) {
                const device = await this.getForeignObjectAsync(preItem.device.deviceId);
                const deviceName = device?.common?.name;
                const name =
                    typeof deviceName === 'string'
                        ? deviceName
                        : deviceName
                          ? (deviceName[this.language ?? 'en'] ?? deviceName.en ?? '')
                          : '';
                preItem = { ...preItem, name: name || preItem.device.deviceId.split('.').pop() };
            }
            const item = adminPageItemToScriptItem(preItem, color => this.log.warn(`Invalid color format: ${color}`));
            if (!item) {
                error = 'Invalid/Empty item native configuration!';
                return { pageItem, messages, error };
            }

            const page = {
                type: prePage.card as ScriptConfig.PagetypeType,
                uniqueName: prePage.uniqueName,
                heading: '',
                items: [] as ScriptConfig.PageItem[],
            } as ScriptConfig.PageType;
            try {
                const result = await manager.getPageItemConfig(item, page, messages);
                messages = result.messages;
                pageItem = result.itemConfig;
                pageConfig = result.pageConfig;
                // device with details: a raw item brings all of its fields itself
                const deviceDetails = preItem.useNative ? undefined : deviceDetailsRuntimeOf(preItem.device);
                if (pageItem && deviceDetails) {
                    pageItem.deviceDetails = deviceDetails;
                    if (deviceDetails.devicePage && !pageConfig) {
                        // the device page: a page of its own below the page of the item, built here like the media
                        // page of a media item - the admin configuration adds it as generated page
                        const uniqueName = devicePageName(prePage.uniqueName, deviceDetails.deviceId);
                        const built = await buildDevicePage(
                            uniqueName,
                            prePage.alwaysOn ?? 'none',
                            {
                                deviceId: deviceDetails.deviceId,
                                entries: deviceDetails.entries,
                                page: deviceDetails.devicePage,
                                main: isPageItemWithoutTemplate(pageItem) ? pageItem : undefined,
                            },
                            {
                                getObject: async id => (await this.getForeignObjectAsync(id)) ?? null,
                                translate: key => this.library.getTranslation(key),
                                language: this.library.getLocalLanguage(),
                                pageItemOf: async slotItem => {
                                    const scriptItem = adminPageItemToScriptItem(slotItem, color =>
                                        this.log.warn(`Invalid color format: ${color}`),
                                    );
                                    return scriptItem
                                        ? (
                                              await manager.getPageItemConfig(
                                                  scriptItem,
                                                  // a slot is a cardGrid cell
                                                  {
                                                      type: 'cardGrid',
                                                      uniqueName: prePage.uniqueName,
                                                      heading: '',
                                                      items: [],
                                                  },
                                                  [],
                                              )
                                          ).itemConfig
                                        : undefined;
                                },
                            },
                        );
                        pageItem.devicePageName = uniqueName;
                        pageConfig = { type: undefined, uniqueName, native: built.page };
                        messages.push(...built.messages);
                        unloggedMessages.push(...built.messages);
                    }
                }
            } catch (e: any) {
                error = `Error in configuration: ${e.message}`;
            }
        }
        return { pageItem, messages, error, pageConfig, unloggedMessages };
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new NspanelLovelaceUi(options);
} else {
    // otherwise start the instance directly
    (() => new NspanelLovelaceUi())();
}
