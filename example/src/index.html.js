import './global.css'
import 'normalize.css'
import head from '/partials/head'
import Test from './partials/Test?universal'
import Test2 from './test/Test2?universal'
import styles from './index.html.js.css'
import publicSvg from '/public/public.svg'
import config from '@kaliber/config'
import firebase from 'firebase-admin'
import bg1 from './bg1.jpg'
import SharedComponent from '/partials/SharedComponent?universal'
import '/partials/NotRendered?universal'
import '/test.entry.css'

main.routes = {
  match: ({ pathname }, request) => pathname === '/'
    ? getMessage().then(message => ({ status: 200, data: { message, hostname: request.hostname } }))
    : pathname === '/error'
    ? Promise.reject(new Error('fake error'))
    : pathname === '/redirect'
    ? { status: 302, headers: { 'Location': '/redirect-target' } }
    : { status: 404, data: { message: 'missing' } }
}

function getMessage() {
  return getApp().database().ref('read-only').child('message').once('value').then(snap => snap.val())

  function getApp() {
    const name = 'build-example-app'
    try { return firebase.app(name) } catch (e) {
      const { credentials, databaseURL } = config.server.firebase
      return firebase.initializeApp(
        {
          credential: firebase.credential.cert(credentials),
          databaseURL
        },
        name
      )
    }
  }
}

export default function main ({ location, data }) {
  if (!data) return null
  return (
    <html lang='en'>
      {head('Rendered on server')}

      <body>
        <div className={styles.background} />
        <p className={styles.test2}>
          Test
          { JSON.stringify(location) }
          <br />
          request hostname: { JSON.stringify(data.hostname, null, 2) }
          <br />
          message: { data.message }
        </p>
        <SharedComponent />
        <span className={styles.test}>Something</span>
        <h1>1.</h1>
        <Test2 />
        <h1>2.</h1>
        <Test2 />
        <Test soep='kip' initialMessage={data.message} clientConfig={config.client} />

        Test static message, wrapped with universal wrapper: "{Test.message}"
        <br /><br />
        <div className={styles.multipleBackground}>multiple backgrounds</div>
        <div className={styles.svgBackground}>svg background</div>
        <img alt='' src={publicSvg} /> public svg ({publicSvg})
        <img alt='' className={styles.clip} src={bg1} />
        <img alt='' className={styles.clip2} src={bg1} />
        <svg width='0' height='0'>
          <defs>
            <clipPath id='myClip'>
              <circle cx='100' cy='100' r='40' />
              <circle cx='60' cy='60' r='40' />
            </clipPath>
          </defs>
        </svg>
      </body>
    </html>
  )
}
