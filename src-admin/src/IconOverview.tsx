import icons from './icons.json';
import popupNotify3Icons from '../../templates/popup-notify3-icons.json';
import {
    Grid,
    Typography,
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Snackbar,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { I18n } from '@iobroker/gui-components';
import React from 'react';

interface Icon {
    name: string;
    base64: string;
}

/** which icons are listed: all, or only those of the big icon font of popupNotify3 */
type IconSet = 'all' | 'notify3';

function isIconSet(value: unknown): value is IconSet {
    return value === 'all' || value === 'notify3';
}

const allIcons: readonly Icon[] = icons;
/** single source: templates/popup-notify3-icons.json, shared with the adapter */
const notify3IconNames: ReadonlySet<string> = new Set<string>(popupNotify3Icons);

interface IconOverviewState {
    filter: string;
    showFilter: boolean;
    iconSet: IconSet;
    snackbar: { open: boolean; label: string };
}

class IconOverview extends React.Component<object, IconOverviewState> {
    private readonly filterRef = React.createRef<HTMLInputElement>();

    constructor(props: object) {
        super(props);
        this.state = { filter: '', showFilter: false, iconSet: 'all', snackbar: { open: false, label: '' } };
    }

    componentDidMount(): void {
        window.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    private readonly handleKeyDown = (e: KeyboardEvent): void => {
        // Cmd+F (Mac) oder Ctrl+F (Win/Linux)
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
            e.preventDefault();
            this.setState({ showFilter: true }, () => this.filterRef.current?.focus());
        }
    };

    private closeSnackbar = (): void => {
        this.setState({ snackbar: { open: false, label: '' } });
    };

    private getFilteredIcons(): readonly Icon[] {
        const { filter, iconSet } = this.state;
        const text = filter.toLowerCase();
        return allIcons.filter(
            icon =>
                (iconSet === 'all' || notify3IconNames.has(icon.name)) &&
                (!text || icon.name.toLowerCase().includes(text)),
        );
    }

    private renderIcon(icon: Icon): React.JSX.Element {
        return (
            <Grid
                key={icon.name}
                size={{ xs: 4, sm: 3, md: 2, lg: 1, xl: 1 }}
                sx={{ minWidth: 80, maxWidth: 120, flexBasis: 0 }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        void navigator.clipboard.writeText(icon.name);
                        this.setState({ snackbar: { open: true, label: icon.name } });
                    }}
                    title={I18n.t('iconOverviewCopyHint', icon.name)}
                >
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-flex',
                            width: 40,
                            height: 40,
                            color: 'text.primary',
                            mb: '4px',
                        }}
                        dangerouslySetInnerHTML={{
                            __html: atob(icon.base64.replace(/^data:image\/svg\+xml;base64,/, '')).replace(
                                /<svg([^>]*)>/,
                                '<svg$1 fill="currentColor">',
                            ),
                        }}
                    />
                    <Typography
                        variant="caption"
                        align="center"
                        sx={{
                            maxWidth: 104,
                            maxHeight: 36,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            whiteSpace: 'normal',
                        }}
                    >
                        {icon.name}
                    </Typography>
                </Box>
            </Grid>
        );
    }

    render(): React.JSX.Element {
        const { filter, showFilter, iconSet, snackbar } = this.state;
        const filteredIcons = this.getFilteredIcons();

        return (
            <Box sx={{ width: '100%', overflowX: 'auto', p: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ToggleButtonGroup
                        value={iconSet}
                        exclusive
                        size="small"
                        onChange={(_e, value: unknown) => {
                            if (isIconSet(value)) {
                                this.setState({ iconSet: value });
                            }
                        }}
                    >
                        <ToggleButton value="all">{I18n.t('iconOverviewSetAll')}</ToggleButton>
                        <ToggleButton
                            value="notify3"
                            title={I18n.t('iconOverviewSetNotify3Hint')}
                        >
                            {I18n.t('iconOverviewSetNotify3')}
                        </ToggleButton>
                    </ToggleButtonGroup>
                    {(showFilter || filter) && (
                        <TextField
                            inputRef={this.filterRef}
                            value={filter}
                            onChange={e => this.setState({ filter: e.target.value })}
                            label={I18n.t('iconOverviewFilterLabel')}
                            variant="outlined"
                            size="small"
                            sx={{ width: 300 }}
                            slotProps={{
                                input: {
                                    endAdornment: filter ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => this.setState({ filter: '', showFilter: false })}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                },
                            }}
                        />
                    )}
                    <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                    >
                        {I18n.t('iconOverviewCount', String(filteredIcons.length))}
                    </Typography>
                </Box>
                <Grid
                    container
                    spacing={2}
                >
                    {filteredIcons.map(icon => this.renderIcon(icon))}
                </Grid>
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={1500}
                    onClose={this.closeSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        severity="success"
                        sx={{ width: '100%' }}
                        onClose={this.closeSnackbar}
                    >
                        {I18n.t('iconOverviewCopied', snackbar.label)}
                    </Alert>
                </Snackbar>
            </Box>
        );
    }
}

export default IconOverview;
