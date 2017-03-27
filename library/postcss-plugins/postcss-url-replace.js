const postcss = require("postcss")

const urlPattern = /(\burl\(\s*['"]?)([^"')]+)(["']?\s*\))/

module.exports = postcss.plugin(
  "postcss-url-replace",
  ({ replace }) => {

    return styles => {
      const results = []

      styles.walkDecls(decl => {
        const [match, before, old, after] = urlPattern.exec(decl.value) || []
        if (match) {
          const result = Promise.resolve(replace(old)).then((replacement = old) => {
            decl.value = before + replacement + after
          })
          results.push(result)
        }
      })

      return Promise.all(results)
    }
  }
)
