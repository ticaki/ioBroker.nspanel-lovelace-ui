/**
 * Automatic headline of the media page (cardMedia), used while the admin field "headline" is empty.
 */
import type { MediaHeadlineMode } from '../types/adminShareConfig';

/**
 * Display name of the media service of a player id.
 *
 * @param ident Player id, e.g. `alexa2.0.Echo-Devices.XYZ`.
 * @returns Service name (Alexa, Spotify, ...), the adapter name for unknown adapters, '' without id.
 */
export function mediaServiceLabel(ident: string): string {
    if (!ident) {
        return '';
    }
    const first = ident.split('.')[0];
    switch (first) {
        case 'alexa2':
            return 'Alexa';
        case 'spotify-premium':
            return 'Spotify';
        case 'mpd':
            return 'MPD';
        case 'sonos':
            return 'Sonos';
        case 'squeezeboxrpc':
            return 'Squeezebox';
        default:
            return first;
    }
}

/** Input of {@link mediaHeadline} */
export type MediaHeadlineInput = {
    /** missing = `title` */
    mode?: MediaHeadlineMode;
    /** current song title, '' = none */
    title: string;
    /** id of the active player */
    ident: string;
    /** name of the device the user switched to (speaker list), '' = start device or Sonos/Squeezebox group */
    playerName: string;
    /** name of the configured start device */
    originalName: string;
    /** name of the active device (start device, chosen device or group coordinator), '' = unknown */
    deviceName: string;
};

/**
 * Automatic headline of the media page.
 *
 * @param input Current state of the page.
 * @returns The headline.
 */
export function mediaHeadline(input: MediaHeadlineInput): string {
    const { title, ident, playerName, originalName } = input;
    if (input.mode === 'device') {
        return playerName || input.deviceName || mediaServiceLabel(ident);
    }
    let suffix = title;
    if (!suffix && ident) {
        suffix = mediaServiceLabel(ident);
        if (!playerName && originalName) {
            suffix += `: ${originalName}`;
        }
    }
    return playerName ? `${playerName}: ${suffix}` : suffix;
}
