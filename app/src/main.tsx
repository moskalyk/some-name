import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { KitProvider } from '@0xsequence/kit'
import { projectAccessKey, config } from './config'
import '@0xsequence/design-system/styles.css'
 
/*
Using `QueryClient` which is a dependency of `wagmi` that makes 
fetching, caching, synchronizing and updating server state in 
your web applications easy.
*/
const queryClient = new QueryClient() 
 
function Dapp() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}> 
        <KitProvider config={{projectAccessKey: projectAccessKey}}>
          <App />
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Dapp />
  </React.StrictMode>,
)