const { messages } = require('./')
const { test } = require('../../machinery/test')

test('selector-policy', {
  'selector-policy': {
    valid: [
      { code: '.good { }' },
      { code: '.good { &.test { } }' },
      { code: '.good { &.test1 { & > .test2 { } } }' },
      { code: '.good { & > .test { } }' },
      { code: '.good { & > *:not(:first-child) { } }' },
      { code: '.good { & > .test { &:not(:last-child) { } } }' },
      {
        title: 'correctly nested',
        code: `
          .good { & > .one { } }

          .one { & > .two { } }
        `,
      },
      {
        title: 'correctly nested pseudo element',
        code: `
          .good { & > .one { } }

          .one { &::after { } }
        `,
      },
      { code: '@keyframes test { from { opacity: 0; } }' },
      { code: `[data-context-scrolldir='down'] .good { color: 0; }` },
      { code: `[data-context-scrolldir='down'] { & .good { color: 0; } }` },
      { code: `[data-context-menu-state='is-open'], [data-context-menu-state='is-green'] { & .good { color: 0; } }` },
      {
        title: `don't report media in nested child`,
        code: `
          .good {
            & > {
              @media x {
                width: 10px;
              }
            }
          }
        `,
      },
      {
        title: `don't report media in root`,
        code: `
          .good {
            @media x {
              width: 10px;
            }
          }
        `,
      },
      {
        title: 'allow svg element selectors',
        code: `
          .good {
            & > svg {
              & path {
                with: 10;
              }

              & whatever {
                width: 10;
              }
            }
          }
        `
      },
      {
        code: `.test { &:focus::after, &:hover::after { transform: scaleX(1); } }`
      },
      { code: `*:checked + .b { color: red; }` },
    ],
    invalid: [
      {
        title: 'invalid :checked selector - not universal',
        code: `.test:checked + .other { }`,
        warnings: [messages['invalid state selector']('+')]
      },
      {
        title: 'invalid :checked selector - not +',
        code: `*:checked ~ .other { }`,
        warnings: [messages['invalid state selector']('~')]
      },
      {
        code: `.bad { & svg { & path { } } }`,
        warnings: [messages['only direct child selectors'](' ')]
      },
      {
        code: `.bad { & > .test > svg { & path { } } }`,
        warnings: [messages['nested - no double child selectors']]
      },
      {
        title: 'only allow direct svg element selector',
        code: `
          .bad {
            & > svg {
              & path {
                & > .test {
                  with: 10;
                }
              }
            }
          }
        `,
        warnings: [messages['nested - no double nesting']]
      },
      {
        title: 'prevent svg element selector abuse',
        code: `
          .bad {
            & > .test,
            & > svg {
              & > .test {
              }
            }
          }
        `,
        warnings: 2
      },
      {
        title: 'prevent svg element selector abuse',
        code: `
          .bad {
            & > svg,
            & > .test {
              & > .test {
              }
            }
          }
        `,
        warnings: 2
      },
      {
        code: '.bad { & > .test1 { & > .test2 { } } }',
        warnings: [messages['nested - no double nesting']]
      },
      {
        code: '.bad { & > .test1 { &.test, & > .test2 { } } }',
        warnings: [messages['nested - no double nesting']]
      },
      {
        title: '└─ take @media into account',
        code: '.bad { & > .test1 { @media x { & > .test2 { } } } }',
        warnings: [
          messages['nested - no double nesting'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        code: '.bad { & > .test1 { @supports x { & > .test2 { } } } }',
        warnings: [
          messages['nested - no double nesting'],
        ]
      },
      {
        code: '.bad > .test { }',
        warnings: [messages['root - no child selectors']]
      },
      {
        title: '└─ take @media into account',
        code: '@media x { .bad > .test { } }',
        warnings: [
          messages['root - no child selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        code: '@supports x { .bad > .test { } }',
        warnings: [
          messages['root - no child selectors'],
        ]
      },
      {
        code: '.bad { & > .one > .two { } }',
        warnings: [messages['nested - no double child selectors']]
      },
      {
        title: '└─ take @media into account',
        code: '.bad { @media x { & > .one > .two { } } }',
        warnings: [
          messages['nested - no double child selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        code: '.bad { @supports x { & > .one > .two { } } }',
        warnings: [
          messages['nested - no double child selectors'],
        ]
      },
      {
        code: '.bad { & > .test::after { } }',
        warnings: [messages['nested - no double child selectors']]
      },
      {
        code: 'div { }',
        warnings: [messages['no tag selectors']]
      },
      {
        code: '.test, div { }',
        warnings: [messages['no tag selectors']]
      },
      {
        title: '└─ take @media into account',
        code: '@media x { div { } }',
        warnings: [
          messages['no tag selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        code: '@supports x { div { } }',
        warnings: [
          messages['no tag selectors'],
        ]
      },
      {
        code: '.bad { & > div { } }',
        warnings: [messages['no tag selectors']]
      },
      {
        title: '└─ take @media into account',
        code: '.bad { @media x { & > div { } } }',
        warnings: [
          messages['no tag selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        code: '.bad { @supports x { & > div { } } }',
        warnings: [
          messages['no tag selectors'],
        ]
      },
      {
        code: '.bad { & > div { } }',
        warnings: [messages['no tag selectors']]
      },
      {
        code: '.bad .test { }',
        warnings: [messages['only direct child selectors'](' ')]
      },
      {
        title: '└─ take @supports into account',
        code: '@supports x { .bad .test { } }',
        warnings: [
          messages['only direct child selectors'](' '),
        ]
      },
      {
        code: '.bad { & .test { } }',
        warnings: [messages['only direct child selectors'](' ')]
      },
      {
        code: '.bad { & > .test .one { } }',
        warnings: [
          messages['only direct child selectors'](' '),
          messages['nested - no double child selectors'],
        ]
      },
      {
        title: '└─ take @media into account',
        code: '.bad { @media x { & .one { } } }',
        warnings: [
          messages['only direct child selectors'](' '),
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        code: '.bad { @supports x { & .one { } } }',
        warnings: [
          messages['only direct child selectors'](' '),
        ]
      },
      {
        code: '.bad + .test { }',
        warnings: [messages['only direct child selectors']('+')]
      },
      {
        code: '.bad { & + * { } }',
        warnings: [messages['only direct child selectors']('+')]
      },
      {
        code: `[data-context-scrolldir='down'] + .bad { color: 0; }`,
        warnings: [messages['only direct child selectors']('+')]
      },
      {
        code: `[data-context-scrolldir='down'] .good, .test .bad { color: 0; }`,
        warnings: [messages['only direct child selectors'](' ')]
      },
      {
        title: 'no nested data-context',
        code: `
          [data-context-scrolldir='down'] {
            &.test {
              & .bad { color: 0; }
            }
          }
        `,
        warnings: [messages['only direct child selectors'](' ')]
      },
      {
        title: `report nested child in media`,
        code: `
          .bad {
            @media x {
              & > {
                width: 10px;
              }
            }
          }
        `,
        warnings: [messages['media - no nested child']]
      },
      {
        title: `report nested child in media (root)`,
        code: `
          @media x {
            .bad {
              width: 10px;
            }
          }
        `,
        warnings: [messages['media - no nested child']]
      },
    ]
  }
})
