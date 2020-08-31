const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')

const browserSync = require('browser-sync')
const bs = browserSync.create()

const loadPlugin = require('gulp-load-plugins')
const plugins = loadPlugin()
// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')

const style = () => {
  // base 选项定义转换是的基准路径，也就是保留 src 原目录结构
  return src('src/assets/styles/*.scss', { base: 'src' })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
    .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

// 模板中用到的数据
const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Github',
          link: 'https://github.com/leebailin'
        },
        {
          name: 'About',
          link: 'https://baidu.com/'
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: 'https://github.com/leebailin'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}

const page = () => {
  // 如果其他文件夹下的子目录有 html 文件需要编译的话 可以使用 ‘src/**/*.html’
  // 这个项目我们只需要编译 src 目录下的 html 文件，src 下的其他目录的 html 文件只是通过模板语法引入到主文件使用，不需要编译到目标目录下
  // 所以只需要 ‘src/*.html’
  return src('src/*.html', { base: 'src' })
    .pipe(plugins.swig({ data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src('src/assets/images/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const font = () => {
  return src('src/assets/fonts/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest('dist'))
}

const clean = () => {
  return del(['dist', 'temp'])
}

const serve = () => {
  // 第一个参数：监听文件路径 第二个参数：文件变化后执行的任务
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**',
  ], async () => {
    await bs.reload()
  })

  bs.init({
    notify: false, // 启动页面时右上角的提示
    port: 2080, // 设置本地服务器端口
    // files: 'dist/**', // 监听目标目录下所有文件修改后自动更新浏览器
    server: {
      // 服务器根目录（构建后的目录）
      baseDir: ['temp', 'src', 'public'],
      // 处理第三方库文件（因为我们还未处理第三方库到我们的 dist 目录下，比如 bootstrap，jquery）
      routes: {
        // 请求的前缀       目录
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src('temp/*.html', { base: 'temp' })
    // 在 temp 和 根目录寻找需要合并的文件
    // 对应 temp 下的 assets/styles/main.css 和 根目录下的 /node_modules
    .pipe(plugins.useref({ searchPath: ['temp', '.'] }))
    // html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest('dist'))
}

// const compile = parallel(style, script, page, image, font)
const compile = parallel(style, script, page)

const develop = series(compile, serve)

// 上线之前执行的任务
// const build = series(
//   clean,
//   parallel(compile, image, font, extra)
// )
const build = series(
  clean,
  parallel(
    // 构建 html css js 到 temp 目录 再 执行 useref 任务
    series(compile, useref),
    image,
    font,
    extra
  )
)

module.exports = {
  clean,
  build,
  develop
}

