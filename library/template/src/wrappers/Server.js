import { useClientConfig } from '/machinery/ClientConfig'

// eslint-disable-next-line @kaliber/no-default-export
export default function ServerWrapper({ children, ...props }) {
  const clientConfig = useClientConfig()
  const clientContext = { clientConfig }

  return React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, { clientContext })
      : child
  )
}
