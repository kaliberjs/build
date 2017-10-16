// Copied from postcss-plugin-composition because the original has an issue: https://github.com/btd/postcss-plugin-composition/issues/1
const postcss = require('postcss')

module.exports = postcss.plugin('postcss-plugin-composition', plugins => {
  if (!Array.isArray(plugins)) throw new Error('`options` for postcss-plugin-composition must be array of plugins')

  return (root, { opts, messages }) =>
    postcss(plugins)
      .process(root, opts)
      .then(({ messages: m }) => { messages.push.apply(messages, m) })
})
