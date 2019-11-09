const { messages } = require('./')

module.exports = {
  'selector-policy': {
    valid: [
      { source: '.good { }' },
      { source: '.good { &.test { } }' },
      { source: '.good { &.test1 { & > .test2 { } } }' },
      { source: '.good { & > .test { } }' },
      { source: '.good { & > *:not(:first-child) { } }' },
      { source: '.good { & > .test { &:not(:last-child) { } } }' },
      {
        title: 'correctly nested',
        source: `
          .good { & > .one { } }

          .one { & > .two { } }
        `,
      },
      {
        title: 'correctly nested pseudo element',
        source: `
          .good { & > .one { } }

          .one { &::after { } }
        `,
      },
      { source: '@keyframes test { from { opacity: 0; } }' },
      { source: `[data-context-scrolldir='down'] .good { color: 0; }` },
      {
        title: `don't report media in nested child`,
        source: `
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
        source: `
          .good {
            @media x {
              width: 10px;
            }
          }
        `,
      },
    ],
    invalid: [
      {
        source: '.bad { & > .test1 { & > .test2 { } } }',
        warnings: [messages['nested - no double nesting']]
      },
      {
        title: '└─ take @media into account',
        source: '.bad { & > .test1 { @media x { & > .test2 { } } } }',
        warnings: [
          messages['nested - no double nesting'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        source: '.bad { & > .test1 { @supports x { & > .test2 { } } } }',
        warnings: [
          messages['nested - no double nesting'],
        ]
      },
      {
        source: '.bad > .test { }',
        warnings: [messages['root - no child selectors']]
      },
      {
        title: '└─ take @media into account',
        source: '@media x { .bad > .test { } }',
        warnings: [
          messages['root - no child selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        source: '@supports x { .bad > .test { } }',
        warnings: [
          messages['root - no child selectors'],
        ]
      },
      {
        source: '.bad { & > .one > .two { } }',
        warnings: [messages['nested - no double child selectors']]
      },
      {
        title: '└─ take @media into account',
        source: '.bad { @media x { & > .one > .two { } } }',
        warnings: [
          messages['nested - no double child selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        source: '.bad { @supports x { & > .one > .two { } } }',
        warnings: [
          messages['nested - no double child selectors'],
        ]
      },
      {
        source: '.bad { & > .test::after { } }',
        warnings: [messages['nested - no double child selectors']]
      },
      {
        source: 'div { }',
        warnings: [messages['no tag selectors']]
      },
      {
        title: '└─ take @media into account',
        source: '@media x { div { } }',
        warnings: [
          messages['no tag selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        source: '@supports x { div { } }',
        warnings: [
          messages['no tag selectors'],
        ]
      },
      {
        source: '.bad { & > div { } }',
        warnings: [messages['no tag selectors']]
      },
      {
        title: '└─ take @media into account',
        source: '.bad { @media x { & > div { } } }',
        warnings: [
          messages['no tag selectors'],
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        source: '.bad { @supports x { & > div { } } }',
        warnings: [
          messages['no tag selectors'],
        ]
      },
      {
        source: '.bad { & > div { } }',
        warnings: [messages['no tag selectors']]
      },
      {
        source: '.bad .test { }',
        warnings: [messages['only direct child selectors'](' ')]
      },
      {
        title: '└─ take @supports into account',
        source: '@supports x { .bad .test { } }',
        warnings: [
          messages['only direct child selectors'](' '),
        ]
      },
      {
        source: '.bad { & .test { } }',
        warnings: [messages['only direct child selectors'](' ')]
      },
      {
        source: '.bad { & > .test .one { } }',
        warnings: [
          messages['only direct child selectors'](' '),
          messages['nested - no double child selectors'],
        ]
      },
      {
        title: '└─ take @media into account',
        source: '.bad { @media x { & .one { } } }',
        warnings: [
          messages['only direct child selectors'](' '),
          messages['media - no nested child'],
        ]
      },
      {
        title: '└─ take @supports into account',
        source: '.bad { @supports x { & .one { } } }',
        warnings: [
          messages['only direct child selectors'](' '),
        ]
      },
      {
        source: '.bad + .test { }',
        warnings: [messages['only direct child selectors']('+')]
      },
      {
        source: '.bad { & + * { } }',
        warnings: [messages['only direct child selectors']('+')]
      },
      {
        source: `[data-context-scrolldir='down'] + .bad { color: 0; }`,
        warnings: [messages['only direct child selectors']('+')]
      },
      {
        title: `report nested child in media`,
        source: `
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
        source: `
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
}
