import head from './partials/head'
import Test from './partials/Test?universal'
import styles from './index.html.js.css'
import config from '@kaliber/config'
import polyfill from '@kaliber/build/lib/polyfill'

export default (
  <html lang='en'>
    { head('Some title', polyfill) }
    <body>
      <div className={styles.background} />
      <p className={styles.test2}>Test</p>
      <span className={styles.test}>Something</span>
      <Test soep='kip' initialMessage='loading' clientConfig={config.client} />
    </body>
  </html>
)
