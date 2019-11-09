const { messages } = require('./')
const { test } = require('../../machinery/test')

test('css-global', {
  'css-global': {
    valid: [
      {
        title: 'valid - allow custom properties in cssGlobal',
        filename: 'src/cssGlobal/abc.css',
        code: `:root { --x: 0; }`,
      },
      {
        title: 'valid - allow @value in cssGlobal',
        filename: 'src/cssGlobal/abc.css',
        code: `
          @value _x x;
          :root { --x: 0; }
        `,
      },
      {
        title: 'valid - allow :export in cssGlobal',
        filename: 'src/cssGlobal/abc.css',
        code: `
          :export { x: 0; }
          :root { --x: 0; }
        `
      },
      {
        title: 'valid - allow custom media in globalCss',
        filename: 'src/cssGlobal/abc.css',
        code: `@custom-media --x (max-width: 30em);`
      },
      {
        title: 'valid - allow custom properties in globalCss',
        filename: 'src/cssGlobal/abc.css',
        code: `:root { --x: 0; }`
      },
      {
        title: 'valid - allow custom selectors in globalCss',
        filename: 'src/cssGlobal/abc.css',
        code: `@custom-selector :--x x;`
      },
      {
        title: 'valid - allow @value and :export in other files',
        filename: 'src/notCssGlobal/abc.css',
        code: `@value x: x; :export { x: 0; }`
      },
    ],
    invalid: [
      {
        title: 'invalid - only allow :root in cssGlobal directory',
        filename: 'src/cssGlobal/abc.css',
        code: `
          div { }
          .test { }
        `,
        warnings: [
          messages['only']('div'),
          messages['only']('.test')
        ],
      },
      {
        title: 'invalid - only allow @custom-media and @custom-selector in cssGlobal directory',
        filename: 'src/cssGlobal/abc.css',
        code: `
          @keyframes x { }
          @media x { }
        `,
        warnings: [
          messages['only']('@keyframes'),
          messages['only']('@media')
        ],
      },
      {
        code: `:root { --x: 0; }`,
        warnings: [messages['no'](':root')]
      },
      {
        code: `@custom-media --x (max-width: 30em);`,
        warnings: [messages['no']('@custom-media')]
      },
      {
        code: `@custom-selector :--x x;`,
        warnings: [messages['no']('@custom-selector')]
      },
    ],
  },
})
