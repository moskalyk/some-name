import { getDefaultChains, getDefaultConnectors } from '@0xsequence/kit'
import { createConfig, http } from 'wagmi'
 
export const projectAccessKey = 'AQAAAAAAAAApYx7vLavI6_nHAZBZkMKCZvA'
 
const chains = getDefaultChains() // optionally, supply an array of chain ID's getDefaultChains([1,137])
const transports = Object.fromEntries(chains.map(chain => [chain.id, http()]))
 
// works locally on http://localhost:4444
const connectors = getDefaultConnectors({
  walletConnectProjectId: "458215b98fce3f9f700f2c233b932ae1",
  defaultChainId: 1,
  appName: 'blurp',
  projectAccessKey
})
 
export const config = createConfig({
  transports,
  connectors,
  chains
})