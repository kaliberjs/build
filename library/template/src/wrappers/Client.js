import { ClientConfigProvider } from '/machinery/ClientConfig'

// eslint-disable-next-line @kaliber/no-default-export
export default function ClientWrapper({ children, ...props }) {
  const { clientContext } = props

  return (
    <ClientConfigProvider config={clientContext.clientConfig}>
      {children}
    </ClientConfigProvider>
  )
}
