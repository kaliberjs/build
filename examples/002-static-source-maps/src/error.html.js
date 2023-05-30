export default <TestError />

function TestError() {
  throw new Error('This error is thrown from source code at build time')

  return <div>Will never reach this code</div>
}
