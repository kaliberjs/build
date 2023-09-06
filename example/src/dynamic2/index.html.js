import head from '/partials/head'
import TestUrlAppN from './TestUrlApp'
import TestUrlApp from './TestUrlApp?universal'
import TestUrlAppC from './TestUrlApp.universal'
import { ClientConfigProvider } from '/ClientConfig'
import config from '@kaliber/config'

export default function Index({ location }) {
  return (
    <html lang='en'>
      {head('Dynamic page')}
      <body>
        <ClientConfigProvider config={config.client}>
          Non-universal
          <TestUrlAppN initialPath={location.pathname} />
          Universal
          <TestUrlApp initialPath={location.pathname} expectFailure />
          Containerless universal
          <TestUrlAppC initialPath={location.pathname} />
        </ClientConfigProvider>
      </body>
    </html>
  )
}
