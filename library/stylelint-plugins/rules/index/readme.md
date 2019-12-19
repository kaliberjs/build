# Index

The file named `index.css` has a special meaning. It is meant to set domain specific defaults for html tags. It is typically imported as `import './index.css'` from a non-universal component.

The following applies to `index.css`:

- Only tag selectors or `:global` class selectors (no normal class selectors)
- Only `@import` when used to import `@font-face` declarations

In essence, this file is used to define styles that should only be set once and apply to the whole application.


## Scoping index styles

In new projects you only need `index.css` file located at the root of your application. When you working on an older project you might need to add a new feature. In most cases it's not commercially viable to convert the whole project to a new style. In those case you can create a directory and start the new style from there.

The `index.css` file contains tag selectors, so without scoping they would affect the whole project. To solve this we introduced the an @rule that allows you to scope all entries of the `index.css` file:

```css
@kaliber-scoped my-custom-element;

div {
  ...
}
```

Results in:

```css
my-custom-element div {
  ...
}
```

We chose a custom element because it only adds 1 point of specificity, allow all of the other rules to remain unchanged.


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

## Common refactorings

Before:
```css
.external-library-item {
  ...
}
```

After:
```css
:global(.external-library-item) {
  ...
}
```
