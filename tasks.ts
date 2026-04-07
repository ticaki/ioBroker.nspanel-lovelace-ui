import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __scriptDir = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
// npx ts-node tasks.ts copy
const languages = ['de', 'en', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];

const targetSrcAdmin = '../admin/custom';
const buildSrcAdmin = './build';

async function main(): Promise<void> {
    switch (args[0]) {
        case 'admin:copy':
            {
                if (!fs.existsSync('../src-admin/src')) {
                    console.error('Wrong directory! Please run the script from the src-admin directory.');
                    process.exit(1);
                }
                removeDir(targetSrcAdmin);
                fs.mkdirSync(targetSrcAdmin, { recursive: true });
                copyDir(buildSrcAdmin, targetSrcAdmin);
                for (const lang of languages) {
                    const masterFile = `../admin/i18n/${lang}/translations.json`;
                    const srcFile = `../src-admin/src/i18n/${lang}.json`;
                    const destFile = `../admin/custom/i18n/${lang}.json`;
                    let master: Record<string, string> | undefined = undefined;
                    let src: Record<string, string> | undefined = undefined;
                    if (fs.existsSync(masterFile)) {
                        try {
                            master = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));
                        } catch {
                            console.error(`Error parsing ${masterFile}`);
                            continue;
                        }
                    } else {
                        console.warn(`Master translation file ${masterFile} does not exist.`);
                    }
                    if (fs.existsSync(srcFile)) {
                        try {
                            src = JSON.parse(fs.readFileSync(srcFile, 'utf-8'));
                        } catch {
                            console.error(`Error parsing ${srcFile}`);
                            continue;
                        }
                    } else {
                        console.warn(`Source translation file ${srcFile} does not exist.`);
                    }
                    const result: Record<string, string> = {
                        ...(src || {}),
                        ...(master || {}),
                    };
                    const sorted = Object.keys(result)
                        .sort()
                        .reduce((acc: Record<string, string>, key) => {
                            acc[key] = result[key];
                            return acc;
                        }, {});
                    fs.mkdirSync(path.dirname(destFile), { recursive: true });
                    fs.writeFileSync(destFile, JSON.stringify(sorted, null, 4), 'utf-8');
                    if (JSON.stringify(sorted) != JSON.stringify(master)) {
                        fs.writeFileSync(masterFile, JSON.stringify(sorted, null, 4), 'utf-8');
                    }
                }
                console.log('Translation files merged and copied.');
            }
            break;
        case 'sync:datapoints': {
            // Run from repo root: ts-node tasks.ts sync:datapoints
            const srcFile = path.resolve(__scriptDir, 'src/lib/const/config-manager-const.ts');
            const destFile = path.resolve(__scriptDir, 'src/lib/types/adminShareConfig.ts');

            if (!fs.existsSync(srcFile)) {
                console.error(`Source file not found: ${srcFile}`);
                process.exit(1);
            }
            if (!fs.existsSync(destFile)) {
                console.error(`Destination file not found: ${destFile}`);
                process.exit(1);
            }

            const srcContent = fs.readFileSync(srcFile, 'utf-8');

            /**
             * Extracts a `{ ... }` object literal from `text` starting the search from `searchFrom`.
             * Returns the matched braced text including surrounding braces, or null.
             *
             * @param text Full source text
             * @param searchFrom Index in text from which to search for the opening brace
             */
            function extractBracedBlock(text: string, searchFrom: number): string | null {
                const start = text.indexOf('{', searchFrom);
                if (start === -1) {
                    return null;
                }
                let depth = 0;
                for (let i = start; i < text.length; i++) {
                    if (text[i] === '{') {
                        depth++;
                    } else if (text[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            return text.slice(start, i + 1);
                        }
                    }
                }
                return null;
            }

            /**
             * Extracts the `{ ... }` value for a top-level key inside an object literal string.
             *
             * @param objectText The text of the outer object (including braces)
             * @param key The key whose value to extract
             */
            function extractValueForKey(objectText: string, key: string): string | null {
                const pattern = new RegExp(`(?:^|[,{\\s])${key}\\s*:`);
                const match = pattern.exec(objectText);
                if (!match) {
                    return null;
                }
                const colonIdx = objectText.indexOf(':', match.index + match[0].length - 1);
                return extractBracedBlock(objectText, colonIdx + 1);
            }

            // --- Extract templateDatapoint.UNREACH and .LOWBAT ---
            const templateMarker = 'const templateDatapoint:';
            const templateIdx = srcContent.indexOf(templateMarker);
            let unreachText = '';
            let lowbatText = '';
            if (templateIdx !== -1) {
                const templateBlock = extractBracedBlock(srcContent, templateIdx + templateMarker.length);
                if (templateBlock) {
                    unreachText = extractValueForKey(templateBlock, 'UNREACH') ?? '';
                    lowbatText = extractValueForKey(templateBlock, 'LOWBAT') ?? '';
                }
            }
            if (!unreachText || !lowbatText) {
                console.error('Could not extract templateDatapoint entries from source.');
                process.exit(1);
            }

            // --- Extract requiredScriptDataPoints initializer ---
            const rdpMarker = 'export const requiredScriptDataPoints';
            const rdpIdx = srcContent.indexOf(rdpMarker);
            if (rdpIdx === -1) {
                console.error('Could not find requiredScriptDataPoints in source.');
                process.exit(1);
            }
            const rdpBlock = extractBracedBlock(srcContent, rdpIdx + rdpMarker.length);
            if (!rdpBlock) {
                console.error('Could not extract requiredScriptDataPoints object.');
                process.exit(1);
            }

            // Inline templateDatapoint references
            const inlined = rdpBlock
                .replaceAll('templateDatapoint.UNREACH', unreachText)
                .replaceAll('templateDatapoint.LOWBAT', lowbatText);

            const exportStatement = `export const requiredScriptDataPoints = ${inlined} as const;`;
            const derivations =
                '\n\nexport const CHANNEL_ROLES_LIST = Object.keys(requiredScriptDataPoints) as (keyof typeof requiredScriptDataPoints)[];\nexport type ChannelRole = keyof typeof requiredScriptDataPoints;\n';
            const fullBlock = exportStatement + derivations;

            // --- Write/replace in adminShareConfig.ts ---
            let destContent = fs.readFileSync(destFile, 'utf-8');

            const exportMarker = 'export const requiredScriptDataPoints';
            const existingIdx = destContent.indexOf(exportMarker);
            if (existingIdx !== -1) {
                // Find the end of the existing declaration using brace counting,
                // then consume the trailing " as const;" or ";"
                const blockStart = destContent.indexOf('{', existingIdx);
                if (blockStart === -1) {
                    console.error('Could not locate existing block start in destination file.');
                    process.exit(1);
                }
                let depth = 0;
                let blockEnd = blockStart;
                for (let i = blockStart; i < destContent.length; i++) {
                    if (destContent[i] === '{') {
                        depth++;
                    } else if (destContent[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            blockEnd = i;
                            break;
                        }
                    }
                }
                // Consume optional " as const" and ";"
                let tail = blockEnd + 1;
                const rest = destContent.slice(tail).match(/^(\s*as\s+const)?\s*;/);
                if (rest) {
                    tail += rest[0].length;
                }

                // Also consume existing derivations if present
                const derivationsMarker = 'export const CHANNEL_ROLES_LIST = Object.keys(requiredScriptDataPoints)';
                const roleTypeMarker = 'export type ChannelRole = keyof typeof requiredScriptDataPoints;';
                const afterTail = destContent.slice(tail).trimStart();
                if (afterTail.startsWith(derivationsMarker)) {
                    const roleTypeIdx = destContent.indexOf(roleTypeMarker, tail);
                    if (roleTypeIdx !== -1) {
                        tail = roleTypeIdx + roleTypeMarker.length;
                        // consume trailing newline
                        if (destContent[tail] === '\n') {
                            tail++;
                        }
                    }
                }

                destContent = destContent.slice(0, existingIdx) + fullBlock + destContent.slice(tail);
                console.log('Updated existing requiredScriptDataPoints in adminShareConfig.ts');
            } else {
                destContent = `${destContent.trimEnd()}\n\n${fullBlock}`;
                console.log('Appended requiredScriptDataPoints to adminShareConfig.ts');
            }

            fs.writeFileSync(destFile, destContent, 'utf-8');
            // Auto-fix indentation/formatting via eslint (always run from repo root)
            execSync(`npx eslint --fix "${destFile}"`, { stdio: 'inherit', cwd: __scriptDir });
            break;
        }
        default:
            console.log(`Unknown task: ${args[0]}`);
    }
}

/**
 * Removes a directory recursively if it exists.
 *
 * @param dir Path to directory
 */
function removeDir(dir: string): void {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`Removed directory: ${dir}`);
    }
}

/**
 * Recursively copies a directory.
 *
 * @param source Source path
 * @param destination Destination path
 * @param logging Whether to log the operation
 */
function copyDir(source: string, destination: string, logging: boolean = true): void {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    for (const item of fs.readdirSync(source)) {
        const srcPath = path.join(source, item);
        const destPath = path.join(destination, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            copyDir(srcPath, destPath, false);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
    if (logging) {
        console.log(`Copied directory from ${source} to ${destination}`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
