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
