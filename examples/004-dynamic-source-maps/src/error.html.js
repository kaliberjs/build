export default function TestError(props) {

  throw new Error(`This error is thrown from source code at run time with props:\n${JSON.stringify(props)}`)

  return <div>Will never reach this code</div>
}
