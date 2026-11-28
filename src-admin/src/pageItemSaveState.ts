import type { DeviceShortPress } from '../../src/lib/types/deviceDetails';

/** The fields of the page item dialog (ChannelConfigDialog) the save button depends on. */
export interface PageItemSaveFields {
    /** raw data are edited - they are saved as they are, no check applies */
    rawMode: boolean;
    /** device with details: the device and its short tap, null = standard item */
    device: { deviceId: string; shortPress: DeviceShortPress } | null;
    /** the adapter refused the device (isBlockingDeviceError) */
    deviceErrorBlocks: boolean;
    /** kind "Alexa timer": the Echo device is complete (isAlexaTimerComplete), null = another kind */
    alexaTimerComplete: boolean | null;
    isNavigation: boolean;
    isCustom: boolean;
    targetPage: string;
    /** the chosen channel / state, '' = none */
    channelId: string;
    channelExists: boolean | null;
    checkingChannel: boolean;
    checkingDatapoints: boolean;
    roleIsValid: boolean | null;
    hasProblems: boolean;
    datapointErrors: number;
    datapointDuplicates: number;
}

/** What the dialog shows for the save button. */
export interface PageItemSaveState {
    /** the save button is enabled */
    canSave: boolean;
    /** the standard fields have what they need (they are disabled otherwise) - independent of the raw mode */
    standardCanSave: boolean;
    /** the datapoints of the channel have problems (missing / duplicate datapoints) */
    datapointProblems: boolean;
    /** the role of the channel is unknown or the channel check failed - the button reads "Details" */
    roleProblem: boolean;
}

/**
 * The save state of the page item dialog.
 *
 * A device item is checked by its short tap: only `popup` has an alias channel, so only there the channel, role and
 * datapoint checks of the standard item apply. `none` needs nothing but the device, `navigation` the target page and
 * `state` the chosen state of the device. An Alexa timer item has no channel, none of its checks apply - it needs the
 * Echo device only.
 *
 * @param f the fields of the dialog
 * @returns whether the item can be saved and which problems the button shows
 */
export function pageItemSaveState(f: PageItemSaveFields): PageItemSaveState {
    const channelIdValid = f.channelId !== '';
    const shortPress = f.device?.shortPress;
    const alexaMode = !f.rawMode && f.alexaTimerComplete !== null;
    // the checks of a channel: standard items and the popup of a device item
    const channelChecks = !f.rawMode && !alexaMode && (f.device === null || shortPress === 'popup');
    const datapointProblems =
        channelChecks && !f.checkingDatapoints && (f.datapointErrors > 0 || f.datapointDuplicates > 0 || f.hasProblems);
    const roleProblem =
        channelChecks && !(f.isNavigation && !channelIdValid) && ((!f.roleIsValid && !f.isCustom) || f.hasProblems);
    const channelReady = channelIdValid && f.channelExists === true && !f.checkingChannel;

    let standardCanSave: boolean;
    if (f.device !== null) {
        const deviceOk = f.device.deviceId.trim() !== '' && !f.deviceErrorBlocks;
        standardCanSave =
            deviceOk &&
            (shortPress === 'none' ||
                shortPress === 'devicePage' ||
                (shortPress === 'navigation' && f.targetPage !== '') ||
                (shortPress === 'state' && channelIdValid) ||
                (shortPress === 'popup' && channelReady));
    } else {
        standardCanSave = f.isNavigation ? f.targetPage !== '' : channelReady;
    }
    return {
        canSave: f.rawMode || (alexaMode ? f.alexaTimerComplete === true : standardCanSave),
        standardCanSave,
        datapointProblems,
        roleProblem,
    };
}
