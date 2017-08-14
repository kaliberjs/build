const loaderUtils = require('loader-utils')
const { relative } = require('path')

module.exports = ReactUniversalServerLoader

function ReactUniversalServerLoader(source, map) {
  const { enableCacheBusting } = loaderUtils.getOptions(this)
  const filename = relative(this.options.context, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/\.]/g, '_')
  return createServerCode({ importPath, scriptSrc: '/' + filename, id, enableCacheBusting })
}

function createServerCode({ importPath, scriptSrc, id, enableCacheBusting }) {
  const appScript = enableCacheBusting
    ? `|<script dangerouslySetInnerHTML={{ __html: \`
       |(function () {
       |  window.addEventListener('load', function () {
       |    const script = document.createElement('script')
       |    script.setAttribute('src', '${scriptSrc}?v=' + Date.now())
       |    script.setAttribute('defer', '')
       |    document.body.appendChild(script)
       |  })
       |}())
       |\` }} />`.split(/^[ \t]*\|/m).join('')
    : `<script defer src='${scriptSrc}?v=${Date.now()}'></script>`

  return `|import Component from './${importPath}'
          |import { renderToString } from 'react-dom/server'
          |
          |export default function WrapWithScript(props) {
          |  const content = renderToString(<Component id='${id}' {...props} />)
          |  return (
          |    <div>
          |      <div id='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }}></div>
          |      ${appScript}
          |    </div>
          |  )
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
