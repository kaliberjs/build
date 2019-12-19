const { firstLetterLowerCase } = require('../../machinery/word')

const messages = {
  'incorrect variable passing': name =>
    `Unexpected JSX attribute passing, expected \`{...{ ${name} }}\``,

  'destructure props':
    `Expected destructured props`,
}

module.exports = {
  messages,

  meta: { type: 'problem' },

  create(context) {
    return {
      [`FunctionDeclaration`]: reportNonDestructuredProps,
      [`JSXAttribute`]: reportIncorrectVariablePassing,
    }

    function reportNonDestructuredProps(node) {
      const [props] = node.params
      if (firstLetterLowerCase(node.id.name) || !props || props.type !== 'Identifier') return
      context.report({
        message: messages['destructure props'],
        node: props,
      })
    }

    function reportIncorrectVariablePassing(node) {
      const { name } = node.name
      if (
        name === 'key' ||
        !node.value ||
        node.value.type !== 'JSXExpressionContainer' ||
        name !== node.value.expression.name
      ) return

      context.report({
        message: messages['incorrect variable passing'](name),
        node,
      })
    }
  }
}
