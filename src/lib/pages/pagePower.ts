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
 *
 * The React editor only stores a scale bound once the user has typed into its field; a slot whose
 * bounds were never touched carries no minColorScale/maxColorScale/bestColorScale at all. The scale
 * is therefore built from the same defaults the classic jsonConfig accordion materialised (0 / 10000 / 0)
 * whenever useColorScale is set, instead of silently leaving the icon white.
 *
 * @param slot Per-slot configuration of a PowerEntry
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
 * Page of a cardPower entry of the page configuration.
 *
 * `internalCalculation` and `powerSupply` travel in the page config, the runtime reads them from
 * there (before the migration of the table "Page Power" they came out of `adapter.config.pagePowerdata`).
 *
 * @param entry power entry of the page configuration
 * @param pageName id the page gets - a script page keeps its own name, so the internal data point
 *   of the sum (`///<page>/powerSum`, registered in {@link PagePower.init}) matches a renamed entry too
 * @returns the page, ready for the panel
 */
export function buildPowerPageConfig(
    entry: ShareConfig.PowerEntry,
    pageName: string = entry.uniqueName,
): pages.PageBase {
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
            internalCalculation: homeBotInternal,
            powerSupply: Array.isArray(entry.homeBot?.selPowerSupply) ? entry.homeBot.selPowerSupply : [],
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

export class PagePower extends Page {
    //items: pages.PageBaseConfig['items'];
    items: pages.cardPowerDataItems | undefined;
    private autoUnit: (number | undefined)[] = [];
    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
        if (options.config && options.config.card == 'cardPower') {
            this.config = options.config;
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
            const cfg = this.config && this.config.card === 'cardPower' ? this.config : undefined;
            if (cfg && cfg.internalCalculation) {
                const negativValue = cfg.powerSupply; // Indexe (1-basiert), deren Werte negativ gezählt werden sollen
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
     * Page of a script page `cardPower` from its entry in the page configuration.
     *
     * The page keeps the script name as id, so prev/next in the script still match even if the
     * migration of the old table "Page Power" renamed the entry.
     *
     * @param configManager config manager (for the headline of the script page)
     * @param entry power entry of the page configuration
     * @param gridItem page built so far
     * @param page the script page
     * @returns the page, ready for the panel
     */
    static async getPowerPageConfigFromEntry(
        configManager: ConfigManager,
        entry: ShareConfig.PowerEntry,
        gridItem: pages.PageBase,
        page: ScriptConfig.PagePower,
    ): Promise<pages.PageBase> {
        const built = buildPowerPageConfig(entry, page.uniqueName);
        if (page.heading && built.config && built.config.card === 'cardPower') {
            built.config.data.headline = await configManager.getFieldAsDataItemConfig(page.heading);
        }
        return {
            ...gridItem,
            ...built,
            alwaysOn: page.alwaysOnDisplay ? 'always' : (entry.alwaysOn ?? 'none'),
            hidden: !!(page.hiddenByTrigger || entry.hidden),
        };
    }

    public async update(): Promise<void> {
        if (!this.visibility) {
            return;
        }
        await super.update();
        const message: Partial<pages.PagePowerMessage> = {};
        if (this.items) {
            const items = this.items;
            message.headline = this.library.getTranslation(
                (items.data.headline && (await items.data.headline.getString())) ?? '',
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
