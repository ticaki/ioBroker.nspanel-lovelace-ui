import React from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    type SelectChangeEvent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { I18n } from '@iobroker/gui-components';
import {
    ALL_PANELS_SPECIAL_ID,
    type NavigationOverride,
    type PageConfigEntry,
    type ScreensaverEntry,
    type ScreensaverNotifyConfig,
} from '../../../src/lib/types/adminShareConfig';
import {
    effectivePageAssignment,
    panelConfigGroups,
    panelSettingStateIds,
    type ExportPanel,
    type PageSecretField,
    type PanelConfigGroup,
} from '../../../src/lib/types/panelConfigExport';
import {
    applyPanelImport,
    configDiff,
    danglingNavigation,
    panelOverwriteSummary,
    scriptPagesFromMeta,
    importSecretPages,
    panelImportChanges,
    navigationDiff,
    panelConfiguredGroups,
    parsePanelConfigImport,
    planPanelImport,
    plannedPageContent,
    plannedScreensaverContent,
    SCREENSAVER_CHOICE_KEY,
    type ConfigDiffEntry,
    type DanglingLink,
    type PanelImportMode,
    type PanelScriptPages,
    type ImportAction,
    type ImportChoice,
    type ImportNative,
    type PanelConfigImportFile,
    type PanelImportInput,
    type PanelImportPlan,
    type PanelImportReport,
    type PlannedPage,
    type PlannedScreensaver,
} from '../../../src/lib/types/panelConfigImport';

/** the native keys the import may change */
export type PanelImportNativeValues = {
    pageConfig?: PageConfigEntry[];
    screensaverConfig?: ScreensaverEntry[];
    screensaverNotify?: ScreensaverNotifyConfig[];
    panels?: ExportPanel[];
    navigationOverrides?: NavigationOverride[];
};

export interface PanelImportDialogProps {
    socket: any;
    adapterName: string;
    instance: string | number;
    /** the instance configuration as shown in the admin (`props.data`) */
    data: ImportNative;
    /** hands the changed tables to the admin in one change */
    onApplyNative: (values: PanelImportNativeValues) => Promise<void>;
}

/** one row of the review: a page or the screensaver */
type ReviewRow = { key: string; label: string; row: PlannedPage | PlannedScreensaver; isScreensaver: boolean };

interface PanelImportDialogState {
    step: 'closed' | 'groups' | 'review' | 'result';
    panel: ExportPanel | null;
    groups: Record<PanelConfigGroup, boolean>;
    /** error of the chosen file */
    error: string | null;
    file: PanelConfigImportFile | null;
    /** settings states of the target as read when the file was chosen */
    targetStates: Record<string, unknown>;
    choices: Record<string, ImportChoice>;
    showUnchanged: boolean;
    /** key of the row whose differences are shown */
    diffFor: string | null;
    /** key of the row waiting for the confirmation of "replace" */
    replaceFor: string | null;
    applying: boolean;
    /** merge (default) or complete overwrite of the target */
    mode: PanelImportMode;
    /** script pages of the target, undefined = unknown */
    script: PanelScriptPages | undefined;
    /** safety confirmation of the complete overwrite is open */
    confirmOverwrite: boolean;
    /** list of the removed own pages in the confirmation is open */
    showRemovedPages: boolean;
    result: {
        report: PanelImportReport;
        statesWritten: string[];
        statesSkipped: string[];
        dangling: { links: DanglingLink[]; incomplete: boolean };
    } | null;
}

const allGroups: Record<PanelConfigGroup, boolean> = { pages: true, screensaver: true, misc: true };

/** translation keys of the groups */
const groupLabels: Record<PanelConfigGroup, string> = {
    pages: 'importGroupPages',
    screensaver: 'importGroupScreensaver',
    misc: 'importGroupMisc',
};

/**
 * Import of a panel configuration file into one panel: choose groups and file, review the plan (conflicts:
 * rename / replace / skip), apply. The tables change in the admin (the user saves), the settings states are
 * written at once.
 */
export default class PanelImportDialog extends React.Component<PanelImportDialogProps, PanelImportDialogState> {
    private fileInputRef = React.createRef<HTMLInputElement>();

    constructor(props: PanelImportDialogProps) {
        super(props);
        this.state = {
            step: 'closed',
            panel: null,
            groups: { ...allGroups },
            error: null,
            file: null,
            targetStates: {},
            choices: {},
            showUnchanged: false,
            diffFor: null,
            replaceFor: null,
            applying: false,
            mode: 'merge',
            script: undefined,
            confirmOverwrite: false,
            showRemovedPages: false,
            result: null,
        };
    }

    /**
     * Opens the dialog for a panel.
     *
     * @param panel the target panel
     */
    public openFor(panel: ExportPanel): void {
        this.setState({
            step: 'groups',
            panel,
            groups: { ...allGroups },
            error: null,
            file: null,
            targetStates: {},
            choices: {},
            showUnchanged: false,
            diffFor: null,
            replaceFor: null,
            applying: false,
            mode: 'merge',
            script: undefined,
            confirmOverwrite: false,
            showRemovedPages: false,
            result: null,
        });
    }

    private close = (): void => {
        this.setState({ step: 'closed', file: null, result: null });
    };

    private selectedGroups(): PanelConfigGroup[] {
        return panelConfigGroups.filter(g => this.state.groups[g]);
    }

    /**
     * @returns true when the complete overwrite can be chosen: it needs the pages of the file
     */
    private overwritePossible(): boolean {
        return this.state.groups.pages && !!this.state.file?.groups.pages;
    }

    private input(): PanelImportInput | null {
        const { panel, file, choices, script } = this.state;
        if (!panel?.topic || !file) {
            return null;
        }
        return {
            native: this.props.data,
            topic: panel.topic,
            file,
            groups: this.selectedGroups(),
            choices,
            mode: this.state.mode === 'overwrite' && this.overwritePossible() ? 'overwrite' : 'merge',
            script,
        };
    }

    private plan(): PanelImportPlan | null {
        const input = this.input();
        return input ? planPanelImport(input) : null;
    }

    /**
     * @param topic topic of a panel or the "all panels" marker
     * @returns name of the panel for the user
     */
    private panelLabel(topic: string): string {
        if (topic === ALL_PANELS_SPECIAL_ID) {
            return I18n.t('importAllPanels');
        }
        const panel = (this.props.data.panels ?? []).find(p => p?.topic === topic);
        return panel?.name ? `${panel.name} (${topic})` : topic;
    }

    private async readTargetStates(panelId: string): Promise<Record<string, unknown>> {
        const out: Record<string, unknown> = {};
        for (const [key, id] of Object.entries(
            panelSettingStateIds(panelId, `${this.props.adapterName}.${this.props.instance}`),
        )) {
            try {
                const state = await this.props.socket.getState(id);
                if (state && state.val != null) {
                    out[key] = state.val;
                }
            } catch {
                // unreadable states count as default
            }
        }
        return out;
    }

    private handleFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const fileObj = event.target.files?.[0];
        event.target.value = '';
        if (!fileObj) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (): void => {
            void this.onFileText(typeof reader.result === 'string' ? reader.result : '');
        };
        reader.onerror = (): void => {
            this.setState({ error: I18n.t('importErrorJson').replace('%s', String(reader.error?.message ?? '')) });
        };
        reader.readAsText(fileObj);
    };

    private async onFileText(text: string): Promise<void> {
        const parsed = parsePanelConfigImport(text);
        if (!parsed.ok) {
            this.setState({ error: I18n.t(parsed.error.key).replace('%s', parsed.error.detail ?? '') });
            return;
        }
        const targetStates = this.state.panel?.id ? await this.readTargetStates(this.state.panel.id) : {};
        const script = await this.readScriptPages(this.state.panel?.topic ?? '');
        this.setState({
            file: parsed.file,
            targetStates,
            script,
            error: null,
            choices: {},
            mode: 'merge',
            step: 'review',
        });
    }

    /**
     * Reads the script pages of the target from the meta object of the instance - works while the adapter is
     * stopped as well.
     *
     * @param topic topic of the target
     * @returns the script pages, undefined when the meta object cannot be read
     */
    private async readScriptPages(topic: string): Promise<PanelScriptPages | undefined> {
        try {
            const obj = await this.props.socket.getObject(`${this.props.adapterName}.${this.props.instance}`);
            return obj ? scriptPagesFromMeta(obj.native, topic) : undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * @param key row key
     * @param action new action
     */
    private setAction(key: string, action: ImportAction): void {
        if (action === 'replace') {
            this.setState({ replaceFor: key });
            return;
        }
        this.setState(prev => ({ choices: { ...prev.choices, [key]: { ...prev.choices[key], action } } }));
    }

    private confirmReplace = (): void => {
        const key = this.state.replaceFor;
        if (key) {
            this.setState(prev => ({ replaceFor: null, choices: { ...prev.choices, [key]: { action: 'replace' } } }));
        }
    };

    /**
     * @param key row key
     * @param name typed name
     */
    private setName(key: string, name: string): void {
        this.setState(prev => ({ choices: { ...prev.choices, [key]: { action: 'rename', name } } }));
    }

    /** Importieren: a complete overwrite asks first */
    private requestImport = (): void => {
        if (this.input()?.mode === 'overwrite') {
            this.setState({ confirmOverwrite: true, showRemovedPages: false });
            return;
        }
        void this.handleImport();
    };

    private handleImport = async (): Promise<void> => {
        const input = this.input();
        const plan = input ? planPanelImport(input) : null;
        if (!input || !plan?.valid || !this.state.panel?.id) {
            return;
        }
        this.setState({ applying: true, confirmOverwrite: false });
        const result = applyPanelImport(input, plan);
        await this.props.onApplyNative(result.native);
        const statesWritten: string[] = [];
        const statesSkipped: string[] = [];
        const ids = panelSettingStateIds(this.state.panel.id, `${this.props.adapterName}.${this.props.instance}`);
        for (const [key, val] of Object.entries(result.states)) {
            if (this.state.targetStates[key] === val) {
                // same value on the target already - nothing to write
                continue;
            }
            try {
                const obj = await this.props.socket.getObject(ids[key]);
                if (!obj) {
                    statesSkipped.push(key);
                    continue;
                }
                await this.props.socket.setState(ids[key], { val, ack: false });
                statesWritten.push(key);
            } catch {
                statesSkipped.push(key);
            }
        }
        this.setState({
            applying: false,
            step: 'result',
            result: {
                report: result.report,
                statesWritten,
                statesSkipped,
                dangling: danglingNavigation(input, result),
            },
        });
    };

    // -----------------------------------------------------------------------------------------------------------
    // rendering
    // -----------------------------------------------------------------------------------------------------------

    private renderGroups(): React.JSX.Element {
        const anySelected = this.selectedGroups().length > 0;
        return (
            <>
                <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>{I18n.t('importGroupsText')}</DialogContentText>
                    <FormGroup>
                        {panelConfigGroups.map(g => (
                            <FormControlLabel
                                key={g}
                                control={
                                    <Checkbox
                                        checked={this.state.groups[g]}
                                        onChange={(e): void =>
                                            this.setState(prev => ({
                                                groups: { ...prev.groups, [g]: e.target.checked },
                                            }))
                                        }
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography>{I18n.t(groupLabels[g])}</Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {I18n.t(`${groupLabels[g]}Hint`)}
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', mb: 1, '& .MuiCheckbox-root': { pt: 0.5 } }}
                            />
                        ))}
                    </FormGroup>
                    {this.state.error ? (
                        <Alert
                            severity="error"
                            sx={{ mt: 1 }}
                        >
                            {this.state.error}
                        </Alert>
                    ) : null}
                    <input
                        ref={this.fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={this.handleFile}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close}>{I18n.t('importCancel')}</Button>
                    <Button
                        variant="contained"
                        startIcon={<UploadFileIcon />}
                        disabled={!anySelected}
                        onClick={(): void => this.fileInputRef.current?.click()}
                    >
                        {I18n.t('importChooseFile')}
                    </Button>
                </DialogActions>
            </>
        );
    }

    private reviewRows(plan: PanelImportPlan): ReviewRow[] {
        const rows: ReviewRow[] = plan.pages.map(row => ({
            key: row.original,
            label: row.original,
            row,
            isScreensaver: false,
        }));
        if (plan.screensaver) {
            rows.push({
                key: SCREENSAVER_CHOICE_KEY,
                label: `${I18n.t('importGroupScreensaver')}: ${plan.screensaver.original}`,
                row: plan.screensaver,
                isScreensaver: true,
            });
        }
        return rows;
    }

    /**
     * @param r the row
     * @returns a chip when a script page of the target has the name of the page, else null
     */
    private static renderScriptChip(r: ReviewRow): React.JSX.Element | null {
        if (r.isScreensaver || !('scriptPage' in r.row) || !r.row.scriptPage) {
            return null;
        }
        const kind = r.row.scriptPage;
        const key =
            kind === 'global'
                ? 'importScriptGlobal'
                : kind === 'local'
                  ? 'importScriptLocal'
                  : 'importScriptLocalBlocked';
        return (
            <Chip
                size="small"
                color={kind === 'localBlocked' ? 'warning' : 'info'}
                variant="outlined"
                label={I18n.t(key)}
                data-script-page={kind}
                sx={{ ml: 0.5 }}
            />
        );
    }

    private renderStatusChip(r: ReviewRow): React.JSX.Element {
        const { row } = r;
        if (row.conflict === 'different') {
            return (
                <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label={I18n.t('importStatusDifferent')}
                    onClick={(): void => this.setState({ diffFor: r.key })}
                    title={I18n.t('importShowDiff')}
                    clickable
                />
            );
        }
        const status = PanelImportDialog.rowStatus(r);
        return (
            <Chip
                size="small"
                color={status.color}
                variant="outlined"
                label={I18n.t(status.key)}
            />
        );
    }

    /**
     * Status of a row without conflict.
     *
     * @param r the row
     * @returns translation key and chip color
     */
    private static rowStatus(r: ReviewRow): {
        key: string;
        color: 'default' | 'success' | 'info' | 'warning';
    } {
        const { row } = r;
        if (row.action === 'skip') {
            return { key: 'importActionSkip', color: 'default' };
        }
        if (row.action !== 'merge') {
            return { key: 'importActionAdd', color: 'info' };
        }
        switch (row.status) {
            case 'unchanged':
                return { key: 'importStatusUnchanged', color: 'default' };
            case 'navigation':
                return { key: 'importStatusNavigation', color: 'info' };
            case 'unassign':
                return { key: 'importStatusUnassign', color: 'warning' };
            default:
                return { key: 'importActionMerge', color: 'success' };
        }
    }

    /**
     * @param rows rows without conflict
     * @returns e.g. "20 unverändert, 3 Zuweisung ergänzen"
     */
    private static statusCounts(rows: ReviewRow[]): string {
        const counts = new Map<string, number>();
        for (const r of rows) {
            const key = PanelImportDialog.rowStatus(r).key;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return [...counts.entries()].map(([key, n]) => `${n} ${I18n.t(key)}`).join(', ');
    }

    private renderConflictRow(r: ReviewRow): React.JSX.Element {
        const { row } = r;
        const nameValue = this.state.choices[r.key]?.name ?? row.name;
        return (
            <TableRow key={r.key}>
                <TableCell sx={{ wordBreak: 'break-word', maxWidth: 220 }}>{r.label}</TableCell>
                <TableCell>
                    {this.renderStatusChip(r)}
                    {PanelImportDialog.renderScriptChip(r)}
                </TableCell>
                <TableCell sx={{ minWidth: 260 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Select
                            size="small"
                            value={row.action}
                            onChange={(e: SelectChangeEvent): void => {
                                if (isImportAction(e.target.value)) {
                                    this.setAction(r.key, e.target.value);
                                }
                            }}
                            inputProps={{ 'aria-label': I18n.t('importAction') }}
                        >
                            <MenuItem value="rename">{I18n.t('importActionRename')}</MenuItem>
                            <MenuItem value="replace">{I18n.t('importActionReplace')}</MenuItem>
                            <MenuItem value="skip">{I18n.t('importActionSkip')}</MenuItem>
                        </Select>
                        {row.action === 'rename' ? (
                            <TextField
                                size="small"
                                variant="outlined"
                                label={I18n.t('importNewName')}
                                value={nameValue}
                                error={!!row.nameError}
                                helperText={row.nameError ? I18n.t(row.nameError) : undefined}
                                onChange={(e): void => this.setName(r.key, e.target.value)}
                                slotProps={{ htmlInput: { 'data-import-name': r.key } }}
                            />
                        ) : null}
                    </Box>
                </TableCell>
            </TableRow>
        );
    }

    private renderReview(): React.JSX.Element | null {
        const { file, panel } = this.state;
        const plan = this.plan();
        if (!file || !panel || !plan) {
            return null;
        }
        const rows = this.reviewRows(plan);
        const conflicts = rows.filter(r => r.row.conflict === 'different');
        const plain = rows.filter(r => r.row.conflict !== 'different');
        // a hint only for groups that hold an own configuration of the target and that the import really changes
        const input = this.input();
        const changes = input ? panelImportChanges(input, plan, this.state.targetStates) : [];
        const overwrite = input?.mode === 'overwrite';
        const overwritten = overwrite
            ? []
            : panelConfiguredGroups(this.props.data, panel.topic ?? '', this.state.targetStates).filter(g =>
                  changes.includes(g),
              );
        const summary = overwrite && input ? panelOverwriteSummary(input, plan) : null;
        const blocked = plan.pages.filter(p => p.scriptPage === 'localBlocked').map(p => p.name);
        const targetModel = panel.model || 'eu';
        // existing pages keep their secrets - only pages created by the import need them again
        const secretPages = input ? importSecretPages(input, plan) : [];
        return (
            <>
                <DialogContent>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                    >
                        {I18n.t('importSource')
                            .replace('%s', file.source.name || file.source.topic)
                            .replace('%s', I18n.t(`${file.source.model}-Version`))
                            .replace('%s', file.exportedAt ? new Date(file.exportedAt).toLocaleString() : '-')}
                    </Typography>
                    {this.renderModeSwitch()}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        {summary ? this.renderRemaining(summary.remainingAllPages, summary.remainingGlobalPages) : null}
                        {blocked.length ? (
                            <Alert severity="warning">
                                {I18n.t('importScriptLocalBlockedHint').replace('%s', blocked.join(', '))}
                            </Alert>
                        ) : null}
                        {overwritten.length ? (
                            <Alert severity="warning">
                                {I18n.t('importOverwriteHint').replace(
                                    '%s',
                                    overwritten.map(g => I18n.t(groupLabels[g])).join(', '),
                                )}
                            </Alert>
                        ) : null}
                        {plan.groups.includes('misc') ? (
                            <Alert severity="info">{I18n.t('importStatesImmediate')}</Alert>
                        ) : null}
                        {file.source.model !== targetModel ? (
                            <Alert severity="warning">
                                {I18n.t('importModelMismatch')
                                    .replace('%s', I18n.t(`${file.source.model}-Version`))
                                    .replace('%s', I18n.t(`${targetModel}-Version`))}
                            </Alert>
                        ) : null}
                        {plan.missingGroups.length ? (
                            <Alert severity="info">
                                {I18n.t('importGroupsMissing').replace(
                                    '%s',
                                    plan.missingGroups.map(g => I18n.t(groupLabels[g])).join(', '),
                                )}
                            </Alert>
                        ) : null}
                        {secretPages.length ? (
                            <Alert severity="info">
                                {I18n.t('importSecretsStripped').replace('%s', secretPages.map(p => p.page).join(', '))}
                            </Alert>
                        ) : null}
                    </Box>
                    {conflicts.length ? (
                        <>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600 }}
                            >
                                {I18n.t('importConflicts').replace('%s', String(conflicts.length))}
                            </Typography>
                            <Table
                                size="small"
                                sx={{ mb: 2 }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{I18n.t('importColName')}</TableCell>
                                        <TableCell>{I18n.t('importColStatus')}</TableCell>
                                        <TableCell>{I18n.t('importAction')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>{conflicts.map(r => this.renderConflictRow(r))}</TableBody>
                            </Table>
                        </>
                    ) : null}
                    {plain.length ? (
                        <>
                            <Button
                                size="small"
                                onClick={(): void => this.setState(prev => ({ showUnchanged: !prev.showUnchanged }))}
                                endIcon={this.state.showUnchanged ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            >
                                {`${I18n.t('importWithoutConflict').replace('%s', String(plain.length))} (${PanelImportDialog.statusCounts(plain)})`}
                            </Button>
                            <Collapse in={this.state.showUnchanged}>
                                <Table size="small">
                                    <TableBody>
                                        {plain.map(r => (
                                            <TableRow key={r.key}>
                                                <TableCell sx={{ wordBreak: 'break-word' }}>{r.label}</TableCell>
                                                <TableCell align="right">
                                                    {PanelImportDialog.renderScriptChip(r)}
                                                    {this.renderStatusChip(r)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Collapse>
                        </>
                    ) : null}
                    {!rows.length ? (
                        <Typography color="text.secondary">{I18n.t('importNothingListed')}</Typography>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close}>{I18n.t('importCancel')}</Button>
                    <Button
                        variant="contained"
                        disabled={!plan.valid || this.state.applying}
                        color={overwrite ? 'error' : 'primary'}
                        onClick={this.requestImport}
                        startIcon={this.state.applying ? <CircularProgress size={16} /> : undefined}
                    >
                        {I18n.t('importApply')}
                    </Button>
                </DialogActions>
            </>
        );
    }

    private renderModeSwitch(): React.JSX.Element {
        const possible = this.overwritePossible();
        const mode = this.state.mode === 'overwrite' && possible ? 'overwrite' : 'merge';
        return (
            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    color={mode === 'overwrite' ? 'error' : 'primary'}
                    value={mode}
                    onChange={(_e, value: unknown): void => {
                        if (value === 'merge' || value === 'overwrite') {
                            this.setState({ mode: value });
                        }
                    }}
                    aria-label={I18n.t('importModeLabel')}
                >
                    <ToggleButton
                        value="merge"
                        data-import-mode="merge"
                    >
                        {I18n.t('importModeMerge')}
                    </ToggleButton>
                    <ToggleButton
                        value="overwrite"
                        data-import-mode="overwrite"
                        disabled={!possible}
                    >
                        {I18n.t('importModeOverwrite')}
                    </ToggleButton>
                </ToggleButtonGroup>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                >
                    {I18n.t(
                        !possible
                            ? 'importModeNeedsPages'
                            : mode === 'overwrite'
                              ? 'importModeOverwriteHint'
                              : 'importModeMergeHint',
                    )}
                </Typography>
            </Box>
        );
    }

    /**
     * What stays on the target besides the imported pages (complete overwrite).
     *
     * @param allPages pages for all panels that stay
     * @param globalPages pages of the global script that stay, undefined = unknown
     * @returns the box
     */
    private renderRemaining(allPages: string[], globalPages: string[] | undefined): React.JSX.Element {
        return (
            <Alert
                severity="info"
                data-import-remaining=""
                sx={{ '& .MuiAlert-message': { minWidth: 0, wordBreak: 'break-word' } }}
            >
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                >
                    {I18n.t('importRemainingTitle')}
                </Typography>
                {!allPages.length && globalPages && !globalPages.length ? (
                    <Typography variant="body2">{I18n.t('importRemainingNone')}</Typography>
                ) : null}
                {allPages.length ? (
                    <Typography variant="body2">
                        {`${I18n.t('importRemainingAll').replace('%s', String(allPages.length))}: ${allPages.join(', ')}`}
                    </Typography>
                ) : null}
                {globalPages === undefined ? (
                    <Typography variant="body2">{I18n.t('importScriptUnknown')}</Typography>
                ) : globalPages.length ? (
                    <Typography variant="body2">
                        {`${I18n.t('importRemainingGlobal').replace('%s', String(globalPages.length))}: ${globalPages.join(', ')}`}
                    </Typography>
                ) : null}
            </Alert>
        );
    }

    private renderOverwriteConfirm(): React.JSX.Element | null {
        const input = this.state.confirmOverwrite ? this.input() : null;
        const plan = input ? planPanelImport(input) : null;
        const panel = this.state.panel;
        if (!input || !plan || !panel) {
            return null;
        }
        const sum = panelOverwriteSummary(input, plan);
        const close = (): void => this.setState({ confirmOverwrite: false });
        return (
            <Dialog
                open
                onClose={close}
                maxWidth="sm"
                fullWidth
                aria-labelledby="panel-overwrite-title"
            >
                <DialogTitle
                    id="panel-overwrite-title"
                    sx={{ wordBreak: 'break-word' }}
                >
                    {I18n.t('importOverwriteTitle').replace('%s', panel.name || panel.topic || '')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>{I18n.t('importOverwriteIntro')}</DialogContentText>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Alert
                            severity="warning"
                            data-overwrite="pages"
                            sx={{ '& .MuiAlert-message': { minWidth: 0, width: '100%' } }}
                        >
                            {sum.removedOwnPages.length ? (
                                <>
                                    <Button
                                        size="small"
                                        color="inherit"
                                        sx={{ p: 0, textTransform: 'none', textAlign: 'left' }}
                                        onClick={(): void =>
                                            this.setState(prev => ({ showRemovedPages: !prev.showRemovedPages }))
                                        }
                                        endIcon={this.state.showRemovedPages ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    >
                                        {I18n.t('importOverwriteRemoved').replace(
                                            '%s',
                                            String(sum.removedOwnPages.length),
                                        )}
                                    </Button>
                                    <Collapse in={this.state.showRemovedPages}>
                                        <Box
                                            component="ul"
                                            sx={{ mt: 0.5, mb: 0, pl: 3, wordBreak: 'break-word' }}
                                        >
                                            {sum.removedOwnPages.map(n => (
                                                <li key={n}>{n}</li>
                                            ))}
                                        </Box>
                                    </Collapse>
                                </>
                            ) : (
                                I18n.t('importOverwriteRemovedNone')
                            )}
                        </Alert>
                        <Alert
                            severity="warning"
                            data-overwrite="script"
                            sx={{ '& .MuiAlert-message': { minWidth: 0, wordBreak: 'break-word' } }}
                        >
                            {!sum.scriptActive
                                ? I18n.t('importOverwriteScriptOff')
                                : sum.scriptPages === undefined
                                  ? `${I18n.t('importOverwriteScriptNone')} ${I18n.t('importScriptUnknown')}`
                                  : sum.scriptPages.length
                                    ? `${I18n.t('importOverwriteScript').replace('%s', String(sum.scriptPages.length))} ${sum.scriptPages.join(', ')}`
                                    : I18n.t('importOverwriteScriptNone')}
                        </Alert>
                        <Alert
                            severity="warning"
                            data-overwrite="overrides"
                            sx={{ '& .MuiAlert-message': { minWidth: 0, wordBreak: 'break-word' } }}
                        >
                            <Typography variant="body2">
                                {sum.overridesRemoved.length
                                    ? I18n.t('importOverwriteOverrides')
                                          .replace('%s', String(sum.overridesRemoved.length))
                                          .replace('%s', sum.overridesRemoved.join(', '))
                                    : I18n.t('importOverwriteOverridesNone')}
                            </Typography>
                            {sum.overridesImported.length ? (
                                <Typography variant="body2">
                                    {I18n.t('importOverwriteOverridesImported')
                                        .replace('%s', String(sum.overridesImported.length))
                                        .replace('%s', sum.overridesImported.join(', '))}
                                </Typography>
                            ) : null}
                        </Alert>
                        <Alert
                            severity="info"
                            data-overwrite="kept"
                        >
                            {I18n.t('importOverwriteKept')}
                        </Alert>
                        {this.renderRemaining(sum.remainingAllPages, sum.remainingGlobalPages)}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        autoFocus
                        onClick={close}
                    >
                        {I18n.t('importCancel')}
                    </Button>
                    <Button
                        color="error"
                        variant="outlined"
                        onClick={(): void => void this.handleImport()}
                    >
                        {I18n.t('importOverwriteConfirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    /**
     * @param entry one difference
     * @returns the three cells of the difference
     */
    private diffCells(entry: ConfigDiffEntry): [string, string, string] {
        switch (entry.kind) {
            case 'field':
                return [fieldLabel(entry.field), entry.existing || '–', entry.imported || '–'];
            case 'navigation':
                return [
                    `${I18n.t('importDiffNavigation')}: ${fieldLabel(entry.link)}`,
                    entry.existing || '–',
                    entry.imported || '–',
                ];
            case 'item': {
                const what = `${fieldLabel(entry.list)} #${entry.position}${entry.label ? ` (${entry.label})` : ''}`;
                if (entry.change === 'added') {
                    return [what, '–', I18n.t('importDiffAdded')];
                }
                if (entry.change === 'removed') {
                    return [what, I18n.t('importDiffPresent'), I18n.t('importDiffRemoved')];
                }
                const values = entry.values ?? [];
                return [
                    what,
                    values.map(v => `${fieldLabel(v.field)}: ${v.existing || '–'}`).join('\n'),
                    values.map(v => `${fieldLabel(v.field)}: ${v.imported || '–'}`).join('\n'),
                ];
            }
        }
    }

    private renderDiff(): React.JSX.Element | null {
        const key = this.state.diffFor;
        const plan = this.plan();
        const file = this.state.file;
        const topic = this.state.panel?.topic ?? '';
        if (!key || !plan || !file) {
            return null;
        }
        let entries: ConfigDiffEntry[] = [];
        let title = key;
        if (key === SCREENSAVER_CHOICE_KEY) {
            const existing = (this.props.data.screensaverConfig ?? []).find(
                e => e?.name === plan.screensaver?.existing,
            );
            entries = configDiff(existing, plannedScreensaverContent(file, plan), ['name', 'panels']);
            title = `${I18n.t('importGroupScreensaver')}: ${plan.screensaver?.original ?? ''}`;
        } else {
            const row = plan.pages.find(p => p.original === key);
            const existing = (this.props.data.pageConfig ?? []).find(p => p?.uniqueName === key);
            const imported = row ? plannedPageContent(file, plan, row) : undefined;
            const ignore = ['navigationAssignment', 'uniqueName', ...(row?.strippedSecrets ?? [])];
            entries = [
                ...configDiff(existing, imported?.page, ignore),
                ...navigationDiff(
                    existing ? effectivePageAssignment(existing, topic)?.navigation : undefined,
                    imported?.navigation,
                ),
            ];
        }
        return (
            <Dialog
                open
                onClose={(): void => this.setState({ diffFor: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ wordBreak: 'break-word' }}>
                    {I18n.t('importDiffTitle').replace('%s', title)}
                </DialogTitle>
                <DialogContent>
                    {entries.length ? (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{I18n.t('importDiffWhat')}</TableCell>
                                    <TableCell>{I18n.t('importDiffExisting')}</TableCell>
                                    <TableCell>{I18n.t('importDiffFile')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {entries.map((entry, i) => {
                                    const [what, a, b] = this.diffCells(entry);
                                    return (
                                        <TableRow key={i}>
                                            <TableCell sx={{ fontWeight: 500 }}>{what}</TableCell>
                                            <TableCell
                                                sx={{
                                                    wordBreak: 'break-word',
                                                    whiteSpace: 'pre-line',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                {a}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    wordBreak: 'break-word',
                                                    whiteSpace: 'pre-line',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                {b}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography>{I18n.t('importDiffNone')}</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={(): void => this.setState({ diffFor: null })}>{I18n.t('importClose')}</Button>
                </DialogActions>
            </Dialog>
        );
    }

    private renderReplaceConfirm(): React.JSX.Element | null {
        const key = this.state.replaceFor;
        const plan = this.plan();
        if (!key || !plan) {
            return null;
        }
        const row = key === SCREENSAVER_CHOICE_KEY ? plan.screensaver : plan.pages.find(p => p.original === key);
        const name = key === SCREENSAVER_CHOICE_KEY ? (plan.screensaver?.existing ?? '') : key;
        const shared = row?.sharedWith ?? [];
        return (
            <Dialog
                open
                onClose={(): void => this.setState({ replaceFor: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ wordBreak: 'break-word' }}>
                    {I18n.t('importReplaceTitle').replace('%s', name)}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{I18n.t('importReplaceText').replace('%s', name)}</DialogContentText>
                    {shared.length ? (
                        <>
                            <Alert
                                severity="warning"
                                sx={{ mt: 2 }}
                            >
                                {I18n.t('importReplaceShared')}
                            </Alert>
                            <ul>
                                {shared.map(t => (
                                    <li key={t}>{this.panelLabel(t)}</li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <Alert
                            severity="info"
                            sx={{ mt: 2 }}
                        >
                            {I18n.t('importReplaceNotShared')}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        autoFocus
                        onClick={(): void => this.setState({ replaceFor: null })}
                    >
                        {I18n.t('importCancel')}
                    </Button>
                    <Button
                        color="error"
                        variant="outlined"
                        onClick={this.confirmReplace}
                    >
                        {I18n.t('importReplaceConfirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    /**
     * @param titleKey translation key of the heading
     * @param items lines of the section, nothing shown when empty
     * @returns the section
     */
    private resultSection(titleKey: string, items: string[]): React.JSX.Element | null {
        if (!items.length) {
            return null;
        }
        return (
            <Box
                sx={{ mb: 1.5 }}
                data-result={titleKey}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600 }}
                >
                    {I18n.t(titleKey).replace('%s', String(items.length))}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ wordBreak: 'break-word' }}
                >
                    {items.join(', ')}
                </Typography>
            </Box>
        );
    }

    /**
     * @param fields secret fields
     * @returns their labels
     */
    private static secretLabels(fields: PageSecretField[]): string {
        return fields.map(f => I18n.t(f === 'pin' ? 'exportSecretsFieldPin' : 'exportSecretsFieldQrPass')).join(', ');
    }

    private renderResult(): React.JSX.Element | null {
        const result = this.state.result;
        if (!result) {
            return null;
        }
        const { report, dangling } = result;
        const ss = report.screensaver;
        return (
            <>
                <DialogContent>
                    {report.scriptDisabled ? (
                        <Alert
                            severity="info"
                            sx={{ mb: 2 }}
                        >
                            {I18n.t('importResultScriptDisabled')}
                        </Alert>
                    ) : null}
                    {dangling.links.length ? (
                        <Alert
                            severity="warning"
                            data-result="importResultDangling"
                            sx={{ mb: 2, '& .MuiAlert-message': { minWidth: 0, wordBreak: 'break-word' } }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                            >
                                {I18n.t('importResultDangling').replace('%s', String(dangling.links.length))}
                            </Typography>
                            {dangling.links.map(l => (
                                <Typography
                                    key={`${l.page}-${l.link}`}
                                    variant="body2"
                                >
                                    {`${l.page}${l.override ? ` ${I18n.t('importDanglingOverride')}` : ''} – ${fieldLabel(l.link)} → ${l.target}`}
                                </Typography>
                            ))}
                            <Typography
                                variant="caption"
                                component="div"
                                sx={{ mt: 0.5 }}
                            >
                                {I18n.t('importResultDanglingHint')}
                                {dangling.incomplete ? ` ${I18n.t('importResultDanglingIncomplete')}` : ''}
                            </Typography>
                        </Alert>
                    ) : null}
                    {report.secrets.length ? (
                        <Alert
                            severity="warning"
                            sx={{ mb: 2, '& .MuiAlert-message': { minWidth: 0, wordBreak: 'break-word' } }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                            >
                                {I18n.t('importResultSecrets')}
                            </Typography>
                            {report.secrets.map(s => (
                                <Typography
                                    key={s.page}
                                    variant="body2"
                                >
                                    {s.page}: {PanelImportDialog.secretLabels(s.fields)}
                                </Typography>
                            ))}
                        </Alert>
                    ) : null}
                    {this.resultSection('importResultAdded', report.added)}
                    {this.resultSection('importResultMerged', report.merged)}
                    {this.resultSection('importResultUnchanged', report.unchanged)}
                    {this.resultSection(
                        'importResultRenamed',
                        report.renamed.map(r => `${r.from} → ${r.to}`),
                    )}
                    {this.resultSection('importResultReplaced', report.replaced)}
                    {this.resultSection('importResultSkipped', report.skipped)}
                    {this.resultSection('importResultMain', report.mainPage ? [report.mainPage] : [])}
                    {this.resultSection('importResultMainRemoved', report.mainPageRemoved)}
                    {this.resultSection('importResultExcluded', report.excludedAllPages)}
                    {ss
                        ? this.resultSection('importResultScreensaver', [
                              ss.action === 'removed'
                                  ? I18n.t('importResultScreensaverRemoved')
                                  : `${ss.name} (${I18n.t(actionLabel(ss.action))})`,
                          ])
                        : null}
                    {this.resultSection('importResultOverridesRemoved', report.overridesRemoved)}
                    {this.resultSection('importResultOverridesImported', report.overridesImported)}
                    {this.resultSection(
                        'importResultNotify',
                        report.notifyRenamed.map(r => `${r.from} → ${r.to}`),
                    )}
                    {this.resultSection('importResultStates', result.statesWritten)}
                    {this.resultSection('importResultStatesSkipped', result.statesSkipped)}
                    {this.resultSection(
                        'importResultGroupsSkipped',
                        report.skippedGroups.map(g => I18n.t(groupLabels[g])),
                    )}
                    <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                    >
                        {I18n.t('importResultSave')}
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={this.close}
                    >
                        {I18n.t('importClose')}
                    </Button>
                </DialogActions>
            </>
        );
    }

    render(): React.JSX.Element | null {
        const { step, panel } = this.state;
        if (step === 'closed' || !panel) {
            return null;
        }
        const title =
            step === 'result'
                ? I18n.t('importResultTitle').replace('%s', panel.name || panel.topic || '')
                : I18n.t('importTitle').replace('%s', panel.name || panel.topic || '');
        return (
            <>
                <Dialog
                    open
                    onClose={this.state.applying ? undefined : this.close}
                    maxWidth={step === 'review' ? 'md' : 'sm'}
                    fullWidth
                    aria-labelledby="panel-import-title"
                >
                    <DialogTitle
                        id="panel-import-title"
                        sx={{ wordBreak: 'break-word' }}
                    >
                        {title}
                    </DialogTitle>
                    {step === 'groups' ? this.renderGroups() : null}
                    {step === 'review' ? this.renderReview() : null}
                    {step === 'result' ? this.renderResult() : null}
                </Dialog>
                {this.renderDiff()}
                {this.renderReplaceConfirm()}
                {this.renderOverwriteConfirm()}
            </>
        );
    }
}

/**
 * @param action action of a row
 * @returns its translation key
 */
function actionLabel(action: ImportAction | 'unchanged'): string {
    switch (action) {
        case 'unchanged':
            return 'importStatusUnchanged';
        case 'add':
            return 'importActionAdd';
        case 'merge':
            return 'importActionMerge';
        case 'rename':
            return 'importActionRename';
        case 'replace':
            return 'importActionReplace';
        case 'skip':
            return 'importActionSkip';
    }
}

/**
 * @param value value of the action select
 * @returns true for an action
 */
function isImportAction(value: unknown): value is ImportAction {
    return value === 'add' || value === 'merge' || value === 'rename' || value === 'replace' || value === 'skip';
}

/**
 * Readable name of a configuration field for the difference dialog (`importField_<key>`), the key itself for
 * fields without a translation. `button1` … `button8` of the alarm page share one text.
 *
 * @param key field name
 * @returns the label
 */
function fieldLabel(key: string): string {
    const button = /^button(\d)$/.exec(key);
    if (button) {
        return I18n.t('importField_button').replace('%s', button[1]);
    }
    const translationKey = `importField_${key}`;
    const text = I18n.t(translationKey);
    return text && text !== translationKey ? text : key;
}
