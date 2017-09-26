import head from 'partials/head'
import shared from '/partials/shared'
import SharedComponent from '/partials/SharedComponent?universal'

export default (
  <html>{head('test')}<body>
    {shared}
    <SharedComponent />
    Test
    </body></html>
)
