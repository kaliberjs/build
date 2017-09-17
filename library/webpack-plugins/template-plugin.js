const { RawSource } = require('webpack-sources')
const { evalWithSourceMap, withSourceMappedError } = require('../lib/node-utils')

// make this one about any type of template (xml, txt, html, etc.)
module.exports = templatePlugin

function templatePlugin(renderers) {

  const templatePattern = /\.([^\.]+)\.js$/ // {name}.{template type}.js

  function createRenderInfo(type) {
    return {
      type,
      renderer: renderers[type] || renderers.default,
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
    apply: compiler => {

      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {

        normalModuleFactory.plugin('after-resolve', (data, done) => {
          const { loaders, resourceResolveData: { query, path } } = data
          const renderInfo = getRenderInfo(path)
          if (renderInfo && query != '?template-source') {
            const { renderer } = renderInfo
            const templateLoader = require.resolve('../webpack-loaders/template-loader')
            loaders.push({ loader: templateLoader, options: { renderer } })
          }

          done(null, data)
        })

        compilation.plugin('optimize-assets', (assets, done) => {
          const renders = []

          for (const name in assets) {
            const entry = compiler.options.entry[name]
            const renderInfo = getRenderInfo(entry)
            if (!entry || !renderInfo) continue

            const asset = assets[name]

            delete assets[name]

            const { srcExt, targetExt, templateExt } = renderInfo
            const outputName = name.replace(templatePattern, '')

            const source = asset.source()
            const createMap = () => asset.map()
            renders.push(
              new Promise(resolve => resolve(evalWithSourceMap(source, createMap))) // inside a promise to catch errors
                .then(({ template, renderer }) => template ? { template, renderer } : Promise.reject(new Error(`${name} did not export a template`)))
                .then(({ template, renderer }) => typeof template === 'function'
                  ? [[srcExt, createDynamicTemplate(outputName, templateExt, createMap)], [templateExt, asset]]
                  : [[targetExt, createStaticTemplate(renderer, template, createMap)]]
                )
                .then(files => { files.forEach(([ext, result]) => { assets[outputName + ext] = result }) })
                .catch(e => { compilation.errors.push(`Template plugin (${name}): ${e.message}`) })
            )
          }

          Promise.all(renders).then(_ => { done() }).catch(done)
        })
      })
    }
  }
}

function createStaticTemplate(renderer, template, createMap) {
  return new RawSource(withSourceMappedError(createMap, () => renderer(template)))
}

function createDynamicTemplate(name, ext, createMap) {
  return new RawSource(
    `|const createMap = () => (${JSON.stringify(createMap())})
     |
     |const { withSourceMappedError } = require('@kaliber/build/lib/node-utils')
     |
     |if (process.env.NODE_ENV !== 'production') delete require.cache[require.resolve('./${name}${ext}')]
     |const { template, renderer } = withSourceMappedError(createMap, () => require('./${name}${ext}'))
     |
     |Object.assign(render, template)
     |
     |module.exports = render
     |
     |function render(props) {
     |  return withSourceMappedError(createMap, () => renderer(template(props)))
     |}
     |`.split(/^[ \t]*\|/m).join('')
  )
}
