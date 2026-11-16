import React from 'react';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { DocHelp } from './components/DocHelp';

/** Value of the panel select for "all panels" */
const ALL_PANELS = '*';
/** Raw bytes per upload message (base64 in the message, the adapter accepts up to 1 MB) */
const CHUNK_SIZE = 512 * 1024;
/** Waiting time for the panel list of the adapter */
const PANELS_TIMEOUT_MS = 5000;

/** A hardware panel of the adapter configuration that can receive a TFT */
interface TftPanelOption {
    name: string;
    topic: string;
}

interface CustomTftUploadState extends ConfigGenericState {
    /** flashable panels reported by the adapter, null = no answer (adapter not running) */
    panels: TftPanelOption[] | null;
    file: File | null;
    target: string;
    busy: boolean;
    /** upload progress in percent while busy */
    progress: number;
    result: { severity: 'success' | 'error'; text: string } | null;
}

/**
 * Panel list of the adapter answer (`customTftPanels`).
 *
 * @param value answer of `sendTo`
 * @returns name and topic of every flashable panel, undefined if the answer is not a list
 */
function parsePanels(value: unknown): TftPanelOption[] | undefined {
    if (typeof value !== 'object' || value === null || !('panels' in value) || !Array.isArray(value.panels)) {
        return undefined;
    }
    const result: TftPanelOption[] = [];
    for (const entry of value.panels) {
        if (typeof entry !== 'object' || entry === null || !('topic' in entry)) {
            continue;
        }
        const name = 'name' in entry ? entry.name : undefined;
        if (typeof entry.topic !== 'string' || !entry.topic) {
            continue;
        }
        result.push({ topic: entry.topic, name: typeof name === 'string' && name ? name : entry.topic });
    }
    return result;
}

/**
 * Error key of an adapter answer.
 *
 * @param value answer of `sendTo`
 * @returns the error key or undefined
 */
function answerError(value: unknown): string | undefined {
    if (typeof value === 'object' && value !== null && 'error' in value) {
        return String(value.error);
    }
    return undefined;
}

/**
 * Base64 of a part of a file.
 *
 * @param bytes the bytes
 * @returns base64 text
 */
function toBase64(bytes: Uint8Array): string {
    let binary = '';
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
        binary += String.fromCharCode(...bytes.subarray(i, i + step));
    }
    return btoa(binary);
}

/**
 * Admin tab developer: flashes a custom TFT (`.tft`) on one or all panels.
 * The file is sent to the adapter in chunks; the adapter serves it on a free port and sends
 * `FlashNextionAdv0 <url>` to the panels.
 */
class CustomTftUpload extends ConfigGeneric<ConfigGenericProps, CustomTftUploadState> {
    private readonly instance = this.props.oContext.instance ?? '0';
    private readonly adapterName = this.props.oContext.adapterName;
    private mounted = false;

    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            panels: null,
            file: null,
            target: ALL_PANELS,
            busy: false,
            progress: 0,
            result: null,
        };
    }

    async componentDidMount(): Promise<void> {
        this.mounted = true;
        await super.componentDidMount();
        await this.loadPanels();
    }

    /** Asks the running adapter for the panels that can flash a TFT. */
    private async loadPanels(): Promise<void> {
        let panels: TftPanelOption[] | undefined;
        try {
            const alive = await this.props.oContext.socket.getState(
                `system.adapter.${this.adapterName}.${this.instance}.alive`,
            );
            if (alive?.val) {
                let timer: ReturnType<typeof setTimeout> | undefined;
                const answer: unknown = await Promise.race([
                    this.props.oContext.socket.sendTo(`${this.adapterName}.${this.instance}`, 'customTftPanels', {}),
                    new Promise<undefined>(resolve => {
                        timer = setTimeout(() => resolve(undefined), PANELS_TIMEOUT_MS);
                    }),
                ]);
                clearTimeout(timer);
                panels = parsePanels(answer);
            }
        } catch {
            panels = undefined;
        }
        if (this.mounted) {
            this.setState({ panels: panels ?? null });
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
        super.componentWillUnmount();
    }

    private onFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0] ?? null;
        // the same file can be selected again
        event.target.value = '';
        if (file) {
            this.setState({ file, result: null });
        }
    };

    private async send(command: string, message: Record<string, unknown>): Promise<string | undefined> {
        const answer: unknown = await this.props.oContext.socket.sendTo(
            `${this.adapterName}.${this.instance}`,
            command,
            message,
        );
        return answerError(answer);
    }

    private async start(): Promise<void> {
        const { file, target } = this.state;
        if (!file) {
            return;
        }
        this.setState({ busy: true, progress: 0, result: null });
        const uploadId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        try {
            let bytes: Uint8Array;
            try {
                bytes = new Uint8Array(await file.arrayBuffer());
            } catch {
                this.finish('error', this.getText('customTftReadError'));
                return;
            }
            let offset = 0;
            do {
                const part = bytes.subarray(offset, offset + CHUNK_SIZE);
                const error = await this.send('customTftUpload', {
                    uploadId,
                    fileName: file.name,
                    size: bytes.length,
                    offset,
                    data: toBase64(part),
                });
                if (error) {
                    this.finish('error', this.getText(error));
                    return;
                }
                offset += part.length;
                if (this.mounted) {
                    this.setState({ progress: Math.round((offset / bytes.length) * 100) });
                }
            } while (offset < bytes.length && this.mounted);
            if (!this.mounted) {
                return;
            }
            const internalServerIp: unknown = this.props.data?.internalServerIp;
            const error = await this.send('customTftStart', {
                uploadId,
                target,
                internalServerIp: typeof internalServerIp === 'string' ? internalServerIp : '',
            });
            if (error) {
                this.finish('error', this.getText(error));
            } else {
                this.finish('success', this.getText('customTftStarted'));
            }
        } catch (e) {
            this.finish('error', `${this.getText('customTftServerError')} ${String(e)}`);
        }
    }

    private finish(severity: 'success' | 'error', text: string): void {
        if (this.mounted) {
            this.setState({ busy: false, result: { severity, text } });
        }
    }

    renderItem(_error: string, disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const { file, target, busy, progress, result } = this.state;
        const panels = this.state.panels ?? [];
        const noAdapter = this.state.panels === null;
        const selectedTarget = target === ALL_PANELS || panels.some(p => p.topic === target) ? target : ALL_PANELS;
        return (
            <Box sx={{ mt: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography
                    variant="subtitle1"
                    sx={{ mb: 1 }}
                >
                    {this.getText('customTftTitle')}
                    <DocHelp topic="maintain.customTft" />
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {this.getText('customTftHelp')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        disabled={disabled || busy}
                    >
                        {this.getText('customTftSelectFile')}
                        <input
                            type="file"
                            accept=".tft"
                            hidden
                            onChange={this.onFileChange}
                        />
                    </Button>
                    <Typography variant="body2">{file ? file.name : this.getText('customTftNoFile')}</Typography>
                    <FormControl
                        size="small"
                        sx={{ minWidth: 220 }}
                    >
                        <InputLabel id="custom-tft-target">{this.getText('customTftTarget')}</InputLabel>
                        <Select
                            labelId="custom-tft-target"
                            label={this.getText('customTftTarget')}
                            value={selectedTarget}
                            disabled={disabled || busy || noAdapter}
                            onChange={(e): void => this.setState({ target: String(e.target.value) })}
                        >
                            <MenuItem value={ALL_PANELS}>{this.getText('customTftAllPanels')}</MenuItem>
                            {panels.map(p => (
                                <MenuItem
                                    key={p.topic}
                                    value={p.topic}
                                >
                                    {p.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        disabled={disabled || busy || !file || noAdapter || panels.length === 0}
                        onClick={(): void => {
                            void this.start();
                        }}
                    >
                        {busy ? `${this.getText('customTftUploading')} ${progress} %` : this.getText('customTftStart')}
                    </Button>
                </Box>
                {noAdapter ? (
                    <Alert
                        severity="info"
                        sx={{ mt: 2 }}
                    >
                        {this.getText('customTftNoAdapter')}
                    </Alert>
                ) : null}
                {!noAdapter && panels.length === 0 ? (
                    <Alert
                        severity="info"
                        sx={{ mt: 2 }}
                    >
                        {this.getText('customTftNoFlashablePanel')}
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

export default CustomTftUpload;
