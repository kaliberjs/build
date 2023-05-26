import fastGlob from 'fast-glob'

export async function findEntries({ cwd, patterns }) {
  const entries = await fastGlob( patterns, { cwd })

  return entries.reduce(
    (result, entry) => ({ ...result, [entry]: { import: [`./${entry}`] } }),
    {}
  )
}
