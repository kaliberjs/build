# Index

The file named `index.css` has a special meaning. It is meant to set domain specific defaults for html tags. It is typically imported like as `import 'index.css'` from a non-universal component.

The following applies to `index.css`:

- Only tag selectors or `:global` class selectors (no normal class selectors)
- Only `@import` when used to import `@font-face` declarations

In essence, this file is used to define styles that should only be set once and apply to the whole application.


## Examples

Examples of *correct* code for this rule:

`index.css`
```css
@import url('https://fonts.googleapis.com/css?family=Merriweather|Poppins:400,500,600');

html {
  box-sizing: border-box;

  /* force scroll bar, so there's no ui-jank when opening/closing menu on windows */
  overflow-y: scroll;
}

body {
  color: var(--color-gray-90);
  font-family: var(--font-family-base);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-base-400);
  line-height: 1.7;
}
```

Examples of *incorrect* code for this rule:

`index.css`
```css
@import './abc.css'

.def {
  ...
}
```