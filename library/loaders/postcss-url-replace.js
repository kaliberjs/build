const postcss = require("postcss")

const urlPattern = /(\burl\(\s*['"]?)([^"')]+)(["']?\s*\))/

module.exports = postcss.plugin(
  "postcss-url-replace",
  (options = {}) => {
    const replace = options.replace || (x => x)

    return styles => {
      let results = []

      styles.walkDecls(decl => {
        const [match, before, old, after] = urlPattern.exec(decl.value) || []
        if (match) {
          const result = Promise.resolve(replace(old)).then((replacement = old) => {
            decl.value = before + replacement + after
          })
          results = [ ...results, result ]
        }
      })

      return Promise.all(results)
    }
  }
)
