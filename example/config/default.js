module.exports = {
  kaliber: {
    templateRenderers: {
      xml: '/xmlRenderer',
      mjml: '/mjml-renderer'
    }
  },
  externals: ['firebase'],
  client: {
    someConfigKey: true
  },
  thisConfigKeyShouldNotAppearInTheClient: true,
}
