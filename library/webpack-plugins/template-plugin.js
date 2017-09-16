const { RawSource } = require('webpack-sources')
const { evalWithSourceMap } = require('../lib/node-utils')

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

        // render templates to html -- we should probably do this earlier, before the uglifier / babili kicks in
        // additional-assets
        compilation.plugin('optimize-assets', (assets, done) => {
          const renders = []

          for (const name in assets) {
            const entry = compiler.options.entry[name]
            const renderInfo = getRenderInfo(entry)
            if (!entry || !renderInfo) continue

            const asset = assets[name]

            delete assets[name]

            const { srcExt, targetExt, templateExt } = renderInfo

            const source = asset.source()
            const createMap = () => asset.map()
            // we need to check sourcemaps
            renders.push(
              evalWithSourceMap(source, createMap)
                .then(({ template, renderer }) => template ? { template, renderer } : Promise.reject(new Error(`${name} did not export a template`)))
                .then(({ template, renderer }) => typeof template === 'function'
                  ? [[srcExt, createDynamicTemplate(name, templateExt, createMap)], [templateExt, asset]]
                  : [[targetExt, createStaticTemplate(renderer, template)]]
                )
                .then(files => { files.forEach(([ext, result]) => { assets[name + ext] = result }) })
                .catch(e => { compilation.errors.push(`Template plugin (${name}${srcExt}): ${e.message}`) })
            )
          }

          Promise.all(renders).then(_ => { done() }).catch(done)
        })
      })
    }
  }
}

function createStaticTemplate(renderer, template) {
  return new RawSource(renderer(template))
}

function createDynamicTemplate(name, ext, createMap) {
  return new RawSource(
    `|if (process.env.NODE_ENV !== 'production') delete require.cache[require.resolve('./${name}${ext}')]
     |const { template, renderer } = require('./${name}${ext}')
     |const { withSourceMappedError } = require('@kaliber/build/lib/node-utils')
     |
     |const createMap = () => (${JSON.stringify(createMap())})
     |
     |Object.assign(render, template)
     |
     |module.exports = render
     |
     |function render(props) {
     |  return withSourceMappedError(createMap, () => template(props))
     |     .then(template => renderer(template))
     |}
     |`.split(/^[ \t]*\|/m).join('')
  )
}
