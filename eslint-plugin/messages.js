module.exports = {
  'invalid className': (found, expected) =>
    `Unexpected className '${found}', expected '${expected}'`,

  'no root className': found =>
    `Unexpected className '${found}', only root nodes can have a className that starts with 'app', ` +
    `'page' or 'component'`,

  'no className on custom component':
    `Unexpected attribute 'className', only native (lower case) elements can have a 'className' - ` +
    `use 'layoutClassName' for manipulating layout`,

  'no export base':
    `Unexpected 'export', Base components can not be exported - remove the 'export' keyword`,

  'no layoutClassName in child':
    `Unexpected 'layoutClassName', only root elements can use the 'layoutClassName' - set the ` +
    `'layoutClassName' as 'className' of the root element`,

  'no _root with layoutClassName':
    `Unexpected 'layoutClassName', '_root' and 'layoutClassName' can not be combined`,

  'invalid component name': (found, expected) =>
    `Unexpected component name '${found}', expected '${expected}'`,

  'invalid css file name': (found, expected) =>
    `Unexpected css file name '${found}', expected '${expected}'`,

  'invalid styles variable name': (found, expected) =>
    `Unexptected css import name '${found}', expected '${expected}'`,

  'incorrect variable passing': name =>
    `Unexpected JSX attribute passing, expected \`{...{ ${name} }}\``,

  'destructure props':
    `Expected destructured props`,

  'no styles with _': found =>
    `Unexpected underscore in '${found}', properties of styles can not start with an underscore - ` +
    `if you exported using @value switch to ':export { ... }'`,

  'no relative parent import': found =>
    `Unexpected relative parent import '${found}' - use a root slash import`,
}
