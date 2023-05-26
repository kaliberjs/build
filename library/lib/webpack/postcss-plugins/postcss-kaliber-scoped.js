const postcss = require('postcss')

const plugin = 'postcss-kaliber-scoped'

module.exports = postcss.plugin(
  plugin,
  () => console.log('creating kaliber-scoped') || async function process(css, result) {
    console.log('kaliber-scoped', css)
    let scope = ''
    css.walkAtRules('kaliber-scoped', rule => { console.log('found @ rule'); scope = rule.params })
    if (!scope) return
    console.log('@kaliber-scoped', scope)
    css.each(x => {
      if (x.type !== 'rule') return
      x.selector = `${scope} ${x.selector}`
    })
  }
)

console.log(module.exports)
