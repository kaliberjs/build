import fs from 'fs'
import merge from 'rollbar/src/merge'

const snippet = fs.readFileSync(__non_webpack_require__.resolve('rollbar/dist/rollbar.snippet.js'), 'utf8')

const defaultOptions = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  scrubTelemetryInputs: true,
  captureIp: false,
  payload: { environment: process.env.CONFIG_ENV },
  autoInstrument: { log: process.env.NODE_ENV === 'production' },
}

export default function rollbar(options) {
  const config = JSON.stringify(merge(defaultOptions, options))
  const __html = `var _rollbarConfig = ${config};${snippet}`
  return <script dangerouslySetInnerHTML={{ __html }} />
}
