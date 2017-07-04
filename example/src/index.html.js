import 'global.css'
import head from './partials/head'
import Test from './partials/Test?universal'
import styles from './index.html.js.css'

main.routes = {
  match: ({ pathname }) => pathname === '/'
    ? Promise.resolve({ status: 200, data: 'root' })
    : pathname === '/error'
    ? Promise.reject(new Error('fake error'))
    : Promise.resolve({ status: 400, data: 'missing' })
}

export default main

function main ({ location, data }) {
  return (
    <html>
      { head('Rendered on server') }
      <body>
        <div className={styles.background} />
        <p className={styles.test2}>
          Test
          { JSON.stringify(location) }
          <br />
          { data }
        </p>
        <span className={styles.test}>Something</span>
        <Test soep='kip' />
        <div className={styles.multipleBackground}></div>
      </body>
    </html>
  )
}
