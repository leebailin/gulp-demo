const cwd = process.cwd()
const path = require('path')
const { src, dest, lastRun, parallel, series, watch } = require('gulp')
const del = require('del')
const autoprefixer = require('autoprefixer')

const browserSync = require('browser-sync')
const bs = browserSync.create()

const loadPlugin = require('gulp-load-plugins')
const $ = loadPlugin()

let config
let defaultConfig = {
  build: {
    src: 'src',
    dest: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/**/*.scss',
      scripts: 'assets/scripts/**/*.js',
      pages: '**/*.html',
      images: 'assets/images/**/*.{jpg,jpeg,png,gif,svg}',
      fonts: 'assets/fonts/**/*.{eot,svg,ttf,woff,woff2}'
    }
  }
}
try {
  const loadConfig = require(path.join(cwd, 'pages.config.js'))
  config = new Proxy(defaultConfig, {
    set: function (target, name, value) {
      return target[name] = Object.assign({}, target[name], value)
    }
  })
  Object.assign(config, loadConfig)
} catch (e) {}

const clean = () => {
  return del([config.build.temp, config.build.dest])
}

const style = () => {
  return src(config.build.paths.styles, {
    cwd: config.build.src,
    base: config.build.src
  })
    .pipe($.plumber({ errorHandler: $.sass.logError }))
    .pipe(
      $.sass.sync({
        outputStyle: 'expanded',
        precision: 10,
        includePaths: ['.']
      })
    )
    .pipe($.postcss([autoprefixer()]))
    .pipe(dest(config.build.temp, { sourcemaps: '.' }))
    .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src(config.build.paths.scripts, {
    cwd: config.build.src,
    base: config.build.src
  })
    .pipe($.plumber())
    .pipe($.babel({ presets: ['@babel/preset-env'] }))
    .pipe(dest(config.build.temp, { sourcemaps: '.' }))
    .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src(config.build.paths.pages, {
    cwd: config.build.src,
    base: config.build.src,
    ignore: ['{layouts,partials}/**']
  })
    .pipe($.plumber())
    .pipe(
      $.swig({ data: config.data, defaults: { cache: false } })
    )
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src(config.build.paths.images, {
    cwd: config.build.src,
    base: config.build.src,
    since: lastRun(image)
  })
    .pipe($.plumber())
    .pipe($.imagemin())
    .pipe(dest(config.build.dest))
}

const font = () => {
  return src(config.build.paths.fonts, {
    cwd: config.build.src, base: config.build.src
  })
    .pipe($.plumber())
    .pipe($.imagemin())
    .pipe(dest(config.build.dest))
}

const extra = () => {
  return src('**', { cwd: config.build.public, base: config.build.public, dot: true })
    .pipe(dest(config.build.dest))
}

const useref = () => {
  const htmlminOpts = {
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    processConditionalComments: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
  }

  return src(config.build.paths.pages, { cwd: config.build.temp, base: config.build.temp })
    .pipe($.plumber())
    .pipe($.useref({ searchPath: ['.', '..'] }))
    .pipe($.if(/\.js$/, $.uglify()))
    .pipe($.if(/\.css$/, $.cleanCss()))
    .pipe($.if(/\.html$/, $.htmlmin(htmlminOpts)))
    .pipe(dest(config.build.dest))
}

const measure = () => {
  return src('**', { cwd: config.build.dest })
    .pipe($.plumber())
    .pipe(
      $.size({
        title: `mode build`,
        gzip: true
      })
    )
}

const devServer = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  watch(
    [config.build.paths.images, config.build.paths.fonts],
    { cwd: config.build.src },async () => await bs.reload()
  )
  watch('**', { cwd: config.build.public }, async () => await bs.reload())

  bs.init({
    notify: false,
    port: 2080,
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: { '/node_modules': 'node_modules' }
    }
  })
}

const distServer = () => {
  bs.init({
    notify: false,
    port: 2080,
    server: config.build.dest
  })
}
const compile = parallel(style, script, page)

const serve = series(compile, devServer)

const build = series(
  clean,
  parallel(series(compile, useref), image, font, extra),
  measure
)

const start = series(build, distServer)

module.exports = {
  clean,
  style,
  script,
  page,
  useref,
  image,
  font,
  extra,
  measure,
  devServer,
  distServer,
  compile,
  serve,
  build,
  start
}
