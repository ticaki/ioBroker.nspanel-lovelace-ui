import { Page } from '../classes/Page';
import { type PageInterface } from '../classes/PageInterface';
import { Color } from '../const/Color';
import {
    deepAssign,
    getEntryTextOnOff,
    getIconEntryColor,
    getIconEntryValue,
    getPayload,
    getPayloadRemoveTilde,
    getScaledNumber,
    getValueAutoUnit,
    getValueEntryNumber,
    getValueEntryString,
} from '../const/tools';
import type * as pages from '../types/pages';
import type { IncomingEvent, nsPanelState } from '../types/types';
import type { ConfigManager } from '../classes/config-manager';
import type * as ShareConfig from '../types/adminShareConfig';

const PagePowerMessageDefault: pages.PagePowerMessage = {
    event: 'entityUpd',
    headline: 'Power Grid',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    homeValueTop: '',
    homeIcon: '',
    homeColor: '',
    homeName: '',
    homeValueBot: '',
    leftTop: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    leftMiddle: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    leftBottom: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    rightTop: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    rightMiddle: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
    rightBottom: {
        icon: '',
        iconColor: '',
        value: '',
        speed: 0,
        name: '',
    },
};

/**
 * untested
 */
export class PagePower extends Page {
    //items: pages.PageBaseConfig['items'];
    items: pages.cardPowerDataItems | undefined;
    index: number = 0;
    private autoUnit: (number | undefined)[] = [];
    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        if (options.config && options.config.card == 'cardPower') {
            this.config = options.config;
            this.index = this.config.index;
        }
        this.minUpdateInterval = 2000;
    }

    async init(): Promise<void> {
        await this.basePanel.statesControler.setInternalState(
            `///${this.name}/powerSum`,
            0,
            true,
            { name: '', type: 'number', role: '', read: true, write: true },
            this.onInternalCommand,
        );
        const config = structuredClone(this.config);
        // search states for mode auto
        const tempConfig: Partial<pages.cardPowerDataItemOptions> =
            this.enums || this.dpInit
                ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, undefined, this.enums)
                : config;
        // create Dataitems
        //this.log.debug(JSON.stringify(tempConfig));
        const tempItem: Partial<pages.cardPowerDataItems> = await this.basePanel.statesControler.createDataItems(
            tempConfig,
            this,
        );
        this.items = tempItem as pages.cardPowerDataItems;
        // set card because we lose it
        this.items.card = 'cardPower';
        await super.init();
    }

    onInternalCommand = async (id: string, _state: nsPanelState | undefined): Promise<ioBroker.StateValue> => {
        if (!id.startsWith(`///${this.name}`)) {
            return null;
        }
        const token = id.split('/').pop();
        if (token === 'powerSum') {
            const items = this.items;
            if (!items || items.card !== 'cardPower') {
                return null;
            }
            const data = items.data;
            const l1 = await this.getElementSum(data.leftTop, 0);
            const l2 = await this.getElementSum(data.leftMiddle, 0);
            const l3 = await this.getElementSum(data.leftBottom, 0);
            const r1 = await this.getElementSum(data.rightTop, 0);
            const r2 = await this.getElementSum(data.rightMiddle, 0);
            const r3 = await this.getElementSum(data.rightBottom, 0);

            let gesamt = 0;
            let angepasst: number[] = [];

            // Prüfen, ob die interne Berechnung aktiviert ist
            if (this.adapter.config.pagePowerdata[this.index].power8_selInternalCalculation) {
                const negativValue = this.adapter.config.pagePowerdata[this.index].power8_selPowerSupply; // Indexe (1-basiert), deren Werte negativ gezählt werden sollen
                const werte = [l1, l2, l3, r1, r2, r3];
                if (Array.isArray(negativValue) && negativValue.length > 0) {
                    // Werte negieren, falls der Index in negativValue enthalten ist
                    angepasst = werte.map((wert, index) => (negativValue.includes(index + 1) ? wert : 0));
                } else {
                    angepasst = werte;
                }
                // Gesamtsumme berechnen
                gesamt = angepasst.reduce((summe, wert) => summe + wert, 0);
                this.log.debug(`Angepasste Summe: ${gesamt}`);
                return String(gesamt);
            }
        }
        return null;
    };

    /**
     * Page config of a script page `cardPower` from a migrated entry of the page config
     * (deprecated transition after the migration of the table "Page Power"): the entry delivers the
     * content, the script the navigation. The page keeps the script name as id, so prev/next in the
     * script still match even if the migration renamed the entry.
     *
     * @param configManager the running ConfigManager
     * @param entry power entry of the page config
     * @param gridItem page base to extend
     * @param page the script page definition
     */
    static getPowerPageConfigFromEntry(
        configManager: ConfigManager,
        entry: ShareConfig.PowerEntry,
        gridItem: pages.PageBase,
        page: ScriptConfig.PagePower,
    ): pages.PageBase {
        const { config } = buildPowerPage(entry, configManager.adapter, page.uniqueName);
        return {
            ...gridItem,
            uniqueID: page.uniqueName,
            alwaysOn: gridItem.alwaysOn === 'always' || entry.alwaysOn === 'always' ? 'always' : 'none',
            hidden: !!(gridItem.hidden || entry.hidden),
            ...(config ? { config } : {}),
            pageItems: [],
        };
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        await super.update();
        const message: Partial<pages.PagePowerMessage> = {};
        const config = this.adapter.config.pagePowerdata[this.index];
        if (this.items && config != null) {
            const items = this.items;
            message.headline = this.library.getTranslation(
                (items.data.headline && (await items.data.headline.getString())) ?? config.headline ?? '',
            );
            message.navigation = this.getNavigation();

            const data = items.data;

            message.homeIcon = await getIconEntryValue(data.homeIcon, true, '');
            message.homeColor = await getIconEntryColor(data.homeIcon, true, Color.White);
            message.homeValueTop = (await getValueEntryString(data.homeValueTop)) ?? '';
            message.homeValueBot = (await getValueEntryString(data.homeValueBot)) ?? '';

            // to much work to change types to partial in getMessage we assign a full object to this.
            message.leftTop = (await this.getElementUpdate(data.leftTop, 0)) as pages.PagePowerMessageItem;
            message.leftMiddle = (await this.getElementUpdate(data.leftMiddle, 1)) as pages.PagePowerMessageItem;
            message.leftBottom = (await this.getElementUpdate(data.leftBottom, 2)) as pages.PagePowerMessageItem;
            message.rightTop = (await this.getElementUpdate(data.rightTop, 3)) as pages.PagePowerMessageItem;
            message.rightMiddle = (await this.getElementUpdate(data.rightMiddle, 4)) as pages.PagePowerMessageItem;
            message.rightBottom = (await this.getElementUpdate(data.rightBottom, 5)) as pages.PagePowerMessageItem;
        }
        this.sendToPanel(this.getMessage(message), false);
    }

    private async getElementSum(item: pages.cardPowerDataItems['data']['leftBottom'], num: number): Promise<number> {
        if (item === undefined) {
            return num;
        }
        const value = await getValueEntryNumber(item.value);
        return value !== null ? value + num : num;
    }

    private async getElementUpdate(
        item: pages.cardPowerDataItems['data']['leftBottom'],
        index: number,
    ): Promise<undefined | Partial<pages.PagePowerMessageItem>> {
        if (item === undefined) {
            return undefined;
        }

        const message: Partial<pages.PagePowerMessageItem> = {};

        const value = await getValueEntryNumber(item.value);
        if (value === null) {
            return undefined;
        }

        if (this.autoUnit[index] === undefined) {
            const unitEntry = await item.targetUnit?.getNumber();
            if (unitEntry != null) {
                this.autoUnit[index] = unitEntry;
            }
        }

        message.icon = (await getIconEntryValue(item.icon, value >= 0, '')) ?? undefined;
        message.iconColor = (await getIconEntryColor(item.icon, value, Color.White)) ?? undefined;
        message.name = (await getEntryTextOnOff(item.text, value >= 0)) ?? undefined;
        message.speed = (await getScaledNumber(item.speed)) ?? undefined;
        const {
            value: newValue,
            unit,
            endFactor,
        } = await getValueAutoUnit(item.value, null, 6, null, this.autoUnit[index]);
        this.autoUnit[index] = endFactor || 0;
        message.value = `${newValue}${unit ? ` ${unit}` : ''}`;
        this.log.debug(`getElementUpdate ${value} ${newValue} ${unit} ${endFactor}`);

        return message;
    }

    private getMessage(message: Partial<pages.PagePowerMessage>): string {
        let result: pages.PagePowerMessage = PagePowerMessageDefault;
        result = deepAssign(result, message) as pages.PagePowerMessage;
        return getPayload(
            getPayloadRemoveTilde('entityUpd', result.headline),
            result.navigation,
            getPayloadRemoveTilde(
                '',
                '',
                result.homeIcon,
                result.homeColor,
                result.homeName,
                result.homeValueBot,
                '',
                '',
                '',
                '',
                '',
                '',
                result.homeValueTop,
                '',
            ),
            getPayload(
                this.getMessageItem(result.leftTop),
                this.getMessageItem(result.leftMiddle),
                this.getMessageItem(result.leftBottom),
                this.getMessageItem(result.rightTop),
                this.getMessageItem(result.rightMiddle),
                this.getMessageItem(result.rightBottom),
            ),
        );
    }

    private getMessageItem(i: pages.PagePowerMessageItem | undefined): string {
        if (!i) {
            return getPayloadRemoveTilde('', '', '', '', '', '', '');
        }
        this.log.debug(`${i.icon} ${i.iconColor} ${i.name}  ${i.value} ${String(i.speed)}`);
        return getPayloadRemoveTilde(
            '',
            '',
            i.icon ?? '',
            i.iconColor ?? '',
            i.name ?? '',
            i.value ?? '',
            String(i.speed ?? ''),
        );
    }
    protected async onStateTrigger(): Promise<void> {
        await this.update();
    }
    protected onVisibilityChange(val: boolean): Promise<void> {
        if (val) {
            this.autoUnit = [];
        }
        return super.onVisibilityChange(val);
    }
    async onButtonEvent(_event: IncomingEvent): Promise<void> {
        //if (event.page && event.id && this.pageItems) {
        //    this.pageItems[event.id as any].setPopupAction(event.action, event.opt);
        //}
    }
}

/**
 * Map a 'W'|'kW'|'MW' selection to the internal targetUnit index used by PagePower.
 *
 * @param unit Display unit string from the React form
 */
function mapPowerTargetUnit(unit: string | undefined): number | undefined {
    switch (unit) {
        case 'kW':
            return 1;
        case 'MW':
            return 2;
        case 'W':
            return 0;
        default:
            return undefined;
    }
}

/**
 * Build the per-slot data block for cardPower from a PowerSlotConfig.
 * Mirrors the structure produced by PagePower.getPowerPageConfig() for one slot.
 *
 * The React editor only stores a scale bound once the user has typed into its field; a slot whose
 * bounds were never touched carries no minColorScale/maxColorScale/bestColorScale at all. The scale
 * is therefore built from the same defaults the classic jsonConfig accordion materialises (0 / 10000 / 0)
 * whenever useColorScale is set, instead of silently leaving the icon white.
 *
 * Exported for the unit test only.
 *
 * @param slot Per-slot configuration from the React PowerEntry
 */
export function buildPowerSlotData(slot: ShareConfig.PowerSlotConfig | undefined): any {
    const s = slot ?? {};
    const stateId = (s.state || '').trim();
    const useColorScale = !!s.useColorScale;
    const iconColor = useColorScale ? '' : s.iconColor || '';
    const unitSuffix = s.valueUnit ? ` ${s.valueUnit}` : '';

    const icon: any = {
        true: {
            value: { type: 'const', constVal: s.icon || '' },
            color: { type: 'const', constVal: iconColor },
        },
        false: undefined,
    };
    if (useColorScale) {
        icon.scale = {
            type: 'const',
            constVal: {
                val_min: s.minColorScale ?? 0,
                val_max: s.maxColorScale ?? 10_000,
                val_best: s.bestColorScale ?? 0,
                mode: 'triGrad',
            },
        };
    }

    const value = stateId
        ? {
              value: { type: 'triggered', dp: stateId },
              decimal: { type: 'const', constVal: s.valueDecimal ?? 0 },
              unit: { type: 'const', constVal: unitSuffix },
          }
        : undefined;

    const speed = stateId
        ? {
              value: { type: 'triggered', dp: stateId },
              minScale: { type: 'const', constVal: s.minSpeedScale ?? 0 },
              maxScale: { type: 'const', constVal: s.maxSpeedScale ?? 10_000 },
              negate: { type: 'const', constVal: !!s.reverse },
          }
        : undefined;

    const targetUnit = mapPowerTargetUnit(s.valueUnit);

    return {
        icon,
        value,
        speed,
        text: { true: { type: 'const', constVal: s.entityHeadline || '' } },
        targetUnit: targetUnit ? { type: 'const', constVal: targetUnit } : undefined,
    };
}

/**
 * Convert a PowerEntry from the React admin tab into a runtime page config for cardPower.
 *
 * Side effect: ensures `adapter.config.pagePowerdata` contains a flat-field record for this
 * page (under its page name). PagePower.update() and onInternalCommand read
 * `adapter.config.pagePowerdata[index]` at runtime for the internal-sum calculation, so the
 * synthetic record must be present and `index` must point at it. If a record with the same
 * pageName already exists (legacy jsonConfig source), it is replaced — the React tab takes
 * precedence by user request.
 *
 * @param entry    PowerEntry as built by the React admin editor
 * @param adapter  Adapter instance (for mutating `adapter.config.pagePowerdata`)
 * @param pageName name of the page at runtime - differs from uniqueName for a migrated entry that is
 *                 still shown by its script page (see {@link PagePower.getPowerPageConfigFromEntry})
 */
export function buildPowerPage(
    entry: ShareConfig.PowerEntry,
    adapter: any,
    pageName = entry.uniqueName,
): pages.PageBase {
    const cfg: any = adapter.config || {};
    if (!Array.isArray(cfg.pagePowerdata)) {
        cfg.pagePowerdata = [];
    }
    const slotMap: Array<[number, ShareConfig.PowerSlotConfig | undefined]> = [
        [1, entry.leftTop],
        [2, entry.leftMiddle],
        [3, entry.leftBottom],
        [4, entry.rightTop],
        [5, entry.rightMiddle],
        [6, entry.rightBottom],
    ];
    const synth: Record<string, unknown> = {
        pageName,
        headline: entry.headline || '',
        alwaysOnDisplay: entry.alwaysOn === 'always',
        hiddenByTrigger: !!entry.hidden,
        power7_state: entry.homeTop?.state || '',
        power7_valueDecimal: entry.homeTop?.valueDecimal ?? 0,
        power7_valueUnit: entry.homeTop?.valueUnit || 'W',
        power8_state: entry.homeBot?.state || '',
        power8_valueDecimal: entry.homeBot?.valueDecimal ?? 0,
        power8_valueUnit: entry.homeBot?.valueUnit || 'W',
        power8_selInternalCalculation: !!entry.homeBot?.selInternalCalculation,
        power8_selPowerSupply: Array.isArray(entry.homeBot?.selPowerSupply) ? entry.homeBot.selPowerSupply : [],
    };
    for (const [i, s] of slotMap) {
        const cur = s ?? {};
        synth[`power${i}_state`] = cur.state || '';
        synth[`power${i}_icon`] = cur.icon || '';
        synth[`power${i}_iconColor`] = cur.iconColor || '';
        synth[`power${i}_valueDecimal`] = cur.valueDecimal ?? 0;
        synth[`power${i}_valueUnit`] = cur.valueUnit || 'W';
        synth[`power${i}_entityHeadline`] = cur.entityHeadline || '';
        synth[`_power${i}_useColorScale`] = !!cur.useColorScale;
        synth[`power${i}_minColorScale`] = cur.minColorScale ?? 0;
        synth[`power${i}_maxColorScale`] = cur.maxColorScale ?? 10_000;
        synth[`power${i}_bestColorScale`] = cur.bestColorScale ?? 0;
        synth[`power${i}_minSpeedScale`] = cur.minSpeedScale ?? 0;
        synth[`power${i}_maxSpeedScale`] = cur.maxSpeedScale ?? 10_000;
        synth[`power${i}_reverse`] = !!cur.reverse;
    }

    // Replace existing record (jsonConfig or earlier React run) — React takes precedence.
    const existingIdx = cfg.pagePowerdata.findIndex((p: any) => p && typeof p === 'object' && p.pageName === pageName);
    let index: number;
    if (existingIdx >= 0) {
        cfg.pagePowerdata[existingIdx] = synth;
        index = existingIdx;
    } else {
        index = cfg.pagePowerdata.length;
        cfg.pagePowerdata.push(synth);
    }

    const homeBotInternal = !!entry.homeBot?.selInternalCalculation;
    const homeBotState = (entry.homeBot?.state || '').trim();
    const homeBotUnitSuffix = entry.homeBot?.valueUnit ? ` ${entry.homeBot.valueUnit}` : '';
    const homeValueBot: any = homeBotInternal
        ? {
              value: { type: 'internal', dp: `///${pageName}/powerSum` },
              decimal: { type: 'const', constVal: entry.homeBot?.valueDecimal ?? 0 },
              unit: { type: 'const', constVal: homeBotUnitSuffix },
          }
        : homeBotState
          ? {
                value: { type: 'triggered', dp: homeBotState },
                decimal: { type: 'const', constVal: entry.homeBot?.valueDecimal ?? 0 },
                unit: { type: 'const', constVal: homeBotUnitSuffix },
            }
          : undefined;

    const homeTopState = (entry.homeTop?.state || '').trim();
    const homeTopUnitSuffix = entry.homeTop?.valueUnit ? ` ${entry.homeTop.valueUnit}` : '';
    const homeValueTop = homeTopState
        ? {
              value: { type: 'triggered', dp: homeTopState },
              decimal: { type: 'const', constVal: entry.homeTop?.valueDecimal ?? 0 },
              unit: { type: 'const', constVal: homeTopUnitSuffix },
          }
        : undefined;

    return {
        uniqueID: pageName,
        hidden: !!entry.hidden,
        alwaysOn: entry.alwaysOn ?? 'none',
        dpInit: '',
        config: {
            card: 'cardPower',
            index,
            data: {
                headline: { type: 'const', constVal: entry.headline || entry.uniqueName },
                homeIcon: { true: { value: { type: 'const', constVal: 'home' } }, false: undefined },
                homeValueTop,
                homeValueBot,
                leftTop: buildPowerSlotData(entry.leftTop),
                leftMiddle: buildPowerSlotData(entry.leftMiddle),
                leftBottom: buildPowerSlotData(entry.leftBottom),
                rightTop: buildPowerSlotData(entry.rightTop),
                rightMiddle: buildPowerSlotData(entry.rightMiddle),
                rightBottom: buildPowerSlotData(entry.rightBottom),
            },
        },
        pageItems: [],
    } as unknown as pages.PageBase;
}
