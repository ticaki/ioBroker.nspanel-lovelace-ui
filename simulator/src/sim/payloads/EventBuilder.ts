export function buildStartupEvent(opts: { startupId: string; model: string; hmiVersion: string }): string {
    return JSON.stringify({
        CustomRecv: `event,startup,${opts.startupId},${opts.model},${opts.hmiVersion}`,
    });
}

export function buildCustomRecv(parts: string[]): string {
    return JSON.stringify({ CustomRecv: parts.join(',') });
}
