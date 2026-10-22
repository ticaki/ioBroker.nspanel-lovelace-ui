import React from 'react';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

/** Prefix of the objects the admin creates under System settings → Credentials. */
export const CREDENTIALS_PREFIX = 'system.credentials.';

interface CredentialOption {
    id: string;
    name: string;
    /** 'login' (login & password) or 'key' - written by the admin, derived from the fields if missing */
    form: string;
}

/** The only socket method this component uses; `AdminConnection` of the admin provides it. */
interface CredentialSocket {
    getObjectViewSystem(
        type: 'config',
        start: string,
        end: string,
    ): Promise<Record<string, ioBroker.AnyObject | undefined>>;
}

interface CredentialSelectProps {
    socket: CredentialSocket;
    /** the stored id, '' or undefined = no credential, the manual fields are used */
    value: string | undefined;
    onChange: (id: string) => void;
    label: string;
    getText: (key: string) => string;
    disabled?: boolean;
    sx?: SxProps<Theme>;
}

interface CredentialSelectState {
    options: CredentialOption[];
    loaded: boolean;
    loadError: boolean;
}

/**
 * Picker for a central credential (Admin → System settings → Credentials).
 *
 * Lists the ids and names of all `system.credentials.*` objects - the secrets themselves never
 * reach the browser; the adapter reads and decrypts them. The first entry keeps the manual
 * fields in use. The list is reloaded every time the menu opens, so an entry created in the
 * system settings in the meantime shows up without reloading the page.
 */
export class CredentialSelect extends React.Component<CredentialSelectProps, CredentialSelectState> {
    private unmounted = false;

    constructor(props: CredentialSelectProps) {
        super(props);
        this.state = { options: [], loaded: false, loadError: false };
    }

    componentDidMount(): void {
        void this.load();
    }

    componentWillUnmount(): void {
        this.unmounted = true;
    }

    private static nameOf(obj: ioBroker.AnyObject): string {
        const name = obj.common?.name;
        if (typeof name === 'string' && name) {
            return name;
        }
        if (name && typeof name === 'object') {
            const translated = name.en || Object.values(name)[0];
            if (typeof translated === 'string' && translated) {
                return translated;
            }
        }
        return obj._id.substring(CREDENTIALS_PREFIX.length);
    }

    private static formOf(obj: ioBroker.AnyObject): string {
        const native: object = obj.native ?? {};
        if ('form' in native && typeof native.form === 'string') {
            return native.form;
        }
        return 'key' in native && native.key !== undefined ? 'key' : 'login';
    }

    private load = async (): Promise<void> => {
        try {
            // same query as the credential picker of json-config
            const objs = await this.props.socket.getObjectViewSystem(
                'config',
                CREDENTIALS_PREFIX,
                `${CREDENTIALS_PREFIX}鿿`,
            );
            const options = Object.values(objs)
                .filter((obj): obj is ioBroker.AnyObject => !!obj && obj._id.startsWith(CREDENTIALS_PREFIX))
                .map(obj => ({
                    id: obj._id,
                    name: CredentialSelect.nameOf(obj),
                    form: CredentialSelect.formOf(obj),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
            if (!this.unmounted) {
                this.setState({ options, loaded: true, loadError: false });
            }
        } catch (error) {
            console.error('[CredentialSelect] Failed to load the credentials:', error);
            if (!this.unmounted) {
                this.setState({ loaded: true, loadError: true });
            }
        }
    };

    private formLabel(form: string): string {
        return this.props.getText(form === 'key' ? 'credential_form_key' : 'credential_form_login');
    }

    render(): React.JSX.Element {
        const { value, label, getText, disabled, sx } = this.props;
        const { options, loaded, loadError } = this.state;
        const current = value ?? '';
        const missing = loaded && !loadError && current !== '' && !options.some(o => o.id === current);

        let helper = getText('credential_hint');
        if (loadError) {
            helper = getText('credential_load_error');
        } else if (missing) {
            helper = getText('credential_missing');
        }

        return (
            <FormControl
                variant="standard"
                sx={sx}
                disabled={disabled}
                error={missing || loadError}
            >
                <InputLabel>{label}</InputLabel>
                <Select
                    value={current}
                    onOpen={() => void this.load()}
                    onChange={e => this.props.onChange(String(e.target.value ?? ''))}
                >
                    <MenuItem value="">
                        <em>{getText('credential_none')}</em>
                    </MenuItem>
                    {missing && (
                        <MenuItem
                            value={current}
                            disabled
                        >
                            {current}
                        </MenuItem>
                    )}
                    {options.map(option => (
                        <MenuItem
                            key={option.id}
                            value={option.id}
                        >
                            {`${option.name} (${this.formLabel(option.form)})`}
                        </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{helper}</FormHelperText>
            </FormControl>
        );
    }
}
