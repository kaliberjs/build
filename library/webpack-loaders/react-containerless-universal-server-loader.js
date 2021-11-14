const { relative } = require('path')

module.exports = ReactContainerlessUniversalServerLoader

function ReactContainerlessUniversalServerLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  return createServerCode({ importPath, id })
}

function createServerCode({ importPath, id }) {
  return `|import Component from './${importPath}?original'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |import { ComponentServerWrapper } from '@kaliber/build/lib/universalComponents'
          |
          |assignStatics(WrappedForServer, Component)
          |
          |export default function WrappedForServer(props) {
          |  const componentName = '${id}'
          |  const renderedComponent = renderToString(<Component {...props} />)
          |  return <ComponentServerWrapper {...{ componentName, props, renderedComponent }} />
          |}
          |`.replace(/^[\s]*\|/mg, '')
}
