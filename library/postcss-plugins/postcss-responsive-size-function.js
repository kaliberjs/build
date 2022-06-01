const postcss = require('postcss')
const parse = require('postcss-values-parser').parse

/*
  This plugin allows you to easily write responsive size units
*/
module.exports = postcss.plugin(
  'postcss-responsive-size-function',
  () => {

    return root => {
      root.walkDecls(decl => {
        if (decl.value.includes('responsive-px(')) {
          const ast = parse(decl.value)
          const [fn] = ast.nodes

          if (!fn || fn.type !== 'func') return

          const [
            min,
            max,
            start = { type: 'numeric', value: 375, unit: 'px' },
            end = { type: 'numeric', value: 1440, unit: 'px' },
            scaleUnit = '1vw',
          ] = fn.nodes.filter(x => x.type !== 'punctuation')

          const violation = [min, max, start, end].find(x => x.type !== 'numeric' || x.unit !== 'px')
          if (violation) throw decl.error(`${decl.value}: '${violation}' must be a pixel value`, { word: violation })

          decl.cloneBefore({ value: min.toString() })

          decl.value = `clamp(
            ${min},
            ${min} + (${max.value - min.value} / (${end.value} - ${start.value})) * (100 * ${scaleUnit} - var(--responsive-px-start) * 1px),
            ${max}
          )`
        }
      })
    }
  }
)

function transformResponsiveSizeFunction(node) {
  const [min, max, ...rest] = (node.nodes || []).slice(1, -1) || []

  if (!min || !max || rest.length) throw new Error('responsive-px() should be called with 2 params')


}

function isResponsiveSizeFunction(node) {
  // responsive-size()
  return Object(node).type === 'func' && responsiveSizeMatch.test(node.value)
}

const responsiveSizeMatch = /^responsive-size$/i
const responsiveSizeFunctionMatch = /(^|[^\w-])responsive-size\(/i
