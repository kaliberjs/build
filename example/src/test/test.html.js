import head from '/partials/head'
import shared from '/partials/shared'
import '/partials/Test?universal'
import '/partials/Test.universal'
import SharedComponent from '/partials/SharedComponent?universal'
import SharedComponentC from '/partials/SharedComponent.universal'
import './index.css'

export default (
  <html lang='en'>{head('test')}
    <body>
      {shared}
      <SharedComponent />
      <SharedComponentC />
      Test
      <div>not red</div>
      <test-element>
        <div>red</div>
      </test-element>
    </body>
  </html>
)
