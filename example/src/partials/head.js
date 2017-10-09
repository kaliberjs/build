import styles from './head.css'
import x from 'test/test.entry'
import y from 'test/test.css'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'

const isProduction = process.env.NODE_ENV === 'production'

export default function (title) {
  return (
    <head>
      <title>{title}</title>
      { /* we might be able to inject these (or supply them as props) */}
      { stylesheet }
      { javascript }
      <link href='https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.css' rel='stylesheet' type='text/css' />
      <script defer src={`https://unpkg.com/babel-polyfill@6.23.0/dist/polyfill${isProduction ? '.min' : ''}.js`} />
    </head>
  )
}
