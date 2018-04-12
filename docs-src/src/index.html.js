import javascript from '@kaliber/build/lib/javascript'
import App from '/App?universal'

export default (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <title>@kaliber/build</title>
      <meta name='description' content='Zero configuration, opinionated webpack / react build setup' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />

      <script defer src='https://cdn.polyfill.io/v2/polyfill.min.js?features=default,es2015,es2016,es2017' />
      {javascript}
    </head>
    <body>
      <App />
    </body>
  </html>
)
