const { firstLetterLowerCase } = require('../../machinery/word')

const messages = {
  'incorrect variable passing': name =>
    `Unexpected JSX attribute passing, expected \`{...{ ${name} }}\``,

  'no setters': name =>
    `Unexpected JSX attribute name, you should not directly pass \`${name}\` as a prop. Instead, pass an \`onXxx\` handler.`,
  
  'destructure props':
    `Expected destructured props`,
}

module.exports = {
  messages,

  meta: { type: 'problem' },

  create(context) {
    return {
      [`FunctionDeclaration`]: reportNonDestructuredProps,
      [`JSXAttribute`](node) {
        reportIncorrectVariablePassing(node)
        reportSetterProps(node)
      },
      [`JSXSpreadAttribute`](node) {
        console.log('JSXSpreadAttribute')
        reportDestructuredSetterProps(node)
      }
    }

    function reportNonDestructuredProps(node) {
      const [props] = node.params
      if (firstLetterLowerCase(node.id.name) || !props || props.type !== 'Identifier') return
      context.report({
        message: messages['destructure props'],
        node: props,
      })
    }

    function reportSetterProps(node) {
      const { name } = node.name

      if (isSetter(name)) {
        context.report({
          message: messages['no setters'](name),
          node,
        })
      }
    }

    function reportDestructuredSetterProps(node) {
      node.argument.properties.forEach(x => {
        if (isSetter(x.value.name)) {
          context.report({
            message: messages['no setters'](x.value.name),
            node,
          })
        }
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

function isSetter(name) {
  return (
    name.length >= 4 &&
    name.startsWith('set') &&
    name[3] === name[3].toUpperCase()
  )
}
