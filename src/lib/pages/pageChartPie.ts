import { type PageInterface } from '../classes/PageInterface';
import { getStringFromStringOrTranslated } from '../const/tools';
import type { Dataitem } from '../controller/data-item';
import {
    isPChartRangeKey,
    PCHART_MAX_SLICES,
    PCHART_SOURCE_SCRIPT,
    pchartDefaults,
    resolveRange,
    type PChartDetailsExternal,
    type PChartEntry,
} from '../types/adminShareConfig';
import type * as pages from '../types/pages';
import { PageChart } from './pageChart';
import {
    finishPieSlices,
    formatPieValueText,
    mergePieRest,
    parsePieScriptString,
    pieColorToDec,
    pieLegendMode,
    pieSlicesToPayload,
    type PieSliceInput,
} from './pie-scale';

/** translation key of the summary slice (admin/i18n/<lang>/translations.json) */
export const PCHART_OTHER_KEY = 'pchart_other';

/** the page reloads the averages this often while it is visible (no state triggers in that mode) */
const PIE_DB_REFRESH_INTERVAL = 5 * 60_000;

/**
 * Page config of a pie chart page from a PageConfig entry.
 * - slot source: the configured slots with a state become `slices`; with a range (`rangeKey` other than
 *   `current`) the query travels as JSON in the const item `dbData` and the value items are plain `state`
 *   items (read on refresh, no trigger), without a range they are `triggered` and every change redraws the pie;
 * - script source: only `value`, the state with the finished panel text.
 *
 * @param entry pie chart entry as stored by the PageConfig editor
 */
export function buildPChartPageConfig(entry: PChartEntry): pages.cardChartPieDataItemOptions {
    const d = pchartDefaults;
    const scriptSource = entry.selInstanceDataSource === PCHART_SOURCE_SCRIPT;
    const rangeKey = isPChartRangeKey(entry.rangeKey) ? entry.rangeKey : 'current';
    let dbData: PChartDetailsExternal | undefined;
    if (!scriptSource && rangeKey !== 'current') {
        dbData = { instance: entry.selInstance || '', rangeKey };
        if (rangeKey === 'custom') {
            dbData.hours = entry.rangeHours && entry.rangeHours > 0 ? entry.rangeHours : 1;
        }
    }
    let slices: pages.cardChartPieDataItemOptions['data']['slices'];
    if (!scriptSource) {
        slices = [];
        (entry.slots ?? []).forEach((slot, index) => {
            if (!slot || !slot.state || slices!.length >= PCHART_MAX_SLICES) {
                return;
            }
            slices!.push({
                name: slot.name ? { type: 'const', constVal: slot.name } : undefined,
                value: dbData ? { type: 'state', dp: slot.state } : { type: 'triggered', dp: slot.state },
                unit: slot.unit ? { type: 'const', constVal: slot.unit } : undefined,
                color: { type: 'const', constVal: slot.color || d.slotColors[index % d.slotColors.length] },
            });
        });
    }
    return {
        card: 'cardPChart',
        data: {
            headline: { type: 'const', constVal: entry.headline || 'Page PChart' },
            legendMode: { type: 'const', constVal: pieLegendMode(entry.legendMode ?? d.legendMode) },
            decimals: { type: 'const', constVal: entry.decimals ?? d.decimals },
            value: scriptSource ? { type: 'triggered', dp: entry.setStateForValues || '' } : undefined,
            slices,
            dbData: dbData ? { type: 'const', constVal: JSON.stringify(dbData) } : undefined,
        },
    };
}

/**
 * Pie chart (cardPChart). Field 15 carries the legend mode, field 16 stays empty, from field 17 on every
 * slice takes `Name~Number~Value text~Color` (see pie-scale.ts for the contract of the panel).
 *
 * The slices come from getPieSlices(): the slot states (current value or average over a range read via
 * getHistory) or the script data point. A later source only has to extend that method.
 */
export class PageChartPie extends PageChart {
    pieItems: Partial<pages.cardChartPieDataItems> | undefined;
    /** set when the slot values are averaged over a range */
    protected pieDetails?: PChartDetailsExternal;
    /** true = the page reads the finished text of the script data point */
    protected scriptSource = false;
    /** name and unit of the slot states (`common.name` / `common.unit`), read once per state */
    private sliceMeta: Map<string, { name: string; unit: string }> = new Map();
    /** states (or the instance) a warning was logged for - logged once until a value arrives again */
    private warned: Set<string> = new Set();

    constructor(config: PageInterface, options: pages.PageBase) {
        super(config, options);
    }

    async init(): Promise<void> {
        const config = structuredClone(this.config);
        this.scriptSource = !!(config && config.card === 'cardPChart' && config.data.value);
        const tempItem: Partial<pages.cardChartPieDataItems> | undefined =
            await this.basePanel.statesControler.createDataItems(config, this);
        if (tempItem) {
            tempItem.card = 'cardPChart';
            this.log.debug(`init Card: ${this.card}`);
        }
        this.pieItems = tempItem;
        const dbData = this.pieItems?.data?.dbData;
        if (dbData) {
            const details = await dbData.getObject();
            if (isPChartDetailsExternal(details)) {
                this.pieDetails = details;
                this.refreshInterval = PIE_DB_REFRESH_INTERVAL;
            }
        }
        await super.init();
    }

    protected async getUpdateMessage(): Promise<Partial<pages.PageChartMessage>> {
        const message: Partial<pages.PageChartMessage> = {
            navigation: this.getNavigation(),
            headline: this.name,
            // field 14 is not read by the panel for this card
            color: '',
            text: String(pieLegendMode(pchartDefaults.legendMode)),
            ticks: [],
            value: '',
        };
        const data = this.pieItems?.data;
        if (!data) {
            return message;
        }
        message.headline = (data.headline && (await data.headline.getTranslatedString())) ?? this.name;
        const legendMode = pieLegendMode((data.legendMode && (await data.legendMode.getNumber())) ?? null);
        message.text = String(legendMode);
        message.value = pieSlicesToPayload(finishPieSlices(await this.getPieSlices(), legendMode));
        return message;
    }

    /**
     * The slices in legend order with their unscaled numbers. Script source: the parsed text of the
     * data point, more than six entries are summed up as "Other". Slot source: one slice per configured
     * state, current value or average over the range; a slot without a value shows 0.
     */
    async getPieSlices(): Promise<PieSliceInput[]> {
        const data = this.pieItems?.data;
        if (!data) {
            return [];
        }
        const otherName = this.library.getTranslation(PCHART_OTHER_KEY);
        if (this.scriptSource) {
            const text = data.value ? await data.value.getString() : null;
            return parsePieScriptString(text, otherName);
        }
        const decimals = (data.decimals && (await data.decimals.getNumber())) ?? pchartDefaults.decimals;
        const dbAlive = this.pieDetails ? await this.isDbAlive(this.pieDetails.instance) : false;
        const result: PieSliceInput[] = [];
        for (const slice of data.slices ?? []) {
            if (!slice || !slice.value) {
                continue;
            }
            const meta = await this.getSliceMeta(slice.value);
            const name = (slice.name && (await slice.name.getTranslatedString())) || meta.name;
            const unit = (slice.unit && (await slice.unit.getString())) ?? meta.unit;
            const color = (slice.color && (await slice.color.getRGBDec())) ?? pieColorToDec(undefined);
            const value = this.pieDetails
                ? await this.getSliceAverage(slice.value, this.pieDetails, dbAlive)
                : ((await slice.value.getNumber()) ?? 0);
            result.push({ name, value, text: formatPieValueText(value, decimals, unit), color });
        }
        return mergePieRest(result, otherName);
    }

    /**
     * Average of a slot state over the configured range via getHistory: the window comes from
     * resolveRange (rolling ranges end now, calendar ranges have a fixed start and end). Without a usable
     * value (instance not alive, no rows, timeout) the slice shows 0 and a warning is logged once for that state.
     *
     * @param item value item of the slice (its dp is queried)
     * @param details DB instance and range
     * @param dbAlive result of the alive check of this refresh
     */
    protected async getSliceAverage(item: Dataitem, details: PChartDetailsExternal, dbAlive: boolean): Promise<number> {
        const dp = dpOf(item);
        if (!dp || !dbAlive) {
            return 0;
        }
        try {
            const { start, end } = resolveRange(details.rangeKey, Date.now(), details.hours);
            const rows = await this.getDataFromDBWindow(dp, start, end, details.instance, {
                aggregate: 'average',
                count: 1,
                removeBorderValues: true,
                round: 6,
            });
            const values = (rows ?? [])
                .map(row => (row && typeof row === 'object' && 'val' in row ? Number(row.val) : NaN))
                .filter(v => Number.isFinite(v));
            if (values.length > 0) {
                this.warned.delete(dp);
                return values.reduce((a, b) => a + b, 0) / values.length;
            }
            this.warnOnce(dp, `PageChartPie: ${this.name} - no history value for ${dp} in ${details.instance}`);
        } catch (error) {
            this.warnOnce(dp, `PageChartPie: ${this.name} - history of ${dp} failed: ${String(error)}`);
        }
        return 0;
    }

    /**
     * True if the DB instance runs; logs once if not (the slots then show 0 instead of an error page).
     *
     * @param instance `influxdb.0` or `system.adapter.influxdb.0`
     */
    private async isDbAlive(instance: string): Promise<boolean> {
        if (!instance) {
            this.warnOnce('instance', `PageChartPie: ${this.name} - a range is set but no DB instance`);
            return false;
        }
        const instanceId = instance.startsWith('system.adapter.') ? instance : `system.adapter.${instance}`;
        const alive = await this.adapter.getForeignStateAsync(`${instanceId}.alive`);
        if (!alive || !alive.val) {
            this.warnOnce('instance', `PageChartPie: ${this.name} - DB instance ${instance} is not alive`);
            return false;
        }
        this.warned.delete('instance');
        return true;
    }

    private warnOnce(key: string, text: string): void {
        if (this.warned.has(key)) {
            return;
        }
        this.warned.add(key);
        this.log.warn(text);
    }

    /**
     * `common.name` (in the adapter language, translated) and `common.unit` of the state behind a value item.
     *
     * @param item value item of the slice
     */
    private async getSliceMeta(item: Dataitem): Promise<{ name: string; unit: string }> {
        const dp = dpOf(item);
        const cached = this.sliceMeta.get(dp);
        if (cached) {
            return cached;
        }
        const meta = { name: '', unit: '' };
        if (dp) {
            const obj = await this.adapter.getForeignObjectAsync(dp);
            if (obj && obj.common) {
                const name = obj.common.name ? getStringFromStringOrTranslated(this.adapter, obj.common.name) : '';
                meta.name = name ? this.library.getTranslation(name) : '';
                meta.unit = typeof obj.common.unit === 'string' ? obj.common.unit : '';
            }
            this.sliceMeta.set(dp, meta);
        }
        return meta;
    }
}

/**
 * State id behind a data item, '' for a const item.
 *
 * @param item data item
 */
function dpOf(item: Dataitem): string {
    return 'dp' in item.options && typeof item.options.dp === 'string' ? item.options.dp : '';
}

export function isPChartDetailsExternal(obj: unknown): obj is PChartDetailsExternal {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    const o = obj as Record<string, unknown>;
    return (
        typeof o.instance === 'string' &&
        isPChartRangeKey(o.rangeKey) &&
        o.rangeKey !== 'current' &&
        (o.hours === undefined || typeof o.hours === 'number')
    );
}
