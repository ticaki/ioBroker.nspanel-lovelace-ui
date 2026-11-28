import type { ChannelValueConfig } from '../../src/lib/types/adminShareConfig';

/** The optional sections of the value dialog that decide which fields of a config are used */
export interface ValueConfigSections {
    /** false: no unit field - the adapter takes the unit of the state object (common.unit) */
    showUnit?: boolean;
    /** false: no date format section - no date format is applied */
    showDateFormat?: boolean;
}

/**
 * The part of a value config the dialog edits: a field of a hidden section is cleared, so it is
 * neither shown in the preview nor stored (e.g. the dynamic name, whose unit and date format the
 * adapter does not read).
 *
 * @param config the stored or edited config
 * @param sections the sections the dialog shows
 */
export function visibleValueConfig(
    config: Partial<ChannelValueConfig> | undefined,
    sections: ValueConfigSections,
): Partial<ChannelValueConfig> {
    const out: Partial<ChannelValueConfig> = { ...config };
    if (sections.showUnit === false) {
        out.unit = '';
    }
    if (sections.showDateFormat === false) {
        out.dateFormat = '';
    }
    return out;
}

/** The resolved parts of a value preview: prefix, value (with unit) and suffix */
export interface ValuePreviewParts {
    prefix: string;
    value: string;
    suffix: string;
}

/**
 * The dynamic name is in use: a value state id, a prefix or a suffix is set - prefix and suffix are always
 * appended by the adapter, the channel name is then no longer the default name.
 *
 * @param config the dynamic name config of the item
 */
export function hasDynamicName(config: Partial<ChannelValueConfig> | undefined): boolean {
    return !!(config && (config.valueStateId || config.prefix || config.suffix));
}

/**
 * The name the panel shows with a dynamic name, joined like the adapter (no automatic space): without a
 * fixed name prefix + value + suffix, with a fixed name prefix + name + suffix.
 *
 * @param name the content of the Name field
 * @param parts the resolved preview parts of the dynamic name
 */
export function dynamicNamePanelText(name: string, parts: ValuePreviewParts): string {
    return `${parts.prefix}${name === '' ? parts.value : name}${parts.suffix}`;
}
