console.log('----------------------------------------------------------------------------------------------')
console.log('`DeprecationWarning: loaderUtils.parseQuery()` will be solved when babel-loader 7 is released.')
console.log('Ok, that was wishful thinking, a lot of plugins still use that method                         ')
console.log('----------------------------------------------------------------------------------------------')

// we might be able to steal some ideas from https://github.com/tomchentw/unused-files-webpack-plugin/blob/master/src/index.js
// to copy unused files (after passing through the 'public' loaders) to target dir)

const path = require('path')
const webpack = require('webpack')
const fs = require('fs-extra')
const walkSync = require('walk-sync')
const nodeExternals = require('webpack-node-externals')

const mergeCssPlugin = require('../webpack-plugins/merge-css-plugin')
const reactTemplatePlugin = require('../webpack-plugins/react-template-plugin')
const reactUniversalPlugin = require('../webpack-plugins/react-universal-plugin')
const sourceMapPlugin = require('../webpack-plugins/source-map-plugin')
const watchContextPlugin = require('../webpack-plugins/watch-context-plugin')
const hotModuleReplacementPlugin = require('../webpack-plugins/hot-module-replacement-plugin')
const loadDirectoryPlugin = require('../webpack-plugins/load-directory-plugin')
const targetBasedPluginsPlugin = require('../webpack-plugins/target-based-plugins-plugin')
const configLoaderPlugin = require('../webpack-plugins/config-loader-plugin')
const makeAdditionalEntries = require('../webpack-plugins/make-additional-entries-plugin')
const absolutePathResolverPlugin = require('../webpack-resolver-plugins/absolute-path-resolver-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'

const babelLoader = {
  loader: 'babel-loader',
  options: {
    babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
    presets: [['es2015', { modules: false }], 'react'],
    plugins: [
      'transform-decorators-legacy',
      'transform-class-properties',
      'transform-object-rest-spread',
      'transform-async-to-generator',
      ['transform-runtime', {
        'helpers': false,
        'polyfill': false,
        'regenerator': true
      }]
    ]
  }
}

const cssLoader = {
  loader: 'css-loader'
}

const imageLoader = {
  loader: 'image-webpack-loader',
  options: {
    // bypassOnDebug: true,
    // gifsicle: {}, // https://github.com/imagemin/imagemin-gifsicle#options
    // mozjpeg: {}, // https://github.com/imagemin/imagemin-mozjpeg#options
    // pngquant: {}, // https://github.com/imagemin/imagemin-pngquant#options
    // optipng: {}, // https://github.com/imagemin/imagemin-optipng#options
    // svgo: {} // https://github.com/imagemin/imagemin-svgo#options
  }
}

const imageSizeLoader = {
  loader: 'image-maxsize-webpack-loader',
  options: { useImageMagick: true }
}

const keepNameFileLoader = {
  loader: 'file-loader',
  options: { name: '[path][name].[ext]' }
}

const toJsonFileLoader = {
  loader: 'to-json-file-loader'
}

module.exports = function build({ watch }) {

  const target = path.resolve(process.cwd(), 'target')
  fs.removeSync(target)

  const srcDir = path.resolve(process.cwd(), 'src')

  const publicDir = path.resolve(srcDir, 'public')

  function createCompiler(entries) {
    return webpack({
      entry: entries,
      target: 'node',
      output: {
        filename: '[name]',
        path: target,
        publicPath: '/',
        libraryTarget: 'commonjs2'//'umd2' //'commonjs2'
      },
      externals: nodeExternals({ whitelist: ['@kaliber/config'] }),
      resolve: {
        extensions: ['.js'],//, '.html.js'],
        modules: [srcDir, 'node_modules'],
        plugins: [absolutePathResolverPlugin(srcDir)]
      },
      resolveLoader: {
        modules: [path.resolve(__dirname, '../webpack-loaders'), 'node_modules']
      },
      context: srcDir,
      module: {
        // noParse: https://webpack.js.org/configuration/module/#module-noparse
        rules: [{ oneOf: [

          // {
          //   test: [new RegExp('^' + publicDir)],
          //   oneOf: [
          //     {
          //       test: /\.css$/,
          //       loaders: [toJsonFileLoader, cssLoader]
          //     },

          //     {
          //       test: /\.svg$/,
          //       loaders: [
          //         keepNameFileLoader,
          //         imageLoader
          //       ]
          //     },

          //     {
          //       test: /\.(jpe?g|png|gif)$/,
          //       loaders: [keepNameFileLoader, imageLoader, imageSizeLoader]
          //     },

          //     {
          //       loaders: [keepNameFileLoader]
          //     }
          //   ]
          // },

          {
            test: /\.json$/,
            loaders: []
          },

          // {
          //   test: /\.entry\.css$/,
          //   loaders: [toJsonFileLoader, cssLoader]
          // },

          {
            test: /\.css$/,
            loaders: ['json-loader', cssLoader]
          },

          {
            test: /(\.html\.js|\.js)$/,
            loaders: [babelLoader],
            exclude: /node_modules/
          },

          {
            test: /\.js$/
          },

          {
            test: /\.svg$/,
            loaders: [
              {
                loader: 'url-loader',
                options: { limit: 5000 }
              },
              imageLoader
            ]
          },

          {
            test: /\.(jpe?g|png|gif)$/,
            loaders: [
              {
                loader: 'url-loader',
                options: { limit: 5000 }
              },
              imageLoader,
              imageSizeLoader
            ]
          },

          {
            loader: 'file-loader'
          }

        ]}]
      },
      // server and compilation process plugins
      plugins: [
        targetBasedPluginsPlugin({
          all: [
            makeAdditionalEntries(),
            new CaseSensitivePathsPlugin(),
            new webpack.DefinePlugin({
              'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }),
            new webpack.ProvidePlugin({
              React: 'react',
              Component: ['react', 'Component']
            }),
            sourceMapPlugin()
          ].filter(Boolean),
          node: [
            configLoaderPlugin(),
            watchContextPlugin(),
            reactTemplatePlugin(entries),
            reactUniversalPlugin(),
            mergeCssPlugin(),
            // fs.existsSync(publicDir) && loadDirectoryPlugin(publicDir)
          ].filter(Boolean),
          web: [
            isProduction && new webpack.optimize.UglifyJsPlugin({ sourceMap: true }),
            watch && hotModuleReplacementPlugin()
          ].filter(Boolean)
        })
      ],
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
    return walkSync(srcDir, { globs: ['**/*.html.js', 
      //'**/*.entry.js', '**/*.entry.css'
      ] }).reduce(
      (result, entry) => (
        result[entry.replace('.html.js', '')] = './' + entry, result),
      {}
    )
  }
}
