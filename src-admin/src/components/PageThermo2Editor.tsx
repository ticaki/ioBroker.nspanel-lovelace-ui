/**
 * Editor for thermostat pages (cardThermo2) in the PageConfig tab.
 *
 * The page is drawn like the panel shows it: headline, the ring with the three value lines and the
 * mode text, nine slots around it (four left, four right, one between - and +). Every area opens a
 * dialog with the settings of that area
 * (ConfigGeneric pattern of PageChartEditor: alive-gated fields, main-page lock). The slots are
 * filled the way the adapter does it at runtime (pageThermo2.ts): selector icons of the circuits
 * when there is more than one, then the buttons the adapter generates from the alias states, then
 * the configured items of the circuit, nine per page in the stored sort order.
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import LockIcon from '@mui/icons-material/Lock';
import ClearIcon from '@mui/icons-material/Clear';
import { I18n } from '@iobroker/gui-components';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { EntitySelector } from './EntitySelector';
import ChannelConfigDialog from './ChannelConfigDialog';
import IconSelect from '../IconSelect';
import icons from '../icons.json';
import { getPageItemDefaultsByRole, getPageNaviItemDefaultsByRole } from '../../../src/lib/const/page-item-defaults';
import {
    type Thermo2Entry,
    type Thermo2CircuitConfig,
    type Thermo2SortOrder,
    type AdminPageItemConfig,
    ADAPTER_NAME,
    thermo2MaxCircuits,
    thermo2Defaults,
    thermo2SortOrders,
    emptyThermo2Circuit,
    isMainPageEntry,
    normalizeChannelId,
    requiredScriptDataPoints,
} from '../../../src/lib/types/adminShareConfig';

export interface PageThermo2EditorProps {
    entry: Thermo2Entry;
    onEntryChange: (updated: Thermo2Entry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    /** Expert-Mode aus dem json-config-System (Native-Toggle im Item-Dialog) */
    expertMode?: boolean;
    /** Alle verfügbaren Seiten (aus sendTo) – Navigationsziele im Item-Dialog */
    pagesList?: string[];
}

/** channel roles the adapter accepts for a heat circuit (pageThermo2.ts getPage) */
const CIRCUIT_ROLES: readonly string[] = ['thermostat', 'airCondition'];

/** slots per page on the panel (pageMenu.ts maxItems of cardThermo2): 0-3 left, 4-7 right, 8 between - and + */
const SLOTS = 9;

/**
 * slot i shows visible item SORT[order][i] (pageThermo2.ts update). With a sort order other than `V`
 * the adapter sorts eight entries only, slot 8 is not sent (-1).
 */
const SORT: Record<Thermo2SortOrder, number[]> = {
    V: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    H: [0, 4, 1, 5, 2, 6, 3, 7, -1],
    HM: [1, 5, 2, 6, 0, 4, 3, 7, -1],
    VM: [3, 0, 1, 2, 7, 4, 5, 6, -1],
    HB: [0, 5, 7, 2, 1, 4, 6, 3, -1],
    VB: [0, 4, 5, 1, 2, 6, 7, 3, -1],
};

/**
 * buttons the adapter generates from the alias states, in the order and with the icons of
 * pageThermo2.ts getPage (indicators: the icon of the inactive state, as the panel shows it mostly)
 */
const AUTO_STATES: readonly [string, string][] = [
    ['POWER', 'power-standby'],
    ['BOOST', 'fast-forward-60'],
    ['WINDOWOPEN', 'window-closed-variant'],
    ['PARTY', 'party-popper'],
    ['MAINTAIN', 'account-wrench'],
    ['UNREACH', 'wifi'],
    ['LOWBAT', 'battery-high'],
    ['ERROR', 'alert-circle'],
    ['VACATION', 'palm-tree'],
    ['WORKING', 'briefcase-check'],
];

type DialogKind = 'circuit' | 'limits' | 'display' | 'mode' | 'heat';
type LimitField = 'minValue' | 'maxValue' | 'stepValue';
type TextField2 = 'name' | 'name2' | 'unit' | 'unit2' | 'setState' | 'actualState' | 'humidityState' | 'modeState';
type IconField = 'icon' | 'icon2' | 'iconHeatCycle' | 'iconHeatCycle2';
type ColorField =
    | 'onColor'
    | 'onColor2'
    | 'iconHeatCycleOnColor'
    | 'iconHeatCycleOffColor'
    | 'iconHeatCycleOnColor2'
    | 'iconHeatCycleOffColor2';

/** a circuit as the panel counts it: an airCondition channel is heating and cooling */
type ExpandedCircuit = { stored: number; cooling: boolean; label: string };

/** what a slot of the mock shows */
type SlotContent =
    | { kind: 'selector'; icon: string; label: string; active: boolean }
    | { kind: 'auto'; icon: string; label: string }
    | { kind: 'item'; icon: string; label: string; index: number; filter: number | undefined };

interface PageThermo2EditorState extends ConfigGenericState {
    alive: boolean;
    /** common.role per channel id; null = object not found */
    roles: Record<string, string | null>;
    /** common.name per object id */
    objectNames: Record<string, string>;
    /** data point keys the adapter will find below a channel (ACTUAL, SET, MODESET, ...), matched by role like the adapter */
    childKeys: Record<string, string[]>;
    /** selected expanded circuit (tab) */
    tab: number;
    /** page of the slots */
    page: number;
    /** index into pageItems while the item dialog is open; equal to the length when adding */
    editingIndex: number | null;
    /** open settings dialog */
    dialog: DialogKind | null;
    /** copy of the circuit while a dialog is open */
    draft: Thermo2CircuitConfig | null;
}

let iconMap: Map<string, string> | null = null;

/**
 * base64 source of an icon of the icon list
 *
 * @param name icon name
 */
function iconSrc(name: string): string {
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
 * channel-like objects with a role the adapter accepts for a circuit
 *
 * @param obj object from the browser
 */
/** object types a circuit channel may have (also the `types` of the SelectID, which shows states only by default) */
const CIRCUIT_OBJECT_TYPES: ioBroker.ObjectType[] = ['channel', 'device', 'folder'];

function isCircuitObject(obj: ioBroker.Object): boolean {
    return !!obj && CIRCUIT_OBJECT_TYPES.includes(obj.type) && CIRCUIT_ROLES.includes(String(obj.common?.role ?? ''));
}

/**
 * number states (set, actual, humidity)
 *
 * @param obj object from the browser
 */
function isNumberState(obj: ioBroker.Object): boolean {
    return !!obj && obj.type === 'state' && obj.common?.type === 'number';
}

/**
 * writable number states (set temperature)
 *
 * @param obj object from the browser
 */
function isWritableNumberState(obj: ioBroker.Object): boolean {
    return isNumberState(obj) && obj.common?.write !== false;
}

/**
 * mode states: number (index into the list) or string (shown as is)
 *
 * @param obj object from the browser
 */
function isModeState(obj: ioBroker.Object): boolean {
    return !!obj && obj.type === 'state' && (obj.common?.type === 'number' || obj.common?.type === 'string');
}

/**
 * common.name of an object as plain text
 *
 * @param obj object from the browser
 * @param lang admin language
 */
function objectName(obj: ioBroker.Object | null | undefined, lang: string): string {
    const raw: unknown = obj?.common?.name;
    if (typeof raw === 'string') {
        return raw;
    }
    if (raw && typeof raw === 'object') {
        const map = raw as Record<string, string>;
        return map[lang] || map.en || Object.values(map)[0] || '';
    }
    return '';
}

/**
 * data point keys of the alias definition that the states below a channel satisfy - matched by
 * common.role (and common.type) like the adapter's searchDatapointsForItems, the state names do not matter
 *
 * @param channelRole role of the channel (thermostat, airCondition)
 * @param states objects one level below the channel
 */
function foundKeys(channelRole: string, states: ioBroker.Object[]): string[] {
    const def = (
        requiredScriptDataPoints as unknown as Record<
            string,
            { data: Record<string, { role?: string | string[]; type?: string | string[]; useKey?: boolean }> }
        >
    )[channelRole];
    if (!def) {
        return [];
    }
    const out: string[] = [];
    for (const [key, want] of Object.entries(def.data)) {
        const roles = Array.isArray(want.role) ? want.role : want.role ? [want.role] : [];
        const types = Array.isArray(want.type) ? want.type : want.type ? [want.type] : [];
        const hit = states.some(st => {
            // useKey: the adapter takes only the data point named exactly like the key (searchDatapointsForItems)
            if (want.useKey && String(st._id).split('.').pop() !== key) {
                return false;
            }
            const role = String(st.common?.role ?? '');
            const type = String(st.common?.type ?? '');
            return (roles.length === 0 || roles.includes(role)) && (types.length === 0 || types.includes(type));
        });
        if (hit) {
            out.push(key);
        }
    }
    return out;
}

/**
 * buttons the adapter will generate for an alias circuit (mirrors pageThermo2.ts getPage)
 *
 * @param keys state keys below the channel
 */
function autoItems(keys: string[]): { key: string; icon: string }[] {
    const has = (k: string): boolean => keys.includes(k);
    const out: { key: string; icon: string }[] = [];
    if (has('MODESET')) {
        out.push({ key: 'MODESET', icon: 'heat-wave' });
    } else {
        if (has('AUTOMATIC') || has('MANUAL')) {
            out.push(
                { key: 'AUTOMATIC', icon: 'alpha-a-circle-outline' },
                { key: 'MANUAL', icon: 'alpha-m-circle-outline' },
            );
        }
        if (has('OFF')) {
            out.push({ key: 'OFF', icon: 'power-off' });
        }
    }
    for (const [key, icon] of AUTO_STATES) {
        if (has(key)) {
            out.push({ key, icon });
        }
    }
    return out;
}

const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;

export class PageThermo2Editor extends ConfigGeneric<
    ConfigGenericProps & PageThermo2EditorProps,
    PageThermo2EditorState
> {
    private dialogRef = React.createRef<ChannelConfigDialog>();

    constructor(props: ConfigGenericProps & PageThermo2EditorProps) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            roles: {},
            objectNames: {},
            childKeys: {},
            tab: 0,
            page: 0,
            editingIndex: null,
            dialog: null,
            draft: null,
        };
    }

    componentWillUnmount(): void {
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;
        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            this.setState({ alive: !!state?.val });
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
        } catch (error) {
            console.error('[PageThermo2Editor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
        await this.loadObjects();
    }

    async componentDidUpdate(prevProps: Readonly<ConfigGenericProps & PageThermo2EditorProps>): Promise<void> {
        if (prevProps.entry !== this.props.entry) {
            await this.loadObjects();
        }
    }

    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const isAlive = state ? !!state.val : false;
        if (isAlive !== this.state.alive) {
            this.setState({ alive: isAlive });
        }
    };

    getText(key: string): string {
        return this.props.getText(key);
    }

    /** ids of the alias circuits (trimmed, non-empty) */
    private circuitIds(): string[] {
        return (this.props.entry.thermoItems ?? [])
            .filter(c => c && c.source !== 'states')
            .map(c => (c.channelId ?? '').trim())
            .filter(id => !!id);
    }

    /** roles, names and child states of the circuit channels, names of items that are not loaded yet */
    private async loadObjects(): Promise<void> {
        const socket = this.props.oContext?.socket;
        if (!socket) {
            return;
        }
        const lang: string = (I18n as any).getLanguage?.() ?? 'en';
        const circuits = new Set<string>(this.circuitIds());
        const wanted = new Set<string>(circuits);
        for (const item of this.props.entry.pageItems ?? []) {
            const id = normalizeChannelId(item?.channelId).valueStateId;
            if (item && !item.name && id) {
                wanted.add(id);
            }
        }
        const roles: Record<string, string | null> = { ...this.state.roles };
        const objectNames: Record<string, string> = { ...this.state.objectNames };
        const childKeys: Record<string, string[]> = { ...this.state.childKeys };
        let changed = false;
        for (const id of wanted) {
            if (id in roles) {
                continue;
            }
            try {
                const obj: ioBroker.Object | null | undefined = await socket.getObject(id);
                roles[id] = obj ? String(obj.common?.role ?? '') : null;
                const name = objectName(obj, lang);
                if (name) {
                    objectNames[id] = name;
                }
                if (circuits.has(id) && obj) {
                    const prefix = `${id}.`;
                    const states: Record<string, ioBroker.Object> =
                        (await socket.getObjectViewSystem('state', prefix, `${prefix}香`)) ?? {};
                    const below = Object.entries(states)
                        .filter(([sid]) => sid.startsWith(prefix) && !sid.slice(prefix.length).includes('.'))
                        .map(([, st]) => st);
                    childKeys[id] = foundKeys(String(obj.common?.role ?? ''), below);
                }
            } catch {
                roles[id] = null;
            }
            changed = true;
        }
        if (changed) {
            this.setState({ roles, objectNames, childKeys });
        }
    }

    /**
     * the role, name and states of a channel are read again after it was changed
     *
     * @param id channel id as typed or selected
     */
    private forgetObject(id: string): void {
        const trimmed = id.trim();
        if (!trimmed || !(trimmed in this.state.roles)) {
            return;
        }
        const roles = { ...this.state.roles };
        const objectNames = { ...this.state.objectNames };
        const childKeys = { ...this.state.childKeys };
        delete roles[trimmed];
        delete objectNames[trimmed];
        delete childKeys[trimmed];
        this.setState({ roles, objectNames, childKeys }, () => void this.loadObjects());
    }

    /**
     * headline of a stored circuit as the panel shows it
     *
     * @param circuit stored circuit
     * @param cooling cooling half of an airCondition
     */
    private circuitName(circuit: Thermo2CircuitConfig, cooling: boolean): string {
        const id = (circuit.channelId ?? '').trim();
        if (cooling) {
            return (circuit.name2 ?? '').trim() || 'COOLING';
        }
        return (circuit.name ?? '').trim() || (id && this.state.objectNames[id]) || 'HEATING';
    }

    /**
     * whether a stored circuit is usable by the adapter (alias with channel or states with set + actual)
     *
     * @param circuit stored circuit
     */
    private circuitUsable(circuit: Thermo2CircuitConfig): boolean {
        if (circuit.source === 'states') {
            return !!(circuit.setState ?? '').trim() && !!(circuit.actualState ?? '').trim();
        }
        return !!(circuit.channelId ?? '').trim();
    }

    /**
     * the circuits as the panel counts them: unusable ones are skipped by the adapter, an airCondition
     * channel takes two places (heating and cooling); the index is the `filter` value of the items
     */
    private expanded(): ExpandedCircuit[] {
        const out: ExpandedCircuit[] = [];
        (this.props.entry.thermoItems ?? []).forEach((circuit, stored) => {
            if (!circuit || !this.circuitUsable(circuit)) {
                return;
            }
            const id = (circuit.channelId ?? '').trim();
            out.push({ stored, cooling: false, label: this.circuitName(circuit, false) });
            if (circuit.source !== 'states' && this.state.roles[id] === 'airCondition') {
                out.push({ stored, cooling: true, label: this.circuitName(circuit, true) });
            }
        });
        return out;
    }

    /** labels of the expanded circuits for the item dialog */
    private circuitLabels(): string[] {
        return this.expanded().map(c => c.label);
    }

    /**
     * the stored circuit the editor currently works on: the selected tab, or - when no circuit is
     * usable yet - the first stored one
     */
    private current(): {
        circuit: Thermo2CircuitConfig;
        stored: number;
        expandedIndex: number;
        cooling: boolean;
    } | null {
        const items = this.props.entry.thermoItems ?? [];
        const expanded = this.expanded();
        if (expanded.length > 0) {
            const tab = Math.min(this.state.tab, expanded.length - 1);
            const e = expanded[tab];
            return { circuit: items[e.stored], stored: e.stored, expandedIndex: tab, cooling: e.cooling };
        }
        if (items.length > 0) {
            return { circuit: items[0], stored: 0, expandedIndex: -1, cooling: false };
        }
        return null;
    }

    /**
     * everything the panel shows around the ring for the selected circuit, in runtime order
     *
     * @param cur current circuit
     * @param expanded expanded circuits
     */
    private visibleContents(
        cur: NonNullable<ReturnType<PageThermo2Editor['current']>>,
        expanded: ExpandedCircuit[],
    ): SlotContent[] {
        const out: SlotContent[] = [];
        if (expanded.length > 1) {
            expanded.forEach((e, i) => {
                const c = this.props.entry.thermoItems[e.stored];
                const icon =
                    (e.cooling ? c.iconHeatCycle2 : c.iconHeatCycle)?.trim() || `numeric-${i + 1}-circle-outline`;
                out.push({
                    kind: 'selector',
                    icon,
                    label: this.getText('thermo2_selectorItem').replace('%s', `${i + 1}: ${e.label}`),
                    active: i === cur.expandedIndex,
                });
            });
        }
        if (cur.circuit.source !== 'states') {
            const keys = this.state.childKeys[(cur.circuit.channelId ?? '').trim()] ?? [];
            for (const a of autoItems(keys)) {
                out.push({ kind: 'auto', icon: a.icon, label: this.getText('thermo2_autoItem').replace('%s', a.key) });
            }
        }
        (this.props.entry.pageItems ?? []).forEach((item, index) => {
            if (!item) {
                return;
            }
            const filter = typeof item.filter === 'number' ? item.filter : undefined;
            if (filter !== undefined && filter !== cur.expandedIndex) {
                return;
            }
            const channelId = normalizeChannelId(item.channelId).valueStateId;
            const label = item.useNative
                ? '[native]'
                : item.name || this.state.objectNames[channelId] || channelId || String(index + 1);
            out.push({ kind: 'item', icon: this.itemIcon(item), label, index, filter });
        });
        return out;
    }

    /**
     * icon name of an item: the explicit one or the default of its role
     *
     * @param item stored item
     */
    private itemIcon(item: AdminPageItemConfig): string {
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

    // ---------- circuits ----------

    private updateCircuits(thermoItems: Thermo2CircuitConfig[]): void {
        this.props.onEntryChange({ ...this.props.entry, thermoItems });
    }

    private handleCircuitAdd = (): void => {
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        if (thermoItems.length >= thermo2MaxCircuits) {
            return;
        }
        thermoItems.push(emptyThermo2Circuit());
        this.updateCircuits(thermoItems);
        this.setState({
            tab: this.expanded().length,
            draft: { ...thermoItems[thermoItems.length - 1] },
            dialog: 'circuit',
        });
        this.draftStored = thermoItems.length - 1;
    };

    /** stored index the open dialog belongs to */
    private draftStored = 0;

    private openDialog(kind: DialogKind): void {
        const cur = this.current();
        if (!cur) {
            return;
        }
        this.draftStored = cur.stored;
        this.setState({ dialog: kind, draft: { ...cur.circuit, modeList: [...(cur.circuit.modeList ?? [])] } });
    }

    private closeDialog = (): void => {
        this.setState({ dialog: null, draft: null });
    };

    private applyDialog = (): void => {
        const { draft } = this.state;
        if (!draft) {
            return;
        }
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        thermoItems[this.draftStored] = draft;
        this.updateCircuits(thermoItems);
        this.setState({ dialog: null, draft: null });
    };

    private deleteCurrentCircuit = (): void => {
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        thermoItems.splice(this.draftStored, 1);
        if (thermoItems.length === 0) {
            thermoItems.push(emptyThermo2Circuit());
        }
        this.updateCircuits(thermoItems);
        this.setState({ dialog: null, draft: null, tab: 0 });
    };

    private moveCurrentCircuit(delta: -1 | 1): void {
        const thermoItems = [...(this.props.entry.thermoItems ?? [])];
        const target = this.draftStored + delta;
        if (target < 0 || target >= thermoItems.length) {
            return;
        }
        [thermoItems[this.draftStored], thermoItems[target]] = [thermoItems[target], thermoItems[this.draftStored]];
        this.draftStored = target;
        this.updateCircuits(thermoItems);
        this.setState({ tab: Math.max(0, this.state.tab + delta) });
    }

    private setDraft<K extends keyof Thermo2CircuitConfig>(field: K, value: Thermo2CircuitConfig[K]): void {
        if (!this.state.draft) {
            return;
        }
        this.setState({ draft: { ...this.state.draft, [field]: value } });
    }

    /**
     * empty or invalid input clears the field; the adapter then uses its default
     *
     * @param field limit field
     * @param raw text of the input
     */
    private setDraftLimit(field: LimitField, raw: string): void {
        const n = parseFloat(raw);
        this.setDraft(field, Number.isFinite(n) ? n : undefined);
    }

    // ---------- items ----------

    private updateItems(pageItems: (AdminPageItemConfig | undefined)[]): void {
        this.props.onEntryChange({ ...this.props.entry, pageItems });
    }

    private openItem(index: number, filter?: number): void {
        const items = this.props.entry.pageItems ?? [];
        const item = items[index] ?? (filter !== undefined ? ({ filter } as Partial<AdminPageItemConfig>) : undefined);
        this.setState({ editingIndex: index });
        this.dialogRef.current?.openWith(item, true);
    }

    private handleItemSave = (config: AdminPageItemConfig): void => {
        const { editingIndex } = this.state;
        if (editingIndex === null) {
            return;
        }
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        while (pageItems.length <= editingIndex) {
            pageItems.push(undefined);
        }
        pageItems[editingIndex] = config;
        this.setState({ editingIndex: null });
        this.updateItems(pageItems);
    };

    private deleteItem(index: number): void {
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        pageItems.splice(index, 1);
        this.updateItems(pageItems);
    }

    /**
     * moves an item before/after its visible neighbour (the stored order decides the slot)
     *
     * @param index stored index
     * @param delta -1 earlier, 1 later
     * @param visible the visible items of the current circuit
     */
    private moveItem(index: number, delta: -1 | 1, visible: SlotContent[]): void {
        const itemsVisible = visible.filter((v): v is Extract<SlotContent, { kind: 'item' }> => v.kind === 'item');
        const pos = itemsVisible.findIndex(v => v.index === index);
        const neighbour = itemsVisible[pos + delta];
        if (pos < 0 || !neighbour) {
            return;
        }
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        [pageItems[index], pageItems[neighbour.index]] = [pageItems[neighbour.index], pageItems[index]];
        this.updateItems(pageItems);
    }

    // ---------- rendering: dialogs ----------

    private renderTextField(field: TextField2, labelKey: string, placeholder = ''): React.JSX.Element {
        const { draft } = this.state;
        return (
            <TextField
                fullWidth
                variant="standard"
                type="text"
                autoComplete="off"
                label={this.getText(labelKey)}
                value={draft?.[field] ?? ''}
                placeholder={placeholder}
                onChange={e => this.setDraft(field, e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 2 }}
            />
        );
    }

    private renderLimitField(field: LimitField, labelKey: string): React.JSX.Element {
        const { draft } = this.state;
        return (
            <TextField
                variant="standard"
                type="number"
                label={this.getText(labelKey)}
                value={draft?.[field] ?? ''}
                placeholder={String(thermo2Defaults[field])}
                onChange={e => this.setDraftLimit(field, e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any', min: 0 } }}
                sx={{ width: 160, mr: 2, mb: 2 }}
            />
        );
    }

    private renderStateField(
        field: 'setState' | 'actualState' | 'humidityState' | 'modeState',
        labelKey: string,
        filterFunc: (obj: ioBroker.Object) => boolean,
    ): React.JSX.Element {
        const { oContext, theme } = this.props;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        return (
            <Box sx={{ mb: 2 }}>
                <EntitySelector
                    label={this.getText(labelKey)}
                    value={this.state.draft?.[field] ?? ''}
                    onChange={(v: string) => this.setDraft(field, v)}
                    socket={oContext.socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName={`selectThermo2_${field}`}
                    filterFunc={filterFunc}
                />
            </Box>
        );
    }

    private renderIconField(field: IconField, labelKey: string, placeholder: string): React.JSX.Element {
        const { oContext, themeName } = this.props;
        const value = this.state.draft?.[field] ?? '';
        return (
            <Box sx={{ mb: 2 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {this.getText(labelKey)}{' '}
                    {placeholder ? `(${this.getText('thermo2_defaultIs').replace('%s', placeholder)})` : ''}
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
                        this.setDraft(field, icon);
                        if (cb) {
                            cb();
                        }
                    }}
                />
            </Box>
        );
    }

    private renderColorField(field: ColorField, labelKey: string, defaultColor: string): React.JSX.Element {
        const value = this.state.draft?.[field];
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                <TextField
                    variant="standard"
                    type="color"
                    label={this.getText(labelKey)}
                    value={value || defaultColor}
                    onChange={e => this.setDraft(field, e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 160 }}
                />
                <Tooltip title={this.getText('thermo2_resetDefault')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={!value}
                            onClick={() => this.setDraft(field, undefined)}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {value ? value : this.getText('thermo2_defaultIs').replace('%s', defaultColor)}
                </Typography>
            </Box>
        );
    }

    private renderDialog(): React.JSX.Element | null {
        const { dialog, draft } = this.state;
        if (!dialog || !draft) {
            return null;
        }
        const { oContext, theme } = this.props;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        const id = (draft.channelId ?? '').trim();
        const role = draft.source !== 'states' && id ? this.state.roles[id] : undefined;
        const isAir = role === 'airCondition';
        let problem: string | undefined;
        if (draft.source !== 'states' && id && role === null) {
            problem = this.getText('thermo2_channelMissing').replace('%s', id);
        } else if (draft.source !== 'states' && id && typeof role === 'string' && !CIRCUIT_ROLES.includes(role)) {
            problem = this.getText('thermo2_wrongRole')
                .replace('%s', id)
                .replace('%s', role || '-');
        }
        const count = (this.props.entry.thermoItems ?? []).length;
        const titles: Record<DialogKind, string> = {
            circuit: 'thermo2_dialogCircuit',
            limits: 'thermo2_dialogLimits',
            display: 'thermo2_dialogDisplay',
            mode: 'thermo2_dialogMode',
            heat: 'thermo2_dialogHeat',
        };

        let content: React.JSX.Element;
        switch (dialog) {
            case 'circuit':
                content = (
                    <Box>
                        <FormControl
                            component="fieldset"
                            sx={{ mb: 2 }}
                        >
                            <FormLabel component="legend">{this.getText('thermo2_source')}</FormLabel>
                            <RadioGroup
                                row
                                value={draft.source === 'states' ? 'states' : 'alias'}
                                onChange={e =>
                                    this.setDraft('source', e.target.value === 'states' ? 'states' : 'alias')
                                }
                            >
                                <FormControlLabel
                                    value="alias"
                                    control={<Radio />}
                                    label={this.getText('thermo2_sourceAlias')}
                                />
                                <FormControlLabel
                                    value="states"
                                    control={<Radio />}
                                    label={this.getText('thermo2_sourceStates')}
                                />
                            </RadioGroup>
                        </FormControl>
                        {draft.source !== 'states' && (
                            <Box sx={{ mb: 2 }}>
                                <EntitySelector
                                    label={this.getText('thermo2_channel')}
                                    value={draft.channelId ?? ''}
                                    onChange={(v: string) => this.setDraft('channelId', v)}
                                    onCommit={(v: string) => this.forgetObject(v)}
                                    socket={oContext.socket}
                                    theme={theme}
                                    themeType={themeType}
                                    dialogName="selectThermo2Channel"
                                    filterFunc={isCircuitObject}
                                    types={CIRCUIT_OBJECT_TYPES}
                                />
                                {problem && (
                                    <Alert
                                        severity="warning"
                                        sx={{ mt: 1 }}
                                    >
                                        {problem}
                                    </Alert>
                                )}
                                {!problem && typeof role === 'string' && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {this.getText('thermo2_roleIs').replace('%s', role)}
                                        {' · '}
                                        {this.getText('thermo2_autoStates').replace(
                                            '%s',
                                            autoItems(this.state.childKeys[id] ?? [])
                                                .map(a => a.key)
                                                .join(', ') || '–',
                                        )}
                                    </Typography>
                                )}
                            </Box>
                        )}
                        {draft.source === 'states' && (
                            <Box>
                                {this.renderStateField('setState', 'thermo2_setState', isWritableNumberState)}
                                {this.renderStateField('actualState', 'thermo2_actualState', isNumberState)}
                                {this.renderStateField('humidityState', 'thermo2_humidityState', isNumberState)}
                                {this.renderStateField('modeState', 'thermo2_modeState', isModeState)}
                            </Box>
                        )}
                        {this.renderTextField('name', 'thermo2_name', id ? this.state.objectNames[id] || '' : '')}
                        {isAir && this.renderTextField('name2', 'thermo2_name2', 'COOLING')}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                                size="small"
                                startIcon={<ChevronLeftIcon />}
                                disabled={this.draftStored === 0}
                                onClick={() => this.moveCurrentCircuit(-1)}
                            >
                                {this.getText('thermo2_moveLeft')}
                            </Button>
                            <Button
                                size="small"
                                endIcon={<ChevronRightIcon />}
                                disabled={this.draftStored >= count - 1}
                                onClick={() => this.moveCurrentCircuit(1)}
                            >
                                {this.getText('thermo2_moveRight')}
                            </Button>
                            <Box sx={{ flex: 1 }} />
                            <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={this.deleteCurrentCircuit}
                            >
                                {this.getText('thermo2_removeCircuit')}
                            </Button>
                        </Box>
                    </Box>
                );
                break;
            case 'limits':
                content = (
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 2 }}
                        >
                            {this.getText('thermo2_valuesHint')}
                        </Typography>
                        {this.renderLimitField('minValue', 'thermo2_minValue')}
                        {this.renderLimitField('maxValue', 'thermo2_maxValue')}
                        {this.renderLimitField('stepValue', 'thermo2_stepValue')}
                    </Box>
                );
                break;
            case 'display':
                content = (
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1 }}
                        >
                            {this.getText('thermo2_line1')}
                        </Typography>
                        {this.renderIconField('icon', 'thermo2_icon', thermo2Defaults.icon)}
                        {this.renderColorField('onColor', 'thermo2_color', thermo2Defaults.onColor)}
                        {this.renderTextField('unit', 'thermo2_unit', thermo2Defaults.unit)}
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, mt: 2 }}
                        >
                            {this.getText('thermo2_line2')}
                        </Typography>
                        {this.renderIconField('icon2', 'thermo2_icon', thermo2Defaults.icon2)}
                        {this.renderColorField('onColor2', 'thermo2_color', thermo2Defaults.onColor2)}
                        {this.renderTextField('unit2', 'thermo2_unit', thermo2Defaults.unit2)}
                    </Box>
                );
                break;
            case 'mode':
                content = (
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 2 }}
                        >
                            {this.getText('thermo2_modeListHint').replace('%s', thermo2Defaults.modeList.join(', '))}
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            variant="standard"
                            label={this.getText('thermo2_modeListLabel')}
                            value={(draft.modeList ?? []).join('\n')}
                            onChange={e => this.setDraft('modeList', e.target.value.split('\n'))}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Box>
                );
                break;
            case 'heat':
            default:
                content = (
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 2 }}
                        >
                            {this.getText('thermo2_heatHint')}
                        </Typography>
                        {this.renderIconField('iconHeatCycle', 'thermo2_heatIcon', 'numeric-N-circle-outline')}
                        {this.renderColorField(
                            'iconHeatCycleOnColor',
                            'thermo2_heatOnColor',
                            thermo2Defaults.iconHeatCycleOnColor,
                        )}
                        {this.renderColorField(
                            'iconHeatCycleOffColor',
                            'thermo2_heatOffColor',
                            thermo2Defaults.iconHeatCycleOffColor,
                        )}
                        {isAir && (
                            <Box sx={{ mt: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                >
                                    {this.getText('thermo2_heatCooling')}
                                </Typography>
                                {this.renderIconField('iconHeatCycle2', 'thermo2_heatIcon', 'numeric-N-circle-outline')}
                                {this.renderColorField(
                                    'iconHeatCycleOnColor2',
                                    'thermo2_heatOnColor',
                                    thermo2Defaults.iconHeatCycleOnColor2,
                                )}
                                {this.renderColorField(
                                    'iconHeatCycleOffColor2',
                                    'thermo2_heatOffColor',
                                    thermo2Defaults.iconHeatCycleOffColor2,
                                )}
                            </Box>
                        )}
                    </Box>
                );
                break;
        }

        return (
            <Dialog
                open
                maxWidth="sm"
                fullWidth
                onClose={this.closeDialog}
            >
                <DialogTitle>{this.getText(titles[dialog])}</DialogTitle>
                <DialogContent dividers>{content}</DialogContent>
                <DialogActions>
                    <Button onClick={this.closeDialog}>{this.getText('thermo2_cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={this.applyDialog}
                    >
                        {this.getText('thermo2_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // ---------- rendering: the panel ----------

    /**
     * one of the nine slots around the ring
     *
     * @param slot slot number 0-8 (0-3 left column, 4-7 right column, 8 between - and +)
     * @param content what the panel shows there
     * @param visible all visible items (for moving)
     * @param cur current circuit
     * @param notSent name of the sort order with which the adapter does not send this slot
     */
    private renderSlot(
        slot: number,
        content: SlotContent | undefined,
        visible: SlotContent[],
        cur: NonNullable<ReturnType<PageThermo2Editor['current']>>,
        notSent?: string,
    ): React.JSX.Element {
        const { alive } = this.state;
        const left = slot < 4;
        const row = slot % 4;
        const pos =
            slot === 8
                ? { position: 'absolute' as const, bottom: '4%', left: '44%', width: '12%', height: '13%' }
                : {
                      position: 'absolute' as const,
                      top: `${15 + row * 19.5}%`,
                      [left ? 'left' : 'right']: '2%',
                      width: '15%',
                      height: '17%',
                  };
        const base = {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px dashed rgba(255,255,255,0.25)',
            color: '#ddd',
            fontSize: 11,
            lineHeight: 1.1,
            textAlign: 'center' as const,
        };
        if (notSent) {
            const src = content ? iconSrc(content.icon) : '';
            return (
                <Tooltip
                    key={slot}
                    title={`${this.getText('thermo2_slotNotSorted').replace('%s', notSent)}${content ? ` · ${content.label}` : ''}`}
                >
                    <Box sx={{ ...pos, ...base, opacity: 0.35, cursor: 'default' }}>
                        {src ? (
                            <img
                                src={src}
                                alt=""
                                style={{ width: 22, height: 22, filter: 'invert(1)' }}
                            />
                        ) : null}
                        <LockIcon sx={{ fontSize: 11, color: '#777', position: 'absolute', top: 2, right: 2 }} />
                    </Box>
                </Tooltip>
            );
        }
        if (!content) {
            const canAdd = alive && cur.expandedIndex >= 0;
            return (
                <Tooltip
                    key={slot}
                    title={canAdd ? this.getText('thermo2_emptySlotHint') : ''}
                >
                    <Box
                        sx={{
                            ...pos,
                            ...base,
                            cursor: canAdd ? 'pointer' : 'default',
                            opacity: 0.6,
                            '&:hover': canAdd ? { borderColor: '#fff', opacity: 1 } : {},
                        }}
                        onClick={
                            canAdd
                                ? () => this.openItem((this.props.entry.pageItems ?? []).length, cur.expandedIndex)
                                : undefined
                        }
                    >
                        <AddIcon sx={{ fontSize: 18, color: '#888' }} />
                    </Box>
                </Tooltip>
            );
        }
        const src = iconSrc(content.icon);
        const icon = src ? (
            <img
                src={src}
                alt={content.icon}
                style={{
                    width: 26,
                    height: 26,
                    filter: 'invert(1)',
                    opacity: content.kind === 'selector' && !content.active ? 0.45 : 1,
                }}
            />
        ) : (
            <Typography sx={{ fontSize: 10, color: '#bbb' }}>{content.icon || '?'}</Typography>
        );
        if (content.kind !== 'item') {
            return (
                <Tooltip
                    key={slot}
                    title={content.label}
                >
                    <Box
                        sx={{
                            ...pos,
                            ...base,
                            borderStyle: 'solid',
                            borderColor: 'rgba(255,255,255,0.12)',
                            cursor: 'default',
                        }}
                    >
                        {icon}
                        <LockIcon sx={{ fontSize: 11, color: '#777', position: 'absolute', top: 2, right: 2 }} />
                    </Box>
                </Tooltip>
            );
        }
        const itemsVisible = visible.filter(v => v.kind === 'item');
        const vpos = itemsVisible.findIndex(v => v.kind === 'item' && v.index === content.index);
        return (
            <Tooltip
                key={slot}
                title={`${content.label} · ${this.getText('thermo2_circuitLabel')}: ${
                    content.filter === undefined
                        ? this.getText('thermo2_circuitAll')
                        : `${content.filter + 1}: ${this.expanded()[content.filter]?.label ?? '?'}`
                }`}
            >
                <Box
                    sx={{
                        ...pos,
                        ...base,
                        borderStyle: 'solid',
                        borderWidth: 3,
                        borderColor: content.filter === undefined ? '#8ab4f8' : '#7cd992',
                        cursor: alive ? 'pointer' : 'default',
                        '&:hover .t2-actions': { display: 'flex' },
                    }}
                    onClick={alive ? () => this.openItem(content.index) : undefined}
                >
                    {icon}
                    <Box
                        sx={{
                            px: 0.5,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {content.label}
                    </Box>
                    <Box
                        className="t2-actions"
                        sx={{
                            display: 'none',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                        }}
                    >
                        <IconButton
                            size="small"
                            sx={{ color: '#fff', p: 0.25 }}
                            disabled={vpos <= 0}
                            onClick={e => {
                                e.stopPropagation();
                                this.moveItem(content.index, -1, visible);
                            }}
                        >
                            <ChevronLeftIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ color: '#fff', p: 0.25 }}
                            disabled={vpos >= itemsVisible.length - 1}
                            onClick={e => {
                                e.stopPropagation();
                                this.moveItem(content.index, 1, visible);
                            }}
                        >
                            <ChevronRightIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ color: '#f66', p: 0.25 }}
                            onClick={e => {
                                e.stopPropagation();
                                this.deleteItem(content.index);
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Box>
            </Tooltip>
        );
    }

    /**
     * a clickable area of the panel mock
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
        const enabled = this.state.alive && !!this.current();
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
                >
                    {children}
                </Box>
            </Tooltip>
        );
    }

    private renderPanel(): React.JSX.Element {
        const { entry } = this.props;
        const cur = this.current();
        const expanded = this.expanded();
        const visible = cur ? this.visibleContents(cur, expanded) : [];
        // one free slot is always reachable, so a page item can be added when the slots are taken
        const pages = Math.max(1, Math.ceil((visible.length + 1) / SLOTS));
        const page = Math.min(this.state.page, pages - 1);
        const sortOrder: Thermo2SortOrder =
            entry.sortOrder && thermo2SortOrders.includes(entry.sortOrder) ? entry.sortOrder : 'V';
        const order = SORT[sortOrder];
        const pageItems = visible.slice(page * SLOTS, page * SLOTS + SLOTS);
        const c = cur?.circuit;
        const headline = cur
            ? cur.expandedIndex >= 0
                ? expanded[cur.expandedIndex].label
                : this.getText('thermo2_noSource')
            : '';
        const unit = c?.unit?.trim() || thermo2Defaults.unit;
        const unit2 = c?.unit2?.trim() || thermo2Defaults.unit2;
        const icon1 = iconSrc(c?.icon?.trim() || thermo2Defaults.icon);
        const icon2 = iconSrc(c?.icon2?.trim() || thermo2Defaults.icon2);
        const color1 = c?.onColor || thermo2Defaults.onColor;
        const color2 = c?.onColor2 || thermo2Defaults.onColor2;
        const mode = (c?.modeList ?? []).map(m => m.trim()).filter(m => !!m)[0] || 'MANUAL';
        const min = c?.minValue ?? thermo2Defaults.minValue;
        const max = c?.maxValue ?? thermo2Defaults.maxValue;
        const step = c?.stepValue ?? thermo2Defaults.stepValue;

        return (
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 720,
                    aspectRatio: '3 / 2',
                    backgroundColor: '#000',
                    borderRadius: 2,
                    border: '6px solid #222',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    fontFamily: 'Roboto, sans-serif',
                }}
            >
                {/* navigation arrows (fixed by the panel) */}
                <ArrowBackIcon sx={{ position: 'absolute', top: '3%', left: '3%', color: '#eee', fontSize: 28 }} />
                <ArrowDownwardIcon
                    sx={{ position: 'absolute', top: '3%', right: '3%', color: '#4da3ff', fontSize: 28 }}
                />

                {/* headline → circuit dialog */}
                {this.renderArea(
                    'head',
                    { top: '2%', left: '22%', width: '56%', height: '12%', color: '#fff', fontSize: 20 },
                    'thermo2_clickHeadline',
                    'circuit',
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {headline}
                    </span>,
                )}

                {/* the ring */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '29%',
                        top: '19%',
                        width: '42%',
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        background:
                            'conic-gradient(from 215deg, #3a86ff 0deg, #35c4f0 60deg, #ffd000 150deg, #ff3b3b 215deg, #444 215deg, #444 290deg, transparent 290deg)',
                    }}
                >
                    <Box sx={{ position: 'absolute', inset: '9%', borderRadius: '50%', backgroundColor: '#000' }} />
                </Box>

                {/* line 1 → display dialog */}
                {this.renderArea(
                    'line1',
                    { top: '28%', left: '36%', width: '28%', height: '11%', color: color1, fontSize: 15 },
                    'thermo2_clickDisplay',
                    'display',
                    <>
                        {icon1 ? (
                            <img
                                src={icon1}
                                alt=""
                                style={{ width: 18, height: 18, filter: 'invert(1)' }}
                            />
                        ) : null}
                        <span>24.0 {unit}</span>
                    </>,
                )}
                {/* set temperature → limits dialog */}
                {this.renderArea(
                    'set',
                    {
                        top: '39%',
                        left: '34%',
                        width: '32%',
                        height: '16%',
                        color: '#fff',
                        fontSize: 30,
                        fontWeight: 700,
                    },
                    'thermo2_clickLimits',
                    'limits',
                    <>
                        <span>{(min + Math.floor((max - min) / step / 2) * step).toFixed(1)}</span>
                        <span style={{ fontSize: 13, fontWeight: 400, alignSelf: 'flex-start', marginTop: 10 }}>
                            {unit}
                        </span>
                    </>,
                )}
                {/* line 3 → display dialog */}
                {this.renderArea(
                    'line2',
                    { top: '55%', left: '36%', width: '28%', height: '11%', color: color2, fontSize: 15 },
                    'thermo2_clickDisplay',
                    'display',
                    <>
                        {icon2 ? (
                            <img
                                src={icon2}
                                alt=""
                                style={{ width: 18, height: 18, filter: 'invert(1)' }}
                            />
                        ) : null}
                        <span>30.0 {unit2}</span>
                    </>,
                )}
                {/* mode text → mode dialog */}
                {this.renderArea(
                    'mode',
                    { top: '67%', left: '36%', width: '28%', height: '9%', color: '#ffe066', fontSize: 14 },
                    'thermo2_clickMode',
                    'mode',
                    <span>{mode}</span>,
                )}
                {/* - / + (fixed by the panel), slot 8 lies between them */}
                <RemoveCircleOutlineIcon
                    sx={{ position: 'absolute', bottom: '6%', left: '33%', color: '#fff', fontSize: 30 }}
                />
                <AddCircleOutlineIcon
                    sx={{ position: 'absolute', bottom: '6%', right: '33%', color: '#fff', fontSize: 30 }}
                />
                {/* the nine slots; -1 = slot the adapter does not send with this sort order */}
                {cur &&
                    order.map((visibleIndex, slot) =>
                        this.renderSlot(
                            slot,
                            pageItems[visibleIndex < 0 ? slot : visibleIndex],
                            visible,
                            cur,
                            visibleIndex < 0 ? sortOrder : undefined,
                        ),
                    )}

                {/* paging */}
                {pages > 1 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '1%',
                            left: '2%',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#aaa',
                            fontSize: 11,
                        }}
                    >
                        <IconButton
                            size="small"
                            sx={{ color: '#aaa' }}
                            disabled={page === 0}
                            onClick={() => this.setState({ page: page - 1 })}
                        >
                            <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        {this.getText('thermo2_page').replace('%s', `${page + 1}/${pages}`)}
                        <IconButton
                            size="small"
                            sx={{ color: '#aaa' }}
                            disabled={page >= pages - 1}
                            onClick={() => this.setState({ page: page + 1 })}
                        >
                            <ChevronRightIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const { alive } = this.state;
        const expanded = this.expanded();
        const thermoItems = entry.thermoItems ?? [];
        const tab = Math.min(this.state.tab, Math.max(0, expanded.length - 1));
        const labels = this.circuitLabels();

        return (
            <Box>
                {/* UniqueName display */}
                <Box
                    sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: 'action.hover',
                    }}
                >
                    <TextField
                        fullWidth
                        variant="standard"
                        type="text"
                        label={this.getText('unique_label')}
                        value={entry.uniqueName}
                        onChange={e => {
                            const newUniqueName = e.target.value;
                            if (newUniqueName.trim()) {
                                this.props.onUniqueNameChange(entry.uniqueName, newUniqueName);
                            }
                        }}
                        slotProps={{
                            input: {
                                sx: {
                                    backgroundColor: 'transparent',
                                    px: 1,
                                    fontWeight: 600,
                                    width: '50%',
                                },
                            },
                        }}
                        disabled={!alive || isMainPageEntry(entry)}
                        helperText={isMainPageEntry(entry) ? this.getText('page_name_main_locked') : undefined}
                    />
                </Box>

                {/* circuit tabs */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Tabs
                        value={expanded.length ? tab : false}
                        onChange={(_e, v: number) => this.setState({ tab: v, page: 0 })}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ flex: 1, minHeight: 36 }}
                    >
                        {expanded.map((e, i) => (
                            <Tab
                                key={i}
                                label={`${i + 1}: ${e.label}`}
                                sx={{ minHeight: 36, textTransform: 'none' }}
                                disabled={!alive}
                            />
                        ))}
                    </Tabs>
                    <Tooltip
                        title={
                            thermoItems.length >= thermo2MaxCircuits
                                ? this.getText('thermo2_maxCircuits')
                                : this.getText('thermo2_addCircuit')
                        }
                    >
                        <span>
                            <IconButton
                                size="small"
                                disabled={!alive || thermoItems.length >= thermo2MaxCircuits}
                                onClick={this.handleCircuitAdd}
                            >
                                <AddIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
                {expanded.length === 0 && (
                    <Alert
                        severity="info"
                        sx={{ mb: 1.5 }}
                        action={
                            <Button
                                size="small"
                                disabled={!alive}
                                onClick={() => this.openDialog('circuit')}
                            >
                                {this.getText('thermo2_dialogCircuit')}
                            </Button>
                        }
                    >
                        {this.getText('thermo2_noCircuit')}
                    </Alert>
                )}

                {/* the panel */}
                {this.renderPanel()}

                {/* below the panel: sort order, hints */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                    <FormControl
                        variant="standard"
                        sx={{ minWidth: 260 }}
                        disabled={!alive}
                    >
                        <InputLabel>{this.getText('thermo2_sortOrder')}</InputLabel>
                        <Select
                            value={
                                entry.sortOrder && thermo2SortOrders.includes(entry.sortOrder) ? entry.sortOrder : 'V'
                            }
                            onChange={e => this.props.onEntryChange({ ...entry, sortOrder: e.target.value })}
                        >
                            {thermo2SortOrders.map(o => (
                                <MenuItem
                                    key={o}
                                    value={o}
                                >
                                    {`${o} – ${this.getText(`thermo2_sort_${o}`)}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        disabled={!alive || this.expanded().length === 0}
                        onClick={() => {
                            const cur = this.current();
                            if (cur) {
                                this.openItem((entry.pageItems ?? []).length, cur.expandedIndex);
                            }
                        }}
                    >
                        {this.getText('thermo2_addItem')}
                    </Button>
                    <Tooltip title={this.getText('thermo2_dialogHeat')}>
                        <span>
                            <Button
                                size="small"
                                variant="outlined"
                                disabled={!alive || !this.current()}
                                onClick={() => this.openDialog('heat')}
                            >
                                {this.getText('thermo2_dialogHeat')}
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                >
                    {this.getText('thermo2_panelHint')}
                </Typography>

                {this.renderDialog()}

                {/* ChannelConfigDialog – ohne Trigger-Button, per ref gesteuert */}
                <ChannelConfigDialog
                    ref={this.dialogRef}
                    socket={oContext?.socket}
                    theme={theme}
                    themeType={oContext?.themeType}
                    oContext={oContext}
                    expertMode={this.props.expertMode ?? false}
                    pagesList={this.props.pagesList ?? []}
                    currentPageName={entry.uniqueName}
                    currentPageCard="cardThermo2"
                    heatCircuits={labels}
                    hideTriggerButton
                    onSave={this.handleItemSave}
                />
            </Box>
        );
    }
}
