import path from 'node:path'
import log from 'loglevel'
import { findEntries } from './webpack/utils/findEntries.js'
import { templatePlugin } from './webpack/plugins/templatePlugin.js'

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
  experiments: {
    outputModule: true // TODO: check if we really want this
  },
  plugins: [
    templatePlugin({ templateRenderers }),
  ]
}

function getTemplateRenderers() {
  const templateRenderers = {
    txt: '@kaliber/build/lib/templateRenderers/txt-renderer',
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
