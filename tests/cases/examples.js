import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

const exampleDir = path.resolve('../examples')

const [,, pattern, testPattern] = process.argv

const buildFailureFilename = 'build.error'

describe(`Examples (${exampleDir})`, () => {

  const examples = fs.readdirSync(exampleDir, { withFileTypes: true })
    .filter(x => x.isDirectory())

  examples.forEach(dir => {
    if (pattern && (!pattern.startsWith('example') || !dir.name.includes(testPattern))) return

    describe(dir.name, () => {
      const examplePath = path.join(exampleDir, dir.name)
      const resultPath = path.join(examplePath, 'result')
      const expectedFiles = fs.readdirSync(resultPath, { recursive: true, withFileTypes: true })

      if (!expectedFiles.some(x => x.name === buildFailureFilename))
        testBuildSuccess({ examplePath, resultPath, expectedFiles })
      else
        testBuildFailure({ examplePath, resultPath })
    })
  })
})

function testBuildSuccess({ examplePath, resultPath, expectedFiles }) {
  it(`run build with success`, async () => {
    await execCommand({ command: 'yarn build', cwd: examplePath, logOutputOn: 'failure' })
  })

  describe(`produce the expected files`, () => {
    const targetPath = path.join(examplePath, 'target')

    expectedFiles.forEach(file => {
      describe(`${file.name}`, () => {
        const filePath = path.join(targetPath, file.name)
        const expectedFilePath = path.join(resultPath, file.name)

        it('exists', () => {
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
}

function testBuildFailure({ examplePath, resultPath }) {
  it(`fails the build with expected error`, async () => {
    const errorFilePath = path.join(resultPath, buildFailureFilename)
    const expectedError = fs.readFileSync(errorFilePath, { encoding: 'utf8' })

    await expect(execCommand({ command: 'yarn build', cwd: examplePath, logOutputOn: 'success' }))
      .rejects.toThrowError(expectedError)
  })
}

function execCommand({ command, cwd, logOutputOn }) {
  return new Promise((resolve, reject) =>
    exec(command, { cwd }, (e, stdout, stderr) => {
      const success = !e
      const logOutput = success ? logOutputOn === 'success' : logOutputOn === 'failure'

      if (logOutput) {
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)
      }

      if (e) reject(e)
      else resolve(undefined)
    })
  )
}
