# Color scheme's

Color schemes are defined by creating files in a `colorScheme` directory or `colorScheme.css` file (any path that contains `colorScheme`). A color scheme only allows for color properties to be defined, but in return it loosens some of the other policies.

```css
.color-scheme--red {
  background-color: var(--color-red);
  color: var(--color-white);

  & .color-scheme-icon {
    color: var(--color-red-700);
  }

  & .color-scheme-exclusion {
    color: var(--color-red-300);
  }

  & ::selection {
    background-color: var(--color-red-300);
  }
}
```

## Examples

Examples of *correct* code for this rule:

`colorScheme/abc.css`
```css
.good {
  & .test {
    color: 0;
    background-color: 0;
    border-color: 0;
    stroke: 0;
    fill: 0;
  }
}
```
`colorScheme.css`
```css
.good {
  & ::selection {
    color: 0;
    background-color: 0;
    border-color: 0;
    stroke: 0;
    fill: 0;
  }
}
```

Examples of *incorrect* code for this rule:

`colorScheme/abc.css`
```css
.bad {
  padding: 0;

  & .test {
    margin: 0;
  }
}
```

## Common refactorings

Before:
```css
.abc {
  color: #aabbcc;
  opacity: 0.5;
}
```

After:
```css
.abc {
  color: #aabbcc80;
  /* or */
  color: rgba(170, 187, 204, 0.5);
}
```
