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
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
    type SelectChangeEvent,
} from '@mui/material';
import { I18n, type ThemeType } from '@iobroker/gui-components';
import {
    ADMIN_BUTTON_DEFAULT_DELAY,
    ADMIN_BUTTON_DELAY_MODES,
    ADMIN_BUTTON_MAX_DELAY,
    ADMIN_BUTTON_MIN_DELAY,
    ADMIN_BUTTON_MODES,
    ADMIN_BUTTON_STATE_MODES,
    type AdminButtonFunction,
    type AdminButtonMode,
} from '../../../src/lib/types/adminShareConfig';
import { EntitySelector } from './EntitySelector';

/** The two hardware buttons below the display. */
export type PanelButtonSide = 'left' | 'right';

/** What the dialog needs to know about the panel it configures. */
export interface PanelButtonDialogPanel {
    id?: string;
    name?: string;
    kind?: 'tasmota' | 'web';
    buttonLeft?: AdminButtonFunction;
    buttonRight?: AdminButtonFunction;
}

export interface PanelButtonDialogProps {
    socket: any;
    theme?: any;
    themeType?: ThemeType;
    adapterName: string;
    instance: string | number;
    /** true while the instance is running - only then the decoupling and the page list can be read */
    alive: boolean;
    /** Hands the finished action back; `undefined` = not configured in the admin (the script decides) */
    onSave: (panelId: string, side: PanelButtonSide, action: AdminButtonFunction | undefined) => void;
}

/** `none` = the admin configures nothing, the configuration script keeps its value */
type DialogMode = AdminButtonMode | 'none';

interface PanelButtonDialogState {
    open: boolean;
    side: PanelButtonSide;
    panelId: string;
    panelName: string;
    /** a web panel has no relays, its buttons always report to the adapter */
    isWebPanel: boolean;
    mode: DialogMode;
    /** target of mode 'page' */
    page: string;
    /** datapoint of the datapoint modes */
    stateId: string;
    /** delay of the delay modes in seconds, as typed; empty = the default of the adapter */
    delay: string;
    /** navigation points of this panel, empty = unknown (instance not running) */
    pages: string[];
    /** `cmd.detachLeft`/`cmd.detachRight` of the panel; null = could not be read */
    detached: boolean | null;
    /** a write to the decoupling state is on its way */
    detachBusy: boolean;
}

const closedState: Omit<PanelButtonDialogState, 'side' | 'panelId' | 'panelName' | 'isWebPanel'> = {
    open: false,
    mode: 'none',
    page: '',
    stateId: '',
    delay: '',
    pages: [],
    detached: null,
    detachBusy: false,
};

/**
 * Configures what one hardware button of a panel does: `native.panels[].buttonLeft` and
 * `.buttonRight` (the admin counterpart of `buttonLeft`/`buttonRight` of the configuration script).
 *
 * A hardware button of an NSPanel switches its relay as long as it is coupled to it - only a
 * decoupled button reports to the adapter (`cmd.detachLeft`/`cmd.detachRight`, the adapter then
 * sends the matching Tasmota rule). The dialog therefore offers the decoupling first and the
 * action afterwards. A web panel has no relay, there the action is always offered.
 */
class PanelButtonDialog extends React.Component<PanelButtonDialogProps, PanelButtonDialogState> {
    /** Guards against results of a load that belongs to a panel the dialog has left already */
    private loadSequence = 0;
    /** The decoupling state the dialog is subscribed to, '' = none */
    private subscribedDetachId = '';

    constructor(props: PanelButtonDialogProps) {
        super(props);
        this.state = {
            ...closedState,
            side: 'left',
            panelId: '',
            panelName: '',
            isWebPanel: false,
        };
    }

    componentWillUnmount(): void {
        void this.unsubscribeDetach();
    }

    /**
     * Opens the dialog for one button of one panel and fills the fields from the stored action.
     *
     * @param panel Panel entry of the admin table.
     * @param side Which of the two hardware buttons.
     */
    public openWith(panel: PanelButtonDialogPanel, side: PanelButtonSide): void {
        const action = side === 'left' ? panel.buttonLeft : panel.buttonRight;
        const mode: DialogMode = action ? action.mode : 'none';
        const panelId = panel.id ?? '';
        this.loadSequence++;
        this.setState(
            {
                ...closedState,
                open: true,
                side,
                panelId,
                panelName: panel.name ?? '',
                isWebPanel: panel.kind === 'web',
                mode,
                page: action && action.mode === 'page' ? action.page : '',
                stateId: action && action.mode !== 'page' ? action.state : '',
                delay:
                    action && 'delay' in action && typeof action.delay === 'number' && !isNaN(action.delay)
                        ? String(action.delay)
                        : '',
            },
            () => {
                void this.loadPages();
                void this.subscribeDetach();
            },
        );
    }

    /** Id of the state that decouples this button from its relay. */
    private detachStateId(): string {
        const { adapterName, instance } = this.props;
        const { panelId, side } = this.state;
        if (!panelId) {
            return '';
        }
        return `${adapterName}.${instance}.panels.${panelId}.cmd.detach${side === 'left' ? 'Left' : 'Right'}`;
    }

    /**
     * Loads the navigation points of the panel for mode 'page'. They are the `common.states` of
     * `cmd.goToNavigationPoint` - the very names the adapter resolves a target against. Without a
     * running instance the list stays empty and the dialog offers a text field instead.
     */
    private async loadPages(): Promise<void> {
        const { socket, adapterName, instance } = this.props;
        const { panelId } = this.state;
        const seq = this.loadSequence;
        if (!socket || !panelId) {
            return;
        }
        let pages: string[] = [];
        try {
            const obj: ioBroker.Object | null | undefined = await (socket.getObject(
                `${adapterName}.${instance}.panels.${panelId}.cmd.goToNavigationPoint`,
            ) as Promise<ioBroker.Object | null | undefined>);
            const states = obj?.type === 'state' ? obj.common.states : undefined;
            if (states && typeof states === 'object' && !Array.isArray(states)) {
                pages = Object.keys(states);
            } else if (Array.isArray(states)) {
                pages = states.map(entry => String(entry));
            }
        } catch {
            pages = [];
        }
        if (seq !== this.loadSequence) {
            return;
        }
        this.setState({ pages });
    }

    /** Subscribes to the decoupling state of this button, so the dialog always shows its real value. */
    private async subscribeDetach(): Promise<void> {
        const { socket } = this.props;
        const id = this.detachStateId();
        await this.unsubscribeDetach();
        if (!socket || !id) {
            return;
        }
        try {
            const state: ioBroker.State | null | undefined = await (socket.getState(id) as Promise<
                ioBroker.State | null | undefined
            >);
            this.setState({ detached: state && state.val != null ? !!state.val : null });
            await socket.subscribeState(id, this.onDetachChanged);
            this.subscribedDetachId = id;
        } catch {
            this.setState({ detached: null });
        }
    }

    private async unsubscribeDetach(): Promise<void> {
        const { socket } = this.props;
        const id = this.subscribedDetachId;
        this.subscribedDetachId = '';
        if (!socket || !id) {
            return;
        }
        try {
            await socket.unsubscribeState(id, this.onDetachChanged);
        } catch {
            // the subscription dies with the dialog anyway
        }
    }

    private onDetachChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        if (state && state.val != null) {
            this.setState({ detached: !!state.val, detachBusy: false });
        }
    };

    /**
     * Writes the decoupling state of this button.
     *
     * @param event Change event of the switch.
     */
    private handleDetachChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const { socket } = this.props;
        const id = this.detachStateId();
        const value = event.target.checked;
        if (!socket || !id) {
            return;
        }
        this.setState({ detached: value, detachBusy: true });
        void Promise.resolve(socket.setState(id, value, false))
            .then(() => this.setState({ detachBusy: false }))
            .catch(() => this.setState({ detached: null, detachBusy: false }));
    };

    private handleModeChange = (event: SelectChangeEvent<DialogMode>): void => {
        this.setState({ mode: event.target.value });
    };

    private handlePageSelect = (event: SelectChangeEvent<string>): void => {
        this.setState({ page: event.target.value });
    };

    private handlePageText = (event: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({ page: event.target.value });
    };

    private handleStateChange = (value: string): void => {
        this.setState({ stateId: value });
    };

    private handleDelayChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({ delay: event.target.value });
    };

    /** The delay as the adapter gets it; undefined = field empty or not a delay mode. */
    private parsedDelay(): number | undefined {
        const { mode, delay } = this.state;
        if (!ADMIN_BUTTON_DELAY_MODES.includes(mode as AdminButtonMode) || delay.trim() === '') {
            return undefined;
        }
        const value = Number(delay.replace(',', '.'));
        return isNaN(value) ? undefined : value;
    }

    /** Everything the dialog needs for a save, or null while something is missing. */
    private buildAction(): { ok: true; action: AdminButtonFunction | undefined } | { ok: false } {
        const { mode, page, stateId } = this.state;
        if (mode === 'none') {
            return { ok: true, action: undefined };
        }
        if (mode === 'page') {
            const target = page.trim();
            return target ? { ok: true, action: { mode: 'page', page: target } } : { ok: false };
        }
        const id = stateId.trim();
        if (!id || id.endsWith('.')) {
            return { ok: false };
        }
        if (mode === 'switch' || mode === 'button') {
            return { ok: true, action: { mode, state: id } };
        }
        const delay = this.parsedDelay();
        if (this.state.delay.trim() !== '' && delay === undefined) {
            return { ok: false };
        }
        if (delay !== undefined && (delay < ADMIN_BUTTON_MIN_DELAY || delay > ADMIN_BUTTON_MAX_DELAY)) {
            return { ok: false };
        }
        return { ok: true, action: delay === undefined ? { mode, state: id } : { mode, state: id, delay } };
    }

    /**
     * Whether the action is up for editing: a coupled hardware button switches its relay and never
     * reaches the adapter, so its action is hidden. Without a readable decoupling state (instance
     * stopped) it is offered anyway - it is stored in the configuration, not in the panel.
     */
    private showAction(): boolean {
        return this.state.isWebPanel || this.state.detached !== false;
    }

    /** Lets the subscription and any running load go, then closes. */
    private closeDialog(): void {
        void this.unsubscribeDetach();
        this.loadSequence++;
        this.setState({ open: false });
    }

    private handleSave = (): void => {
        // the decoupling is written the moment the switch is used - with a coupled button there is
        // nothing left to store, and the action kept for it stays untouched
        if (!this.showAction()) {
            this.closeDialog();
            return;
        }
        const result = this.buildAction();
        if (!result.ok) {
            return;
        }
        this.props.onSave(this.state.panelId, this.state.side, result.action);
        this.closeDialog();
    };

    private handleCancel = (): void => {
        this.closeDialog();
    };

    /** Label of the button the dialog configures. */
    private sideLabel(): string {
        return I18n.t(this.state.side === 'left' ? 'panelButtonDialog_sideLeft' : 'panelButtonDialog_sideRight');
    }

    /** The target of mode 'page': a list of the navigation points, a text field without them. */
    private renderPageField(): React.JSX.Element {
        const { page, pages } = this.state;
        // a stored target the panel does not report (any more) stays visible instead of looking unset
        const options = !page || pages.includes(page) ? pages : [page, ...pages];
        if (pages.length === 0) {
            return (
                <TextField
                    variant="outlined"
                    label={I18n.t('panelButtonDialog_page')}
                    value={page}
                    onChange={this.handlePageText}
                    helperText={I18n.t('panelButtonDialog_pageUnknown')}
                    fullWidth
                />
            );
        }
        return (
            <FormControl fullWidth>
                <InputLabel id="panelButtonDialogPageLabel">{I18n.t('panelButtonDialog_page')}</InputLabel>
                <Select
                    labelId="panelButtonDialogPageLabel"
                    label={I18n.t('panelButtonDialog_page')}
                    value={options.includes(page) ? page : ''}
                    onChange={this.handlePageSelect}
                >
                    {options.map(entry => (
                        <MenuItem
                            key={entry}
                            value={entry}
                        >
                            {entry}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    /** Datapoint and, for the delay modes, the delay. */
    private renderStateFields(): React.JSX.Element {
        const { socket, theme, themeType } = this.props;
        const { mode, stateId, delay } = this.state;
        const isDelayMode = ADMIN_BUTTON_DELAY_MODES.includes(mode as AdminButtonMode);
        return (
            <>
                <Box>
                    <EntitySelector
                        label={I18n.t('panelButtonDialog_state')}
                        value={stateId}
                        onChange={this.handleStateChange}
                        socket={socket}
                        theme={theme}
                        themeType={themeType ?? 'light'}
                        dialogName="panelButtonDialogState"
                        filterFunc={(obj: ioBroker.Object): boolean =>
                            obj?.type === 'state' && obj.common?.write !== false
                        }
                    />
                    <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                    >
                        {I18n.t('panelButtonDialog_stateHint')}
                    </Typography>
                </Box>
                {isDelayMode && (
                    <TextField
                        variant="outlined"
                        type="number"
                        label={I18n.t('panelButtonDialog_delay')}
                        value={delay}
                        onChange={this.handleDelayChange}
                        helperText={I18n.t(
                            'panelButtonDialog_delayHint',
                            String(ADMIN_BUTTON_DEFAULT_DELAY),
                            String(ADMIN_BUTTON_MIN_DELAY),
                            String(ADMIN_BUTTON_MAX_DELAY),
                        )}
                        slotProps={{
                            htmlInput: { min: ADMIN_BUTTON_MIN_DELAY, max: ADMIN_BUTTON_MAX_DELAY, step: 0.05 },
                        }}
                        sx={{ maxWidth: 260 }}
                    />
                )}
            </>
        );
    }

    render(): React.JSX.Element {
        const { alive } = this.props;
        const { open, panelName, isWebPanel, mode, detached, detachBusy } = this.state;
        const showAction = this.showAction();
        // an action stored for this button is kept while it is coupled - it works again after decoupling
        const keptAction = !showAction && mode !== 'none';

        return (
            <Dialog
                open={open}
                onClose={(_event, reason) => {
                    // the dialog closes by button only
                    if (reason === 'backdropClick') {
                        return;
                    }
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{I18n.t('panelButtonDialog_title', this.sideLabel(), panelName)}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {isWebPanel ? (
                            <Alert severity="info">{I18n.t('panelButtonDialog_webInfo')}</Alert>
                        ) : (
                            <>
                                {!alive && <Alert severity="warning">{I18n.t('panelButtonDialog_notAlive')}</Alert>}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={detached === true}
                                                onChange={this.handleDetachChange}
                                                disabled={!alive || detachBusy}
                                            />
                                        }
                                        label={I18n.t('panelButtonDialog_detach')}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{ display: 'block', color: 'text.secondary' }}
                                    >
                                        {I18n.t('panelButtonDialog_detachHint')}
                                    </Typography>
                                </Box>
                                {detached === false && (
                                    <Alert severity="info">
                                        {I18n.t(
                                            keptAction
                                                ? 'panelButtonDialog_detachKeeps'
                                                : 'panelButtonDialog_detachRequired',
                                        )}
                                    </Alert>
                                )}
                            </>
                        )}

                        {showAction && (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel id="panelButtonDialogModeLabel">
                                        {I18n.t('panelButtonDialog_mode')}
                                    </InputLabel>
                                    <Select
                                        labelId="panelButtonDialogModeLabel"
                                        label={I18n.t('panelButtonDialog_mode')}
                                        value={mode}
                                        onChange={this.handleModeChange}
                                    >
                                        <MenuItem value="none">{I18n.t('panelButtonDialog_modeNone')}</MenuItem>
                                        {ADMIN_BUTTON_MODES.map(entry => (
                                            <MenuItem
                                                key={entry}
                                                value={entry}
                                            >
                                                {I18n.t(`panelButtonDialog_mode_${entry}`)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {mode === 'none' && (
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'text.secondary' }}
                                    >
                                        {I18n.t('panelButtonDialog_modeNoneHint')}
                                    </Typography>
                                )}
                                {mode === 'page' && this.renderPageField()}
                                {ADMIN_BUTTON_STATE_MODES.includes(mode as AdminButtonMode) && this.renderStateFields()}
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCancel}>{I18n.t('Cancel')}</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleSave}
                        disabled={showAction && !this.buildAction().ok}
                    >
                        {I18n.t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default PanelButtonDialog;
