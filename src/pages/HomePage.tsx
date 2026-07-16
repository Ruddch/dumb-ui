import { env } from '../config/env';
import { Link } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module } from '../components/layout/Module';
import { ProtocolSidebar } from '../components/layout/ProtocolSidebar';
import { ProtocolDiagram } from '../components/diagram/ProtocolDiagram';

export function HomePage() {
  return (
    <ForumLayout
      breadcrumb={<>You are here: <strong>Home</strong> &gt; Strategies</>}
      sidebar={<ProtocolSidebar />}
    >
      <Module title="Welcome to DUMB MONEY" announce>
        <p style={{ fontSize: 'var(--fs-body)' }}>
          <strong>{env.tokenSymbol}</strong> on Robinhood Chain. Swap {env.tokenSymbol}; fees buy NVDA (80% LP / 20% dividends) — when LP goes 100% USDG, close → buyback → burn.
        </p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 6 }}>
          Full protocol docs → <Link to="/docs">DOCS</Link>
        </p>
      </Module>

      <ProtocolDiagram />
    </ForumLayout>
  );
}
