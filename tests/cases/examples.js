import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

const exampleDir = path.resolve('../examples')

describe(`Examples (${exampleDir})`, () => {

  const examples = fs.readdirSync('../examples', { withFileTypes: true })
    .filter(x => x.isDirectory())

  examples.forEach(dir => {
    describe(dir.name, () => {
      const examplePath = path.join(exampleDir, dir.name)
      const command = 'yarn build'

      it(`run build (${command})`, async () => {
        await execCommand({ command, cwd: examplePath })
      })

    })
  })
})

function execCommand({ command, cwd }) {
  return new Promise((resolve, reject) =>
    exec(command, { cwd }, (e, stdout, stderr) => {
      if (e) return reject(e)

      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)

      resolve(undefined)
    })
  )
}
