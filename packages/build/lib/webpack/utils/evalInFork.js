import childProcess from 'node:child_process'

export async function evalInFork({ javascript, message }) {

  return new Promise((resolve, reject) => {
    const outData = []
    const errData = []
    const messageData = []

    const fork = childProcess.fork(
      javascript,
      [],
      { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }
    )

    fork.on('message', x => messageData.push(x))
    fork.stdout.on('data', x => outData.push(x))
    fork.stderr.on('data', x => errData.push(x))

    fork.on('close', code => {
      if (outData.length) console.log(outData.join(''))
      if (code) return reject(new Error(errData.join('')))
      if (!messageData.length) return reject(new Error('Execution failed, no result from eval'))

      resolve(messageData.join(''))
    })

    fork.send(message)
  })
}
