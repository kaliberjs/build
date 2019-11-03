module.exports = {
  matchesFile,
}

function matchesFile({ source: { input } }, predicate) {
  return !!input.file && predicate(input.file)
}
