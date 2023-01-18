const path = require('path')
const childProcess = require('child_process')

module.exports = {
  evalInFork,
  appendSourceMap,
}

async function evalInFork(message) {
  return new Promise((resolve, reject) => {
    const fork = childProcess.fork(
      path.join(__dirname, 'eval-in-fork.js'),
      [],
      { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }
    )
    const outData = []
    const errData = []
    const messageData = []
    fork.on('message', x => messageData.push(x))
    fork.stdout.on('data', x => outData.push(x))
    fork.stderr.on('data', x => errData.push(x))
    fork.on('close', code => {
      if (outData.length) console.log(outData.join(''))
      if (code === 0) {
        if (!messageData.length) reject(new Error('Execution failed, no result from eval'))
        else resolve(messageData.join(''))
      } else reject(new Error(errData.join('')))
    })

    fork.send(message)
  })
}

function appendSourceMap(name, { source, map }) {
  map.sources = map.sources.map(source => {
    try { return require.resolve(source) } catch (_) { return `/.../${source}` }
  })

  const base64Map = Buffer.from(JSON.stringify(map), 'utf-8').toString('base64')
  const sourceMap = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Map}`
  return `${source}\n${sourceMap}\n//# sourceURL=${name}`
}
