const { findDecls } = require('./ast')

module.exports = { checkRuleRelation }

function checkRuleRelation({ rule, triggerProperties, rulesToCheck, requiredProperties }) {
  const triggerDecls = findDecls(rule, triggerProperties)
  const relationApplicable = !!triggerDecls.filter(x => x.value !== 'unset').length
  if (!relationApplicable) return []

  const normalizedRequiredProperties = requiredProperties.map(x => {
    const [prop] = Array.isArray(x) ? x : [x]
    return prop
  })
  const resolvedPropDecls =
    rulesToCheck.reduce(
      (result, rootRule) => ({
        ...result,
        ...findDecls(rootRule, normalizedRequiredProperties).reduce(
          (result, x) => ({ ...result, [x.prop]: x }),
          {}
        )
      }),
      {}
    )

  return requiredProperties
    .map(
      x => {
        const [prop, expectedValue] = Array.isArray(x) ? x : [x]
        const invalidDecl = resolvedPropDecls[prop]
        if (!invalidDecl) return { result: 'missing', prop }
        if (!expectedValue) return
        const { value } = invalidDecl
        if (value === expectedValue) return
        return { result: 'invalid', prop, invalidDecl, value, expectedValue }
      }
    )
    .filter(Boolean)
    .reduce(
      (result, x) => [
        ...result,
        ...triggerDecls.map(triggerDecl => ({ ...x, triggerDecl }))
      ],
      []
    )
}
