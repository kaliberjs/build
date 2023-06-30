const plugin = 'postcss-modules-import-export'

/**
 * @returns {import('postcss').Plugin}
 */
export function postcssModulesExports() {
  return {
    postcssPlugin: plugin,
    Rule(node, { result }) {
      if (node.selector !== ':export') return

      const declarations = getDeclarations(node)
      declarations.forEach(declaration => {
        result.messages.push({ plugin, type: 'export', item: declaration })
      })
      node.remove()
    }
  }
}

/** @param {import('postcss').Rule} rule */
function getDeclarations(rule) {
  const result = []
  rule.walkDecls(x => { result.push({ key: x.prop, value: x.value }) })
  return result
}
