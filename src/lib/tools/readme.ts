import * as fs from 'fs';
import { requiredOutdatedDataPoints } from '../const/config-manager-const';

export async function generateAliasDocumentation(): Promise<void> {
    const checkPath = '.dev-data';
    let readme = `| Channel role | State ID | common.type | common.role | required | common.write | description |  \n`;
    readme += `| :--- | :--- | :--- | :--- | --- | --- | :--- |  \n`;
    let test = fs.readdirSync('./');
    if (test) {
        test = [''];
    }
    if (fs.existsSync(checkPath)) {
        let lastFolder = '';
        for (const folder in requiredOutdatedDataPoints) {
            const data = requiredOutdatedDataPoints[folder];
            for (const key in data) {
                const row = data[key];
                readme += `| ${folder == lastFolder ? '' : folder} | ${key} | ${row.type}| ${row.role}  | ${row.required ? 'X' : ''} | ${row.writeable ? 'X' : ''} | ${row.description ? row.description : ''} | \n`;
                lastFolder = folder;
            }
        }
        fs.writeFileSync('ALIAS.md', readme);
    }
}
