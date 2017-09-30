import head from 'partials/head'
import shared from '/partials/shared'
import SharedComponent from '/partials/SharedComponent?universal'

export default function() {
  return (
    <html>{head('test')}
      <body>
        {shared}
        <SharedComponent />
        Test
      </body>
    </html>
  )
}
