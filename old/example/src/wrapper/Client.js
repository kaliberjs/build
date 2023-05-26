import { ClientConfigProvider } from '/ClientConfig'

// eslint-disable-next-line @kaliber/no-default-export
export default function ClientWrapper({ children, ...props }) {
  return <ClientConfigProvider config={props.clientConfigContext} {...{ children }} />
}
