/**
 * Editor for media player pages (cardMedia) in the PageConfig tab.
 *
 * The page is drawn similar to the panel (doc/Pictures/pageMedia) - on purpose not a copy, the
 * areas are larger and plainer so they are easy to click: headline and logo open the player
 * dialog, title / artist / power button the colors, the volume bar the volume range and presets.
 * The bar at the bottom is filled the way the adapter does it at runtime (pages/tools/get*.ts):
 * first the standard items of the backend, then the own page items, five per page.
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Slider,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import LockIcon from '@mui/icons-material/Lock';
import { I18n } from '@iobroker/gui-components';
import { rawItemListLabel } from './RawItemConfigDialog';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { EntitySelector } from './EntitySelector';
import ChannelConfigDialog from './ChannelConfigDialog';
import icons from '../icons.json';
import { getPageItemDefaultsByRole, getPageNaviItemDefaultsByRole } from '../../../src/lib/const/page-item-defaults';
import {
    type AdminPageItemConfig,
    type MediaBackend,
    type MediaEntry,
    type MediaListKind,
    type MediaPlayerInfo,
    type MediaToolbarConfig,
    type MediaToolbarItem,
    type MediaVolumePreset,
    ADAPTER_NAME,
    SENDTO_GET_MEDIA_PLAYER_COMMAND,
    isMainPageEntry,
    mediaBackendFeatures,
    mediaBackendOf,
    mediaListKinds,
    mediaVisibleToolbarItems,
    mediaVolumeDefaults,
    normalizeChannelId,
} from '../../../src/lib/types/adminShareConfig';

export interface PageMediaEditorProps {
    entry: MediaEntry;
    onEntryChange: (updated: MediaEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    /** Expert-Mode aus dem json-config-System (Native-Toggle im Item-Dialog) */
    expertMode?: boolean;
    /** Alle verfügbaren Seiten (aus sendTo) – Navigationsziele im Item-Dialog */
    pagesList?: string[];
}

/** places of the bar at the bottom (pageMenu.ts maxItems of cardMedia) */
const SLOTS = 5;

/** icons the backends give their standard items (pages/tools/get*.ts); the clock shows the time instead */
const TOOLBAR_ICONS: Record<MediaToolbarItem, string> = {
    reminder: 'reminder',
    online: 'wifi-off',
    speakerList: 'speaker-multiple',
    favoriteList: 'playlist-star',
    playList: 'playlist-play',
    equalizer: 'equalizer-outline',
    clock: 'clock-outline',
    volumePresets: 'volume-source',
    trackList: 'animation-play-outline',
    repeat: 'repeat-variant',
    crossfade: 'shuffle',
};

/** a similar logo per backend - colors only, the panel shows the real ones */
const LOGOS: Record<MediaBackend, { text: string; bg: string; fg: string }> = {
    alexa2: { text: 'alexa', bg: '#1a98d5', fg: '#fff' },
    sonos: { text: 'SONOS', bg: '#111', fg: '#fff' },
    'spotify-premium': { text: 'spotify', bg: '#1db954', fg: '#000' },
    mpd: { text: 'mpd', bg: '#555', fg: '#fff' },
    squeezeboxrpc: { text: 'LMS', bg: '#e8731a', fg: '#fff' },
};

/** colors of the mock where the adapter takes the color theme of the panel */
const MOCK = {
    item: '#4dd0e1',
    title: '#e53935',
    artist: '#ffffff',
    power: '#ffffff',
    own: '#dddddd',
};

/** object types a player id may have (the SelectID shows states only by default) */
const PLAYER_OBJECT_TYPES: ioBroker.ObjectType[] = ['device', 'channel', 'folder'];

type DialogKind = 'player' | 'colors' | 'volume' | 'item';
type ColorKey = 'colorMediaIcon' | 'colorMediaArtist' | 'colorMediaTitle';

/** what a place of the bar shows */
type SlotContent = { kind: 'std'; item: MediaToolbarItem } | { kind: 'item'; index: number };

interface PageMediaEditorState extends ConfigGenericState {
    alive: boolean;
    /** answers of the adapter per checked player id */
    players: Record<string, MediaPlayerInfo>;
    /** player id a check is running for */
    checking: string;
    /** common.name per object id */
    objectNames: Record<string, string>;
    /** page of the bar */
    page: number;
    dialog: DialogKind | null;
    /** standard item of the item dialog */
    dialogItem: MediaToolbarItem | null;
    /** copy of the entry while a dialog is open */
    draft: MediaEntry | null;
    /** text of the input for a new list entry */
    listInput: string;
    /** index into pageItems while the item dialog is open; equal to the length when adding */
    editingIndex: number | null;
    dragOverKey: string | null;
    dragSource: number | null;
}

let iconMap: Map<string, string> | null = null;

/**
 * base64 source of an icon of the icon list
 *
 * @param name icon name
 * @returns data url, empty when the icon is unknown
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
 * common.name of an object as plain text
 *
 * @param obj object from the database
 * @param lang admin language
 * @returns the name, empty when there is none
 */
function objectName(obj: ioBroker.Object | null | undefined, lang: string): string {
    const raw: unknown = obj?.common?.name;
    if (typeof raw === 'string') {
        return raw;
    }
    if (raw && typeof raw === 'object') {
        const values = Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === 'string');
        const map = Object.fromEntries(values);
        return map[lang] || map.en || values[0]?.[1] || '';
    }
    return '';
}

/**
 * objects the player browser offers: devices, channels and folders of the supported adapters
 *
 * @param obj object from the browser
 * @returns true when the object can be a player
 */
function isPlayerObject(obj: ioBroker.Object): boolean {
    return !!obj && PLAYER_OBJECT_TYPES.includes(obj.type) && !!mediaBackendOf(obj._id);
}

/**
 * a colored icon of the icon list (the glyph is used as mask, so any color works)
 *
 * @param name icon name
 * @param color css color
 * @param size edge length in px
 * @returns the icon, the name as text when it is unknown
 */
function coloredIcon(name: string, color: string, size: number): React.JSX.Element {
    const src = iconSrc(name);
    if (!src) {
        return <Typography sx={{ fontSize: 10, color: '#bbb' }}>{name || '?'}</Typography>;
    }
    return (
        <Box
            component="span"
            sx={{
                display: 'inline-block',
                width: size,
                height: size,
                flexShrink: 0,
                backgroundColor: color,
                maskImage: `url(${src})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: `url(${src})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
            }}
        />
    );
}

export class PageMediaEditor extends ConfigGeneric<ConfigGenericProps & PageMediaEditorProps, PageMediaEditorState> {
    private dialogRef = React.createRef<ChannelConfigDialog>();

    constructor(props: ConfigGenericProps & PageMediaEditorProps) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            players: {},
            checking: '',
            objectNames: {},
            page: 0,
            dialog: null,
            dialogItem: null,
            draft: null,
            listInput: '',
            editingIndex: null,
            dragOverKey: null,
            dragSource: null,
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
            console.error('[PageMediaEditor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
        await this.loadNames();
        await this.checkPlayer(this.props.entry.mediaId);
    }

    async componentDidUpdate(prevProps: Readonly<ConfigGenericProps & PageMediaEditorProps>): Promise<void> {
        if (prevProps.entry !== this.props.entry) {
            await this.loadNames();
        }
        if (prevProps.entry.mediaId !== this.props.entry.mediaId) {
            await this.checkPlayer(this.props.entry.mediaId);
        }
    }

    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const isAlive = state ? !!state.val : false;
        if (isAlive !== this.state.alive) {
            this.setState({ alive: isAlive }, () => {
                if (isAlive) {
                    void this.checkPlayer(this.props.entry.mediaId);
                }
            });
        }
    };

    getText(key: string): string {
        return this.props.getText(key);
    }

    // ---------- data from the adapter and the database ----------

    /**
     * names of the player and of the own items without name
     *
     * @param extraIds ids to load in addition (a player just selected in the dialog)
     */
    private async loadNames(extraIds: string[] = []): Promise<void> {
        const socket = this.props.oContext?.socket;
        if (!socket) {
            return;
        }
        const lang: string = I18n.getLanguage?.() ?? 'en';
        const wanted = new Set<string>(extraIds.filter(Boolean));
        const player = this.props.entry.mediaId.trim();
        if (player) {
            wanted.add(player);
        }
        for (const item of this.props.entry.pageItems ?? []) {
            const id = normalizeChannelId(item?.channelId).valueStateId;
            if (item && !item.name && id) {
                wanted.add(id);
            }
        }
        const objectNames = { ...this.state.objectNames };
        let changed = false;
        for (const id of wanted) {
            if (id in objectNames) {
                continue;
            }
            try {
                const obj: ioBroker.Object | null | undefined = await socket.getObject(id);
                objectNames[id] = objectName(obj, lang);
            } catch {
                objectNames[id] = '';
            }
            changed = true;
        }
        if (changed) {
            this.setState({ objectNames });
        }
    }

    /**
     * asks the adapter whether it accepts a player id and which names it offers for the lists
     *
     * @param rawId player id
     * @param force check again although an answer is known
     */
    private async checkPlayer(rawId: string, force = false): Promise<void> {
        const id = (rawId ?? '').trim();
        const socket = this.props.oContext?.socket;
        if (!id || !socket || !this.state.alive || (!force && id in this.state.players)) {
            return;
        }
        const instance = this.props.oContext.instance ?? '0';
        this.setState({ checking: id });
        try {
            const result: MediaPlayerInfo = await socket.sendTo(
                `${ADAPTER_NAME}.${instance}`,
                SENDTO_GET_MEDIA_PLAYER_COMMAND,
                { id },
            );
            if (result && typeof result === 'object' && 'ok' in result) {
                this.setState(s => ({ players: { ...s.players, [id]: result } }));
            }
        } catch (error) {
            console.error('[PageMediaEditor] player check failed:', error);
        } finally {
            this.setState(s => (s.checking === id ? { checking: '' } : null));
        }
    }

    private backend(entry: MediaEntry = this.props.entry): MediaBackend | undefined {
        return mediaBackendOf(entry.mediaId);
    }

    private playerInfo(entry: MediaEntry = this.props.entry): MediaPlayerInfo | undefined {
        return this.state.players[entry.mediaId.trim()];
    }

    // ---------- dialogs ----------

    /**
     * opens a settings dialog on a copy of the entry
     *
     * @param kind dialog
     * @param item standard item of the item dialog
     */
    private openDialog(kind: DialogKind, item: MediaToolbarItem | null = null): void {
        this.setState({ dialog: kind, dialogItem: item, draft: this.cloneEntry(), listInput: '' });
    }

    private cloneEntry(): MediaEntry {
        const e = this.props.entry;
        return {
            ...e,
            toolbar: Object.fromEntries(Object.entries(e.toolbar ?? {}).map(([k, v]) => [k, { ...v }])),
            speakerList: [...(e.speakerList ?? [])],
            playList: [...(e.playList ?? [])],
            favoriteList: [...(e.favoriteList ?? [])],
            volumePresets: (e.volumePresets ?? []).map(p => ({ ...p })),
        };
    }

    private closeDialog = (): void => {
        this.setState({ dialog: null, dialogItem: null, draft: null });
    };

    private applyDialog = (): void => {
        const { draft } = this.state;
        if (draft) {
            this.props.onEntryChange(draft);
        }
        this.closeDialog();
    };

    private setDraft(patch: Partial<MediaEntry>): void {
        if (this.state.draft) {
            this.setState({ draft: { ...this.state.draft, ...patch } });
        }
    }

    /**
     * changes one standard item of the draft; an item without changes is removed again
     *
     * @param item standard item
     * @param patch changed fields
     */
    private setDraftToolbar(item: MediaToolbarItem, patch: Partial<MediaToolbarConfig>): void {
        const draft = this.state.draft;
        if (!draft) {
            return;
        }
        const next: MediaToolbarConfig = { ...draft.toolbar?.[item], ...patch };
        const toolbar = { ...draft.toolbar };
        if (next.enabled !== false && !next.colorOn && !next.colorOff) {
            delete toolbar[item];
        } else {
            toolbar[item] = next;
        }
        this.setDraft({ toolbar });
    }

    private setDraftList(list: MediaListKind, names: string[]): void {
        this.setDraft({ [list]: names });
    }

    /**
     * a color input with reset button; empty = adapter default
     *
     * @param label caption
     * @param value stored color
     * @param onChange new color, undefined = default
     * @param disabled not supported by the backend
     */
    private renderColorField(
        label: string,
        value: string | undefined,
        onChange: (v: string | undefined) => void,
        disabled = false,
    ): React.JSX.Element {
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                <TextField
                    variant="standard"
                    type="color"
                    label={label}
                    value={value || '#ffffff'}
                    disabled={disabled}
                    onChange={e => onChange(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 160 }}
                />
                <Tooltip title={this.getText('media_resetDefault')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={disabled || !value}
                            onClick={() => onChange(undefined)}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {value ? value : this.getText('media_colorDefault')}
                </Typography>
            </Box>
        );
    }

    private renderPlayerDialog(draft: MediaEntry): React.JSX.Element {
        const { oContext, theme } = this.props;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        const id = draft.mediaId.trim();
        const backend = mediaBackendOf(id);
        const info = this.state.players[id];
        let status: React.JSX.Element | null = null;
        if (!id) {
            status = null;
        } else if (!backend) {
            status = <Alert severity="warning">{this.getText('media_backendUnsupported')}</Alert>;
        } else if (this.state.checking === id) {
            status = (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">{this.getText('media_checking')}</Typography>
                </Box>
            );
        } else if (info?.ok) {
            status = (
                <Alert severity="success">
                    {this.getText('media_playerOk').replace('%s', this.getText(`media_backend_${backend}`))}
                </Alert>
            );
        } else if (info) {
            status = (
                <Alert severity="error">
                    {this.getText('media_playerError')}
                    {info.messages.map((m, i) => (
                        <Typography
                            key={i}
                            variant="caption"
                            sx={{ display: 'block' }}
                        >
                            {m}
                        </Typography>
                    ))}
                </Alert>
            );
        } else if (!this.state.alive) {
            status = <Alert severity="info">{this.getText('media_checkOffline')}</Alert>;
        }
        return (
            <>
                <Box sx={{ mb: 1 }}>
                    <EntitySelector
                        label={this.getText('media_playerId')}
                        value={draft.mediaId}
                        onChange={(v: string) => this.setDraft({ mediaId: v })}
                        onCommit={(v: string) => {
                            void this.loadNames([v.trim()]);
                            void this.checkPlayer(v);
                        }}
                        socket={oContext.socket}
                        theme={theme}
                        themeType={themeType}
                        dialogName="selectMediaPlayer"
                        filterFunc={isPlayerObject}
                        types={PLAYER_OBJECT_TYPES}
                    />
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 2, whiteSpace: 'pre-line' }}
                >
                    {this.getText('media_playerIdHint')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>{status}</Box>
                    {backend && (
                        <Button
                            size="small"
                            disabled={!this.state.alive || this.state.checking === id}
                            onClick={() => void this.checkPlayer(id, true)}
                        >
                            {this.getText('media_checkAgain')}
                        </Button>
                    )}
                </Box>
                <TextField
                    fullWidth
                    variant="standard"
                    autoComplete="off"
                    label={this.getText('media_name')}
                    value={draft.name ?? ''}
                    placeholder={this.getText('media_namePlaceholder')}
                    onChange={e => this.setDraft({ name: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ mb: 1 }}
                />
            </>
        );
    }

    private renderColorsDialog(draft: MediaEntry): React.JSX.Element {
        const backend = this.backend(draft);
        const titleColor = backend ? mediaBackendFeatures[backend].titleColor : false;
        const field = (key: ColorKey, labelKey: string, disabled = false): React.JSX.Element =>
            this.renderColorField(this.getText(labelKey), draft[key], v => this.setDraft({ [key]: v }), disabled);
        return (
            <>
                {field('colorMediaTitle', 'media_colorTitle', !titleColor)}
                {!titleColor && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: -1.5, mb: 2 }}
                    >
                        {this.getText('media_colorTitleOnly')}
                    </Typography>
                )}
                {field('colorMediaArtist', 'media_colorArtist')}
                {field('colorMediaIcon', 'media_colorPower')}
            </>
        );
    }

    private renderVolumeDialog(draft: MediaEntry): React.JSX.Element {
        const min = draft.minValue ?? mediaVolumeDefaults.minValue;
        const max = draft.maxValue ?? mediaVolumeDefaults.maxValue;
        const low = Math.min(min, max);
        const high = Math.max(min, max);
        const presets = draft.volumePresets ?? [];
        const setPreset = (index: number, patch: Partial<MediaVolumePreset>): void => {
            const next = presets.map((p, i) => (i === index ? { ...p, ...patch } : p));
            this.setDraft({ volumePresets: next });
        };
        const limit = (key: 'minValue' | 'maxValue', labelKey: string): React.JSX.Element => (
            <TextField
                variant="standard"
                type="number"
                label={this.getText(labelKey)}
                value={draft[key] ?? ''}
                placeholder={String(mediaVolumeDefaults[key])}
                onChange={e => {
                    const n = parseFloat(e.target.value);
                    this.setDraft({ [key]: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : undefined });
                }}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, max: 100 } }}
                sx={{ width: 160, mr: 2, mb: 2 }}
            />
        );
        return (
            <>
                {limit('minValue', 'media_minValue')}
                {limit('maxValue', 'media_maxValue')}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 2 }}
                >
                    {this.getText('media_volumeHint')}
                </Typography>
                <Typography variant="subtitle2">{this.getText('media_presets')}</Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                >
                    {this.getText('media_presetsHint')}
                </Typography>
                {presets.map((p, i) => (
                    <Box
                        key={i}
                        sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
                    >
                        <TextField
                            variant="standard"
                            autoComplete="off"
                            label={this.getText('media_presetName')}
                            value={p.name}
                            error={!p.name.trim()}
                            onChange={e => setPreset(i, { name: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ width: 160 }}
                        />
                        <Slider
                            size="small"
                            min={low}
                            max={high}
                            value={Math.min(high, Math.max(low, p.value))}
                            valueLabelDisplay="auto"
                            onChange={(_e, v) => setPreset(i, { value: Array.isArray(v) ? v[0] : v })}
                            sx={{ flex: 1 }}
                        />
                        <Typography sx={{ width: 32, textAlign: 'right' }}>
                            {Math.round(Math.min(high, Math.max(low, p.value)))}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => this.setDraft({ volumePresets: presets.filter((_p, j) => j !== i) })}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ))}
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() =>
                        this.setDraft({
                            volumePresets: [...presets, { name: '', value: Math.round((low + high) / 2) }],
                        })
                    }
                >
                    {this.getText('media_presetAdd')}
                </Button>
            </>
        );
    }

    /**
     * the list of a standard item: own entries, names the adapter offers
     *
     * @param draft entry copy
     * @param list list of the item
     */
    private renderListEditor(draft: MediaEntry, list: MediaListKind): React.JSX.Element {
        const backend = this.backend(draft);
        const names = draft[list] ?? [];
        const offered = (this.playerInfo(draft)?.options[list] ?? []).filter(n => !names.includes(n));
        const hintKey =
            list === 'playList' && (backend === 'sonos' || backend === 'alexa2')
                ? `media_listHint_playList_${backend}`
                : `media_listHint_${list}`;
        const add = (): void => {
            const name = this.state.listInput.trim();
            if (name && !names.includes(name)) {
                this.setDraftList(list, [...names, name]);
            }
            this.setState({ listInput: '' });
        };
        return (
            <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">
                    {this.getText('media_list')} ({names.length})
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                >
                    {this.getText(hintKey)}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, minHeight: 32 }}>
                    {names.length === 0 && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {this.getText('media_listEmpty')}
                        </Typography>
                    )}
                    {names.map((n, i) => (
                        <Chip
                            key={n}
                            label={n}
                            size="small"
                            onDelete={() =>
                                this.setDraftList(
                                    list,
                                    names.filter((_x, j) => j !== i),
                                )
                            }
                        />
                    ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                    <TextField
                        variant="standard"
                        autoComplete="off"
                        label={this.getText('media_listAdd')}
                        value={this.state.listInput}
                        onChange={e => this.setState({ listInput: e.target.value })}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                add();
                            }
                        }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1 }}
                    />
                    <Button
                        size="small"
                        disabled={!this.state.listInput.trim()}
                        onClick={add}
                    >
                        {this.getText('media_listAddButton')}
                    </Button>
                </Box>
                <Typography variant="subtitle2">{this.getText('media_listOffered')}</Typography>
                {offered.length === 0 ? (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {this.getText(this.state.alive ? 'media_listNoneOffered' : 'media_checkOffline')}
                    </Typography>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 1 }}>
                            {offered.map(n => (
                                <Chip
                                    key={n}
                                    label={n}
                                    size="small"
                                    variant="outlined"
                                    icon={<AddIcon />}
                                    onClick={() => this.setDraftList(list, [...names, n])}
                                />
                            ))}
                        </Box>
                        <Button
                            size="small"
                            onClick={() => this.setDraftList(list, [...names, ...offered])}
                        >
                            {this.getText('media_listTakeAll')}
                        </Button>
                    </>
                )}
            </Box>
        );
    }

    private renderItemDialog(draft: MediaEntry, item: MediaToolbarItem): React.JSX.Element {
        const backend = this.backend(draft);
        const features = backend ? mediaBackendFeatures[backend] : undefined;
        const config = draft.toolbar?.[item] ?? {};
        const list = mediaListKinds.find(l => l === item);
        return (
            <>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {this.getText(`media_itemHint_${item}`)}
                </Typography>
                {item === 'volumePresets' ? (
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{ mb: 2 }}
                        onClick={() => this.setState({ dialog: 'volume', dialogItem: null })}
                    >
                        {this.getText('media_editPresets')}
                    </Button>
                ) : (
                    <FormControlLabel
                        sx={{ mb: 2, display: 'block' }}
                        control={
                            <Switch
                                checked={config.enabled !== false}
                                onChange={(_e, checked) => this.setDraftToolbar(item, { enabled: checked })}
                            />
                        }
                        label={this.getText('media_itemEnabled')}
                    />
                )}
                {features?.colorOn.includes(item) &&
                    this.renderColorField(
                        this.getText(features.colorOff.includes(item) ? 'media_colorOn' : 'media_colorItem'),
                        config.colorOn,
                        v => this.setDraftToolbar(item, { colorOn: v }),
                    )}
                {features?.colorOff.includes(item) &&
                    this.renderColorField(this.getText('media_colorOff'), config.colorOff, v =>
                        this.setDraftToolbar(item, { colorOff: v }),
                    )}
                {list && config.enabled !== false && this.renderListEditor(draft, list)}
            </>
        );
    }

    private renderDialog(): React.JSX.Element | null {
        const { dialog, dialogItem, draft } = this.state;
        if (!dialog || !draft) {
            return null;
        }
        let title = '';
        let content: React.JSX.Element;
        switch (dialog) {
            case 'player':
                title = this.getText('media_dialogPlayer');
                content = this.renderPlayerDialog(draft);
                break;
            case 'colors':
                title = this.getText('media_dialogColors');
                content = this.renderColorsDialog(draft);
                break;
            case 'volume':
                title = this.getText('media_dialogVolume');
                content = this.renderVolumeDialog(draft);
                break;
            case 'item':
                if (!dialogItem) {
                    return null;
                }
                title = this.getText(`media_item_${dialogItem}`);
                content = this.renderItemDialog(draft, dialogItem);
                break;
        }
        const presetsInvalid = dialog === 'volume' && (draft.volumePresets ?? []).some(p => !p.name.trim());
        return (
            <Dialog
                open
                maxWidth="sm"
                fullWidth
                onClose={this.closeDialog}
            >
                <DialogTitle>{title}</DialogTitle>
                <DialogContent dividers>{content}</DialogContent>
                <DialogActions>
                    <Button onClick={this.closeDialog}>{this.getText('media_cancel')}</Button>
                    <Button
                        variant="contained"
                        disabled={presetsInvalid}
                        onClick={this.applyDialog}
                    >
                        {this.getText('media_apply')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // ---------- own page items ----------

    /**
     * icon name of an item: the explicit one or the default of its role
     *
     * @param item stored item
     * @returns icon name, empty when unknown
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

    private itemLabel(item: AdminPageItemConfig, index: number): string {
        const channelId = normalizeChannelId(item.channelId).valueStateId;
        return item.useNative
            ? rawItemListLabel(item.native)
            : item.name || this.state.objectNames[channelId] || channelId || String(index + 1);
    }

    private updateItems(pageItems: (AdminPageItemConfig | undefined)[]): void {
        while (pageItems.length && pageItems[pageItems.length - 1] == null) {
            pageItems.pop();
        }
        this.props.onEntryChange({ ...this.props.entry, pageItems });
    }

    /**
     * opens the item dialog
     *
     * @param index stored index (length = new item)
     */
    private openItem(index: number): void {
        this.setState({ editingIndex: index });
        this.dialogRef.current?.openWith(this.props.entry.pageItems?.[index], true);
    }

    private handleItemSave = (config: AdminPageItemConfig): void => {
        const { editingIndex } = this.state;
        if (editingIndex === null) {
            return;
        }
        const pageItems = [...(this.props.entry.pageItems ?? [])];
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
     * swaps two own items
     *
     * @param a stored index
     * @param b stored index
     */
    private swapItems(a: number, b: number): void {
        const pageItems = [...(this.props.entry.pageItems ?? [])];
        if (a < 0 || b < 0 || a >= pageItems.length || b >= pageItems.length || a === b) {
            return;
        }
        [pageItems[a], pageItems[b]] = [pageItems[b], pageItems[a]];
        this.updateItems(pageItems);
    }

    private dragSource: number | null = null;

    private onDragStart(index: number, e: React.DragEvent): void {
        this.dragSource = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        this.setState({ dragSource: index });
    }

    private onDragOver(key: string, e: React.DragEvent): void {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.state.dragOverKey !== key) {
            this.setState({ dragOverKey: key });
        }
    }

    private onDragLeave = (): void => {
        this.setState({ dragOverKey: null });
    };

    private onDragEnd = (): void => {
        this.dragSource = null;
        this.setState({ dragOverKey: null, dragSource: null });
    };

    private onDrop(target: number, e: React.DragEvent): void {
        e.preventDefault();
        const src = this.dragSource;
        this.onDragEnd();
        if (src !== null) {
            this.swapItems(src, target);
        }
    }

    // ---------- rendering: the panel ----------

    /** what the bar shows, in runtime order: standard items, then the own items */
    private slotContents(): SlotContent[] {
        const { entry } = this.props;
        const backend = this.backend();
        const out: SlotContent[] = [];
        if (backend) {
            // the online item only shows up while the player is offline - it takes no place normally
            for (const item of mediaVisibleToolbarItems(entry, backend)) {
                if (item !== 'online') {
                    out.push({ kind: 'std', item });
                }
            }
        }
        (entry.pageItems ?? []).forEach((item, index) => {
            if (item) {
                out.push({ kind: 'item', index });
            }
        });
        return out;
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
        const enabled = this.state.alive;
        return (
            <Tooltip
                key={key}
                title={enabled ? this.getText(tooltipKey) : ''}
            >
                <Box
                    data-area={key}
                    sx={{
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.75,
                        borderRadius: 1,
                        cursor: enabled ? 'pointer' : 'default',
                        border: '1px dashed rgba(255,255,255,0.18)',
                        '&:hover': enabled
                            ? { borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.06)' }
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

    /**
     * one place of the bar
     *
     * @param pos place 0-4
     * @param content what is shown there, undefined = free place
     * @param arrow the place shows the paging arrow
     * @param pages number of pages of the bar
     */
    private renderSlot(
        pos: number,
        content: SlotContent | undefined,
        arrow: boolean,
        pages: number,
    ): React.JSX.Element {
        const { alive, dragOverKey, dragSource } = this.state;
        const { entry } = this.props;
        const sx = {
            position: 'absolute' as const,
            bottom: '3%',
            left: `${2 + pos * 19.6}%`,
            width: '17%',
            height: '17%',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            overflow: 'hidden',
            color: '#ddd',
            fontSize: 11,
            lineHeight: 1.1,
            textAlign: 'center' as const,
        };
        if (arrow) {
            return (
                <Tooltip
                    key={`slot${pos}`}
                    title={this.getText('media_arrowSlot')}
                >
                    <Box
                        data-slot={pos}
                        sx={{ ...sx, cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.25)' }}
                        onClick={() => this.setState({ page: (this.state.page + 1) % pages })}
                    >
                        {coloredIcon('arrow-right-bold-circle-outline', MOCK.item, 30)}
                    </Box>
                </Tooltip>
            );
        }
        if (!content) {
            return (
                <Tooltip
                    key={`slot${pos}`}
                    title={alive ? this.getText('media_emptySlotHint') : ''}
                >
                    <Box
                        data-slot={pos}
                        sx={{
                            ...sx,
                            cursor: alive ? 'pointer' : 'default',
                            opacity: 0.6,
                            border: '1px dashed rgba(255,255,255,0.25)',
                            '&:hover': alive ? { borderColor: '#fff', opacity: 1 } : {},
                        }}
                        onClick={alive ? () => this.openItem((entry.pageItems ?? []).length) : undefined}
                    >
                        <AddIcon sx={{ fontSize: 20, color: '#888' }} />
                    </Box>
                </Tooltip>
            );
        }
        if (content.kind === 'std') {
            const item = content.item;
            const color = entry.toolbar?.[item]?.colorOn || MOCK.item;
            return (
                <Tooltip
                    key={`slot${pos}`}
                    title={`${this.getText(`media_item_${item}`)} · ${this.getText('media_stdSlotHint')}`}
                >
                    <Box
                        data-slot={pos}
                        sx={{
                            ...sx,
                            cursor: alive ? 'pointer' : 'default',
                            border: '1px solid rgba(255,255,255,0.12)',
                            '&:hover': alive ? { borderColor: 'rgba(255,255,255,0.6)' } : {},
                        }}
                        onClick={alive ? () => this.openDialog('item', item) : undefined}
                    >
                        {item === 'clock' ? (
                            <Typography sx={{ color, fontSize: 18 }}>12:34</Typography>
                        ) : (
                            coloredIcon(TOOLBAR_ICONS[item], color, 28)
                        )}
                        <LockIcon sx={{ fontSize: 10, color: '#666', position: 'absolute', top: 2, right: 2 }} />
                    </Box>
                </Tooltip>
            );
        }
        const stored = entry.pageItems?.[content.index];
        if (!stored) {
            return <Box key={`slot${pos}`} />;
        }
        const key = `i${content.index}`;
        const label = this.itemLabel(stored, content.index);
        const own = (entry.pageItems ?? []).map((p, i) => (p ? i : -1)).filter(i => i >= 0);
        const ownPos = own.indexOf(content.index);
        return (
            <Tooltip
                key={`slot${pos}`}
                title={label}
            >
                <Box
                    data-slot={pos}
                    sx={{
                        ...sx,
                        border: '3px solid #8ab4f8',
                        outline: dragOverKey === key ? '2px solid #4da3ff' : 'none',
                        opacity: dragSource === content.index ? 0.4 : 1,
                        cursor: alive ? 'grab' : 'default',
                        '&:hover .m-actions': { display: 'flex' },
                    }}
                    onClick={alive ? () => this.openItem(content.index) : undefined}
                    draggable={alive}
                    onDragStart={alive ? e => this.onDragStart(content.index, e) : undefined}
                    onDragEnd={this.onDragEnd}
                    onDragOver={alive ? e => this.onDragOver(key, e) : undefined}
                    onDragLeave={this.onDragLeave}
                    onDrop={alive ? e => this.onDrop(content.index, e) : undefined}
                >
                    {coloredIcon(this.itemIcon(stored), stored.trueColor || MOCK.own, 24)}
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
                        className="m-actions"
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
                            disabled={ownPos <= 0}
                            onClick={e => {
                                e.stopPropagation();
                                this.swapItems(content.index, own[ownPos - 1]);
                            }}
                        >
                            <ChevronLeftIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ color: '#fff', p: 0.25 }}
                            disabled={ownPos >= own.length - 1}
                            onClick={e => {
                                e.stopPropagation();
                                this.swapItems(content.index, own[ownPos + 1]);
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

    private renderPanel(): React.JSX.Element {
        const { entry } = this.props;
        const backend = this.backend();
        const logo = backend ? LOGOS[backend] : undefined;
        const contents = this.slotContents();
        // one free place stays reachable to add an item
        const total = contents.length + 1;
        const arrowMode = entry.scrollPresentation === 'arrow' && total > SLOTS;
        const perPage = arrowMode ? SLOTS - 1 : SLOTS;
        const pages = Math.max(1, Math.ceil(total / perPage));
        const page = Math.min(this.state.page, pages - 1);
        const shown = contents.slice(page * perPage, page * perPage + perPage);
        const headline = entry.name?.trim() || this.getText('media_previewTitle');
        const titleColor =
            backend && mediaBackendFeatures[backend].titleColor && entry.colorMediaTitle
                ? entry.colorMediaTitle
                : MOCK.title;
        const presets = entry.volumePresets ?? [];
        const min = entry.minValue ?? mediaVolumeDefaults.minValue;
        const max = entry.maxValue ?? mediaVolumeDefaults.maxValue;

        return (
            <Box>
                <Box
                    data-testid="media-preview"
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
                    <Box sx={{ position: 'absolute', top: '4%', left: '3%', opacity: 0.6 }}>
                        {coloredIcon('arrow-left-bold', '#aaa', 26)}
                    </Box>
                    <Box sx={{ position: 'absolute', top: '4%', right: '3%', opacity: 0.6 }}>
                        {coloredIcon('arrow-right-bold', '#aaa', 26)}
                    </Box>

                    {/* headline + logo → player */}
                    {this.renderArea(
                        'head',
                        { top: '2%', left: '14%', width: '72%', height: '14%', color: '#fff', fontSize: 22 },
                        'media_clickPlayer',
                        'player',
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {headline}
                        </span>,
                    )}
                    {this.renderArea(
                        'logo',
                        { top: '21%', left: '2%', width: '16%', height: '22%' },
                        'media_clickPlayer',
                        'player',
                        <Box
                            sx={{
                                width: '86%',
                                height: '86%',
                                borderRadius: logo?.text === 'spotify' ? '50%' : 1,
                                backgroundColor: logo?.bg ?? '#333',
                                color: logo?.fg ?? '#999',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                fontWeight: 700,
                            }}
                        >
                            {logo?.text ?? '?'}
                        </Box>,
                    )}

                    {/* title / artist → colors */}
                    {this.renderArea(
                        'title',
                        {
                            top: '21%',
                            left: '22%',
                            width: '74%',
                            height: '22%',
                            flexDirection: 'column',
                            gap: 0.5,
                            fontSize: 16,
                        },
                        'media_clickColors',
                        'colors',
                        <>
                            <span style={{ color: titleColor }}>
                                {this.getText('media_previewSong')}
                                <span style={{ marginLeft: 16, fontSize: 13 }}>| 0:42-3:55</span>
                            </span>
                            <span style={{ color: entry.colorMediaArtist || MOCK.artist }}>
                                {this.getText('media_previewArtist')}
                            </span>
                        </>,
                    )}

                    {/* controls (fixed by the backend) */}
                    <Tooltip title={this.getText('media_controlsFixed')}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '47%',
                                left: '2%',
                                width: '76%',
                                height: '13%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-around',
                                opacity: 0.75,
                            }}
                        >
                            {coloredIcon('shuffle-variant', '#fff', 26)}
                            {coloredIcon('skip-previous', '#fff', 30)}
                            {coloredIcon('pause', '#fff', 34)}
                            {coloredIcon('skip-next', '#fff', 30)}
                        </Box>
                    </Tooltip>
                    {/* power → colors */}
                    {this.renderArea(
                        'power',
                        { top: '47%', left: '84%', width: '12%', height: '13%' },
                        'media_clickColors',
                        'colors',
                        coloredIcon('power', entry.colorMediaIcon || MOCK.power, 30),
                    )}

                    {/* volume → volume dialog */}
                    {this.renderArea(
                        'volume',
                        { top: '63%', left: '2%', width: '96%', height: '13%', gap: 1.5, px: 1 },
                        'media_clickVolume',
                        'volume',
                        <>
                            {coloredIcon('volume-minus', '#fff', 26)}
                            <Box
                                sx={{
                                    position: 'relative',
                                    flex: 1,
                                    height: 4,
                                    backgroundColor: '#ccc',
                                    borderRadius: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '45%',
                                        backgroundColor: '#2196f3',
                                        borderRadius: 2,
                                    }}
                                />
                                <Typography
                                    sx={{
                                        position: 'absolute',
                                        top: -20,
                                        left: 0,
                                        right: 0,
                                        textAlign: 'center',
                                        fontSize: 11,
                                        color: '#aaa',
                                    }}
                                >
                                    {`${min}–${max}${presets.length ? ` · ${presets.map(p => p.name).join(', ')}` : ''}`}
                                </Typography>
                            </Box>
                            {coloredIcon('volume-plus', '#fff', 26)}
                        </>,
                    )}

                    {/* the bar */}
                    {Array.from({ length: SLOTS }, (_v, pos) =>
                        arrowMode && pos === SLOTS - 1
                            ? this.renderSlot(pos, undefined, true, pages)
                            : pos < shown.length
                              ? this.renderSlot(pos, shown[pos], false, pages)
                              : page * perPage + pos === contents.length
                                ? this.renderSlot(pos, undefined, false, pages)
                                : null,
                    )}
                </Box>
                {pages > 1 && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.secondary',
                            fontSize: 12,
                        }}
                    >
                        <IconButton
                            size="small"
                            disabled={page === 0}
                            onClick={() => this.setState({ page: page - 1 })}
                        >
                            <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        {this.getText('media_page').replace('%s', `${page + 1}/${pages}`)}
                        <IconButton
                            size="small"
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

    /**
     * the standard items of the backend as chips - also the switched off ones, which the bar does not show
     *
     * @param backend
     */
    private renderStandardItems(backend: MediaBackend): React.JSX.Element {
        const { entry } = this.props;
        const { alive } = this.state;
        return (
            <Box sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2">{this.getText('media_standardItems')}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                    {mediaBackendFeatures[backend].items.map(item => {
                        const off =
                            item === 'volumePresets'
                                ? (entry.volumePresets ?? []).length === 0
                                : entry.toolbar?.[item]?.enabled === false;
                        const list = mediaListKinds.find(l => l === item);
                        const count = list ? (entry[list] ?? []).length : 0;
                        return (
                            <Chip
                                key={item}
                                data-item={item}
                                size="small"
                                disabled={!alive}
                                variant={off ? 'outlined' : 'filled'}
                                icon={
                                    <Box sx={{ display: 'flex', pl: 0.5 }}>
                                        {coloredIcon(
                                            TOOLBAR_ICONS[item],
                                            off ? '#888' : entry.toolbar?.[item]?.colorOn || MOCK.item,
                                            16,
                                        )}
                                    </Box>
                                }
                                label={`${this.getText(`media_item_${item}`)}${count ? ` (${count})` : ''}`}
                                sx={off ? { textDecoration: 'line-through', opacity: 0.7 } : undefined}
                                onClick={() => this.openDialog('item', item)}
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const { alive } = this.state;
        const backend = this.backend();
        const info = this.playerInfo();
        const id = entry.mediaId.trim();

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

                {!id && (
                    <Alert
                        severity="info"
                        sx={{ mb: 1.5 }}
                        action={
                            <Button
                                size="small"
                                disabled={!alive}
                                onClick={() => this.openDialog('player')}
                            >
                                {this.getText('media_dialogPlayer')}
                            </Button>
                        }
                    >
                        {this.getText('media_noPlayer')}
                    </Alert>
                )}
                {id && !backend && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1.5 }}
                    >
                        {this.getText('media_backendUnsupported')}
                    </Alert>
                )}
                {id && backend && info && !info.ok && (
                    <Alert
                        severity="error"
                        sx={{ mb: 1.5 }}
                    >
                        {this.getText('media_playerError')} {info.messages.join(' ')}
                    </Alert>
                )}

                {/* the panel */}
                {this.renderPanel()}

                {backend && this.renderStandardItems(backend)}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        disabled={!alive}
                        onClick={() => this.openItem((entry.pageItems ?? []).length)}
                    >
                        {this.getText('media_addItem')}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={!alive}
                        onClick={() => this.openDialog('player')}
                    >
                        {this.getText('media_dialogPlayer')}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={!alive}
                        onClick={() => this.openDialog('colors')}
                    >
                        {this.getText('media_dialogColors')}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={!alive}
                        onClick={() => this.openDialog('volume')}
                    >
                        {this.getText('media_dialogVolume')}
                    </Button>
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                >
                    {this.getText('media_panelHint')}
                </Typography>

                {this.renderDialog()}

                {/* ChannelConfigDialog – ohne Trigger-Button, per ref gesteuert */}
                <ChannelConfigDialog
                    ref={this.dialogRef}
                    socket={oContext?.socket}
                    theme={theme}
                    themeType={oContext?.themeType}
                    oContext={oContext}
                    pagesList={this.props.pagesList ?? []}
                    currentPageName={entry.uniqueName}
                    currentPageCard="cardMedia"
                    hideTriggerButton
                    onSave={this.handleItemSave}
                />
            </Box>
        );
    }
}
