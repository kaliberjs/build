const eslintPluginImport = require('eslint-plugin-import')
const { isApp, isTemplate } = require('../../machinery/filename')

module.exports = {
  meta: { type: 'problem' },

  create(context) {
    if (isApp(context) || isTemplate(context)) return {}
    return eslintPluginImport.rules['no-default-export'].create(context)
  }
}
