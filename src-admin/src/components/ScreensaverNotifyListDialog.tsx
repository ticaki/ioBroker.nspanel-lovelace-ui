/**
 * Dialog of the notifications of a screensaver (bell next to the gear of the mock). All screensavers share one
 * list of notifications (native.screensaverNotify); the checkbox of a row switches the notification on for
 * this screensaver. Switched on notifications are listed first, then by priority. Add, edit
 * (ScreensaverNotifyDialog on top), duplicate and delete change the shared list. Everything is a draft until "apply".
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ConfirmDialog from './ConfirmDialog';
import ScreensaverNotifyDialog from './ScreensaverNotifyDialog';
import {
    type ScreensaverEntry,
    type ScreensaverNotifyConfig,
    newScreensaverNotifyId,
} from '../../../src/lib/types/adminShareConfig';

export interface ScreensaverNotifyListDialogProps {
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    themeName?: any;
    /** the screensaver the dialog switches notifications on for */
    entry: ScreensaverEntry;
    /** all screensavers - shows which other ones use a notification */
    entries: ScreensaverEntry[];
    /** the edited shared list and the ids this screensaver uses (order of the list) */
    onSave: (list: ScreensaverNotifyConfig[], ids: string[]) => void;
}

interface ScreensaverNotifyListDialogState {
    open: boolean;
    list: ScreensaverNotifyConfig[];
    /** ids of the notifications switched on for this screensaver */
    active: string[];
    /** id of the notification the edit dialog belongs to, '' = new notification */
    editing: string;
    /** id of the notification waiting for the delete confirmation */
    confirmDelete: string | null;
}

/**
 * short label of a notification: its name, otherwise headline, text or the first state
 *
 * @param notify the notification
 */
function notifyLabel(notify: ScreensaverNotifyConfig): string {
    if (notify.name?.trim()) {
        return notify.name.trim();
    }
    const parts = [notify.headlinePrefix, notify.headline, notify.headlineUnit].filter(p => !!p);
    return parts.join(' ').trim() || notify.text || notify.enabled[0] || '?';
}

/**
 * priority as the adapter uses it
 *
 * @param notify the notification
 */
function priorityOf(notify: ScreensaverNotifyConfig): number {
    return typeof notify.priority === 'number' ? notify.priority : 99;
}

/**
 * deep enough copy of a notification for the draft
 *
 * @param notify the notification
 */
function copyNotify(notify: ScreensaverNotifyConfig): ScreensaverNotifyConfig {
    return { ...notify, enabled: [...notify.enabled] };
}

export default class ScreensaverNotifyListDialog extends React.Component<
    ScreensaverNotifyListDialogProps,
    ScreensaverNotifyListDialogState
> {
    private editRef = React.createRef<ScreensaverNotifyDialog>();

    constructor(props: ScreensaverNotifyListDialogProps) {
        super(props);
        this.state = { open: false, list: [], active: [], editing: '', confirmDelete: null };
    }

    /**
     * opens the dialog with a copy of the shared list
     *
     * @param list shared notification list
     * @param ids notifications the screensaver uses
     */
    public openWith(list: ScreensaverNotifyConfig[], ids: string[] | undefined): void {
        const known = new Set(list.map(n => n.id));
        this.setState({
            open: true,
            list: list.map(copyNotify),
            active: (ids ?? []).filter(id => known.has(id)),
            editing: '',
            confirmDelete: null,
        });
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private close = (): void => {
        this.setState({ open: false });
    };

    private apply = (): void => {
        const active = new Set(this.state.active);
        this.props.onSave(
            this.state.list,
            this.state.list.filter(n => active.has(n.id)).map(n => n.id),
        );
        this.close();
    };

    /** the list as shown: switched on first, then by priority, otherwise the stored order */
    private sorted(): ScreensaverNotifyConfig[] {
        const active = new Set(this.state.active);
        return this.state.list
            .map((notify, index) => ({ notify, index }))
            .sort(
                (a, b) =>
                    Number(active.has(b.notify.id)) - Number(active.has(a.notify.id)) ||
                    priorityOf(a.notify) - priorityOf(b.notify) ||
                    a.index - b.index,
            )
            .map(e => e.notify);
    }

    /**
     * names of the other screensavers that use a notification
     *
     * @param id id of the notification
     */
    private usedBy(id: string): string[] {
        return this.props.entries
            .filter(e => e.name !== this.props.entry.name && (e.notify ?? []).includes(id))
            .map(e => e.name);
    }

    private toggle(id: string): void {
        this.setState(prev => ({
            active: prev.active.includes(id) ? prev.active.filter(a => a !== id) : [...prev.active, id],
        }));
    }

    private edit(id: string): void {
        this.setState({ editing: id });
        this.editRef.current?.openWith(this.state.list.find(n => n.id === id));
    }

    private duplicate(id: string): void {
        this.setState(prev => {
            const index = prev.list.findIndex(n => n.id === id);
            if (index < 0) {
                return null;
            }
            const copy = { ...copyNotify(prev.list[index]), id: newScreensaverNotifyId(prev.list) };
            const list = [...prev.list];
            list.splice(index + 1, 0, copy);
            return { list, active: prev.active.includes(id) ? [...prev.active, copy.id] : prev.active };
        });
    }

    /**
     * deletes at once while no other screensaver uses the notification, otherwise asks first
     *
     * @param id id of the notification
     */
    private requestDelete(id: string): void {
        if (this.usedBy(id).length) {
            this.setState({ confirmDelete: id });
        } else {
            this.remove(id);
        }
    }

    private remove(id: string): void {
        this.setState(prev => ({
            list: prev.list.filter(n => n.id !== id),
            active: prev.active.filter(a => a !== id),
            confirmDelete: null,
        }));
    }

    private onEditSave = (notify: ScreensaverNotifyConfig): void => {
        this.setState(prev => {
            if (!prev.editing) {
                // a new notification is meant for this screensaver
                const id = newScreensaverNotifyId(prev.list);
                return { list: [...prev.list, { ...notify, id }], active: [...prev.active, id] };
            }
            return {
                list: prev.list.map(n => (n.id === prev.editing ? { ...notify, id: prev.editing } : n)),
                active: prev.active,
            };
        });
    };

    /** dismiss group ids used in the list - offered in the edit dialog */
    private knownIds(): string[] {
        const ids = new Set<string>();
        for (const n of this.state.list) {
            if (n.dismissibleId) {
                ids.add(n.dismissibleId);
            }
        }
        return [...ids];
    }

    private renderRow(notify: ScreensaverNotifyConfig): React.JSX.Element {
        const active = this.state.active.includes(notify.id);
        const usedBy = this.usedBy(notify.id);
        const states = notify.enabled.join(', ');
        return (
            <Box
                key={notify.id}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    opacity: active ? 1 : 0.6,
                }}
                data-ss="notify-row"
            >
                <Tooltip title={this.getText('screensaver_notify_active')}>
                    <Checkbox
                        size="small"
                        checked={active}
                        onChange={() => this.toggle(notify.id)}
                        data-ss="notify-active"
                    />
                </Tooltip>
                <Tooltip title={this.getText('screensaver_notify_priority')}>
                    <Chip
                        size="small"
                        label={priorityOf(notify)}
                        sx={{ minWidth: 40 }}
                    />
                </Tooltip>
                <Box
                    sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => this.edit(notify.id)}
                >
                    <Typography
                        variant="body2"
                        noWrap
                    >
                        {notifyLabel(notify)}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        component="div"
                    >
                        {states}
                        {notify.visibleCondition ? ` · ${notify.visibleCondition}` : ''}
                        {notify.dismissible
                            ? ` · ${this.getText('screensaver_notify_dismiss')}${notify.dismissibleId ? ` (${notify.dismissibleId})` : ''}`
                            : ''}
                    </Typography>
                    {usedBy.length > 0 && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            component="div"
                        >
                            {this.getText('screensaver_notify_usedBy').replace('%s', usedBy.join(', '))}
                        </Typography>
                    )}
                </Box>
                <Tooltip title={this.getText('screensaver_notify_edit')}>
                    <IconButton
                        size="small"
                        onClick={() => this.edit(notify.id)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.getText('screensaver_notify_duplicate')}>
                    <IconButton
                        size="small"
                        onClick={() => this.duplicate(notify.id)}
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.getText('screensaver_notify_delete')}>
                    <IconButton
                        size="small"
                        onClick={() => this.requestDelete(notify.id)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { list, editing, confirmDelete } = this.state;
        return (
            <>
                <Dialog
                    open={this.state.open}
                    onClose={this.close}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>{this.getText('screensaver_notify')}</DialogTitle>
                    <DialogContent dividers>
                        <Alert
                            severity="info"
                            sx={{ mb: 2 }}
                        >
                            {this.getText('screensaver_notify_listHint')}
                        </Alert>
                        {list.length === 0 ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {this.getText('screensaver_notify_empty')}
                            </Typography>
                        ) : (
                            this.sorted().map(n => this.renderRow(n))
                        )}
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => this.edit('')}
                            sx={{ mt: 2 }}
                            data-ss="notify-add"
                        >
                            {this.getText('screensaver_notify_add')}
                        </Button>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.close}>{this.getText('Cancel1')}</Button>
                        <Button
                            variant="contained"
                            onClick={this.apply}
                        >
                            {this.getText('screensaver_apply')}
                        </Button>
                    </DialogActions>
                </Dialog>
                <ConfirmDialog
                    open={confirmDelete !== null}
                    onClose={() => this.setState({ confirmDelete: null })}
                    onConfirm={() => confirmDelete !== null && this.remove(confirmDelete)}
                    title={this.getText('screensaver_notify_deleteTitle')}
                    description={this.getText('screensaver_notify_deleteShared').replace(
                        '%s',
                        confirmDelete !== null ? this.usedBy(confirmDelete).join(', ') : '',
                    )}
                    cancelText={this.getText('Cancel1')}
                    confirmText={this.getText('screensaver_notify_delete')}
                />
                <ScreensaverNotifyDialog
                    ref={this.editRef}
                    getText={this.props.getText}
                    oContext={this.props.oContext}
                    theme={this.props.theme}
                    themeName={this.props.themeName}
                    knownIds={this.knownIds()}
                    sharedWith={editing ? this.usedBy(editing) : []}
                    onSave={this.onEditSave}
                />
            </>
        );
    }
}
