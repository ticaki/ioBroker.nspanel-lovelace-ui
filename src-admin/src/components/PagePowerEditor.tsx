import React from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import { EntitySelector } from './EntitySelector';
import IconSelect from '../IconSelect';
import {
    ADAPTER_NAME,
    type PowerEntry,
    type PowerSlotConfig,
    type PowerHomeTopConfig,
    type PowerHomeBotConfig,
    emptyPowerSlot,
} from '../../../src/lib/types/adminShareConfig';

type SlotKey = 'leftTop' | 'leftMiddle' | 'leftBottom' | 'rightTop' | 'rightMiddle' | 'rightBottom';

const SLOT_KEYS: SlotKey[] = ['leftTop', 'leftMiddle', 'leftBottom', 'rightTop', 'rightMiddle', 'rightBottom'];
const SLOT_INDICES: Record<SlotKey, number> = {
    leftTop: 1,
    leftMiddle: 2,
    leftBottom: 3,
    rightTop: 4,
    rightMiddle: 5,
    rightBottom: 6,
};

export interface PagePowerEditorProps {
    entry: PowerEntry;
    onEntryChange: (updated: PowerEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
}

type EditingTarget =
    | { kind: 'slot'; slot: SlotKey }
    | { kind: 'homeTop' }
    | { kind: 'homeBot' }
    | null;

interface PagePowerEditorState {
    alive: boolean;
    editing: EditingTarget;
}

export class PagePowerEditor extends React.Component<PagePowerEditorProps, PagePowerEditorState> {
    private readonly emptyCommon: Record<string, any> = {};

    constructor(props: PagePowerEditorProps) {
        super(props);
        this.state = {
            alive: false,
            editing: null,
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
            console.error('[PagePowerEditor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
    }

    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const isAlive = state ? !!state.val : false;
        if (isAlive !== this.state.alive) {
            this.setState({ alive: isAlive });
        }
    };

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private updateEntry(patch: Partial<PowerEntry>): void {
        this.props.onEntryChange({ ...this.props.entry, ...patch });
    }

    private updateSlot(slot: SlotKey, patch: Partial<PowerSlotConfig>): void {
        const current = this.props.entry[slot] ?? emptyPowerSlot();
        this.updateEntry({ [slot]: { ...current, ...patch } } as Partial<PowerEntry>);
    }

    private updateHomeTop(patch: Partial<PowerHomeTopConfig>): void {
        const current = this.props.entry.homeTop ?? {};
        this.updateEntry({ homeTop: { ...current, ...patch } });
    }

    private updateHomeBot(patch: Partial<PowerHomeBotConfig>): void {
        const current = this.props.entry.homeBot ?? {};
        this.updateEntry({ homeBot: { ...current, ...patch } });
    }

    private renderSlotPaper(slot: SlotKey): React.JSX.Element {
        const entry = this.props.entry;
        const data = entry[slot] ?? emptyPowerSlot();
        const idx = SLOT_INDICES[slot];
        const label = `${this.getText('power')} ${idx}`;
        const empty = !data.state && !data.entityHeadline && !data.icon;

        return (
            <Paper
                key={slot}
                elevation={2}
                onClick={() => this.setState({ editing: { kind: 'slot', slot } })}
                sx={{
                    p: 1.5,
                    minHeight: 90,
                    cursor: this.state.alive ? 'pointer' : 'not-allowed',
                    opacity: this.state.alive ? 1 : 0.5,
                    border: empty ? '1px dashed' : '1px solid',
                    borderColor: empty ? 'divider' : 'primary.light',
                    '&:hover': { borderColor: 'primary.main' },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <EditIcon fontSize="small" color="action" />
                </Box>
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {data.entityHeadline || this.getText('power_slot_empty')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        {data.state || ''}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    private renderHomeTopPaper(): React.JSX.Element {
        const data = this.props.entry.homeTop ?? {};
        const empty = !data.state;
        return (
            <Paper
                elevation={2}
                onClick={() => this.setState({ editing: { kind: 'homeTop' } })}
                sx={{
                    p: 1.5,
                    minHeight: 90,
                    cursor: this.state.alive ? 'pointer' : 'not-allowed',
                    opacity: this.state.alive ? 1 : 0.5,
                    border: empty ? '1px dashed' : '1px solid',
                    borderColor: empty ? 'divider' : 'primary.light',
                    '&:hover': { borderColor: 'primary.main' },
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">{this.getText('power_home_top')}</Typography>
                    <EditIcon fontSize="small" color="action" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {data.state || this.getText('power_slot_empty')}
                </Typography>
            </Paper>
        );
    }

    private renderHomeBotPaper(): React.JSX.Element {
        const data = this.props.entry.homeBot ?? {};
        const isInternal = !!data.selInternalCalculation;
        const empty = !data.state && !isInternal;
        return (
            <Paper
                elevation={2}
                onClick={() => this.setState({ editing: { kind: 'homeBot' } })}
                sx={{
                    p: 1.5,
                    minHeight: 90,
                    cursor: this.state.alive ? 'pointer' : 'not-allowed',
                    opacity: this.state.alive ? 1 : 0.5,
                    border: empty ? '1px dashed' : '1px solid',
                    borderColor: empty ? 'divider' : 'primary.light',
                    '&:hover': { borderColor: 'primary.main' },
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">{this.getText('power_home_bot')}</Typography>
                    <EditIcon fontSize="small" color="action" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {isInternal
                        ? this.getText('power_internal_calculation')
                        : data.state || this.getText('power_slot_empty')}
                </Typography>
            </Paper>
        );
    }

    private renderSlotDialog(slot: SlotKey): React.JSX.Element {
        const data = this.props.entry[slot] ?? emptyPowerSlot();
        const { oContext, theme } = this.props;

        return (
            <Dialog
                open
                onClose={() => this.setState({ editing: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {`${this.getText('power_slot_edit')}: ${this.getText('power')} ${SLOT_INDICES[slot]}`}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                        <TextField
                            fullWidth
                            variant="standard"
                            label={this.getText('power_entityHeadline')}
                            value={data.entityHeadline ?? ''}
                            onChange={e => this.updateSlot(slot, { entityHeadline: e.target.value })}
                        />
                        <IconSelect
                            oContext={oContext}
                            alive={this.state.alive}
                            changed={false}
                            themeName={theme?.palette?.mode === 'dark' ? 'dark' : 'light'}
                            common={this.emptyCommon}
                            attr="icon"
                            data={{ icon: data.icon ?? '' }}
                            originalData={{ icon: data.icon ?? '' }}
                            onError={(): void => {}}
                            schema={{
                                type: 'custom',
                                name: 'IconSelect',
                                url: '',
                                label: 'power_icon',
                                i18n: true,
                            }}
                            custom
                            onChange={(attrOrData: string | Record<string, any>, val?: unknown, cb?: () => void): void => {
                                const newIcon =
                                    typeof attrOrData === 'string'
                                        ? typeof val === 'string' ? val : ''
                                        : typeof attrOrData.icon === 'string' ? attrOrData.icon : '';
                                this.updateSlot(slot, { icon: newIcon });
                                if (cb) cb();
                            }}
                            theme={theme}
                        />
                        <Box sx={{ gridColumn: '1 / span 2' }}>
                            <EntitySelector
                                label={this.getText('powerState')}
                                value={data.state ?? ''}
                                onChange={(v: string) => this.updateSlot(slot, { state: v })}
                                socket={oContext.socket}
                                theme={theme}
                                themeType={theme?.palette?.mode || 'light'}
                                dialogName="selectState"
                                filterFunc={(obj: ioBroker.Object) =>
                                    !!(obj && obj.type === 'state' && obj.common && obj.common.type === 'number')
                                }
                                disabled={!this.state.alive}
                            />
                        </Box>
                        <FormControl variant="standard" fullWidth>
                            <InputLabel>{this.getText('power_decimal')}</InputLabel>
                            <Select
                                value={data.valueDecimal ?? 0}
                                onChange={e => this.updateSlot(slot, { valueDecimal: Number(e.target.value) })}
                            >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl variant="standard" fullWidth>
                            <InputLabel>{this.getText('power_unit')}</InputLabel>
                            <Select
                                value={data.valueUnit ?? 'W'}
                                onChange={e => this.updateSlot(slot, { valueUnit: e.target.value as string })}
                            >
                                <MenuItem value="W">W</MenuItem>
                                <MenuItem value="kW">kW</MenuItem>
                                <MenuItem value="MW">MW</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            variant="standard"
                            type="color"
                            label={this.getText('power_iconColor')}
                            value={data.iconColor || '#ffffff'}
                            disabled={!!data.useColorScale}
                            onChange={e => this.updateSlot(slot, { iconColor: e.target.value })}
                            helperText={this.getText('power_iconColor_hint')}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!!data.useColorScale}
                                    onChange={(_e, checked) => this.updateSlot(slot, { useColorScale: checked })}
                                />
                            }
                            label={this.getText('power_useColorScale')}
                        />
                    </Box>

                    {data.useColorScale && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {this.getText('power_colorScale')}
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={this.getText('powerMinValueForColor')}
                                    value={data.minColorScale ?? 0}
                                    onChange={e => this.updateSlot(slot, { minColorScale: Number(e.target.value) })}
                                />
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={this.getText('powerMaxValueForColor')}
                                    value={data.maxColorScale ?? 10000}
                                    onChange={e => this.updateSlot(slot, { maxColorScale: Number(e.target.value) })}
                                />
                                <TextField
                                    variant="standard"
                                    type="number"
                                    label={this.getText('powerBestValueForColor')}
                                    value={data.bestColorScale ?? 0}
                                    onChange={e => this.updateSlot(slot, { bestColorScale: Number(e.target.value) })}
                                />
                            </Box>
                        </>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {this.getText('power_speed')}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, alignItems: 'center' }}>
                        <TextField
                            variant="standard"
                            type="number"
                            label={this.getText('powerMinValueForSpeed')}
                            value={data.minSpeedScale ?? 0}
                            onChange={e => this.updateSlot(slot, { minSpeedScale: Number(e.target.value) })}
                        />
                        <TextField
                            variant="standard"
                            type="number"
                            label={this.getText('powerMaxValueForSpeed')}
                            value={data.maxSpeedScale ?? 10000}
                            onChange={e => this.updateSlot(slot, { maxSpeedScale: Number(e.target.value) })}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!!data.reverse}
                                    onChange={(_e, checked) => this.updateSlot(slot, { reverse: checked })}
                                />
                            }
                            label={this.getText('powerDirectionReverse')}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({ editing: null })}>{this.getText('close')}</Button>
                </DialogActions>
            </Dialog>
        );
    }

    private renderHomeTopDialog(): React.JSX.Element {
        const data = this.props.entry.homeTop ?? {};
        const { oContext, theme } = this.props;

        return (
            <Dialog
                open
                onClose={() => this.setState({ editing: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{this.getText('power_home_top_edit')}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <EntitySelector
                            label={this.getText('powerStateHomeTop')}
                            value={data.state ?? ''}
                            onChange={(v: string) => this.updateHomeTop({ state: v })}
                            socket={oContext.socket}
                            theme={theme}
                            themeType={theme?.palette?.mode || 'light'}
                            dialogName="selectState"
                            filterFunc={(obj: ioBroker.Object) =>
                                !!(obj && obj.type === 'state' && obj.common && obj.common.type === 'number')
                            }
                            disabled={!this.state.alive}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <FormControl variant="standard" fullWidth>
                                <InputLabel>{this.getText('power_decimal')}</InputLabel>
                                <Select
                                    value={data.valueDecimal ?? 0}
                                    onChange={e => this.updateHomeTop({ valueDecimal: Number(e.target.value) })}
                                >
                                    <MenuItem value={0}>0</MenuItem>
                                    <MenuItem value={1}>1</MenuItem>
                                    <MenuItem value={2}>2</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl variant="standard" fullWidth>
                                <InputLabel>{this.getText('power_unit')}</InputLabel>
                                <Select
                                    value={data.valueUnit ?? 'W'}
                                    onChange={e => this.updateHomeTop({ valueUnit: e.target.value as string })}
                                >
                                    <MenuItem value="W">W</MenuItem>
                                    <MenuItem value="kW">kW</MenuItem>
                                    <MenuItem value="MW">MW</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({ editing: null })}>{this.getText('close')}</Button>
                </DialogActions>
            </Dialog>
        );
    }

    private renderHomeBotDialog(): React.JSX.Element {
        const data = this.props.entry.homeBot ?? {};
        const { oContext, theme } = this.props;
        const selected: number[] = Array.isArray(data.selPowerSupply) ? data.selPowerSupply : [];

        return (
            <Dialog
                open
                onClose={() => this.setState({ editing: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{this.getText('power_home_bot_edit')}</DialogTitle>
                <DialogContent dividers>
                    <FormControlLabel
                        sx={{ mb: 2 }}
                        control={
                            <Checkbox
                                checked={!!data.selInternalCalculation}
                                onChange={(_e, checked) =>
                                    this.updateHomeBot({ selInternalCalculation: checked })
                                }
                            />
                        }
                        label={this.getText('power_internal_calculation')}
                    />
                    {!data.selInternalCalculation ? (
                        <EntitySelector
                            label={this.getText('powerStateHomeBottom')}
                            value={data.state ?? ''}
                            onChange={(v: string) => this.updateHomeBot({ state: v })}
                            socket={oContext.socket}
                            theme={theme}
                            themeType={theme?.palette?.mode || 'light'}
                            dialogName="selectState"
                            filterFunc={(obj: ioBroker.Object) =>
                                !!(obj && obj.type === 'state' && obj.common && obj.common.type === 'number')
                            }
                            disabled={!this.state.alive}
                        />
                    ) : (
                        <FormControl variant="standard" fullWidth sx={{ mt: 1 }}>
                            <InputLabel shrink>{this.getText('power_negate_supply')}</InputLabel>
                            <Select
                                multiple
                                value={selected}
                                onChange={e => {
                                    const value = e.target.value as number[];
                                    this.updateHomeBot({ selPowerSupply: value });
                                }}
                            >
                                {[1, 2, 3, 4, 5, 6].map(n => (
                                    <MenuItem key={n} value={n}>
                                        {`${this.getText('power')} ${n}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                        <FormControl variant="standard" fullWidth>
                            <InputLabel>{this.getText('power_decimal')}</InputLabel>
                            <Select
                                value={data.valueDecimal ?? 0}
                                onChange={e => this.updateHomeBot({ valueDecimal: Number(e.target.value) })}
                            >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl variant="standard" fullWidth>
                            <InputLabel>{this.getText('power_unit')}</InputLabel>
                            <Select
                                value={data.valueUnit ?? 'W'}
                                onChange={e => this.updateHomeBot({ valueUnit: e.target.value as string })}
                            >
                                <MenuItem value="W">W</MenuItem>
                                <MenuItem value="kW">kW</MenuItem>
                                <MenuItem value="MW">MW</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({ editing: null })}>{this.getText('close')}</Button>
                </DialogActions>
            </Dialog>
        );
    }

    render(): React.JSX.Element {
        const entry = this.props.entry;
        const { editing } = this.state;

        return (
            <Box>
                {/* UniqueName + Headline */}
                <Box sx={{ mb: 1, p: 1, borderRadius: 1, backgroundColor: 'action.hover' }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        label={this.getText('unique_label')}
                        value={entry.uniqueName}
                        onChange={e => {
                            const v = e.target.value;
                            if (v.trim()) {
                                this.props.onUniqueNameChange(entry.uniqueName, v);
                            }
                        }}
                        InputProps={{
                            sx: { backgroundColor: 'transparent', px: 1, fontWeight: 600, width: '50%' },
                        }}
                        disabled={!this.state.alive}
                    />
                </Box>
                <TextField
                    fullWidth
                    variant="standard"
                    label={this.getText('headline')}
                    value={entry.headline ?? ''}
                    onChange={e => this.updateEntry({ headline: e.target.value })}
                    InputProps={{ sx: { backgroundColor: 'transparent', px: 1, width: '50%' } }}
                    sx={{ mb: 2 }}
                    disabled={!this.state.alive}
                />

                {/* 3 columns × 3 rows: left slots | home column | right slots */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gridTemplateRows: 'auto auto auto',
                        gap: 2,
                        maxWidth: 800,
                    }}
                >
                    {/* Row 1 */}
                    {this.renderSlotPaper('leftTop')}
                    {this.renderHomeTopPaper()}
                    {this.renderSlotPaper('rightTop')}

                    {/* Row 2 */}
                    {this.renderSlotPaper('leftMiddle')}
                    <Paper
                        elevation={0}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 90,
                            backgroundColor: 'transparent',
                        }}
                    >
                        <HomeIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                    </Paper>
                    {this.renderSlotPaper('rightMiddle')}

                    {/* Row 3 */}
                    {this.renderSlotPaper('leftBottom')}
                    {this.renderHomeBotPaper()}
                    {this.renderSlotPaper('rightBottom')}
                </Box>

                {editing?.kind === 'slot' && this.renderSlotDialog(editing.slot)}
                {editing?.kind === 'homeTop' && this.renderHomeTopDialog()}
                {editing?.kind === 'homeBot' && this.renderHomeBotDialog()}
            </Box>
        );
    }
}

export default PagePowerEditor;
// Re-export of slot constants for callers that need to enumerate slots
export { SLOT_KEYS };
