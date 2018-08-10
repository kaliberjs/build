import './head.css'
import '/test/test.entry'
import '/test/test.css'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'

const isProduction = process.env.NODE_ENV === 'production'

export default function (title) {
  return (
    <head>
      <title>{title}</title>
      <script defer src='https://cdn.polyfill.io/v2/polyfill.js?features=default,es2015,es2016,es2017' />
      { /* we might be able to inject these (or supply them as props) */}
      { stylesheet }
      { javascript }
      <link href='https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.css' rel='stylesheet' type='text/css' />
    </head>
  )
}
