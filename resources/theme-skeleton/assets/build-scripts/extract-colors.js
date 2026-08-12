import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const themeRoot = path.resolve(scriptDirectory, '../..');

function readThemeJson() {
    const filePath = path.join(themeRoot, 'theme.json');

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`Could not read valid theme.json: ${error.message}`);
    }
}

export function renderColorScss(themeJson) {
    const palette = themeJson?.settings?.color?.palette ?? [];

    if (!Array.isArray(palette)) {
        throw new Error('settings.color.palette must be an array in theme.json');
    }

    const entries = palette.map((entry, index) => {
        if (!entry || typeof entry !== 'object') {
            throw new Error(`Palette entry ${index + 1} must be an object`);
        }

        const { slug, color } = entry;

        if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
            throw new Error(`Palette entry ${index + 1} has an invalid slug`);
        }

        if (typeof color !== 'string' || !color.trim() || /[;{}\r\n]/.test(color)) {
            throw new Error(`Palette entry ${index + 1} has an invalid color`);
        }

        return `    ${JSON.stringify(slug)}: ${color.trim()}`;
    });

    return [
        '$colors: (',
        entries.join(',\n'),
        ');',
        '',
    ].join('\n');
}

export function generateColorScss() {
    const destination = path.join(themeRoot, 'assets/src/scss/_colors.scss');
    const output = renderColorScss(readThemeJson());
    const current = fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8') : null;

    if (current !== output) {
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, output, 'utf8');
    }

    return destination;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
    try {
        generateColorScss();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
