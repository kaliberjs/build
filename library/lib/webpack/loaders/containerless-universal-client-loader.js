const { relative } = require('path')
const { OriginalSource } = require('webpack-sources')

module.exports = containerlessUniversalClientLoader

function containerlessUniversalClientLoader(source, map, meta) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  const wrapper = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')
  const code = createClientCode({ importPath, id, wrapper })
  const generated = new OriginalSource(code, this.resourcePath + '?generated').sourceAndMap()
  this.callback(null, generated.source, generated.map, meta)
}

function createClientCode({ importPath, id, wrapper: wrapperPath }) {
  const hasWrapper = Boolean(wrapperPath)

  return `
    import Component from './${importPath}'
    import { findComponents, hydrate, reload } from '@kaliber/build/lib/universalComponents'
    ${hasWrapper ? `import Wrapper from '${wrapperPath}'` : ''}

    const components = findComponents({ componentName: '${id}' })
    let renderInfo = components.map(componentInfo => {
      const { props } = componentInfo
      return {
        componentInfo,
        renderInfo: hydrate(
          ${wrap(hasWrapper, 'Wrapper', '<Component {...props} />')},
          componentInfo
        ),
      }
    })

    if (module.hot) {
      require('@kaliber/build/lib/hot-module-replacement-client')
      module.hot.accept('./${importPath}', () => {
        renderInfo = renderInfo.map(({ componentInfo, renderInfo }) => {
          const { props, endNode } = componentInfo, { container, renderedNodes } = renderInfo
          return {
            componentInfo,
            renderInfo: hydrate(
              ${wrap(hasWrapper, 'Wrapper', '<Component {...props} />')},
              { nodes: renderedNodes, endNode, container }
            ),
          }
        })
      })
    }
  `
}

function wrap(condition, wrapper, body) {
  return condition
    ? `<${wrapper} {...props}>${body}</${wrapper}>`
    : body
}

function get(o, path) {
  return path.split('.').reduce((result, key) => result && result[key], o )
}
