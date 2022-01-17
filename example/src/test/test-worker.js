/* eslint-disable no-restricted-globals */
self.onmessage = ref => {
  const text = ref.data
  console.log('In worker:', ref)
  self.postMessage(`"${text}" - "${text}"`)
}
