const { matchesFile } = require('../../machinery/filename')

const allowedInColorScheme = [
  'color', 'background-color', 'border-color',
  'stroke', 'fill',
]

const messages = {
  'only color related properties': prop =>
    `Unexpected property ${prop}\n` +
    `you can only use color related properties in color schemes - ` +
    `move the property to another file or use one of the advanced color values like #RRGGBBAA or color-mod(...)`
}

module.exports = {
  ruleName: 'color-schemes',
  ruleInteraction: {
    'layout-related-properties': {
      allowNonLayoutRelatedProperties: isColorScheme,
    },
    'selector-policy': {
      allowDoubleChildSelectors: isColorScheme,
      allowNonDirectChildSelectors: isColorScheme,
    },
  },
  cssRequirements: null,
  messages,
  create(config) {
    return ({ originalRoot, report }) => {
      if (!isColorScheme(originalRoot)) return
      originalRoot.walkDecls(decl => {
        const { prop } = decl
        if (allowedInColorScheme.includes(prop)) return
        report(decl, messages['only color related properties'](prop))
      })
    }
  }
}

function isColorScheme(root) { return matchesFile(root, filename => /color-scheme.*\.css/.test(filename)) }
