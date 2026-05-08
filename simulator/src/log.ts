import { pino, type Logger } from 'pino';

export type { Logger };

export function createLogger(level: string): Logger {
    const colorize = !!process.stdout.isTTY;
    return pino({
        level,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                ignore: 'pid,hostname',
                singleLine: true,
            },
        },
    });
}
