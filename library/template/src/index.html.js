import '/reset.css'
import '/index.css'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'
import polyfill from '@kaliber/build/lib/polyfill'
import rollbar from '@kaliber/build/lib/rollbar'
import config from '@kaliber/config'
import App from '/App?universal'

Index.routes = {
  match(location) {
    const path = location.pathname
    if (path === '/') return { status: 200 }
    else return { status: 404, data: { notFound: true } }
  }
}

export default function Index({ location, data }) {
  return (
    <html lang='nl'>
      <head>
        <meta charSet='utf-8' />
        <title>@kaliber/build</title>
        <meta name='description' content='' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        {stylesheet}
        {rollbar({ accessToken: config.rollbar.accessToken })}
        {polyfill(['default', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019'])}
        {javascript}
      </head>
      <body>
        {data && data.notFound
          ? 'Not found'
          : <App config={config.client} />
        }
      </body>
    </html>
  )
}
