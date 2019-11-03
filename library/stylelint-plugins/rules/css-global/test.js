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
        title: 'valid - allow custom selectors in globalCss',
        source: { filename: 'src/cssGlobal/abc.css', source: `@custom-selector :--x x;` },
      },
      {
        title: 'valid - allow custom media in cssGlobal directory',
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
      {
        title: 'valid - allow custom selectors in cssGlobal directory',
        source: { filename: 'src/cssGlobal/abc.css', source: `@custom-selector :--x x;` },
      },
      {
        title: 'valid - allow custom properties in globalCss',
        source: { filename: 'src/cssGlobal/abc.css', source: `:root { --x: 0; }` },
      },
      {
        title: 'valid - allow custom media in globalCss',
        source: { filename: 'src/cssGlobal/abc.css', source: `@custom-media --x (max-width: 30em);` },
      },
    ],
    invalid: [
      {
        source: `:root { --x: 0; }`,
        warnings: [messages['no root selector']]
      },
      {
        title: 'invalid - only allow :root in cssGlobal directory',
        source: {
          filename: 'src/cssGlobal/abc.css',
          source: `
            div { }
            .test { }
          `
        },
        warnings: Array(2).fill(messages['only root selector']),
      },
      {
        source: `@custom-media --x (max-width: 30em);`,
        warnings: [messages['no custom media']]
      },
      {
        title: 'invalid - only allow @custom-media in cssGlobal directory',
        source: {
          filename: 'src/cssGlobal/abc.css',
          source: `
            @keyframe { }
            @media x { }
          `
        },
        // TODO: No need to report more than one error
        warnings: Array(2).fill(messages['only custom selector']).concat(Array(2).fill(messages['only custom media'])),
      },
      {
        source: `@custom-selector :--x x;`,
        warnings: [messages['no custom selector']]
      },
      {
        title: 'invalid - only allow custom selector in cssGlobal directory',
        source: {
          filename: 'src/cssGlobal/abc.css',
          source: `
            @keyframe { }
            @media x { }
          `
        },
        warnings: Array(2).fill(messages['only custom selector']).concat(Array(2).fill(messages['only custom media'])),
      },
    ],
  },
}
