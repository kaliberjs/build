const { messages } = require('./')

module.exports = {
  'naming-policy': {
    valid: [
      { source: '.componentGood { & > .test { } }' },
      { source: '.good { & > .test { } }' },
      { source: `@value _abc: 0;` },
      {
        title: `don't crash on syntax`,
        source: `
          @value _height: 30px;

          .inner {
            border-radius: calc(_height / 2);
          }
        `,
      },
      { source: 'a { }' },
      { source: 'a { display: block; }' },
      { source: ':root { --custom-PropertyName: red; }' },
      { source: ':export { customPropertyName: red; }' },
      {
        source: 'a { Display: block; }',
        expect: 'a { display: block; }',
      },
      {
        source: ':root { customPropertyName: red; }',
        expect: ':root { custompropertyname: red; }',
      },
      {
        title: 'no collision',
        source: `
          .test1 { }
          :export {
            test2: 0;
          }
        `,
      },
      {
        title: 'no collision - case difference',
        source: `
          .testit { }
          :export {
            testIt: 0;
          }
        `,
      },
      { source: `._rootGood { pointer-events: none; }` },
      { source: `.good { & ._root {} }` },
    ],
    invalid: [
      {
        source: '.bad { & > .componentTest { } }',
        warnings: [messages['nested - no component class name in nested']('componentTest')]
      },
      {
        title: '└─ take @media into account',
        source: '.bad { @media x { & > .componentTest { } } }',
        warnings: [messages['nested - no component class name in nested']('componentTest')]
      },
      {
        title: '└─ take custom selectors into account',
        source: `
          @custom-selector :--custom .componentTest;
          .bad { @media x { & > :--custom { } } }
        `,
        warnings: [messages['nested - no component class name in nested']('componentTest')]
      },
      {
        source: `@value abc: 0;`,
        warnings: [messages['value should start with underscore']]
      },
      {
        source: 'a { Display: block; }',
        warnings: [messages['property lower case']('Display', 'display')],
      },
      {
        source: ':root { customPropertyName: red; }',
        warnings: [messages['property lower case']('customPropertyName', 'custompropertyname')],
      },
      {
        title: 'obvious collision',
        source: `
          .test { }
          :export {
            test: 0;
          }
        `,
        warnings: [messages['export collision']]
      },
      {
        title: 'nested collisions',
        source: `
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
        source: `.bad { & > ._root { color: 0; } }`,
        warnings: [messages['no _root child selectors']]
      },
      {
        source: `.bad { & > .component_root { color: 0; } }`,
        warnings: [
          messages['nested - no component class name in nested']('component_root'),
          messages['no _root child selectors'],
        ]
      },
    ]
  },
}
