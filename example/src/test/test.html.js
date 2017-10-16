import head from '/partials/head'
import shared from '/partials/shared'
import '/partials/Test?universal'
import SharedComponent from '/partials/SharedComponent?universal'

export default function() {
  return (
    <html lang='en'>{head('test')}
      <body>
        {shared}
        <SharedComponent />
        Test
      </body>
    </html>
  )
}
