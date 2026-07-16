import { Link } from 'react-router-dom';
import { Module, StatRow } from './Module';
import { useProtocolStats } from '../../hooks/useProtocolStats';
import { formatBps, formatTokenAmount, formatUsdAmount } from '../../lib/format';
import { env } from '../../config/env';
import { getBuyFeeCountdownLabel } from '../../lib/swap';
import { TWITTER_URL } from '../../lib/links';

export function ProtocolSidebar() {
  const { data, isLoading, isError } = useProtocolStats();

  if (isLoading) {
    return (
      <Module title="Protocol stats">
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>Loading on-chain data…</p>
      </Module>
    );
  }

  if (isError || !data) {
    return (
      <Module title="Protocol stats">
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--loss)' }}>Could not load chain data.</p>
      </Module>
    );
  }

  const countdown = getBuyFeeCountdownLabel(data.launchTimestamp, data.buyFeeBps);

  return (
    <>
      <Module title={`About DUMB MONEY · ${env.tokenSymbol}`}>
        <StatRow label={`${env.tokenSymbol} price`} value={`$${data.stratPriceUsdg.toPrecision(4)}`} />
        <StatRow label="Buy hook fee" value={formatBps(data.buyFeeBps)} />
        <StatRow label="Sell hook fee" value={formatBps(data.sellFeeBps)} />
        {countdown && <StatRow label="Fee decay" value={<span style={{ fontSize: 10 }}>{countdown}</span>} />}
        <StatRow label="Total burned" value={`${formatTokenAmount(data.totalBurned, 18, 0)} ${env.tokenSymbol}`} />
        <StatRow label="Fees collected" value={`${formatUsdAmount(data.totalFees)} USDG`} />
        <StatRow label="Buyback pending" value={`${formatUsdAmount(data.pendingUSDG)} USDG`} />
        <StatRow label="Buyback ready" value={data.canBuyback ? 'YES' : 'no'} tone={data.canBuyback ? 'up' : undefined} />
        <StatRow label="Lot threshold" value={`${formatUsdAmount(data.lotThreshold)} USDG`} />
        <hr className="dotted-rule" />
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>
          {env.tokenSymbol} on Robinhood Chain. Swap fees → NVDA LP → buyback &amp; burn {env.tokenSymbol}.
        </p>
      </Module>

      <Module title="Quick links">
        <p style={{ fontSize: 'var(--fs-small)' }}><Link to="/docs">→ Protocol docs</Link></p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 4 }}><Link to="/swap">→ Swap desk</Link></p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 4 }}><Link to="/lots">→ Protocol lots</Link></p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 4 }}><Link to="/claim">→ Claim dividends</Link></p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 4 }}>
          <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">→ @DumbMoneyGroup on X</a>
        </p>
      </Module>
    </>
  );
}
