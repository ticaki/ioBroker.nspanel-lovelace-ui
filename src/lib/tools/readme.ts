import * as fs from 'fs';
import { requiredScriptDataPoints } from '../const/config-manager-const';

import { promises as fsp } from 'fs';
import * as path from 'path';

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const esc = (s: string | undefined): string => (s ?? '').replace(/\|/g, '\\|');

/**
 * Generates ALIAS.md with table of contents and channel/state documentation.
 */
export async function generateAliasDocumentation(): Promise<void> {
    const checkPath = '.dev-data';
    if (!fs.existsSync(checkPath)) {
        return;
    }

    const header =
        '| Channel role | State ID | common.type | common.role | required | common.write | description |\n' +
        '| :---: | :--- | :--- | :--- | :---: | :---: | :--- |\n';

    let toc = '# Table of contents\n';
    let body = '';

    toc += `* [Remarks](#${slug('Remarks')})\n`;

    const folders = Object.keys(requiredScriptDataPoints).sort();

    for (const folder of folders) {
        const data = requiredScriptDataPoints[folder as keyof typeof requiredScriptDataPoints];
        const sectionAnchor = slug(folder);

        toc += `* [${folder}](#${sectionAnchor})\n`;
        body += `\n### ${folder}\n${header}`;

        const keys = Object.keys(data.data).sort();
        let firstRow = true;

        for (const key of keys) {
            const row = data.data[key as keyof typeof data.data];
            if (!row) {
                continue;
            }

            const channelCol = firstRow ? `**${folder}**` : '"';
            firstRow = false;

            body += `| ${channelCol} | ${
                row.useKey ? esc(key) : `~~${esc(key)}~~`
            } | ${esc(getStringOrArray(row.type))} | ${esc(
                getStringOrArray(row.role),
            )} | ${row.required ? 'X' : ''} | ${row.writeable ? 'X' : ''} | ${esc(row.description)} |\n`;
        }
    }

    body =
        `\n## Remarks\n\n` +
        `- (not fully implemented) Crossed out DPs can be named arbitrarily. Use the struck key only for questions in issues or in the forum.\n` +
        `\n${body}`;

    const out = `${toc}\n${body}`;
    await fsp.writeFile(path.join(process.cwd(), 'ALIAS.md'), out, 'utf8');
}
/*export async function generateAliasDocumentation(): Promise<void> {
    const checkPath = '.dev-data';
    let header = `| Channel role | State ID | common.type | common.role | required | common.write | description |  \n`;
    header += `| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  \n`;

    if (fs.existsSync(checkPath)) {
        let lastFolder = '';
        let table = '# Table of contents\n';
        let readme = '';
        table += `* [Remarks](#feature-${'Remarks'.toLowerCase().replace(/[^a-z0-9]+/g, '')})\n`;
        for (const f in requiredScriptDataPoints) {
            const folder = f as keyof typeof requiredScriptDataPoints;
            const data = requiredScriptDataPoints[folder];
            readme += `### ${folder}\n`;
            readme += header;
            table += `* [${folder}](#${folder.toLowerCase().replace(/[^a-z0-9]+/g, '')})\n`;

            for (const k in data.data) {
                const key = k as keyof typeof data.data;
                const row = data.data[key];
                if (row === undefined) {
                    continue;
                }
                readme += `| **${folder == lastFolder ? '"' : folder}** | ${row.useKey ? key : `~~${key}~~`} | ${getStringOrArray(row.type)}| ${getStringOrArray(row.role)}  | ${row.required ? 'X' : ''} | ${row.writeable ? 'X' : ''} | ${row.description ? row.description : ''} | \n`;
                lastFolder = folder;
            }
        }
        table += `## Remarks\n`;
        table +=
            '\n -(not fully implemented) Crossed out DPs can be called whatever you want, only use the name if you have questions in issues or in the forum. \n';
        fs.writeFileSync('ALIAS.md', table + readme);
    }
}*/

export function getStringOrArray(item: string | string[]): string {
    if (Array.isArray(item)) {
        return item.join(', ') || '';
    }
    return item;
}
