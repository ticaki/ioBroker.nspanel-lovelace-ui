/**
 * Editor of the admin tab "Screensaver".
 *
 * The screensaver is drawn like the panel shows it in the chosen version (standard, alternate,
 * advanced, easyview - doc/Pictures/screensaver): the places of the item areas, the two status icons
 * (mrIcon), time and date. A click on a free place adds an item (ChannelConfigDialog like the page
 * editors), a click on an item edits it, items can be dragged between places; time, date, the status
 * icons and the gear open small dialogs. The panels showing this screensaver are chosen here - the
 * model of the first panel decides how many places an area has (ScreenSaverConst of the adapter).
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import ClearIcon from '@mui/icons-material/Clear';
import { EntitySelector } from './EntitySelector';
import ChannelConfigDialog from './ChannelConfigDialog';
import IconSelect from '../IconSelect';
import icons from '../icons.json';
import { getPageItemDefaultsByRole, getPageNaviItemDefaultsByRole } from '../../../src/lib/const/page-item-defaults';
import {
    type AdminPageItemConfig,
    type AdminPanelConfig,
    type ScreensaverArea,
    type ScreensaverEntry,
    type ScreensaverMode,
    type ScreensaverMrIconConfig,
    type ScreensaverPanelModel,
    normalizeChannelId,
    screensaverAreas,
    screensaverCardOfMode,
    screensaverMaxEntries,
    screensaverModes,
} from '../../../src/lib/types/adminShareConfig';

export interface ScreensaverEditorProps {
    entry: ScreensaverEntry;
    /** all entries of the table - a panel may be assigned to one screensaver only */
    entries: ScreensaverEntry[];
    panels: AdminPanelConfig[];
    /** global date settings of the instance, shown as the preview of "global setting" */
    globalFormats?: { weekdayFormat?: boolean; monthFormat?: number; yearFormat?: boolean };
    onEntryChange: (updated: ScreensaverEntry) => void;
    onNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    themeName?: any;
    alive: boolean;
    expertMode?: boolean;
    /** pages the adapter knows - navigation targets in the item dialog */
    pagesList?: string[];
}

type DialogKind = 'mricon1' | 'mricon2' | 'time' | 'date' | 'options';
type SlotRef = { area: ScreensaverArea; index: number };

/** a box of the mock in percent of the panel */
type Pct = { top: string; left: string; width: string; height: string };
/** an item area: places in a row, a column or a grid with `columns` per row */
type AreaBox = Pct & { direction: 'row' | 'column'; columns?: number };
type Layout = {
    /** width : height of the panel */
    aspect: string;
    maxWidth: number;
    time: Pct & { fontSize: number };
    date: Pct;
    separator?: { top: string; left: string; width: string };
    /** position of the two status icons, null = the version has no place for them */
    mricon: [Pct, Pct] | null;
    areas: Partial<Record<ScreensaverArea, AreaBox>>;
};

/** the two panel shapes: eu and us-l are landscape, us-p is portrait */
type LayoutModel = 'eu' | 'us-p';

/**
 * geometry of the four versions as the panel draws them - landscape from doc/Pictures/screensaver/*.png,
 * portrait (us-p) from photos of a US panel; the portrait `alternate` layout is derived from `standard`
 */
const LAYOUTS: Record<ScreensaverMode, Record<LayoutModel, Layout>> = {
    standard: {
        eu: {
            aspect: '3 / 2',
            maxWidth: 720,
            mricon: [
                { top: '3%', left: '2%', width: '11%', height: '15%' },
                { top: '3%', left: '87%', width: '11%', height: '15%' },
            ],
            time: { top: '12%', left: '18%', width: '64%', height: '40%', fontSize: 58 },
            date: { top: '54%', left: '8%', width: '84%', height: '12%' },
            separator: { top: '68%', left: '10%', width: '80%' },
            areas: {
                favorit: { top: '70%', left: '2%', width: '28%', height: '28%', direction: 'column' },
                bottom: { top: '70%', left: '31%', width: '67%', height: '28%', direction: 'row' },
            },
        },
        'us-p': {
            aspect: '2 / 3',
            maxWidth: 440,
            mricon: [
                { top: '48%', left: '1%', width: '10%', height: '7%' },
                { top: '48%', left: '89%', width: '10%', height: '7%' },
            ],
            time: { top: '2%', left: '5%', width: '90%', height: '24%', fontSize: 64 },
            date: { top: '40%', left: '10%', width: '80%', height: '7%' },
            separator: { top: '51%', left: '17%', width: '66%' },
            areas: {
                favorit: { top: '53%', left: '15%', width: '70%', height: '24%', direction: 'column' },
                bottom: { top: '79%', left: '2%', width: '96%', height: '19%', direction: 'row' },
            },
        },
    },
    alternate: {
        eu: {
            aspect: '3 / 2',
            maxWidth: 720,
            mricon: [
                { top: '3%', left: '2%', width: '11%', height: '15%' },
                { top: '3%', left: '87%', width: '11%', height: '15%' },
            ],
            time: { top: '12%', left: '18%', width: '64%', height: '40%', fontSize: 58 },
            date: { top: '54%', left: '8%', width: '84%', height: '12%' },
            separator: { top: '68%', left: '10%', width: '80%' },
            areas: {
                favorit: { top: '70%', left: '2%', width: '46%', height: '14%', direction: 'row' },
                alternate: { top: '85%', left: '2%', width: '46%', height: '13%', direction: 'row' },
                bottom: { top: '70%', left: '50%', width: '48%', height: '28%', direction: 'row' },
            },
        },
        'us-p': {
            aspect: '2 / 3',
            maxWidth: 440,
            mricon: [
                { top: '48%', left: '1%', width: '10%', height: '7%' },
                { top: '48%', left: '89%', width: '10%', height: '7%' },
            ],
            time: { top: '2%', left: '5%', width: '90%', height: '24%', fontSize: 64 },
            date: { top: '40%', left: '10%', width: '80%', height: '7%' },
            separator: { top: '51%', left: '17%', width: '66%' },
            areas: {
                favorit: { top: '53%', left: '15%', width: '70%', height: '12%', direction: 'row' },
                alternate: { top: '66%', left: '15%', width: '70%', height: '11%', direction: 'row' },
                bottom: { top: '79%', left: '2%', width: '96%', height: '19%', direction: 'row' },
            },
        },
    },
    advanced: {
        eu: {
            aspect: '3 / 2',
            maxWidth: 720,
            mricon: [
                { top: '85%', left: '22%', width: '22%', height: '13%' },
                { top: '85%', left: '56%', width: '22%', height: '13%' },
            ],
            time: { top: '2%', left: '60%', width: '38%', height: '22%', fontSize: 40 },
            date: { top: '24%', left: '52%', width: '46%', height: '10%' },
            areas: {
                favorit: { top: '2%', left: '2%', width: '34%', height: '22%', direction: 'row' },
                left: { top: '25%', left: '2%', width: '34%', height: '30%', direction: 'column' },
                indicator: { top: '36%', left: '37%', width: '61%', height: '19%', direction: 'row' },
                bottom: { top: '56%', left: '2%', width: '96%', height: '28%', direction: 'row' },
            },
        },
        'us-p': {
            aspect: '2 / 3',
            maxWidth: 440,
            mricon: [
                { top: '91%', left: '17%', width: '14%', height: '6%' },
                { top: '91%', left: '66%', width: '14%', height: '6%' },
            ],
            time: { top: '3%', left: '50%', width: '48%', height: '13%', fontSize: 54 },
            date: { top: '17%', left: '55%', width: '43%', height: '5%' },
            areas: {
                favorit: { top: '3%', left: '4%', width: '40%', height: '22%', direction: 'column' },
                left: { top: '32%', left: '4%', width: '70%', height: '20%', direction: 'column' },
                indicator: { top: '32%', left: '80%', width: '17%', height: '58%', direction: 'column' },
                bottom: { top: '54%', left: '4%', width: '74%', height: '35%', direction: 'row', columns: 3 },
            },
        },
    },
    easyview: {
        eu: {
            aspect: '3 / 2',
            maxWidth: 720,
            mricon: [
                { top: '3%', left: '2%', width: '11%', height: '15%' },
                { top: '3%', left: '87%', width: '11%', height: '15%' },
            ],
            time: { top: '4%', left: '10%', width: '80%', height: '42%', fontSize: 64 },
            date: { top: '46%', left: '5%', width: '90%', height: '12%' },
            separator: { top: '60%', left: '10%', width: '80%' },
            areas: {
                bottom: { top: '62%', left: '2%', width: '96%', height: '36%', direction: 'row' },
            },
        },
        'us-p': {
            aspect: '2 / 3',
            maxWidth: 440,
            mricon: [
                { top: '33%', left: '1%', width: '9%', height: '5%' },
                { top: '33%', left: '90%', width: '9%', height: '5%' },
            ],
            time: { top: '2%', left: '5%', width: '90%', height: '22%', fontSize: 72 },
            date: { top: '27%', left: '10%', width: '80%', height: '7%' },
            separator: { top: '36%', left: '6%', width: '88%' },
            areas: {
                bottom: { top: '38%', left: '4%', width: '92%', height: '60%', direction: 'row', columns: 2 },
            },
        },
    },
};

/**
 * layout of a version for a panel model - the US landscape panel draws like the eu one
 *
 * @param mode screensaver version
 * @param model panel model
 */
function layoutOf(mode: ScreensaverMode, model: ScreensaverPanelModel): Layout {
    return LAYOUTS[mode][model === 'us-p' ? 'us-p' : 'eu'];
}

let iconMap: Map<string, string> | null = null;

/**
 * base64 source of an icon of the icon list
 *
 * @param name icon name
 */
function iconSrc(name: string | undefined): string {
    if (!name) {
        return '';
    }
    if (!iconMap) {
        iconMap = new Map();
        for (const icon of icons as { name: string; base64: string }[]) {
            iconMap.set(icon.name, icon.base64);
        }
    }
    return iconMap.get(name) ?? '';
}

/**
 * any state (status icons, values)
 *
 * @param obj object from the browser
 */
function isState(obj: ioBroker.Object): boolean {
    return !!obj && obj.type === 'state';
}

/**
 * icon of an item on the mock: the configured one, else the default of its role (PageThermo2Editor)
 *
 * @param item stored item
 */
function itemIcon(item: AdminPageItemConfig): string {
    if (item.trueIcon) {
        return item.trueIcon;
    }
    const role = item.role ?? '';
    if (item.isNavigation) {
        const d = getPageNaviItemDefaultsByRole(role);
        if (d) {
            return d.iconOn;
        }
    }
    const d = getPageItemDefaultsByRole(role);
    return d ? d.iconOn : '';
}

/**
 * short label of an item for a place of the mock
 *
 * @param item stored item
 */
function itemLabel(item: AdminPageItemConfig): string {
    if (item.name) {
        return item.name;
    }
    const id = normalizeChannelId(item.channelId).valueStateId;
    return id ? id.split('.').pop() || id : '?';
}

const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;

interface ScreensaverEditorState {
    dialog: DialogKind | null;
    /** copy of the status icon while its dialog is open */
    draftIcon: ScreensaverMrIconConfig | null;
    /** copy of the entry fields while time/date/options dialog is open */
    draftEntry: Partial<ScreensaverEntry> | null;
    /** place the item dialog belongs to */
    editing: SlotRef | null;
    dragSource: SlotRef | null;
    dragOverKey: string | null;
}

export class ScreensaverEditor extends React.Component<ScreensaverEditorProps, ScreensaverEditorState> {
    private dialogRef = React.createRef<ChannelConfigDialog>();

    constructor(props: ScreensaverEditorProps) {
        super(props);
        this.state = {
            dialog: null,
            draftIcon: null,
            draftEntry: null,
            editing: null,
            dragSource: null,
            dragOverKey: null,
        };
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    // ---------- panels and model ----------

    /** configured panels with a topic */
    private panels(): AdminPanelConfig[] {
        return (this.props.panels ?? []).filter(p => !!p.topic);
    }

    private panelOf(topic: string): AdminPanelConfig | undefined {
        return this.panels().find(p => p.topic === topic);
    }

    private panelLabel(topic: string): string {
        const p = this.panelOf(topic);
        return p?.name || topic;
    }

    private modelOf(panel: AdminPanelConfig | undefined): ScreensaverPanelModel {
        const m = panel?.model;
        return m === 'us-p' || m === 'us-l' ? m : 'eu';
    }

    /** model the places are drawn for: the first assigned panel */
    private model(): ScreensaverPanelModel {
        const first = (this.props.entry.panels ?? []).map(t => this.panelOf(t)).find(p => !!p);
        return this.modelOf(first);
    }

    /** at least one assigned panel exists in the configuration - the mock is drawn only then */
    private hasPanel(): boolean {
        return (this.props.entry.panels ?? []).some(t => !!this.panelOf(t));
    }

    /** models of the assigned panels when they differ */
    private mixedModels(): string[] {
        const models = new Set((this.props.entry.panels ?? []).map(t => this.modelOf(this.panelOf(t))));
        return models.size > 1 ? [...models] : [];
    }

    /** topics of this entry that another entry uses as well, with the name of that entry */
    private duplicates(): { topic: string; other: string }[] {
        const out: { topic: string; other: string }[] = [];
        for (const topic of this.props.entry.panels ?? []) {
            const other = this.props.entries.find(
                e => e.name !== this.props.entry.name && (e.panels ?? []).includes(topic),
            );
            if (other) {
                out.push({ topic, other: other.name });
            }
        }
        return out;
    }

    // ---------- items ----------

    /** layout of the chosen version for the model of the first assigned panel */
    private layout(): Layout {
        return layoutOf(this.props.entry.mode, this.model());
    }

    private limit(area: ScreensaverArea): number {
        return screensaverMaxEntries(this.props.entry.mode, area, this.model());
    }

    private item(ref: SlotRef): AdminPageItemConfig | undefined {
        const { entry } = this.props;
        if (ref.area === 'favorit' || ref.area === 'alternate') {
            return ref.index === 0 ? (entry[ref.area] ?? undefined) : undefined;
        }
        return entry[ref.area]?.[ref.index] ?? undefined;
    }

    /**
     * entry with one place changed; trailing empty places are dropped (they carry no position)
     *
     * @param ref place
     * @param item new item, undefined = empty
     * @param base entry to start from
     */
    private withItem(
        ref: SlotRef,
        item: AdminPageItemConfig | undefined,
        base: ScreensaverEntry = this.props.entry,
    ): ScreensaverEntry {
        if (ref.area === 'favorit' || ref.area === 'alternate') {
            const out = { ...base };
            if (item) {
                out[ref.area] = item;
            } else {
                delete out[ref.area];
            }
            return out;
        }
        const list = [...(base[ref.area] ?? [])];
        while (list.length <= ref.index) {
            list.push(undefined);
        }
        list[ref.index] = item;
        while (list.length && !list[list.length - 1]) {
            list.pop();
        }
        return { ...base, [ref.area]: list };
    }

    /** items stored beyond the places of the chosen version and model, per area */
    private overflow(): { area: ScreensaverArea; count: number }[] {
        const { entry } = this.props;
        const out: { area: ScreensaverArea; count: number }[] = [];
        for (const area of screensaverAreas) {
            const limit = this.layout().areas[area] ? this.limit(area) : 0;
            let count = 0;
            if (area === 'favorit' || area === 'alternate') {
                count = entry[area] && limit === 0 ? 1 : 0;
            } else {
                count = (entry[area] ?? []).filter((it, i) => !!it && i >= limit).length;
            }
            if (count) {
                out.push({ area, count });
            }
        }
        return out;
    }

    private removeOverflow = (): void => {
        const { entry } = this.props;
        let out: ScreensaverEntry = { ...entry };
        for (const area of screensaverAreas) {
            const limit = this.layout().areas[area] ? this.limit(area) : 0;
            if (area === 'favorit' || area === 'alternate') {
                if (limit === 0) {
                    delete out[area];
                }
            } else {
                const list = (out[area] ?? []).slice(0, limit);
                while (list.length && !list[list.length - 1]) {
                    list.pop();
                }
                out = { ...out, [area]: list };
            }
        }
        this.props.onEntryChange(out);
    };

    private openItem(ref: SlotRef): void {
        const item = this.item(ref);
        this.setState({ editing: ref });
        this.dialogRef.current?.openWith(item, true);
    }

    private handleItemSave = (config: AdminPageItemConfig): void => {
        const { editing } = this.state;
        if (!editing) {
            return;
        }
        this.setState({ editing: null });
        this.props.onEntryChange(this.withItem(editing, config));
    };

    private deleteItem(ref: SlotRef): void {
        this.props.onEntryChange(this.withItem(ref, undefined));
    }

    // ---------- drag & drop ----------

    private slotKey(ref: SlotRef): string {
        return `${ref.area}:${ref.index}`;
    }

    private onDragStart(ref: SlotRef, e: React.DragEvent): void {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.slotKey(ref));
        this.setState({ dragSource: ref });
    }

    private onDragOver(ref: SlotRef, e: React.DragEvent): void {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const key = this.slotKey(ref);
        if (this.state.dragOverKey !== key) {
            this.setState({ dragOverKey: key });
        }
    }

    private onDragLeave = (): void => {
        this.setState({ dragOverKey: null });
    };

    private onDragEnd = (): void => {
        this.setState({ dragOverKey: null, dragSource: null });
    };

    /**
     * drop on a place: source and target change places (also across areas)
     *
     * @param target place dropped on
     * @param e event
     */
    private onDrop(target: SlotRef, e: React.DragEvent): void {
        e.preventDefault();
        const src = this.state.dragSource;
        this.onDragEnd();
        if (!src || this.slotKey(src) === this.slotKey(target)) {
            return;
        }
        const a = this.item(src);
        const b = this.item(target);
        let out = this.withItem(src, b);
        out = this.withItem(target, a, out);
        this.props.onEntryChange(out);
    }

    // ---------- dialogs ----------

    private openDialog(kind: DialogKind): void {
        const { entry } = this.props;
        if (kind === 'mricon1' || kind === 'mricon2') {
            const field = kind === 'mricon1' ? 'mrIcon1' : 'mrIcon2';
            this.setState({ dialog: kind, draftIcon: { ...(entry[field] ?? {}) }, draftEntry: null });
            return;
        }
        this.setState({
            dialog: kind,
            draftIcon: null,
            draftEntry: {
                clockFormat: entry.clockFormat,
                weekdayFormat: entry.weekdayFormat,
                monthFormat: entry.monthFormat,
                yearFormat: entry.yearFormat,
                rotationTime: entry.rotationTime,
                screensaverSwipe: entry.screensaverSwipe,
                screensaverIndicatorButtons: entry.screensaverIndicatorButtons,
            },
        });
    }

    private closeDialog = (): void => {
        this.setState({ dialog: null, draftIcon: null, draftEntry: null });
    };

    private applyDialog = (): void => {
        const { dialog, draftIcon, draftEntry } = this.state;
        const { entry } = this.props;
        if (!dialog) {
            return;
        }
        if (dialog === 'mricon1' || dialog === 'mricon2') {
            const field = dialog === 'mricon1' ? 'mrIcon1' : 'mrIcon2';
            const out = { ...entry };
            const icon = draftIcon ?? {};
            // an icon without state is not used - stored as absent
            if (icon.entity?.trim()) {
                out[field] = icon;
            } else {
                delete out[field];
            }
            this.props.onEntryChange(out);
        } else if (draftEntry) {
            const out: ScreensaverEntry = { ...entry, ...draftEntry };
            // undefined = global setting / adapter default: do not store the key
            for (const k of ['clockFormat', 'weekdayFormat', 'monthFormat', 'yearFormat'] as const) {
                if (out[k] === undefined) {
                    delete out[k];
                }
            }
            this.props.onEntryChange(out);
        }
        this.closeDialog();
    };

    private setIcon<K extends keyof ScreensaverMrIconConfig>(field: K, value: ScreensaverMrIconConfig[K]): void {
        if (!this.state.draftIcon) {
            return;
        }
        this.setState({ draftIcon: { ...this.state.draftIcon, [field]: value } });
    }

    private setEntryDraft<K extends keyof ScreensaverEntry>(field: K, value: ScreensaverEntry[K]): void {
        if (!this.state.draftEntry) {
            return;
        }
        this.setState({ draftEntry: { ...this.state.draftEntry, [field]: value } });
    }

    /**
     * Intl options the adapter builds for the date line (config-manager getScreensaverConfig),
     * entry fields first, global settings otherwise
     *
     * @param d entry fields (draft)
     */
    private dateOptions(d: Partial<ScreensaverEntry>): Intl.DateTimeFormatOptions {
        const g = this.props.globalFormats ?? {};
        const month = d.monthFormat ?? (g.monthFormat === 0 ? 'long' : g.monthFormat === 1 ? 'short' : '2-digit');
        return {
            weekday: d.weekdayFormat ?? (g.weekdayFormat ? 'long' : 'short'),
            month,
            year: d.yearFormat ?? (g.yearFormat ? 'numeric' : '2-digit'),
            day: 'numeric',
        };
    }

    private datePreview(d: Partial<ScreensaverEntry>): string {
        try {
            const lang = this.props.oContext?.socket?.systemLang ?? this.props.oContext?.systemLang ?? 'de';
            return new Date().toLocaleDateString(lang, this.dateOptions(d));
        } catch {
            return '';
        }
    }

    private timePreview(clock: ScreensaverEntry['clockFormat']): string {
        const now = new Date();
        const h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        if (clock === '12h') {
            return `${h % 12 || 12}:${m}`;
        }
        return `${String(h).padStart(2, '0')}:${m}`;
    }

    // ---------- dialog fields ----------

    private renderStateField(field: 'entity' | 'value', labelKey: string): React.JSX.Element {
        const { oContext, theme } = this.props;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        return (
            <Box sx={{ mb: 2 }}>
                <EntitySelector
                    label={this.getText(labelKey)}
                    value={this.state.draftIcon?.[field] ?? ''}
                    onChange={(v: string) => this.setIcon(field, v)}
                    socket={oContext.socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName={`selectScreensaverMrIcon_${field}`}
                    filterFunc={isState}
                />
            </Box>
        );
    }

    private renderIconField(field: 'iconOn' | 'iconOff', labelKey: string): React.JSX.Element {
        const { oContext, themeName } = this.props;
        const value = this.state.draftIcon?.[field] ?? '';
        return (
            <Box sx={{ mb: 2 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {this.getText(labelKey)}
                </Typography>
                <IconSelect
                    oContext={oContext}
                    alive={true}
                    changed={false}
                    themeName={themeName}
                    common={EMPTY_COMMON}
                    attr={field}
                    data={{ [field]: value }}
                    originalData={{ [field]: value }}
                    onError={() => {}}
                    schema={{ type: 'custom', name: 'IconSelect', url: '', label: this.getText(labelKey), i18n: false }}
                    custom
                    onChange={(attrOrData, val, cb): void => {
                        let icon = '';
                        if (typeof attrOrData === 'object') {
                            icon = (attrOrData as Record<string, string>)[field] ?? '';
                        } else if (typeof val === 'string') {
                            icon = val;
                        }
                        this.setIcon(field, icon);
                        if (cb) {
                            cb();
                        }
                    }}
                />
            </Box>
        );
    }

    private renderColorField(field: 'onColor' | 'offColor', labelKey: string, defaultColor: string): React.JSX.Element {
        const value = this.state.draftIcon?.[field];
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                <TextField
                    variant="standard"
                    type="color"
                    label={this.getText(labelKey)}
                    value={value || defaultColor}
                    onChange={e => this.setIcon(field, e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 160 }}
                />
                <Tooltip title={this.getText('screensaver_resetDefault')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={!value}
                            onClick={() => this.setIcon(field, undefined)}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {value ? value : this.getText('screensaver_defaultIs').replace('%s', defaultColor)}
                </Typography>
            </Box>
        );
    }

    private renderFormatSelect<K extends 'weekdayFormat' | 'monthFormat' | 'yearFormat'>(
        field: K,
        labelKey: string,
        options: { value: NonNullable<ScreensaverEntry[K]>; key: string }[],
    ): React.JSX.Element {
        const value = this.state.draftEntry?.[field] ?? '';
        return (
            <FormControl
                variant="standard"
                sx={{ minWidth: 200, mr: 2, mb: 2 }}
            >
                <InputLabel>{this.getText(labelKey)}</InputLabel>
                <Select
                    value={value}
                    displayEmpty
                    onChange={e => {
                        const v = String(e.target.value);
                        this.setEntryDraft(field, (v === '' ? undefined : v) as ScreensaverEntry[K]);
                    }}
                >
                    <MenuItem value="">{this.getText('screensaver_date_global')}</MenuItem>
                    {options.map(o => (
                        <MenuItem
                            key={String(o.value)}
                            value={String(o.value)}
                        >
                            {this.getText(o.key)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    private renderDialog(): React.JSX.Element | null {
        const { dialog, draftIcon, draftEntry } = this.state;
        if (!dialog) {
            return null;
        }
        const titles: Record<DialogKind, string> = {
            mricon1: this.getText('screensaver_mricon').replace('%s', '1'),
            mricon2: this.getText('screensaver_mricon').replace('%s', '2'),
            time: this.getText('screensaver_time'),
            date: this.getText('screensaver_date'),
            options: this.getText('screensaver_options'),
        };
        let content: React.JSX.Element | null = null;
        if ((dialog === 'mricon1' || dialog === 'mricon2') && draftIcon) {
            content = (
                <Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                    >
                        {this.getText('screensaver_mricon_dialogHint')}
                    </Typography>
                    {this.renderStateField('entity', 'screensaver_mricon_entity')}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            {this.renderIconField('iconOn', 'screensaver_mricon_iconOn')}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            {this.renderIconField('iconOff', 'screensaver_mricon_iconOff')}
                        </Box>
                    </Box>
                    {this.renderColorField('onColor', 'screensaver_mricon_onColor', '#ffffff')}
                    {this.renderColorField('offColor', 'screensaver_mricon_offColor', '#888888')}
                    {this.renderStateField('value', 'screensaver_mricon_value')}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            variant="standard"
                            type="number"
                            label={this.getText('screensaver_mricon_decimals')}
                            value={draftIcon.valueDecimals ?? ''}
                            onChange={e => {
                                const n = parseInt(e.target.value, 10);
                                this.setIcon('valueDecimals', Number.isFinite(n) ? n : undefined);
                            }}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, max: 5 } }}
                            sx={{ width: 140 }}
                        />
                        <TextField
                            variant="standard"
                            type="text"
                            autoComplete="off"
                            label={this.getText('screensaver_mricon_unit')}
                            value={draftIcon.valueUnit ?? ''}
                            onChange={e => this.setIcon('valueUnit', e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ width: 140 }}
                        />
                    </Box>
                </Box>
            );
        } else if (dialog === 'time' && draftEntry) {
            const clock = draftEntry.clockFormat ?? '';
            content = (
                <Box>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">{this.getText('screensaver_clock')}</FormLabel>
                        <RadioGroup
                            value={clock}
                            onChange={e =>
                                this.setEntryDraft(
                                    'clockFormat',
                                    (e.target.value || undefined) as ScreensaverEntry['clockFormat'],
                                )
                            }
                        >
                            <FormControlLabel
                                value=""
                                control={<Radio />}
                                label={this.getText('screensaver_clock_default')}
                            />
                            <FormControlLabel
                                value="24h"
                                control={<Radio />}
                                label={this.getText('screensaver_clock_24h')}
                            />
                            <FormControlLabel
                                value="12h"
                                control={<Radio />}
                                label={this.getText('screensaver_clock_12h')}
                            />
                        </RadioGroup>
                    </FormControl>
                    <Typography
                        variant="body2"
                        sx={{ mt: 2 }}
                    >
                        {this.getText('screensaver_preview')}: <b>{this.timePreview(draftEntry.clockFormat)}</b>
                    </Typography>
                </Box>
            );
        } else if (dialog === 'date' && draftEntry) {
            content = (
                <Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                    >
                        {this.getText('screensaver_date_dialogHint')}
                    </Typography>
                    {this.renderFormatSelect('weekdayFormat', 'screensaver_weekday', [
                        { value: 'short', key: 'screensaver_format_short' },
                        { value: 'long', key: 'screensaver_format_long' },
                    ])}
                    {this.renderFormatSelect('monthFormat', 'screensaver_month', [
                        { value: '2-digit', key: 'screensaver_format_2digit' },
                        { value: 'short', key: 'screensaver_format_short' },
                        { value: 'long', key: 'screensaver_format_long' },
                    ])}
                    {this.renderFormatSelect('yearFormat', 'screensaver_year', [
                        { value: '2-digit', key: 'screensaver_format_2digit' },
                        { value: 'numeric', key: 'screensaver_format_numeric' },
                    ])}
                    <Typography variant="body2">
                        {this.getText('screensaver_preview')}: <b>{this.datePreview(draftEntry)}</b>
                    </Typography>
                </Box>
            );
        } else if (dialog === 'options' && draftEntry) {
            content = (
                <Box>
                    <TextField
                        variant="standard"
                        type="number"
                        label={this.getText('screensaver_rotationTime')}
                        value={draftEntry.rotationTime ?? 0}
                        onChange={e => {
                            const n = parseInt(e.target.value, 10);
                            this.setEntryDraft('rotationTime', Number.isFinite(n) && n >= 0 ? n : 0);
                        }}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0 } }}
                        sx={{ width: 260, mb: 2 }}
                        helperText={this.getText('screensaver_rotationTime_hint')}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!draftEntry.screensaverSwipe}
                                onChange={e => this.setEntryDraft('screensaverSwipe', e.target.checked)}
                            />
                        }
                        label={this.getText('screensaver_swipe')}
                        sx={{ display: 'flex' }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!draftEntry.screensaverIndicatorButtons}
                                onChange={e => this.setEntryDraft('screensaverIndicatorButtons', e.target.checked)}
                            />
                        }
                        label={this.getText('screensaver_indicatorButtons')}
                        sx={{ display: 'flex' }}
                    />
                </Box>
            );
        }
        return (
            <Dialog
                open
                onClose={this.closeDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{titles[dialog]}</DialogTitle>
                <DialogContent dividers>{content}</DialogContent>
                <DialogActions>
                    <Button onClick={this.closeDialog}>{this.getText('Cancel1')}</Button>
                    <Button
                        variant="contained"
                        onClick={this.applyDialog}
                    >
                        {this.getText('screensaver_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // ---------- the panel ----------

    /**
     * a clickable area of the mock
     *
     * @param key react key
     * @param sx position and look
     * @param tooltipKey i18n key of the tooltip
     * @param kind dialog to open
     * @param children content
     */
    private renderArea(
        key: string,
        sx: Record<string, unknown>,
        tooltipKey: string,
        kind: DialogKind,
        children: React.ReactNode,
    ): React.JSX.Element {
        const enabled = this.props.alive;
        return (
            <Tooltip
                key={key}
                title={enabled ? this.getText(tooltipKey) : ''}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        borderRadius: 1,
                        cursor: enabled ? 'pointer' : 'default',
                        border: '1px dashed transparent',
                        '&:hover': enabled
                            ? { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.06)' }
                            : {},
                        ...sx,
                    }}
                    onClick={enabled ? () => this.openDialog(kind) : undefined}
                    data-ss={key}
                >
                    {children}
                </Box>
            </Tooltip>
        );
    }

    /**
     * one place of an area: an item (drag, click = edit, hover = remove) or a free place (click = add)
     *
     * @param ref place
     * @param big favorit place: larger icon
     */
    private renderSlot(ref: SlotRef, big: boolean): React.JSX.Element {
        const { alive } = this.props;
        const { dragOverKey, dragSource } = this.state;
        const key = this.slotKey(ref);
        const item = this.item(ref);
        const over = dragOverKey === key;
        const base = {
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.25,
            borderRadius: 1,
            fontSize: 11,
            color: '#ddd',
            position: 'relative' as const,
            boxSizing: 'border-box' as const,
            overflow: 'hidden',
        };
        if (!item) {
            return (
                <Tooltip
                    key={key}
                    title={alive ? this.getText('screensaver_slot_free') : ''}
                >
                    <Box
                        sx={{
                            ...base,
                            cursor: alive ? 'pointer' : 'default',
                            opacity: over ? 1 : 0.6,
                            border: over ? '2px dashed #4da3ff' : '1px dashed rgba(255,255,255,0.3)',
                            backgroundColor: over ? 'rgba(77,163,255,0.15)' : undefined,
                            transition: 'border-color 0.15s, background-color 0.15s',
                            '&:hover': alive ? { borderColor: '#fff', opacity: 1 } : {},
                        }}
                        onClick={alive ? () => this.openItem(ref) : undefined}
                        onDragOver={alive ? e => this.onDragOver(ref, e) : undefined}
                        onDragLeave={this.onDragLeave}
                        onDrop={alive ? e => this.onDrop(ref, e) : undefined}
                        data-ss={key}
                    >
                        <AddIcon sx={{ fontSize: big ? 26 : 18, color: '#888' }} />
                    </Box>
                </Tooltip>
            );
        }
        const icon = itemIcon(item);
        const src = iconSrc(icon);
        const label = itemLabel(item);
        const dragging = !!dragSource && this.slotKey(dragSource) === key;
        return (
            <Tooltip
                key={key}
                title={this.getText('screensaver_slot_item').replace('%s', label)}
            >
                <Box
                    sx={{
                        ...base,
                        border: '2px solid',
                        borderColor: item.trueColor || '#8ab4f8',
                        outline: over ? '2px solid #4da3ff' : 'none',
                        opacity: dragging ? 0.4 : 1,
                        cursor: alive ? (dragging ? 'grabbing' : 'grab') : 'default',
                        transition: 'opacity 0.15s, outline 0.1s',
                        '&:hover .ss-actions': { display: 'flex' },
                    }}
                    onClick={alive ? () => this.openItem(ref) : undefined}
                    draggable={alive}
                    onDragStart={alive ? e => this.onDragStart(ref, e) : undefined}
                    onDragEnd={this.onDragEnd}
                    onDragOver={alive ? e => this.onDragOver(ref, e) : undefined}
                    onDragLeave={this.onDragLeave}
                    onDrop={alive ? e => this.onDrop(ref, e) : undefined}
                    data-ss={key}
                >
                    {src ? (
                        <img
                            src={src}
                            alt={icon}
                            style={{ width: big ? 34 : 22, height: big ? 34 : 22, filter: 'invert(1)' }}
                        />
                    ) : (
                        <Typography sx={{ fontSize: 10, color: '#bbb' }}>{icon || '·'}</Typography>
                    )}
                    <Box
                        sx={{
                            px: 0.5,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {label}
                    </Box>
                    <Box
                        className="ss-actions"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            display: 'none',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            borderRadius: 1,
                        }}
                    >
                        <Tooltip title={this.getText('screensaver_slot_delete')}>
                            <IconButton
                                size="small"
                                sx={{ color: '#f66', p: 0.25 }}
                                onClick={e => {
                                    e.stopPropagation();
                                    this.deleteItem(ref);
                                }}
                            >
                                <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Tooltip>
        );
    }

    /**
     * an item area with its places
     *
     * @param area area
     * @param box position and direction
     */
    private renderAreaSlots(area: ScreensaverArea, box: AreaBox): React.JSX.Element | null {
        const count = this.limit(area);
        if (count <= 0) {
            return null;
        }
        const slots: React.JSX.Element[] = [];
        for (let i = 0; i < count; i++) {
            slots.push(this.renderSlot({ area, index: i }, area === 'favorit'));
        }
        return (
            <Tooltip
                key={area}
                title={this.getText(`screensaver_area_${area}`)}
                placement="top"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: box.top,
                        left: box.left,
                        width: box.width,
                        height: box.height,
                        display: box.columns ? 'grid' : 'flex',
                        gridTemplateColumns: box.columns ? `repeat(${box.columns}, 1fr)` : undefined,
                        gridAutoRows: box.columns ? '1fr' : undefined,
                        flexDirection: box.direction,
                        gap: 0.5,
                        p: 0.5,
                        boxSizing: 'border-box',
                        borderRadius: 1,
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    {slots}
                </Box>
            </Tooltip>
        );
    }

    private renderMrIcon(which: 'mrIcon1' | 'mrIcon2', pos: Pct): React.JSX.Element {
        const icon = this.props.entry[which];
        const src = iconSrc(icon?.iconOn);
        const used = !!icon?.entity;
        return this.renderArea(
            which,
            { ...pos, color: used ? icon?.onColor || '#fff' : '#555' },
            'screensaver_mricon_hint',
            which === 'mrIcon1' ? 'mricon1' : 'mricon2',
            src ? (
                <img
                    src={src}
                    alt=""
                    style={{ width: 22, height: 22, filter: 'invert(1)', opacity: used ? 1 : 0.4 }}
                />
            ) : (
                <Typography sx={{ fontSize: 11, color: used ? '#ddd' : '#666' }}>
                    {used
                        ? icon?.iconOn || '·'
                        : this.getText('screensaver_mricon_short').replace('%s', which === 'mrIcon1' ? '1' : '2')}
                </Typography>
            ),
        );
    }

    private renderPanel(): React.JSX.Element {
        const { entry } = this.props;
        const layout = this.layout();
        return (
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: layout.maxWidth,
                    aspectRatio: layout.aspect,
                    backgroundColor: '#000',
                    borderRadius: 2,
                    border: '6px solid #222',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    fontFamily: 'Roboto, sans-serif',
                }}
            >
                {layout.mricon && this.renderMrIcon('mrIcon1', layout.mricon[0])}
                {layout.mricon && this.renderMrIcon('mrIcon2', layout.mricon[1])}
                {this.renderArea(
                    'time',
                    { ...layout.time, color: '#fff', fontSize: layout.time.fontSize, fontWeight: 500 },
                    'screensaver_time_hint',
                    'time',
                    <span>{this.timePreview(entry.clockFormat)}</span>,
                )}
                {this.renderArea(
                    'date',
                    { ...layout.date, color: '#fff', fontSize: 16 },
                    'screensaver_date_hint',
                    'date',
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {this.datePreview(entry)}
                    </span>,
                )}
                {layout.separator && (
                    <Box
                        sx={{
                            position: 'absolute',
                            ...layout.separator,
                            height: '2px',
                            backgroundColor: '#ccc',
                        }}
                    />
                )}
                {screensaverAreas.map(area => {
                    const box = layout.areas[area];
                    return box ? this.renderAreaSlots(area, box) : null;
                })}
                {/* gear → options */}
                <Tooltip title={this.props.alive ? this.getText('screensaver_options_hint') : ''}>
                    <IconButton
                        size="small"
                        disabled={!this.props.alive}
                        onClick={() => this.openDialog('options')}
                        sx={{ position: 'absolute', right: '1%', bottom: '1%', color: '#777', zIndex: 1 }}
                        data-ss="options"
                    >
                        <SettingsIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    // ---------- header ----------

    private renderHeader(): React.JSX.Element {
        const { entry, entries, alive } = this.props;
        const panels = this.panels();
        const selected = entry.panels ?? [];
        const nameTaken = entries.some(e => e !== entry && e.name === entry.name);
        const mixed = this.mixedModels();
        const duplicates = this.duplicates();
        return (
            <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 1 }}>
                    <TextField
                        variant="standard"
                        type="text"
                        autoComplete="off"
                        label={this.getText('screensaver_name')}
                        value={entry.name}
                        onChange={e => {
                            const v = e.target.value;
                            if (v.trim()) {
                                this.props.onNameChange(entry.name, v);
                            }
                        }}
                        disabled={!alive}
                        error={nameTaken}
                        helperText={nameTaken ? this.getText('screensaver_name_exists') : undefined}
                        sx={{ minWidth: 220, flex: 1 }}
                        slotProps={{ input: { sx: { fontWeight: 600 } } }}
                    />
                    <FormControl
                        variant="standard"
                        sx={{ minWidth: 200 }}
                        disabled={!alive}
                    >
                        <InputLabel>{this.getText('screensaver_mode')}</InputLabel>
                        <Select
                            data-ss="mode"
                            value={entry.mode}
                            onChange={e => {
                                const mode = e.target.value;
                                this.props.onEntryChange({ ...entry, mode });
                            }}
                        >
                            {screensaverModes.map(m => (
                                <MenuItem
                                    key={m}
                                    value={m}
                                >
                                    {this.getText(`screensaver_mode_${m}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl
                        variant="standard"
                        sx={{ minWidth: 260, flex: 1 }}
                        disabled={!alive}
                    >
                        <InputLabel>{this.getText('screensaver_panels')}</InputLabel>
                        <Select
                            data-ss="panels"
                            multiple
                            value={selected}
                            onChange={e => {
                                const v = e.target.value;
                                const list = (typeof v === 'string' ? v.split(',') : v).filter(t => !!t);
                                this.props.onEntryChange({ ...entry, panels: list });
                            }}
                            renderValue={(topics: string[]) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {topics.map(t => (
                                        <Chip
                                            key={t}
                                            size="small"
                                            label={this.panelLabel(t)}
                                            color={this.panelOf(t) ? 'default' : 'warning'}
                                        />
                                    ))}
                                </Box>
                            )}
                        >
                            {panels.map(p => (
                                <MenuItem
                                    key={p.topic}
                                    value={p.topic}
                                >
                                    <Checkbox
                                        size="small"
                                        checked={selected.includes(p.topic!)}
                                    />
                                    <Tooltip
                                        title={this.getText('screensaver_panel_tooltip')
                                            .replace('%s', p.topic ?? '')
                                            .replace('%s', p.ip ?? '-')
                                            .replace('%s', this.modelOf(p))}
                                        placement="right"
                                    >
                                        <ListItemText primary={p.name || p.topic} />
                                    </Tooltip>
                                </MenuItem>
                            ))}
                            {panels.length === 0 && (
                                <MenuItem disabled>{this.getText('screensaver_no_panels')}</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                >
                    {this.getText('screensaver_panels_hint')}
                    {' · '}
                    {this.getText('screensaver_card_is').replace('%s', screensaverCardOfMode(entry.mode))}
                    {' · '}
                    {this.hasPanel()
                        ? this.getText('screensaver_model_is').replace('%s', this.model())
                        : this.getText('screensaver_model_pending')}
                </Typography>
                {selected.length === 0 && (
                    <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_panels_none')}
                    </Alert>
                )}
                {mixed.length > 0 && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_panels_mixed')
                            .replace('%s', mixed.join(', '))
                            .replace('%s', this.model())}
                    </Alert>
                )}
                {duplicates.map(d => (
                    <Alert
                        key={d.topic}
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_panels_duplicate')
                            .replace('%s', this.panelLabel(d.topic))
                            .replace('%s', d.other)}
                    </Alert>
                ))}
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme, alive } = this.props;
        const hasPanel = this.hasPanel();
        const overflow = hasPanel ? this.overflow() : [];
        return (
            <Box>
                {this.renderHeader()}
                {overflow.length > 0 && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1.5 }}
                        action={
                            <Button
                                size="small"
                                color="inherit"
                                disabled={!alive}
                                onClick={this.removeOverflow}
                            >
                                {this.getText('screensaver_overflow_remove')}
                            </Button>
                        }
                    >
                        {this.getText('screensaver_overflow')
                            .replace('%s', String(overflow.reduce((n, o) => n + o.count, 0)))
                            .replace(
                                '%s',
                                overflow
                                    .map(o => `${this.getText(`screensaver_area_${o.area}`)} (${o.count})`)
                                    .join(', '),
                            )}
                    </Alert>
                )}
                {hasPanel && this.renderPanel()}
                {hasPanel && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                    >
                        {this.getText('screensaver_panelHint')}
                    </Typography>
                )}
                <Alert
                    severity="info"
                    sx={{ mt: 1.5 }}
                >
                    {this.getText('screensaver_phase1')}
                </Alert>

                {this.renderDialog()}

                {/* ChannelConfigDialog - without trigger button, opened through the ref */}
                <ChannelConfigDialog
                    ref={this.dialogRef}
                    socket={oContext?.socket}
                    theme={theme}
                    themeType={oContext?.themeType}
                    oContext={oContext}
                    expertMode={this.props.expertMode ?? false}
                    pagesList={this.props.pagesList ?? []}
                    currentPageName={entry.name}
                    currentPageCard={screensaverCardOfMode(entry.mode)}
                    hideTriggerButton
                    onSave={this.handleItemSave}
                />
            </Box>
        );
    }
}
