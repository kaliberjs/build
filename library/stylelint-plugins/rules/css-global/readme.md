# CSS Global

This rule restricts the definition of custom properties, custom media and custom selectors to the `src/cssGlobal` directory.

Defining custom properties inside arbitrary CSS files does not make sense, this case becomes even stronger when modules are in use. The postcss plugin to convert custom properies only allows definitions to be defined in the `:root` pseudo selector. Having these in arbitrary files could cause trouble. In order to facilitate the use of real `:root` definitions, @kaliber/build picks up any definitions placed in `src/cssGlobal`.

## Examples

Examples of *correct* code for this rule:

`src/cssGlobal/abc.css`
```css
:root {
  --x: 0;
}

@custom-media --x (max-width: 30em);

@custom-selector :--x x;
```
`src/cssGlobal/abc.css`
```css
@value _x: 0;

:export {
  x: _x;
}

:root {
  --x: _x_;
}
```

Examples of *incorrect* code for this rule:

`src/cssGlobal/abc.css`
```css
div {
  ...
}

.test {
  ...
}

@keyframes x {
  ...
}

@media x {
  ...
}
```
`src/notCssGlobal/abc.css`
```css
:root {
  --x: 0;
}

@custom-media --x (max-width: 30em);

@custom-selector :--x x;
```

## Common refactorings

...
