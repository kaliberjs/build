# Parent child policy

CSS has a built-in concept of parent / child relations. One of the most prominent examples of this is `display: flex` (for the parent) with things like `flex-grow: 1` (for child). It does not make sense to use one of the child properties when the appropriate parent property is not present.

This rule helps you to correctly create these parent / child relationships.

- [Stacking context](#stacking-context)
- [Position absolute](#position-absolute)
- [Flex and Grid](#flex-and-grid)
- [Pointer events](#pointer-events)

## Stacking context

A `z-index` property applies to a 'stacking context', when you given an element a `z-index` the CSS engine will traverse its parents until it finds a stacking context and that will determine the meaning of the given `z-index`.

This rule forces you to create a stacking context in the direct parent of the child. This helps you to structure your code correctly. It also prevents those annoying unexpected breaking changes where you change CSS in one part of the site and accidentally break another part of the site.

There are many ways to create a stacking context, we chose this one:

```css
position: relative;
z-index: 0;
```

This way of creating a stacking context is non intrusive and works in all browsers.

### Examples

Examples of *correct* code for this rule:

```css
.parent {
  z-index: 0;
  position: relative;

  & > .child {
    z-index: 1;
  }
}
```

Examples of *incorrect* code for this rule:

```css
.parent {
  position: relative;

  & > .child {
    z-index: 1;
  }
}
```

```css
.parent {
  z-index: 0;

  & > .child {
    z-index: 1;
  }
}
```

## Position absolute

When you given an element `position: absolute` the CSS engine will traverse its parents until it finds an element with `position: relative`.

This rule forces you set `position: relative` on the parent element in order to prevent the element from escaping a known context. It ensures we stay true to the black-box principle.

### Examples

Examples of *correct* code for this rule:

```css
.parent {
  position: relative;

  & > .child {
    position: absolute;
  }
}
```

```css
.parent {
  position: relative;

  &::after {
    position: absolute;
  }
}
```

Examples of *incorrect* code for this rule:

```css
.parent {
  & > .child {
    position: absolute;
  }
}
```

```css
.parent {
  &::after {
    position: absolute;
  }
}
```

## Flex and grid

The `display: grid` and `display: flex` properties are similar, they are both set on the parent and adjust their behavior based on certain properties set on the children.

This rule helps you to keep that relation tight and prevent you from accidentally using one of the child properties in a parent.

### Examples

Examples of *correct* code for this rule:

```css
.parent {
  display: flex;

  & > .child {
    flex-grow: 1;
  }
}
```

```css
.parent {
  display: grid;

  & > .child {
    flex-column: 1;
  }
}
```

Examples of *incorrect* code for this rule:

```css
.parent {
  & > .child {
    flex-grow: 1;
  }
}
```

```css
.parent {
  & > .child {
    flex-column: 1;
  }
}
```

## Pointer events

Sometimes you do not want a parent to be affecting pointer events, but you do have a small section that should participate in pointer events. This most often is the case for overlays that contain buttons.

This rule states that you can only change the `pointer-events` property of a child when it's parent has set `pointer-events: none`.

### Examples

Examples of *correct* code for this rule:

```css
.parent {
  pointer-events: none;

  & > .child {
    pointer-events: auto;
  }
}
```

Examples of *incorrect* code for this rule:

```css
.parent {
  & > .child {
    pointer-events: auto;
  }
}
```

## Common refactorings

...

