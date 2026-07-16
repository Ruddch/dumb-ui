type LoopBoxVariant = 'default' | 'highlight' | 'burn';

function LoopBox({ children, variant = 'default' }: { children: string; variant?: LoopBoxVariant }) {
  return <span className={`loop-box loop-box--${variant}`}>{children}</span>;
}

function LoopArrow() {
  return <span className="loop-arrow" aria-hidden="true">&gt;</span>;
}

/**
 * Forum-post flywheel — matches NVDA Strategy v2:
 * swap fees → buy NVDA → 80% LP / 20% treasury → LP → 100% USDG → close → buyback → burn
 */
export function ProtocolDiagram() {
  return (
    <section className="post-row loop-post" aria-label="Protocol flywheel: THE LOOP">
      <div className="vote-col" aria-hidden="true">
        <div className="vote-arrow up" />
        <div className="vote-score">420</div>
        <div className="vote-arrow down" />
      </div>

      <div className="post-body">
        <div className="post-meta">
          <span className="avatar">DM</span>
          submitted by <span className="user">u/DiamondHandsDave</span>
          <span className="chain-badge">Robinhood Chain L2</span>
          &nbsp;&middot;&nbsp; pinned by moderators
        </div>

        <h2 className="post-title">rwa on robinhood is undervalued. here&apos;s the loop.</h2>

        <div className="post-text">
          <p className="loop-callout">we know how to fix it — no thinking required.</p>

          <div className="the-loop-wrap">
            <p className="the-loop-heading">THE LOOP</p>

            <div className="loop-row">
              <LoopBox>swap fees</LoopBox>
              <LoopArrow />
              <LoopBox variant="highlight">buy NVDA</LoopBox>
              <LoopArrow />
              <LoopBox>open LP</LoopBox>
              <LoopArrow />
              <LoopBox>LP → 100% USDG</LoopBox>
            </div>

            <div className="loop-row">
              <LoopBox>close LP</LoopBox>
              <LoopArrow />
              <LoopBox>buyback</LoopBox>
              <LoopArrow />
              <LoopBox variant="burn">burn</LoopBox>
            </div>

            <div className="loop-subsection">
              <p className="loop-subsection-label">after NVDA buy — 80% LP · 20% dividends</p>
              <div className="loop-row loop-row--secondary">
                <LoopBox>20% NVDA treasury</LoopBox>
                <LoopArrow />
                <LoopBox>NVDA dividends</LoopBox>
                <LoopArrow />
                <LoopBox>paid to holders</LoopBox>
              </div>
            </div>
          </div>
        </div>

        <div className="post-footer">
          <span className="num">420 upvotes</span> &nbsp;&middot;&nbsp; NFA
        </div>
      </div>
    </section>
  );
}
