const { test, merge } = require('../../machinery/test')

test('naming-policy', merge(
  require('./policy-root-element-class-name'),
  require('./policy-component-name'),
  require('./policy-css-file-and-variable-name'),
  require('./policy-css-variable-properties'),
  require('./policy-ref-name')
))
