const messages = {
  'invalid className': expected => `invalid className\n\nexpected '${expected}'`,
  'no component className': `invalid className\n\nonly root nodes can have a className that starts with 'component'`,
}
module.exports = {
  messages,
  rules: {
    /*
      no-custom-component-class-name
      <Test className='...' />
      Upper case jsx, allow xyzBase

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
    }
  }
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
