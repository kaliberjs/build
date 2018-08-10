module.exports = {
  kaliber: {
    compileWithBabel: [/node_modules\/subscribe-ui-event/],
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
