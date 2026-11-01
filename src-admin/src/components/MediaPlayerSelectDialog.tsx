/**
 * Selection dialog for the player of a media page (cardMedia).
 *
 * Lists every player of the supported adapters that exists in the database, found by the
 * definitions of templates/media-players.json - instead of an object tree the user has to search.
 */
import React from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    TextField,
    Typography,
} from '@mui/material';
import {
    type MediaBackend,
    type MediaPlayerDefinition,
    isSelectableMediaPlayer,
    mediaPlayerDefinitions,
} from '../../../src/lib/types/adminShareConfig';
import { MEDIA_LOGOS, localizedText, objectName } from './mediaPlayerShared';

/** The only socket method this dialog uses; `AdminConnection` of the admin provides it. */
export interface MediaPlayerSocket {
    getObjectViewSystem(
        type: ioBroker.ObjectType,
        start: string,
        end: string,
    ): Promise<Record<string, ioBroker.AnyObject | null | undefined> | null | undefined>;
}

/** one player found in the database */
export interface MediaPlayerOption {
    /** player id as the adapter expects it */
    id: string;
    /** common.name of the player (title of the adapter for instance players), may be empty */
    name: string;
    backend: MediaBackend;
    /** instance number of the adapter */
    instance: string;
    /** the adapter instance is switched off (instance players only) */
    disabled: boolean;
}

interface MediaPlayerSelectDialogProps {
    socket: MediaPlayerSocket;
    /** current player id, highlighted when it is in the list */
    selected: string;
    /** admin language for the names */
    lang: string;
    getText: (key: string) => string;
    /** a player was chosen */
    onSelect: (id: string) => void;
    onClose: () => void;
}

interface MediaPlayerSelectDialogState {
    loading: boolean;
    players: MediaPlayerOption[];
    /** backends whose objects could not be read */
    failed: MediaBackend[];
    search: string;
    /** id marked in the list */
    selected: string;
}

/** last character of an object view range */
const RANGE_END = '香';
const ADAPTER_PREFIX = 'system.adapter.';

/**
 * all players of one definition
 *
 * @param socket admin connection
 * @param def player definition
 * @param lang admin language
 * @returns the players found
 */
async function findPlayers(
    socket: MediaPlayerSocket,
    def: MediaPlayerDefinition,
    lang: string,
): Promise<MediaPlayerOption[]> {
    const result: MediaPlayerOption[] = [];
    if (def.kind === 'instance') {
        const prefix = `${ADAPTER_PREFIX}${def.backend}.`;
        const objects = (await socket.getObjectViewSystem('instance', prefix, `${prefix}${RANGE_END}`)) ?? {};
        for (const [key, obj] of Object.entries(objects)) {
            const id = key.slice(ADAPTER_PREFIX.length);
            if (!obj || !key.startsWith(prefix) || id.split('.').length !== 2 || !isSelectableMediaPlayer(id)) {
                continue;
            }
            const common: Record<string, unknown> = { ...obj.common };
            result.push({
                id,
                name: localizedText(common.titleLang, lang) || localizedText(common.title, lang),
                backend: def.backend,
                instance: id.split('.')[1],
                disabled: common.enabled === false,
            });
        }
        return result;
    }
    const prefix = `${def.backend}.`;
    const objects = (await socket.getObjectViewSystem(def.objectType, prefix, `${prefix}${RANGE_END}`)) ?? {};
    for (const [id, obj] of Object.entries(objects)) {
        if (!obj || !isSelectableMediaPlayer(id, obj.type)) {
            continue;
        }
        result.push({
            id,
            name: objectName(obj, lang),
            backend: def.backend,
            instance: id.split('.')[1],
            disabled: false,
        });
    }
    return result;
}

/**
 * MediaPlayerSelectDialog - list of all players of the supported adapters, grouped by adapter
 */
export class MediaPlayerSelectDialog extends React.Component<
    MediaPlayerSelectDialogProps,
    MediaPlayerSelectDialogState
> {
    private mounted = false;

    constructor(props: MediaPlayerSelectDialogProps) {
        super(props);
        this.state = {
            loading: true,
            players: [],
            failed: [],
            search: '',
            selected: props.selected.trim(),
        };
    }

    componentDidMount(): void {
        this.mounted = true;
        void this.load();
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    private async load(): Promise<void> {
        const { socket, lang } = this.props;
        const players: MediaPlayerOption[] = [];
        const failed: MediaBackend[] = [];
        await Promise.all(
            mediaPlayerDefinitions.map(async def => {
                try {
                    players.push(...(await findPlayers(socket, def, lang)));
                } catch (error) {
                    console.error(`[MediaPlayerSelectDialog] reading the players of ${def.backend} failed:`, error);
                    failed.push(def.backend);
                }
            }),
        );
        const order = mediaPlayerDefinitions.map(d => d.backend);
        players.sort(
            (a, b) =>
                order.indexOf(a.backend) - order.indexOf(b.backend) ||
                a.id.localeCompare(b.id, undefined, { numeric: true }),
        );
        if (this.mounted) {
            this.setState({ loading: false, players, failed });
        }
    }

    private visiblePlayers(): MediaPlayerOption[] {
        const search = this.state.search.trim().toLowerCase();
        if (!search) {
            return this.state.players;
        }
        return this.state.players.filter(
            p =>
                p.id.toLowerCase().includes(search) ||
                p.name.toLowerCase().includes(search) ||
                this.props.getText(`media_backend_${p.backend}`).toLowerCase().includes(search),
        );
    }

    private renderBadge(backend: MediaBackend): React.JSX.Element {
        const logo = MEDIA_LOGOS[backend];
        return (
            <Box
                component="span"
                sx={{
                    display: 'inline-block',
                    minWidth: 56,
                    px: 0.75,
                    py: 0.25,
                    mr: 1,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: 'center',
                    backgroundColor: logo.bg,
                    color: logo.fg,
                }}
            >
                {logo.text}
            </Box>
        );
    }

    private renderPlayer(player: MediaPlayerOption): React.JSX.Element {
        const { getText } = this.props;
        const current = player.id === this.props.selected.trim();
        const secondary = [player.name ? player.id : '', player.disabled ? getText('media_selectPlayerDisabled') : '']
            .filter(Boolean)
            .join(' · ');
        return (
            <ListItemButton
                key={player.id}
                selected={player.id === this.state.selected}
                onClick={() => this.setState({ selected: player.id })}
                onDoubleClick={() => this.props.onSelect(player.id)}
                sx={{ pl: 2 }}
            >
                {this.renderBadge(player.backend)}
                <ListItemText
                    primary={player.name || player.id}
                    secondary={secondary || undefined}
                    slotProps={{
                        primary: { sx: { fontWeight: current ? 700 : undefined } },
                        secondary: { sx: { fontFamily: 'monospace', fontSize: 12 } },
                    }}
                />
                {current && (
                    <Typography
                        variant="caption"
                        color="primary"
                        sx={{ ml: 1, whiteSpace: 'nowrap' }}
                    >
                        {getText('media_selectPlayerCurrent')}
                    </Typography>
                )}
            </ListItemButton>
        );
    }

    private renderList(): React.JSX.Element {
        const { getText } = this.props;
        const { loading, players } = this.state;
        if (loading) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">{getText('media_selectPlayerLoading')}</Typography>
                </Box>
            );
        }
        if (!players.length) {
            const adapters = mediaPlayerDefinitions.map(d => d.backend).join(', ');
            return <Alert severity="info">{getText('media_selectPlayerEmpty').replace('%s', adapters)}</Alert>;
        }
        const visible = this.visiblePlayers();
        if (!visible.length) {
            return <Alert severity="info">{getText('media_selectPlayerNoMatch')}</Alert>;
        }
        const groups = mediaPlayerDefinitions
            .map(def => ({ backend: def.backend, players: visible.filter(p => p.backend === def.backend) }))
            .filter(g => g.players.length);
        return (
            <List
                dense
                disablePadding
            >
                {groups.map(group => (
                    <li key={group.backend}>
                        <ul style={{ padding: 0 }}>
                            <ListSubheader sx={{ lineHeight: '32px' }}>
                                {getText(`media_backend_${group.backend}`)}
                            </ListSubheader>
                            {group.players.map(p => this.renderPlayer(p))}
                        </ul>
                    </li>
                ))}
            </List>
        );
    }

    render(): React.ReactNode {
        const { getText, onClose, onSelect } = this.props;
        const { failed, loading, players, search, selected } = this.state;
        return (
            <Dialog
                open
                onClose={onClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{getText('media_selectPlayerTitle')}</DialogTitle>
                <DialogContent dividers>
                    {!loading && players.length > 0 && (
                        <TextField
                            fullWidth
                            autoFocus
                            variant="standard"
                            autoComplete="off"
                            label={getText('media_selectPlayerSearch')}
                            value={search}
                            onChange={e => this.setState({ search: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ mb: 1 }}
                        />
                    )}
                    {failed.length > 0 && (
                        <Alert
                            severity="warning"
                            sx={{ mb: 1 }}
                        >
                            {getText('media_selectPlayerReadError').replace('%s', failed.join(', '))}
                        </Alert>
                    )}
                    <Box sx={{ minHeight: 120, maxHeight: '55vh', overflowY: 'auto' }}>{this.renderList()}</Box>
                    {!loading && players.length > 0 && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 1 }}
                        >
                            {getText('media_selectPlayerHint')}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{getText('media_cancel')}</Button>
                    <Button
                        variant="contained"
                        disabled={!selected || !players.some(p => p.id === selected)}
                        onClick={() => onSelect(selected)}
                    >
                        {getText('media_selectPlayerOk')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
