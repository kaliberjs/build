const { RuleTester } = require('eslint')
const { rules, messages } = require('..')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      generators: true,
      experimentalObjectRestSpread: true,
    }
  }
})

test('root-component-class-name')
test('child-no-component-class-name')
test('no-custom-component-class-name')
test('no-export-base')

function test(name) {
  const rule = rules[name]
  const tests = require(`./${name}`)
  ruleTester.run(name, rule, tests)
}
