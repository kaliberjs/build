import head from '/partials/head'
import TestUrlApp from './TestUrlApp?universal'
import TestUrlAppC from './TestUrlApp.universal'

export default (
  <html lang='en'>
    {head('Dynamic page')}
    <body>
      <TestUrlApp />
      <TestUrlAppC />
    </body>
  </html>
)
