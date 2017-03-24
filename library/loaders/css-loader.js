const { relative } = require('path')
const postcss = require('postcss')

const plugins = [
  // postcss-import is advised to be the first
  ['postcss-import', ({ onImport }) => ({ onImport, /* path: rootDirectories, */ glob: true })],
  ['./postcss-url-replace', ({ onUrl }) => ({ replace: url => onUrl(url) })],
	['postcss-modules', ({ onExport }) => ({ getJSON: (_, json) => { onExport(json) } })]
]

const pluginCreators = plugins.map(([name, config]) => {
  const createPlugin = require(name)
  return handlers => createPlugin(typeof(config) === 'function' ? config(handlers) : config)
})

module.exports = function(source, map) {

  const self = this
  const callback = this.async()

  let exports = {}
  const handlers = {
    onImport: imports => { imports.forEach(i => self.addDependency(i)) },
    onExport: locals  => { exports = locals },
    onUrl   : url     => new Promise((res, rej) => {
      if (isDependency(url)) self.resolve(self.context, url, (err, result) => err ? rej(err) : res(result))
      else resolve(url)
    })
  }

  const plugins = pluginCreators.map(create => create(handlers))
  const filename = relative(self.options.context, this.resourcePath)
  const options = {
    from: this.resourcePath,
    to  : this.resourcePath,
    map : { prev: map || false, inline: false }
  }

  const result = postcss(plugins).process(source, options)
  result
    .then(({ css, map }) => {
      throwErrorForWarnings(result.warnings())
      this.emitFile(filename, css, map.toJSON())
      callback(null, exports)
    })
    .catch(e => { callback(e) })

  function throwErrorForWarnings(warnings) {
    if (warnings.length) throw new Error(warnings
      .sort(({ line: a = 0 }, { line: b = 0}) => a - b)
      .map(warning => fileAndLine(warning) + warning.text).join('\n\n') + '\n'
    )

    function fileAndLine({ line }) {
      return filename + ((line || '') && (':' + line)) + '\n\n'
    }
  }
}

function isDependency(s) { return !/^data:|^(https?:)?\/\//.test(s) }
