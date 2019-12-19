module.exports = {
  kaliber: {
    compileWithBabel: [/node_modules\/subscribe-ui-event/],
    templateRenderers: {
      xml: '/xmlRenderer',
      mjml: '/mjml-renderer',
      big: '/bigFileRenderer',
    }
  },
  client: {
    someConfigKey: true
  },
  thisConfigKeyShouldNotAppearInTheClient: true,
}
