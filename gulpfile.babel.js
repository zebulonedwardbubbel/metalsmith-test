import path from 'path';
import del from 'del';

import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./data.json'));

import gulp from 'gulp';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';

import Metalsmith from 'metalsmith';
import markdown from 'metalsmith-markdown';
import collections from 'metalsmith-collections';
// import addMeta from 'metalsmith-collections-addmeta';
import drafts from 'metalsmith-drafts';
// import relativeLinks from 'metalsmith-relative-links';
// import pagination from 'metalsmith-pagination';
// import metalPaths from 'metalsmith-paths';
import permalinks from 'metalsmith-permalinks';
import publish from 'metalsmith-publish';
import layouts from 'metalsmith-layouts';
import inplace from 'metalsmith-in-place';

import nunjucks from 'nunjucks';


const paths = {
    styles: {
        src: './src/styles/**/*.scss',
        dest: './dest/styles/'
    },
    scripts: {
        src: './src/js/**/*.js',
        dest: 'dest/js/'
    },
    html: {
        src: './src/templates/',
        dest: './dest/'
    },
    contents: {
        src: './src/contents'
    },
    dest: './dest/**'
};

nunjucks.configure(paths.html.src, { watch: false });

// const clean = () => del('./dest/**', '!./dest/about');
// export { clean };

// // Dates
// import moment from 'moment';

// function formatDate(string) {
//     return function(date) {
//         return moment(date).utc().format(string);
//     };
// }

function debug(logToConsole) {
  return function(files, metalsmith, done) {
    if (logToConsole) {
      console.log('\nMETADATA:');
      console.log(metalsmith.metadata());

      for (var f in files) {
        console.log('\nFILE:');
        console.log(files[f]);
      }
    }

    done();
  };
};

export function ms(callback) {
    let environment = new nunjucks.Environment(new nunjucks.FileSystemLoader(paths.html.src));

    const m = Metalsmith(__dirname)
        .metadata(data.meta.site)
        .source(paths.contents.src)
        .destination(paths.html.dest)
        .clean(false)
        // .use(drafts())
        .use(collections({
            articles: {
                pattern: 'articles/**/*.md',
                sortBy: 'date',
                reverse: true
            }
        }))
        // .use(addMeta({
        //     articles: { layout: 'entries/project.njk' }
        // }))
        // .use(paths({ property: 'paths' }))
        // .use(relativeLinks())
        // .use(ancestry())
        // .use(untemplatize({ key: 'content' }))
        // .use(excerpts())
        // .use(feed({
        //     collection: 'writings',
        //     limit: false
        // }))
        // .use(wordCount())
        // .use(alias())
        .use(markdown())
        .use(permalinks({
            relative: false,
            linksets: [{
                match: { collection: 'articles' },
                pattern: 'articles/:title'
            }]
        }))
        .use(layouts({
            engine: 'nunjucks',
            directory: paths.html.src,
            nunjucksEnv: environment
        }))
        // .use(inplace({
        //     engine: 'nunjucks',
        //     pattern: '**/*.njk'
        // }))
        .use(debug(false))
        .build((err) => {
            if (err) throw err;
            callback();
        });
}

export function styles() {
    return gulp.src(paths.styles.src)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.styles.dest));
}

export function clean() {
    return del([
        'dest/**/*',
        '!dest/about'
    ]);
}

export function copy() {
    return gulp.src('dest/**/*')
        .pipe(gulp.dest('docs/'))
}

const build = gulp.series(clean, ms, styles, copy);
gulp.task('build', build);

export default ms;
