const storage = require('@google-cloud/storage')

const { server: { firebase: { credentials } } } = require('@kaliber/config')
const bucket = storage({ credentials }).bucket('test-fae90.appspot.com')


const file = bucket.file('test/test2.txt')
file.save('test2', { validation: 'md5', resumable: false, metadata: { conentType: 'text/plain' } })
  .then(_ => console.log('done'))
  .then(_ => 
    file.getSignedUrl({ action: 'read', expires: '03-17-2025' }).then(url => { console.log(url) })
  )
  .catch(e => console.error(e))

// https://storage.googleapis.com/test-fae90.appspot.com/test/test.txt
// function getDownloadUrl(fileName) { return `https://firebasestorage.googleapis.com/v0/b/test-fae90.appspot.com/o/test/test.txt?alt=media` }
