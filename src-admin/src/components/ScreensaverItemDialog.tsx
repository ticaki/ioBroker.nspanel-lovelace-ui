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
import { EntitySelector } from './EntitySelector';
import ChannelColorDialog from './ChannelColorDialog';
import IconSelect from '../IconSelect';
import icons from '../icons.json';
import {
    type ScreensaverArea,
    type ScreensaverItemAction,
    type ScreensaverItemConfig,
    type IconColorElement,
    screensaverDateFormats,
    screensaverItemFields,
} from '../../../src/lib/types/adminShareConfig';

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
}

interface ScreensaverItemDialogState {
    draft: ScreensaverItemConfig;
    /** common.type of the state, null = not found, undefined = not checked */
    objType: string | null | undefined;
    objUnit: string;
    objName: string;
    objRole: string;
    colorMode: 'fixed' | 'scale';
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

    constructor(props: ScreensaverItemDialogProps) {
        super(props);
        this.state = {
            draft: { state: '' },
            objType: undefined,
            objUnit: '',
            objName: '',
            objRole: '',
            colorMode: 'fixed',
        };
    }

    componentDidUpdate(prev: ScreensaverItemDialogProps): void {
        if (this.props.open && !prev.open) {
            const draft: ScreensaverItemConfig = this.props.item ? structuredClone(this.props.item) : { state: '' };
            this.setState({ draft, colorMode: draft.colorScale ? 'scale' : 'fixed', objType: undefined }, () => {
                void this.loadObject(draft.state);
            });
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
            this.setState({ objType: undefined, objUnit: '', objName: '', objRole: '' });
            return;
        }
        try {
            const obj: ioBroker.Object | null | undefined = await this.props.oContext?.socket?.getObject(trimmed);
            if (this.state.draft.state.trim() !== trimmed) {
                return;
            }
            this.setState({
                objType: obj ? String(obj.common?.type ?? '') : null,
                objUnit: obj ? String(obj.common?.unit ?? '') : '',
                objName: objectName(obj, this.lang()),
                objRole: obj ? String(obj.common?.role ?? '') : '',
            });
        } catch {
            this.setState({ objType: null, objUnit: '', objName: '', objRole: '' });
        }
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
        if (!draft.state.trim()) {
            return;
        }
        draft.state = draft.state.trim();
        if (this.state.colorMode === 'scale') {
            delete draft.colorOn;
            delete draft.colorOff;
        } else {
            delete draft.colorScale;
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
        const { objType, objRole } = this.state;
        if (typeof objType !== 'string') {
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

    // ---------- fields ----------

    private renderStateField(
        label: string,
        value: string,
        onChange: (v: string) => void,
        name: string,
        filter: (obj: ioBroker.Object) => boolean = isState,
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

    private renderColorSection(): React.JSX.Element {
        const { draft, colorMode } = this.state;
        const kind = this.kind();
        if (kind !== 'number') {
            return (
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
                    {this.renderColorField(
                        'colorOn',
                        kind === 'boolean' ? 'screensaver_item_colorOn' : 'screensaver_item_color',
                        DEFAULT_ON,
                    )}
                    {kind === 'boolean' && this.renderColorField('colorOff', 'screensaver_item_colorOff', DEFAULT_OFF)}
                </Box>
            );
        }
        return (
            <Box sx={{ mb: 2 }}>
                <FormControl component="fieldset">
                    <FormLabel component="legend">{this.getText('screensaver_item_color')}</FormLabel>
                    <RadioGroup
                        row
                        value={colorMode}
                        onChange={e => this.setState({ colorMode: e.target.value === 'scale' ? 'scale' : 'fixed' })}
                    >
                        <FormControlLabel
                            value="fixed"
                            control={<Radio />}
                            label={this.getText('screensaver_item_colorFixed')}
                        />
                        <FormControlLabel
                            value="scale"
                            control={<Radio />}
                            label={this.getText('screensaver_item_colorScale')}
                        />
                    </RadioGroup>
                </FormControl>
                {colorMode === 'fixed' ? (
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {this.renderColorField('colorOn', 'screensaver_item_color', DEFAULT_ON)}
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
                          v => this.set('action', { ...action, state: v }),
                          'action',
                          isWritableState,
                      )
                    : null}
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
        const src = iconSrc(draft.iconOn);
        const unit = draft.unit ?? objUnit;
        let value = '';
        switch (kind) {
            case 'boolean':
                value = draft.textOn || this.getText('screensaver_item_preview_true');
                break;
            case 'date':
                value = this.dateSample(draft.dateFormat);
                break;
            case 'number': {
                const sample = 23.456 * (draft.factor ?? 1);
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
        const { draft, objType, objUnit, objName } = this.state;
        const fields = screensaverItemFields(area);
        const kind = this.kind();
        const known = kind !== 'unknown';
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
                            {known && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mb: 2 }}
                                >
                                    {this.getText('screensaver_item_stateInfo')
                                        .replace('%s', objName || '-')
                                        .replace('%s', objType || '-')
                                        .replace('%s', objUnit || '-')}
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
                                this.renderText('headline', 'screensaver_item_headline', objName, { minWidth: 300 })}
                        </Box>
                        {this.renderPreview()}
                    </Box>

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

                    {known && this.props.expertMode && (
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
                    {kind === 'number' && draft.iconSelect?.length ? (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {this.getText('screensaver_item_iconSelectKept').replace(
                                '%s',
                                String(draft.iconSelect.length),
                            )}
                        </Typography>
                    ) : null}
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
                        disabled={!draft.state.trim()}
                        onClick={this.apply}
                    >
                        {this.getText('screensaver_apply')}
                    </Button>
                </DialogActions>

                <ChannelColorDialog
                    ref={this.colorDialogRef}
                    socket={this.props.oContext?.socket}
                    channelRole={null}
                    isNavigation={false}
                    roleDefaults={null}
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
