const { RawSource } = require('webpack-sources')
const path = require('path')
const fs = require('fs-extra')
const { appendSourceMap, evalInFork } = require('../../node-utils')
const webpack = require('webpack')
const { dynamicEntries } = require('../utils/dynamicEntries')

const p = 'kaliber.TemplatePlugin'

const templatePattern = /\.([^.]+)\.js$/
const hasFunctionExportKey = '_kaliber_hasFunctionExport'

module.exports = { TemplatePlugin }

function TemplatePlugin({ templateRenderers }) {
  const rendererEntries = Object.fromEntries(
    Object.entries(templateRenderers).map(
      ([type, path]) => [`renderers/${type}.js`, { import: [path] }]
    )
  )

  return {
    /** @param {import('webpack').Compiler} compiler */
    apply(compiler) {

      // Add the renderers as entries
      dynamicEntries(async () => rendererEntries, { compiler })

      compiler.hooks.thisCompilation.tap(p, (compilation, { normalModuleFactory }) => {
        const templateAssets = []

        // Add hasFunctionExport to module build meta
        normalModuleFactory.hooks.parser.for('javascript/auto').tap(p, addExportHook)
        normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(p, addExportHook)
        normalModuleFactory.hooks.parser.for('javascript/esm').tap(p, addExportHook)

        function addExportHook(parser) {
          parser.hooks.export.tap(p, statement => {
            if (statement?.declaration?.type !== 'FunctionDeclaration') return

            parser.state.module.buildMeta[hasFunctionExportKey] = true
          })
        }

        // Collect all chunk assets that are templates
        compilation.hooks.chunkAsset.tap(p, (chunk, filename) => {
          const [, type] = filename.match(templatePattern) || []
          if (!type || !templateRenderers[type]) return

          const hasFunctionExport = Boolean(chunk.entryModule.buildMeta[hasFunctionExportKey])

          templateAssets.push({ filename, hasFunctionExport, type })
        })

        // Handle processing of templates
        compilation.hooks.processAssets.tapPromise(
          { name: p, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
          async assets => {
            for (const { filename, hasFunctionExport, type } of templateAssets) {
              if (hasFunctionExport) handleDynamicTemplate({ compilation, filename, type })
              else await handleStaticTemplate({ compilation, filename, type })
            }
          }
        )
      })
    }
  }
}

function handleDynamicTemplate({ compilation, filename, type }) {
  const templateFilename = filename.replace(templatePattern, `.${type}.template.js`)

  compilation.renameAsset(filename, templateFilename)
  compilation.emitAsset(filename,
    new RawSource(`
      const envRequire = process.env.NODE_ENV === 'production' ? require : require('import-fresh')
      const templateModule = envRequire('./${templateFilename}')
      const rendererModule = envRequire('./renderers/${type}')
      const template = templateModule.default || templateModule
      const renderer = rendererModule.default || rendererModule

      Object.assign(render, template)

      module.exports = render

      function render(props) {
        return renderer(template(props))
      }
    `)
  )
}

async function handleStaticTemplate({ compilation, filename, type }) {
  const template = await createEvalFile(filename)
  const renderer = await createEvalFile(`renderers/${type}.js`)

  try {
    const result = await evalInFork({ template, renderer })

    compilation.deleteAsset(filename)
    compilation.emitAsset(filename.replace(templatePattern, `.${type}`), new RawSource(result))
  } finally {
    await fs.remove(template)
    await fs.remove(renderer)
  }

  async function createEvalFile(filename) {
    const evalFilename = path.resolve('.kaliber-eval', filename)
    const sourceAndMap = compilation.getAsset(filename).source.sourceAndMap()

    await fs.outputFile(evalFilename, appendSourceMap(filename, sourceAndMap))

    return evalFilename
  }
}

function mapKeys(o, f) {
  return Object.fromEntries(
    Object.entries(o).map(([k, v]) => [f(k), v])
  )
}
