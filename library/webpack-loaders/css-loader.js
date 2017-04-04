const { relative } = require('path')
const postcss = require('postcss')

const plugins = [
  // these plugis need to run on each file individual file
  // look at the source of postcss-modules to see that it effectively runs all modules twice
  ['postcss-plugin-composition', ({ onImport, onExport }) => [
    // postcss-import is advised to be the first
    require('postcss-import')({ onImport, /* path: rootDirectories, */ glob: true }),
    require('postcss-modules')({ getJSON: (_, json) => { onExport(json) } })
  ]],
  // these plugins need to run on final result
  ['../postcss-plugins/postcss-url-replace', ({ onUrl }) => ({ replace: url => onUrl(url) })]
]

const pluginCreators = plugins.map(([name, config]) => {
  const createPlugin = require(name)
  return handlers => createPlugin(typeof(config) === 'function' ? config(handlers) : config)
})

module.exports = function CssLoader(source, map) {

  const self = this
  const callback = this.async()

  let exports = {}
  const handlers = {
    onImport: imports => { imports.forEach(i => self.addDependency(i)) },
    onExport: locals  => { exports = locals },
    onUrl   : url     => isDependency(url) ? loadModule(url).then(executeModuleAt(url)) : Promise.resolve(url)
  }

  const plugins = pluginCreators.map(create => create(handlers))
  const filename = relative(this.options.context, this.resourcePath)
  const options = {
    from: this.resourcePath,
    to  : this.resourcePath,
    map : { prev: map || false, inline: false, annotation: false }
  }

  const result = postcss(plugins).process(source, options)
  result
    .then(({ css, map }) => {
      throwErrorForWarnings(result.warnings())
      this.emitFile(filename, css, map.toJSON())
      callback(null, exports)
    })
    .catch(e => { callback(e) })

  function loadModule(url) {
    return new Promise((resolve, reject) => {
      self.loadModule(url, (err, source) => { if (err) reject(err); else resolve(source) })
    })
  }

  function executeModuleAt(url) {
    return source => {
      const completeSource = `const __webpack_public_path__ = '${self.options.output.publicPath || ''}'\n` + source
      return self.exec(completeSource, url)
    }
  }
}

function throwErrorForWarnings(warnings) {
  if (warnings.length) throw new Error(warnings
    .sort(({ line: a = 0 }, { line: b = 0}) => a - b)
    .map(warning => fileAndLine(warning) + warning.text).join('\n\n') + '\n'
  )

  function fileAndLine({ line }) {
    return filename + ((line || '') && (':' + line)) + '\n\n'
  }
}

function isDependency(s) { return !/^data:|^(https?:)?\/\//.test(s) }
