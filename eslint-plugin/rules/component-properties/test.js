const { test, merge } = require('../../machinery/test')

test('component-properties', merge(
  require('./policy-destructure-props'),
  require('./policy-variable-passing'),
))