import { env } from '../config/env';
import { Link } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module } from '../components/layout/Module';
import { ProtocolSidebar } from '../components/layout/ProtocolSidebar';
import { SwapTicket } from '../components/swap/SwapTicket';
import { ProtocolDiagram } from '../components/diagram/ProtocolDiagram';

export function HomePage() {
  return (
    <ForumLayout
      breadcrumb={<>You are here: <strong>Home</strong> &gt; Strategies</>}
      sidebar={<ProtocolSidebar />}
    >
      <Module title="Welcome to DUMB MONEY" announce>
        <p style={{ fontSize: 'var(--fs-body)' }}>
          <strong>{env.tokenSymbol}</strong> on Robinhood Chain. Swap {env.tokenSymbol}, fees buy NVDA and open LP — when LP goes 100% USDG, close → buyback → burn.
        </p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 6 }}>
          Full protocol docs → <Link to="/docs">DOCS</Link>
        </p>
      </Module>

      <ProtocolDiagram />

      <Module title="Swap ticket — quick trade">
        <SwapTicket compact />
      </Module>
    </ForumLayout>
  );
}
