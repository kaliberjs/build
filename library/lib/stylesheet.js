/* global __webpack_css_chunk_hashes__, __webpack_public_path__, __webpack_websocket_port__, __webpack_chunkname__ */

/*
  Links to the stylesheet and adds hot reloading for stylesheets
*/

import hotCssReplacementClient from './hot-css-replacement-client?transpiled-javascript-string'

const isWatch = process.env.WATCH

export default __webpack_css_chunk_hashes__
  .map((cssHash, index) => <link href={`${__webpack_public_path__}${cssHash}.css`} rel='stylesheet' type='text/css' key={'stylesheet_' + index} />)
  .concat(isWatch && createHotReload(__webpack_websocket_port__, __webpack_css_chunk_hashes__, __webpack_chunkname__))
  .filter(Boolean)

function createHotReload(port, cssHashes, chunkName) {
  return <script
    key='stylesheet_hotCssReplacementClient'
    dangerouslySetInnerHTML={{
      __html: `(${hotCssReplacementClient})(${port}, ${JSON.stringify(cssHashes)}, '${chunkName}')`
    }}/>
}
