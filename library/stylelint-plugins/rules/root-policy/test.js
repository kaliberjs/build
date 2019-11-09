const { messages } = require('./')
const { test } = require('../../machinery/test')

test('root-policy', {
  'root-policy': {
    valid: [
      { code: '.good { position: relative; z-index: 0; }', warnings: 0 },
      {
        title: `├─ take @media into account [1]`,
        code: `
          .good {
            position: relative;
            @media x {
              z-index: 0;
            }
          }
        `,
      },
      {
        title: `└─ take @media into account [2]`,
        code: `
          .good {
            @media x {
              z-index: 0;
              position: relative;
            }
          }
        `,
      },
      {
        title: `└─ take class chaining into account [1]`,
        code: `
          .good {
            &.test {
              z-index: 0;
              position: relative;
            }
          }
        `,
      },
      {
        title: `└─ take class chaining into account [2]`,
        code: `
          .good {
            position: relative;
            &.test {
              z-index: 0;
            }
          }
        `,
      },
    ],
    invalid: [
      {
        title: `don't allow \`z-index\` in root without \`position: relative\``,
        code: '.bad { z-index: 0; }',
        warnings: [messages['root - z-index without position relative']]
      },
      {
        title: `├─ take @media into account [1]`,
        code: `.bad { @media x { z-index: 0; } }`,
        warnings: [messages['root - z-index without position relative']]
      },
      {
        title: `└─ take @media into account [2]`,
        code: `.bad { z-index: 0; @media x { position: relative; } }`,
        warnings: [messages['root - z-index without position relative']]
      },
      {
        title: `only allow a \`z-index: 0\` in root`,
        code: '.bad { position: relative; z-index: 1; }',
        warnings: [messages['root - z-index not 0']]
      },
    ]
  }
})
