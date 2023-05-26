import javascript from '@kaliber/build/lib/javascript'
import stylesheet from '@kaliber/build/lib/stylesheet'
import App from '/App.universal'
import config from '@kaliber/config'
import polyfill from '@kaliber/build/lib/polyfill'

export default (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <title>@kaliber/build</title>
      <meta name='description' content='Zero configuration, opinionated webpack / react build setup' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      {stylesheet}
      {polyfill(['default', 'es2015', 'es2016', 'es2017'])}
      {javascript}
    </head>
    <body>
      <App publicPath={config.kaliber.publicPath} />
    </body>
  </html>
)
