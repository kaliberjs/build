module.exports = {
  kaliber: {
    compileWithBabel: [
      /subscribe-ui-event/,
      /@kaliber\/elasticsearch/,
      // /@kaliber\/build\/lib\/RequestNonce/
    ],
    templateRenderers: {
      xml: '/xmlRenderer',
      mjml: '/mjml-renderer',
      big: '/bigFileRenderer',
      mapping: '/mapping-renderer',
    },
    universal: {
      clientWrapper: '/wrapper/Client',
      serverWrapper: '/wrapper/Server',
    },
  },
  client: {
    someConfigKey: true
  },
  thisConfigKeyShouldNotAppearInTheClient: true,
}
