import './global.css'
/* When kaliber.cssNativeCustomProperties: false, remove the cssGlobal imports */
import './cssGlobal/colors.css'
import './cssGlobal/media.css'
import 'normalize.css'
import head from '/partials/head'
import Test from './partials/Test?universal'
import TestC from '/partials/Test.universal'
import Test2 from '/test/Test2?universal'
import Test2C from '/test/Test2.universal'
import styles from './index.html.js.css'
import publicSvg from '/public/public.svg'
import config from '@kaliber/config'
import firebase from 'firebase-admin'
import bg1 from './bg1.jpg'
import SharedComponent from '/partials/SharedComponent?universal'
import SharedComponentC from '/partials/SharedComponent.universal'
import '/partials/NotRendered?universal'
import '/partials/NotRendered.universal'
import '/test.entry.css'
import { FunctionComponent, FunctionComponentContainer } from './test/FunctionComponent'
import FunctionComponentC from './test/FunctionComponent.universal'
import FunctionComponentU from '/test/FunctionComponentApp?universal'

main.routes = {
  match: async ({ pathname }, request) => {
    return pathname === '/' ? getMessage().then(message => ({ status: 200, data: { message, hostname: request.hostname } })) :
      pathname === '/error' ? Promise.reject(new Error('fake error')) :
      pathname === '/redirect' ? { status: 302, headers: { 'Location': '/redirect-target' } } :
      { status: 404, data: { message: 'missing' } }
  }
}

function getMessage() {
  // Temporary to get around firebase :)
  return new Promise((r) => r(null))

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

export default function main({ location, data }) {
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
        <SharedComponentC />
        <span className={styles.test}>Something</span>
        <h1>1.</h1>
        <Test2 name="1" />
        <Test2C name="2" />
        <h1>2.</h1>
        <Test2 name="3" />
        <Test2C name="4" />
        <Test soep='kip' initialMessage={data.message} clientConfig={config.client} />
        <TestC soep='kip' initialMessage={data.message} clientConfig={config.client} />

        Test static message, wrapped with universal wrapper: "{Test.message}"
        Test static message, wrapped with universal wrapper: "{TestC.message}"
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
        <hr />
        <FunctionComponentContainer>
          <FunctionComponent prop1='1' prop2='Non-universal' />
        </FunctionComponentContainer>
        <FunctionComponentContainer>
          <FunctionComponentC prop1='2' prop2='Containerless Universal' />
        </FunctionComponentContainer>
        <FunctionComponentContainer>
          <FunctionComponentU prop1='3' prop2='Universal' />
        </FunctionComponentContainer>
      </body>
    </html>
  )
}
