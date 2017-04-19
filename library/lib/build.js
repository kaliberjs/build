console.log('----------------------------------------------------------------------------------------------')
console.log('`DeprecationWarning: loaderUtils.parseQuery()` will be solved when babel-loader 7 is released.')
console.log('----------------------------------------------------------------------------------------------')

const path = require('path')
const webpack = require('webpack')
const fs = require('fs-extra')
const walkSync = require('walk-sync')

const mergeCssPlugin = require('../webpack-plugins/merge-css-plugin')
const reactTemplatePlugin = require('../webpack-plugins/react-template-plugin')
const reactUniversalPlugin = require('../webpack-plugins/react-universal-plugin')
const sourceMapPlugin = require('../webpack-plugins/source-map-plugin')
const watchContextPlugin = require('../webpack-plugins/watch-context-plugin')
const hotModuleReplacementPlugin = require('../webpack-plugins/hot-module-replacement-plugin')

module.exports = function build({ watch }) {

  const target = path.resolve(process.cwd(), 'target')
  fs.removeSync(target)

  const srcDir = path.resolve(process.cwd(), 'src')

  function createCompiler(entries) {
    return webpack({
      entry: entries,
      output: { 
        filename: '[name]', 
        path: target, 
        libraryTarget: 'umd2' //'commonjs2' 
      },
      externals: {
        react: {
          commonjs2: 'react',
          root: 'React'
        }, 
        'react-dom': {
          commonjs2: 'react-dom',
          root: 'ReactDOM'
        }, 
        'react-dom/server': {
          commonjs2: 'react-dom/server'
        }
      },
      resolve: { extensions: ['.js', '.html.js'] },
      resolveLoader: {
        modules: [path.resolve(__dirname, '../webpack-loaders'), "node_modules"]
      },
      context: srcDir,
      module: {
        rules: [
          {
            test: /\.css$/,
            loaders: ['json-loader', 'css-loader']
          },

          {
            test: /(\.html\.js|\.js)$/,
            loaders: [
              {
                loader: 'babel-loader',
                options: {
                  babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
                  presets: [['es2015', { modules: false }], 'react'],
                  plugins: ['transform-class-properties']
                }
              }
            ]
          },

          {
            test: /\.(jpe?g|png|gif|svg)$/,
            loaders: [
              {
                loader: 'url-loader',
                options: { limit: 5000 }
              },
              {
                loader: 'image-webpack-loader',
                options: {
                  // bypassOnDebug: true,
                  // gifsicle: {}, // https://github.com/imagemin/imagemin-gifsicle#options
                  // mozjpeg: {}, // https://github.com/imagemin/imagemin-mozjpeg#options
                  // pngquant: {}, // https://github.com/imagemin/imagemin-pngquant#options
                  // optipng: {}, // https://github.com/imagemin/imagemin-optipng#options
                  // svgo: {} //
                }
              },
              {
                loader: 'image-maxsize-webpack-loader',
                options: { useImageMagick: true }
              }
            ]
          }
        ]
      },
      plugins: [
        watchContextPlugin(),
        new webpack.ProvidePlugin({ React: 'react', Component: ['react', 'Component'] }),
        sourceMapPlugin(),
        reactTemplatePlugin(entries),
        reactUniversalPlugin(),
        mergeCssPlugin(),
        watch && hotModuleReplacementPlugin()
      ].filter(Boolean)
    })
  }

  try {
    if (watch) startWatching(compilationComplete)
    else runOnce(compilationComplete)

    function compilationComplete(err, stats) {
      if (err) {
        console.error(err.stack || err)
        if (err.details) console.error(err.details)
        return
      }

      console.log(stats.toString({ colors: true }))
    }

    function runOnce() {
      const compiler = createCompiler(gatherEntries())
      compiler.run(compilationComplete)
    }

    function startWatching(callback) {
      let watching
      let entries
      start(gatherEntries())
      
      function start(newEntries) {
        entries = newEntries
        const compiler = createCompiler(entries)
        watching = compiler.watch({}, onWatchTriggered)
      }

      function onWatchTriggered(err, stats) {
        callback(err, stats)

        const newEntries = gatherEntries()
        const [oldKeys, newKeys] = [Object.keys(entries), Object.keys(newEntries)]
        const entriesChanged = !oldKeys.every(x => newKeys.includes(x)) || !newKeys.every(x => oldKeys.includes(x))

        if (entriesChanged) {
          console.log('Entries changed, restarting watch')
          watching.close(() => { start(newEntries) })
        }
        console.log('\nWaiting for file changes...\n')
      }
    }
  } catch (e) { console.error(e.message) }

  function gatherEntries() {
    return walkSync(srcDir, { globs: ['**/*.html.js'] }).reduce(
      (result, template) => (
        result[template.replace('.html.js', '')] = './' + template, result),
      {}
    )
  }
}
