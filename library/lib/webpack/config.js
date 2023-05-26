const path = require('path')
const log = require('loglevel')
const config = /** @type {any} */ (require('@kaliber/config'))
const { findEntries } = require('./findEntries')
const { cssNativeCustomProperties = false } = config?.kaliber || {}
const configuredTemplateRenderers = config?.kaliber?.templateRenderers || {}
const { TemplatePlugin } = require('./plugins/TemplatePlugin')
const { AbsolutePathResolverPlugin } = require('./resolver/AbsolutePathResolverPlugin')
const webpack = require('webpack')
const { SourceMapPlugin } = require('./plugins/SourceMapPlugin')
const { UniversalPlugin } = require('./plugins/UniversalPlugin')


const logLevel = log.levels[process.env.LOG_LEVEL]
if (logLevel) log.setDefaultLevel(logLevel)

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src')
const targetDir = path.resolve(cwd, 'target')

const {
  // compileWithBabel: userDefinedcompileWithBabel = [],
  publicPath = '/',
  // symlinks = true,
  // webpackLoaders: userDefinedWebpackLoaders = [],
} = config.kaliber || {}
const outputPath = path.join(targetDir, publicPath)

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'

const templateRenderers = Object.assign({
  html: '@kaliber/build/lib/html-react-renderer',
  txt: '@kaliber/build/lib/txt-renderer',
  json: '@kaliber/build/lib/json-renderer'
}, configuredTemplateRenderers)
const recognizedTemplates = Object.keys(templateRenderers)

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: './.babelcache/',
    cacheCompression: false,
    babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
    presets: ['@babel/preset-react'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/syntax-dynamic-import',
      '@babel/plugin-transform-named-capturing-groups-regex',
      '@babel/plugin-transform-template-literals',
    ]
  }
}

const cssLoaderGlobalScope = {
  loader: 'css-loader',
  options: { globalScopeBehaviour: true, nativeCustomProperties: cssNativeCustomProperties }
}

const cssLoader = {
  loader: 'css-loader',
  options: { nativeCustomProperties: cssNativeCustomProperties }
}

const cssLoaderMinifyOnly = {
  loader: 'css-loader',
  options: { minifyOnly: true }
}

module.exports = nodeConfig()

function nodeConfig() {
  return {
    name: 'node-compiler',
    mode,
    context: srcDir,
    target: 'node16',
    devtool: false,
    async entry() {
      const entries = await findEntries({
        cwd: srcDir,
        patterns: recognizedTemplates.map(template => `**/*.${template}.js`)
          .concat([
            '**/*.entry.css',
          ])
      })

      log.info(`Building the following entries (node):`)
      Object.keys(entries).forEach(entry => log.info(`  - ${entry}`))

      return entries
    },
    output: {
      filename: '[name]',
      chunkFilename: '[name]-[contenthash].js',
      path: outputPath,
      library: {
        type: 'commonjs2',
      },
      publicPath,
    },
    externals: [
      ({ request }, callback) => {
        if (/^[./]/.test(request)) return callback()
        // This needs to be different:
        if (/^(@kaliber\/build|@kaliber\/elasticsearch)/.test(request)) return callback()

        return callback(null, `commonjs2 ${request}`)
      }
    ],
    resolve: resolveConfig(),
    resolveLoader: resolveLoaderConfig(),
    module: moduleConfig(),
    plugins: [
      ...pluginConfig().all(),
      ...pluginConfig().node(),
    ]
  }
}

function browserConfig() {
  return {
    name: 'browser-compiler',
    mode,
    context: srcDir,
    target: 'web',

    async entry() {
      const entries = await findEntries({
        cwd: srcDir,
        patterns: [
          '**/*.entry.js',
        ]
      })

      log.info(`Building the following entries (web):`)
      Object.keys(entries).forEach(entry => log.info(`  - ${entry}`))

      return entries
    },

    module: moduleConfig(),

    output: {
      filename: '[id].[contenthash].js',
      chunkFilename: '[id].[contenthash].js',
      path: outputPath,
      publicPath,
    },
    optimization: {
      chunkIds: 'deterministic',
      runtimeChunk: 'single',
      minimize: false, //isProduction,
      minimizer: [
        // new TerserPlugin({
        //   cache: true,
        //   parallel: true,
        //   sourceMap: true
        // })
      ],
      splitChunks: {
        chunks: 'all',
        minSize: 10000,
        maxInitialRequests: 100,
      }
    },
    plugins: [
      ...pluginConfig().all(),
      ...pluginConfig().browser(),
    ]
  }
}

function resolveConfig() {
  return {
    plugins: [AbsolutePathResolverPlugin({ path: srcDir })], //, fragmentResolverPlugin()],
  }
}

function resolveLoaderConfig() {
  return {
    modules: [
      path.resolve(__dirname, './loaders'),
      'node_modules'
    ]
  }
}

function moduleConfig() {
  return {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: babelLoader
      },

      {
        test: /\.entry\.css$/,
        use: cssLoaderGlobalScope
      },

      {
        test: /\.css$/,
        // or: [{ exclude: /node_modules/ }]//, ...compileWithBabel],
        exclude: /node_modules/,
        use: cssLoader
      },

      {
        test: /\.css$/,
        use: cssLoaderMinifyOnly
      },

      {
        test: /\.raw\.[^.]+$/,
        type: 'asset/source',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ]
  }
}

function pluginConfig() {
  return {
    all: () => [],
    node: () => [
      SourceMapPlugin({ sourceRoot: cwd }),
      TemplatePlugin({ templateRenderers }),
      new webpack.ProvidePlugin({
        React: 'react',
        Component: ['react', 'Component'],
        cx: 'classnames',
      }),
      UniversalPlugin({ browserConfig: browserConfig() })
    ],
    browser: () => [],
  }
}
