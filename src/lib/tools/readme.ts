import * as fs from 'fs';
import { requiredScriptDataPoints, requiredFeatureDatapoints } from '../const/config-manager-const';

export async function generateAliasDocumentation(): Promise<void> {
    const checkPath = '.dev-data';
    let header = `| Channel role | State ID | common.type | common.role | required | common.write | description |  \n`;
    header += `| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  \n`;

    if (fs.existsSync(checkPath)) {
        let lastFolder = '';
        let table = '# Table of contents\n';
        let readme = '';
        for (const folder in requiredScriptDataPoints) {
            const data = requiredScriptDataPoints[folder];
            readme += `### ${folder}\n`;
            readme += header;
            table += `* [${folder}](#${folder})\n`;

            for (const key in data.data) {
                const row = data.data[key];
                readme += `| **${folder == lastFolder ? '"' : folder}** | ${key} | ${row.type}| ${row.role}  | ${row.required ? 'X' : ''} | ${row.writeable ? 'X' : ''} | ${row.description ? row.description : ''} | \n`;
                lastFolder = folder;
            }
        }
        let first = true;
        for (const folder in requiredFeatureDatapoints) {
            const data = requiredFeatureDatapoints[folder];
            const data2 = requiredScriptDataPoints[folder];
            let next = true;
            for (const key in data.data) {
                if (
                    !data2.data[key] ||
                    data2.data[key].type != data.data[key].type ||
                    data2.data[key].role != data.data[key].role ||
                    !!data2.data[key].required != !!data.data[key].required ||
                    !!data2.data[key].writeable != !!data.data[key].writeable
                ) {
                    next = false;
                    break;
                }
            }
            if (next) {
                continue;
            }
            if (first) {
                table += `## Feature\n`;
                readme += `# Feature datapoints\n`;
            }
            first = false;
            readme += `### Feature: ${folder}\n`;
            readme += header;

            table += `* [${folder}](#feature-${folder})\n`;

            for (const key in data.data) {
                const row = data.data[key];
                readme += `| **${folder == lastFolder ? '"' : folder}** | ${key} | ${row.type}| ${row.role}  | ${row.required ? 'X' : ''} | ${row.writeable ? 'X' : ''} | ${row.description ? row.description : ''} | \n`;
                lastFolder = folder;
            }
        }
        fs.writeFileSync('ALIAS.md', table + readme);
    }
}

/*import ChannelDetector, { PatternControl, type DetectOptions, type Types } from '@iobroker/type-detector';
import {NspanelLovelaceUi} from '../types/NspanelLovelaceUi';

export async function testTypeDetector(adapter: NspanelLovelaceUi): Promise<void> {
    const detector: ChannelDetector = new ChannelDetector();

    //const keys = Object.keys(objects); // For optimization
    const usedIds: string[] = []; // To not allow using of same ID in more than one device
    const ignoreIndicators: string[] = ['UNREACH_STICKY']; // Ignore indicators by name
    //const allowedTypes: Types[] = ['button', 'rgb', 'dimmer', 'light']; // Supported types. Leave it null if you want to get ALL devices.

    const options: DetectOptions = {
        objects: adapter.
        id: 'hm-rpc.0.LEQ1214232.1', // Channel, device or state, that must be detected
        _keysOptional: keys,
        _usedIdsOptional: usedIds,
        ignoreIndicators,
        // allowedTypes,
    };
    const test = adapter.getStatesOfAsync
    let controls: PatternControl[] | undefined | null = detector.detect(options);
    if (controls) {
        const cs = controls.map((control: PatternControl) => {
            const id = control.states.find((state: DetectorState) => state.id).id;
            if (id) {
                console.log(`In ${options.id} was detected "${control.type}" with following states:`);
                control.states
                    .filter((state: DetectorState) => state.id)
                    .forEach((state: DetectorState) => {
                        console.log(`    ${state.name} => ${state.id}`);
                    });

                return { control, id };
            }
        });
    } else {
        console.log(`Nothing found for ${options.id}`);
    }
}*/
