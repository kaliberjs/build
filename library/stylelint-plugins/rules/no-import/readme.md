# No import

We prevent imports in CSS because they allow another way to tangle up your code. In a React application files can be brought in through JavaScript import statements. In plain html applications they are imported through the use of link tags. If we would allow CSS to use imports the dependencies and usage of certain pieces of code becomes hard to track. This can make it extremely hard to keep a mental model of the code.

Another reason to prevent imports is their impact on performance. The postcss plugin becomes increasingly more inefficient as the amount of imports grows. Every import is resolved and parsed (even if it was seen before), this is required because other plugins might have changed the contents.

There is however an exception where we do allow imports. In a `*.entry.css` you are allowed to use imports. Since they are an entry level CSS file they are often used for the styling of a complete page. The file would become unmanageably big if we would not allow `@import`.

## How do I do ...

In the past `@import` rules were mostly used to bring in custom properties, custom media or custom selectors. These are now available automagically by placing them in the `src/cssGlobal` directory.

Another use of `@import` is to bring in font's. The `index` rule allows for this in the `index.css` file.

## Examples

Examples of *correct* code for this rule:

`abc.entry.css`
```css
@import './a.css';
@import './b.css';
@import './c.css';
```

Examples of *incorrect* code for this rule:

`notEntry.css`
```css
@import './a.css';
@import './b.css';
@import './c.css';
```

## Common refactorings

...