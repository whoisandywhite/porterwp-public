import gulp from 'gulp';
import autoprefixer from 'gulp-autoprefixer';
import sass from 'gulp-dart-sass';
import rename from 'gulp-rename';
import uglifycss from 'gulp-uglifycss';
import terser from 'gulp-terser';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';

// Function to extract colors from scripts
function extractColors(done) {
    exec('node ./assets/build-scripts/extract-colors.js', (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return done(err);
        }
        console.log(stdout);
        console.error(stderr);
        done();
    });
}

// Function to compile SASS files into compressed CSS
function compileSass(done) {
    const srcDir = 'assets/src/scss';
    if (!fs.existsSync(srcDir)) {
        console.log(`Source directory "${srcDir}" does not exist. Skipping task.`);
        return done();
    }

    return gulp.src(`${srcDir}/**/*.scss`, { sourcemaps: true })
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(uglifycss({ 'maxLineLen': 80, 'uglyComments': true }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('assets/dist/css', { sourcemaps: '.' }))
        .on('end', done);
}

// Function to compile block-specific SASS files into CSS
function compileBlocks(done) {
    const srcDir = 'porter/blocks';
    if (!fs.existsSync(srcDir)) {
        console.log(`Source directory "${srcDir}" does not exist. Skipping task.`);
        return done();
    }

    return gulp.src(`${srcDir}/**/scss/*.scss`, { sourcemaps: true })
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(rename(function (file) {
            file.dirname = file.dirname.replace('scss', 'css');
            file.extname = '.css';
        }))
        .pipe(gulp.dest('porter/blocks/', { sourcemaps: '.' }))
        .on('end', done);
}

// Function to compile SCSS files for block styles into CSS
function compileBlockStyles(done) {
    const srcDir = 'porter/inc/block/styles/scss';
    if (!fs.existsSync(srcDir)) {
        console.log(`Source directory "${srcDir}" does not exist. Skipping task.`);
        return done();
    }

    return gulp.src(`${srcDir}/*.scss`, { sourcemaps: true })
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(uglifycss({ 'maxLineLen': 80, 'uglyComments': true }))
        .pipe(rename(function (path) {
            path.dirname = "css";
            path.extname = '.css';
        }))
        .pipe(gulp.dest('porter/inc/block/styles/', { sourcemaps: '.' }))
        .on('end', done);
}

// Function to compile SCSS files for core block styles into CSS
function compileCoreBlockStyles(done) {
    const srcDir = 'porter/inc/block/core/styles/scss';
    if (!fs.existsSync(srcDir)) {
        console.log(`Source directory "${srcDir}" does not exist. Skipping task.`);
        return done();
    }

    return gulp.src(`${srcDir}/*.scss`, { sourcemaps: true })
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(uglifycss({ 'maxLineLen': 80, 'uglyComments': true }))
        .pipe(rename(function (path) {
            path.dirname = "css";
            path.extname = '.css';
        }))
        .pipe(gulp.dest('porter/inc/block/core/styles/', { sourcemaps: '.' }))
        .on('end', done);
}

// Function to compile SCSS files for block variations into CSS
function compileVariationStyles(done) {
    const srcDir = 'porter/inc/block/variations';
    if (!fs.existsSync(srcDir)) {
        console.log(`Source directory "${srcDir}" does not exist. Skipping task.`);
        return done();
    }

    return gulp.src(`${srcDir}/**/scss/*.scss`, { sourcemaps: true })
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(rename(function (file) {
            file.dirname = file.dirname.replace('scss', 'css');
            file.extname = '.css';
        }))
        .pipe(gulp.dest(srcDir, { sourcemaps: '.' }))
        .on('end', done);
}

// Function to minify JavaScript files
function compileJS(done) {
    const srcDir = 'assets/src/js';
    if (!fs.existsSync(srcDir)) {
        console.log(`Source directory "${srcDir}" does not exist. Skipping task.`);
        return done();
    }

    return gulp.src(`${srcDir}/**/*.js`, { sourcemaps: true })
        .pipe(terser())
        .pipe(gulp.dest('assets/dist/js', { sourcemaps: '.' }))
        .on('end', done);
}

// Function to generate SCSS files from JSON configuration
function generateScssFromJson(done) {
    fs.readFile('porter/config/blocks.json', (err, data) => {
        if (err) throw err;
        const json = JSON.parse(data);

        for (let key in json.blocks.styles) {
            for (let styleName in json.blocks.styles[key]) {
                let keyParts = key.split('/'); // Split the key like "core/image"
                let blockType = _.kebabCase(keyParts[0]); // "core" or "acf"
                let blockName = _.kebabCase(keyParts[1]); // "image", "columns", etc.

                let fileName = `${blockType}_${blockName}--${_.kebabCase(styleName)}.scss`;
                let filePath = `porter/inc/block/styles/scss/${fileName}`;

                if (!fs.existsSync(filePath)) { // Check if file does not exist
                    let scss = '';
                    scss += `@import '../../../../../assets/src/scss/variables';\n\n`;

                    if (blockType === 'core') {
                        scss += `.wp-block-${blockName}.is-style-${_.kebabCase(styleName)} {\n`;
                    } else {
                        scss += `.wp-block-${blockType}-${blockName}.is-style-${_.kebabCase(styleName)} {\n`;
                    }
                    scss += `    // Add your CSS rules here\n`;
                    scss += `}\n`;

                    fs.writeFile(filePath, scss, function(err) {
                        if (err) throw err;
                    });
                }
            }
        }
        done();
    });
}

// Function to read posttypes.json and create directories and SVG files
function createPostTypes(done) {
    fs.readFile('porter/config/posttypes.json', (err, data) => {
        if (err) throw err;

        const json = JSON.parse(data);
        const postTypes = json.posttypes;

        for (let key in postTypes) {
            let dirPath = `porter/inc/posttypes/${key}`;
            let svgPath = path.join(dirPath, 'icon.svg');

            // Ensure directory exists or create it
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });

                // SVG content
                let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Pro 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path fill="#ffffff" d="M320 0c-17.7 0-32 14.3-32 32V51.2C215 66 160 130.6 160 208v25.4c0 45.4-15.5 89.5-43.8 124.9L101.3 377c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6H520c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C495.5 322.9 480 278.8 480 233.4V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm0 96c61.9 0 112 50.1 112 112v25.4c0 47.9 13.9 94.6 39.7 134.6H168.3c25.8-40 39.7-86.7 39.7-134.6V208c0-61.9 50.1-112 112-112zm64 352H320 256c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3zM0 200c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24s-10.7-24-24-24H24c-13.3 0-24 10.7-24 24zm536-24c-13.3 0-24 10.7-24 24s10.7 24 24 24h80c13.3 0 24-10.7 24-24s-10.7-24-24-24H536zM597.5 21.3c-5.9-11.9-20.3-16.7-32.2-10.7l-64 32c-11.9 5.9-16.7 20.3-10.7 32.2s20.3 16.7 32.2 10.7l64-32c11.9-5.9 16.7-20.3 10.7-32.2zM53.3 53.5l64 32c11.9 5.9 26.3 1.1 32.2-10.7s1.1-26.3-10.7-32.2l-64-32C62.9 4.6 48.5 9.4 42.5 21.3s-1.1 26.3 10.7 32.2z"/></svg>`;
                fs.writeFileSync(svgPath, svgContent);
            }
        }

        done();
    });
}

// Watch for changes in specified files and trigger respective tasks
function watchTasks() {
    gulp.watch('theme.json', gulp.series(extractColors, compileSass, compileBlocks, compileBlockStyles, compileCoreBlockStyles, compileVariationStyles));
    gulp.watch('assets/src/scss/**/*.scss', compileSass);
    gulp.watch('porter/blocks/**/scss/*.scss', compileBlocks);
    gulp.watch('porter/inc/block/styles/scss/**/*.scss', compileBlockStyles);
    gulp.watch('porter/inc/block/core/styles/scss/**/*.scss', compileCoreBlockStyles);
    gulp.watch('porter/inc/block/variations/**/scss/*.scss', compileVariationStyles);
    gulp.watch('assets/src/js/**/*.js', compileJS);
    gulp.watch('porter/config/blocks.json', generateScssFromJson);
    gulp.watch('porter/config/posttypes.json', createPostTypes);
}

// Define the build task
export const build = gulp.series(extractColors, gulp.parallel(compileSass, compileBlocks, compileBlockStyles, compileCoreBlockStyles, compileVariationStyles, compileJS));

// Define the watch task
export const watch = gulp.series(build, watchTasks);

// Set the default task to build
export default build;
