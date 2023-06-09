import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

const exampleDir = path.resolve('../examples')

const [,, pattern, testPattern] = process.argv

const buildFailureFilename = 'build.error'
const existenceOnlyFilename = 'existence.only'

describe(`Examples (${exampleDir})`, () => {

  const examples = fs.readdirSync(exampleDir, { withFileTypes: true })
    .filter(x => x.isDirectory())

  examples.forEach(dir => {
    if (pattern && (!pattern.startsWith('example') || !dir.name.includes(testPattern))) return

    describe(dir.name, () => {
      const examplePath = path.join(exampleDir, dir.name)
      const resultPath = path.join(examplePath, 'result')
      const expectedEntries = gatherEntriesRecursively({ targetPath: resultPath })
        .filter(({ entry }) => entry.name !== existenceOnlyFilename)

      if (expectedEntries.some(x => x.entry.name === buildFailureFilename))
        testBuildFailure({ examplePath, resultPath })
      else
        testBuildSuccess({ examplePath, resultPath, expectedEntries })
    })
  })
})

function testBuildSuccess({ examplePath, resultPath, expectedEntries }) {
  it(`run build with success`, async () => {
    await execCommand({ command: 'yarn build', cwd: examplePath, logOutputOn: 'failure' })
  })

  describe(`produce the expected files and directories`, () => {
    const targetPath = path.join(examplePath, 'target')
    const entriesInTarget = gatherEntriesRecursively({ targetPath })
    const existenceOnlyPath = path.join(resultPath, existenceOnlyFilename)
    const existenceOnly = fs.existsSync(existenceOnlyPath)
      ? fs.readFileSync(existenceOnlyPath, { encoding: 'utf8' }).split('\n').filter(Boolean)
      : []

    expectedEntries.forEach(({ dir, entry }) => {
      describe(`${path.join(dir, entry.name)}`, () => {
        const filePath = path.join(targetPath, dir, entry.name)

        it('exists', () => {
          const exists = fs.existsSync(filePath)
          expect(exists).toEqual(true)
        })

        if (entry.isDirectory() || existenceOnly.includes(path.join(dir, entry.name))) return

        const expectedFilePath = path.join(resultPath, dir, entry.name)
        it('has expected content', () => {
          const expectedContent = fs.readFileSync(expectedFilePath, { encoding: 'utf8' })
          const content = fs.readFileSync(filePath, { encoding: 'utf8' })

          expect(content).toEqual(expectedContent)
        })
      })
    })

    it(`has not produced additional files`, () => {

      const result = entriesInTarget
        .filter(found =>
          !expectedEntries.some(expected =>
            expected.dir === found.dir &&
            expected.entry.name === found.entry.name
          )
        )
        .map(x => path.join(x.dir, x.entry.name))

      expect(result).toHaveLength(0)
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

function gatherEntriesRecursively({ targetPath, dir = '' }) {
  return fs.readdirSync(path.join(targetPath, dir), { withFileTypes: true })
    .map(x => ({ dir, entry: x }))
    .flatMap(x =>
      [x].concat(
        x.entry.isDirectory()
          ? gatherEntriesRecursively({ targetPath, dir: path.join(dir, x.entry.name) })
        : []
      )
    )
}
