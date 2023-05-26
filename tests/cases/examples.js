import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

const exampleDir = path.resolve('../examples')

describe(`Examples (${exampleDir})`, () => {

  const examples = fs.readdirSync(exampleDir, { withFileTypes: true })
    .filter(x => x.isDirectory())

  examples.forEach(dir => {
    describe(dir.name, () => {
      const examplePath = path.join(exampleDir, dir.name)

      it(`run build with success`, async () => {
        await execCommand({ command: 'yarn build', cwd: examplePath })
      })

      describe(`produce the expected files`, () => {
        const resultPath = path.join(examplePath, 'result')
        const targetPath = path.join(examplePath, 'target')
        const expectedFiles = fs.readdirSync(resultPath, { recursive: true, withFileTypes: true })

        expectedFiles.forEach(file => {
          describe(`${file.name}`, () => {
            const filePath = path.join(targetPath, file.name)
            const expectedFilePath = path.join(resultPath, file.name)

            it('exists', async () => {
              const exists = fs.existsSync(filePath)
              expect(exists).toEqual(true)
            })
            it('has expected content', () => {
              const expectedContent = fs.readFileSync(expectedFilePath, { encoding: 'utf8' })
              const content = fs.readFileSync(filePath, { encoding: 'utf8' })

              expect(content).toEqual(expectedContent)
            })
          })
        })

      })

    })
  })
})

function execCommand({ command, cwd }) {
  return new Promise((resolve, reject) =>
    exec(command, { cwd }, (e, stdout, stderr) => {
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)

      if (e) reject(e)
      else resolve(undefined)
    })
  )
}
