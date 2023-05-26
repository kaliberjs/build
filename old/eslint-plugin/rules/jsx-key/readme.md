# Detect missing key prop (@kaliber/jsx-key)

Adaptation of https://github.com/yannickcr/eslint-plugin-react/blob/master/lib/rules/jsx-key.js to
allow for keyless JSX in array literals.

Most occurrences of JSX in array literals is for DSL's where they are destructured. In real code
arrays are almost never filled with JSX and then iterated. Example of common use (with routing for example):

```js
myDslFunction(
  ['somthing', <Abc />],
  ['anything', <Def />],
)
```
