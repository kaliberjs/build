const { relative } = require('path')

module.exports = ReactUniversalServerLoader

function ReactUniversalServerLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  return createServerCode({ importPath, id, filename })
}

function createServerCode({ importPath, id, filename }) {
  return `|import Component from './${importPath}'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |
          |assignStatics(WrapWithScript, Component)
          |
          |export default function WrapWithScript({ universalContainerProps, ...props }) {
          |  const content = renderToString(<Component id='${id}' {...props} />)
          |  return (
          |    <React.Fragment>
          |      <div {...universalContainerProps} id='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }} />
          |      <script defer src={__webpack_public_path__ + __webpack_js_chunk_information__.manifest['${filename}'].filename} />
          |    </React.Fragment>
          |  )
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
