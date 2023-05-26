const { relative } = require('path')

module.exports = ReactUniversalServerLoader

function ReactUniversalServerLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  return createServerCode({ importPath, id })
}

function createServerCode({ importPath, id }) {
  return `|import Component from './${importPath}'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |
          |assignStatics(WrapWithScript, Component)
          |
          |export default function WrapWithScript({ universalContainerProps, ...props }) {
          |  const content = renderToString(<Component {...props} />)
          |  return (
          |    <div {...universalContainerProps} data-componentid='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }} />
          |  )
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
