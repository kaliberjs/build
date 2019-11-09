# Naming policy

In @kaliber/build we value convention over configuration. This rule helps to enforce this notion and tries to prevent accidental mistakes.

- [Nested component name](#nested-component-name)
- [@value starts with underscore](#value-starts-with-underscore)
- [Property lower case](#property-lower-case)
- [Prevent export collisions](#prevent-export-collisions)
- [_root](#_root)

## Nested component name

The `component` name for styles is tightly connected to the root element of a component. This means that when you are using it in a child selector something is wrong. In most cases you are trying to set some layout related properties of a component that happens to be in the same file. Doing so causes you to cross that magical component black-box, preventing your future self from moving the component to another file.

This helps you prevent such mistakes.

Concretely, the following should be refactored as shown:

```css
.component {
  color: green;

  & > .componentAbc {
    margin-bottom: 10px;
  }
}

.componentAbc {
  color: red;
}
```

```css
.component {
  color: green;

  & > .abc {
    margin-bottom: 10px;
  }
}

.componentAbc {
  color: red;
}
```

### Examples

Examples of *correct* code for this rule:

```css
.component {
  & > .test {
    ...
  }
}
```

```css
.componentAbc {
  & > .test {
    ...
  }
}
```

Examples of *incorrect* code for this rule:

```css
.component {
  & > .componentAbc {
    ...
  }
}
```

```css
.componentAbc {
  & > .component {
    ...
  }
}
```

## @value starts with underscore

To prevent accidental collisions of `@value` names with built-in variables we require the names of `@value` definitions start with an underscore: `@value _x: 10px;`.

### Examples

Examples of *correct* code for this rule:

```css
@value _column: 3;
@value _wrap: break-word;
```

Examples of *incorrect* code for this rule:

```css
@value column: 3;
@value wrap: break-word;
```

## Property lower case

We originally used the standard rule [property-case](https://stylelint.io/user-guide/rules/property-case) with the option `"lower"`. This rules however had no way to allow other casing in properties that were placed in `:export` rules.

### Examples

Examples of *correct* code for this rule:

```css
.test {
  color: red;
  display: none;
}

:export {
  myColor: green;
}
```

Examples of *incorrect* code for this rule:

```css
.test {
  COLOR: red;
  Display: none;
}
```

## Prevent export collisions

In modular CSS all class names used in the file are exported. If you happen to export a declaration with the same name the behavior is undefined: it's unclear what would happen. To help you prevent this from happening we added this rule.

### Examples

Examples of *correct* code for this rule:

```css
.test1 {
  ...
}

:export {
  test2: red;
}
```

Examples of *incorrect* code for this rule:

```css
.test {
  ...
}

:export {
  test: red;
}
```

## _root

Selectors `_root` and `component_root` have a special status as they indicate that the component or element starts a new context that you have control over. A couple of use cases:

- Slides within a carousel that you did not create
- A popup window

The `_root` and `component_root` selectors are only allowed as top-level selector. It does not make sense to reference them as a child of a parent rule; it would mean it is not actually a root.

These selectors allow you to use layout related props in a top-level selector which is normally prevented. In most cases you won't need a `_root` or `component_root` selector, use them only when you absolutely need them and when 'root' feels like an appropriate description of the situation.

### Examples

Examples of *correct* code for this rule:

```css
_rootAbc {
  position: absolute;
  top: 60%;
  width: 100%;
}
```

Examples of *incorrect* code for this rule:

```css
.test {
  & > _root {
  }
}
```

## Common refactorings

...
