/**
 * Dialog of the Maintain tab that takes the configuration of a panel's script over into the admin page
 * configuration (sendTo `convertScriptToAdmin`). Opening the dialog asks the adapter for a dry run and shows
 * the plan: which pages, the screensaver and the hardware buttons are converted and what is skipped and why.
 * "Convert" runs the same command without dryRun, the result lists what was created, the script backup and what
 * could not be changed in the script source. The adapter writes the instance configuration itself - the admin
 * therefore has to be reloaded afterwards, otherwise a later save of the admin would overwrite the new entries.
 */
import React from 'react';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    ListItem,
    ListItemText,
    Typography,
} from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import {
    SENDTO_CONVERT_SCRIPT_COMMAND,
    type AdminButtonFunction,
    type ConvertPagePlan,
    type ConvertScriptPlan,
    type ConvertScriptRequest,
    type ConvertScriptResult,
    type ConvertSkipReason,
    type ConvertSkipped,
    type NavigationLinks,
} from '../../../src/lib/types/adminShareConfig';

export interface ConvertScriptDialogProps {
    socket: any;
    adapterName: string;
    instance: string | number;
    /** true while the instance configuration in the admin has unsaved changes */
    changed: boolean;
    /** called after a conversion was executed (successfully or not) */
    onConverted?: (result: ConvertScriptResult) => void;
}

/** what the dialog shows: the dry run is loading, the plan, the conversion runs, the result or an error */
type DialogPhase = 'loading' | 'preview' | 'executing' | 'done' | 'error';

interface ConvertScriptDialogState {
    open: boolean;
    panelTopic: string;
    panelName: string;
    phase: DialogPhase;
    plan: ConvertScriptPlan | null;
    result: ConvertScriptResult | null;
    /** error text of the adapter (english) or of the transport */
    error: string;
    /** the execution ran into the timeout - the adapter may have finished it nevertheless */
    executeTimedOut: boolean;
}

/** the adapter answers a dry run or an execution within this time, otherwise the request is given up */
const SENDTO_TIMEOUT_MS = 60_000;

/** all skip reasons of the contract - a reason the admin does not know is shown as its code */
const SKIP_REASONS: readonly ConvertSkipReason[] = [
    'unsupportedPageType',
    'nameExists',
    'itemNotSupported',
    'fieldNotSupported',
    'adminOnly',
    'adminAlreadyNavigated',
    'adminEntryMissing',
    'screensaverExists',
    'screensaverItemNotSupported',
    'screensaverEmpty',
    'buttonConfigured',
    'buttonNotSupported',
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * `{ error: string }` - the adapter refused the request (e.g. the script never sent its configuration)
 *
 * @param value answer of the adapter
 */
function isErrorResponse(value: unknown): value is { error: string } {
    return isRecord(value) && typeof value.error === 'string' && value.error !== '' && !('executed' in value);
}

function isConvertScriptPlan(value: unknown): value is ConvertScriptPlan {
    return (
        isRecord(value) &&
        typeof value.panelTopic === 'string' &&
        typeof value.panelName === 'string' &&
        typeof value.scriptId === 'string' &&
        typeof value.scriptFound === 'boolean' &&
        Array.isArray(value.pages) &&
        Array.isArray(value.skipped) &&
        isRecord(value.buttons) &&
        Array.isArray(value.buttonsSkipped) &&
        typeof value.nothingToDo === 'boolean'
    );
}

function isConvertScriptResult(value: unknown): value is ConvertScriptResult {
    if (!isConvertScriptPlan(value)) {
        return false;
    }
    // the plan type has no index signature, the fields of the result are read through one
    const fields: Record<string, unknown> = value;
    return (
        typeof fields.executed === 'boolean' &&
        Array.isArray(fields.deletedBackups) &&
        Array.isArray(fields.renamedBackups) &&
        typeof fields.scriptRewritten === 'boolean' &&
        Array.isArray(fields.scriptNotes) &&
        typeof fields.panelReloaded === 'boolean' &&
        // older adapters do not send it - missing counts as false (see `send`)
        (fields.adapterRestarts === undefined || typeof fields.adapterRestarts === 'boolean')
    );
}

function isSkipReason(value: string): value is ConvertSkipReason {
    return SKIP_REASONS.some(reason => reason === value);
}

/**
 * translated skip reason, the code itself if the admin does not know it
 *
 * @param reason skip reason of the plan
 */
function reasonText(reason: string): string {
    return isSkipReason(reason) ? I18n.t(`convertScript_reason_${reason}`) : reason;
}

/**
 * translated label of what the conversion does with a page
 *
 * @param action action of the plan
 */
function actionText(action: ConvertPagePlan['action']): string {
    return I18n.t(`convertScript_action_${action}`);
}

/**
 * chip colour of a page action: green = new entry, blue = navigation only, grey = removed from the script
 *
 * @param action action of the plan
 */
function actionColor(action: ConvertPagePlan['action']): 'success' | 'info' | 'default' {
    switch (action) {
        case 'create':
            return 'success';
        case 'assignNavigation':
            return 'info';
        default:
            return 'default';
    }
}

/**
 * `prev: a · next: b · home: c · parent: d` of the set links, '' if none
 *
 * @param navigation navigation of the script page
 */
function navigationText(navigation: NavigationLinks): string {
    const parts: string[] = [];
    const keys: (keyof NavigationLinks)[] = ['prev', 'next', 'home', 'parent'];
    for (const key of keys) {
        const target = navigation[key];
        if (target) {
            parts.push(`${I18n.t(`convertScript_nav_${key}`)}: ${target}`);
        }
    }
    return parts.join(' · ');
}

/**
 * one line that describes a hardware button action, '' for null
 *
 * @param action the admin action of the button
 */
function buttonText(action: AdminButtonFunction | undefined): string {
    if (!action) {
        return '';
    }
    const mode = I18n.t(`panelButtonDialog_mode_${action.mode}`);
    if (action.mode === 'page') {
        return `${mode}: ${action.page}`;
    }
    const delay =
        'delay' in action && typeof action.delay === 'number'
            ? ` (${I18n.t('convertScript_buttonDelay', String(action.delay))})`
            : '';
    return `${mode}: ${action.state}${delay}`;
}

/** the adapter did not answer in time */
class TimeoutError extends Error {}

/**
 * rejects after `ms` milliseconds - a sendTo to an instance that does not answer would hang forever
 *
 * @param promise the request
 * @param ms time to wait in milliseconds
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const handle = window.setTimeout(() => reject(new TimeoutError(I18n.t('convertScript_timeout'))), ms);
        promise.then(
            value => {
                window.clearTimeout(handle);
                resolve(value);
            },
            (err: unknown) => {
                window.clearTimeout(handle);
                reject(err instanceof Error ? err : new Error(String(err)));
            },
        );
    });
}

class ConvertScriptDialog extends React.Component<ConvertScriptDialogProps, ConvertScriptDialogState> {
    /** guards against answers that belong to a panel the dialog has left already */
    private sequence = 0;

    constructor(props: ConvertScriptDialogProps) {
        super(props);
        this.state = {
            open: false,
            panelTopic: '',
            panelName: '',
            phase: 'loading',
            plan: null,
            result: null,
            error: '',
            executeTimedOut: false,
        };
    }

    componentWillUnmount(): void {
        this.sequence++;
    }

    /**
     * Opens the dialog for one panel and asks the adapter for the dry run right away.
     *
     * @param panelTopic MQTT topic of the panel (`panelTopic` of the script configuration)
     * @param panelName Name of the panel for the title
     */
    public openWith(panelTopic: string, panelName: string): void {
        this.sequence++;
        this.setState(
            {
                open: true,
                panelTopic,
                panelName,
                phase: 'loading',
                plan: null,
                result: null,
                error: '',
                executeTimedOut: false,
            },
            () => void this.send(true),
        );
    }

    private close = (): void => {
        this.sequence++;
        this.setState({ open: false });
    };

    private reload = (): void => {
        window.location.reload();
    };

    private convert = (): void => {
        this.setState({ phase: 'executing', error: '' }, () => void this.send(false));
    };

    /**
     * Sends the command and sorts the answer into the state: `{ error }` → error phase, plan → preview,
     * result → done (a result may carry an error of its own, e.g. the backup failed - that is shown with it).
     *
     * @param dryRun true asks for the plan only
     */
    private async send(dryRun: boolean): Promise<void> {
        const seq = this.sequence;
        const { socket, adapterName, instance } = this.props;
        const request: ConvertScriptRequest = { panelTopic: this.state.panelTopic, dryRun };
        let answer: unknown;
        try {
            answer = await withTimeout<unknown>(
                socket.sendTo(`${adapterName}.${instance}`, SENDTO_CONVERT_SCRIPT_COMMAND, request),
                SENDTO_TIMEOUT_MS,
            );
        } catch (err) {
            if (seq !== this.sequence) {
                return;
            }
            // a timed out execution may have run through on the adapter - the user has to look at the log
            const executeTimedOut = !dryRun && err instanceof TimeoutError;
            this.setState({
                phase: 'error',
                error: err instanceof Error ? err.message : String(err),
                executeTimedOut,
            });
            return;
        }
        if (seq !== this.sequence) {
            return;
        }
        if (isErrorResponse(answer)) {
            // the plan stays, so a failed execution still shows what was planned
            this.setState({ phase: 'error', error: answer.error });
            return;
        }
        if (!dryRun && isConvertScriptResult(answer)) {
            const result: ConvertScriptResult = { ...answer, adapterRestarts: answer.adapterRestarts === true };
            this.setState({ phase: 'done', result, plan: result, error: result.error ?? '' });
            this.props.onConverted?.(result);
            return;
        }
        if (dryRun && isConvertScriptPlan(answer)) {
            this.setState({ phase: 'preview', plan: answer });
            return;
        }
        this.setState({ phase: 'error', error: I18n.t('convertScript_invalidResponse') });
    }

    private renderSectionTitle(text: string): React.JSX.Element {
        return (
            <Typography
                variant="subtitle2"
                sx={{ mt: 2, mb: 0.5 }}
            >
                {text}
            </Typography>
        );
    }

    private renderPage(page: ConvertPagePlan): React.JSX.Element {
        const navigation = navigationText(page.navigation);
        const card = page.card && page.card !== page.type ? `${page.type} → ${page.card}` : page.type;
        return (
            <ListItem
                key={`${page.action}-${page.uniqueName}`}
                disableGutters
                sx={{ py: 0.5 }}
            >
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography
                                component="span"
                                sx={{ fontWeight: 'bold' }}
                            >
                                {page.uniqueName}
                            </Typography>
                            <Chip
                                size="small"
                                variant="outlined"
                                label={card}
                            />
                            <Chip
                                size="small"
                                color={actionColor(page.action)}
                                label={actionText(page.action)}
                            />
                        </Box>
                    }
                    secondary={[
                        page.storedAs ? I18n.t('convertScript_storedAs', page.storedAs) : '',
                        I18n.t('convertScript_items', String(page.itemCount)),
                        navigation,
                    ]
                        .filter(part => part !== '')
                        .join(' · ')}
                />
            </ListItem>
        );
    }

    private renderSkipped(entry: ConvertSkipped, index: number): React.JSX.Element {
        return (
            <ListItem
                key={`${entry.uniqueName}-${index}`}
                disableGutters
                sx={{ py: 0.5 }}
            >
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography
                                component="span"
                                sx={{ fontWeight: 'bold' }}
                            >
                                {entry.uniqueName}
                            </Typography>
                            {entry.type ? (
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    label={entry.type}
                                />
                            ) : null}
                            <Typography
                                component="span"
                                variant="body2"
                            >
                                {reasonText(entry.reason)}
                            </Typography>
                        </Box>
                    }
                    secondary={entry.detail}
                />
            </ListItem>
        );
    }

    private renderScreensaver(plan: ConvertScriptPlan): React.JSX.Element | null {
        if (plan.screensaver) {
            const { name, mode, itemCount, notifyCount } = plan.screensaver;
            return (
                <>
                    {this.renderSectionTitle(I18n.t('convertScript_screensaver'))}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                            component="span"
                            sx={{ fontWeight: 'bold' }}
                        >
                            {name}
                        </Typography>
                        <Chip
                            size="small"
                            variant="outlined"
                            label={I18n.t(`screensaver_mode_${mode}`)}
                        />
                        <Chip
                            size="small"
                            color="success"
                            label={actionText('create')}
                        />
                    </Box>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {I18n.t('convertScript_items', String(itemCount))} ·{' '}
                        {I18n.t('convertScript_notifications', String(notifyCount))}
                    </Typography>
                </>
            );
        }
        if (plan.screensaverSkipped) {
            return (
                <>
                    {this.renderSectionTitle(I18n.t('convertScript_screensaver'))}
                    <Typography variant="body2">{reasonText(plan.screensaverSkipped.reason)}</Typography>
                    {plan.screensaverSkipped.detail ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {plan.screensaverSkipped.detail}
                        </Typography>
                    ) : null}
                </>
            );
        }
        return null;
    }

    private renderButtons(plan: ConvertScriptPlan): React.JSX.Element | null {
        const sides: ('left' | 'right')[] = ['left', 'right'];
        const rows: React.JSX.Element[] = [];
        for (const side of sides) {
            const action = plan.buttons[side];
            const label = I18n.t(side === 'left' ? 'panelButtonDialog_sideLeft' : 'panelButtonDialog_sideRight');
            if (action) {
                rows.push(
                    <ListItem
                        key={side}
                        disableGutters
                        sx={{ py: 0.5 }}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography
                                        component="span"
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        {label}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        color="success"
                                        label={actionText('create')}
                                    />
                                </Box>
                            }
                            secondary={buttonText(action)}
                        />
                    </ListItem>,
                );
            }
            const skipped = plan.buttonsSkipped.find(entry => entry.side === side);
            if (skipped) {
                rows.push(
                    <ListItem
                        key={`${side}-skipped`}
                        disableGutters
                        sx={{ py: 0.5 }}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography
                                        component="span"
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        {label}
                                    </Typography>
                                    <Typography
                                        component="span"
                                        variant="body2"
                                    >
                                        {reasonText(skipped.reason)}
                                    </Typography>
                                </Box>
                            }
                            secondary={skipped.detail}
                        />
                    </ListItem>,
                );
            }
        }
        if (rows.length === 0) {
            return null;
        }
        return (
            <>
                {this.renderSectionTitle(I18n.t('convertScript_buttons'))}
                <List
                    dense
                    disablePadding
                >
                    {rows}
                </List>
            </>
        );
    }

    /**
     * the plan: what is converted, what is skipped and the hints before the conversion
     *
     * @param plan plan of the adapter
     * @param showHints true in the preview (backup, reload and unsaved-changes hints), false under a result
     */
    private renderPlan(plan: ConvertScriptPlan, showHints: boolean): React.JSX.Element {
        return (
            <>
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {I18n.t('convertScript_script', plan.scriptId)}
                </Typography>

                {showHints && !plan.scriptFound ? (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {I18n.t('convertScript_scriptMissing')}
                    </Alert>
                ) : null}
                {showHints && plan.nothingToDo ? (
                    <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                    >
                        {I18n.t('convertScript_nothingToDo')}
                    </Alert>
                ) : null}
                {showHints && !plan.nothingToDo && this.props.changed ? (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        {I18n.t('convertScript_unsavedChanges')}
                    </Alert>
                ) : null}
                {showHints && !plan.nothingToDo ? (
                    <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                    >
                        {plan.scriptFound ? I18n.t('convertScript_backupHint') : I18n.t('convertScript_noBackupHint')}{' '}
                        {I18n.t('convertScript_reloadNeeded')}
                    </Alert>
                ) : null}

                {plan.pages.length > 0 ? (
                    <>
                        {this.renderSectionTitle(I18n.t('convertScript_pages'))}
                        <List
                            dense
                            disablePadding
                        >
                            {plan.pages.map(page => this.renderPage(page))}
                        </List>
                    </>
                ) : null}

                {this.renderScreensaver(plan)}
                {this.renderButtons(plan)}

                {plan.skipped.length > 0 ? (
                    <>
                        {this.renderSectionTitle(I18n.t('convertScript_skipped'))}
                        <List
                            dense
                            disablePadding
                        >
                            {plan.skipped.map((entry, index) => this.renderSkipped(entry, index))}
                        </List>
                    </>
                ) : null}
            </>
        );
    }

    /**
     * the report after the conversion
     *
     * @param result result of the adapter
     */
    private renderResult(result: ConvertScriptResult): React.JSX.Element {
        const created = result.pages.filter(page => page.action === 'create').length;
        const assigned = result.pages.filter(page => page.action === 'assignNavigation').length;
        const removed = result.pages.filter(page => page.action === 'removeReference').length;
        const extras: string[] = [];
        if (result.screensaver) {
            extras.push(I18n.t('convertScript_result_screensaver'));
        }
        const buttonCount = (result.buttons.left ? 1 : 0) + (result.buttons.right ? 1 : 0);
        if (buttonCount > 0) {
            extras.push(I18n.t('convertScript_result_buttons', String(buttonCount)));
        }
        const summary =
            I18n.t('convertScript_result_pages', String(created), String(assigned), String(removed)) +
            (extras.length > 0 ? ` · ${extras.join(' · ')}` : '');
        // the runner answers a failure after its first write with executed: true + error - that is a partial run
        const partial = result.executed && !!result.error;
        const success = result.executed && !result.error && result.adapterRestarts;
        return (
            <>
                {result.error ? (
                    <Alert
                        severity="error"
                        sx={{ mb: 1 }}
                    >
                        <AlertTitle>{I18n.t('convertScript_resultError')}</AlertTitle>
                        {result.error}
                    </Alert>
                ) : null}
                {success ? (
                    <Alert
                        severity="success"
                        sx={{ mb: 1 }}
                    >
                        <AlertTitle>{I18n.t('convertScript_done')}</AlertTitle>
                        {summary}
                    </Alert>
                ) : null}
                {partial ? (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1 }}
                    >
                        <AlertTitle>{I18n.t('convertScript_partial')}</AlertTitle>
                        <Box>
                            {result.backupId
                                ? I18n.t('convertScript_backupCreated', result.backupId)
                                : I18n.t('convertScript_noBackup')}
                        </Box>
                        <Box>
                            {I18n.t(
                                result.scriptRewritten
                                    ? 'convertScript_scriptRewritten'
                                    : 'convertScript_scriptUntouched',
                            )}
                        </Box>
                        <Box sx={{ mt: 1 }}>
                            {result.pendingApplyAtStart === true
                                ? I18n.t('convertScript_partialPending')
                                : I18n.t(
                                      'convertScript_partialNotWritten',
                                      result.backupId ?? I18n.t('convertScript_partialNoBackupId'),
                                  )}
                        </Box>
                    </Alert>
                ) : null}
                {!result.executed ? (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1 }}
                    >
                        <AlertTitle>{I18n.t('convertScript_notExecuted')}</AlertTitle>
                        {summary}
                    </Alert>
                ) : null}
                {result.executed && !result.error && !result.adapterRestarts ? (
                    // written, but no restart announced: the entries are used with the next start
                    <Alert
                        severity="warning"
                        sx={{ mb: 1 }}
                    >
                        <AlertTitle>{I18n.t('convertScript_done')}</AlertTitle>
                        {summary} {I18n.t('convertScript_noRestartHint')}
                    </Alert>
                ) : null}

                {this.renderSectionTitle(I18n.t('convertScript_scriptSection'))}
                <Typography variant="body2">
                    {result.backupId
                        ? I18n.t('convertScript_backupCreated', result.backupId)
                        : I18n.t('convertScript_noBackup')}
                </Typography>
                {result.renamedBackups.length > 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {I18n.t('convertScript_renamedBackups')}{' '}
                        {result.renamedBackups.map(entry => `${entry.from} → ${entry.to}`).join(', ')}
                    </Typography>
                ) : null}
                {result.deletedBackups.length > 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {I18n.t('convertScript_deletedBackups')} {result.deletedBackups.join(', ')}
                    </Typography>
                ) : null}
                <Typography variant="body2">
                    {I18n.t(result.scriptRewritten ? 'convertScript_scriptRewritten' : 'convertScript_scriptUntouched')}
                </Typography>
                {result.adapterRestarts ? (
                    <Typography variant="body2">{I18n.t('convertScript_adapterRestarts')}</Typography>
                ) : null}
                {result.scriptNotes.length > 0 ? (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1 }}
                    >
                        <AlertTitle>{I18n.t('convertScript_scriptNotes')}</AlertTitle>
                        <List
                            dense
                            disablePadding
                        >
                            {result.scriptNotes.map((note, index) => (
                                <ListItem
                                    key={index}
                                    disableGutters
                                    sx={{ py: 0 }}
                                >
                                    <ListItemText primary={note} />
                                </ListItem>
                            ))}
                        </List>
                    </Alert>
                ) : null}

                {result.adapterRestarts ? (
                    <Alert
                        severity="warning"
                        sx={{ mt: 2 }}
                    >
                        <AlertTitle>{I18n.t('convertScript_reloadTitle')}</AlertTitle>
                        {I18n.t('convertScript_reloadHint')} {I18n.t('convertScript_reloadRestartHint')}
                    </Alert>
                ) : null}

                <Divider sx={{ my: 2 }} />
                {this.renderPlan(result, false)}
            </>
        );
    }

    private renderContent(): React.JSX.Element {
        const { phase, plan, result, error, executeTimedOut } = this.state;
        switch (phase) {
            case 'loading':
            case 'executing':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                        <CircularProgress size={24} />
                        <Typography>
                            {I18n.t(phase === 'loading' ? 'convertScript_loading' : 'convertScript_executing')}
                        </Typography>
                    </Box>
                );
            case 'error':
                return (
                    <>
                        <Alert severity="error">
                            <AlertTitle>{I18n.t('convertScript_errorTitle')}</AlertTitle>
                            {I18n.t('convertScript_errorIntro')}
                            <Box
                                component="pre"
                                sx={{ m: 0, mt: 1, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                            >
                                {error}
                            </Box>
                        </Alert>
                        {executeTimedOut ? (
                            <Alert
                                severity="warning"
                                sx={{ mt: 1 }}
                            >
                                {I18n.t('convertScript_executeTimeout')}
                            </Alert>
                        ) : null}
                        {plan ? (
                            <>
                                <Divider sx={{ my: 2 }} />
                                {this.renderPlan(plan, false)}
                            </>
                        ) : null}
                    </>
                );
            case 'done':
                return result ? this.renderResult(result) : <></>;
            default:
                return plan ? this.renderPlan(plan, true) : <></>;
        }
    }

    render(): React.JSX.Element {
        const { open, panelName, panelTopic, phase, plan, executeTimedOut } = this.state;
        // the dry run may be cancelled (the sequence counter drops its late answer), the execution may not
        const busy = phase === 'executing';
        const canConvert = phase === 'preview' && plan !== null && !plan.nothingToDo;
        const offerReload = phase === 'done' || (phase === 'error' && executeTimedOut);
        return (
            <Dialog
                open={open}
                onClose={(_event, reason) => {
                    // nothing closes the dialog while the adapter works, and never the backdrop
                    if (reason === 'backdropClick' || busy) {
                        return;
                    }
                    this.close();
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{I18n.t('convertScript_title', panelName || panelTopic)}</DialogTitle>
                <DialogContent dividers>{this.renderContent()}</DialogContent>
                <DialogActions>
                    <Button
                        onClick={this.close}
                        disabled={busy}
                    >
                        {I18n.t(offerReload ? 'convertScript_close' : 'Cancel')}
                    </Button>
                    {offerReload ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.reload}
                        >
                            {I18n.t('convertScript_reloadAdmin')}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.convert}
                            disabled={!canConvert}
                        >
                            {I18n.t('convertScript_convert')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        );
    }
}

export default ConvertScriptDialog;
