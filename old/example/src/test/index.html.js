import head from '/partials/head'
import './test.css'
import Test from '/partials/Test?universal'
import TestC from '/partials/Test.universal'
import config from '@kaliber/config'
import shared from '/partials/shared'
import SharedComponent from '/partials/SharedComponent?universal'
import SharedComponentC from '/partials/SharedComponent.universal'

export default (
  <html lang='en'>
    {head('test')}
    <body>
      {shared}
      <SharedComponent />
      <SharedComponentC />
      Test
      <Test clientConfig={config.client} />
      <TestC clientConfig={config.client} />
    </body>
  </html>
)
