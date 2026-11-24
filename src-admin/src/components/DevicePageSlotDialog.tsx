/**
 * "Settings of the element": the small settings of a status icon of the device page (a `status` slot, the 2x2 grid
 * of layout 1 - doc/ideas/device-details/README.md, section Geräteseite). A slot that shows a name is edited in the
 * page item dialog itself (ChannelConfigDialog without the channel selection). The fields are those of a standard page item (ChannelConfigDialog / AdminPageItemConfig) and
 * are edited with its building blocks: icon and color for true and false, the color scale (ChannelColorDialog), the
 * short tap (standard or navigation to a page) and the state a long press writes.
 *
 * The dialog is made of sections ({@link DevicePageSlotDialog.renderLook}, {@link DevicePageSlotDialog.renderTap},
 * {@link DevicePageSlotDialog.renderActions}):
 * further settings of an element get a section of their own and a field in `DevicePageSlotLook`.
 */
import React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material';
import { I18n, type AdminConnection, type IobTheme, type ThemeType } from '@iobroker/gui-components';
import ChannelColorDialog from './ChannelColorDialog';
import { EntitySelector } from './EntitySelector';
import { isIconColorScaleElement, type ChannelColorConfig } from '../../../src/lib/types/adminShareConfig';
import type { DevicePageSlotLook, DevicePageSlotRef } from '../../../src/lib/types/deviceDetails';

/** what the dialog offers for a slot */
export interface DevicePageSlotDialogOptions {
    /** the slot takes a long press action */
    longPress: boolean;
    /** the short tap of the slot can navigate */
    tap: boolean;
    /** the element has one icon and color only (navigation slot): no false, no color scale */
    single: boolean;
}

export interface DevicePageSlotDialogProps {
    socket: AdminConnection;
    theme: IobTheme;
    themeType: ThemeType;
    adapterName?: string;
    instance?: number;
    /**
     * an icon selector of the admin, rendered by the page item dialog
     *
     * @param label translation key of the label
     * @param value the chosen icon, '' = none
     * @param onChange the picked icon
     */
    iconSelect: (label: string, value: string, onChange: (icon: string) => void) => React.ReactNode;
    /**
     * the selector of the target page of the short tap, rendered by the page item dialog
     *
     * @param slot the slot (only its navigation fields are used)
     * @param onChange the chosen page, '' = none
     */
    targetSelect: (slot: DevicePageSlotRef, onChange: (page: string) => void) => React.ReactNode;
    /**
     * the settings were applied
     *
     * @param index index of the slot (0 = slot 1)
     * @param look the settings, empty = none
     */
    onApply: (index: number, look: DevicePageSlotLook) => void;
}

interface DevicePageSlotDialogState {
    open: boolean;
    /** index of the slot the dialog was opened for */
    index: number;
    /** name of the element in the title */
    name: string;
    /** what the dialog offers for the slot */
    options: DevicePageSlotDialogOptions;
    /** the settings being edited */
    look: DevicePageSlotLook;
}

export default class DevicePageSlotDialog extends React.Component<
    DevicePageSlotDialogProps,
    DevicePageSlotDialogState
> {
    private colorDialogRef = React.createRef<ChannelColorDialog>();

    constructor(props: DevicePageSlotDialogProps) {
        super(props);
        this.state = {
            open: false,
            index: 0,
            name: '',
            options: { longPress: false, tap: false, single: false },
            look: {},
        };
    }

    /**
     * Opens the dialog for a slot.
     *
     * @param index index of the slot (0 = slot 1)
     * @param name name of the element for the title
     * @param look its settings
     * @param options what the dialog offers for the slot
     */
    public openWith(index: number, name: string, look: DevicePageSlotLook, options: DevicePageSlotDialogOptions): void {
        this.setState({ open: true, index, name, options: { ...options }, look: { ...look } });
    }

    private handleClose = (): void => {
        this.setState({ open: false });
    };

    private handleApply = (): void => {
        this.props.onApply(this.state.index, this.state.look);
        this.setState({ open: false });
    };

    /**
     * @param navigation the short tap navigates
     */
    private setNavigation(navigation: boolean): void {
        this.setState(prev => {
            const look: DevicePageSlotLook = { ...prev.look };
            if (navigation) {
                look.isNavigation = true;
            } else {
                delete look.isNavigation;
                delete look.targetPage;
            }
            return { look };
        });
    }

    /**
     * @param page the target page of the short tap, '' = none
     */
    private setTargetPage = (page: string): void => {
        this.setState(prev => {
            const look: DevicePageSlotLook = { ...prev.look };
            if (page) {
                look.targetPage = page;
            } else {
                delete look.targetPage;
            }
            return { look };
        });
    };

    /**
     * @param field a text field of the settings
     * @param value its new value, '' = not set
     */
    private setField(field: 'trueIcon' | 'falseIcon' | 'trueColor' | 'falseColor' | 'longPress', value: string): void {
        this.setState(prev => {
            const look: DevicePageSlotLook = { ...prev.look };
            if (value) {
                look[field] = value;
            } else {
                delete look[field];
            }
            return { look };
        });
    }

    /**
     * The color dialog of the page item returns both colors and the scale.
     *
     * @param config its result
     */
    private handleColorSave = (config: ChannelColorConfig): void => {
        this.setState(prev => {
            const look: DevicePageSlotLook = { ...prev.look };
            delete look.trueColor;
            delete look.falseColor;
            delete look.scale;
            if (config.trueColor) {
                look.trueColor = config.trueColor;
            }
            if (config.falseColor) {
                look.falseColor = config.falseColor;
            }
            if (isIconColorScaleElement(config.scale)) {
                look.scale = config.scale;
            }
            return { look };
        });
    };

    /**
     * Icon and color of one state, like a column of the page item dialog.
     *
     * @param branch the state
     * @returns the column
     */
    private renderBranch(branch: 'true' | 'false'): React.JSX.Element {
        const isTrue = branch === 'true';
        const iconField = isTrue ? 'trueIcon' : 'falseIcon';
        const colorField = isTrue ? 'trueColor' : 'falseColor';
        const color = this.state.look[colorField] ?? '';
        return (
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    border: 2,
                    borderColor: isTrue ? 'success.main' : 'error.main',
                    borderRadius: 1,
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                }}
                data-dd={`device-page-slot-${branch}`}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ color: isTrue ? 'success.main' : 'error.main', fontWeight: 'bold' }}
                >
                    {I18n.t(isTrue ? 'channelConfigDialog_condTrue' : 'channelConfigDialog_condFalse')}
                </Typography>
                {this.props.iconSelect(`channelConfigDialog_icon_${branch}`, this.state.look[iconField] ?? '', icon =>
                    this.setField(iconField, icon),
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {color === '' ? (
                        <>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ flex: 1 }}
                            >
                                {I18n.t('channelConfigDialog_color')}: {I18n.t('deviceDetailsDialog_slotAuto')}
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => this.setField(colorField, isTrue ? '#00cc00' : '#cc0000')}
                            >
                                {I18n.t('channelConfigDialog_setColor')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <TextField
                                variant="standard"
                                type="color"
                                label={I18n.t('channelConfigDialog_color')}
                                value={color}
                                onChange={e => this.setField(colorField, e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => this.setField(colorField, '')}
                            >
                                {I18n.t('channelConfigDialog_resetColor')}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        );
    }

    /**
     * Section look: icon and color for true and false, the color scale.
     *
     * @returns the section
     */
    private renderLook(): React.JSX.Element {
        const { look, options } = this.state;
        if (options.single) {
            // one icon and color: the element has no state
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2">{I18n.t('deviceDetailsDialog_slotLook')}</Typography>
                    <Box sx={{ display: 'flex' }}>{this.renderBranch('true')}</Box>
                </Box>
            );
        }
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2">{I18n.t('deviceDetailsDialog_slotLook')}</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {this.renderBranch('true')}
                    {this.renderBranch('false')}
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {I18n.t('deviceDetailsDialog_slotLookHint')}
                </Typography>
                <Box>
                    <Button
                        size="small"
                        variant="outlined"
                        color={look.scale ? 'success' : 'primary'}
                        onClick={() =>
                            this.colorDialogRef.current?.openWith({
                                trueColor: look.trueColor ?? '',
                                falseColor: look.falseColor ?? '',
                                scale: look.scale,
                            })
                        }
                        data-dd="device-page-slot-scale"
                    >
                        {I18n.t('deviceDetailsDialog_slotScale')}
                    </Button>
                </Box>
            </Box>
        );
    }

    /**
     * Section short tap: standard (what the element does on its own) or navigation to a page - only where the tap of
     * the element reaches the adapter.
     *
     * @returns the section, null when the tap cannot navigate
     */
    private renderTap(): React.JSX.Element | null {
        const { look, options } = this.state;
        if (!options.tap) {
            return null;
        }
        const navigation = look.isNavigation === true;
        const slot: DevicePageSlotRef = { key: '', id: '', isNavigation: true };
        if (look.targetPage) {
            slot.targetPage = look.targetPage;
        }
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                data-dd="device-page-slot-tap"
            >
                <Typography variant="subtitle2">{I18n.t('deviceDetailsDialog_slotTap')}</Typography>
                <RadioGroup
                    row
                    value={navigation ? 'navigation' : 'default'}
                    onChange={e => this.setNavigation(e.target.value === 'navigation')}
                >
                    <FormControlLabel
                        value="default"
                        control={<Radio size="small" />}
                        label={I18n.t('deviceDetailsDialog_slotTapDefault')}
                        slotProps={{ typography: { variant: 'body2' } }}
                    />
                    <FormControlLabel
                        value="navigation"
                        control={<Radio size="small" />}
                        label={I18n.t('deviceDetailsDialog_slotTapNavigation')}
                        slotProps={{ typography: { variant: 'body2' } }}
                    />
                </RadioGroup>
                {navigation ? this.props.targetSelect(slot, this.setTargetPage) : null}
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {I18n.t('deviceDetailsDialog_slotTapHint')}
                </Typography>
            </Box>
        );
    }

    /**
     * Section actions: the state a long press writes - only where the element takes one.
     *
     * @returns the section, null when the element has no action to set
     */
    private renderActions(): React.JSX.Element | null {
        if (!this.state.options.longPress) {
            return null;
        }
        const { socket, theme, themeType } = this.props;
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                data-dd="device-page-slot-actions"
            >
                <Typography variant="subtitle2">{I18n.t('channelConfigDialog_longPressTitle')}</Typography>
                <EntitySelector
                    label={I18n.t('channelConfigDialog_LongPressChannelId')}
                    value={this.state.look.longPress ?? ''}
                    onChange={(value: string): void => this.setField('longPress', value.trim())}
                    onTransformSelectedId={(id: string) => id.trim()}
                    socket={socket}
                    theme={theme}
                    themeType={themeType}
                    dialogName="devicePageSlotLongPress"
                    filterFunc={(obj: ioBroker.Object) =>
                        obj.type === 'state' && obj.common?.type === 'boolean' && obj.common?.write === true
                    }
                />
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {I18n.t('deviceDetailsDialog_slotLongPressHint')}
                </Typography>
            </Box>
        );
    }

    render(): React.JSX.Element {
        const { socket, adapterName, instance } = this.props;
        const { open, name, look } = this.state;
        return (
            <>
                <Dialog
                    open={open}
                    onClose={this.handleClose}
                    maxWidth="sm"
                    fullWidth
                    data-dd="device-page-slot-dialog"
                >
                    <DialogTitle>
                        {I18n.t('deviceDetailsDialog_slotSettings')}
                        {name ? ` – ${name}` : ''}
                    </DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {I18n.t('deviceDetailsDialog_slotSettingsHint')}
                        </Typography>
                        {this.renderLook()}
                        {this.renderTap()}
                        {this.renderActions()}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose}>{I18n.t('channelConfigDialog_cancel')}</Button>
                        <Button
                            variant="contained"
                            onClick={this.handleApply}
                            data-dd="device-page-slot-apply"
                        >
                            {I18n.t('deviceDetailsDialog_apply')}
                        </Button>
                    </DialogActions>
                </Dialog>
                <ChannelColorDialog
                    ref={this.colorDialogRef}
                    socket={socket}
                    adapterName={adapterName}
                    instance={instance}
                    channelRole={null}
                    isNavigation={false}
                    roleDefaults={null}
                    trueColor={look.trueColor ?? ''}
                    falseColor={look.falseColor ?? ''}
                    onSave={this.handleColorSave}
                />
            </>
        );
    }
}
