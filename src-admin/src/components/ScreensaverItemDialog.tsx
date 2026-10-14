/**
 * Dialog of one item on a place of the screensaver. The fields follow the place
 * (screensaverItemFields): bottom shows headline, icon and value, left/favorit/alternate icon and
 * value, an indicator the icon only and can act as a button. A preview at the top draws the item
 * like the place in the mock.
 */
import React from 'react';
import {
    Alert,
    Autocomplete,
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
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import PaletteIcon from '@mui/icons-material/Palette';
import TuneIcon from '@mui/icons-material/Tune';
import { EntitySelector } from './EntitySelector';
import ChannelColorDialog from './ChannelColorDialog';
import ScreensaverIconSelectDialog from './ScreensaverIconSelectDialog';
import IconSelect from '../IconSelect';
import icons from '../icons.json';
import {
    type ScreensaverArea,
    type ScreensaverItemAction,
    type ScreensaverItemConfig,
    type IconColorElement,
    type ScreensaverItemSource,
    type ScreensaverTemplateInfo,
    type ScreensaverTemplateNeed,
    screensaverChannelIdOf,
    screensaverDateFormats,
    screensaverItemFields,
    screensaverItemSource,
} from '../../../src/lib/types/adminShareConfig';
import { getScreensaverItemDefaultsByRole, type PageItemRoleDefaults } from '../../../src/lib/const/page-item-defaults';

export interface ScreensaverItemDialogProps {
    open: boolean;
    area: ScreensaverArea;
    /** place within the area (0-based) and number of places */
    index: number;
    count: number;
    /** the place shows icon and text side by side */
    inline?: boolean;
    /** stored item, undefined = new */
    item: ScreensaverItemConfig | undefined;
    onClose: () => void;
    onSave: (item: ScreensaverItemConfig) => void;
    onDelete: () => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    themeName?: any;
    expertMode?: boolean;
    pagesList?: string[];
    /** page item templates of the adapter, undefined while unknown (adapter offline) */
    templates?: ScreensaverTemplateInfo[];
}

interface ScreensaverItemDialogState {
    draft: ScreensaverItemConfig;
    /** common.type of the state, null = not found, undefined = not checked */
    objType: string | null | undefined;
    objUnit: string;
    objName: string;
    objRole: string;
    /** common.role of the channel / device above the state - counts first for the default icons */
    channelRole: string;
    /** type of the object (state, channel, ...) - the template dialog warns about a state */
    objKind: string;
    /** the state of a button / switch action: type and common.write; null = not found, undefined = not checked */
    actionObj: { kind: string; write: boolean } | null | undefined;
    /** the state the color comes from: type; null = not found, undefined = not checked */
    colorObj: { kind: string } | null | undefined;
    colorMode: 'fixed' | 'scale' | 'state';
    /** radio at the top: one state with own fields or a page item template */
    source: ScreensaverItemSource;
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
 * any state
 *
 * @param obj object from the browser
 */
function isState(obj: ioBroker.Object): boolean {
    return !!obj && obj.type === 'state';
}

/**
 * object types a template with `need: 'channel'` works on - like the heat circuit picker of the Thermo2
 * editor: the SelectID needs them as `types`, otherwise it shows states only, plus the filter
 */
const TEMPLATE_OBJECT_TYPES: ioBroker.ObjectType[] = ['channel', 'device', 'folder'];

/**
 * channel, device or folder - the object a template searches its states in
 *
 * @param obj object from the browser
 */
function isChannelLike(obj: ioBroker.Object): boolean {
    return !!obj && TEMPLATE_OBJECT_TYPES.includes(obj.type);
}

/**
 * Option: restrict the picker of an adapter-bound template (`adapter` of the template, e.g. `pirate-weather`,
 * `roborock.0.Devices`) to the objects of that adapter. Prepared on 11.10.2026, NOT active yet (Tom): some
 * templates carry only a convention there (`0_userdata.0` for the shelly templates) and the filter would hide
 * real hits. Switch to `true` to activate - the caption `screensaver_item_adapterOnly` comes with it.
 */
const TEMPLATE_ADAPTER_FILTER = false;

/**
 * filter of the object picker for a template: channel-like objects, with the adapter option only those of
 * the template's adapter
 *
 * @param template the chosen template, null = none yet
 */
function templateObjectFilter(template: ScreensaverTemplateInfo | null): (obj: ioBroker.Object) => boolean {
    const adapter = TEMPLATE_ADAPTER_FILTER ? (template?.adapter ?? '').trim() : '';
    if (!adapter) {
        return isChannelLike;
    }
    const prefix = adapter.endsWith('.') ? adapter : `${adapter}.`;
    return (obj: ioBroker.Object): boolean => isChannelLike(obj) && (obj._id === adapter || obj._id.startsWith(prefix));
}

/**
 * writable states (button, switch of an indicator)
 *
 * @param obj object from the browser
 */
function isWritableState(obj: ioBroker.Object): boolean {
    return isState(obj) && obj.common?.write !== false;
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

const EMPTY_COMMON: ioBroker.InstanceCommon = {} as ioBroker.InstanceCommon;
const DEFAULT_ON = '#ffffff';
const DEFAULT_OFF = '#888888';

export class ScreensaverItemDialog extends React.Component<ScreensaverItemDialogProps, ScreensaverItemDialogState> {
    private colorDialogRef = React.createRef<ChannelColorDialog>();
    private iconSelectDialogRef = React.createRef<ScreensaverIconSelectDialog>();

    constructor(props: ScreensaverItemDialogProps) {
        super(props);
        this.state = {
            draft: { state: '' },
            objType: undefined,
            objUnit: '',
            objName: '',
            objRole: '',
            channelRole: '',
            objKind: '',
            actionObj: undefined,
            colorObj: undefined,
            colorMode: 'fixed',
            source: 'state',
        };
    }

    componentDidUpdate(prev: ScreensaverItemDialogProps): void {
        if (this.props.open && !prev.open) {
            const draft: ScreensaverItemConfig = this.props.item ? structuredClone(this.props.item) : { state: '' };
            if (typeof draft.state !== 'string') {
                // an item stored without a state (older or hand-edited config) must not crash the tab
                draft.state = '';
            }
            this.setState(
                {
                    draft,
                    colorMode: draft.colorScale ? 'scale' : draft.colorState ? 'state' : 'fixed',
                    objType: undefined,
                    actionObj: undefined,
                    colorObj: undefined,
                    source: screensaverItemSource(draft),
                },
                () => {
                    void this.loadObject(draft.state);
                    void this.loadActionObject(draft.action?.state);
                    void this.loadColorObject(draft.colorState);
                },
            );
        }
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private lang(): string {
        return this.props.oContext?.socket?.systemLang ?? this.props.oContext?.systemLang ?? 'en';
    }

    /**
     * reads type, unit and name of the state for the suggestions and the preview
     *
     * @param id state id
     */
    private async loadObject(id: string): Promise<void> {
        const trimmed = id.trim();
        if (!trimmed) {
            this.setState({ objType: undefined, objUnit: '', objName: '', objRole: '', channelRole: '', objKind: '' });
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await this.props.oContext?.socket?.getObject(trimmed);
            const objKind = obj ? String(obj.type ?? '') : '';
            // the channel / device above a state - its role counts first for the default icons
            let channelRole = '';
            const channelId = objKind === 'state' ? screensaverChannelIdOf(trimmed) : '';
            if (channelId) {
                try {
                    const channel: ioBroker.Object | null | undefined =
                        await this.props.oContext?.socket?.getObject(channelId);
                    if (channel && (channel.type === 'channel' || channel.type === 'device')) {
                        channelRole = String(channel.common?.role ?? '');
                    }
                } catch {
                    channelRole = '';
                }
            }
            if (this.state.draft.state.trim() !== trimmed) {
                return;
            }
            const objRole = obj ? String(obj.common?.role ?? '') : '';
            // a state item without icons starts with the default icons of its role (the panel cannot draw
            // an item without icon) - an icon list needs none
            const defaults = objKind === 'state' ? getScreensaverItemDefaultsByRole(objRole, channelRole) : null;
            this.setState(prev => {
                const draft = { ...prev.draft };
                if (defaults && !draft.iconOn && !draft.iconSelect?.length) {
                    draft.iconOn = defaults.iconOn;
                    if (!draft.iconOff && defaults.iconOff && obj?.common?.type === 'boolean') {
                        draft.iconOff = defaults.iconOff;
                    }
                }
                return {
                    draft,
                    objType: obj ? String(obj.common?.type ?? '') : null,
                    objUnit: obj ? String(obj.common?.unit ?? '') : '',
                    objName: objectName(obj, this.lang()),
                    objRole,
                    channelRole,
                    objKind,
                };
            });
        } catch {
            this.setState({ objType: null, objUnit: '', objName: '', objRole: '', channelRole: '', objKind: '' });
        }
    }

    /**
     * reads type and common.write of the state a button / switch action writes to
     *
     * @param id state id, empty = nothing to check
     */
    private async loadActionObject(id: string | undefined): Promise<void> {
        const trimmed = (id ?? '').trim();
        if (!trimmed) {
            this.setState({ actionObj: undefined });
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await this.props.oContext?.socket?.getObject(trimmed);
            if ((this.state.draft.action?.state ?? '').trim() !== trimmed) {
                return;
            }
            this.setState({
                actionObj: obj ? { kind: String(obj.type ?? ''), write: obj.common?.write === true } : null,
            });
        } catch {
            this.setState({ actionObj: null });
        }
    }

    /**
     * reads the type of the state the color comes from
     *
     * @param id state id, empty = nothing to check
     */
    private async loadColorObject(id: string | undefined): Promise<void> {
        const trimmed = (id ?? '').trim();
        if (!trimmed) {
            this.setState({ colorObj: undefined });
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await this.props.oContext?.socket?.getObject(trimmed);
            if ((this.state.draft.colorState ?? '').trim() !== trimmed) {
                return;
            }
            this.setState({ colorObj: obj ? { kind: String(obj.type ?? '') } : null });
        } catch {
            this.setState({ colorObj: null });
        }
    }

    /** default icons and colors of the role of the state - state items only */
    private roleDefaults(): PageItemRoleDefaults | null {
        return this.state.objKind === 'state'
            ? getScreensaverItemDefaultsByRole(this.state.objRole, this.state.channelRole)
            : null;
    }

    /** a state item needs an icon (or an icon list) - the panel cannot draw an item without */
    private iconMissing(): boolean {
        const { draft } = this.state;
        return this.state.source === 'state' && this.kind() !== 'unknown' && !draft.iconOn && !draft.iconSelect?.length;
    }

    /**
     * why the item cannot be applied yet: the state of a state item must exist and be a state with an
     * icon, the state of a button / switch action must exist and be writable; a template needs its
     * name and - if it searches states - its object
     */
    private blocked(): boolean {
        const { draft, objType, objKind, actionObj } = this.state;
        if (this.state.source === 'template') {
            return !draft.template || (this.templateNeed() === 'channel' && !draft.state.trim());
        }
        if (!draft.state.trim() || objType === undefined || objType === null || objKind !== 'state') {
            return true;
        }
        if (this.iconMissing()) {
            return true;
        }
        if (this.state.colorMode === 'state') {
            const { colorObj } = this.state;
            if (!draft.colorState?.trim() || !colorObj || colorObj.kind !== 'state') {
                return true;
            }
        }
        const action = draft.action;
        if (
            screensaverItemFields(this.props.area).action &&
            action &&
            (action.kind === 'button' || action.kind === 'switch') &&
            action.state?.trim()
        ) {
            return !actionObj || actionObj.kind !== 'state' || !actionObj.write;
        }
        return false;
    }

    /**
     * the warning of a button / switch action whose state is missing, no state or read-only
     *
     * @param action action of the item
     */
    private renderActionStateWarning(action: ScreensaverItemAction): React.JSX.Element | null {
        const id = (action.state ?? '').trim();
        const { actionObj } = this.state;
        if (!id || actionObj === undefined) {
            return null;
        }
        let text: string | null = null;
        if (actionObj === null) {
            text = this.getText('screensaver_item_stateMissing').replace('%s', id);
        } else if (actionObj.kind !== 'state') {
            text = this.getText('screensaver_item_notState')
                .replace('%s', id)
                .replace('%s', actionObj.kind || '-');
        } else if (!actionObj.write) {
            text = this.getText('screensaver_item_actionNotWritable').replace('%s', id);
        }
        if (!text) {
            return null;
        }
        return (
            <Alert
                severity="warning"
                sx={{ mb: 2 }}
                data-ss="action-state-warning"
            >
                {text}
            </Alert>
        );
    }

    private set<K extends keyof ScreensaverItemConfig>(field: K, value: ScreensaverItemConfig[K]): void {
        const draft = { ...this.state.draft };
        if (value === undefined || value === '') {
            delete draft[field];
        } else {
            draft[field] = value;
        }
        this.setState({ draft });
    }

    private setNumber(field: 'factor' | 'decimals', raw: string): void {
        const n = field === 'decimals' ? parseInt(raw, 10) : parseFloat(raw);
        this.set(field, Number.isFinite(n) ? n : undefined);
    }

    private apply = (): void => {
        const draft = { ...this.state.draft };
        draft.state = (draft.state ?? '').trim();
        if (this.state.source === 'template') {
            // the template brings icon, colors and texts - only what the script's template element knows is kept
            if (!draft.template || (this.templateNeed() === 'channel' && !draft.state)) {
                return;
            }
            const kept: ScreensaverItemConfig = { state: draft.state, template: draft.template };
            if (draft.enabled) {
                kept.enabled = draft.enabled;
            }
            if (draft.visibleCondition) {
                kept.visibleCondition = draft.visibleCondition;
            }
            this.props.onSave(kept);
            return;
        }
        if (!draft.state) {
            return;
        }
        delete draft.template;
        switch (this.state.colorMode) {
            case 'scale':
                delete draft.colorOn;
                delete draft.colorOff;
                delete draft.colorState;
                break;
            case 'state':
                delete draft.colorOn;
                delete draft.colorOff;
                delete draft.colorScale;
                break;
            default:
                delete draft.colorScale;
                delete draft.colorState;
        }
        const kind = this.kind();
        if (kind !== 'boolean') {
            delete draft.iconOff;
            delete draft.colorOff;
            delete draft.textOn;
            delete draft.textOff;
        }
        if (kind !== 'number') {
            delete draft.unit;
            delete draft.factor;
            delete draft.decimals;
            delete draft.colorScale;
            // the adapter evaluates the icon list for number states only
            delete draft.iconSelect;
        }
        if (kind !== 'date') {
            delete draft.dateFormat;
        }
        const fields = screensaverItemFields(this.props.area);
        if (!fields.headline) {
            delete draft.headline;
        }
        if (!fields.value) {
            delete draft.unit;
            delete draft.factor;
            delete draft.decimals;
            delete draft.dateFormat;
        }
        if (!fields.text) {
            delete draft.textOn;
            delete draft.textOff;
        }
        if (
            !fields.action ||
            !draft.action ||
            (draft.action.kind !== 'navigate' && !draft.action.state) ||
            (draft.action.kind === 'navigate' && !draft.action.page)
        ) {
            delete draft.action;
        }
        this.props.onSave(draft);
    };

    /** what the state holds - decides which fields make sense */
    private kind(): 'unknown' | 'boolean' | 'number' | 'date' | 'other' {
        const { objType, objRole, objKind } = this.state;
        if (typeof objType !== 'string' || objKind !== 'state') {
            return 'unknown';
        }
        if (objType === 'boolean') {
            return 'boolean';
        }
        if (/date|time/i.test(objRole)) {
            return 'date';
        }
        if (objType === 'number') {
            return 'number';
        }
        return 'other';
    }

    private setSource(source: ScreensaverItemSource): void {
        const draft = { ...this.state.draft };
        if (source === 'state') {
            delete draft.template;
        }
        this.setState({ source, draft });
    }

    /** radio at the top: state (own fields) or template */
    private renderSourceSwitch(): React.JSX.Element {
        return (
            <FormControl
                component="fieldset"
                sx={{ mb: 1 }}
            >
                <FormLabel
                    component="legend"
                    sx={{ fontSize: 12 }}
                >
                    {this.getText('screensaver_item_source')}
                </FormLabel>
                <RadioGroup
                    row
                    value={this.state.source}
                    onChange={e => this.setSource(e.target.value as ScreensaverItemSource)}
                    data-ss="source"
                >
                    <FormControlLabel
                        value="state"
                        control={<Radio size="small" />}
                        label={this.getText('screensaver_item_source_state')}
                    />
                    <FormControlLabel
                        value="template"
                        control={<Radio size="small" />}
                        label={this.getText('screensaver_item_source_template')}
                    />
                </RadioGroup>
            </FormControl>
        );
    }

    /** the chosen template as the adapter describes it; unknown name = channel assumed */
    private selectedTemplate(): ScreensaverTemplateInfo | null {
        const name = this.state.draft.template;
        if (!name) {
            return null;
        }
        return (
            this.props.templates?.find(t => t.name === name) ?? {
                name,
                type: '',
                role: '',
                adapter: '',
                need: 'channel',
                looksFor: [],
            }
        );
    }

    private templateNeed(): ScreensaverTemplateNeed {
        return this.selectedTemplate()?.need ?? 'channel';
    }

    /** template mode: the template (list of the adapter) and - if it searches states - the channel it works on */
    private renderTemplateFields(): React.JSX.Element {
        const { draft, objType, objName, objKind } = this.state;
        const templates = this.props.templates;
        const selected = this.selectedTemplate();
        const need = selected?.need ?? 'channel';
        return (
            <Box sx={{ mb: 2 }}>
                {templates === undefined && (
                    <Alert
                        severity="info"
                        sx={{ mb: 2 }}
                    >
                        {this.getText('screensaver_item_templatesPending')}
                    </Alert>
                )}
                <Autocomplete
                    options={templates ?? (selected ? [selected] : [])}
                    value={selected}
                    groupBy={o => o.name.split('.')[0]}
                    getOptionLabel={o => o.name}
                    isOptionEqualToValue={(a, b) => a.name === b.name}
                    onChange={(_e, v) => this.set('template', v?.name)}
                    renderInput={params => (
                        <TextField
                            {...params}
                            variant="standard"
                            label={this.getText('screensaver_item_template')}
                        />
                    )}
                    sx={{ mb: 2, maxWidth: 480 }}
                    data-ss="template"
                />
                {selected && (selected.type || selected.role || selected.adapter) && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                    >
                        {this.getText('screensaver_item_templateInfo')
                            .replace('%s', selected.type || '-')
                            .replace('%s', selected.role || '-')
                            .replace('%s', selected.adapter || '-')}
                    </Typography>
                )}
                {!selected && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                    >
                        {this.getText('screensaver_item_pickTemplate')}
                    </Typography>
                )}
                {selected && need === 'none' && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                        data-ss="template-noobject"
                    >
                        {this.getText('screensaver_item_dpInit_none')}
                    </Typography>
                )}
                {selected && need === 'channel' && (
                    <>
                        {this.renderStateField(
                            this.getText('screensaver_item_dpInit_channel'),
                            draft.state,
                            (v: string) => {
                                this.set('state', v);
                                void this.loadObject(v);
                            },
                            'dpInit',
                            templateObjectFilter(selected),
                            TEMPLATE_OBJECT_TYPES,
                        )}
                        {TEMPLATE_ADAPTER_FILTER && selected.adapter && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mb: 1 }}
                            >
                                {this.getText('screensaver_item_adapterOnly').replace('%s', selected.adapter)}
                            </Typography>
                        )}
                        {selected.looksFor.length > 0 && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mb: 1 }}
                                data-ss="template-looksfor"
                            >
                                {this.getText('screensaver_item_looksFor').replace('%s', selected.looksFor.join(', '))}
                            </Typography>
                        )}
                        {objType === null && (
                            <Alert
                                severity="warning"
                                sx={{ mb: 2 }}
                            >
                                {this.getText('screensaver_item_stateMissing').replace('%s', draft.state)}
                            </Alert>
                        )}
                        {objKind === 'state' && (
                            <Alert
                                severity="warning"
                                sx={{ mb: 2 }}
                                data-ss="template-isstate"
                            >
                                {this.getText('screensaver_item_dpInitIsState')}
                            </Alert>
                        )}
                        {typeof objType === 'string' && objKind !== 'state' && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                            >
                                {this.getText('screensaver_item_dpInitInfo').replace('%s', objName || '-')}
                            </Typography>
                        )}
                    </>
                )}
            </Box>
        );
    }

    // ---------- fields ----------

    private renderStateField(
        label: string,
        value: string,
        onChange: (v: string) => void,
        name: string,
        filter: (obj: ioBroker.Object) => boolean = isState,
        types?: ioBroker.ObjectType[],
    ): React.JSX.Element {
        const { oContext, theme } = this.props;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        return (
            <Box sx={{ mb: 2 }}>
                <EntitySelector
                    label={label}
                    value={value}
                    onChange={onChange}
                    socket={oContext.socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName={`selectScreensaverItem_${name}`}
                    filterFunc={filter}
                    types={types}
                />
            </Box>
        );
    }

    private renderIconField(field: 'iconOn' | 'iconOff', labelKey: string): React.JSX.Element {
        const { oContext, themeName } = this.props;
        const value = this.state.draft[field] ?? '';
        return (
            <Box sx={{ flex: 1, minWidth: 220 }}>
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
                        this.set(field, icon);
                        if (cb) {
                            cb();
                        }
                    }}
                />
            </Box>
        );
    }

    private renderColorField(field: 'colorOn' | 'colorOff', labelKey: string, defaultColor: string): React.JSX.Element {
        const value = this.state.draft[field];
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1.5 }}>
                <TextField
                    variant="standard"
                    type="color"
                    label={this.getText(labelKey)}
                    value={value || defaultColor}
                    onChange={e => this.set(field, e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 160 }}
                />
                <Tooltip title={this.getText('screensaver_resetDefault')}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={!value}
                            onClick={() => this.set(field, undefined)}
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

    private renderText(
        field: 'headline' | 'unit' | 'textOn' | 'textOff' | 'visibleCondition',
        labelKey: string,
        placeholder = '',
        sx: Record<string, unknown> = {},
    ): React.JSX.Element {
        return (
            <TextField
                variant="standard"
                type="text"
                autoComplete="off"
                label={this.getText(labelKey)}
                value={this.state.draft[field] ?? ''}
                placeholder={placeholder}
                onChange={e => this.set(field, e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 2, mr: 2, minWidth: 200, ...sx }}
            />
        );
    }

    /**
     * the item's date format as text for the preview
     *
     * @param options Intl options, undefined = adapter default
     */
    private dateSample(options: Intl.DateTimeFormatOptions | undefined): string {
        try {
            return new Date().toLocaleString(this.lang(), options ?? { dateStyle: 'short' });
        } catch {
            return '?';
        }
    }

    /** date format: a list of Intl presets, in expert mode also free JSON */
    private renderDateFormat(): React.JSX.Element {
        const current = this.state.draft.dateFormat;
        const json = current ? JSON.stringify(current) : '';
        const preset = screensaverDateFormats.findIndex(p => JSON.stringify(p.options) === json);
        const value = current ? (preset >= 0 ? String(preset) : 'custom') : '';
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
                <FormControl
                    variant="standard"
                    sx={{ minWidth: 260, mb: 2 }}
                >
                    <InputLabel shrink>{this.getText('screensaver_item_dateFormat')}</InputLabel>
                    <Select
                        value={value}
                        displayEmpty
                        onChange={e => {
                            const v = String(e.target.value);
                            if (v === '' || v === 'custom') {
                                this.set('dateFormat', v === '' ? undefined : (current ?? { dateStyle: 'short' }));
                            } else {
                                this.set('dateFormat', { ...screensaverDateFormats[Number(v)].options });
                            }
                        }}
                    >
                        <MenuItem value="">{this.getText('screensaver_item_dateFormatDefault')}</MenuItem>
                        {screensaverDateFormats.map((p, i) => (
                            <MenuItem
                                key={p.key}
                                value={String(i)}
                            >
                                {this.getText(p.key)} – {this.dateSample(p.options)}
                            </MenuItem>
                        ))}
                        {this.props.expertMode && (
                            <MenuItem value="custom">{this.getText('screensaver_item_dateFormatCustom')}</MenuItem>
                        )}
                    </Select>
                </FormControl>
                {this.props.expertMode && value === 'custom' && (
                    <TextField
                        variant="standard"
                        type="text"
                        autoComplete="off"
                        label="Intl.DateTimeFormatOptions (JSON)"
                        defaultValue={json}
                        onBlur={e => {
                            try {
                                const parsed = JSON.parse(e.target.value) as Intl.DateTimeFormatOptions;
                                this.set('dateFormat', parsed);
                            } catch {
                                // keep the previous value
                            }
                        }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ mb: 2, minWidth: 320 }}
                    />
                )}
            </Box>
        );
    }

    private scaleSummary(scale: IconColorElement): string {
        const best = scale.val_best != null ? ` · ${scale.val_best}` : '';
        return `${scale.val_min} … ${scale.val_max}${best} (${scale.mode ?? 'mixed'})`;
    }

    /** the state the color comes from, with the hint on the value format and the warning if it is no state */
    private renderColorStateField(): React.JSX.Element {
        const { draft, colorObj } = this.state;
        const id = (draft.colorState ?? '').trim();
        let warning: string | null = null;
        if (id && colorObj === null) {
            warning = this.getText('screensaver_item_stateMissing').replace('%s', id);
        } else if (id && colorObj && colorObj.kind !== 'state') {
            warning = this.getText('screensaver_item_notState')
                .replace('%s', id)
                .replace('%s', colorObj.kind || '-');
        }
        return (
            <Box>
                {this.renderStateField(
                    this.getText('screensaver_item_colorStateId'),
                    draft.colorState ?? '',
                    v => {
                        this.set('colorState', v);
                        void this.loadColorObject(v);
                    },
                    'colorState',
                )}
                {warning && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                        data-ss="color-state-warning"
                    >
                        {warning}
                    </Alert>
                )}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                >
                    {this.getText('screensaver_item_colorStateHint')}
                </Typography>
            </Box>
        );
    }

    private renderColorSection(): React.JSX.Element {
        const { draft, colorMode } = this.state;
        const kind = this.kind();
        const mode = colorMode === 'scale' && kind !== 'number' ? 'fixed' : colorMode;
        return (
            <Box sx={{ mb: 2 }}>
                <FormControl component="fieldset">
                    <FormLabel component="legend">{this.getText('screensaver_item_color')}</FormLabel>
                    <RadioGroup
                        row
                        value={mode}
                        onChange={e =>
                            this.setState({
                                colorMode:
                                    e.target.value === 'scale'
                                        ? 'scale'
                                        : e.target.value === 'state'
                                          ? 'state'
                                          : 'fixed',
                            })
                        }
                    >
                        <FormControlLabel
                            value="fixed"
                            control={<Radio />}
                            label={this.getText('screensaver_item_colorFixed')}
                        />
                        {kind === 'number' && (
                            <FormControlLabel
                                value="scale"
                                control={<Radio />}
                                label={this.getText('screensaver_item_colorScale')}
                            />
                        )}
                        <FormControlLabel
                            value="state"
                            control={<Radio />}
                            label={this.getText('screensaver_item_colorState')}
                            data-ss="color-state"
                        />
                    </RadioGroup>
                </FormControl>
                {mode === 'state' ? (
                    this.renderColorStateField()
                ) : mode === 'fixed' ? (
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {this.renderColorField(
                            'colorOn',
                            kind === 'boolean' ? 'screensaver_item_colorOn' : 'screensaver_item_color',
                            DEFAULT_ON,
                        )}
                        {kind === 'boolean' &&
                            this.renderColorField('colorOff', 'screensaver_item_colorOff', DEFAULT_OFF)}
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PaletteIcon />}
                            onClick={() =>
                                this.colorDialogRef.current?.openWith({
                                    trueColor: draft.colorOn ?? DEFAULT_ON,
                                    falseColor: draft.colorOff ?? DEFAULT_OFF,
                                    scale: draft.colorScale ?? { val_min: 0, val_max: 100 },
                                })
                            }
                        >
                            {this.getText('screensaver_item_colorScaleEdit')}
                        </Button>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {draft.colorScale
                                ? this.scaleSummary(draft.colorScale)
                                : this.getText('screensaver_item_colorScaleNone')}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    private renderActionSection(): React.JSX.Element {
        const action: ScreensaverItemAction = this.state.draft.action ?? { kind: 'button' };
        const kind = this.state.draft.action ? action.kind : 'none';
        return (
            <Box sx={{ mb: 2 }}>
                <FormControl
                    variant="standard"
                    sx={{ minWidth: 260, mb: 2 }}
                >
                    <InputLabel>{this.getText('screensaver_item_action')}</InputLabel>
                    <Select
                        value={kind}
                        onChange={e => {
                            const v = String(e.target.value);
                            this.set(
                                'action',
                                v === 'none' ? undefined : { ...action, kind: v as ScreensaverItemAction['kind'] },
                            );
                        }}
                    >
                        <MenuItem value="none">{this.getText('screensaver_item_action_none')}</MenuItem>
                        <MenuItem value="button">{this.getText('screensaver_item_action_button')}</MenuItem>
                        <MenuItem value="switch">{this.getText('screensaver_item_action_switch')}</MenuItem>
                        <MenuItem value="navigate">{this.getText('screensaver_item_action_navigate')}</MenuItem>
                    </Select>
                </FormControl>
                {kind === 'button' || kind === 'switch'
                    ? this.renderStateField(
                          this.getText(
                              kind === 'button'
                                  ? 'screensaver_item_action_buttonState'
                                  : 'screensaver_item_action_switchState',
                          ),
                          action.state ?? '',
                          v => {
                              this.set('action', { ...action, state: v });
                              void this.loadActionObject(v);
                          },
                          'action',
                          isWritableState,
                      )
                    : null}
                {(kind === 'button' || kind === 'switch') && this.renderActionStateWarning(action)}
                {kind === 'navigate' && (
                    <FormControl
                        variant="standard"
                        sx={{ minWidth: 260 }}
                    >
                        <InputLabel>{this.getText('screensaver_item_action_page')}</InputLabel>
                        <Select
                            value={action.page ?? ''}
                            onChange={e => this.set('action', { ...action, page: String(e.target.value) })}
                        >
                            {(this.props.pagesList ?? []).map(p => (
                                <MenuItem
                                    key={p}
                                    value={p}
                                >
                                    {p}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                >
                    {this.getText('screensaver_item_action_hint')}
                </Typography>
            </Box>
        );
    }

    /**
     * the icon of the icon list for a value - like the adapter: the first entry (ascending) whose value is
     * not below the value, above the highest value the last entry
     *
     * @param list icon list of the item
     * @param value value of the state
     */
    static iconForValue(list: { value: number; icon: string }[], value: number): string {
        const sorted = [...list].sort((a, b) => a.value - b.value);
        return (sorted.find(e => value <= e.value) ?? sorted[sorted.length - 1])?.icon ?? '';
    }

    /**
     * icon per value range of a number state: in expert mode a button opens the list, an existing list is
     * shown (and can be removed) without expert mode too
     */
    private renderIconSelectSection(): React.JSX.Element | null {
        const list = this.state.draft.iconSelect;
        if (!list?.length && !this.props.expertMode) {
            return null;
        }
        return (
            <Box
                sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}
                data-ss="iconselect"
            >
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => this.iconSelectDialogRef.current?.openWith(list)}
                >
                    {this.getText('screensaver_iconSelect_edit')}
                </Button>
                {list?.length ? (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {[...list]
                                .sort((a, b) => b.value - a.value)
                                .map(e => (
                                    <Tooltip
                                        key={`${e.value}-${e.icon}`}
                                        title={`≤ ${e.value}: ${e.icon}`}
                                    >
                                        <Box>
                                            {ScreensaverItemDialog.coloredIcon(iconSrc(e.icon), 20, 'text.secondary')}
                                        </Box>
                                    </Tooltip>
                                ))}
                        </Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {this.getText('screensaver_iconSelect_summary').replace('%s', String(list.length))}
                        </Typography>
                        <Tooltip title={this.getText('screensaver_iconSelect_delete')}>
                            <IconButton
                                size="small"
                                onClick={() => this.set('iconSelect', undefined)}
                                data-ss="iconselect-delete"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : null}
            </Box>
        );
    }

    /**
     * an icon in a color: the icon is a mask, the color the fill
     *
     * @param src base64 icon
     * @param size pixels
     * @param color css color
     */
    static coloredIcon(src: string, size: number, color: string): React.JSX.Element {
        return (
            <Box
                sx={{
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

    /** the item as the place shows it */
    private renderPreview(): React.JSX.Element {
        const { draft, objUnit, objName } = this.state;
        const fields = screensaverItemFields(this.props.area);
        const kind = this.kind();
        const big = this.props.area === 'favorit';
        const unit = draft.unit ?? objUnit;
        const sample = 23.456 * (draft.factor ?? 1);
        const src = iconSrc(
            kind === 'number' && draft.iconSelect?.length
                ? ScreensaverItemDialog.iconForValue(draft.iconSelect, sample)
                : draft.iconOn,
        );
        let value = '';
        switch (kind) {
            case 'boolean':
                value = draft.textOn || this.getText('screensaver_item_preview_true');
                break;
            case 'date':
                value = this.dateSample(draft.dateFormat);
                break;
            case 'number': {
                value = `${sample.toFixed(draft.decimals ?? 1)}${unit ? ` ${unit}` : ''}`;
                break;
            }
            case 'other':
                value = 'Text';
                break;
            default:
                value = '';
        }
        const size = big ? 44 : 28;
        const inline = !!this.props.inline;
        return (
            <Box
                sx={{
                    width: inline ? 200 : big ? 150 : 120,
                    minHeight: inline ? 60 : big ? 110 : 90,
                    backgroundColor: '#000',
                    borderRadius: 1,
                    border: '4px solid #222',
                    display: 'flex',
                    flexDirection: inline ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: inline ? 'flex-start' : 'center',
                    gap: inline ? 1.5 : 0.5,
                    color: '#ddd',
                    fontSize: 12,
                    p: 1,
                    boxSizing: 'border-box',
                    flexShrink: 0,
                }}
            >
                {fields.headline && (
                    <Box
                        sx={{
                            color: '#bbb',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {draft.headline || objName || '…'}
                    </Box>
                )}
                {src ? (
                    ScreensaverItemDialog.coloredIcon(src, size, draft.colorOn || DEFAULT_ON)
                ) : (
                    <Box sx={{ width: size, height: size, borderRadius: '50%', border: '1px dashed #666' }} />
                )}
                {fields.value && kind !== 'unknown' && <Box>{value}</Box>}
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { open, area, index, count, item } = this.props;
        const { draft, objType, objUnit, objName, objRole, channelRole, objKind } = this.state;
        const roleText = channelRole
            ? `${objRole || '-'} (${this.getText('screensaver_item_channelRole').replace('%s', channelRole)})`
            : objRole || '-';
        const fields = screensaverItemFields(area);
        const kind = this.kind();
        const template = this.state.source === 'template';
        const roleDefaults = this.roleDefaults();
        const iconMissing = this.iconMissing();
        // state mode: the fields follow the type of the state; template mode: the template defines the look
        const known = !template && kind !== 'unknown';
        const visibility = template
            ? !!draft.template && (this.templateNeed() === 'none' || !!draft.state.trim())
            : known;
        return (
            <Dialog
                open={open}
                onClose={this.props.onClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {this.getText('screensaver_item_title')
                        .replace('%s', this.getText(`screensaver_area_${area}`))
                        .replace('%s', String(index + 1))
                        .replace('%s', String(count))}
                </DialogTitle>
                <DialogContent dividers>
                    {this.renderSourceSwitch()}
                    {template ? (
                        this.renderTemplateFields()
                    ) : (
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {this.renderStateField(
                                    this.getText('screensaver_item_state'),
                                    draft.state,
                                    (v: string) => {
                                        this.set('state', v);
                                        void this.loadObject(v);
                                    },
                                    'state',
                                )}
                                {objType === null && (
                                    <Alert
                                        severity="warning"
                                        sx={{ mb: 2 }}
                                    >
                                        {this.getText('screensaver_item_stateMissing').replace('%s', draft.state)}
                                    </Alert>
                                )}
                                {typeof objType === 'string' && objKind !== 'state' && (
                                    <Alert
                                        severity="warning"
                                        sx={{ mb: 2 }}
                                        data-ss="state-notstate"
                                    >
                                        {this.getText('screensaver_item_notState')
                                            .replace('%s', draft.state)
                                            .replace('%s', objKind || '-')}
                                    </Alert>
                                )}
                                {known && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block' }}
                                    >
                                        {this.getText('screensaver_item_stateInfo')
                                            .replace('%s', objName || '-')
                                            .replace('%s', objType || '-')
                                            .replace('%s', objUnit || '-')}
                                    </Typography>
                                )}
                                {known && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', mb: 2 }}
                                        data-ss="state-role"
                                    >
                                        {roleDefaults
                                            ? this.getText('screensaver_item_roleInfo')
                                                  .replace('%s', roleText)
                                                  .replace('%s', roleDefaults.iconOn || '-')
                                                  .replace('%s', roleDefaults.iconOff || '-')
                                            : this.getText('screensaver_item_roleNoDefault').replace('%s', roleText)}
                                    </Typography>
                                )}
                                {!known && objType !== null && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', mb: 2 }}
                                    >
                                        {this.getText('screensaver_item_pickState')}
                                    </Typography>
                                )}
                                {known &&
                                    fields.headline &&
                                    this.renderText('headline', 'screensaver_item_headline', objName, {
                                        minWidth: 300,
                                    })}
                            </Box>
                            {this.renderPreview()}
                        </Box>
                    )}

                    {known && (
                        <>
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 1 }}
                            >
                                {this.getText('screensaver_item_icons')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                {this.renderIconField(
                                    'iconOn',
                                    kind === 'boolean' ? 'screensaver_item_iconOn' : 'screensaver_item_icons',
                                )}
                                {kind === 'boolean' && this.renderIconField('iconOff', 'screensaver_item_iconOff')}
                            </Box>
                            {kind === 'number' && this.renderIconSelectSection()}
                            {iconMissing && (
                                <Alert
                                    severity="warning"
                                    sx={{ mb: 2 }}
                                    data-ss="icon-required"
                                >
                                    {this.getText('screensaver_item_iconRequired')}
                                </Alert>
                            )}
                            {this.renderColorSection()}
                        </>
                    )}

                    {known && fields.value && (kind === 'number' || kind === 'date') && (
                        <Box sx={{ mb: 1 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 1 }}
                            >
                                {this.getText('screensaver_item_value')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                {kind === 'number' &&
                                    this.renderText('unit', 'screensaver_item_unit', objUnit, { minWidth: 120 })}
                                {kind === 'number' && (
                                    <TextField
                                        variant="standard"
                                        type="number"
                                        label={this.getText('screensaver_item_factor')}
                                        value={draft.factor ?? ''}
                                        placeholder="1"
                                        onChange={e => this.setNumber('factor', e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any' } }}
                                        sx={{ mb: 2, mr: 2, width: 120 }}
                                    />
                                )}
                                {kind === 'number' && (
                                    <TextField
                                        variant="standard"
                                        type="number"
                                        label={this.getText('screensaver_item_decimals')}
                                        value={draft.decimals ?? ''}
                                        placeholder="1"
                                        onChange={e => this.setNumber('decimals', e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, max: 5 } }}
                                        sx={{ mb: 2, mr: 2, width: 140 }}
                                    />
                                )}
                                {kind === 'date' && this.renderDateFormat()}
                            </Box>
                        </Box>
                    )}

                    {known && fields.text && kind === 'boolean' && (
                        <Box sx={{ mb: 1 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 1 }}
                            >
                                {this.getText('screensaver_item_text')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                {this.renderText('textOn', 'screensaver_item_textOn')}
                                {this.renderText('textOff', 'screensaver_item_textOff')}
                            </Box>
                        </Box>
                    )}

                    {known && fields.action && this.renderActionSection()}

                    {visibility && this.props.expertMode && (
                        <Box sx={{ mb: 1 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 1 }}
                            >
                                {this.getText('screensaver_item_visibility')}
                            </Typography>
                            {this.renderStateField(
                                this.getText('screensaver_item_enabled'),
                                draft.enabled ?? '',
                                v => this.set('enabled', v),
                                'enabled',
                            )}
                            {this.renderText('visibleCondition', 'screensaver_item_visibleCondition', 'val > 0', {
                                minWidth: 300,
                            })}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {item && (
                        <Button
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={this.props.onDelete}
                        >
                            {this.getText('screensaver_slot_delete')}
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={this.props.onClose}>{this.getText('Cancel1')}</Button>
                    <Button
                        variant="contained"
                        disabled={this.blocked()}
                        onClick={this.apply}
                    >
                        {this.getText('screensaver_apply')}
                    </Button>
                </DialogActions>

                <ScreensaverIconSelectDialog
                    ref={this.iconSelectDialogRef}
                    getText={this.props.getText}
                    oContext={this.props.oContext}
                    themeName={this.props.themeName}
                    onSave={list => this.set('iconSelect', list)}
                />
                <ChannelColorDialog
                    ref={this.colorDialogRef}
                    socket={this.props.oContext?.socket}
                    channelRole={null}
                    isNavigation={false}
                    roleDefaults={roleDefaults}
                    trueColor={draft.colorOn ?? DEFAULT_ON}
                    falseColor={draft.colorOff ?? DEFAULT_OFF}
                    onSave={cfg => {
                        const d = { ...this.state.draft };
                        if (cfg.scale && 'val_min' in cfg.scale) {
                            d.colorScale = cfg.scale;
                        }
                        if (cfg.trueColor) {
                            d.colorOn = cfg.trueColor;
                        }
                        if (cfg.falseColor) {
                            d.colorOff = cfg.falseColor;
                        }
                        this.setState({ draft: d });
                    }}
                />
            </Dialog>
        );
    }
}
