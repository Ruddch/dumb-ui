import { env } from '../config/env';
import { Link, useSearchParams } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module } from '../components/layout/Module';
import { ProtocolSidebar } from '../components/layout/ProtocolSidebar';
import { SwapTicket } from '../components/swap/SwapTicket';
import type { SwapSide } from '../lib/pool';

export function SwapPage() {
  const [params] = useSearchParams();
  const defaultSide: SwapSide = params.get('side') === 'sell' ? 'sell' : 'buy';

  return (
    <ForumLayout
      breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Swap</strong></>}
      sidebar={<ProtocolSidebar />}
    >
      <Module title="Order desk — buy / sell strategy tokens" announce>
        <p style={{ fontSize: 'var(--fs-small)' }}>
          Swap USDG ↔ {env.tokenSymbol} on Robinhood Chain via V4SwapExecutor + StrategyHook. Live hook fee and auto slippage shown below.
        </p>
      </Module>

      <Module title="Swap ticket">
        <SwapTicket defaultSide={defaultSide} showHistory />
      </Module>
    </ForumLayout>
  );
}
