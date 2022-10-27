import './head.css'
import '/test/test.entry'
import '/test/test.css'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'
import polyfill from '@kaliber/build/lib/polyfill'
import rollbar from '@kaliber/build/lib/rollbar'
import rollbarCheckIgnore from '/rollbarCheckIgnore.raw'

export default function (title/*, requestNonce*/) {
  return (
    <head>
      <title>{title}</title>
      {stylesheet}
      {rollbar({}, `_rollbarConfig.checkIgnore = ${rollbarCheckIgnore}`/*, requestNonce*/)}
      {polyfill(['default', 'es2015', 'es2016', 'es2017', 'fetch'])}
      {javascript}
    </head>
  )
}
