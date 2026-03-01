import React from 'react';
import { InputLabel, TextField, FormHelperText, MenuItem, FormControl, Select } from '@mui/material';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';

interface ConfigIPSchema {
    label?: string;
    help?: string;
    helpLink?: string;
    noTranslation?: boolean;
    listenOnAllPorts?: boolean;
    onlyIp4?: boolean;
    onlyIp6?: boolean;
    noInternal?: boolean;
    sx?: Record<string, unknown>;
}

type ConfigIPProps = ConfigGenericProps & {
    schema: ConfigIPSchema;
};

interface IPInfo {
    name: string;
    address: string;
    family: string;
    internal?: boolean;
}

interface ConfigIPState extends ConfigGenericState {
    ips: IPInfo[];
    isLoading: boolean;
}

class ConfigIP extends ConfigGeneric<ConfigIPProps, ConfigIPState> {
    constructor(props: ConfigIPProps) {
        super(props);
        this.state = {
            ...this.state,
            ips: [],
            isLoading: true,
        };
    }

    componentDidMount(): void {
        super.componentDidMount();
        void this.loadIPs();
    }

    private async loadIPs(): Promise<void> {
        try {
            const socket = this.props.oContext.socket;
            let ips = await socket.getHostByIp(this.props.common.host);
            console.log('IPs loaded:', ips);

            // Filter based on schema options
            if (!this.props.schema.listenOnAllPorts) {
                ips = ips.filter((item: IPInfo) => item.address !== '0.0.0.0' && item.address !== '::');
            }

            if (this.props.schema.onlyIp4) {
                ips = ips.filter((item: IPInfo) => item.family === 'ipv4');
            } else if (this.props.schema.onlyIp6) {
                ips = ips.filter((item: IPInfo) => item.family === 'ipv6');
            }

            if (this.props.schema.noInternal) {
                ips = ips.filter((item: IPInfo) => !item.internal);
                ips = ips.filter((item: IPInfo) => item.address !== '127.0.0.1' && item.address !== '::1');
            }

            // Label special addresses
            ips.forEach((item: IPInfo) => {
                if (item.address === '0.0.0.0') {
                    item.name = `[IPv4] 0.0.0.0 - ${this.getText('Listen on all IPs')}`;
                } else if (item.address === '::') {
                    item.name = `[IPv6] :: - ${this.getText('Listen on all IPs')}`;
                }
            });

            this.setState({ ips, isLoading: false });
        } catch (error) {
            console.error('Error loading IPs:', error);
            this.setState({ isLoading: false });
        }
    }

    renderItem(error: string, disabled: boolean): React.JSX.Element {
        const attr = this.props.attr || '';
        const value = ConfigGeneric.getValue(this.props.data, attr) || '';
        const item = this.state.ips.find(it => it.address === value);
        const { isLoading, ips } = this.state;

        return (
            <FormControl
                sx={this.props.schema.sx}
                variant="standard"
            >
                {ips.length > 0 && this.props.schema.label ? (
                    <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
                ) : null}
                {isLoading || ips.length === 0 ? (
                    <TextField
                        variant="standard"
                        error={!!error}
                        disabled={disabled || isLoading}
                        value={value}
                        onChange={(e): void => {
                            void this.onChange(attr, e.target.value);
                        }}
                        label={this.props.schema.label ? this.getText(this.props.schema.label) : undefined}
                        placeholder={isLoading ? this.getText('Loading IPs...') : undefined}
                    />
                ) : (
                    <Select
                        variant="standard"
                        error={!!error}
                        disabled={disabled}
                        value={value}
                        renderValue={(val): string => item?.name || val}
                        onChange={(e): void => {
                            void this.onChange(attr, e.target.value);
                        }}
                    >
                        {ips.map((it, i) => (
                            <MenuItem
                                key={i}
                                value={it.address}
                            >
                                {it.name}
                            </MenuItem>
                        ))}
                    </Select>
                )}
                {this.props.schema.help ? (
                    <FormHelperText>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink || '',
                            this.props.schema.noTranslation || false,
                        )}
                    </FormHelperText>
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigIP;
