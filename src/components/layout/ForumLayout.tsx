import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { env } from '../../config/env';
import { formatAddress } from '../../lib/format';
import { robinhoodChain } from '../../lib/chain';
import { TWITTER_URL } from '../../lib/links';

type ForumLayoutProps = {
  breadcrumb: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
};

const NAV = [
  { to: '/', label: 'HOME' },
  { to: '/swap', label: 'SWAP' },
  { to: '/lots', label: 'LOTS' },
  { to: '/charts', label: 'CHARTS' },
  { to: '/claim', label: 'CLAIM' },
];

export function ForumLayout({ breadcrumb, children, sidebar }: ForumLayoutProps) {
  const { pathname } = useLocation();
  const { address, isConnected, chainId } = useAccount();
  const { connect, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const wrongChain = isConnected && chainId !== env.chainId;

  return (
    <>
      <header className="banner-strip">
        <div className="banner-title">DUMB MONEY</div>
        <div className="banner-tagline">NVDA Strategy v2 · swap fees → NVDA LP → buyback &amp; burn · not financial advice</div>
      </header>

      <div className="member-bar">
        NVDA Strategy v2
        <span className="sep">|</span>
        Chain <span className="num">{env.chainId}</span>
        <span className="sep">|</span>
        Token <span className="num">{env.tokenSymbol}</span>
        <span className="sep">|</span>
        <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">@DumbMoneyGroup</a>
        <span className="sep">|</span>
        {isConnected ? (
          <>
            <button type="button" className="connect-btn" onClick={() => disconnect()}>
              {formatAddress(address!)} · disconnect
            </button>
            {wrongChain && (
              <>
                <span className="sep">|</span>
                <button
                  type="button"
                  className="connect-btn"
                  onClick={() => switchChain({ chainId: env.chainId })}
                >
                  Switch to Robinhood
                </button>
              </>
            )}
          </>
        ) : (
          <button
            type="button"
            className="connect-btn"
            disabled={connecting}
            onClick={() => connect({ connector: injected(), chainId: env.chainId })}
          >
            {connecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>

      <nav className="forum-nav" aria-label="Main navigation">
        {NAV.map(({ to, label }) => (
          <Link key={to} to={to} className={pathname === to ? 'active' : ''}>
            {label}
          </Link>
        ))}
        <Link to="/docs" className={pathname === '/docs' ? 'active' : ''}>DOCS</Link>
      </nav>

      <div className="breadcrumb">{breadcrumb}</div>

      <div className="forum-wrap">
        <main>{children}</main>
        {sidebar && <aside>{sidebar}</aside>}
      </div>

      <footer className="forum-foot">
        <p>&copy; 2026 DUMB MONEY Protocol · NVDA Strategy v2 on {robinhoodChain.name}. Not affiliated with Reddit, Robinhood, or your broker.</p>
        <p>On-chain UI. Numbers from Robinhood Chain mainnet. NFA.</p>
        <p>
          <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">X / Twitter · @DumbMoneyGroup</a>
        </p>
        <p className="credit">Powered by DumbBoard v1.0 · phpBB-style rendering engine</p>
      </footer>
    </>
  );
}
