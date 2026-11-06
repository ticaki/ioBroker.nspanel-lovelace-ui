/**
 * Default weather items of the screensaver (ConfigManager.getScreensaverConfig): the item for sunrise and sunset
 * of Bright Sky needs today (daily.00) and tomorrow (daily.01). After the sunset of today only the sunrise of
 * tomorrow is left to show, without it the value stays empty until midnight.
 */
import { expect } from 'chai';
import { StatesControler } from '../controller/states-controller';
import { ConfigManager } from './config-manager';
import { textTemplates } from '../templates/text';
import { getRegExp } from '../const/tools';

type ObjectDB = Record<string, ioBroker.Object>;

function state(id: string, role: string): ioBroker.Object {
    return {
        _id: id,
        type: 'state',
        common: { name: id, read: true, write: false, type: 'number', role },
        native: {},
    };
}

function database(): ObjectDB {
    const objects: ObjectDB = {};
    for (const day of [0, 1, 2]) {
        const prefix = `brightsky.0.daily.0${day}`;
        objects[`${prefix}.sunrise`] = state(`${prefix}.sunrise`, `date.sunrise.forecast.${day}`);
        objects[`${prefix}.sunset`] = state(`${prefix}.sunset`, `date.sunset.forecast.${day}`);
    }
    return objects;
}

function fakeAdapter(): any {
    const noop = (): void => undefined;
    const objects = database();
    return {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'de',
        unload: false,
        library: { getLocalLanguage: (): string => 'de' },
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        config: { panels: [], testCase: false, weatherEntity: 'brightsky.0' },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            objects[id] ? structuredClone(objects[id]) : null,
        getForeignObjectsAsync: async (): Promise<ObjectDB> => structuredClone(objects),
        getEnumsAsync: async (): Promise<Record<string, never>> => ({}),
        getForeignStateAsync: async (): Promise<null> => null,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
    };
}

describe('lib/classes/config-manager - default weather items of the screensaver', () => {
    it('Bright Sky sunrise and sunset finds the sunrise of tomorrow for the time after the sunset', async () => {
        StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
        StatesControler.tempObjectDBTimeout = undefined;
        const adapter = fakeAdapter();
        const manager = new ConfigManager(adapter, true);

        const { configArray } = await manager.getScreensaverConfig({
            weatherEntity: 'brightsky.0',
            weatherAddDefaultItems: { sunriseSet: true },
        } as unknown as ScriptConfig.Config);

        const items: any[] = (configArray as any).pageItems;
        const item = items.find(x => x.template === 'text.brightsky.sunriseset');
        expect(item, 'sunrise and sunset item').to.not.equal(undefined);

        const dpInit = getRegExp(item.dpInit, { startsWith: true });
        expect(dpInit).to.be.instanceOf(RegExp);

        const controller = new StatesControler(adapter);
        const data = await controller.getDataItemsFromAuto(
            dpInit as RegExp,
            structuredClone((textTemplates['text.brightsky.sunriseset'] as any).data),
        );

        expect(data.entity1.value.dp).to.equal('brightsky.0.daily.00.sunrise');
        expect(data.entity2.value.dp).to.equal('brightsky.0.daily.00.sunset');
        expect(data.entity3?.value?.dp).to.equal('brightsky.0.daily.01.sunrise');
    });
});
