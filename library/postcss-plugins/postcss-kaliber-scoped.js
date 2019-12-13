const postcss = require('postcss')

const plugin = 'postcss-import-export-parser'

module.exports = postcss.plugin(
  plugin,
  () => async function process(css, result) {
    let scope = ''
    css.walkAtRules('kaliber-scoped', rule => { scope = rule.params })
    if (!scope) return

    css.each(x => {
      if (x.type !== 'rule') return
      x.selector = `${scope} ${x.selector}`
    })
  }
)
