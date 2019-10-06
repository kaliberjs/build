const messages = {
  'invalid className': expected => `invalid className\n\nexpected '${expected}'`,
  'no component className': `invalid className\n\nonly root nodes can have a className that starts with 'component'`,
  'no className': 'className is not allowed on custom components\n\nonly native (lower case) elements can have a className',
  'no export base': 'base components can not be exported\n\nremove the `export` keyword',
}
module.exports = {
  messages,
  rules: {
    /*
      no-export-base
      export function ComponentBase

      child-no-layout-class-name
      <div><div className={layoutClassName} /></div>

      component-names-start-with-file-name
      Test.js
        export function Test()
        export function TestX()
      Only for Upper case file name. Not sure if this one is realistic
    */
    'root-component-class-name': {
      meta: { fixable: 'code' },
      create(context) {
        const checked = new Set()

        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
            const jsxElement = getParentJSXElement(node)
            if (checked.has(jsxElement)) return
            else checked.add(jsxElement)

            if (!isRootJSXElement(jsxElement)) return
            const expected = `component${getFunctionName(context)}`
            if (node.property.name !== expected) context.report({
              message: messages['invalid className'](expected),
              node: node.property,
              fix: fixer => fixer.replaceText(node, `styles.${expected}`)
            })
          }
        }
      }
    },
    'child-no-component-class-name': {
      create(context) {
        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
            const jsxElement = getParentJSXElement(node)

            if (isRootJSXElement(jsxElement)) return
            if (node.property.name.startsWith('component')) context.report({
              message: messages['no component className'],
              node: node.property,
            })
          },
        }
      }
    },
    'no-custom-component-class-name': {
      create(context) {
        return {
          [`JSXSpreadAttribute Property[key.name = 'className']`]: noClassName,
          [`JSXAttribute[name.name = 'className']`]: noClassName,
        }

        function noClassName(node) {
          const jsxElement = getParentJSXElement(node)
          const name = getJSXElementName(jsxElement)

          if (firstLetterLowerCase(name) || name.endsWith('Base')) return

          context.report({
            message: messages['no className'],
            node,
          })
        }
      }
    },
    'no-export-base': {
      meta: { fixable: 'code' },
      create(context) {
        return {
          'ExportNamedDeclaration > FunctionDeclaration'(node) {
            const { name } = node.id
            if (!name.endsWith('Base') || firstLetterLowerCase(name)) return

            const exportNode = node.parent
            context.report({
              message: messages['no export base'],
              node: exportNode,
              loc: {
                start: exportNode.loc.start,
                end: node.loc.start
              },
              fix: fixer => fixer.removeRange([exportNode.start, node.start])
            })
          }
        }
      }
    },
  }
}

function firstLetterLowerCase(word) {
  const firstLetter = word.slice(0, 1)
  return firstLetter.toLowerCase() === firstLetter
}

function getJSXElementName(jsxElement) {
  return jsxElement.openingElement.name.name
}

function getFunctionName(context) {
  return context.getScope().block.id.name
}

function isRootJSXElement(jsxElement) {
  return !getParentJSXElement(jsxElement)
}

function getParentJSXElement({ parent }) {
  if (!parent) return
  return parent.type === 'JSXElement'
    ? parent
    : getParentJSXElement(parent)

}
