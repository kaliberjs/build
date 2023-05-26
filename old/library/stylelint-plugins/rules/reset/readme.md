# Reset

The file named `reset.css` has a special meaning. It is meant to reset browser defaults for html tags. It is typically imported like as `import 'reset.css'` from a non-universal component.

The following applies to `reset.css`:

- Only tag selectors (no normal class selectors)
- Allows specific layout related properties normally not allowed in root rules

In essence, this file is used to reset styles set by the browser and that should only be set once.

Allowed layout related properties:

```js
  width, height,
  max-width, max-height,
  margin, margin-top, margin-right, margin-bottom, margin-left,
```

## Scoping index styles

See [the documentation of `index.css`](../index) for details.

## Examples

Examples of *correct* code for this rule:

`reset.css`
```css
*,
*::before,
*::after {
  margin: 0;
}

address { font-style: normal; }

button {
  background-color: transparent;
  padding: 0;
  border: none;
  cursor: pointer;
  color: currentColor;
}
```

Examples of *incorrect* code for this rule:

`reset.css`
```css
.abc {
  ...
}

:global(.abc) {
  ...
}
```

## Common refactorings

...
