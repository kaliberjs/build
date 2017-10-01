const { relative } = require('path')

module.exports = ReactUniversalServerLoader

function ReactUniversalServerLoader(source, map) {
  const filename = relative(this.options.context, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/\.]/g, '_')
  return createServerCode({ importPath, id })
}

function createServerCode({ importPath, id }) {
  return `|import Component from './${importPath}'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |
          |assignStatics(WrapWithScript, Component)
          |
          |export default function WrapWithScript(props) {
          |  const content = renderToString(<Component id='${id}' {...props} />)
          |  return (
          |    <div>
          |      <div id='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }}></div>
          |    </div>
          |  )
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
