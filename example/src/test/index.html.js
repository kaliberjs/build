import head from '/partials/head'
import './test.css'
import Test from '/partials/Test?universal'
import config from '@kaliber/config'
import shared from '/partials/shared'
import SharedComponent from '/partials/SharedComponent?universal'
import polyfill from '@kaliber/build/lib/polyfill'

export default (
  <html lang='en'>
    {head('test', polyfill)}
    <body>
      {shared}
      <SharedComponent />
      Test
      <Test clientConfig={config.client} />
    </body>
  </html>
)
