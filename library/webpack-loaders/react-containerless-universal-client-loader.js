const { relative } = require('path')
const { OriginalSource } = require('webpack-sources')

module.exports = ReactContainerlessUniversalClientLoader

function ReactContainerlessUniversalClientLoader(source, map, meta) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  const code = createClientCode({ importPath, id })
  const generated = new OriginalSource(code, this.resourcePath + '?generated').sourceAndMap()
  this.callback(null, generated.source, generated.map, meta)
}

function createClientCode({ importPath, id }) {
  return `|import Component from './${importPath}'
          |import { findComponents, hydrate, reload } from '@kaliber/build/lib/universalComponents'
          |
          |const components = findComponents({ componentName: '${id}' })
          |let renderInfo = components.map(componentInfo => ({
          |  componentInfo,
          |  renderInfo: hydrate(<Component {...componentInfo.props} />, componentInfo),
          |}))
          |
          |if (module.hot) {
          |  require('@kaliber/build/lib/hot-module-replacement-client')
          |  module.hot.accept('./${importPath}', () => {
          |    renderInfo = renderInfo.map(({ componentInfo, renderInfo }) => {
          |      const { props, endNode } = componentInfo, { container, renderedNodes } = renderInfo
          |      return {
          |        componentInfo,
          |        renderInfo: hydrate(<Component {...props} />, { nodes: renderedNodes, endNode, container }),
          |      }
          |    })
          |  })
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
