module.exports = {
  kaliber: {
    // compileWitBabel: ['firebase'],
    templateRenderers: {
      xml: '/xmlRenderer',
      mjml: '/mjml-renderer'
    }
  },
  client: {
    someConfigKey: true
  },
  thisConfigKeyShouldNotAppearInTheClient: true,
}
