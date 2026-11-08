/**
 * Dialog of one item on a place of the screensaver. The fields follow the place
 * (screensaverItemFields): bottom shows headline, icon and value, left/favorit/alternate icon and
 * value, an indicator the icon only and can act as a button. A preview at the top draws the item
 * like the place in the mock.
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
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import PaletteIcon from '@mui/icons-material/Palette';
import TuneIcon from '@mui/icons-material/Tune';
import { EntitySelector } from './EntitySelector';
import { TemplateSelector } from './TemplateSelector';
import { applyTemplateChoice, pageItemTemplateInfoOf } from '../templateList';
import RawItemConfigDialog, { RawItemButton, RawItemNotice, type RawItemValue } from './RawItemConfigDialog';
import ChannelColorDialog from './ChannelColorDialog';
import ScreensaverCycleValuesDialog from './ScreensaverCycleValuesDialog';
import ScreensaverIconSelectDialog from './ScreensaverIconSelectDialog';
import IconSelect from '../IconSelect';
import icons from '../icons.json';
import {
    type ScreensaverArea,
    type ScreensaverMode,
    type ScreensaverItemAction,
    type ScreensaverItemConfig,
    type IconColorElement,
    type ScreensaverItemSource,
    type PageItemTemplateInfo,
    type ScreensaverTemplateNeed,
    isRawItemObject,
    screensaverChannelIdOf,
    screensaverDateFormats,
    screensaverItemFields,
    screensaverItemHasIconFont,
    screensaverItemSource,
} from '../../../src/lib/types/adminShareConfig';
import { textSizeLabel, textSizeOfOption, textSizeOptions } from '../textSizeOptions';
import {
    getScreensaverItemDefaultsByRole,
    getShutterIconByPosition,
    isScreensaverBlindPosition,
    pageItemDefaults,
    type PageItemRoleDefaults,
} from '../../../src/lib/const/page-item-defaults';
import { Color, type ColorThemenInterface } from '../../../src/lib/const/Color';
import { loadAdapterColorTheme, themeColorHex } from '../adapterColorTheme';
import { screensaverItemToScript } from '../../../src/lib/configuration/admin-screensaver-item';
import { cycleValueToState } from '../../../src/lib/const/screensaver-cycle';

export interface ScreensaverItemDialogProps {
    open: boolean;
    area: ScreensaverArea;
    /** mode of the screensaver - the font of the icon field is offered for `tiles` only */
    mode?: ScreensaverMode;
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
    templates?: PageItemTemplateInfo[];
    /** unique ids of the trash pages of the configuration */
    trashPages?: readonly string[];
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
    /** the state of a button / switch / cycle action: type, common.write and common.type; null = not found, undefined = not checked */
    actionObj: { kind: string; write: boolean; type: string } | null | undefined;
    /** the state the color comes from: type; null = not found, undefined = not checked */
    colorObj: { kind: string } | null | undefined;
    colorMode: 'fixed' | 'scale' | 'state';
    /** radio at the top: one state with own fields or a page item template */
    source: ScreensaverItemSource;
    /** color theme of the adapter - the default colors of the item */
    colorTheme: ColorThemenInterface;
}

let iconMap: Map<string, string> | null = null;

/**
 * base64 source of an icon of the icon list
 *
 * @param name icon name
 */
export function iconSrc(name: string | undefined): string {
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

export class ScreensaverItemDialog extends React.Component<ScreensaverItemDialogProps, ScreensaverItemDialogState> {
    private colorDialogRef = React.createRef<ChannelColorDialog>();
    private iconSelectDialogRef = React.createRef<ScreensaverIconSelectDialog>();
    private cycleValuesDialogRef = React.createRef<ScreensaverCycleValuesDialog>();
    private rawDialogRef = React.createRef<RawItemConfigDialog>();

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
            colorTheme: Color.defaultTheme,
        };
    }

    componentDidUpdate(prev: ScreensaverItemDialogProps): void {
        if (this.props.open && !prev.open) {
            void this.loadColorTheme();
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

    private async loadColorTheme(): Promise<void> {
        const { oContext } = this.props;
        this.setState({
            colorTheme: await loadAdapterColorTheme(oContext?.socket, oContext?.adapterName, oContext?.instance),
        });
    }

    /**
     * keys of the colors the adapter uses for an item without own colors (config manager getEntityData):
     * those of a blind for its position, else on/off - the role colors do not count on the screensaver
     *
     * @returns keys in the color theme
     */
    private defaultColorKeys(): Pick<PageItemRoleDefaults, 'colorOn' | 'colorOff'> {
        return this.blindPosition() ? pageItemDefaults.blind : { colorOn: 'on', colorOff: 'off' };
    }

    /**
     * default color of the item as hex color
     *
     * @param field on or off color
     * @returns hex color from the color theme
     */
    private defaultColor(field: 'colorOn' | 'colorOff'): string {
        const theme = this.state.colorTheme;
        return themeColorHex(theme, this.defaultColorKeys()[field], field === 'colorOn' ? theme.on : theme.off);
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
            // the position of a blind needs no icon - without one the icon follows the position
            const blind =
                objKind === 'state' &&
                isScreensaverBlindPosition(objRole, channelRole, String(obj?.common?.type ?? ''));
            this.setState(prev => {
                const draft = { ...prev.draft };
                if (defaults && !blind && !draft.iconOn && !draft.iconSelect?.length) {
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
     * reads type, common.write and common.type of the state a button / switch / cycle action writes to
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
                actionObj: obj
                    ? {
                          kind: String(obj.type ?? ''),
                          write: obj.common?.write === true,
                          type: String(obj.common?.type ?? ''),
                      }
                    : null,
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

    /** the state is the position of a blind (level.blind / value.blind or a number of a `blind` channel) */
    private blindPosition(): boolean {
        const { objKind, objRole, channelRole, objType } = this.state;
        return objKind === 'state' && isScreensaverBlindPosition(objRole, channelRole, objType ?? undefined);
    }

    /** a blind without icons: the adapter shows the icon by position (5 icons from closed to open) */
    private blindPositionIcons(): boolean {
        const { draft } = this.state;
        return this.blindPosition() && !draft.iconOn && !draft.iconOff && !draft.iconSelect?.length;
    }

    /** a state item needs an icon (or an icon list) - the panel cannot draw an item without */
    private iconMissing(): boolean {
        const { draft } = this.state;
        return (
            this.state.source === 'state' &&
            this.kind() !== 'unknown' &&
            !draft.iconOn &&
            !draft.iconSelect?.length &&
            !this.blindPositionIcons()
        );
    }

    /**
     * why the item cannot be applied yet: the state of a state item must exist and be a state with an
     * icon, the state of a button / switch / cycle action must exist and be writable; a template needs its
     * name and - if it searches states - its object
     */
    private blocked(): boolean {
        const { draft, objType, objKind } = this.state;
        if (draft.raw) {
            // a raw item needs no state, the raw data are complete in themselves
            return false;
        }
        if (this.state.source === 'template') {
            return (
                !draft.template || (this.templateNeed() === 'channel' && !draft.state.trim()) || this.actionBlocked()
            );
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
        return this.actionBlocked();
    }

    /**
     * the state of a button / switch / cycle action must exist and be writable; a cycle needs a state and values
     * that fit the type of the state
     */
    private actionBlocked(): boolean {
        const { draft, actionObj } = this.state;
        const action = draft.action;
        if (!screensaverItemFields(this.props.area).action || !action) {
            return false;
        }
        if (action.kind === 'cycle' && (!action.values?.length || !action.state?.trim() || this.cycleValueInvalid())) {
            return true;
        }
        if ((action.kind === 'button' || action.kind === 'switch' || action.kind === 'cycle') && action.state?.trim()) {
            return !actionObj || actionObj.kind !== 'state' || !actionObj.write;
        }
        return false;
    }

    /** a value of the cycle does not fit the type of its state - unknown state: not decided yet */
    private cycleValueInvalid(): boolean {
        const { draft, actionObj } = this.state;
        return !!actionObj && !!draft.action?.values?.some(value => cycleValueToState(value, actionObj.type) === null);
    }

    /**
     * the action of the draft as it is stored
     *
     * @returns the action, undefined when the place has none or the state / page is missing
     */
    private completeAction(): ScreensaverItemAction | undefined {
        const action = this.state.draft.action;
        if (
            !screensaverItemFields(this.props.area).action ||
            !action ||
            (action.kind !== 'navigate' && !action.state) ||
            (action.kind === 'navigate' && !action.page) ||
            (action.kind === 'cycle' && !action.values?.length)
        ) {
            return undefined;
        }
        return action;
    }

    /**
     * the warning of a button / switch / cycle action whose state is missing, no state or read-only
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

    private handleRawOpen = (): void => {
        if (this.state.draft.raw) {
            this.rawDialogRef.current?.openWith(this.state.draft.raw);
            return;
        }
        // standard item: the dialog starts with the script element the adapter builds from the fields
        this.rawDialogRef.current?.openWith(this.rawSuggestion(), false);
    };

    /** the script element of the standard fields as raw data (format script), undefined while they are incomplete */
    private rawSuggestion(): RawItemValue | undefined {
        const item = this.buildStandardItem();
        if (!item) {
            return undefined;
        }
        const { objName, objRole, channelRole, objType } = this.state;
        const element = screensaverItemToScript(item, this.props.area, {
            name: objName || undefined,
            role: objRole || undefined,
            channelRole: channelRole || undefined,
            type: objType || undefined,
        });
        // JSON round trip: fields without a value (undefined) are left out of the text
        const config: unknown = JSON.parse(JSON.stringify(element));
        return isRawItemObject(config) ? { format: 'script', config } : undefined;
    }

    private handleRawApply = (raw: RawItemValue): void => {
        this.setState({ draft: { ...this.state.draft, raw } });
    };

    private handleRawRemove = (): void => {
        const draft = { ...this.state.draft };
        delete draft.raw;
        this.setState({ draft });
    };

    private apply = (): void => {
        const { raw } = this.state.draft;
        const standard = this.buildStandardItem();
        if (raw) {
            // raw item: the raw data alone count at runtime - the standard fields are kept for "back to standard"
            const kept: ScreensaverItemConfig = standard ?? {
                ...this.state.draft,
                state: this.state.draft.state ?? '',
            };
            delete kept.raw;
            this.props.onSave({ ...kept, raw });
            return;
        }
        if (standard) {
            this.props.onSave(standard);
        }
    };

    /**
     * the item from the standard fields of the dialog, regardless of the raw mode
     *
     * @returns the item to store, null while the fields are incomplete (no state / no template)
     */
    private buildStandardItem(): ScreensaverItemConfig | null {
        const draft = { ...this.state.draft };
        delete draft.raw;
        draft.state = (draft.state ?? '').trim();
        if (this.state.source === 'template') {
            // the template brings icon, colors and texts - only what the script's template element knows is kept
            if (!draft.template || (this.templateNeed() === 'channel' && !draft.state)) {
                return null;
            }
            const kept: ScreensaverItemConfig = { state: draft.state, template: draft.template };
            if (draft.enabled) {
                kept.enabled = draft.enabled;
            }
            if (draft.visibleCondition) {
                kept.visibleCondition = draft.visibleCondition;
            }
            if (draft.readOptions && Object.keys(draft.readOptions).length > 0) {
                kept.readOptions = draft.readOptions;
            }
            const action = this.completeAction();
            if (action) {
                kept.action = action;
            }
            if (draft.iconTextSize !== undefined) {
                kept.iconTextSize = draft.iconTextSize;
            }
            return kept;
        }
        if (!draft.state) {
            return null;
        }
        delete draft.template;
        delete draft.readOptions;
        switch (this.state.colorMode) {
            case 'scale':
                // colorOn / colorOff are the ends of the scale, empty = default color of the theme
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
            // a number with a scale: colorOff is the color of the lower end
            if (kind !== 'number' || this.state.colorMode !== 'scale') {
                delete draft.colorOff;
            }
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
        if (!this.completeAction()) {
            delete draft.action;
        }
        return draft;
    }

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
            delete draft.readOptions;
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
    private selectedTemplate(): PageItemTemplateInfo | null {
        return pageItemTemplateInfoOf(this.props.templates, this.state.draft.template);
    }

    private templateNeed(): ScreensaverTemplateNeed {
        return this.selectedTemplate()?.need ?? 'channel';
    }

    /**
     * the template changes: its options belong to the old template; a template that needs no object drops
     * the old one - an unknown template (adapter offline) counts as `channel` and keeps it
     *
     * @param name name of the new template
     * @param readOptions options the chosen list entry comes with
     */
    private handleTemplateChange = (name: string | undefined, readOptions?: Record<string, string | number>): void => {
        const draft = applyTemplateChoice(this.state.draft, this.props.templates, name, readOptions);
        const dropObject = !!this.state.draft.state && !draft.state;
        this.setState({ draft });
        if (dropObject) {
            // also forgets what was read of the old object
            void this.loadObject('');
        }
    };

    /**
     * the object of the template changes
     *
     * @param id object id
     */
    private handleTemplateObjectChange = (id: string): void => {
        // not this.set: it removes a field with an empty value, the state has to stay a text
        this.setState({ draft: { ...this.state.draft, state: id } });
        void this.loadObject(id);
    };

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
    /**
     * font of the icon field - the screensaver `tiles` only, area indicator: only icon fonts are
     * offered, a stored other font stays in the list
     */
    private renderIconFontField(): React.JSX.Element | null {
        if (!screensaverItemHasIconFont(this.props.mode, this.props.area)) {
            return null;
        }
        const current = this.state.draft.iconTextSize;
        return (
            <FormControl
                variant="standard"
                sx={{ minWidth: 260, mb: 2 }}
                data-ss="icon-font"
            >
                <InputLabel shrink>{this.getText('screensaver_item_iconFont')}</InputLabel>
                <Select
                    value={current !== undefined ? String(current) : ''}
                    displayEmpty
                    onChange={e => this.set('iconTextSize', textSizeOfOption(String(e.target.value)))}
                >
                    {textSizeOptions(current, false).map(opt => (
                        <MenuItem
                            key={opt}
                            value={opt}
                        >
                            {textSizeLabel(opt, key => this.getText(key))}
                        </MenuItem>
                    ))}
                </Select>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {this.getText('screensaver_item_iconFontHint')}
                </Typography>
            </FormControl>
        );
    }

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
                            this.defaultColor('colorOn'),
                        )}
                        {kind === 'boolean' &&
                            this.renderColorField(
                                'colorOff',
                                'screensaver_item_colorOff',
                                this.defaultColor('colorOff'),
                            )}
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PaletteIcon />}
                            onClick={() =>
                                this.colorDialogRef.current?.openWith({
                                    trueColor: draft.colorOn ?? '',
                                    falseColor: draft.colorOff ?? '',
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
                            if (v === 'none') {
                                this.set('action', undefined);
                                return;
                            }
                            const next: ScreensaverItemAction = { ...action, kind: v as ScreensaverItemAction['kind'] };
                            if (next.kind !== 'cycle') {
                                delete next.values;
                            }
                            this.set('action', next);
                        }}
                    >
                        <MenuItem value="none">{this.getText('screensaver_item_action_none')}</MenuItem>
                        <MenuItem value="button">{this.getText('screensaver_item_action_button')}</MenuItem>
                        <MenuItem value="switch">{this.getText('screensaver_item_action_switch')}</MenuItem>
                        <MenuItem value="cycle">{this.getText('screensaver_item_action_cycle')}</MenuItem>
                        <MenuItem value="navigate">{this.getText('screensaver_item_action_navigate')}</MenuItem>
                    </Select>
                </FormControl>
                {kind === 'button' || kind === 'switch' || kind === 'cycle'
                    ? this.renderStateField(
                          this.getText(
                              kind === 'button' || kind === 'cycle'
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
                {(kind === 'button' || kind === 'switch' || kind === 'cycle') && this.renderActionStateWarning(action)}
                {kind === 'cycle' && this.renderCycleValues(action)}
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
     * the values of a cycle action: a button opens the list, the list is shown in its order
     *
     * @param action action of the item
     */
    private renderCycleValues(action: ScreensaverItemAction): React.JSX.Element {
        const values = action.values ?? [];
        return (
            <Box sx={{ mb: 2 }}>
                <Box
                    sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
                    data-ss="cycle-values"
                >
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<TuneIcon />}
                        onClick={() => this.cycleValuesDialogRef.current?.openWith(values, this.state.actionObj?.type)}
                    >
                        {this.getText('screensaver_cycle_edit')}
                    </Button>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        data-ss="cycle-preview"
                    >
                        {values.length ? `${values.join(' → ')} ↺` : this.getText('screensaver_cycle_none')}
                    </Typography>
                </Box>
                {this.cycleValueInvalid() && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                        data-ss="cycle-invalid"
                    >
                        {this.getText('screensaver_cycle_invalid').replace('%s', this.state.actionObj?.type || '-')}
                    </Alert>
                )}
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
     * icon per value range of a number state: a button opens the list, an existing list is shown and can be removed
     */
    private renderIconSelectSection(): React.JSX.Element | null {
        const list = this.state.draft.iconSelect;
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
        // the position of a blind: shown in %, half open as sample
        const blind = this.blindPosition();
        const unit = draft.unit ?? (blind ? '%' : objUnit);
        const sample = blind ? 50 : 23.456 * (draft.factor ?? 1);
        const src = iconSrc(
            kind === 'number' && draft.iconSelect?.length
                ? ScreensaverItemDialog.iconForValue(draft.iconSelect, sample)
                : this.blindPositionIcons()
                  ? getShutterIconByPosition(sample)
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
                value = `${sample.toFixed(draft.decimals ?? (blind ? 0 : 1))}${unit ? ` ${unit}` : ''}`;
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
                    ScreensaverItemDialog.coloredIcon(src, size, draft.colorOn || this.defaultColor('colorOn'))
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
        // raw item: the raw data alone count - no field of the dialog is shown
        const known = !draft.raw && !template && kind !== 'unknown';
        // a template becomes a button on the indicator - not one the place does not offer (number, light, shutter)
        const templateActs = !draft.raw && template && !!this.selectedTemplate()?.areas.includes(area);
        const visibility = draft.raw
            ? false
            : template
              ? !!draft.template && (this.templateNeed() === 'none' || !!draft.state.trim())
              : known;
        return (
            <Dialog
                open={open}
                onClose={this.props.onClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                        {this.getText('screensaver_item_title')
                            .replace('%s', this.getText(`screensaver_area_${area}`))
                            .replace('%s', String(index + 1))
                            .replace('%s', String(count))}
                    </Box>
                    <RawItemButton
                        active={!!draft.raw}
                        onClick={this.handleRawOpen}
                    />
                </DialogTitle>
                <DialogContent dividers>
                    {draft.raw ? null : this.renderSourceSwitch()}
                    {draft.raw ? (
                        <RawItemNotice
                            value={draft.raw}
                            onEdit={this.handleRawOpen}
                        />
                    ) : template ? (
                        <>
                            <TemplateSelector
                                templates={this.props.templates}
                                template={draft.template}
                                objectId={draft.state}
                                readOptions={draft.readOptions}
                                area={area}
                                trashPages={this.props.trashPages}
                                onTemplateChange={this.handleTemplateChange}
                                onObjectChange={this.handleTemplateObjectChange}
                                onReadOptionsChange={v => this.set('readOptions', v)}
                                getText={this.props.getText}
                                lang={this.lang()}
                                socket={this.props.oContext?.socket}
                                theme={this.props.theme}
                                themeType={
                                    this.props.oContext?.themeType ?? (this.props.theme?.palette?.mode || 'light')
                                }
                                dialogName="selectScreensaverItem_dpInit"
                            />
                            {draft.template && this.renderIconFontField()}
                        </>
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
                            {this.renderIconFontField()}
                            {kind === 'number' && this.renderIconSelectSection()}
                            {this.blindPosition() && (
                                <Alert
                                    severity="info"
                                    sx={{ mb: 2 }}
                                    data-ss="blind-position"
                                >
                                    {this.getText(
                                        this.blindPositionIcons()
                                            ? 'screensaver_item_blindPositionIcons'
                                            : 'screensaver_item_blindPosition',
                                    )}
                                </Alert>
                            )}
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

                    {fields.action && (known || templateActs) && this.renderActionSection()}

                    {visibility && (
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

                <RawItemConfigDialog
                    ref={this.rawDialogRef}
                    kind="screensaverItem"
                    themeType={
                        this.props.oContext?.themeType ??
                        (this.props.theme?.palette?.mode === 'dark' ? 'dark' : 'light')
                    }
                    onApply={this.handleRawApply}
                    onRemove={this.handleRawRemove}
                />
                <ScreensaverIconSelectDialog
                    ref={this.iconSelectDialogRef}
                    getText={this.props.getText}
                    oContext={this.props.oContext}
                    themeName={this.props.themeName}
                    onSave={list => this.set('iconSelect', list)}
                />
                <ScreensaverCycleValuesDialog
                    ref={this.cycleValuesDialogRef}
                    getText={this.props.getText}
                    onSave={values => {
                        const current = this.state.draft.action;
                        if (current) {
                            this.set('action', { ...current, values });
                        }
                    }}
                />
                <ChannelColorDialog
                    ref={this.colorDialogRef}
                    socket={this.props.oContext?.socket}
                    adapterName={this.props.oContext?.adapterName}
                    instance={this.props.oContext?.instance}
                    channelRole={null}
                    isNavigation={false}
                    roleDefaults={this.defaultColorKeys()}
                    trueColor={draft.colorOn ?? ''}
                    falseColor={draft.colorOff ?? ''}
                    onSave={cfg => {
                        const d = { ...this.state.draft };
                        if (cfg.scale && 'val_min' in cfg.scale) {
                            d.colorScale = cfg.scale;
                        }
                        // empty = default color of the dialog, also after a reset there
                        if (cfg.trueColor) {
                            d.colorOn = cfg.trueColor;
                        } else {
                            delete d.colorOn;
                        }
                        if (cfg.falseColor) {
                            d.colorOff = cfg.falseColor;
                        } else {
                            delete d.colorOff;
                        }
                        this.setState({ draft: d });
                    }}
                />
            </Dialog>
        );
    }
}
