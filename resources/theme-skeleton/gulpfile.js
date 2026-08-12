import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import gulp from 'gulp';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import gulpSass from 'gulp-sass';
import terser from 'gulp-terser';
import * as dartSass from 'sass';
import { generateColorScss } from './assets/build-scripts/extract-colors.js';

const sass = gulpSass(dartSass);
const themeRoot = path.dirname(fileURLToPath(import.meta.url));
const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

const paths = {
    globalScss: 'assets/src/scss',
    globalJs: 'assets/src/js',
    blockRoot: 'porter/blocks',
    blockStyles: 'porter/inc/block/styles',
    coreBlockStyles: 'porter/inc/block/core/styles',
    blockVariations: 'porter/inc/block/variations',
};

function fromTheme(...segments) {
    return path.join(themeRoot, ...segments);
}

function sourceOptions(base) {
    return {
        allowEmpty: true,
        base: fromTheme(base),
        cwd: themeRoot,
        sourcemaps: !production,
    };
}

function destinationOptions() {
    return production ? {} : { sourcemaps: '.' };
}

function compileCss(stream) {
    return stream
        .pipe(sass.sync({ style: 'compressed' }).on('error', sass.logError))
        .pipe(postcss([
            autoprefixer(),
            cssnano({ preset: ['default', { discardComments: { removeAll: true } }] }),
        ]));
}

function renameScssDirectory(file) {
    file.dirname = file.dirname
        .split(path.sep)
        .map((segment) => (segment === 'scss' ? 'css' : segment))
        .join(path.sep);
    file.extname = '.css';
}

function readJson(relativePath) {
    const filePath = fromTheme(relativePath);

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`Could not read valid JSON from ${relativePath}: ${error.message}`);
    }
}

function styleSlug(title) {
    const slug = title
        .toLowerCase()
        .replaceAll(' ', '-')
        .replace(/[\\/:*?"<>|]/g, '');

    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
        throw new Error(`Invalid block style title: ${title}`);
    }

    return slug;
}

function removeMatchingFiles(directory, predicate) {
    if (!fs.existsSync(directory)) {
        return;
    }

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filePath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            removeMatchingFiles(filePath, predicate);
        } else if (entry.isFile() && predicate(filePath)) {
            fs.rmSync(filePath);
        }
    }
}

function findFiles(directory, extension) {
    if (!fs.existsSync(directory)) {
        return [];
    }

    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const filePath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return findFiles(filePath, extension);
            }

            return entry.isFile() && filePath.endsWith(extension) ? [filePath] : [];
        });
}

function removeGeneratedAssets() {
    fs.rmSync(fromTheme('assets/dist'), { force: true, recursive: true });

    const mappedFiles = [
        ...findFiles(fromTheme(paths.blockRoot), '.scss').map((filePath) => (
            filePath.replace(`${path.sep}scss${path.sep}`, `${path.sep}css${path.sep}`).replace(/\.scss$/, '.css')
        )),
        ...findFiles(fromTheme(paths.blockVariations), '.scss').map((filePath) => (
            filePath.replace(`${path.sep}scss${path.sep}`, `${path.sep}css${path.sep}`).replace(/\.scss$/, '.css')
        )),
        ...findFiles(fromTheme(paths.blockStyles, 'scss'), '.scss').map((filePath) => (
            path.join(fromTheme(paths.blockStyles, 'css'), path.basename(filePath, '.scss') + '.css')
        )),
        ...findFiles(fromTheme(paths.coreBlockStyles, 'scss'), '.scss').map((filePath) => (
            path.join(fromTheme(paths.coreBlockStyles, 'css'), path.basename(filePath, '.scss') + '.css')
        )),
    ];

    for (const filePath of mappedFiles) {
        fs.rmSync(filePath, { force: true });
        fs.rmSync(`${filePath}.map`, { force: true });
    }
}

export async function extractColors() {
    generateColorScss();
}

export function compileSass() {
    if (!fs.existsSync(fromTheme(paths.globalScss))) {
        return Promise.resolve();
    }

    const source = gulp.src(
        [
            `${paths.globalScss}/**/*.scss`,
            `!${paths.globalScss}/**/_*.scss`,
        ],
        sourceOptions(paths.globalScss),
    );

    return compileCss(source)
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(fromTheme('assets/dist/css'), destinationOptions()));
}

export function compileBlocks() {
    if (!fs.existsSync(fromTheme(paths.blockRoot))) {
        return Promise.resolve();
    }

    const source = gulp.src(
        `${paths.blockRoot}/**/scss/*.scss`,
        sourceOptions(paths.blockRoot),
    );

    return compileCss(source)
        .pipe(rename(renameScssDirectory))
        .pipe(gulp.dest(fromTheme(paths.blockRoot), destinationOptions()));
}

export function compileBlockStyles() {
    const sourceDir = `${paths.blockStyles}/scss`;

    if (!fs.existsSync(fromTheme(sourceDir))) {
        return Promise.resolve();
    }

    const source = gulp.src(`${sourceDir}/*.scss`, sourceOptions(sourceDir));

    return compileCss(source)
        .pipe(gulp.dest(fromTheme(paths.blockStyles, 'css'), destinationOptions()));
}

export function compileCoreBlockStyles() {
    const sourceDir = `${paths.coreBlockStyles}/scss`;

    if (!fs.existsSync(fromTheme(sourceDir))) {
        return Promise.resolve();
    }

    const source = gulp.src(`${sourceDir}/*.scss`, sourceOptions(sourceDir));

    return compileCss(source)
        .pipe(gulp.dest(fromTheme(paths.coreBlockStyles, 'css'), destinationOptions()));
}

export function compileVariationStyles() {
    if (!fs.existsSync(fromTheme(paths.blockVariations))) {
        return Promise.resolve();
    }

    const source = gulp.src(
        `${paths.blockVariations}/**/scss/*.scss`,
        sourceOptions(paths.blockVariations),
    );

    return compileCss(source)
        .pipe(rename(renameScssDirectory))
        .pipe(gulp.dest(fromTheme(paths.blockVariations), destinationOptions()));
}

export function compileJs() {
    if (!fs.existsSync(fromTheme(paths.globalJs))) {
        return Promise.resolve();
    }

    return gulp.src(`${paths.globalJs}/**/*.js`, sourceOptions(paths.globalJs))
        .pipe(terser({ format: { comments: /^!/ } }))
        .pipe(gulp.dest(fromTheme('assets/dist/js'), destinationOptions()));
}

export async function generateScssFromJson() {
    const config = readJson('porter/config/blocks.json');
    const styles = config?.blocks?.styles ?? {};

    if (!styles || typeof styles !== 'object' || Array.isArray(styles)) {
        throw new Error('blocks.styles must be an object in porter/config/blocks.json');
    }

    const destination = fromTheme(paths.blockStyles, 'scss');
    fs.mkdirSync(destination, { recursive: true });

    for (const [blockName, blockStyles] of Object.entries(styles)) {
        if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(blockName)) {
            throw new Error(`Invalid block name in blocks.styles: ${blockName}`);
        }

        if (!blockStyles || typeof blockStyles !== 'object' || Array.isArray(blockStyles)) {
            throw new Error(`Block styles for ${blockName} must be an object`);
        }

        const [namespace, name] = blockName.split('/');
        const selector = namespace === 'core'
            ? `.wp-block-${name}`
            : `.wp-block-${namespace}-${name}`;

        for (const [title, argumentsForStyle] of Object.entries(blockStyles)) {
            if (
                argumentsForStyle
                && typeof argumentsForStyle === 'object'
                && !Array.isArray(argumentsForStyle)
                && Object.hasOwn(argumentsForStyle, 'inline_style')
            ) {
                continue;
            }

            const nameSlug = styleSlug(title);
            const blockSlug = blockName.replace('/', '_');
            const filePath = path.join(destination, `${blockSlug}--${nameSlug}.scss`);

            if (!fs.existsSync(filePath)) {
                const scss = [
                    "@use '../../../../../assets/src/scss/variables' as *;",
                    '',
                    `${selector}.is-style-${nameSlug} {`,
                    '    // Add project styles here.',
                    '}',
                    '',
                ].join('\n');

                fs.writeFileSync(filePath, scss, { encoding: 'utf8', flag: 'wx' });
            }
        }
    }
}

export async function createPostTypes() {
    const config = readJson('porter/config/posttypes.json');
    const postTypes = config?.posttypes ?? {};

    if (!postTypes || typeof postTypes !== 'object' || Array.isArray(postTypes)) {
        throw new Error('posttypes must be an object in porter/config/posttypes.json');
    }

    const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
        '    <path fill="currentColor" d="M5 3h10l4 4v14H5V3zm2 2v14h10V8h-3V5H7zm2 6h6v2H9v-2zm0 4h6v2H9v-2z"/>',
        '</svg>',
        '',
    ].join('\n');

    for (const postType of Object.keys(postTypes)) {
        if (!/^[a-z0-9_-]{1,20}$/.test(postType)) {
            throw new Error(`Invalid post type key: ${postType}`);
        }

        const directory = fromTheme('porter/inc/posttypes', postType);
        const iconPath = path.join(directory, 'icon.svg');

        fs.mkdirSync(directory, { recursive: true });

        if (!fs.existsSync(iconPath)) {
            fs.writeFileSync(iconPath, svg, { encoding: 'utf8', flag: 'wx' });
        }
    }
}

export async function cleanProductionArtifacts() {
    if (!production) {
        return;
    }

    const generatedDirectories = [
        fromTheme('assets/dist'),
        fromTheme(paths.blockRoot),
        fromTheme(paths.blockStyles, 'css'),
        fromTheme(paths.coreBlockStyles, 'css'),
        fromTheme(paths.blockVariations),
    ];

    for (const directory of generatedDirectories) {
        removeMatchingFiles(directory, (filePath) => filePath.endsWith('.map'));
    }

    removeMatchingFiles(
        fromTheme('assets/dist/css'),
        (filePath) => /^_.*\.min\.css$/.test(path.basename(filePath)),
    );
}

export async function clean() {
    removeGeneratedAssets();
}

const compileAllSass = gulp.parallel(
    compileSass,
    compileBlocks,
    compileBlockStyles,
    compileCoreBlockStyles,
    compileVariationStyles,
);

export function watchTasks() {
    const watchers = [
        gulp.watch('theme.json', { cwd: themeRoot }, gulp.series(extractColors, compileAllSass)),
        gulp.watch(
            [`${paths.globalScss}/**/*.scss`, `!${paths.globalScss}/**/_*.scss`],
            { cwd: themeRoot },
            compileSass,
        ),
        gulp.watch(`${paths.globalScss}/**/_*.scss`, { cwd: themeRoot }, compileAllSass),
        gulp.watch(`${paths.blockRoot}/**/scss/*.scss`, { cwd: themeRoot }, compileBlocks),
        gulp.watch(`${paths.blockStyles}/scss/**/*.scss`, { cwd: themeRoot }, compileBlockStyles),
        gulp.watch(`${paths.coreBlockStyles}/scss/**/*.scss`, { cwd: themeRoot }, compileCoreBlockStyles),
        gulp.watch(`${paths.blockVariations}/**/scss/*.scss`, { cwd: themeRoot }, compileVariationStyles),
        gulp.watch(`${paths.globalJs}/**/*.js`, { cwd: themeRoot }, compileJs),
        gulp.watch(
            'porter/config/blocks.json',
            { cwd: themeRoot },
            gulp.series(generateScssFromJson, compileBlockStyles),
        ),
        gulp.watch('porter/config/posttypes.json', { cwd: themeRoot }, createPostTypes),
    ];

    return watchers[0];
}

export const prepare = gulp.parallel(extractColors, generateScssFromJson, createPostTypes);
export const build = gulp.series(
    clean,
    prepare,
    gulp.parallel(compileAllSass, compileJs),
    cleanProductionArtifacts,
);
export const watch = gulp.series(build, watchTasks);
export default build;
