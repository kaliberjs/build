import path from 'node:path'
import fs from 'node:fs/promises'
import url from 'node:url'

import webpack from 'webpack'
import sources from 'webpack-sources'

import { evalInFork } from '../utils/evalInFork.js'
import { appendSourceMap } from '../utils/appendSourceMap.js'
import { dynamicEntries } from '../utils/dynamicEntries.js'

const { RawSource } = sources
const p = 'kaliber.TemplatePlugin'

const templatePattern = /\.([^.]+)\.js$/

export function templatePlugin({ templateRenderers }) {
  const rendererEntries = Object.fromEntries(
    Object.entries(templateRenderers).map(
      ([type, path]) => [`renderers/${type}.js`, { import: [path] }]
    )
  )

  /** @param {import('webpack').Compiler} compiler */
  return compiler => {

    // Add the renderers as entries
    dynamicEntries(async () => rendererEntries, { compiler })

    // Hook into the compilation
    compiler.hooks.thisCompilation.tap(p, (compilation, { normalModuleFactory }) => {
      const templateAssets = []
      const modulesWithFunctionExport = new Set()

      determineModuleFunctionExports({ normalModuleFactory, bookkeeping: modulesWithFunctionExport })

      collectTemplateAssets({ compilation, modulesWithFunctionExport, basket: templateAssets })

      processTemplates({ compilation, templateAssets })
    })
  }

  /**
   * @param {{
  *   normalModuleFactory: ReturnType<webpack.Compiler['createNormalModuleFactory']>,
  *   bookkeeping: Set<webpack.Module>,
  * }} args
  */
  function determineModuleFunctionExports({ normalModuleFactory, bookkeeping }) {

        // Determine which modules export functions
        normalModuleFactory.hooks.parser.for('javascript/auto').tap(p, addExportHook)
        normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(p, addExportHook)
        normalModuleFactory.hooks.parser.for('javascript/esm').tap(p, addExportHook)

        /** @param {webpack.javascript.JavascriptParser} parser */
        function addExportHook(parser) {
          parser.hooks.export.tap(p, statement => {
            if (statement.type === 'ExportAllDeclaration') return
            if (statement.declaration?.type !== 'FunctionDeclaration') return

            bookkeeping.add(parser.state.module)
          })
        }
  }

  /**
  * @param {{
  *   compilation: webpack.Compilation,
  *   modulesWithFunctionExport: Set<webpack.Module>,
  *   basket: Array<{ filename: string, hasFunctionExport: boolean, type: string }>,
  * }} args
  */
  function collectTemplateAssets({ compilation, modulesWithFunctionExport, basket  }) {

    // Collect all chunk assets that are templates
    compilation.hooks.chunkAsset.tap(p, (chunk, filename) => {
      const [, type] = filename.match(templatePattern) || []
      if (!type || !templateRenderers[type]) return

      const [entryModule, ...otherEntryModules] =
        compilation.chunkGraph.getChunkEntryModulesIterable(chunk)

      if (otherEntryModules.length)
        throw new Error(`Do no know how to deal with more than one entry module`)

      const hasFunctionExport = modulesWithFunctionExport.has(entryModule)
      basket.push({ filename, hasFunctionExport, type })
    })
  }
}

 /**
  * @param {{
 *   compilation: webpack.Compilation,
 *   templateAssets: Array<{ filename: string, hasFunctionExport: boolean, type: string }>,
 * }} args
 */
function processTemplates({ compilation, templateAssets }) {
  // Handle processing of templates
  compilation.hooks.processAssets.tapPromise(
    { name: p, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
    async assets => {
      for (const { filename, hasFunctionExport, type } of templateAssets) {
        console.log('process template')
          try {
            if (hasFunctionExport) handleDynamicTemplate({ compilation, filename, type })
            else await handleStaticTemplate({ compilation, filename, type })
          } catch (e) {
            // TODO: check what we need here - webpack does not handle exception causes
            // console.error(e) // we log the error because webpack does not handle error reporting well enough
            // console.error(e.stack)
            // console.error('\n\n\n')
            throw new Error(`Problem compiling ${hasFunctionExport ? 'dynamic' : 'static'} template ${filename}\n--- cause ---\n${e}`, { cause: e })
          }
        }
    }
  )
}

function handleDynamicTemplate({ compilation, filename, type }) {
  // const templateFilename = filename.replace(templatePattern, `.${type}.template.js`)

  // compilation.renameAsset(filename, templateFilename)
  // compilation.emitAsset(filename,
  //   new RawSource(`
  //     const envRequire = process.env.NODE_ENV === 'production' ? require : require('import-fresh')
  //     const templateModule = envRequire('./${templateFilename}')
  //     const rendererModule = envRequire('./renderers/${type}')
  //     const template = templateModule.default || templateModule
  //     const renderer = rendererModule.default || rendererModule

  //     Object.assign(render, template)

  //     module.exports = render

  //     function render(props) {
  //       return renderer(template(props))
  //     }
  //   `)
  // )
}

async function handleStaticTemplate({ compilation, filename, type }) {
  const template = await createEvalFile(filename)
  const renderer = await createEvalFile(`renderers/${type}.js`)

  try {
    const result = await evalInFork({
      javascript: getRenderTemplateInForkScriptPath(),
      message: { template, renderer },
    })

    compilation.deleteAsset(filename)
    compilation.emitAsset(filename.replace(templatePattern, `.${type}`), new RawSource(result))
  } finally {
    await fs.rm(template)
    await fs.rm(renderer)
  }

  async function createEvalFile(filename) {
    const sourceAndMap = compilation.getAsset(filename).source.sourceAndMap()

    const evalFilenamePath = path.resolve('.kaliber-eval', filename)
    const evalDirPath = path.dirname(path.resolve(evalFilenamePath))
    await fs.mkdir(evalDirPath, { recursive: true }) // ensure the directory exists
    await fs.writeFile(evalFilenamePath, appendSourceMap(filename, sourceAndMap))

    return evalFilenamePath
  }
}

function getRenderTemplateInForkScriptPath() {
  const dirName = path.dirname(url.fileURLToPath(import.meta.url));
  const renderTemplateScript = path.join(dirName, '../utils/renderTemplateInFork.js')

  return renderTemplateScript
}
