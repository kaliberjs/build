const fs = require('fs-extra')
const nodeExternals = require('webpack-node-externals')
const path = require('path')
const walkSync = require('walk-sync')
const webpack = require('webpack')

const chunkManifestPlugin = require('../webpack-plugins/chunk-manifest-plugin')
const configLoaderPlugin = require('../webpack-plugins/config-loader-plugin')
const copyUnusedFilesPlugin = require('../webpack-plugins/copy-unused-files-plugin')
const hotCssReplacementPlugin = require('../webpack-plugins/hot-css-replacement-plugin')
const hotModuleReplacementPlugin = require('../webpack-plugins/hot-module-replacement-plugin')
const makeAdditionalEntriesPlugin = require('../webpack-plugins/make-additional-entries-plugin')
const mergeCssPlugin = require('../webpack-plugins/merge-css-plugin')
const reactUniversalPlugin = require('../webpack-plugins/react-universal-plugin')
const sharedModulesPlugin = require('../webpack-plugins/shared-modules-plugin')
const sourceMapPlugin = require('../webpack-plugins/source-map-plugin')
const targetBasedPluginsPlugin = require('../webpack-plugins/target-based-plugins-plugin')
const templatePlugin = require('../webpack-plugins/template-plugin')
const watchContextPlugin = require('../webpack-plugins/watch-context-plugin')
const websocketCommunicationPlugin = require('../webpack-plugins/websocket-communication-plugin')

const absolutePathResolverPlugin = require('../webpack-resolver-plugins/absolute-path-resolver-plugin')
const fragmentResolverPlugin = require('../webpack-resolver-plugins/fragment-resolver-plugin')

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const ExtendedAPIPlugin = require('webpack/lib/ExtendedAPIPlugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'

const { kaliber: { templateRenderers } = {} } = (process.env.CONFIG_ENV ? require('@kaliber/config') : {})

const babelLoader = {
  loader: 'babel-loader',
  options: {
    babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
    presets: [['es2015', { modules: false }], 'react'],
    plugins: [
      'syntax-dynamic-import',
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

const cssLoaderMinifyOnly = {
  loader: 'css-loader',
  options: { minifyOnly: true }
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

module.exports = function build({ watch }) {

  const target = path.resolve(process.cwd(), 'target')
  fs.removeSync(target)

  const srcDir = path.resolve(process.cwd(), 'src')

  // This needs to be a function, if this would be an object things might breack
  // because webpack stores state in the options object :-(
  function getOptions() {
    return {
      target: 'node',
      output: {
        filename: '[name]',
        chunkFilename: '[name]-[hash].js',
        path: target,
        publicPath: '/',
        libraryTarget: 'commonjs2'
      },
      externals: nodeExternals({ whitelist: ['@kaliber/config', /@kaliber\/build\/lib\/(stylesheet|javascript)/, /\.css$/] }),
      resolve: {
        extensions: ['.js'],
        modules: ['node_modules'],
        plugins: [absolutePathResolverPlugin(srcDir), fragmentResolverPlugin()]
      },
      resolveLoader: {
        modules: [path.resolve(__dirname, '../webpack-loaders'), 'node_modules']
      },
      context: srcDir,
      module: {
        // noParse: https://webpack.js.org/configuration/module/#module-noparse
        rules: [{ oneOf: [

          {
            test: /\.json$/,
            loaders: []
          },

          {
            test: /\.entry\.css$/,
            loaders: ['to-json-file-loader', cssLoader]
          },

          {
            test: /\.css$/,
            loaders: ['json-loader', cssLoader],
            exclude: /node_modules/
          },

          {
            test: /\.css$/,
            loaders: ['json-loader', cssLoaderMinifyOnly]
          },

          {
            resource: {
              test: /(\.html\.js|\.js)$/,
              or: [{ exclude: /node_modules/ }, /@kaliber\/build\/lib\/(stylesheet|javascript)\.js$/],
            },
            loaders: [babelLoader]
          },

          {
            test: /\.js$/
          },

          {
            test: /\.svg$/,
            resourceQuery: /fragment/,
            loaders: ['fragment-loader']
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
            new ProgressBarPlugin(),
            watch && websocketCommunicationPlugin(),
            makeAdditionalEntriesPlugin(),
            new CaseSensitivePathsPlugin(),
            new webpack.DefinePlugin({
              'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }),
            new webpack.ProvidePlugin({
              React: 'react',
              Component: ['react', 'Component']
            }),
            sourceMapPlugin(),
          ].filter(Boolean),
          node: [
            watch && new ExtendedAPIPlugin(),
            configLoaderPlugin(),
            watchContextPlugin(),
            reactUniversalPlugin(),        // claims .entry.js
            templatePlugin(Object.assign({ // does work on .*.js
              html: '@kaliber/build/lib/html-react-renderer',
              default: '@kaliber/build/lib/default-renderer'
            }, templateRenderers)),
            mergeCssPlugin(),
            copyUnusedFilesPlugin(),
            watch && hotCssReplacementPlugin()
          ].filter(Boolean),
          web: [
            sharedModulesPlugin(),
            chunkManifestPlugin(),
            isProduction && new webpack.optimize.UglifyJsPlugin({ sourceMap: true }),
            watch && hotModuleReplacementPlugin()
          ].filter(Boolean)
        })
      ],
    }
  }

  try {
    if (watch) startWatching(compilationComplete)
    else runOnce(compilationComplete)

    function createCompiler(entries) {
      const options = getOptions()
      options.entry = entries

      return webpack(options)
    }

    function compilationComplete(err, stats) {
      if (err) {
        console.error(err.stack || err)
        if (err.details) console.error(err.details)
        return
      }
      console.log(stats.toString({
        colors: true,
        chunksSort: 'name',
        assetsSort: 'name',
        modulesSort: 'name',
        excludeModules: (name, module) => !module.external
      }))
    }

    function runOnce(callback) {
      const compiler = createCompiler(gatherEntries())
      compiler.run(callback)
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
    return walkSync(srcDir, { globs: ['**/*.*.js', '**/*.entry.css'] }).reduce(
      (result, entry) => (result[entry] = './' + entry, result),
      {}
    )
  }
}
