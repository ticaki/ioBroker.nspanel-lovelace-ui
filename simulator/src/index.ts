import { loadConfig } from './config.js';
import { createLogger } from './log.js';
import { Simulator } from './sim/Simulator.js';

async function main(): Promise<void> {
    const cfg = await loadConfig(process.argv);
    const log = createLogger(cfg.logLevel);
    log.info({ cfg: { ...cfg, mac: cfg.mac } }, 'Starting NSPanel simulator');

    const sim = new Simulator(cfg, log);
    await sim.start();

    const shutdown = async (signal: string): Promise<void> => {
        log.info({ signal }, 'Shutting down');
        await sim.stop();
        process.exit(0);
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
