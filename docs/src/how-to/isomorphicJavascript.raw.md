## Isomorphic (Universal) javascript

Isomorphic javascript is javascript that is executed both on the server and client. Server here can
also be a build server (or your local machine). A better distinction is code that is run by node.js
and by the browser.

One of the design goals of this library was to make isomorphic/universal javascript as easy as it
can be.

{toc}

### universal

To make a component 'isormorphic' or 'universal' the only thing you need to do is import it with
`?universal` appended.


- `?universal`
- `window` and `componentDidMount`
- initial data
- routing - the general idea
- page transitions
- when to use