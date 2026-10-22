/**
 * Dialog of the notifications of a screensaver (bell next to the gear of the mock): the list of the
 * notifications with add, edit (ScreensaverNotifyDialog on top), duplicate and delete. The list is a draft
 * until "apply".
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
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
import ScreensaverNotifyDialog from './ScreensaverNotifyDialog';
import { type ScreensaverNotifyConfig } from '../../../src/lib/types/adminShareConfig';

export interface ScreensaverNotifyListDialogProps {
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
    themeName?: any;
    /** the edited list, undefined = no notifications */
    onSave: (list: ScreensaverNotifyConfig[] | undefined) => void;
}

interface ScreensaverNotifyListDialogState {
    open: boolean;
    list: ScreensaverNotifyConfig[];
    /** row the edit dialog belongs to, -1 = new notification */
    editing: number;
}

/**
 * short label of a notification: headline, text or the first state
 *
 * @param notify the notification
 */
function notifyLabel(notify: ScreensaverNotifyConfig): string {
    const parts = [notify.headlinePrefix, notify.headline, notify.headlineUnit].filter(p => !!p);
    return parts.join(' ').trim() || notify.text || notify.enabled[0] || '?';
}

export default class ScreensaverNotifyListDialog extends React.Component<
    ScreensaverNotifyListDialogProps,
    ScreensaverNotifyListDialogState
> {
    private editRef = React.createRef<ScreensaverNotifyDialog>();

    constructor(props: ScreensaverNotifyListDialogProps) {
        super(props);
        this.state = { open: false, list: [], editing: -1 };
    }

    /**
     * opens the dialog with a copy of the stored list
     *
     * @param list stored notifications of the entry
     */
    public openWith(list: ScreensaverNotifyConfig[] | undefined): void {
        this.setState({ open: true, list: (list ?? []).map(n => ({ ...n, enabled: [...n.enabled] })), editing: -1 });
    }

    private getText(key: string): string {
        return this.props.getText(key);
    }

    private close = (): void => {
        this.setState({ open: false });
    };

    private apply = (): void => {
        this.props.onSave(this.state.list.length ? this.state.list : undefined);
        this.close();
    };

    private edit(index: number): void {
        this.setState({ editing: index });
        this.editRef.current?.openWith(index >= 0 ? this.state.list[index] : undefined);
    }

    private duplicate(index: number): void {
        this.setState(prev => {
            const copy = { ...prev.list[index], enabled: [...prev.list[index].enabled] };
            const list = [...prev.list];
            list.splice(index + 1, 0, copy);
            return { list };
        });
    }

    private remove(index: number): void {
        this.setState(prev => ({ list: prev.list.filter((_n, i) => i !== index) }));
    }

    private onEditSave = (notify: ScreensaverNotifyConfig): void => {
        this.setState(prev => {
            if (prev.editing < 0) {
                return { list: [...prev.list, notify] };
            }
            return { list: prev.list.map((n, i) => (i === prev.editing ? notify : n)) };
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

    private renderRow(notify: ScreensaverNotifyConfig, index: number): React.JSX.Element {
        const states = notify.enabled.join(', ');
        return (
            <Box
                key={index}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
                data-ss="notify-row"
            >
                <Tooltip title={this.getText('screensaver_notify_priority')}>
                    <Chip
                        size="small"
                        label={typeof notify.priority === 'number' ? notify.priority : 99}
                        sx={{ minWidth: 40 }}
                    />
                </Tooltip>
                <Box
                    sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => this.edit(index)}
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
                </Box>
                <Tooltip title={this.getText('screensaver_notify_edit')}>
                    <IconButton
                        size="small"
                        onClick={() => this.edit(index)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.getText('screensaver_notify_duplicate')}>
                    <IconButton
                        size="small"
                        onClick={() => this.duplicate(index)}
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.getText('screensaver_notify_delete')}>
                    <IconButton
                        size="small"
                        onClick={() => this.remove(index)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { list } = this.state;
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
                            list.map((n, i) => this.renderRow(n, i))
                        )}
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => this.edit(-1)}
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
                <ScreensaverNotifyDialog
                    ref={this.editRef}
                    getText={this.props.getText}
                    oContext={this.props.oContext}
                    theme={this.props.theme}
                    themeName={this.props.themeName}
                    knownIds={this.knownIds()}
                    onSave={this.onEditSave}
                />
            </>
        );
    }
}
