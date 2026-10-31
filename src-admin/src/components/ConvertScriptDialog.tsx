/**
 * Dialog of the Maintain tab that takes the configuration of a panel's script over into the admin page
 * configuration (sendTo `convertScriptToAdmin`). Opening the dialog asks the adapter for a dry run and shows
 * the plan as a short summary (how many pages, the screensaver, the hardware buttons) followed by the problems
 * only: what is skipped and why, plus notes such as a page that is stored under another name. The list of the
 * planned pages is folded away - a script with hundreds of pages must not drown the problems. "Take over" runs the
 * same command without dryRun, the result reports what was done, the script backup and what could not be changed
 * in the script source. The adapter writes the instance configuration itself - the admin therefore has to be
 * reloaded afterwards, otherwise a later save of the admin would overwrite the new entries.
 *
 * Pages of the global script are planned per panel. When such a page exists in the admin with another content the
 * plan lists it as conflict; the user decides per page (keep the admin version, take the script version, skip).
 * Every change of a decision asks for a new dry run with the decisions, the execution sends them along.
 */
import React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
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
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { I18n } from '@iobroker/gui-components';
import {
    ALL_PANELS_SPECIAL_ID,
    CONVERT_GLOBAL_DECISIONS,
    SENDTO_CONVERT_SCRIPT_COMMAND,
    type AdminButtonFunction,
    type ConvertGlobalConflict,
    type ConvertGlobalDecision,
    type ConvertPagePlan,
    type ConvertRawItem,
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
    /** decisions of the user for the conflicting pages of the global script, by uniqueName */
    decisions: Record<string, ConvertGlobalDecision>;
    /** a new dry run with changed decisions is under way - the plan shown is the previous one */
    refreshing: boolean;
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

const BUTTON_SIDES: readonly ('left' | 'right')[] = ['left', 'right'];

/** how many pages the plan handles per action */
interface PageCounts {
    create: number;
    assignNavigation: number;
    removeReference: number;
    /** all pages the conversion touches */
    taken: number;
}

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

function isGlobalDecision(value: string): value is ConvertGlobalDecision {
    return CONVERT_GLOBAL_DECISIONS.some(decision => decision === value);
}

/**
 * readable list of the panels an admin entry is assigned to, without the panel of the dialog
 *
 * @param conflict conflict of the plan
 * @param panelTopic topic of the panel of the dialog
 */
function otherPanelsText(conflict: ConvertGlobalConflict, panelTopic: string): string {
    return conflict.assignedPanels
        .filter(topic => topic !== panelTopic)
        .map(topic => (topic === ALL_PANELS_SPECIAL_ID ? I18n.t('convertScript_allPanels') : topic))
        .join(', ');
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

/**
 * translated name of a hardware button side
 *
 * @param side left or right
 */
function sideText(side: 'left' | 'right'): string {
    return I18n.t(side === 'left' ? 'panelButtonDialog_sideLeft' : 'panelButtonDialog_sideRight');
}

/**
 * counts the pages of the plan per action
 *
 * @param plan plan of the adapter
 */
function countPages(plan: ConvertScriptPlan): PageCounts {
    const counts: PageCounts = { create: 0, assignNavigation: 0, removeReference: 0, taken: plan.pages.length };
    for (const page of plan.pages) {
        counts[page.action]++;
    }
    return counts;
}

/**
 * the pages of the plan that deserve a note although they are taken over: stored under another name or only
 * removed from the script because the reference is dead
 *
 * @param plan plan of the adapter
 */
function notablePages(plan: ConvertScriptPlan): ConvertPagePlan[] {
    return plan.pages.filter(page => page.storedAs !== undefined || page.action === 'removeReference');
}

/**
 * true when the plan has nothing to report besides what is taken over as it is
 *
 * @param plan plan of the adapter
 */
function hasProblems(plan: ConvertScriptPlan): boolean {
    return (
        plan.skipped.length > 0 ||
        plan.screensaverSkipped !== undefined ||
        plan.buttonsSkipped.length > 0 ||
        notablePages(plan).length > 0
    );
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
            decisions: {},
            refreshing: false,
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
                decisions: {},
                refreshing: false,
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

    /**
     * The user changed the decision for a conflicting page of the global script: plan again with it.
     *
     * @param uniqueName name of the page
     * @param value the chosen decision
     */
    private changeDecision(uniqueName: string, value: string): void {
        if (!isGlobalDecision(value)) {
            return;
        }
        this.sequence++;
        this.setState(
            { decisions: { ...this.state.decisions, [uniqueName]: value }, refreshing: true },
            () => void this.send(true),
        );
    }

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
        if (Object.keys(this.state.decisions).length > 0) {
            request.globalDecisions = { ...this.state.decisions };
        }
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
                refreshing: false,
            });
            return;
        }
        if (seq !== this.sequence) {
            return;
        }
        if (isErrorResponse(answer)) {
            // the plan stays, so a failed execution still shows what was planned
            this.setState({ phase: 'error', error: answer.error, refreshing: false });
            return;
        }
        if (!dryRun && isConvertScriptResult(answer)) {
            const result: ConvertScriptResult = { ...answer, adapterRestarts: answer.adapterRestarts === true };
            this.setState({ phase: 'done', result, plan: result, error: result.error ?? '' });
            this.props.onConverted?.(result);
            return;
        }
        if (dryRun && isConvertScriptPlan(answer)) {
            this.setState({ phase: 'preview', plan: answer, refreshing: false });
            return;
        }
        this.setState({ phase: 'error', error: I18n.t('convertScript_invalidResponse'), refreshing: false });
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

    /**
     * "1 item" / "n items"
     *
     * @param count number of items
     */
    private itemsText(count: number): string {
        return count === 1 ? I18n.t('convertScript_items_one') : I18n.t('convertScript_items', String(count));
    }

    /**
     * one raw item: position, format and why - the position only once (the detail of the planner mostly starts
     * with it, e.g. `items[2]: native item`)
     *
     * @param item raw item of the plan
     */
    private rawItemText(item: ConvertRawItem): string {
        const format = I18n.t(`rawItemDialog_format_${item.format}`);
        return item.detail.startsWith(item.item)
            ? I18n.t('convertScript_rawItemDetail', item.detail, format)
            : I18n.t('convertScript_rawItem', item.item, format, item.detail);
    }

    /**
     * one entry of a list: bold name, optional type chip, a text next to it and a secondary line
     *
     * @param key react key
     * @param name name of the page, the screensaver or the button side
     * @param type page type for the chip, '' for none
     * @param text what happens with it (skip reason, note)
     * @param detail secondary line, '' for none
     */
    private renderEntry(key: string, name: string, type: string, text: string, detail: string): React.JSX.Element {
        return (
            <ListItem
                key={key}
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
                                {name}
                            </Typography>
                            {type !== '' ? (
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    label={type}
                                />
                            ) : null}
                            <Typography
                                component="span"
                                variant="body2"
                            >
                                {text}
                            </Typography>
                        </Box>
                    }
                    secondary={detail !== '' ? detail : undefined}
                />
            </ListItem>
        );
    }

    /**
     * one or two lines: how many pages are taken over (split by action), how many are skipped, the screensaver and
     * the hardware buttons
     *
     * @param plan plan of the adapter
     */
    private renderSummary(plan: ConvertScriptPlan): React.JSX.Element {
        const counts = countPages(plan);
        const parts: string[] = [];
        if (counts.taken > 0) {
            const split: string[] = [];
            if (counts.create > 0) {
                split.push(I18n.t('convertScript_summary_create', String(counts.create)));
            }
            if (counts.assignNavigation > 0) {
                split.push(I18n.t('convertScript_summary_assignNavigation', String(counts.assignNavigation)));
            }
            if (counts.removeReference > 0) {
                split.push(I18n.t('convertScript_summary_removeReference', String(counts.removeReference)));
            }
            // the split is only worth a word when the pages are not all handled the same way
            const detail = split.length > 1 ? ` (${split.join(', ')})` : '';
            let pages = I18n.t('convertScript_summary_pages', String(counts.taken)) + detail;
            if (plan.skipped.length > 0) {
                pages += `, ${I18n.t('convertScript_summary_skipped', String(plan.skipped.length))}`;
            }
            parts.push(pages);
        } else if (plan.skipped.length > 0) {
            parts.push(
                `${I18n.t('convertScript_summary_pagesNone')}, ${I18n.t('convertScript_summary_skipped', String(plan.skipped.length))}`,
            );
        } else {
            parts.push(I18n.t('convertScript_summary_pagesNone'));
        }
        if (plan.screensaver) {
            parts.push(I18n.t('convertScript_summary_screensaver'));
        } else if (plan.screensaverSkipped) {
            parts.push(I18n.t('convertScript_summary_screensaverSkipped'));
        } else {
            parts.push(I18n.t('convertScript_summary_screensaverNone'));
        }
        const buttons: string[] = [];
        for (const side of BUTTON_SIDES) {
            if (plan.buttons[side]) {
                buttons.push(sideText(side));
            } else if (plan.buttonsSkipped.some(entry => entry.side === side)) {
                buttons.push(I18n.t('convertScript_summary_skipped', sideText(side)));
            }
        }
        parts.push(
            buttons.length > 0
                ? I18n.t('convertScript_summary_buttons', buttons.join(', '))
                : I18n.t('convertScript_summary_buttonsNone'),
        );
        return (
            <Typography
                variant="body1"
                sx={{ mt: 2 }}
            >
                {parts.join(' · ')}
            </Typography>
        );
    }

    /**
     * the problems only: skipped pages, screensaver and buttons with their reason, pages that are stored under
     * another name and dead references that are only removed from the script
     *
     * @param plan plan of the adapter
     */
    private renderProblems(plan: ConvertScriptPlan): React.JSX.Element {
        if (!hasProblems(plan)) {
            return (
                <>
                    {this.renderSectionTitle(I18n.t('convertScript_problems'))}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {I18n.t('convertScript_noProblems')}
                    </Typography>
                </>
            );
        }
        const rows: React.JSX.Element[] = [];
        if (plan.screensaverSkipped) {
            rows.push(
                this.renderEntry(
                    'screensaver',
                    I18n.t('convertScript_screensaver'),
                    '',
                    reasonText(plan.screensaverSkipped.reason),
                    plan.screensaverSkipped.detail ?? '',
                ),
            );
        }
        for (const entry of plan.buttonsSkipped) {
            rows.push(
                this.renderEntry(
                    `button-${entry.side}`,
                    `${I18n.t('convertScript_buttons')}: ${sideText(entry.side)}`,
                    '',
                    reasonText(entry.reason),
                    entry.detail ?? '',
                ),
            );
        }
        plan.skipped.forEach((entry: ConvertSkipped, index: number) =>
            rows.push(
                this.renderEntry(
                    `skipped-${index}-${entry.uniqueName}`,
                    entry.uniqueName,
                    entry.type,
                    reasonText(entry.reason),
                    entry.detail ?? '',
                ),
            ),
        );
        for (const page of notablePages(plan)) {
            const notes: string[] = [];
            if (page.storedAs !== undefined) {
                notes.push(I18n.t('convertScript_storedAs', page.storedAs));
            }
            if (page.action === 'removeReference') {
                notes.push(page.reason ? reasonText(page.reason) : actionText(page.action));
            }
            rows.push(this.renderEntry(`note-${page.uniqueName}`, page.uniqueName, page.type, notes.join(' · '), ''));
        }
        return (
            <>
                {this.renderSectionTitle(I18n.t('convertScript_problems'))}
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
     * info, no problem: the items the editor cannot express, taken over as raw data per page and for the
     * screensaver - the panel behaves as before
     *
     * @param plan plan of the adapter
     */
    private renderRawItems(plan: ConvertScriptPlan): React.JSX.Element | null {
        const groups: { key: string; name: string; type: string; items: ConvertRawItem[] }[] = [];
        for (const page of plan.pages) {
            if (page.rawItems?.length) {
                groups.push({
                    key: `raw-${page.uniqueName}`,
                    name: page.uniqueName,
                    type: page.type,
                    items: page.rawItems,
                });
            }
        }
        if (plan.screensaver?.rawItems?.length) {
            groups.push({
                key: 'raw-screensaver',
                name: I18n.t('convertScript_screensaver'),
                type: '',
                items: plan.screensaver.rawItems,
            });
        }
        if (groups.length === 0) {
            return null;
        }
        return (
            <Alert
                severity="info"
                sx={{ mt: 2 }}
            >
                <AlertTitle>{I18n.t('convertScript_rawItems')}</AlertTitle>
                <Typography variant="body2">{I18n.t('convertScript_rawItemsHint')}</Typography>
                <List
                    dense
                    disablePadding
                >
                    {groups.map(group =>
                        this.renderEntry(
                            group.key,
                            group.name,
                            group.type,
                            this.itemsText(group.items.length),
                            group.items.map(item => this.rawItemText(item)).join(' · '),
                        ),
                    )}
                </List>
            </Alert>
        );
    }

    /**
     * info, no problem: items whose long press was dropped - only the grid pages (cardGrid / cardGrid2 / cardGrid3)
     * have a long press, the item itself is taken over
     *
     * @param plan plan of the adapter
     */
    private renderLongPressDropped(plan: ConvertScriptPlan): React.JSX.Element | null {
        const pages = plan.pages.filter(page => page.longPressDropped?.length);
        if (pages.length === 0) {
            return null;
        }
        return (
            <Alert
                severity="info"
                sx={{ mt: 2 }}
            >
                <AlertTitle>{I18n.t('convertScript_longPressDropped')}</AlertTitle>
                <Typography variant="body2">{I18n.t('convertScript_longPressDroppedHint')}</Typography>
                <List
                    dense
                    disablePadding
                >
                    {pages.map(page => {
                        const items = page.longPressDropped ?? [];
                        return this.renderEntry(
                            `longpress-${page.uniqueName}`,
                            page.uniqueName,
                            page.type,
                            this.itemsText(items.length),
                            items.join(', '),
                        );
                    })}
                </List>
            </Alert>
        );
    }

    /**
     * the pages of the global script that differ from the admin entry of the same name, with the choice per page
     *
     * @param plan plan of the adapter
     * @param editable true in the preview - the decisions can be changed
     */
    private renderConflicts(plan: ConvertScriptPlan, editable: boolean): React.JSX.Element | null {
        const conflicts = plan.conflicts ?? [];
        if (conflicts.length === 0) {
            return null;
        }
        const disabled = !editable || this.state.refreshing;
        return (
            <>
                {this.renderSectionTitle(I18n.t('convertScript_conflicts'))}
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {I18n.t('convertScript_conflictsHint')}
                </Typography>
                <List
                    dense
                    disablePadding
                >
                    {conflicts.map(conflict => {
                        const others = otherPanelsText(conflict, plan.panelTopic);
                        return (
                            <ListItem
                                key={`conflict-${conflict.uniqueName}`}
                                disableGutters
                                sx={{ py: 0.5, display: 'block' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography
                                        component="span"
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        {conflict.uniqueName}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={conflict.type}
                                    />
                                    {conflict.differences.length > 0 ? (
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {I18n.t(
                                                'convertScript_conflictDifferences',
                                                conflict.differences.join(', '),
                                            )}
                                        </Typography>
                                    ) : null}
                                </Box>
                                <RadioGroup
                                    row
                                    value={conflict.decision}
                                    onChange={(_event, value) => this.changeDecision(conflict.uniqueName, value)}
                                >
                                    {CONVERT_GLOBAL_DECISIONS.map(decision => (
                                        <FormControlLabel
                                            key={decision}
                                            value={decision}
                                            control={<Radio size="small" />}
                                            label={I18n.t(`convertScript_decision_${decision}`)}
                                            disabled={disabled}
                                        />
                                    ))}
                                </RadioGroup>
                                {conflict.decision === 'takeScript' && others !== '' ? (
                                    <Alert
                                        severity="warning"
                                        sx={{ py: 0 }}
                                    >
                                        {I18n.t('convertScript_conflictOtherPanels', others)}
                                    </Alert>
                                ) : null}
                            </ListItem>
                        );
                    })}
                </List>
            </>
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
                        page.global ? I18n.t('convertScript_globalPage') : '',
                        page.storedAs ? I18n.t('convertScript_storedAs', page.storedAs) : '',
                        this.itemsText(page.itemCount),
                        navigation,
                    ]
                        .filter(part => part !== '')
                        .join(' · ')}
                />
            </ListItem>
        );
    }

    private renderScreensaverDetail(plan: ConvertScriptPlan): React.JSX.Element | null {
        if (!plan.screensaver) {
            return null;
        }
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
                </Box>
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {this.itemsText(itemCount)} · {I18n.t('convertScript_notifications', String(notifyCount))}
                </Typography>
            </>
        );
    }

    private renderButtonsDetail(plan: ConvertScriptPlan): React.JSX.Element | null {
        const rows: React.JSX.Element[] = [];
        for (const side of BUTTON_SIDES) {
            const action = plan.buttons[side];
            if (action) {
                rows.push(
                    <ListItem
                        key={side}
                        disableGutters
                        sx={{ py: 0.5 }}
                    >
                        <ListItemText
                            primary={
                                <Typography
                                    component="span"
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    {sideText(side)}
                                </Typography>
                            }
                            secondary={buttonText(action)}
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
     * everything that is taken over as planned, folded away: the pages, the screensaver and the hardware buttons
     *
     * @param plan plan of the adapter
     */
    private renderDetails(plan: ConvertScriptPlan): React.JSX.Element | null {
        const hasButtons = BUTTON_SIDES.some(side => plan.buttons[side] !== undefined);
        if (plan.pages.length === 0 && !plan.screensaver && !hasButtons) {
            return null;
        }
        return (
            <Accordion
                disableGutters
                elevation={0}
                variant="outlined"
                sx={{ mt: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                        {I18n.t('convertScript_details', String(plan.pages.length))}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
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
                    {this.renderScreensaverDetail(plan)}
                    {this.renderButtonsDetail(plan)}
                </AccordionDetails>
            </Accordion>
        );
    }

    /**
     * the plan: the hints before the conversion, the summary, the problems and the folded details
     *
     * @param plan plan of the adapter
     * @param showHints true in the preview (backup, reload and unsaved-changes hints), false under an error
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

                {this.renderSummary(plan)}
                {this.renderConflicts(plan, showHints)}
                {this.renderProblems(plan)}
                {this.renderRawItems(plan)}
                {this.renderLongPressDropped(plan)}
                {this.renderDetails(plan)}
            </>
        );
    }

    /**
     * the report after the conversion: summary, backup, script notes and the reload hint - not the plan again
     *
     * @param result result of the adapter
     */
    private renderResult(result: ConvertScriptResult): React.JSX.Element {
        const counts = countPages(result);
        const extras: string[] = [];
        if (result.skipped.length > 0) {
            extras.push(I18n.t('convertScript_summary_skipped', String(result.skipped.length)));
        }
        if (result.screensaver) {
            extras.push(I18n.t('convertScript_result_screensaver'));
        }
        const buttonCount = BUTTON_SIDES.filter(side => result.buttons[side] !== undefined).length;
        if (buttonCount > 0) {
            extras.push(I18n.t('convertScript_result_buttons', String(buttonCount)));
        }
        const summary =
            I18n.t(
                'convertScript_result_pages',
                String(counts.create),
                String(counts.assignNavigation),
                String(counts.removeReference),
            ) + (extras.length > 0 ? ` · ${extras.join(' · ')}` : '');
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
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {I18n.t('convertScript_script', result.scriptId)}
                </Typography>
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
        const { open, panelName, panelTopic, phase, plan, executeTimedOut, refreshing } = this.state;
        // the dry run may be cancelled (the sequence counter drops its late answer), the execution may not
        const busy = phase === 'executing';
        const nothingToDo = phase === 'preview' && plan !== null && plan.nothingToDo;
        const canConvert = phase === 'preview' && plan !== null && !plan.nothingToDo && !refreshing;
        const offerReload = phase === 'done' || (phase === 'error' && executeTimedOut);
        // with nothing to take over the dialog only informs - its one button closes it
        const closeLabel = offerReload || nothingToDo ? 'convertScript_close' : 'Cancel';
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
                        {I18n.t(closeLabel)}
                    </Button>
                    {offerReload ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.reload}
                        >
                            {I18n.t('convertScript_reloadAdmin')}
                        </Button>
                    ) : null}
                    {!offerReload && !nothingToDo ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.convert}
                            disabled={!canConvert}
                        >
                            {I18n.t('convertScript_convert')}
                        </Button>
                    ) : null}
                </DialogActions>
            </Dialog>
        );
    }
}

export default ConvertScriptDialog;
