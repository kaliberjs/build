module.exports = function defaultRenderer(template) {
  return typeof template === 'string' ? template : JSON.stringify(template)
}