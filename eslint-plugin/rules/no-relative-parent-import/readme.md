# No relative parent import

When you import something from a relative parent (using `../Test`) and you move the file, your code is broken. It is better to use a root slash import.

Concretely, the following should be refactored as shown:

```jsx
import { Test } from '../machinery/Test'
```

```jsx
import { Test } from '/machinery/Test'
```

## Examples

Examples of *correct* code for this rule:

```js
import from './test'
```
```js
import x from './test'
```
```js
export { x } from '/test'
```
```js
export { x } from './test'
```
```js
export * from './test'
```

Examples of *incorrect* code for this rule:

```js
import '../test'
```
```js
import x from '../test'
```
```js
export { x } from '../test'
```
```js
export * from '../test'
```
