module.exports = {
  kaliber: {
    compileWithBabel: [/node_modules\/subscribe-ui-event/],
    templateRenderers: {
      xml: '/xmlRenderer',
      mjml: '/mjml-renderer',
      big: '/bigFileRenderer',
    },
    universal: {
      clientWrapper: '/wrapper/Client',
      serverWrapper: '/wrapper/Server',
    }
  },
  client: {
    someConfigKey: true
  },
  thisConfigKeyShouldNotAppearInTheClient: true,
}
