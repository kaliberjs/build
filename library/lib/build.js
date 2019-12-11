// @ts-ignore - Better logging for deprecation and other errors
process.traceDeprecation = true
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled rejection of:\n', p, '\nReason:\n', reason)
})

let caseSensitive = false
try {
  require('./CaSe-SeNsItIvE')
  caseSensitive = false
} catch (e) {
  caseSensitive = true
} finally {
  if (!caseSensitive) throw new Error(`@kaliber/build will not run on a filesystem that is case-insensitive`)
}

const findYarnWorkspaceRoot = require('find-yarn-workspace-root')
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
const sourceMapPlugin = require('../webpack-plugins/source-map-plugin')
const templatePlugin = require('../webpack-plugins/template-plugin')
const watchContextPlugin = require('../webpack-plugins/watch-context-plugin')
const websocketCommunicationPlugin = require('../webpack-plugins/websocket-communication-plugin')

const absolutePathResolverPlugin = require('../webpack-resolver-plugins/absolute-path-resolver-plugin')
const fragmentResolverPlugin = require('../webpack-resolver-plugins/fragment-resolver-plugin')

const ExtendedAPIPlugin = require('webpack/lib/ExtendedAPIPlugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const TimeFixPlugin = require('time-fix-plugin') // https://github.com/webpack/watchpack/issues/25
const TerserPlugin = require('terser-webpack-plugin')

const templateRenderers = require('./getTemplateRenderers')

const isProduction = process.env.NODE_ENV === 'production'

const { kaliber: { compileWithBabel: userDefinedcompileWithBabel = [], publicPath = '/' } = {} } = require('@kaliber/config')

const recognizedTemplates = Object.keys(templateRenderers)

const kaliberBuildClientModules = [/(@kaliber\/build\/lib\/(stylesheet|javascript|polyfill|withPolyfill|hot-module-replacement-client|rollbar)|ansi-regex)/]
const compileWithBabel = kaliberBuildClientModules.concat(userDefinedcompileWithBabel)

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: './.babelcache/',
    cacheCompression: false,
    babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
    presets: [['@babel/preset-env', { modules: false }], '@babel/preset-react'],
    plugins: [
      '@babel/syntax-dynamic-import',
      ['@babel/proposal-decorators', { legacy: true }],
      '@babel/proposal-class-properties',
      '@babel/proposal-object-rest-spread',
      '@babel/transform-async-to-generator',
      ['@babel/transform-runtime', {
        'helpers': false,
        'regenerator': true
      }]
    ]
  }
}

const cssLoaderGlobalScope = {
  loader: 'css-loader',
  options: { globalScopeBehaviour: true }
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
    svgo: { enabled: false } // https://github.com/imagemin/imagemin-svgo#options
  }
}

const imageSizeLoader = {
  loader: 'image-maxsize-webpack-loader',
  options: { useImageMagick: true }
}

const urlLoader = {
  loader: 'url-loader',
  options: { limit: 5000, esModule: false }
}

const fileLoader = {
  loader: 'file-loader',
  options: { esModule: false }
}

const rawLoader = {
  loader: 'raw-loader',
  options: { esModule: false }
}

module.exports = function build({ watch }) {

  const cwd = process.cwd()

  const srcDir = path.resolve(cwd, 'src')
  const yarnWorkspaceDir = findYarnWorkspaceRoot(cwd)
  const targetDir = path.resolve(cwd, 'target')
  fs.removeSync(targetDir)

  const mode = isProduction ? 'production' : 'development'
  const outputPath = path.join(targetDir, publicPath)

  function nodeOptions() {
    return {
      mode,
      target: 'node',
      context: srcDir,
      devtool: false,
      output: {
        filename: '[name]',
        chunkFilename: '[name]-[hash].js',
        path: outputPath,
        publicPath,
        libraryTarget: 'commonjs2'
      },
      externals: [
        nodeExternals(externalConfForModulesDir('node_modules')),
        yarnWorkspaceDir && nodeExternals(externalConfForModulesDir(path.resolve(yarnWorkspaceDir, 'node_modules')))
      ].filter(Boolean),
      optimization: {
        minimize: false,
        namedChunks: false,
        splitChunks: false
      },
      resolve: resolveOptions(),
      resolveLoader: resolveLoaderOptions(),
      module: moduleOptions(),
      plugins: [
        ...pluginsOptions().all(),
        ...pluginsOptions().node()
      ]
    }
  }

  function webOptions() {
    return {
      mode,
      target: 'web',
      context: srcDir,
      devtool: false,
      entry: false,
      output: {
        filename: '[id].[hash].js',
        chunkFilename: '[id].[hash].js',
        path: outputPath,
        publicPath
      },
      optimization: {
        namedChunks: false,
        runtimeChunk: 'single',
        minimize: isProduction,
        minimizer: [
          new TerserPlugin({
            cache: true,
            parallel: true,
            sourceMap: true
          })
        ],
        splitChunks: {
          chunks: 'all',
          minSize: 10000
        }
      },
      resolve: resolveOptions(),
      resolveLoader: resolveLoaderOptions(),
      module: Object.assign({
        unsafeCache: false
      }, moduleOptions()),
      plugins: [
        ...pluginsOptions().all(),
        ...pluginsOptions().web()
      ]
    }
  }

  function resolveOptions() {
    return {
      extensions: ['.js'],
      modules: ['node_modules'],
      plugins: [absolutePathResolverPlugin(srcDir), fragmentResolverPlugin()]
    }
  }

  function resolveLoaderOptions() {
    return {
      modules: [
        path.resolve(__dirname, '../webpack-loaders'),
        'node_modules'
      ]
    }
  }

  function moduleOptions() {
    return {
      rules: [{ oneOf: [

        {
          test: /\.raw\.[^.]+$/,
          loaders: [rawLoader]
        },

        {
          type: 'json',
          test: /\.json$/,
          loaders: []
        },

        {
          test: /\.entry\.css$/,
          loaders: [cssLoaderGlobalScope]
        },

        {
          test: /\.css$/,
          loaders: ['json-loader', cssLoader],
          exclude: /node_modules/
        },

        {
          test: /\.css$/,
          loaders: [cssLoaderMinifyOnly]
        },

        {
          test: /\.js$/,
          resourceQuery: /transpiled-javascript-string/,
          loaders: [rawLoader, babelLoader]
        },

        {
          resource: {
            test: /(\.html\.js|\.js)$/,
            or: [{ exclude: /node_modules/ }, ...compileWithBabel],
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
            urlLoader,
            imageLoader
          ]
        },

        {
          test: /\.(jpe?g|png|gif)$/,
          loaders: [
            urlLoader,
            'cache-loader',
            isProduction && imageLoader,
            imageSizeLoader
          ].filter(Boolean)
        },

        {
          loader: fileLoader
        }

      ] }]
    }
  }

  function pluginsOptions() {
    return {
      all: () => [
        ProgressBarPlugin(),
        watch && websocketCommunicationPlugin(),
        makeAdditionalEntriesPlugin(),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.WATCH': watch
        }),
        new webpack.ProvidePlugin({
          React: 'react',
          Component: ['react', 'Component'],
          cx: 'classnames',
        }),
        sourceMapPlugin(),
      ].filter(Boolean),
      node: () => [
        new TimeFixPlugin(),
        new ExtendedAPIPlugin(),
        configLoaderPlugin(),
        watchContextPlugin(),
        reactUniversalPlugin(webOptions()),  // claims .entry.js
        templatePlugin(templateRenderers), // does work on .*.js
        mergeCssPlugin(),
        copyUnusedFilesPlugin(),
        watch && hotCssReplacementPlugin()
      ].filter(Boolean),
      web: () => [
        chunkManifestPlugin(),
        watch && hotModuleReplacementPlugin()
      ].filter(Boolean)
    }
  }

  function externalConfForModulesDir(modulesDir) {
    return {
      modulesDir,
      whitelist: ['@kaliber/config', ...compileWithBabel, /\.css$/]
    }
  }

  try {
    if (watch) startWatching(compilationComplete)
    else runOnce(compilationComplete)

    function createCompiler(entries) {
      return webpack(Object.assign({
        entry: entries
      }, nodeOptions()))
    }

    function compilationComplete(err, stats) {
      if (err) {
        console.error(err.stack || err)
        if (err.details) console.error(err.details)
        if (!watch) process.exit(1)
        return
      }

      console.log(stats.toString({
        colors: true,
        chunksSort: 'name',
        assetsSort: 'name',
        modulesSort: 'name',
        excludeModules: (name, module) => !module.external
      }))

      if (!watch && stats.hasErrors()) process.exitCode = 2
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

        console.log('\nWaiting for file changes...\n')

        if (entriesChanged) {
          console.log('Entries changed, restarting watch')
          watching.close(() => { start(newEntries) })
        }
      }
    }
  } catch (e) { console.error(e) }

  function gatherEntries() {
    const template = recognizedTemplates.join('|')
    const globs = [`**/*.@(${template}).js`, '**/*.entry.js', '**/*.entry.css']
    return walkSync(srcDir, { globs }).reduce(
      (result, entry) => ((result[entry] = './' + entry), result),
      {}
    )
  }
}
