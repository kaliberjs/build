import { useClientConfig } from '/ClientConfig'

export default function TestUrlApp({ initialPath, expectFailure = false }) {
  const config = useClientConfig()
  return (
    <div>{initialPath} - from config: {config.someConfigKey ? 'success' : 'failure'}{expectFailure && !config.someConfigKey && ' (this is good)'}</div>
  )
}
