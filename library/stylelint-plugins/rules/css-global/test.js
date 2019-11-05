const { messages } = require('./')

module.exports = {
  'css-global': {
    valid: [
      {
        title: 'valid - allow custom properties in cssGlobal',
        source: { filename: 'src/cssGlobal/abc.css', source: `:root { --x: 0; }` },
      },
      {
        title: 'valid - allow @value in cssGlobal',
        source: {
          filename: 'src/cssGlobal/abc.css',
          source: `
            @value _x x;
            :root { --x: 0; }
          `
        },
      },
      {
        title: 'valid - allow :export in cssGlobal',
        source: {
          filename: 'src/cssGlobal/abc.css',
          source: `
            :export { x: 0; }
            :root { --x: 0; }
          `
        },
      },
      {
        title: 'valid - allow custom media in globalCss',
        source: { filename: 'src/cssGlobal/abc.css', source: `@custom-media --x (max-width: 30em);` },
      },
      {
        title: 'valid - allow custom properties in globalCss',
        source: { filename: 'src/cssGlobal/abc.css', source: `:root { --x: 0; }` },
      },
      {
        title: 'valid - allow custom selectors in globalCss',
        source: { filename: 'src/cssGlobal/abc.css', source: `@custom-selector :--x x;` },
      },
    ],
    invalid: [
      {
        title: 'invalid - only allow :root in cssGlobal directory',
        source: {
          filename: 'src/cssGlobal/abc.css',
          source: `
            div { }
            .test { }
          `
        },
        warnings: [
          messages['only']('div'),
          messages['only']('.test')
        ],
      },
      {
        title: 'invalid - only allow @custom-media and @custom-selector in cssGlobal directory',
        source: {
          filename: 'src/cssGlobal/abc.css',
          source: `
            @keyframes x { }
            @media x { }
          `
        },
        warnings: [
          messages['only']('@keyframes'),
          messages['only']('@media')
        ],
      },
      {
        source: `:root { --x: 0; }`,
        warnings: [messages['no'](':root')]
      },
      {
        source: `@custom-media --x (max-width: 30em);`,
        warnings: [messages['no']('@custom-media')]
      },
      {
        source: `@custom-selector :--x x;`,
        warnings: [messages['no']('@custom-selector')]
      },
    ],
  },
}
