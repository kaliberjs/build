## Choices

Creating a library like this means making choices. We made quite a few choices and while some are
arbitrary or accidental, some of them are very conscious.

If you don't agree with one of the choices we made please, check here or in the issues if it's a
conscious choice. And after you understand our position and still disagree, please op an issue. We
love to have these discussions as they will lead to one of two things:

- We will get a better understanding of the choice we made and should be able to explain it better.
- We will be convinced your opinion is better, change our opinion and learn something new.

Another thing to note is that some choices come down to taste. The eslint settings we have addopted
are a good example for this. With eslint we tried to only enable the settings that would prevent
errors. As soon as we encounter a setting that is not worth more time to discuss, and there were no
convincing arguments to one style or the other we allow both styles.

{toc}

### Open source

We think this will be a hard one for you to argue with. If this wasn't open source we would not have
this conversation.

### React

We like the React way of thinking and have seen it's effect on our productivity, consistency and
quality. We are quite pleased with the team behind it, the documentation and it's release and
migration management.

React sparked a few similar alternatives, we however stick with the big one.

Another reason is that React does not have a lot of magic. It does not have framework specific
constructs to perform loops or display content. This does not mean the code is easily portable to
another framework, but it does mean that developers can understand it fairly easy with javascript.

And because it's "just javascript" we can use functions and imports to reuse our html code.

In order to make working with `React` even more pleasant we make sure that `React` and
`React.Component` are available; you do not need to import them.

### Modern javascript

We try to keep up with the standard and are generally reluctant to add proposed experimental
features. We do however have added some non-standard features that we feel make our lives better:

- Dynamic import syntax
- Decorators
- Class properties
- Object rest spread

### Webpack

We have extensively looked at the alternatives and even started building our own build tool. This
however has convinced us that, even with it's flaws, Webpack is the right tool to use here.

This choice was reaffirmed by the last few releases where two important things happened:

1. The internals were improved massively with a new mechanism for hooks and some long overdue
   cleanup of code.
2. The defaults improved. It can now be used with a lot less configuration. On top of that we were
   able to remove a custom plugin because Webpack came with a plugin that did the same thing.

Still, some of the Webpack ecosystem is more complex than needed. This is why we have our own custom
plugins and loaders other than the common choices or defaults:

- Loading CSS
- Merging CSS
- Source maps

We are not afraid to bend Webpack to our needs, Webpack is very flexible and once you get to know
the source code of the beast this is quite doable.

### Express

There are alternatives for Express. But it is one of the libraries that is well known and most used.
On top of that, we do not have a lot of Node.js server code, so the attractive features of other
alternative frameworks have less weight.

We made the server that came with this library small and restrictive because we believe backend
processing should be done differently. The server is a component that you don't have to use,
everything (including hot reloading) can be used when you use the library with another server. We
did however provided you with an escape hatch that allows you to manipulate express using the
configuration.

### Convention over configuration

Ruby popularized this idea and it greatly helped us to reduce the amount of configuration needed to
create an application with only a bare minimum of configuration.

We try to be zero-configuration and you will find we are very reluctant to make something
configurable. In many cases we adopt a new convention rather than make something configurable.

We believe that this attitude helps us making better decisions and provide more consistency. One
example is a good illustration.

> We had a project where were asked to supply some html and css that another company would copy and
> paste into their server side code. This required us to abandon CSS module syntax with it's
> generated class names. Since this was the first use case and we didn't expect it to be a common
> occurence we just added `global(...)` to all of our class selectors.
>
> Some time later we encountered a similar situation and one of us asked if we could make it
> configurable. The result of this was that we came to the conclusion that only certain types of css
> files were most likely be used in this situation. And it was then that we decided that all
> `*.entry.css` files should not use css modules at all. This new convention fits the use cases
> perfectly.

### Postcss and cssnext

When we chose this we had enough experience with Sass and Less. While both alternatives had more
features we felt that postcss in combination with cssnext was enough for us. On top of that, it
fit very well with our vision for javascript: write in the code that will eventually become adopted.

At time of writing there is a new candidate on the horizon: CSS in javascript. We are still not sure
if we want to adopt this and to what degree. A few pro's and cons:

- It is moving css in the opposite direction of javascript. Javascript is moving to a more static
  and analyzable structure with it's import statements. CSS in js is moving towards a more dynamic
  approach.
- It makes communication between javascript and CSS significantly easier.
- It allows you to render only the essential CSS on your server.
- It moves the complications of supporting modern features from compile time to run time with impact
  on performance and complexity.
- It's quite young.
- It's popular.

If you think you can add to the discussion, feel free to help us gain more insight. Extensive
experience with it would be awesome as you could help us figure out the practical trade-offs.

### Root import using /

In node.js you will find yourself using `../` if you want to import something from another sibling
directory. This is fragile when moving around code. In the Webpack community it is common to add
the `src` directory as a module directory. This however poses a potential problem when a node
module shows up having the same name as one of the files or directories in your `src` directory.

There would for example be no distinction between the `src/config.js` file and `node_modules/config`
module. It solely depends on the resolution order what the result of `import 'config'` would be.

We chose to adopt using `/config` to select a file from the `src` directory. This corresponds with
the semantics of the browser where `/` also means the root of the website. This has the added
advantage that it prevents importing from the root of the file system.

### No configuration in client side javascript

We prevent imports of `@kaliber/config`, we do this to make sure no sensitive information ends up in
the javascript bundle. In order to pass configuration to the client side javascript you need to pass
it to the universal component as a prop.

If you need configuration in an `{name}.entry.js` file, you can use the same mechanism employed by
the universal system: put json in a data attribute and fetch it with javascript.

### Fingerprint all assets

Caching of browsers is great. And the best cache is one that never expires. In order to leverage
this all assets that a processed by our library are stored as files that have a hash as name. This
hash is a hash of the content and thus only changes when the content is different. This allows us to
do long term caching.

The downside is that you don't know how you need to load these files. We provide a few mechanisms
that create the script and style tags required for the current module. These mechanisms are however
only available when using this library to create the final html page.

In case you need to use a different framework you can rely on the generated JSON manifest files:

- `target/chunk-manifest.json`
- `target/css-manifest.json`
- `target/entry-manifest.json`

### Ask us

If you want to hear why we have made a certain choice, please create an issue.