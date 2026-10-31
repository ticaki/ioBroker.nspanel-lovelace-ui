/**
 * Editor for the classic thermostat page (cardThermo) in the PageConfig tab.
 *
 * The page has no page items and no layout of its own: one alias channel, a headline, a unit and
 * the limits of the set temperature - the adapter derives everything else (values, mode icons and
 * buttons) from the states below the channel (ConfigManager.getPageThermo). Follows the
 * ConfigGeneric pattern of PageChartEditor
 * (alive-gated fields, main-page lock); the channel is picked with the selector the thermo2 editor
 * uses for the alias channel of a heat circuit and its role is checked against the roles the
 * adapter accepts. The limits are stored exactly as typed - the adapter interprets them (tenths of
 * a degree or degrees, see ThermoEntry), so a page taken over from a script keeps its numbers.
 */
import React from 'react';
import { Alert, Box, TextField, Typography } from '@mui/material';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { EntitySelector } from './EntitySelector';
import {
    type ThermoEntry,
    ADAPTER_NAME,
    isMainPageEntry,
    thermoChannelRoles,
} from '../../../src/lib/types/adminShareConfig';

export interface PageThermoEditorProps {
    entry: ThermoEntry;
    onEntryChange: (updated: ThermoEntry) => void;
    onUniqueNameChange: (oldName: string, newName: string) => void;
    getText: (key: string) => string;
    oContext: any;
    theme?: any;
}

interface PageThermoEditorState extends ConfigGenericState {
    alive: boolean;
    /** role of the stored channel: undefined = not loaded yet, null = object missing */
    role: string | null | undefined;
    /** channel id the role belongs to */
    roleOf: string;
}

type LimitField = 'minValue' | 'maxValue' | 'stepValue';

/** object types a thermostat channel may have (also the `types` of the SelectID, which shows states only by default) */
const THERMO_OBJECT_TYPES: ioBroker.ObjectType[] = ['channel', 'device', 'folder'];

/**
 * channel-like objects with a role the adapter accepts for the thermostat
 *
 * @param obj object from the browser
 */
function isThermoObject(obj: ioBroker.Object): boolean {
    return (
        !!obj && THERMO_OBJECT_TYPES.includes(obj.type) && thermoChannelRoles.includes(String(obj.common?.role ?? ''))
    );
}

export class PageThermoEditor extends ConfigGeneric<ConfigGenericProps & PageThermoEditorProps, PageThermoEditorState> {
    constructor(props: ConfigGenericProps & PageThermoEditorProps) {
        super(props);
        this.state = {
            ...this.state,
            alive: false,
            role: undefined,
            roleOf: '',
        };
    }

    componentWillUnmount(): void {
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;
        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            this.setState({ alive: !!state?.val });
            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);
        } catch (error) {
            console.error('[PageThermoEditor] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false });
        }
        await this.loadRole(this.props.entry.channelId);
    }

    async componentDidUpdate(prevProps: Readonly<ConfigGenericProps & PageThermoEditorProps>): Promise<void> {
        // another page was selected in the list - its channel has to be checked
        if (prevProps.entry.uniqueName !== this.props.entry.uniqueName) {
            await this.loadRole(this.props.entry.channelId);
        }
    }

    private onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const isAlive = state ? !!state.val : false;
        if (isAlive !== this.state.alive) {
            this.setState({ alive: isAlive });
        }
    };

    getText(key: string): string {
        return this.props.getText(key);
    }

    /**
     * Reads the role of the channel so the editor can warn about a missing object or a role the
     * adapter does not accept.
     *
     * @param channelId stored channel id
     */
    private async loadRole(channelId: string | undefined): Promise<void> {
        const id = (channelId ?? '').trim();
        if (!id) {
            this.setState({ role: undefined, roleOf: '' });
            return;
        }
        const socket = this.props.oContext?.socket;
        if (!socket) {
            return;
        }
        let role: string | null = null;
        try {
            const obj: ioBroker.Object | null | undefined = await socket.getObject(id);
            role = obj ? String(obj.common?.role ?? '') : null;
        } catch {
            role = null;
        }
        this.setState({ role, roleOf: id });
    }

    private handleFieldChange<K extends keyof ThermoEntry>(field: K, value: ThermoEntry[K]): void {
        this.props.onEntryChange({ ...this.props.entry, [field]: value });
    }

    private setLimit(field: LimitField, raw: string): void {
        const n = parseFloat(raw);
        this.handleFieldChange(field, Number.isFinite(n) ? n : undefined);
    }

    private renderLimitField(field: LimitField, labelKey: string): React.JSX.Element {
        const { entry } = this.props;
        return (
            <TextField
                variant="standard"
                type="number"
                label={this.getText(labelKey)}
                value={entry[field] ?? ''}
                onChange={e => this.setLimit(field, e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 'any' } }}
                sx={{ width: 160, mr: 2, mb: 1 }}
                disabled={!this.state.alive}
            />
        );
    }

    /** warning about the stored channel, undefined when it is usable or not checked yet */
    private channelProblem(): string | undefined {
        const { role, roleOf } = this.state;
        const id = (this.props.entry.channelId ?? '').trim();
        if (!id || roleOf !== id) {
            return undefined;
        }
        if (role === null) {
            return this.getText('thermo2_channelMissing').replace('%s', id);
        }
        if (typeof role === 'string' && !thermoChannelRoles.includes(role)) {
            return this.getText('thermo2_wrongRole')
                .replace('%s', id)
                .replace('%s', role || '-');
        }
        return undefined;
    }

    render(): React.JSX.Element {
        const { entry, oContext, theme } = this.props;
        const { alive, role, roleOf } = this.state;
        const themeType = oContext?.themeType ?? (theme?.palette?.mode || 'light');
        const problem = this.channelProblem();
        const id = (entry.channelId ?? '').trim();
        const roleKnown = !problem && !!id && roleOf === id && typeof role === 'string';

        return (
            <Box>
                {/* UniqueName display */}
                <Box
                    sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: 'action.hover',
                    }}
                >
                    <TextField
                        fullWidth
                        variant="standard"
                        type="text"
                        label={this.getText('unique_label')}
                        value={entry.uniqueName}
                        onChange={e => {
                            const newUniqueName = e.target.value;
                            if (newUniqueName.trim()) {
                                this.props.onUniqueNameChange(entry.uniqueName, newUniqueName);
                            }
                        }}
                        slotProps={{
                            input: {
                                sx: {
                                    backgroundColor: 'transparent',
                                    px: 1,
                                    fontWeight: 600,
                                    width: '50%',
                                },
                            },
                        }}
                        disabled={!alive || isMainPageEntry(entry)}
                        helperText={isMainPageEntry(entry) ? this.getText('page_name_main_locked') : undefined}
                    />
                </Box>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {this.getText('thermo_intro')}
                </Typography>

                {/* Headline */}
                <TextField
                    fullWidth
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('headline')}
                    value={entry.headline ?? ''}
                    placeholder={entry.uniqueName}
                    helperText={this.getText('thermo_headlineHint')}
                    onChange={e => this.handleFieldChange('headline', e.target.value)}
                    slotProps={{
                        input: { sx: { backgroundColor: 'transparent', px: 1, width: '50%' } },
                        inputLabel: { shrink: true },
                    }}
                    sx={{ mb: 2 }}
                    disabled={!alive}
                />

                {/* Channel */}
                <Box sx={{ mb: 2 }}>
                    <EntitySelector
                        label={this.getText('thermo2_channel')}
                        value={entry.channelId ?? ''}
                        onChange={(v: string) => this.handleFieldChange('channelId', v)}
                        onCommit={(v: string) => void this.loadRole(v)}
                        socket={oContext.socket}
                        theme={theme}
                        themeType={themeType}
                        dialogName="selectThermoChannel"
                        filterFunc={isThermoObject}
                        types={THERMO_OBJECT_TYPES}
                        disabled={!alive}
                    />
                    {problem && (
                        <Alert
                            severity="warning"
                            sx={{ mt: 1 }}
                        >
                            {problem}
                        </Alert>
                    )}
                    {roleKnown && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {this.getText('thermo2_roleIs').replace('%s', role ?? '')}
                        </Typography>
                    )}
                </Box>

                {/* Unit */}
                <TextField
                    variant="standard"
                    type="text"
                    autoComplete="off"
                    label={this.getText('thermo2_unit')}
                    value={entry.unit ?? ''}
                    helperText={this.getText('thermo_unitHint')}
                    onChange={e => this.handleFieldChange('unit', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 160, mb: 2 }}
                    disabled={!alive}
                />

                {/* Limits of the set temperature */}
                <Box sx={{ mb: 1 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1 }}
                    >
                        {this.getText('thermo2_dialogLimits')}
                    </Typography>
                    {this.renderLimitField('minValue', 'thermo2_minValue')}
                    {this.renderLimitField('maxValue', 'thermo2_maxValue')}
                    {this.renderLimitField('stepValue', 'thermo2_stepValue')}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                    >
                        {this.getText('thermo_limitsHint')}
                    </Typography>
                </Box>
            </Box>
        );
    }
}

export default PageThermoEditor;
