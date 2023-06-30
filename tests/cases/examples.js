import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

const exampleDir = path.resolve('../examples')

const [,, pattern, testPattern] = process.argv

const output = process.env.OUTPUT

const buildFailureFilename = 'build.error'
const existenceOnlyFilename = 'existence.only'
const functionMarker = '[function]'

describe(`Examples (${exampleDir})`, () => {

  const examples = fs.readdirSync(exampleDir, { withFileTypes: true })
    .filter(x => x.isDirectory())

  examples.forEach(dir => {
    if (pattern && testPattern && (
      !pattern.startsWith('example') ||
      !dir.name.includes(testPattern))
    ) return

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
    const existenceOnlyPath = path.join(resultPath, existenceOnlyFilename)
    const existenceOnly = fs.existsSync(existenceOnlyPath)
      ? fs.readFileSync(existenceOnlyPath, { encoding: 'utf8' }).split('\n').filter(Boolean)
      : []

    expectedEntries.forEach(({ dir, entry }) => {
      describe(`${entry.isDirectory() ? 'directory' : 'file'} ${path.join(dir, entry.name)}`, () => {
        const isFunction = entry.name.endsWith(functionMarker)
        const actualName = entry.name.replace(functionMarker, '')
        const targetFilePath = path.join(targetPath, dir, actualName)

        it('exists', () => {
          const exists = fs.existsSync(targetFilePath)
          expect(exists).toEqual(true)
        })

        // if we need to, we can add exceptions in something like 'existence.only' (probably another file name)
        const maxSize = 5 * 1000
        it(`does not exceed ${formatBytes(maxSize)}`, () => {
          const { size } = fs.statSync(targetFilePath)
          expect(size).toBeLessThanOrEqual(maxSize)
        })

        if (entry.isDirectory() || existenceOnly.includes(path.join(dir, entry.name))) return

        const expectedFilePath = path.join(resultPath, dir, entry.name)
        it(`${isFunction ? 'returns' : 'has'} expected content`, async () => {
          if (isFunction)
            await checkFunctionContent({ expectedFilePath, targetFilePath, cwd: examplePath })
          else
            checkStaticContent({ expectedFilePath, targetFilePath })
        })
      })
    })

    it(`has not produced additional files`, () => {
      const expectedFiles = expectedEntries.map(x => path.join(x.dir, x.entry.name))
      const entriesInTarget = gatherEntriesRecursively({ targetPath })
      const filesInTarget = entriesInTarget.map(x => path.join(x.dir, x.entry.name))
      const result = filesInTarget
        .filter(found =>
          !expectedFiles.includes(found) && !expectedFiles.includes(`${found}${functionMarker}`)
        )

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

async function execCommand({ command, cwd, logOutputOn }) {
  return new Promise((resolve, reject) =>
    exec(command, { cwd }, (e, stdout, stderr) => {
      const success = !e
      const logOutput = success ? logOutputOn === 'success' : logOutputOn === 'failure'

      if (logOutput || output) {
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)
      }

      if (success) resolve(stdout || stderr)
      else reject(e)
    })
  )
}

async function executeFunction({ targetFilePath, input, cwd, logOutputOn }) {
  const output = await execCommand({
    command: [
      'node' ,
      '--input-type=module',
      '--enable-source-maps',
      '--eval',
      `"import f from '${targetFilePath}'; process.stdout.write(f(${input}))"`,
    ].join(' '),
    cwd,
    logOutputOn
  })

  return output
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

function checkStaticContent({ expectedFilePath, targetFilePath }) {
  const expectedContent = fs.readFileSync(expectedFilePath, { encoding: 'utf8' })
  const content = fs.readFileSync(targetFilePath, { encoding: 'utf8' })

  expect(content).toEqual(expectedContent)
}

async function checkFunctionContent({ expectedFilePath, targetFilePath, cwd }) {
  const functionInstructions = fs.readFileSync(expectedFilePath, { encoding: 'utf8' })
  const { input, output, error } = extractInputAndOutput(functionInstructions)

  const resultPromise = executeFunction({
    targetFilePath, input, cwd,
    logOutputOn: error ? 'success' : 'failure'
  })

  if (error) await expect(resultPromise).rejects.toThrowError(error)
  if (output) await expect(resultPromise).resolves.toEqual(output)
}

function extractInputAndOutput(functionInstructions) {
  const { result } = functionInstructions.split('\n')
    .reduce(
      ({ result, mode }, line) => {
        if (mode === 'search-input' && line === 'input')
          return { result, mode: 'input' }

        if (mode === 'input')
          return { result: { ...result, input: line }, mode: 'search-output-or-error'}

        if (mode === 'search-output-or-error')
          if (line === 'output') return { result, mode: 'output' }
          if (line === 'error') return { result, mode: 'error' }

        if (mode === 'output')
          return { result: { ...result, output: result.output.concat(line) }, mode: 'output'}

        if (mode === 'error')
          return { result: { ...result, error: result.error.concat(line) }, mode: 'error'}

        return { result, mode }
      },
      { result: { input: null, output: [], error: [] }, mode: 'search-input' }
    )

  const { input, output, error } = result

  return { input, output: output.join('\n'), error: error.join('\n') }
}

function formatBytes(bytes) {
  const byteFormatter = new Intl.NumberFormat([], {
    style: 'unit',
    unit: 'byte',
    notation: "compact",
    unitDisplay: "narrow",
  })
  return byteFormatter.format(bytes)
}