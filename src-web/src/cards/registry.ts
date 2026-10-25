import type { AnyCardModule } from './CardContract';
import { pageStartupModule } from './pageStartup';
import { screensaverModule } from './screensaver';
import { cardEntitiesModule } from './cardEntities';
import { cardGridModule } from './cardGrid';
import { cardScheduleModule } from './cardSchedule';
import { cardMediaModule } from './cardMedia';
import { cardThermoModule } from './cardThermo';
import { cardThermo2Module } from './cardThermo2';
import { cardAlarmModule } from './cardAlarm';
import { cardUnlockModule } from './cardUnlock';
import { cardQRModule } from './cardQR';
import { cardPowerModule } from './cardPower';
import { cardChartModule } from './cardChart';
import { popupLightModule } from './popupLight';
import { popupShutterModule } from './popupShutter';
import { popupFanModule } from './popupFan';
import { popupSliderModule } from './popupSlider';
import { popupThermoModule } from './popupThermo';
import { popupInSelModule } from './popupInSel';
import { popupTimerModule } from './popupTimer';
import { popupNotifyModule } from './popupNotify';

/** every card module - a module is found by each of its pageTypes */
export const modules: readonly AnyCardModule[] = [
    pageStartupModule,
    screensaverModule,
    cardEntitiesModule,
    cardGridModule,
    cardScheduleModule,
    cardMediaModule,
    cardThermoModule,
    cardThermo2Module,
    cardAlarmModule,
    cardUnlockModule,
    cardQRModule,
    cardPowerModule,
    cardChartModule,
    popupLightModule,
    popupShutterModule,
    popupFanModule,
    popupSliderModule,
    popupThermoModule,
    popupInSelModule,
    popupTimerModule,
    popupNotifyModule,
];

function buildRegistry(): Readonly<Record<string, AnyCardModule>> {
    const result: Record<string, AnyCardModule> = {};
    for (const module of modules) {
        for (const pageType of module.pageTypes) {
            if (pageType in result) {
                throw new Error(`pageType ${pageType} registered twice`);
            }
            result[pageType] = module;
        }
    }
    return result;
}

/** pageType -> module */
export const registry: Readonly<Record<string, AnyCardModule>> = buildRegistry();
