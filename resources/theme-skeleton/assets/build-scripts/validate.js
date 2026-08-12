import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.resolve(scriptDirectory, '../..');
const checkBuiltAssets = process.argv.includes('--built');
const checkProductionAssets = process.argv.includes('--production');

function fail(message) {
    throw new Error(message);
}

function relative(filePath) {
    return path.relative(themeRoot, filePath).split(path.sep).join('/');
}

function readJson(relativePath) {
    const filePath = path.join(themeRoot, relativePath);

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        fail(`${relativePath} is not valid JSON: ${error.message}`);
    }
}

function walk(directory, extension) {
    if (!fs.existsSync(directory)) {
        return [];
    }

    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const filePath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return walk(filePath, extension);
            }

            return entry.isFile() && filePath.endsWith(extension) ? [filePath] : [];
        });
}

function validateJson() {
    const files = [
        'package.json',
        'theme.json',
        'porter/config/acf.json',
        'porter/config/blocks.json',
        'porter/config/porter.json',
        'porter/config/posttypes.json',
        'porter/config/taxonomies.json',
        'porter/inc/config.json',
        ...walk(path.join(themeRoot, 'porter/blocks'), 'block.json').map(relative),
    ];

    const parsed = Object.fromEntries(files.map((file) => [file, readJson(file)]));
    const packageJson = parsed['package.json'];

    if (packageJson.private !== true) {
        fail('package.json must remain private to prevent accidental publication');
    }

    for (const command of ['build', 'build:development', 'clean', 'watch', 'validate', 'test']) {
        if (typeof packageJson.scripts?.[command] !== 'string') {
            fail(`package.json is missing the ${command} script`);
        }
    }

    if (packageJson.engines?.node !== '^22.12.0 || ^24.0.0') {
        fail('package.json must target the supported Node.js 22 and 24 LTS lines');
    }

    const themeJson = parsed['theme.json'];

    if (themeJson.version !== 2) {
        fail('theme.json must use version 2 while the starter supports WordPress 6.4');
    }

    if (themeJson.$schema !== 'https://schemas.wp.org/wp/6.4/theme.json') {
        fail('theme.json must use the WordPress 6.4 schema');
    }

    const blockNames = new Set();
    const callbackNames = new Set();

    for (const file of files.filter((file) => file.endsWith('/block.json'))) {
        const metadata = parsed[file];

        if (metadata.apiVersion !== 3 || metadata.acf?.blockVersion !== 3) {
            fail(`${file} must use WordPress block API 3 and ACF Blocks v3`);
        }

        if (typeof metadata.name !== 'string' || !/^acf\/[a-z][a-z0-9-]*$/.test(metadata.name)) {
            fail(`${file} has an invalid ACF block name`);
        }

        const blockNameKey = metadata.name.toLowerCase();

        if (blockNames.has(blockNameKey)) {
            fail(`${file} duplicates the block name ${metadata.name}`);
        }

        blockNames.add(blockNameKey);

        const callback = metadata.acf?.renderCallback;

        if (typeof callback !== 'string' || !/^[A-Za-z_\\][A-Za-z0-9_\\]*\\[A-Za-z_][A-Za-z0-9_]*$/.test(callback)) {
            fail(`${file} has an invalid ACF render callback`);
        }

        const callbackKey = callback.toLowerCase();

        if (callbackNames.has(callbackKey)) {
            fail(`${file} duplicates the case-insensitive render callback ${callback}`);
        }

        callbackNames.add(callbackKey);
    }
}

function validateThemeStructure() {
    const files = [
        'functions.php',
        'index.php',
        'style.css',
        'theme.json',
        'templates/index.html',
        'parts/header.html',
        'parts/footer.html',
    ];

    for (const file of files) {
        const filePath = path.join(themeRoot, file);

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile() || fs.statSync(filePath).size === 0) {
            fail(`Required theme file is missing or empty: ${file}`);
        }
    }

    for (const filePath of walk(path.join(themeRoot, 'templates'), '.html')) {
        const source = fs.readFileSync(filePath, 'utf8');

        if (/<!-- wp:template-part \{[^}]*"tagName":"(?:header|footer)"/.test(source)) {
            fail(`${relative(filePath)} must not wrap semantic header or footer parts in a second landmark`);
        }
    }

    for (const file of ['parts/header.html', 'parts/footer.html']) {
        const source = fs.readFileSync(path.join(themeRoot, file), 'utf8');

        if (/<!-- wp:group \{[^}]*"tagName":"(?:header|footer)"/.test(source)) {
            fail(`${file} must let the template-part block own its semantic landmark wrapper`);
        }
    }
}

function validateJavaScript() {
    const files = [
        path.join(themeRoot, 'gulpfile.js'),
        ...walk(path.join(themeRoot, 'assets/build-scripts'), '.js'),
        ...walk(path.join(themeRoot, 'assets/src/js'), '.js'),
        ...walk(path.join(themeRoot, 'porter/blocks'), '.js'),
    ];

    for (const file of [...new Set(files)].sort()) {
        const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });

        if (result.status !== 0) {
            fail(`${relative(file)} has invalid JavaScript:\n${result.stderr.trim()}`);
        }
    }
}

function validatePhp() {
    const version = spawnSync(
        'php',
        ['-r', 'exit(PHP_VERSION_ID >= 80200 ? 0 : 1);'],
        { encoding: 'utf8' },
    );

    if (version.error) {
        fail(`PHP 8.2 or newer is required for validation: ${version.error.message}`);
    }

    if (version.status !== 0) {
        fail('PHP 8.2 or newer is required for validation');
    }

    const files = [
        path.join(themeRoot, 'functions.php'),
        path.join(themeRoot, 'index.php'),
        ...walk(path.join(themeRoot, 'patterns'), '.php'),
        ...walk(path.join(themeRoot, 'porter'), '.php'),
    ];

    for (const file of [...new Set(files)].sort()) {
        if (!fs.existsSync(file)) {
            continue;
        }

        const result = spawnSync('php', ['-l', file], { encoding: 'utf8' });

        if (result.status !== 0) {
            fail(`${relative(file)} has invalid PHP:\n${result.stderr.trim() || result.stdout.trim()}`);
        }
    }
}

function validateShell() {
    const files = [path.join(themeRoot, 'porter/blocks/make.sh')];

    for (const file of files) {
        if (!fs.existsSync(file)) {
            continue;
        }

        const result = spawnSync('bash', ['-n', file], { encoding: 'utf8' });

        if (result.error) {
            fail(`Bash is required for validation: ${result.error.message}`);
        }

        if (result.status !== 0) {
            fail(`${relative(file)} has invalid shell syntax:\n${result.stderr.trim()}`);
        }

        if ((fs.statSync(file).mode & 0o111) === 0) {
            fail(`${relative(file)} must be executable`);
        }
    }
}

function expectedBuildFiles() {
    const outputs = [];
    const globalScss = path.join(themeRoot, 'assets/src/scss');

    for (const file of walk(globalScss, '.scss')) {
        if (!path.basename(file).startsWith('_')) {
            const relativeSource = path.relative(globalScss, file);
            const output = relativeSource.replace(/\.scss$/, '.min.css');
            outputs.push(path.join(themeRoot, 'assets/dist/css', output));
        }
    }

    for (const file of walk(path.join(themeRoot, 'assets/src/js'), '.js')) {
        outputs.push(path.join(themeRoot, 'assets/dist/js', path.relative(path.join(themeRoot, 'assets/src/js'), file)));
    }

    const mappings = [
        ['porter/blocks', /([/\\])scss([/\\])/, '$1css$2'],
        ['porter/inc/block/variations', /([/\\])scss([/\\])/, '$1css$2'],
    ];

    for (const [directory, pattern, replacement] of mappings) {
        for (const file of walk(path.join(themeRoot, directory), '.scss')) {
            outputs.push(file.replace(pattern, replacement).replace(/\.scss$/, '.css'));
        }
    }

    const directMappings = [
        ['porter/inc/block/styles/scss', 'porter/inc/block/styles/css'],
        ['porter/inc/block/core/styles/scss', 'porter/inc/block/core/styles/css'],
    ];

    for (const [source, destination] of directMappings) {
        const sourceDirectory = path.join(themeRoot, source);

        for (const file of walk(sourceDirectory, '.scss')) {
            outputs.push(path.join(themeRoot, destination, path.relative(sourceDirectory, file)).replace(/\.scss$/, '.css'));
        }
    }

    return [...new Set(outputs)].sort();
}

function validateBuild() {
    const missing = expectedBuildFiles().filter((file) => !fs.existsSync(file));

    if (missing.length) {
        fail(`Build did not create:\n${missing.map((file) => `  ${relative(file)}`).join('\n')}`);
    }

    if (checkProductionAssets) {
        const directories = [
            'assets/dist',
            'porter/blocks',
            'porter/inc/block/styles/css',
            'porter/inc/block/core/styles/css',
            'porter/inc/block/variations',
        ];
        const maps = directories.flatMap((directory) => walk(path.join(themeRoot, directory), '.map'));

        if (maps.length) {
            fail(`Production build retained source maps:\n${maps.map((file) => `  ${relative(file)}`).join('\n')}`);
        }
    }
}

try {
    validateJson();
    validateThemeStructure();
    validateJavaScript();
    validatePhp();
    validateShell();

    if (checkBuiltAssets) {
        validateBuild();
    }

    console.log(`Validated PorterWP theme skeleton${checkBuiltAssets ? ' and build output' : ''}.`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
