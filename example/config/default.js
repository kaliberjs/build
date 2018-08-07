module.exports = {
  kaliber: {
    // compileWitBabel: ['gsap'],
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
