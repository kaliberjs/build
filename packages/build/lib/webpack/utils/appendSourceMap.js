export function appendSourceMap(name, { source, map }) {
  if (!map) return source // TODO: test if source maps work correctly

  map.sources = map.sources.map(source => {
    try { return require.resolve(source) } catch (_) { return `/.../${source}` }
  })

  const base64Map = Buffer.from(JSON.stringify(map), 'utf-8').toString('base64')
  const sourceMap = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Map}`
  return `${source}\n${sourceMap}\n//# sourceURL=${name}`
}
