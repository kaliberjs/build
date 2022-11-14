/*
  This plugin adds a special loader to all files that have the `*.*.js` (`{name}.{template type}.js`)
  pattern in their filename. This loader loads both the template and the renderer, picked from the
  list of renderers which are passed in as a configuration, for example:

  {
    'html': '@kaliber/build/lib/react-html-renderer'
  }

  It then does one of two things:

  1. If the template returns a function, a new function is created that executes the given template with
     the given props and passes that result to the renderer. When an error occurs in this process, the
     stack trace is source mapped.
  2. If the template does not return a function the value is passed to the renderer and the result is
     stored in a file with the `.js` removed (`{name}.{template type}`)
*/

const { RawSource } = require('webpack-sources')
const path = require('path')
const { evalInFork } = require('../lib/node-utils')
const { WebpackError, NormalModule } = require('webpack')
const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')

const p = 'template-plugin'
const isFunctionKey = `${p} - export is function`

module.exports = function templatePlugin(renderers) {

  if (renderers['raw']) throw new Error(`Can not define a renderer with the type 'raw' as it is a reserved type`)

  const templatePattern = /\.([^./]+)\.js$/ // {name}.{template type}.js

  function createRenderInfo(type) {
    const renderer = renderers[type]
    return renderer && {
      type,
      renderer,
      srcExt: `.${type}.js`,
      targetExt: `.${type}`,
      templateExt: `.template.${type}.js`
    }
  }

  function getRenderInfo(path) {
    const [, type] = templatePattern.exec(path) || []

    return type && createRenderInfo(type)
  }

  return {
    /** @param {import('webpack').Compiler} compiler */
    apply: compiler => {

      /*
        Supply the template-loader to any resource that matches the `template pattern` in it's
        file name. It will not do this to resources that have been marked with `?template-source`
        as it would cause infinite loops
      */
      compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {
        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { loaders, resourceResolveData: { query, path } } = data.createData
          const renderInfo = getRenderInfo(path)

          if (renderInfo && query !== '?template-source') {
            const { renderer } = renderInfo
            const templateLoader = require.resolve('../webpack-loaders/template-loader')
            loaders.push({
              loader: templateLoader,
              options: { renderer },
              type: undefined,
              ident: 'added by webWorkerPlugin because of ?webworker',
            })
          }
        })

        /*
          Use the parser to determine if the template returns a function
        */
        normalModuleFactory.hooks.parser.for('javascript/auto').tap(p, withParser)
        normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(p, withParser)
        normalModuleFactory.hooks.parser.for('javascript/esm').tap(p, withParser)

        function withParser(parser) {
          parser.hooks.export.tap(p, statement => {
            if (!statement.declaration || statement.declaration.type !== 'FunctionDeclaration') return
            if (!parser.state.module.request.endsWith('?template-source')) return

            const { buildInfo } = parser.state.module
            buildInfo[isFunctionKey] = true
          })
        }
      })

      compiler.hooks.compilation.tap(p, compilation => {

        /*
          Add `isFunction` asset info to templates
        */
        compilation.hooks.chunkAsset.tap(p, (chunk, file) => {
          const entryModules = Array.from(compilation.chunkGraph.getChunkEntryModulesIterable(chunk))
          entryModules.forEach(entryModule => {
            if (!(entryModule instanceof NormalModule)) return

            const dependency = entryModule.dependencies.find(x =>
              x instanceof ModuleDependency && x.request.endsWith('?template-source')
            )

            const module = dependency && compilation.moduleGraph.getModule(dependency)
            if (!module) return

            const assetInfo = compilation.assetsInfo.get(file)
            assetInfo[isFunctionKey] = module.buildInfo[isFunctionKey]
          })
        })

        /*
          Determines if a given asset has the 'template pattern'. If the template is a function
          it's turned into a dynamic template (a javascript function that accepts props). If it's
          not a function the template is rendered directly.

          For static templates the `x.type.js` file is removed and rendered into `x.type`.

          For dynamic templates some machinery is placed into `x.type.js` and the template
          itself combined with it's renderer is placed into `x.template.type.js`. The
          result (in `x.type.js`) is a simple function with one argument that can be called
          to obtain a rendered template.
        */
        compilation.hooks.optimizeAssets.tapPromise(p, async assets => {
          const renders = []

          const chunksByName = Array.from(compilation.chunks).reduce(
            (result, chunk) => ((result[chunk.name] = chunk), result),
            {}
          )

          for (const name in assets) {
            const { import: [entry] = [] } = compiler.options.entry[name] || {}
            const renderInfo = getRenderInfo(entry)
            if (!entry || !renderInfo) continue

            const asset = assets[name]

            delete assets[name]

            const { srcExt, targetExt, templateExt } = renderInfo
            const outputName = name.replace(templatePattern, '')
            const assetInfo = compilation.assetsInfo.get(name)
            const isFunction = assetInfo && assetInfo[isFunctionKey]

            const { source, map } = asset.sourceAndMap()

            renders.push(
              Promise.resolve().then(async () => { // no await in the body of a `for`
                try {
                  /** @type {Array<[string, typeof asset]>} */
                  const files = isFunction
                    ? [
                      [srcExt, createDynamicTemplate(path.basename(outputName), templateExt)],
                      [templateExt, asset]
                    ]
                    : [
                      [targetExt, await createStaticTemplate(name, source, map)]
                    ]

                  files.forEach(([ext, result]) => {
                    const filename = outputName + ext
                    if (filename !== name) (x => x && x.files.add(filename))(chunksByName[name])
                    assets[filename] = result
                  })
                } catch (e) {
                  compilation.errors.push(new WebpackError(`Template plugin (${name}): ${e.message}`))
                }
              })
            )
          }

          await Promise.all(renders)
        })
      })
    }
  }
}

async function createStaticTemplate(name, source, map) {
  return new RawSource(await evalInFork(name, source, map))
}

function createDynamicTemplate(name, ext) {
  return new RawSource(
    `|const envRequire = process.env.NODE_ENV === 'production' ? require : require('import-fresh')
     |const { template, renderer } = envRequire('./${name}${ext}')
     |
     |Object.assign(render, template)
     |
     |module.exports = render
     |
     |function render(props) {
     |  return renderer(template(props))
     |}
     |`.replace(/^[ \t]*\|/gm, '')
  )
}
