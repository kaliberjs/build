# Layout related properties

In CSS we make distinction between 2 kinds of properties: layout related and non-layout related. A few examples:

> Layout related: `margin`, `position: absolute`, `...`

> Non-layout related: `padding`, `color`, `...`

Layout related properties affect the 'environment' of the element. In other words: layout related properties affect the outside of the component where non-layout related properties affect the inside.

To prevent accidental problems, help with the portability and supplement the component (black-box) mindset this rule helps to enforce that layout related properties are only set in the presence of a parent.

Concretely, the following should be refactored as shown:

```css
.container {
  color: red;
}

.child {
  margin: 10px;
  color: green;
}
```

```css
.container {
  color: red;
  padding: 10px;

  & > .child:not(:last-child) {
    margin-bottom: 10px;
  }
}

.child {
  color: green;
}
```

In the refactored code, the `.child` element can be reused in another context where spacing might be different.

Additionally, the following should be refactored as shown:

```css
.container {
  color: red;

  & > .child {
    padding: 10px;
    display: block;
  }
}
```

```css
.container {
  color: red;
}

.child {
  padding: 10px;
  display: block;
}
```

Before refactoring, the container might break the layout of the `.child` as it might have been configured to use `display: flex;`. It also assumes something about the sub-structure of `.child` by setting a padding.

## Exceptions

There are a few exceptions to this rule.

### Intrinsic size

Normally a parent determines the size (or available space) of a child element. There are however some cases where an element has a size of its own; an intrinsic size (an example could be an icon). You can use the following pattern set an intrinsic size: `{prop}: {size}{unit} !important`

```css
.component {
  width: 20px !important;
}
```

The `prop` must be one of: `width`, `height`, `max-width`, `min-width`, `max-height`, `min-height`

The `unit` must be one of: `px`, `em`, `rem`, `vw`, `vh`

### Ratio hack

When the `height` is set to `0` and the `padding-top` or `padding-bottom` is set to a percentage, the element maintains a fixed ratio. The parent will determine the width, but the component determines the height based on the given ratio.

```css
.component {
  height: 0;
  padding-bottom: calc((9 / 16) * 100%);
}
```

### Pseudo elements

Pseudo elements are always child elements, but since they only exist in the context of CSS they are not restricted to only layout related properties.

```css
.component {
  &::before {
    content: '';
    width: 10px;
    height: 10px;
    color: black;
  }
}
```

## Examples

Examples of *correct* code for this rule:

```css
.good {
  position: relative;

  & > .test {
    width: 100%; height: 100%;
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
    flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
    grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
    grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
    justify-self: 0; align-self: 0;
    order: 0;
  }
}
```

Examples of *incorrect* code for this rule:

```css
.bad {
  width: 100%; height: 100%;
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
  flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
  grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
  grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
  justify-self: 0; align-self: 0;
  order: 0;
  max-width: 0; min-width: 0; max-height: 0; min-height: 0;
}
```

## Common refactorings

Before:
```css
.abc {
  width: 100%;
}
```

After:
```css
.abcParent {
  & > .abc {
    width: 100%;
  }
}
```
