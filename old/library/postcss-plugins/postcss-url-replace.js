const postcss = require('postcss')

/*
  This plugin allows you to replace the values inside url's with something else (it accepts promises)
*/
module.exports = postcss.plugin(
  'postcss-url-replace',
  ({ replace }) => {

    return styles => {
      const results = []

      styles.walkDecls(decl => {

        const urlPattern = /(\burl\(\s*['"]?)([^"')]+)(["']?\s*\))/g

        const { value } = decl

        const parts = []

        // This section turns the value of the declaration into the different parts
        // that can be used to build up the declaration with replacements in place
        let match
        let lastIndex = 0
        while ((match = urlPattern.exec(value))) {
          const { index } = match
          parts.push(Promise.resolve(value.substring(lastIndex, index)))

          const [ , before, old, after] = match
          parts.push(Promise.resolve(before))

          parts.push(Promise.resolve(replace(old, decl.source.input.file)).then((replacement = old) => replacement))

          parts.push(Promise.resolve(after))
          lastIndex = urlPattern.lastIndex
        }

        // If we had a match, push the remainder of the result as a part and join the result
        // once all promises resolve.
        if (lastIndex) {
          parts.push(Promise.resolve(value.substr(lastIndex)))

          results.push(
            Promise.all(parts)
              .then(parts => parts.join(''))
              .then(result => {
                decl.value = result
              })
          )
        }
      })

      return Promise.all(results)
    }
  }
)
