import head from '/partials/head'
import TestUrlApp from './TestUrlApp?universal'

export default function Index({ location }) {
  return (
    <html lang='en'>
      {head('Dynamic page')}
      <body>
        <TestUrlApp initialPath={location.pathname} />
      </body>
    </html>
  )
}
