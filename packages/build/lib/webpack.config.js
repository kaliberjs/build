import path from 'node:path'
import log from 'loglevel'
import { findEntries } from './webpack/utils/findEntries.js'
import { templatePlugin } from './webpack/plugins/templatePlugin.js'
import { babelLoader, cssLoader } from './webpack.loaders.config.js'
import { sourceMapPlugin } from './webpack/plugins/sourceMapPlugin.js'
import config from '@kaliber/config'
import { mergeCssPlugin } from './webpack/plugins/mergeCssPlugin.js'

const logLevel = log.levels[process.env.LOG_LEVEL || '']
if (logLevel !== undefined) log.setDefaultLevel(logLevel)

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src')
const outputPath = path.resolve(cwd, 'target')

const { templateRenderers, recognizedTemplates } = getTemplateRenderers()

/** @type {import('webpack').Configuration} */
export default {
  name: 'node-compiler',
  target: 'node18',
  mode,
  context: srcDir,
  devtool: false,
  entry: collectEntries,

  output: {
    filename: '[name]',
    path: outputPath,
    library: {
     type: 'module'
    },
    clean: true,
  },
  externals: [
    ({ request }, callback) => {
      if (/^[./]/.test(request)) return callback()
      if (/^@kaliber\/build/.test(request)) return callback()
      return callback(null, `module ${request}`)
    }
  ],
  experiments: {
    outputModule: true // TODO: check if we really want this
  },
  module: {
    rules: getRules()
  },
  resolve: {
    extensions: ['.js', '.mjs', '.cjs'],
  },
  plugins: [
    sourceMapPlugin(),
    templatePlugin({ templateRenderers }),
    mergeCssPlugin(),
  ],
}

function getTemplateRenderers() {
  const templateRenderers = {
    txt: '@kaliber/build/lib/templateRenderers/txt-renderer.js',
    json: '@kaliber/build/lib/templateRenderers/json-renderer.js',
    html: '@kaliber/build/lib/templateRenderers/html-react-renderer.js',
    ...config.kaliber?.templateRenderers,
  }
  const recognizedTemplates = Object.keys(templateRenderers)
  // if (templateRenderers['raw']) throw new Error(`Can not define a renderer with the type 'raw' as it is a reserved type`)

  return { templateRenderers, recognizedTemplates }
}

async function collectEntries() {
  const entries = await findEntries({
    cwd: srcDir,
    patterns: recognizedTemplates.map(template => `**/*.${template}.js`)
  })

  log.info(`Found the following entries (node):`)
  Object.keys(entries).forEach(entry => log.info(`  - ${entry}`))

  return entries
}

function getRules() {
  return [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: babelLoader,
      resolve: {
        fullySpecified: false,
      },
    },
    {
      test: /\.css$/,
      exclude: /node_modules/,
      use: cssLoader,
    }
  ]
}
