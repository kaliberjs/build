self.onmessage = ref => {
  var text = ref.data
  console.log('from worker', ref)
  self.postMessage({
    text: text + '-' + text
  })
}
