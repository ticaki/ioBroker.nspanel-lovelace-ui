import React from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
    SENDTO_PAGE_DUMP_COMMAND,
    SENDTO_PAGE_DUMP_LIST_COMMAND,
    pageDumpFileName,
    pageDumpKey,
    parsePageDumpList,
    type PageDumpListEntry,
} from '../../src/lib/types/pageDump';

/** Waiting time for an answer of the adapter */
const ANSWER_TIMEOUT_MS = 10000;

interface PageDumpState extends ConfigGenericState {
    /** pages reported by the adapter, null = no answer (adapter not running) */
    entries: PageDumpListEntry[] | null;
    /** key of the selected entry ({@link pageDumpKey}) */
    selected: string;
    busy: boolean;
    result: { severity: 'success' | 'error'; text: string } | null;
}

/**
 * @param value answer of the adapter
 * @returns the dump of the answer, undefined when there is none
 */
function answerResult(value: unknown): Record<string, unknown> | undefined {
    if (typeof value === 'object' && value !== null && 'result' in value) {
        const result: unknown = value.result;
        if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            return { ...result };
        }
    }
    return undefined;
}

/**
 * @param value answer of the adapter
 * @returns the error key of the answer, undefined when there is none
 */
function answerError(value: unknown): string | undefined {
    if (typeof value === 'object' && value !== null && 'error' in value) {
        return String(value.error);
    }
    return undefined;
}

/**
 * Admin tab developer: downloads the configuration of one page (or screensaver) of a panel as JSON file -
 * stored and as built by the running adapter - to attach it to an issue.
 */
class PageDump extends ConfigGeneric<ConfigGenericProps, PageDumpState> {
    private readonly instance = this.props.oContext.instance ?? '0';
    private readonly adapterName = this.props.oContext.adapterName;
    private mounted = false;

    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            entries: null,
            selected: '',
            busy: false,
            result: null,
        };
    }

    async componentDidMount(): Promise<void> {
        this.mounted = true;
        await super.componentDidMount();
        await this.loadEntries();
    }

    componentWillUnmount(): void {
        this.mounted = false;
        super.componentWillUnmount();
    }

    /**
     * sendTo to the running adapter, undefined when it is not running or does not answer in time.
     *
     * @param command the command
     * @param message the message
     * @returns the answer
     */
    private async ask(command: string, message: Record<string, unknown>): Promise<unknown> {
        const alive = await this.props.oContext.socket.getState(
            `system.adapter.${this.adapterName}.${this.instance}.alive`,
        );
        if (!alive?.val) {
            return undefined;
        }
        let timer: ReturnType<typeof setTimeout> | undefined;
        const answer: unknown = await Promise.race([
            this.props.oContext.socket.sendTo(`${this.adapterName}.${this.instance}`, command, message),
            new Promise<undefined>(resolve => {
                timer = setTimeout(() => resolve(undefined), ANSWER_TIMEOUT_MS);
            }),
        ]);
        clearTimeout(timer);
        return answer;
    }

    /** Asks the running adapter for the pages of all panels. */
    private async loadEntries(): Promise<void> {
        let entries: PageDumpListEntry[] | undefined;
        try {
            entries = parsePageDumpList(await this.ask(SENDTO_PAGE_DUMP_LIST_COMMAND, {}));
        } catch {
            entries = undefined;
        }
        if (this.mounted) {
            const list = entries ?? null;
            this.setState({ entries: list, selected: list?.length ? pageDumpKey(list[0]) : '' });
        }
    }

    /**
     * @param entry a page of the list
     * @returns "Panel / page", the screensaver marked as such
     */
    private label(entry: PageDumpListEntry): string {
        if (entry.kind === 'screensaver') {
            return `${entry.panelName} / ${this.getText('pageDumpScreensaver')} (${entry.card})`;
        }
        return `${entry.panelName} / ${entry.page}`;
    }

    private async download(): Promise<void> {
        const entry = (this.state.entries ?? []).find(e => pageDumpKey(e) === this.state.selected);
        if (!entry) {
            return;
        }
        this.setState({ busy: true, result: null });
        try {
            const answer = await this.ask(SENDTO_PAGE_DUMP_COMMAND, {
                panelTopic: entry.panelTopic,
                page: entry.page,
                kind: entry.kind,
            });
            const dump = answerResult(answer);
            if (!dump) {
                this.finish('error', this.getText(answerError(answer) ?? 'pageDumpNoAnswer'));
                return;
            }
            const fileName = pageDumpFileName(entry.panelName, entry.page, new Date());
            const url = URL.createObjectURL(
                new Blob([`${JSON.stringify(dump, null, 2)}\n`], { type: 'application/json' }),
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.finish('success', this.getText('pageDumpDone').replace('%s', fileName));
        } catch (e) {
            this.finish('error', `${this.getText('pageDumpNoAnswer')} ${String(e)}`);
        }
    }

    private finish(severity: 'success' | 'error', text: string): void {
        if (this.mounted) {
            this.setState({ busy: false, result: { severity, text } });
        }
    }

    renderItem(_error: string, disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const { busy, result, selected } = this.state;
        const entries = this.state.entries ?? [];
        const noAdapter = this.state.entries === null;
        const value = entries.some(e => pageDumpKey(e) === selected) ? selected : '';
        return (
            <Box sx={{ mt: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography
                    variant="subtitle1"
                    sx={{ mb: 1 }}
                >
                    {this.getText('pageDumpTitle')}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {this.getText('pageDumpHelp')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    <FormControl
                        size="small"
                        sx={{ minWidth: 320 }}
                    >
                        <InputLabel id="page-dump-page">{this.getText('pageDumpPage')}</InputLabel>
                        <Select
                            labelId="page-dump-page"
                            label={this.getText('pageDumpPage')}
                            value={value}
                            disabled={disabled || busy || noAdapter || entries.length === 0}
                            onChange={(e): void => this.setState({ selected: String(e.target.value), result: null })}
                        >
                            {entries.map(entry => (
                                <MenuItem
                                    key={pageDumpKey(entry)}
                                    value={pageDumpKey(entry)}
                                >
                                    {this.label(entry)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        disabled={disabled || busy || noAdapter || !value}
                        onClick={(): void => {
                            void this.download();
                        }}
                    >
                        {this.getText('pageDumpDownload')}
                    </Button>
                </Box>
                {noAdapter ? (
                    <Alert
                        severity="info"
                        sx={{ mt: 2 }}
                    >
                        {this.getText('pageDumpNoAdapter')}
                    </Alert>
                ) : null}
                {!noAdapter && entries.length === 0 ? (
                    <Alert
                        severity="info"
                        sx={{ mt: 2 }}
                    >
                        {this.getText('pageDumpNoPages')}
                    </Alert>
                ) : null}
                {result ? (
                    <Alert
                        severity={result.severity}
                        sx={{ mt: 2 }}
                    >
                        {result.text}
                    </Alert>
                ) : null}
            </Box>
        );
    }
}

export default PageDump;
