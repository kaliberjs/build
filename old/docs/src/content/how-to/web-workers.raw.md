## Web Workers

Web Workers are a tool to run scripts in background threads. The worker threads can perform tasks without interfering with the user interface. This can be used to offload heavy tasks from the main js thread. Extra information about this subject can be found on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

Browser support is great for this feature: [caniuse](https://caniuse.com/?search=web%20workers)

### How to use?
One important thing is that web workers are only working on the client so we need to load these when the component mounts to the dom. Don't forget to terminate the worker on unmounting to prevent unpredictable behavior.

`heavy-component.js`
```js
const [fromWorker, setFromWorker] = React.useState(null)

React.useEffect(
  () => {
    const currentWorker = new Worker(require('./worker?webworker'))
    
    currentWorker.postMessage('send data to the worker')
    currentWorker.onmessage = e => setFromWorker(e.data)

    return () => currentWorker.terminate()
  }, 
  []
)

return fromWorker && <HeavyComponent data={fromWorker} />
```

`worker.js`
```js
self.onmessage = ref => {
  const text = ref.data
  console.log('In worker:', ref)
  self.postMessage(data) // send back data
}
```

## More advanced
This example gets a file path downloads the excel file and parses it to a json object end sends this back to the component that did the request.

`xlsx-worker.js`
```js
import XLSX from 'xlsx'

self.onmessage = async ref => {
  const { file } = ref.data
  if (!file) return

  const response = await fetch(file)
  const buffer = await response.arrayBuffer()

  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  workbook.SheetNames.forEach((sheetName) => {
    const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    self.postMessage({ json })
  })
}
```
