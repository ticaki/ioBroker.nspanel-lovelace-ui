export interface ParsedBacklogEntry {
    cmd: string;
    args: string;
    raw: string;
}

export function splitBacklog(input: string): ParsedBacklogEntry[] {
    return input
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(parseSingleCommand);
}

export function parseSingleCommand(raw: string): ParsedBacklogEntry {
    const trimmed = raw.trim();
    const space = trimmed.indexOf(' ');
    if (space === -1) {
        return { cmd: trimmed, args: '', raw: trimmed };
    }
    return {
        cmd: trimmed.slice(0, space),
        args: trimmed.slice(space + 1).trim(),
        raw: trimmed,
    };
}

export function isFlashNextionCmd(cmd: string): boolean {
    return /^FlashNextion/i.test(cmd);
}
