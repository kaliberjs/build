const { relative } = require('path')
const { OriginalSource } = require('webpack-sources')

module.exports = ReactContainerlessUniversalClientLoader

function ReactContainerlessUniversalClientLoader(source, map, meta) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  const wrapper = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')
  const code = createClientCode({ importPath, id, wrapper })
  const generated = new OriginalSource(code, this.resourcePath + '?generated').sourceAndMap()
  this.callback(null, generated.source, generated.map, meta)
}

function createClientCode({ importPath, id, wrapper: wrapperPath }) {
  const component = '<Component {...props} />'
  const { wrapper, wrapped } = {
    wrapper: wrapperPath ? `import Wrapper from '${wrapperPath}'` : '',
    wrapped: wrapperPath ? `<Wrapper {...props}>${component}</Wrapper>` : component,
  }

  return `|import Component from './${importPath}'
          |import { findComponents, hydrate, reload } from '@kaliber/build/lib/universalComponents'
          |${wrapper}
          |
          |const components = findComponents({ componentName: '${id}' })
          |const renderResults = components.map(componentInfo => {
          |  const { props } = componentInfo
          |  return { props, result: hydrate(${wrapped}, componentInfo) }
          |})
          |
          |if (module.hot) {
          |  require('@kaliber/build/lib/hot-module-replacement-client')
          |  module.hot.accept('./${importPath}', () => {
          |    renderResults.forEach(({ props, result }) => result.update(${wrapped}))
          |  })
          |}
          |`.split(/^[ \t]*\|/m).join('')
}

function get(o, path) {
  return path.split('.').reduce((result, key) => result && result[key], o )
}
