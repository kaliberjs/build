module.exports = {
  /*
    Warning: do not use this to set values that differ in each environment,
    only use this for configuration that is the same across all config environments
  */
  kaliber: {
    compileWithBabel: [],
    universal: {
      serverWrapper: '/wrappers/Server',
      clientWrapper: '/wrappers/Client',
    }
  },
  rollbar: {
    post_client_item: 'get an access token at rollbar.com',
  }
}
