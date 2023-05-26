const template = require('./target/server.html.js')

template({ title: 'Dynamic title' })
  .then(result => console.log(result))
  .catch(e => {
    console.log(e)
    console.log(e.stack)
  })
