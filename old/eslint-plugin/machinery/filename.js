const path = require('path')

module.exports = {
  isApp, isPage, isTemplate,
  getBaseFilename,
}

function isApp(context) {
  const filename = context.getFilename()
  return !!filename && filename.endsWith('App.js')
}

function isPage(context) {
  const filename = context.getFilename()
  return /.+\/pages\/[^/]+\.js/.test(filename)
}

function isTemplate(context) {
  const filename = context.getFilename()
  return /.+\.[^.]+\.js/.test(filename)
}

function getBaseFilename(context) {
  const filename = context.getFilename()
  const basename = path.basename(filename, '.js')

  if (isTemplate(context)) {
    const [name] = basename.split('.')
    return name.slice(0, 1).toUpperCase() + name.slice(1)
  } else return basename
}
