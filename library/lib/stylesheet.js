/*
  Links to the stylesheet and adds hot reloading for stylesheets
*/

import hotCssReplacementClient from 'raw-loader!./hot-css-replacement-client'

const isWatch = process.env.WATCH

export default [
  <link href={`/${__webpack_css_chunk_hash__}.css`} rel='stylesheet' type='text/css' key='hotCssReplacementClient_0' />,
  isWatch && createHotReload(__webpack_websocket_port__, __webpack_css_chunk_hash__, __webpack_chunkname__)
].filter(Boolean)

function createHotReload(port, cssHash, chunkName) {
  return <script
    key='hotCssReplacementClient_1'
    dangerouslySetInnerHTML={{
      __html: `(${hotCssReplacementClient})(${port}, '${cssHash}', '${chunkName}')`
    }}/>
}
