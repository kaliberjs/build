# Root policy

Some combinations of properties does not make sense in a root selector, others can only be used in a certain combination.

This rule helps to establish correct combinations.

- [Stacking context](#stacking-context)

## Stacking context

While `z-index` is normally only allowed on child selectors, it is allowed in the root if used to create a 'stacking context'. A stacking context is created by setting a `z-index` and a `position: relative`. We choose this combination because it's 'safe' (it does not affect anything outside of the element).

This rule triggers when you define a `z-index` in a root rule and requires you to these specific values:

```css
.parent {
  z-index: 0;
  position: relative;
}
```

### Examples

Examples of *correct* code for this rule:

```css
.parent {
  z-index: 0;
  position: relative;
}
```

Examples of *incorrect* code for this rule:

```css
.parent {
  z-index: 1;
}
```

## Common refactorings

Before:
```css
.abc {
  z-index: 1;
}
```

After:
```css
.parentOfAbc {
  z-index: 0;
  position: relative;

  & > .abc {
    z-index: 1;
  }
}
```

---

Before:
```css
.abc {
  z-index: 1;
  position: relative;

  &::after {
    z-index: -1;
  }
}
```

After:
```css
.parentOfAbc {
  z-index: 0;
  position: absolute;

  & > .abc {
    z-index: 1;
  }
}

.abc {
  z-index: 0;
  position: relative;

  &::after {
    z-index: -1;
  }
}
```
