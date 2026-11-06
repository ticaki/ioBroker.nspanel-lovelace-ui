/**
 * Selection of a page item template: the template (list of the adapter), the object it works on with the
 * instances of its adapter as suggestions, and its options (`readOptions`).
 * Knows nothing about the dialog around it, the optional `area` only filters the list.
 */
import React from 'react';
import { Alert, Autocomplete, Box, Chip, TextField, Typography, createFilterOptions } from '@mui/material';
import type { ThemeType } from '@iobroker/gui-components';
import { EntitySelector } from './EntitySelector';
import { objectName } from './mediaPlayerShared';
import {
    type TemplateListEntry,
    buildTemplateList,
    pageItemTemplateInfoOf,
    templateEntryHelpText,
    templateEntrySearchText,
} from '../templateList';
import type {
    PageItemTemplateInfo,
    PageItemTemplateOption,
    ScreensaverArea,
} from '../../../src/lib/types/adminShareConfig';

export interface TemplateSelectorProps {
    /** page item templates of the adapter, undefined while unknown (adapter offline) */
    templates: PageItemTemplateInfo[] | undefined;
    /** name of the chosen template */
    template: string | undefined;
    /** the object the template works on (`dpInit`) */
    objectId: string;
    /** options of the template */
    readOptions: Record<string, string | number> | undefined;
    /** place of the screensaver: only templates for this place are offered, a stored one stays selectable */
    area?: ScreensaverArea;
    /** unique ids of the trash pages: one entry per page and trash template; undefined = plain template list */
    trashPages?: readonly string[];
    /**
     * the options belong to the template - the owner replaces `readOptions` when the template changes,
     * `readOptions` are those of the chosen list entry
     */
    onTemplateChange: (name: string | undefined, readOptions?: Record<string, string | number>) => void;
    onObjectChange: (id: string) => void;
    /** undefined = no option left */
    onReadOptionsChange: (readOptions: Record<string, string | number> | undefined) => void;
    getText: (key: string) => string;
    /** admin language */
    lang: string;
    socket: any;
    theme: any;
    themeType: ThemeType;
    /** name the object browser remembers its state under */
    dialogName?: string;
}

interface TemplateSelectorState {
    /** common.type of the object, null = not found, undefined = not checked */
    objType: string | null | undefined;
    objName: string;
    /** type of the object (state, channel, ...) */
    objKind: string;
    /** instances of the adapter of the template that fit it */
    instances: string[];
}

const ADAPTER_PREFIX = 'system.adapter.';
const RANGE_END = '香';

/** the typed text also finds an entry by the name of its template (`text.trash.next`) */
const filterTemplateEntries = createFilterOptions<TemplateListEntry>({
    stringify: templateEntrySearchText,
});

/**
 * object types a template with `need: 'channel'` works on - like the heat circuit picker of the Thermo2
 * editor: the SelectID needs them as `types`, otherwise it shows states only, plus the filter
 */
const TEMPLATE_OBJECT_TYPES: ioBroker.ObjectType[] = ['channel', 'device', 'folder'];

/**
 * channel, device or folder - the object a template searches its states in
 *
 * @param obj object from the browser
 */
function isChannelLike(obj: ioBroker.Object): boolean {
    return !!obj && TEMPLATE_OBJECT_TYPES.includes(obj.type);
}

/**
 * Option: restrict the picker of an adapter-bound template (`adapter` of the template, e.g. `pirate-weather`,
 * `roborock.0.Devices`) to the objects of that adapter. Prepared on 11.10.2026, NOT active yet (Tom): some
 * templates carry only a convention there (`0_userdata.0` for the shelly templates) and the filter would hide
 * real hits. Switch to `true` to activate - the caption `screensaver_item_adapterOnly` comes with it.
 */
const TEMPLATE_ADAPTER_FILTER = false;

/**
 * filter of the object picker for a template: channel-like objects, with the adapter option only those of
 * the template's adapter
 *
 * @param template the chosen template, null = none yet
 */
function templateObjectFilter(template: PageItemTemplateInfo | null): (obj: ioBroker.Object) => boolean {
    const adapter = TEMPLATE_ADAPTER_FILTER ? (template?.adapter ?? '').trim() : '';
    if (!adapter) {
        return isChannelLike;
    }
    const prefix = adapter.endsWith('.') ? adapter : `${adapter}.`;
    return (obj: ioBroker.Object): boolean => isChannelLike(obj) && (obj._id === adapter || obj._id.startsWith(prefix));
}

export class TemplateSelector extends React.Component<TemplateSelectorProps, TemplateSelectorState> {
    private mounted = false;

    constructor(props: TemplateSelectorProps) {
        super(props);
        this.state = { objType: undefined, objName: '', objKind: '', instances: [] };
    }

    componentDidMount(): void {
        this.mounted = true;
        void this.loadObject();
        void this.loadInstances();
    }

    componentDidUpdate(prev: TemplateSelectorProps): void {
        if (prev.objectId.trim() !== this.props.objectId.trim()) {
            void this.loadObject();
        }
        const before = pageItemTemplateInfoOf(prev.templates, prev.template);
        const now = this.selected();
        if (before?.name !== now?.name || before?.adapter !== now?.adapter || before?.need !== now?.need) {
            void this.loadInstances();
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    private selected(): PageItemTemplateInfo | null {
        return pageItemTemplateInfoOf(this.props.templates, this.props.template);
    }

    /** reads the object for the warnings below the object field */
    private async loadObject(): Promise<void> {
        const id = this.props.objectId.trim();
        if (!id) {
            this.setState({ objType: undefined, objName: '', objKind: '' });
            return;
        }
        let obj: ioBroker.Object | null | undefined = null;
        try {
            obj = await this.props.socket?.getObject(id);
        } catch {
            obj = null;
        }
        if (!this.mounted || this.props.objectId.trim() !== id) {
            return;
        }
        this.setState({
            objType: obj ? String(obj.common?.type ?? '') : null,
            objName: objectName(obj, this.props.lang),
            objKind: obj ? String(obj.type ?? '') : '',
        });
    }

    /**
     * The instances of the adapter of the template as suggestions; with exactly one and an empty object
     * field it is entered. The first segment of `adapter` names the adapter. An instance only counts when
     * the adapter check of the runtime (Page.getItemFromTemplate: `dpInit` includes `adapter`) lets it pass -
     * `roborock.0` would be refused for the template with the adapter `roborock.0.Devices`.
     */
    private async loadInstances(): Promise<void> {
        const selected = this.selected();
        const adapter = selected?.need === 'channel' ? selected.adapter.trim() : '';
        const segment = adapter.split('.')[0];
        if (!segment) {
            this.setState({ instances: [] });
            return;
        }
        const prefix = `${ADAPTER_PREFIX}${segment}.`;
        let objects: Record<string, unknown> | null | undefined;
        try {
            objects = await this.props.socket?.getObjectViewSystem('instance', prefix, `${prefix}${RANGE_END}`);
        } catch {
            objects = null;
        }
        if (!this.mounted || this.selected()?.name !== selected?.name) {
            return;
        }
        const instances = Object.keys(objects ?? {})
            .filter(key => key.startsWith(prefix))
            .map(key => key.slice(ADAPTER_PREFIX.length))
            .filter(id => id.split('.').length === 2 && id.includes(adapter))
            .sort((a, b) => a.localeCompare(b));
        this.setState({ instances });
        if (instances.length === 1 && !this.props.objectId.trim()) {
            this.props.onObjectChange(instances[0]);
        }
    }

    /**
     * stores the value of an option field: a number as number, an empty field removes the key
     *
     * @param option the option
     * @param raw text of the field
     */
    private setOption(option: PageItemTemplateOption, raw: string): void {
        const next = { ...this.props.readOptions };
        const number = option.type === 'number' ? parseFloat(raw) : NaN;
        if (option.type === 'number' && Number.isFinite(number)) {
            next[option.key] = number;
        } else if (option.type === 'text' && raw !== '') {
            next[option.key] = raw;
        } else {
            delete next[option.key];
        }
        this.props.onReadOptionsChange(Object.keys(next).length > 0 ? next : undefined);
    }

    /** the instances of the adapter as chips */
    private renderInstances(): React.JSX.Element | null {
        const { instances } = this.state;
        if (instances.length === 0) {
            return null;
        }
        return (
            <Box
                sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}
                data-ss="template-instances"
            >
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {this.props.getText('screensaver_item_instances')}
                </Typography>
                {instances.map(id => (
                    <Chip
                        key={id}
                        size="small"
                        label={id}
                        color={this.props.objectId.trim() === id ? 'primary' : 'default'}
                        variant={this.props.objectId.trim() === id ? 'filled' : 'outlined'}
                        onClick={() => this.props.onObjectChange(id)}
                    />
                ))}
            </Box>
        );
    }

    /**
     * the option fields of the template
     *
     * @param selected the chosen template
     */
    private renderOptions(selected: PageItemTemplateInfo): React.JSX.Element | null {
        if (selected.options.length === 0) {
            return null;
        }
        return (
            <Box
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}
                data-ss="template-options"
            >
                {selected.options.map(option => (
                    <TextField
                        key={option.key}
                        variant="standard"
                        type={option.type}
                        autoComplete="off"
                        label={this.props.getText(option.label)}
                        value={this.props.readOptions?.[option.key] ?? ''}
                        onChange={e => this.setOption(option, e.target.value)}
                        slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: option.type === 'number' ? { step: 'any' } : undefined,
                        }}
                        sx={{ minWidth: 200 }}
                    />
                ))}
            </Box>
        );
    }

    /**
     * object field of a template that searches states, with the suggestions and the hints about the object
     *
     * @param selected the chosen template
     */
    private renderObjectField(selected: PageItemTemplateInfo): React.JSX.Element {
        const { getText, objectId } = this.props;
        const { objType, objKind, objName, instances } = this.state;
        return (
            <>
                <Box sx={{ mb: 2 }}>
                    <EntitySelector
                        label={getText('screensaver_item_dpInit_channel')}
                        value={objectId}
                        onChange={this.props.onObjectChange}
                        socket={this.props.socket}
                        theme={this.props.theme}
                        themeType={this.props.themeType}
                        dialogName={this.props.dialogName ?? 'selectPageItemTemplate_dpInit'}
                        filterFunc={templateObjectFilter(selected)}
                        types={TEMPLATE_OBJECT_TYPES}
                    />
                </Box>
                {this.renderInstances()}
                {TEMPLATE_ADAPTER_FILTER && selected.adapter && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                    >
                        {getText('screensaver_item_adapterOnly').replace('%s', selected.adapter)}
                    </Typography>
                )}
                {selected.looksFor.length > 0 && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                        data-ss="template-looksfor"
                    >
                        {getText('screensaver_item_looksFor').replace('%s', selected.looksFor.join(', '))}
                    </Typography>
                )}
                {/* an instance usually has no object of its own (bydhvs.0) and is still the right choice */}
                {objType === null && !instances.includes(objectId.trim()) && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                    >
                        {getText('screensaver_item_stateMissing').replace('%s', objectId)}
                    </Alert>
                )}
                {objKind === 'state' && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                        data-ss="template-isstate"
                    >
                        {getText('screensaver_item_dpInitIsState')}
                    </Alert>
                )}
                {typeof objType === 'string' && objKind !== 'state' && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                    >
                        {getText('screensaver_item_dpInitInfo').replace('%s', objName || '-')}
                    </Typography>
                )}
            </>
        );
    }

    render(): React.JSX.Element {
        const { templates, getText } = this.props;
        const selected = this.selected();
        const list = buildTemplateList({
            templates,
            area: this.props.area,
            selected,
            readOptions: this.props.readOptions,
            trashPages: this.props.trashPages,
            getText,
        });
        const helpText = templateEntryHelpText(
            list.selected,
            selected && (selected.type || selected.role || selected.adapter)
                ? getText('screensaver_item_templateInfo')
                      .replace('%s', selected.type || '-')
                      .replace('%s', selected.role || '-')
                      .replace('%s', selected.adapter || '-')
                : '',
        );
        return (
            <Box sx={{ mb: 2 }}>
                {templates === undefined && (
                    <Alert
                        severity="info"
                        sx={{ mb: 2 }}
                    >
                        {getText('screensaver_item_templatesPending')}
                    </Alert>
                )}
                <Autocomplete
                    options={list.entries}
                    value={list.selected}
                    groupBy={o => o.template.name.split('.')[0]}
                    getOptionLabel={o => o.label}
                    getOptionKey={o => o.key}
                    isOptionEqualToValue={(a, b) => a.key === b.key}
                    filterOptions={filterTemplateEntries}
                    renderOption={({ key, ...optionProps }, option) => (
                        <li
                            key={key}
                            {...optionProps}
                            title={option.technicalName}
                        >
                            {option.label}
                        </li>
                    )}
                    onChange={(_e, v) => this.props.onTemplateChange(v?.template.name, v?.readOptions)}
                    renderInput={params => (
                        <TextField
                            {...params}
                            variant="standard"
                            label={getText('screensaver_item_template')}
                        />
                    )}
                    sx={{ mb: 2, maxWidth: 480 }}
                    data-ss="template"
                />
                {helpText && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                        data-ss="template-info"
                    >
                        {helpText}
                    </Typography>
                )}
                {!selected && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                    >
                        {getText('screensaver_item_pickTemplate')}
                    </Typography>
                )}
                {selected && selected.need === 'none' && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 2 }}
                        data-ss="template-noobject"
                    >
                        {getText('screensaver_item_dpInit_none')}
                    </Typography>
                )}
                {selected && selected.need === 'channel' && this.renderObjectField(selected)}
                {selected && this.renderOptions(selected)}
            </Box>
        );
    }
}
