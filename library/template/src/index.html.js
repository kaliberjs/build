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
      {javascript}
    </head>
    <body>
      <pre className={styles.suchWow}>@kaliber/build</pre>
    </body>
  </html>
)
