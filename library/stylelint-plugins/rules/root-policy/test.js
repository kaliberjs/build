const { messages } = require('./')

module.exports = {
  'root-policy': {
    valid: [
      { source: '.good { position: relative; z-index: 0; }', warnings: 0 },
      {
        title: `├─ take @media into account [1]`,
        source: `
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
        source: `
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
        source: `
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
        source: `
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
        source: '.bad { z-index: 0; }',
        warnings: [messages['root - z-index without position relative']]
      },
      {
        title: `├─ take @media into account [1]`,
        source: `.bad { @media x { z-index: 0; } }`,
        warnings: [messages['root - z-index without position relative']]
      },
      {
        title: `└─ take @media into account [2]`,
        source: `.bad { z-index: 0; @media x { position: relative; } }`,
        warnings: [messages['root - z-index without position relative']]
      },
      {
        title: `only allow a \`z-index: 0\` in root`,
        source: '.bad { position: relative; z-index: 1; }',
        warnings: [messages['root - z-index not 0']]
      },
    ]
  }
}
