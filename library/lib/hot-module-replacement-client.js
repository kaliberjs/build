const ansiRegex = require('ansi-regex');

export default port => {
  console.log('Starting hot module reload client with port', port)
  const ws = new WebSocket('ws://localhost:' + port)

  ws.onopen = _ => { console.log('Waiting for signals') }
  ws.onmessage = event => {
    switch (event.data) {
      case 'done':
        document.querySelectorAll('link[rel="stylesheet"]')
          .forEach(el => {
            const href = el.getAttribute('href')
            if (!href.startsWith('http')) {
              // This might cause problems in the future when we need to add styles with
              // a query string. We'll fix it when we have a use case
              const replacement = href.replace(/\?.*/, '') + `?v=${Date.now()}`
              el.setAttribute('href', replacement)
            }
          })

        module.hot.check(false)
          .then(updatedModules => {
            if (!updatedModules) { /* no updates */ }

            module.hot.apply({
              ignoreErrored: true,
              onErrored: ({ error }) => {
                error.message = error.message.replace(ansiRegex(), '')

                console.error(error)
              }
            }).then(renewedModules => {
                const ignoredModules = updatedModules.filter(x => !renewedModules.includes(x))
                if (ignoredModules.length) console.warn('Ignored modules: ' + ignoredModules.join(', '))
              })
              .catch(err => {
                console.error('Error during hot reload apply')
                console.error(err)
              })
          })
          .catch(err => {
            console.error('Problem checking for hot reload updates')
            console.error(err)
          })
        break;
      case 'failed':
        console.warn('Compilation failed')
        break;
    }
  }
}
