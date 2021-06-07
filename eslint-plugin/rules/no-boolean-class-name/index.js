const messages = {
  'incorrect logical expression in className': `You can't pass in a LogicalExpression into a className`,
}

module.exports = {
  messages,
  meta: { type: 'problem' },
  create(context) {
    return {
      [`JSXIdentifier`]: reportClassNameAttribute,
    }

    function reportClassNameAttribute(node) {
      if (node.name !== 'className') return

      if (node.parent.value.expression && node.parent.value.expression.type === 'LogicalExpression') {
        context.report({
          message: messages['incorrect logical expression in className'],
          node,
        })
      }
    }
  }
}
