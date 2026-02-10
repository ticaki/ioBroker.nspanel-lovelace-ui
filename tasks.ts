import * as fs from 'node:fs';
import * as path from 'node:path';

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
