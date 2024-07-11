const { messages } = require('./')
const { test } = require('../../machinery/test')

test('media-queries', {
  'media-queries': {
    valid: [
      {
        title: 'valid - value matches breakpoint in media.css',
        filename: 'src/test.css',
        code: `
          @media (min-width: 666px) {
            color: red;
          }
        `,
      },
      {
        title: 'valid - value matches screen and breakpoint in media.css',
        filename: 'src/test.css',
        code: `
          @media screen and (min-width: 666px) {
            color: red;
          }
        `,
      },
    ],
    invalid: [
      {
        title: 'invalid - value does not match media.css',
        filename: 'src/test.css',
        code: `
          @media (min-width: 600px) {
            color: red;
          }
        `,
        warnings: [
          messages['undefined']('600px'),
        ],
      }
    ],
  },
})
