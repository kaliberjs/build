# Selector policy

CSS has many options when it comes to selectors. More often than not you can do things in more than one way. In order to keep our code consistent and limit the time required to choose a certain way we have limited the use of selectors greatly.

Our main concern is that selectors overreach and accidentally change components that are nested. Another big concern is that, by using deep selectors, big sections of html are tied together with CSS preventing you to grap a part and extract it into a separate component.

A large part of the selector policy is force you to only use direct child selectors. This limits the reach of your CSS and forces you to create 'component compatible' code. By doing so it helps you to write your CSS in a way to doesn't get in your way in a later stage.

> Often, at the start of development, you write a bunch of tags and CSS to get a certain visual effect or appearance. When you are satisfied with what's on the screen you go back to your code and try to make it more readable, remove duplication and perform cleanup. This often involves grabbing sections of your code and extract it into components.

This rule helps you to do that. In many cases a naive way of writing has caused people to be forced to copy/paste large sections of HTML and CSS because it was simply to hard to untangle and extract components in order to reuse them.

- [Direct child selectors](#direct-child-selectors)
- [No tag selectors](#no-tag-selectors)
- [No selectors in media queries](#no-selectors-in-media-queries)
- [Context](#context)
- [SVG](#svg)

## Direct child selectors

The reason behind this policy has been explained in the introduction. Note that some of the other rules lift some restrictions of this rule.

### Examples

Examples of *correct* code for this rule:

```css
.good {
  ...
}
```
```css
.good {
  &.test {
    ...
  }
}
```
```css
.good {
  &.test1 {
    & > .test2 {
      ...
    }
  }
}
```
```css
.good {
  & > .test {
    ...
  }
}
```
```css
.good {
  & > *:not(:first-child) {
    ...
  }
}
```
```css
.good {
  & > .test {
    &:not(:last-child) {
      ...
    }
  }
}
```

Examples of *incorrect* code for this rule:

```css
.bad {
  & > .test1 {
    & > .test2 {
      ...
    }
  }
}
```
```css
.bad > .test {
  ...
}
```
```css
.bad {
  & > .one > .two {
    ...
  }
}
```
```css
.bad {
  & > .test::after {

  }
}
```
```css
.bad .test {
  ...
}
```
```css
.bad {
  & .test {
    ...
  }
}
```
```css
.bad {
  & > .test .one {
    ...
  }
}
```
```css
.bad + .test {
  ...
}
```
```css
.bad {
  & + * {
    ...
  }
}
```

## No tag selectors

We do not allow tag selectors outside of `index.css` and `reset.css` because they are fragile. In most cases where the tag changed it required an extra test cycle to discover the developer forgot to change the CSS selector.

Using a tag selector in a component boundary is especially fragile as you cross the black-box boundary.

Having tag selectors on the root level is extremely problematic, what happens if you have a `div` selector in multiple CSS files?

### Examples

Examples of *correct* code for this rule:

```css
.abc {
  ...
}
```

```css
.parent {
  & > .child {
    ...
  }
}
```

Examples of *incorrect* code for this rule:

```css
div {
  ...
}
```

```css
.abc {
  & > svg {
    ...
  }
}
```

## No selectors in media queries

We prevent rules within media queries. If you think about it, it doesn't really make sense to create (or summon) a class based on on a media query. The class should have already been set on the html element.

This policy pushes media queries to the leaves of the CSS tree, making sure it only operates on properties.

As an added benefit this keeps the properties that change close together.

### Examples

Examples of *correct* code for this rule:

```css
.good {
  & > * {
    width: 5px;

    @media x {
      width: 10px;
    }
  }
}
```
```css
.good {
  width: 5px;

  @media x {
    width: 10px;
  }
}
```

Examples of *incorrect* code for this rule:

```css
.bad {
  & > * {
    width: 5px;
  }

  @media x {
    & > * {
      width: 10px;
    }
  }
}
```
```css
.bad {
  width: 5px;
}

@media x {
  .bad {
    width: 10px;
  }
}
```

## Context

In some cases we want to apply a set of styles based on the context of an element. For that specific use case we introduced a data attribute selector that allows for non-direct child selectors.

For this to work we require the data attribute to start with the name `data-context-`.

### Examples

Examples of *correct* code for this rule:

```css
[data-context-scrolldir='down'] {
  & .good {
    color: red;
  }
}
```
```css
[data-context-scrolldir='down'] .good {
  color: red;
}
```

Examples of *incorrect* code for this rule:

```css
[data-context-scrolldir='down'] + .bad {
  color: red;
}
```

## SVG

The direct child policy and no tags policy do not apply to most svg elements.

### Examples

Examples of *correct* code for this rule:

```css
.abc {
  & > svg {
    & path {
      width: 10px;
    }
  }
}
```

Examples of *incorrect* code for this rule:

```css {
  & path {
    width: 10px;
  }
}

## Common refactorings

Before:
```css
.abc {
  & > svg {
    ...
  }
}
```

After:
```css
.abc {
  & > .icon {
    ...
  }
}
```
