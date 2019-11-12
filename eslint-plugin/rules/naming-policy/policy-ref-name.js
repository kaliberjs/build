const { messages } = require('./')

module.exports = {
  valid: [
    `const xRef = React.useRef();`,
    `const xRef = React.useXyzRef();`,
    `const xRef = useXyzRef();`,
    `const x = React.useXyzRefx();`,
    `const x = React.xuseXyzRef();`,
    `const useRefX = x();`,
    `const x = <div />;`,
  ],
  invalid: [
    {
      code: `const x = React.useRef()`,
      errors: [{ message: messages['ref should end with Ref']('x', 'xRef'), type: 'Identifier' }],
    },
    {
      code: `const x = useXyzRef()`,
      errors: [{ message: messages['ref should end with Ref']('x', 'xRef'), type: 'Identifier' }],
    },
    {
      code: `const xRefx = useXyzRef()`,
      errors: [{ message: messages['ref should end with Ref']('xRefx', 'xRefxRef'), type: 'Identifier' }],
    },
  ]
}