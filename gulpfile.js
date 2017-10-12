'use strict';

const gulp 			= require('gulp');
const del 			= require('del');
const babel         = require('gulp-babel');
const concat 		= require('gulp-concat');
const uglify 		= require('gulp-uglify');
const autoprefixer 	= require('gulp-autoprefixer');
const sass          = require('gulp-sass');

const PATHS = {
    dev: './src/',
    prod: './public/',
    npm: './node_modules/'
};

/** Clean public directory */
gulp.task('clean', function(){

    return del.sync( PATHS.prod );
});

/** HTML task */
gulp.task('html', function(){

    return gulp.src([
        `${PATHS.dev}index.html`,
        `${PATHS.dev}**/*.html`
    ])
        .pipe(gulp.dest( PATHS.prod ));
});

/** Styles */
gulp.task('sass', function(){

    return gulp.src( `${PATHS.dev}**/*.scss` )
        .pipe(autoprefixer( ['last 2 versions', '> 1%', 'ie 8'], {cascade: false} ))
        .pipe(sass().on('error', sass.logError))
        .pipe(concat( 'styles.css' ))
        .pipe(gulp.dest( `${PATHS.prod}css/` ));
});

/** Libs styles */
gulp.task('libs-css', function(){

    return gulp.src( `${PATHS.npm}bootstrap/dist/css/*.min.css` )
        .pipe(concat( 'libs.css' ))
        .pipe(gulp.dest( `${PATHS.prod}css/` ));
});

/** JavaScript */
gulp.task('js', function(){

    return gulp.src( `${PATHS.dev}app/**/*.js` )
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(concat( 'app.js' ))
        .pipe(gulp.dest( `${PATHS.prod}app/` ));
});

/** Libs javascript */
gulp.task('libs-js', function(){

    return gulp.src([
        `${PATHS.npm}angular/angular.min.js`,
        `${PATHS.npm}angular-route/angular-route.min.js`,
        `${PATHS.npm}popper.js/dist/umd/popper.min.js`,
        `${PATHS.npm}jquery/dist/jquery.min.js`,
        `${PATHS.npm}bootstrap/dist/js/bootstrap.min.js`
    ])
        .pipe(concat( 'libs.js' ))
        .pipe(uglify())
        .pipe(gulp.dest( `${PATHS.prod}libs/` ));
});

/** Watch */
gulp.task('watch', function(){
    gulp.watch( `${PATHS.dev}app/**/*.js`, ['js'] );
    gulp.watch( `${PATHS.dev}**/*.scss`, ['sass'] );
    gulp.watch( `${PATHS.dev}**/*.html`, ['html'] );
});

/** Builds */
gulp.task('build', ['clean', 'libs-js', 'libs-css', 'html', 'sass', 'js']);
gulp.task('dev', ['build', 'watch']);