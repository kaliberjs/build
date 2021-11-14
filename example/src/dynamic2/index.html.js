import head from '/partials/head'
import TestUrlApp from './TestUrlApp?universal'
import TestUrlAppC from './TestUrlApp.universal'

export default function Index({ location }) {
  return (
    <html lang='en'>
      {head('Dynamic page')}
      <body>
        <TestUrlApp initialPath={location.pathname} />
        <TestUrlAppC initialPath={location.pathname} />
      </body>
    </html>
  )
}
