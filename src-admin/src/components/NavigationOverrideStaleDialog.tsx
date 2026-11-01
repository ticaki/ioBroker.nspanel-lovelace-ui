import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { I18n } from '@iobroker/gui-components';
import type { NavigationLinks } from '../../../src/lib/types/adminShareConfig';
import { navigationLinkKinds } from '../../../src/lib/types/navigationEdit';

/** One script page whose override is out of date, with the three link sets the user decides between */
export interface StaleOverrideItem {
    /** Node id of the page */
    page: string;
    /** Links of the script when the override was made (its snapshot) */
    then: NavigationLinks;
    /** Links the script delivers now */
    now: NavigationLinks;
    /** Links the override sets */
    mine: NavigationLinks;
}

/** What the user chose for the listed pages */
export type StaleOverrideDecision = 'merge' | 'keep' | 'script' | 'later';

export interface NavigationOverrideStaleDialogProps {
    open: boolean;
    /** Display name of the panel the pages belong to */
    panelName: string;
    items: StaleOverrideItem[];
    /** The decision, applied to every listed page */
    onDecide: (decision: StaleOverrideDecision) => void;
    /** the panel is marked "panel uses no script" - taking over the script is not offered */
    noScript?: boolean;
}

/**
 * Formats a link set as one line, `-` for a set without any link.
 *
 * @param links The links.
 * @returns E.g. `prev: a, next: b`.
 */
function formatLinks(links: NavigationLinks): string {
    const parts = navigationLinkKinds.filter(kind => links[kind]).map(kind => `${kind}: ${links[kind]}`);
    return parts.length ? parts.join(', ') : '–';
}

/**
 * Tells the user that the configuration script delivers other navigation links for some pages
 * than it did when their navigation was changed in the admin, and asks how to go on.
 *
 * Three columns per page - the script at the time of the change, the script now, the change of
 * the user - and one decision for all listed pages: merge (changed links stay, the rest follows
 * the script), keep the change, take over the script, or decide later.
 */
export default class NavigationOverrideStaleDialog extends React.PureComponent<NavigationOverrideStaleDialogProps> {
    private handleMerge = (): void => {
        this.props.onDecide('merge');
    };

    private handleKeep = (): void => {
        this.props.onDecide('keep');
    };

    private handleScript = (): void => {
        this.props.onDecide('script');
    };

    private handleLater = (): void => {
        this.props.onDecide('later');
    };

    render(): React.ReactElement {
        const { open, panelName, items } = this.props;
        return (
            <Dialog
                open={open}
                onClose={this.handleLater}
                aria-labelledby="navigation-override-stale-title"
                aria-describedby="navigation-override-stale-description"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="navigation-override-stale-title">{I18n.t('nav_edit_stale_title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="navigation-override-stale-description">
                        {I18n.t('nav_edit_stale_text').replace('%p', panelName)}
                    </DialogContentText>
                    <Table
                        size="small"
                        sx={{ mt: 2 }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>{I18n.t('nav_edit_stale_page')}</TableCell>
                                <TableCell>{I18n.t('nav_edit_stale_col_then')}</TableCell>
                                <TableCell>{I18n.t('nav_edit_stale_col_now')}</TableCell>
                                <TableCell>{I18n.t('nav_edit_stale_col_mine')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.page}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{item.page}</TableCell>
                                    <TableCell>{formatLinks(item.then)}</TableCell>
                                    <TableCell>{formatLinks(item.now)}</TableCell>
                                    <TableCell>{formatLinks(item.mine)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2 }}
                    >
                        {I18n.t('nav_edit_stale_options_hint')}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
                    <Button
                        variant="contained"
                        onClick={this.handleMerge}
                        title={I18n.t('nav_edit_stale_merge_hint')}
                    >
                        {I18n.t('nav_edit_stale_merge')}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={this.handleKeep}
                        title={I18n.t('nav_edit_stale_keep_hint')}
                    >
                        {I18n.t('nav_edit_stale_keep')}
                    </Button>
                    {this.props.noScript ? null : (
                        <Button
                            variant="outlined"
                            onClick={this.handleScript}
                            title={I18n.t('nav_edit_stale_take_script_hint')}
                        >
                            {I18n.t('nav_edit_stale_take_script')}
                        </Button>
                    )}
                    <Button
                        variant="text"
                        onClick={this.handleLater}
                    >
                        {I18n.t('nav_edit_stale_later')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
