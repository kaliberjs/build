import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'
import styles from '/index.css'

export default (
  <html lang='nl'>
    <head>
      <meta charSet='utf-8' />
      <title>@kaliber/build</title>
      <meta name='description' content='' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      {stylesheet}
      <script defer src='https://cdn.polyfill.io/v2/polyfill.min.js?features=default,es2015,es2016,es2017' />
      {javascript}
    </head>
    <body>
      <pre className={styles.suchWow}>@kaliber/build</pre>
    </body>
  </html>
)
