const { SourceMapConsumer } = require('source-map')
const ReactDOMServer = require('react-dom/server')
const { RawSource } = require('webpack-sources')

module.exports = function reactTemplatePlugin(templates) {

  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {

        // render templates to html
        compilation.plugin('optimize-assets', (assets, done) => {
          for (const name in assets) {
            if (!templates[name]) continue
            const asset = assets[name]
            delete assets[name]
            
            const map = asset.map()
            const { result: html, error } = evalWithSourceMap(asset.source(), map)

            if (error) compilation.errors.push(error)
            if (html) {
              const { result, error } = withSourceMappedError(map, () => ReactDOMServer.renderToStaticMarkup(html))

              if (error) compilation.errors.push(error)
              if (result) assets[name + '.html'] = new RawSource(result)
            }
          }
          done()
        })
      })
    }
  }
}

function evalWithSourceMap(source, map) {
  return withSourceMappedError(map, () => {
    const module = { exports: {} }
    const result = eval(source)
    return module.exports 
  })
}

function withSourceMappedError(map, fn) {
  return withRawErrorStack(() => {
    try { return { result: fn() } } 
    catch (e) { return { error: e + '\n' + toMappedStack(map, e.stack) } }
  })
}

function withRawErrorStack(fn) {
  const $prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (error, stack) => stack
  try { return fn() } finally { Error.prepareStackTrace = $prepareStackTrace }
}

function toMappedStack(map, stack) {
  const sourceMap = new SourceMapConsumer(map)
  return stack
    .map(frame => {
      if (frame.isEval()) {
        const generated = { line: frame.getLineNumber(), column: frame.getColumnNumber() - 1 }
        const { source, line, column } = sourceMap.originalPositionFor(generated)
        if (source && !source.startsWith('webpack/')) return `    at ${source}:${line}:${column + 1}`
      }
    })
    .filter(Boolean)
    .join('\n')
}
