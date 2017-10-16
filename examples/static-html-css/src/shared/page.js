import styles from './page.css'
import bg2 from '/images/bg2.jpg'

export default content => (
  <html lang='en'>
    <head>
      <link rel='stylesheet' href='index.css' />
    </head>
    <body className={styles['page-body']}>
      <a href='/'>Back</a>
      <div><img src={ bg2 } /></div>
      <div>
        { content }
      </div>
    </body>
  </html>
)
