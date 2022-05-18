module.exports = {
  kaliber: {
    compileWithBabel: [/node_modules\/subscribe-ui-event/, /@kaliber\/elasticsearch/],
    templateRenderers: {
      xml: '/xmlRenderer',
      mjml: '/mjml-renderer',
      big: '/bigFileRenderer',
      mapping: '/mapping-renderer',
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
