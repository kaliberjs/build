import { useClientConfig } from '/ClientConfig'

export default function TestUrlApp({ initialPath }) {
  const config = useClientConfig()
  return (
    <div>{initialPath} - from config: {config.someConfigKey ? 'success' : 'failure'}</div>
  )
}
