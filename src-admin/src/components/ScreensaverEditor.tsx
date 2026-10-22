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
    Badge,
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
    FormGroup,
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import ClearIcon from '@mui/icons-material/Clear';
import { EntitySelector } from './EntitySelector';
import { ScreensaverItemDialog } from './ScreensaverItemDialog';
import ScreensaverNotifyListDialog from './ScreensaverNotifyListDialog';
import IconSelect from '../IconSelect';
import icons from '../icons.json';
import {
    type ScreensaverItemConfig,
    type ScreensaverTemplateInfo,
    type AdminPanelConfig,
    type ScreensaverArea,
    type ScreensaverEntry,
    type ScreensaverMode,
    type ScreensaverMrIconConfig,
    type ScreensaverNotifyConfig,
    type ScreensaverPanelModel,
    type ScreensaverWeatherItemKey,
    screensaverAreas,
    screensaverCardOfMode,
    screensaverMaxEntries,
    screensaverModes,
    screensaverNotifyOfEntry,
    screensaverWeatherAdapterOf,
    screensaverWeatherItemsOfAdapter,
    screensaverWeatherItemsOn,
} from '../../../src/lib/types/adminShareConfig';

/** select value for "weather instance of the global settings" (entry.weatherEntity undefined) */
const WEATHER_GLOBAL = '__global__';
/** icons of the weather placeholders in the mock */
const WEATHER_ICONS: Record<string, string> = {
    favorit: 'weather-partly-cloudy',
    sunriseSet: 'weather-sunset',
    forecastDay: 'weather-cloudy',
    windSpeed: 'weather-windy',
    windGust: 'weather-windy-variant',
    windDirection: 'compass',
    uvIndex: 'white-balance-sunny',
    solar: 'solar-power',
};
const WEATHER_COLOR = '#8ab4f8';
/** frame of an indicator by what its key does - grey = no key (no action or the option is off) */
const INDICATOR_COLORS: Record<'none' | 'button' | 'switch' | 'navigate', string> = {
    none: '#888',
    button: '#e53935',
    switch: '#43a047',
    navigate: '#1e88e5',
};

export interface ScreensaverEditorProps {
    entry: ScreensaverEntry;
    /** all entries of the table - a panel may be assigned to one screensaver only */
    entries: ScreensaverEntry[];
    panels: AdminPanelConfig[];
    /** global date settings of the instance, shown as the preview of "global setting" */
    globalFormats?: { weekdayFormat?: boolean; monthFormat?: number; yearFormat?: boolean };
    onEntryChange: (updated: ScreensaverEntry) => void;
    /** notifications shared by all screensavers, the entry uses some of them by id */
    notifyList: ScreensaverNotifyConfig[];
    /** the notification dialog was applied: the entry with its notification ids and the edited shared list */
    onNotifyChange: (updated: ScreensaverEntry, notifyList: ScreensaverNotifyConfig[]) => void;
    onNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    themeName?: any;
    alive: boolean;
    expertMode?: boolean;
    /** pages the adapter knows - navigation targets in the item dialog */
    pagesList?: string[];
    /** installed instances of the supported weather adapters, undefined while unknown (adapter offline) */
    weatherEntities?: { value: string; label: string }[];
    /** native.weatherEntity of the instance - applies while the entry has no own value */
    globalWeatherEntity?: string;
    /** page item templates the adapter knows (item dialog), undefined while unknown (adapter offline) */
    templates?: ScreensaverTemplateInfo[];
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
 * icon of an item on the mock: the "on" icon, else the first icon of the icon list
 *
 * @param item stored item
 */
function itemIcon(item: ScreensaverItemConfig): string {
    return item.iconOn || item.iconSelect?.[0]?.icon || '';
}

/**
 * short label of an item for a place of the mock: headline, else the last part of the state id
 *
 * @param item stored item
 */
function itemLabel(item: ScreensaverItemConfig): string {
    if (item.headline) {
        return item.headline;
    }
    if (item.state) {
        return item.state.split('.').pop() || item.state;
    }
    // a template without an object (clock, wlan): the last part of the template name
    return item.template ? item.template.split('.').pop() || item.template : '?';
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
    /** scroll state of the bottom area while weather items make it scroll (own scroll bar, see renderScrollBar) */
    bottomScroll: { pos: number; size: number; client: number } | null;
}

export class ScreensaverEditor extends React.Component<ScreensaverEditorProps, ScreensaverEditorState> {
    constructor(props: ScreensaverEditorProps) {
        super(props);
        this.state = {
            dialog: null,
            draftIcon: null,
            draftEntry: null,
            editing: null,
            dragSource: null,
            dragOverKey: null,
            bottomScroll: null,
        };
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.syncBottomScroll);
        this.syncBottomScroll();
    }

    componentDidUpdate(): void {
        this.syncBottomScroll();
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.syncBottomScroll);
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private notifyRef = React.createRef<ScreensaverNotifyListDialog>();

    // ---------- own scroll bar of the bottom area ----------

    /** the scrolling bottom area (only rendered while weather items are appended) */
    private bottomRef = React.createRef<HTMLDivElement>();

    /** reads the scroll state of the bottom area into the state - once per change only */
    private syncBottomScroll = (): void => {
        const el = this.bottomRef.current;
        const cur = this.state.bottomScroll;
        if (!el) {
            if (cur) {
                this.setState({ bottomScroll: null });
            }
            return;
        }
        const vertical = el.dataset.axis === 'y';
        const info = vertical
            ? { pos: el.scrollTop, size: el.scrollHeight, client: el.clientHeight }
            : { pos: el.scrollLeft, size: el.scrollWidth, client: el.clientWidth };
        if (!cur || cur.pos !== info.pos || cur.size !== info.size || cur.client !== info.client) {
            this.setState({ bottomScroll: info });
        }
    };

    private scrollBottomTo(pos: number, relative = false): void {
        const el = this.bottomRef.current;
        if (!el) {
            return;
        }
        if (el.dataset.axis === 'y') {
            el.scrollTop = relative ? el.scrollTop + pos : pos;
        } else {
            el.scrollLeft = relative ? el.scrollLeft + pos : pos;
        }
    }

    /**
     * Scroll bar drawn by the editor: Safari and Firefox on macOS show overlay scroll bars only while
     * scrolling, so the native bar is hidden and this one is always visible. Click on the track jumps,
     * the thumb drags.
     *
     * @param vertical the area scrolls vertically (portrait layouts with grid columns)
     */
    private renderScrollBar(vertical: boolean): React.JSX.Element {
        const info = this.state.bottomScroll;
        const thickness = 8;
        const base = {
            position: 'relative' as const,
            flexShrink: 0,
            borderRadius: thickness / 2,
            ...(vertical ? { width: thickness, alignSelf: 'stretch' } : { height: thickness }),
        };
        if (!info || info.size <= info.client + 1) {
            return <Box sx={base} />;
        }
        const frac = Math.max(info.client / info.size, 0.08);
        const start = Math.min(info.pos / info.size, 1 - frac);
        const onTrack = (e: React.MouseEvent<HTMLDivElement>): void => {
            const r = e.currentTarget.getBoundingClientRect();
            const rel = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
            this.scrollBottomTo(rel * info.size - info.client / 2);
        };
        const onThumb = (e: React.MouseEvent<HTMLDivElement>): void => {
            e.stopPropagation();
            e.preventDefault();
            const track = e.currentTarget.parentElement;
            const trackLen = track ? (vertical ? track.clientHeight : track.clientWidth) : 1;
            let last = vertical ? e.clientY : e.clientX;
            const move = (ev: MouseEvent): void => {
                const now = vertical ? ev.clientY : ev.clientX;
                this.scrollBottomTo(((now - last) * info.size) / trackLen, true);
                last = now;
            };
            const up = (): void => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        };
        return (
            <Box
                sx={{ ...base, backgroundColor: 'rgba(255,255,255,0.18)', cursor: 'pointer' }}
                onMouseDown={onTrack}
                data-ss="bottom-scrollbar"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        borderRadius: thickness / 2,
                        backgroundColor: '#bbb',
                        cursor: 'grab',
                        '&:hover': { backgroundColor: '#eee' },
                        ...(vertical
                            ? { top: `${start * 100}%`, height: `${frac * 100}%`, left: 0, right: 0 }
                            : { left: `${start * 100}%`, width: `${frac * 100}%`, top: 0, bottom: 0 }),
                    }}
                    onMouseDown={onThumb}
                    data-ss="bottom-scrollbar-thumb"
                />
            </Box>
        );
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

    private item(ref: SlotRef): ScreensaverItemConfig | undefined {
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
        item: ScreensaverItemConfig | undefined,
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
        this.setState({ editing: ref });
    }

    private handleItemSave = (config: ScreensaverItemConfig): void => {
        const { editing } = this.state;
        if (!editing) {
            return;
        }
        this.setState({ editing: null });
        this.props.onEntryChange(this.withItem(editing, config));
    };

    private deleteItem(ref: SlotRef): void {
        if (this.state.editing && this.slotKey(this.state.editing) === this.slotKey(ref)) {
            this.setState({ editing: null });
        }
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
                <InputLabel shrink>{this.getText(labelKey)}</InputLabel>
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
     * icon and text side by side (the panel draws the left rows, the alternate line and a favorit in a
     * wide line that way), otherwise the icon above the text
     *
     * @param area area of the place
     * @param box area box of the layout
     */
    private inlineSlot(area: ScreensaverArea, box: AreaBox): boolean {
        return area === 'left' || area === 'alternate' || (area === 'favorit' && box.direction === 'row');
    }

    /**
     * one place of an area: an item (drag, click = edit, hover = remove) or a free place (click = add)
     *
     * @param ref place
     * @param big favorit place: larger icon
     * @param inline icon and text side by side
     * @param fixed flex basis while the area scrolls (weather items appended)
     */
    private renderSlot(ref: SlotRef, big: boolean, inline: boolean, fixed?: string): React.JSX.Element {
        const { alive } = this.props;
        const { dragOverKey, dragSource } = this.state;
        const key = this.slotKey(ref);
        const item = this.item(ref);
        const over = dragOverKey === key;
        const weatherHere = ref.area === 'favorit' && ref.index === 0 && this.weatherFavorit();
        const base = {
            flex: fixed ? `0 0 ${fixed}` : 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: inline ? ('row' as const) : ('column' as const),
            alignItems: 'center',
            justifyContent: inline ? 'flex-start' : 'center',
            gap: inline ? 1 : 0.25,
            px: inline ? 1 : 0,
            borderRadius: 1,
            fontSize: inline ? 13 : 11,
            color: '#ddd',
            position: 'relative' as const,
            boxSizing: 'border-box' as const,
            overflow: 'hidden',
        };
        if (!item) {
            return (
                <Tooltip
                    key={key}
                    title={
                        alive
                            ? this.getText(weatherHere ? 'screensaver_weather_favorit_hint' : 'screensaver_slot_free')
                            : ''
                    }
                >
                    <Box
                        sx={{
                            ...base,
                            cursor: alive ? 'pointer' : 'default',
                            opacity: over || weatherHere ? 1 : 0.6,
                            border: over
                                ? '2px dashed #4da3ff'
                                : weatherHere
                                  ? '1px solid rgba(138,180,248,0.45)'
                                  : '1px dashed rgba(255,255,255,0.3)',
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
                        {weatherHere ? (
                            <>
                                {ScreensaverItemDialog.coloredIcon(
                                    iconSrc(WEATHER_ICONS.favorit),
                                    big ? 34 : 22,
                                    WEATHER_COLOR,
                                )}
                                <Box sx={{ fontSize: 11, color: '#bbb' }}>{this.getText('screensaver_weather')}</Box>
                            </>
                        ) : (
                            <AddIcon sx={{ fontSize: big ? 26 : 18, color: '#888' }} />
                        )}
                    </Box>
                </Tooltip>
            );
        }
        const icon = itemIcon(item);
        const src = iconSrc(icon);
        const label = itemLabel(item);
        const dragging = !!dragSource && this.slotKey(dragSource) === key;
        // indicators: the frame tells what the key does
        const action =
            ref.area === 'indicator'
                ? this.props.entry.screensaverIndicatorButtons && item.action?.kind
                    ? item.action.kind
                    : 'none'
                : undefined;
        const title = action
            ? `${this.getText('screensaver_slot_item').replace('%s', label)} · ${this.getText(`screensaver_item_action_${action}`)}`
            : this.getText('screensaver_slot_item').replace('%s', label);
        return (
            <Tooltip
                key={key}
                title={title}
            >
                <Box
                    sx={{
                        ...base,
                        border: '2px solid',
                        borderColor: action ? INDICATOR_COLORS[action] : item.colorOn || '#8ab4f8',
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
                        ScreensaverItemDialog.coloredIcon(src, big ? 34 : 22, item.colorOn || '#ffffff')
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
        // weather items are appended behind the places (getScreensaverConfig): the places keep their
        // size and the area scrolls - like the panel pages through them
        const weather = area === 'bottom' ? this.weatherKeys() : [];
        const rows = box.columns ? Math.ceil(count / box.columns) : 1;
        const fixed = weather.length && !box.columns ? `calc((100% - ${(count - 1) * 4}px) / ${count})` : undefined;
        const slots: React.JSX.Element[] = [];
        const place = (i: number): React.JSX.Element =>
            this.renderSlot({ area, index: i }, area === 'favorit', this.inlineSlot(area, box), fixed);
        // the weather items follow the last own item (the adapter appends them to the list of items),
        // the free places come after them
        const split = weather.length ? this.lastOwnBottom() : count;
        for (let i = 0; i < split; i++) {
            slots.push(place(i));
        }
        for (const key of weather) {
            slots.push(this.renderWeatherSlot(key, fixed));
        }
        for (let i = split; i < count; i++) {
            slots.push(place(i));
        }
        const inner = {
            display: box.columns ? 'grid' : 'flex',
            gridTemplateColumns: box.columns ? `repeat(${box.columns}, 1fr)` : undefined,
            gridAutoRows: box.columns
                ? weather.length
                    ? `calc((100% - ${(rows - 1) * 4}px) / ${rows})`
                    : '1fr'
                : undefined,
            flexDirection: box.direction,
            gap: 0.5,
            p: 0.5,
            boxSizing: 'border-box' as const,
            borderRadius: 1,
            border: '1px solid rgba(255,255,255,0.08)',
        };
        const outer = {
            position: 'absolute' as const,
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
        };
        if (!weather.length) {
            return (
                <Tooltip
                    key={area}
                    title={this.getText(`screensaver_area_${area}`)}
                    placement="top"
                >
                    <Box
                        sx={{ ...outer, ...inner }}
                        data-ss={`area-${area}`}
                    >
                        {slots}
                    </Box>
                </Tooltip>
            );
        }
        // the area scrolls (native bar hidden, own one drawn next to it - renderScrollBar)
        const vertical = !!box.columns;
        return (
            <Tooltip
                key={area}
                title={this.getText(`screensaver_area_${area}`)}
                placement="top"
            >
                <Box
                    sx={{
                        ...outer,
                        display: 'flex',
                        flexDirection: vertical ? 'row' : 'column',
                        gap: 0.25,
                        boxSizing: 'border-box',
                    }}
                    data-ss={`area-${area}-scroll`}
                >
                    <Box
                        ref={this.bottomRef}
                        data-axis={vertical ? 'y' : 'x'}
                        onScroll={this.syncBottomScroll}
                        sx={{
                            ...inner,
                            flex: 1,
                            minWidth: 0,
                            minHeight: 0,
                            overflowX: vertical ? 'hidden' : 'auto',
                            overflowY: vertical ? 'auto' : 'hidden',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' },
                        }}
                        data-ss={`area-${area}`}
                    >
                        {slots}
                    </Box>
                    {this.renderScrollBar(vertical)}
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

    // ---------- weather ----------

    /** weather instance that applies: the entry's own value, else the global setting; '' = none */
    private weatherEntity(): string {
        const { entry, globalWeatherEntity } = this.props;
        return entry.weatherEntity === undefined ? (globalWeatherEntity ?? '') : entry.weatherEntity;
    }

    /** weather items the adapter appends to the bottom area, in its order */
    private weatherKeys(): ScreensaverWeatherItemKey[] {
        return screensaverWeatherItemsOn(this.props.entry.weatherAddDefaultItems, this.weatherEntity());
    }

    /** number of bottom places up to and including the last own item (within the places of the version) */
    private lastOwnBottom(): number {
        const limit = this.limit('bottom');
        return (this.props.entry.bottom ?? []).reduce((n, it, i) => (it && i < limit ? i + 1 : n), 0);
    }

    /** own items of the bottom area within the places of the version */
    private ownBottom(): number {
        const limit = this.limit('bottom');
        return (this.props.entry.bottom ?? []).filter((it, i) => !!it && i < limit).length;
    }

    /** the favorit place shows the current weather: adapter known and no own item */
    private weatherFavorit(): boolean {
        return !!screensaverWeatherAdapterOf(this.weatherEntity()) && !this.props.entry.favorit;
    }

    private weatherLabel(key: ScreensaverWeatherItemKey, short = false): string {
        const day = /^forecastDay(\d)$/.exec(key);
        const prefix = short ? 'screensaver_weather_short_' : 'screensaver_weather_';
        return day ? this.getText(`${prefix}forecastDay`).replace('%s', day[1]) : this.getText(`${prefix}${key}`);
    }

    private setWeatherEntity(value: string): void {
        const out = { ...this.props.entry };
        if (value === WEATHER_GLOBAL) {
            delete out.weatherEntity;
        } else {
            out.weatherEntity = value;
        }
        this.props.onEntryChange(out);
    }

    private toggleWeatherItem(key: ScreensaverWeatherItemKey, on: boolean): void {
        const out = { ...this.props.entry };
        const items = { ...(out.weatherAddDefaultItems ?? {}) };
        if (on) {
            items[key] = true;
        } else {
            delete items[key];
        }
        if (Object.keys(items).length) {
            out.weatherAddDefaultItems = items;
        } else {
            delete out.weatherAddDefaultItems;
        }
        this.props.onEntryChange(out);
    }

    /** the weather settings next to the panel: instance and the extra items of the bottom area */
    private renderWeatherBox(): React.JSX.Element {
        const { entry, alive, weatherEntities, globalWeatherEntity = '' } = this.props;
        const own = entry.weatherEntity;
        const value = own === undefined ? WEATHER_GLOBAL : own;
        const effective = this.weatherEntity();
        const adapter = screensaverWeatherAdapterOf(effective);
        const installed = weatherEntities ?? [];
        const missing = own && !installed.some(e => e.value === own) ? own : '';
        const chosen = entry.weatherAddDefaultItems ?? {};
        return (
            <Box
                sx={{ flex: '1 1 260px', minWidth: 240, maxWidth: 380 }}
                data-ss="weather"
            >
                <Typography
                    variant="subtitle1"
                    sx={{ mb: 1 }}
                >
                    {this.getText('screensaver_weather')}
                </Typography>
                <FormControl
                    variant="standard"
                    fullWidth
                    disabled={!alive}
                >
                    <InputLabel shrink>{this.getText('screensaver_weather_entity')}</InputLabel>
                    <Select
                        value={value}
                        displayEmpty
                        onChange={e => this.setWeatherEntity(String(e.target.value))}
                        data-ss="weather-entity"
                    >
                        <MenuItem value={WEATHER_GLOBAL}>
                            {this.getText('screensaver_weather_global').replace(
                                '%s',
                                globalWeatherEntity || this.getText('screensaver_weather_global_none'),
                            )}
                        </MenuItem>
                        <MenuItem value="">{this.getText('screensaver_weather_none')}</MenuItem>
                        {installed.map(e => (
                            <MenuItem
                                key={e.value}
                                value={e.value}
                            >
                                {e.label}
                            </MenuItem>
                        ))}
                        {missing && <MenuItem value={missing}>{missing}</MenuItem>}
                    </Select>
                </FormControl>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                >
                    {this.getText('screensaver_weather_hint')}
                </Typography>
                {weatherEntities && installed.length === 0 && (
                    <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_weather_noInstances')}
                    </Alert>
                )}
                {weatherEntities && missing && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_weather_missing').replace('%s', missing)}
                    </Alert>
                )}
                {effective && !adapter && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {this.getText('screensaver_weather_unsupported').replace('%s', effective.split('.')[0])}
                    </Alert>
                )}
                {adapter && (
                    <FormControl
                        component="fieldset"
                        sx={{ mt: 1.5 }}
                        disabled={!alive}
                    >
                        <FormLabel
                            component="legend"
                            sx={{ fontSize: 13 }}
                        >
                            {this.getText('screensaver_weather_items')}
                        </FormLabel>
                        <FormGroup>
                            {screensaverWeatherItemsOfAdapter[adapter].map(key => (
                                <FormControlLabel
                                    key={key}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={chosen[key] === true}
                                            onChange={e => this.toggleWeatherItem(key, e.target.checked)}
                                        />
                                    }
                                    label={this.weatherLabel(key)}
                                    sx={{ my: -0.5 }}
                                    data-ss={`weather-${key}`}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>
                )}
            </Box>
        );
    }

    /**
     * a weather item of the bottom area as the adapter appends it - not editable here
     *
     * @param key item
     * @param fixed flex basis while the area scrolls
     */
    private renderWeatherSlot(key: ScreensaverWeatherItemKey, fixed?: string): React.JSX.Element {
        const src = iconSrc(WEATHER_ICONS[key.startsWith('forecastDay') ? 'forecastDay' : key]);
        return (
            <Tooltip
                key={`weather-${key}`}
                title={`${this.getText('screensaver_weather')}: ${this.weatherLabel(key)}`}
            >
                <Box
                    sx={{
                        flex: fixed ? `0 0 ${fixed}` : 1,
                        minWidth: 0,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.25,
                        borderRadius: 1,
                        fontSize: 11,
                        color: '#bbb',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        border: '1px solid rgba(138,180,248,0.45)',
                        backgroundColor: 'rgba(138,180,248,0.08)',
                        cursor: 'default',
                    }}
                    data-ss={`weather-slot-${key}`}
                >
                    {src ? ScreensaverItemDialog.coloredIcon(src, 22, WEATHER_COLOR) : null}
                    <Box
                        sx={{
                            px: 0.5,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {this.weatherLabel(key, true)}
                    </Box>
                </Box>
            </Tooltip>
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
                {/* bell → notifications */}
                <Tooltip title={this.props.alive ? this.getText('screensaver_notify_hint') : ''}>
                    <IconButton
                        size="small"
                        disabled={!this.props.alive}
                        onClick={() => this.notifyRef.current?.openWith(this.props.notifyList, entry.notify)}
                        sx={{
                            position: 'absolute',
                            right: 'calc(1% + 46px)',
                            bottom: '1%',
                            color: '#fff',
                            zIndex: 1,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                        }}
                        data-ss="notify"
                    >
                        <Badge
                            badgeContent={screensaverNotifyOfEntry(entry, this.props.notifyList).length}
                            color="primary"
                        >
                            <NotificationsIcon sx={{ fontSize: 26 }} />
                        </Badge>
                    </IconButton>
                </Tooltip>
                {/* gear → options */}
                <Tooltip title={this.props.alive ? this.getText('screensaver_options_hint') : ''}>
                    <IconButton
                        size="small"
                        disabled={!this.props.alive}
                        onClick={() => this.openDialog('options')}
                        sx={{
                            position: 'absolute',
                            right: '1%',
                            bottom: '1%',
                            color: '#fff',
                            zIndex: 1,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                        }}
                        data-ss="options"
                    >
                        <SettingsIcon sx={{ fontSize: 26 }} />
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
        const { oContext, theme, alive } = this.props;
        const { editing } = this.state;
        const hasPanel = this.hasPanel();
        const overflow = hasPanel ? this.overflow() : [];
        const weatherBottom = hasPanel && this.layout().areas.bottom ? this.weatherKeys().length : 0;
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
                {hasPanel && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                        <Box sx={{ flex: '1 1 420px', minWidth: 0, maxWidth: this.layout().maxWidth }}>
                            {this.renderPanel()}
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1 }}
                            >
                                {this.getText('screensaver_panelHint')}
                            </Typography>
                            {this.layout().areas.indicator && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mt: 0.5 }}
                                >
                                    {this.getText('screensaver_indicator_legend')}
                                </Typography>
                            )}
                            {weatherBottom > 0 && this.ownBottom() + weatherBottom > this.limit('bottom') && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mt: 0.5 }}
                                >
                                    {this.getText('screensaver_weather_scrollHint')
                                        .replace('%s', String(this.ownBottom() + weatherBottom))
                                        .replace('%s', String(this.limit('bottom')))}
                                </Typography>
                            )}
                        </Box>
                        {this.renderWeatherBox()}
                    </Box>
                )}
                <Alert
                    severity="info"
                    sx={{ mt: 1.5 }}
                >
                    {this.getText('screensaver_adapterNote')}
                </Alert>

                {this.renderDialog()}

                <ScreensaverNotifyListDialog
                    ref={this.notifyRef}
                    getText={key => this.getText(key)}
                    oContext={oContext}
                    theme={theme}
                    themeName={this.props.themeName}
                    entry={this.props.entry}
                    entries={this.props.entries}
                    onSave={(list, ids) => {
                        const out: ScreensaverEntry = { ...this.props.entry };
                        if (ids.length) {
                            out.notify = ids;
                        } else {
                            delete out.notify;
                        }
                        this.props.onNotifyChange(out, list);
                    }}
                />

                <ScreensaverItemDialog
                    open={!!editing}
                    area={editing?.area ?? 'bottom'}
                    index={editing?.index ?? 0}
                    count={editing ? this.limit(editing.area) : 0}
                    inline={
                        !!editing &&
                        this.inlineSlot(
                            editing.area,
                            this.layout().areas[editing.area] ?? {
                                direction: 'column',
                                top: '0',
                                left: '0',
                                width: '0',
                                height: '0',
                            },
                        )
                    }
                    item={editing ? this.item(editing) : undefined}
                    onClose={() => this.setState({ editing: null })}
                    onSave={this.handleItemSave}
                    onDelete={() => editing && this.deleteItem(editing)}
                    getText={key => this.getText(key)}
                    oContext={oContext}
                    theme={theme}
                    themeName={this.props.themeName}
                    expertMode={this.props.expertMode ?? false}
                    pagesList={this.props.pagesList ?? []}
                    templates={this.props.templates}
                />
            </Box>
        );
    }
}
