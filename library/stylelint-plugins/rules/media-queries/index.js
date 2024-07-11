const fs = require('fs')
const path = require('path')

const messages = {
  undefined: value => `Media query value "${value}" is not defined in media.css`,
  configError: error => `Could not read or parse media.css: ${error.message}`,
}

const mockCssGlobal = `
:root {
  --breakpoint-xs: 111px;
  --breakpoint-sm: 666px;
  --breakpoint-md: 777px;
}
`

module.exports = {
  ruleName: 'media-queries',
  ruleInteraction: {},
  cssRequirements: null,
  messages,
  create(config) {
    const definedMediaQueries = new Set()

    return ({ originalRoot, report }) => {
    //   if (!config || !config.mediaConfigPath) {
    //     throw new Error('mediaConfigPath option is required')
    //   }

      const mediaConfigPath = config.mediaConfigPath ? path.resolve(config.mediaConfigPath) : false

      try {
        const mediaCSS = mediaConfigPath ? fs.readFileSync(mediaConfigPath, 'utf8') : mockCssGlobal
        const mediaCSSRoot = require('postcss').parse(mediaCSS)
        extractMediaQueries(mediaCSSRoot, definedMediaQueries)
      } catch (error) {
        report(originalRoot, messages.configError(error))
        return
      }

      checkMediaQueries({ originalRoot, report, definedMediaQueries })
    }
  }
}

function extractMediaQueries(root, definedMediaQueries) {
  root.walkRules(':root', rule => {
    rule.walkDecls(decl => {
      if (decl.prop.startsWith('--')) {
        definedMediaQueries.add(decl.value)
      }
    })
  })
}

function checkMediaQueries({ originalRoot, report, definedMediaQueries }) {
  const mediaQueryValueRegex = /:\s*(\d+(?:\.\d+)?(?:px|em|rem|vh|vw|%|cm|mm|in|pt|pc))/g

  originalRoot.walkAtRules('media', atRule => {
    let match
    while ((match = mediaQueryValueRegex.exec(atRule.params)) !== null) {
      const value = match[1]
      if (!definedMediaQueries.has(value)) {
        report(atRule, messages.undefined(value))
      }
    }
  })
}
