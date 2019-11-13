const { messages } = require('./')
const { messages: layoutRelatedPropertiesMessages } = require('../layout-related-properties/')
const { messages: selectorPolicyMessages } = require('../selector-policy/')
const { test } = require('../../machinery/test')

test('naming-policy', {
  'naming-policy': {
    valid: [
      { code: '.componentGood { & > .test { } }' },
      { code: '.good { & > .test { } }' },
      { code: `@value _abc: 0;` },
      {
        title: `don't crash on syntax`,
        code: `
          @value _height: 30px;

          .inner {
            border-radius: calc(_height / 2);
          }
        `,
      },
      { code: 'a { }' },
      { code: 'a { display: block; }' },
      { code: ':root { --custom-PropertyName: red; }' },
      { code: ':export { customPropertyName: red; }' },
      {
        code: 'a { Display: block; }',
        output: 'a { display: block; }',
      },
      {
        code: ':root { customPropertyName: red; }',
        output: ':root { custompropertyname: red; }',
      },
      {
        title: 'no collision',
        code: `
          .test1 { }
          :export {
            test2: 0;
          }
        `,
      },
      {
        title: 'no collision - case difference',
        code: `
          .testit { }
          :export {
            testIt: 0;
          }
        `,
      },
      { code: `._rootGood { pointer-events: none; }` },
      { code: `.good { & ._root {} }` },
    ],
    invalid: [
      {
        code: '.bad { & > .componentTest { } }',
        warnings: [messages['nested - no component class name in nested']('componentTest')]
      },
      {
        title: '└─ take @media into account',
        code: '.bad { @media x { & > .componentTest { } } }',
        warnings: [messages['nested - no component class name in nested']('componentTest')]
      },
      {
        title: '└─ take custom selectors into account',
        code: `
          @custom-selector :--custom .componentTest;
          .bad { @media x { & > :--custom { } } }
        `,
        warnings: [messages['nested - no component class name in nested']('componentTest')]
      },
      {
        code: `@value abc: 0;`,
        warnings: [messages['value should start with underscore']]
      },
      {
        code: 'a { Display: block; }',
        warnings: [messages['property lower case']('Display', 'display')],
      },
      {
        code: ':root { customPropertyName: red; }',
        warnings: [messages['property lower case']('customPropertyName', 'custompropertyname')],
      },
      {
        title: 'obvious collision',
        code: `
          .test { }
          :export {
            test: 0;
          }
        `,
        warnings: [messages['export collision']]
      },
      {
        title: 'nested collisions',
        code: `
          .test1 {
            & > .test2 { }
            &.test3 > .test4 { }
          }
          :export {
            test2: 0;
            test3: 0;
            test4: 0;
          }
        `,
        warnings: Array(3).fill(messages['export collision'])
      },
      {
        code: `.bad { & > ._root { color: 0; } }`,
        warnings: [messages['no _root child selectors']]
      },
      {
        code: `.bad { $ > .test, & > ._root { color: 0; } }`,
        warnings: [messages['no _root child selectors']]
      },
      {
        code: `.bad { & > .component_root { color: 0; } }`,
        warnings: [
          messages['nested - no component class name in nested']('component_root'),
          messages['no _root child selectors'],
        ]
      },
    ]
  },
  'layout-related-properties': {
    valid: [
      {
        title: `don't report errors when layout related props are used in _root or component_root`,
        code: `
          ._rootTest {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
            grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            justify-self: 0; align-self: 0;
          }

          .component_rootTest {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
            grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            justify-self: 0; align-self: 0;
          }
        `,
      },
      { code: `.good { &.isX { & > .goodX { color: 0; } } }` },
      { code: `.good { &[x] { & > .goodX { color: 0; } } }` },
    ],
    invalid: [
      {
        code: `.component { &.isX { & > .componentX { color: 0; } } }`,
        warnings: [layoutRelatedPropertiesMessages['nested - only layout related props in nested']('color')]
      },
    ]
  },
  'selector-policy': {
    valid: [
      { code: `.good { &.isX { & > * > * > .goodX { color: 0; } } }` },
      { code: `.good { &[x] { & > * > .goodX { color: 0; } } }` },
      { code: `.good { &:hover { & > * > .goodX { color: 0; } } }` },
      { code: `.good { &.is-x { & > * > .goodX { color: 0; } } }` },
    ],
    invalid: [
      {
        code: `.component { &.isX { & > * > .componentX { color: 0; } } }`,
        warnings: [selectorPolicyMessages['nested - no double child selectors']]
      },
    ]
  }
})
