import './head.css'
import '/test/test.entry'
import '/test/test.css'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'
import polyfill from '@kaliber/build/lib/polyfill'

export default function (title) {
  return (
    <head>
      <title>{title}</title>
      { stylesheet }
      {polyfill(['default', 'es2015', 'es2016', 'es2017', 'fetch'])}
      { javascript }
      <link href='https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.css' rel='stylesheet' type='text/css' />
    </head>
  )
}
