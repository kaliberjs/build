const hasProp = require('jsx-ast-utils/hasProp')
const propName = require('jsx-ast-utils/propName')

module.exports = {
  meta: {
    type: 'problem',
    messages: {
      missingIterKey: 'Missing "key" prop for element in iterator',
      missingIterKeyUsePrag: 'Missing "key" prop for element in iterator. Shorthand fragment syntax does not support providing keys. Use React.Fragment instead',
      missingArrayKey: 'Missing "key" prop for element in array',
      missingArrayKeyUsePrag: 'Missing "key" prop for element in array. Shorthand fragment syntax does not support providing keys. Use React.Fragment instead',
      keyBeforeSpread: '`key` prop must be placed before any `{...spread}, to avoid conflicting with React’s new JSX transform: https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html`'
    },
  },

  create(context) {
    return {
      JSXElement(node) {
        if (
          !hasProp(node.openingElement.attributes, 'key') ||
          !isKeyAfterSpread(node.openingElement.attributes)
        ) return

        context.report({
          node,
          messageId: 'keyBeforeSpread'
        })
      },

      // Array.prototype.map
      'CallExpression, OptionalCallExpression'(node) {
        if (
          node.callee && node.callee.type !== 'MemberExpression' &&
          node.callee.type !== 'OptionalMemberExpression'
        ) return

        if (node.callee && node.callee.property && node.callee.property.name !== 'map') return

        const fn = node.arguments[0]
        const isFn = fn && fn.type === 'FunctionExpression'
        const isArrFn = fn && fn.type === 'ArrowFunctionExpression'

        if (isArrFn && (fn.body.type === 'JSXElement' || fn.body.type === 'JSXFragment'))
          checkIteratorElement(fn.body)

        if ((isFn || isArrFn) && fn.body.type === 'BlockStatement') {
          const { argument } = getReturnStatement(fn.body.body) || {}
          if (argument) checkIteratorElement(argument)
        }
      }
    }

    function checkIteratorElement(node) {
      if (node.type === 'JSXElement' && !hasProp(node.openingElement.attributes, 'key')) {
        context.report({
          node,
          messageId: 'missingIterKey'
        })
      } else if (node.type === 'JSXFragment') {
        context.report({
          node,
          messageId: 'missingIterKeyUsePrag',
        })
      }
    }

    function getReturnStatement(body) {
      return body.filter((item) => item.type === 'ReturnStatement')[0]
    }

    function isKeyAfterSpread(attributes) {
      return attributes.reduce(
        ({ hasFoundSpread, keyAfterSpread }, x) => ({
          hasFoundSpread: hasFoundSpread || x.type === 'JSXSpreadAttribute',
          keyAfterSpread: keyAfterSpread || (
            hasFoundSpread && x.type === 'JSXAttribute' && propName(x) === 'key'
          ),
        }),
        { hasFoundSpread: false, keyAfterSpread: false }
      ).keyAfterSpread
    }
  }
}
