const fastGlob = require('fast-glob')

module.exports = { findEntries }

async function findEntries({ cwd, patterns }) {
  const entries = await fastGlob(
    patterns,
    { cwd }
  )
  return entries.reduce(
    (result, entry) => ({ ...result, [entry]: `./${entry}` }),
    {}
  )
}
