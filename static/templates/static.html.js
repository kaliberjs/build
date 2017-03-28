import head from './partials/head'
import Test from './partials/Test?universal'
import styles from './index.html.js.css'

export default (
  <html>
    { head("Some title") }
    <body>
      <div className={styles.background} />
      <p className={styles.test2}>Test</p>
      <span className={styles.test}>Something</span>
      <Test soep='kip' />
    </body>
  </html>
)