import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { robinhoodChain } from './lib/chain';
import { env } from './config/env';
import { HomePage } from './pages/HomePage';
import { SwapPage } from './pages/SwapPage';
import { LotsPage } from './pages/LotsPage';
import { ClaimPage } from './pages/ClaimPage';
import { DocsPage } from './pages/DocsPage';
import './styles/forum.css';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(env.rpcUrl),
  },
});

createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/lots" element={<LotsPage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </WagmiProvider>,
);
