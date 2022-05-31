/** @type {React.Context<any>} */
const clientConfigContext = React.createContext(null)

export function ClientConfigProvider({ children, config }) {
  return <clientConfigContext.Provider value={config} {...{ children }} />
}

export function useClientConfig() {
  const config = React.useContext(clientConfigContext)
  if (!config) throw new Error('Please use a `ClientConfigProvider` to provide a client config')
  return config
}
