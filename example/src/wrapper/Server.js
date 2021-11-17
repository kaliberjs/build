import { useClientConfig } from '/ClientConfig'

// eslint-disable-next-line @kaliber/no-default-export
export default function ServerWrapper({ children, ...props }) {
  const clientConfigContext = useClientConfig()
  return React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, { clientConfigContext })
      : child
  )
}
