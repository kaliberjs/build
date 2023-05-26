module.exports = function IgnoreContentLoader(source) {
  const jsHash = require('crypto').createHash('md5').update(source).digest('hex')

  return `// content of this file is ignored ${jsHash}`
}
