import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    Alert,
    Tooltip,
} from '@mui/material';
import { I18n, type ThemeType } from '@iobroker/gui-components';
import type { ChannelModeListConfig } from '../../../src/lib/types/adminShareConfig';
import { EntitySelector } from './EntitySelector';
import ConfirmDialog from './ConfirmDialog';

/** Maximum length of the joined mode list – the adapter truncates at this length (pageItem.ts). */
const MODE_LIST_MAX_LENGTH = 900;
/** Maximum number of entries – the adapter drops everything beyond (pageItem.ts `splice(48)`). */
const MODE_LIST_MAX_ENTRIES = 48;
/** Separator the adapter uses when joining the list (pageItem.ts). */
const MODE_LIST_SEPARATOR = '?';

/**
 * Copy of `tools.formatInSelText` (src/lib/const/tools.ts) – the adapter sends every entry through it
 * before joining the list, so the length shown in the dialog has to use the same formatting.
 * Replaces '?' and '_' with spaces, breaks into two lines of max. 12 characters, truncates line 2.
 *
 * @param text Entry text
 */
function formatInSelText(text: string): string {
    if (!text) {
        return 'error';
    }
    const words = text.replaceAll('?', ' ').replaceAll('__', '_').replaceAll('_', ' ').split(/\s+/);

    const MAX_LINE = 12;
    const MAX_LINE2 = 12;
    const TRUNCATE = 9;

    const line1: string[] = [];
    let len1 = 0;
    for (const word of words) {
        if (len1 + word.length + (line1.length ? 1 : 0) > MAX_LINE) {
            break;
        }
        line1.push(word);
        len1 += word.length + 1;
    }

    const line2Words = words.slice(line1.length);
    let line2 = line2Words.join(' ');
    if (line2.length > MAX_LINE2) {
        line2 = `${line2.substring(0, TRUNCATE)}...`;
    }

    return line1.length > 0 ? `${line1.join(' ')}\r\n${line2.trim()}` : line2.trim();
}

export interface ChannelModeListDialogProps {
    socket: any;
    theme?: any;
    themeType?: ThemeType;
    onSave?: (config: ChannelModeListConfig) => void;
}

/** Result of the inSel_Alias datapoint check. */
type AliasCheckStatus =
    'unchecked' | 'checking' | 'ok' | 'missing' | 'notState' | 'wrongType' | 'notWritable' | 'error';

interface ChannelModeListDialogState {
    open: boolean;
    /** Selection datapoint (inSel_Alias) */
    inSelAlias: string;
    /** Mode list as raw text, one entry per line */
    modeListText: string;
    /** Result of the datapoint check */
    aliasStatus: AliasCheckStatus;
    /** common.type of the checked datapoint (for the wrongType message) */
    aliasType: string;
    /** common.states of the checked datapoint (undefined = none) */
    aliasStates: Record<string, string> | string[] | string | undefined;
    /** Confirmation dialog "check failed, apply anyway?" */
    confirmOpen: boolean;
}

/**
 * Dialog to configure the mode list of a light item (roles rgbSingle, rgb, ct, hue):
 * `inSel_Alias` (string state the selected mode is written to) and `modeList` (the selectable entries).
 */
class ChannelModeListDialog extends React.Component<ChannelModeListDialogProps, ChannelModeListDialogState> {
    /** Guards against out-of-order results of concurrent datapoint checks. */
    private checkSequence = 0;
    /** The datapoint check that is currently running (save waits for it instead of being disabled). */
    private pendingCheck: Promise<AliasCheckStatus> | null = null;

    constructor(props: ChannelModeListDialogProps) {
        super(props);
        this.state = {
            open: false,
            inSelAlias: '',
            modeListText: '',
            aliasStatus: 'unchecked',
            aliasType: '',
            aliasStates: undefined,
            confirmOpen: false,
        };
    }

    /**
     * Opens the dialog and pre-fills all fields from an existing config.
     * Triggers the datapoint check when an alias is set.
     *
     * @param config Optional existing configuration to restore
     */
    public openWith(config?: Partial<ChannelModeListConfig>): void {
        const alias: string = typeof config?.inSel_Alias === 'string' ? config.inSel_Alias : '';
        const list: string[] = Array.isArray(config?.modeList) ? config.modeList : [];
        this.setState({
            open: true,
            inSelAlias: alias,
            modeListText: list.join('\n'),
            aliasStatus: 'unchecked',
            aliasType: '',
            aliasStates: undefined,
            confirmOpen: false,
        });
        void this.startCheck(alias);
    }

    /**
     * Splits the raw text into the mode list: one entry per line, trimmed, blank lines discarded.
     *
     * @param text Raw text of the text field
     */
    private parseModeList(text: string): string[] {
        return text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line !== '');
    }

    /**
     * Length of the list as the adapter sends it to the panel: every entry formatted with
     * `formatInSelText`, then joined with '?' (pageItem.ts). The adapter additionally runs each entry
     * through its translation table, so the result is an estimate.
     *
     * @param list Parsed mode list
     */
    private joinedLength(list: string[]): number {
        return list.map(entry => formatInSelText(entry)).join(MODE_LIST_SEPARATOR).length;
    }

    /**
     * Starts a datapoint check and remembers its promise so that a save can wait for it.
     *
     * @param id Datapoint id
     */
    private startCheck(id: string): Promise<AliasCheckStatus> {
        const check = this.checkAlias(id).finally(() => {
            if (this.pendingCheck === check) {
                this.pendingCheck = null;
            }
        });
        this.pendingCheck = check;
        return check;
    }

    /**
     * Checks the selection datapoint: it must exist, be a state of type string and be writable.
     * Stores `common.states` for the "take list from datapoint" button.
     * Returns the resulting status, or 'unchecked' if the result was superseded by a newer check.
     *
     * @param id Datapoint id (empty = nothing to check)
     */
    private async checkAlias(id: string): Promise<AliasCheckStatus> {
        const { socket } = this.props;
        const seq = ++this.checkSequence;
        const trimmed = id.trim();
        if (!trimmed || !socket) {
            this.setState({ aliasStatus: 'unchecked', aliasType: '', aliasStates: undefined });
            return 'unchecked';
        }
        this.setState({ aliasStatus: 'checking', aliasType: '', aliasStates: undefined });
        let status: AliasCheckStatus = 'error';
        let aliasType = '';
        let aliasStates: ChannelModeListDialogState['aliasStates'] = undefined;
        try {
            const obj: ioBroker.Object | null | undefined = await (socket.getObject(trimmed) as Promise<
                ioBroker.Object | null | undefined
            >);
            if (!obj) {
                status = 'missing';
            } else if (obj.type !== 'state') {
                status = 'notState';
            } else {
                aliasType = typeof obj.common.type === 'string' ? obj.common.type : '';
                aliasStates = obj.common.states;
                if (obj.common.type !== 'string') {
                    status = 'wrongType';
                } else if (obj.common.write === false) {
                    status = 'notWritable';
                } else {
                    status = 'ok';
                }
            }
        } catch {
            status = 'error';
        }
        if (seq !== this.checkSequence) {
            return 'unchecked';
        }
        this.setState({ aliasStatus: status, aliasType, aliasStates });
        return status;
    }

    /**
     * Converts `common.states` into mode list entries:
     * object {value: label} → labels (what the panel shows when the adapter builds the list from
     * `common.states` itself), array → elements, string "a:b;c:d" → the parts before the colon.
     *
     * @param states common.states of the datapoint
     */
    private statesToList(states: ChannelModeListDialogState['aliasStates']): string[] {
        if (states === undefined || states === null) {
            return [];
        }
        if (Array.isArray(states)) {
            return states.map(s => String(s));
        }
        if (typeof states === 'string') {
            return states
                .split(';')
                .map(part => part.split(':')[0].trim())
                .filter(part => part !== '');
        }
        if (typeof states === 'object') {
            return Object.values(states).map(s => String(s));
        }
        return [];
    }

    private handleTakeFromStates = (): void => {
        const list = this.statesToList(this.state.aliasStates);
        if (list.length === 0) {
            return;
        }
        this.setState({ modeListText: list.join('\n') });
    };

    private handleAliasChange = (value: string): void => {
        // invalidate a check that is still running for the previous value
        this.checkSequence++;
        this.setState({ inSelAlias: value, aliasStatus: 'unchecked', aliasStates: undefined });
    };

    private handleAliasCommit = (value: string): void => {
        void this.startCheck(value);
    };

    /** Writes the config back to the parent dialog and closes. Empty values are stored as undefined. */
    private commit(): void {
        const alias = this.state.inSelAlias.trim();
        const list = this.parseModeList(this.state.modeListText);
        this.props.onSave?.({
            inSel_Alias: alias !== '' ? alias : undefined,
            modeList: list.length > 0 ? list : undefined,
        });
        this.setState({ open: false, confirmOpen: false });
    }

    private handleSave = async (): Promise<void> => {
        const alias = this.state.inSelAlias.trim();
        if (alias === '') {
            this.commit();
            return;
        }
        // A blur of the alias field right before the click starts a check – wait for it instead of losing the click.
        let status: AliasCheckStatus = this.state.aliasStatus;
        if (this.pendingCheck) {
            status = await this.pendingCheck;
        }
        if (!this.state.open) {
            return;
        }
        if (status !== 'ok') {
            this.setState({ confirmOpen: true });
            return;
        }
        this.commit();
    };

    private handleConfirmYes = (): void => {
        this.commit();
    };

    private handleConfirmNo = (): void => {
        this.setState({ confirmOpen: false });
    };

    private handleCancel = (): void => {
        this.setState({ open: false, confirmOpen: false });
    };

    /** Renders the result of the datapoint check as an alert (nothing while unchecked). */
    private renderAliasStatus(): React.JSX.Element | null {
        const { aliasStatus, aliasType } = this.state;
        switch (aliasStatus) {
            case 'unchecked':
                return null;
            case 'checking':
                return <Alert severity="info">{I18n.t('channelModeListDialog_aliasChecking')}</Alert>;
            case 'ok':
                return <Alert severity="success">{I18n.t('channelModeListDialog_aliasOk')}</Alert>;
            case 'missing':
                return <Alert severity="warning">{I18n.t('channelModeListDialog_aliasMissing')}</Alert>;
            case 'notState':
                return <Alert severity="warning">{I18n.t('channelModeListDialog_aliasNotState')}</Alert>;
            case 'wrongType':
                return (
                    <Alert severity="warning">{I18n.t('channelModeListDialog_aliasWrongType', aliasType || '?')}</Alert>
                );
            case 'notWritable':
                return <Alert severity="warning">{I18n.t('channelModeListDialog_aliasNotWritable')}</Alert>;
            case 'error':
                return <Alert severity="warning">{I18n.t('channelModeListDialog_aliasCheckError')}</Alert>;
            default:
                return null;
        }
    }

    render(): React.JSX.Element {
        const { socket, theme, themeType } = this.props;
        const { open, inSelAlias, modeListText, aliasStatus, aliasStates, confirmOpen } = this.state;

        const list = this.parseModeList(modeListText);
        const joinedLength = this.joinedLength(list);
        const entriesWithQuestionMark = list.filter(entry => entry.includes(MODE_LIST_SEPARATOR));
        const tooLong = joinedLength > MODE_LIST_MAX_LENGTH;
        const tooMany = list.length > MODE_LIST_MAX_ENTRIES;
        const statesList = this.statesToList(aliasStates);
        const canTakeFromStates = aliasStatus !== 'checking' && statesList.length > 0;
        const takeTooltip =
            inSelAlias.trim() === ''
                ? I18n.t('channelModeListDialog_takeFromStatesNoAlias')
                : I18n.t('channelModeListDialog_takeFromStatesNoStates');

        return (
            <>
                <Dialog
                    open={open}
                    onClose={(_event, reason) => {
                        // Dialog darf nur über Button geschlossen werden
                        if (reason === 'backdropClick') {
                            return;
                        }
                    }}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>{I18n.t('channelModeListDialog_title')}</DialogTitle>
                    <DialogContent>
                        <Box
                            sx={{
                                mt: 1,
                                p: 2,
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                            }}
                        >
                            {/* inSel_Alias */}
                            <Box>
                                <EntitySelector
                                    label={I18n.t('channelModeListDialog_alias')}
                                    value={inSelAlias}
                                    onChange={this.handleAliasChange}
                                    onCommit={this.handleAliasCommit}
                                    socket={socket}
                                    theme={theme}
                                    themeType={themeType ?? 'light'}
                                    dialogName="channelModeListDialogAlias"
                                    filterFunc={(obj: ioBroker.Object): boolean =>
                                        obj?.type === 'state' && obj.common?.type === 'string'
                                    }
                                />
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary' }}
                                >
                                    {I18n.t('channelModeListDialog_aliasHint')}
                                </Typography>
                            </Box>
                            {this.renderAliasStatus()}
                            {/* Datenpunkt hat eigene common.states – der Adapter baut die Liste daraus, modeList ist nur Fallback */}
                            {aliasStatus !== 'checking' && statesList.length > 0 && (
                                <Alert severity="info">{I18n.t('channelModeListDialog_statesInfo')}</Alert>
                            )}

                            {/* modeList */}
                            <TextField
                                variant="outlined"
                                label={I18n.t('channelModeListDialog_modeList')}
                                value={modeListText}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    this.setState({ modeListText: e.target.value })
                                }
                                multiline
                                minRows={6}
                                maxRows={16}
                                fullWidth
                                helperText={I18n.t('channelModeListDialog_modeListHint')}
                                slotProps={{
                                    input: { sx: { fontFamily: 'monospace' } },
                                    inputLabel: { shrink: true },
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{ color: tooLong || tooMany ? 'error.main' : 'text.secondary' }}
                            >
                                {I18n.t('channelModeListDialog_count', list.length, joinedLength, MODE_LIST_MAX_LENGTH)}
                            </Typography>
                            {entriesWithQuestionMark.length > 0 && (
                                <Alert severity="warning">
                                    {I18n.t(
                                        'channelModeListDialog_warnQuestionMark',
                                        entriesWithQuestionMark.join(', '),
                                    )}
                                </Alert>
                            )}
                            {tooMany && (
                                <Alert severity="warning">
                                    {I18n.t('channelModeListDialog_warnTooMany', list.length, MODE_LIST_MAX_ENTRIES)}
                                </Alert>
                            )}
                            {tooLong && (
                                <Alert severity="warning">
                                    {I18n.t('channelModeListDialog_warnTooLong', joinedLength, MODE_LIST_MAX_LENGTH)}
                                </Alert>
                            )}

                            {/* Liste aus common.states übernehmen */}
                            <Box>
                                <Tooltip title={canTakeFromStates ? '' : takeTooltip}>
                                    <span>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={this.handleTakeFromStates}
                                            disabled={!canTakeFromStates}
                                        >
                                            {I18n.t('channelModeListDialog_takeFromStates')}
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCancel}>{I18n.t('channelModeListDialog_cancel')}</Button>
                        <Button
                            onClick={() => void this.handleSave()}
                            variant="contained"
                            color="primary"
                        >
                            {I18n.t('channelModeListDialog_save')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Prüfung fehlgeschlagen – trotzdem übernehmen? */}
                <ConfirmDialog
                    open={confirmOpen}
                    onClose={this.handleConfirmNo}
                    onConfirm={this.handleConfirmYes}
                    title={I18n.t('channelModeListDialog_confirmTitle')}
                    description={I18n.t('channelModeListDialog_confirmText')}
                    cancelText={I18n.t('channelModeListDialog_confirmNo')}
                    confirmText={I18n.t('channelModeListDialog_confirmYes')}
                    ariaTitleId="channel-modelist-confirm-title"
                    ariaDescId="channel-modelist-confirm-description"
                />
            </>
        );
    }
}

export default ChannelModeListDialog;
