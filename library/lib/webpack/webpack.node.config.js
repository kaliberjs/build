const config = /** @type {any} */ (require('@kaliber/config'))
const { findEntries } = require('./findEntries')
const configuredTemplateRenderers = config?.kaliber?.templateRenderers || {}
const path = require('path')
const { TemplatePlugin } = require('./plugins/TemplatePlugin')
const { AbsolutePathResolverPlugin } = require('./resolver/AbsolutePathResolverPlugin')
const webpack = require('webpack')
const { SourceMapPlugin } = require('./plugins/SourceMapPlugin')

const templateRenderers = Object.assign({
  html: '@kaliber/build/lib/html-react-renderer',
  txt: '@kaliber/build/lib/txt-renderer',
  json: '@kaliber/build/lib/json-renderer'
}, configuredTemplateRenderers)
const recognizedTemplates = Object.keys(templateRenderers)

module.exports = ({ mode, srcDir, log, cwd, publicPath, outputPath }) => ({
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
      if (/^(@kaliber\/build|@kaliber\/elasticsearch)/.test(request)) return callback()

      return callback(null, `commonjs2 ${request}`)
    }
  ],
  resolve: {
    plugins: [AbsolutePathResolverPlugin({ path: srcDir })], //, fragmentResolverPlugin()],
  },
  resolveLoader: {
    modules: [
      path.resolve(__dirname, './loaders'),
      'node_modules'
    ]
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false, // not sure if the following comment is true: // this needs to be false, any other value will cause .babelrc to interfere with these settings
            presets: [
              '@babel/preset-react'
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
            ],
          }
        }
      },
      {
        test: /\.raw\.[^.]+$/,
        type: 'asset/source',
      },
      {
        test: /\.css$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ]
  },
  plugins: [
    SourceMapPlugin({ sourceRoot: cwd }),
    TemplatePlugin({ templateRenderers }),
    new webpack.ProvidePlugin({
      React: 'react',
      Component: ['react', 'Component'],
      cx: 'classnames',
    }),
  ]
})
