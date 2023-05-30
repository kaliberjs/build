export const babelLoader = {
  loader: 'babel-loader',
  options: {
    // cacheDirectory: './.babelcache/',
    // cacheCompression: false,
    babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
    presets: [['@babel/preset-react', { 'runtime': 'automatic' }]],
    plugins: [
      // ['@babel/plugin-proposal-decorators', { legacy: true }],
      // ['@babel/plugin-proposal-class-properties', { loose: true }],
      // '@babel/plugin-proposal-export-namespace-from',
      // '@babel/plugin-proposal-nullish-coalescing-operator',
      // '@babel/plugin-proposal-object-rest-spread',
      // '@babel/plugin-proposal-optional-chaining',
      // '@babel/syntax-dynamic-import',
      // '@babel/plugin-transform-named-capturing-groups-regex',
      // '@babel/plugin-transform-template-literals',
    ]
  }
}
