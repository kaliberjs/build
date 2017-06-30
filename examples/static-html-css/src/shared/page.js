import styles from './page.css'

export default content => (
  <html>
    <head>
      <link rel='stylesheet' href='index.css' />
    </head>
    <body className={styles['page-body']}>
      <a href='/'>Back</a>
      <div>
        { content }
      </div>
    </body>
  </html>
)
