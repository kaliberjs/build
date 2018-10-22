import head from '/partials/head'
import shared from '/partials/shared'
import '/partials/Test?universal'
import SharedComponent from '/partials/SharedComponent?universal'
import polyfill from '@kaliber/build/lib/polyfill'

export default (
  <html lang='en'>{head('test', polyfill)}
    <body>
      {shared}
      <SharedComponent />
      Test
    </body>
  </html>
)
