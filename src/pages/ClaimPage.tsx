import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAccount,
  useConnect,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module, StatRow } from '../components/layout/Module';
import { env } from '../config/env';
import { useTreasury } from '../hooks/useTreasury';
import { treasuryAbi } from '../lib/contracts';
import {
  fetchDividendManifest,
  lookupClaim,
  parseProofText,
} from '../lib/dividends';
import { formatTokenAmount, parseDecimalInput } from '../lib/format';

export function ClaimPage() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, isPending: connecting } = useConnect();
  const { switchChain } = useSwitchChain();
  const client = usePublicClient();
  const treasury = useTreasury(undefined, address);

  const claimableEpoch = treasury.data?.claimableEpoch ?? 0n;
  const epoch = treasury.data?.epoch;
  const currentEpochInfo = treasury.data?.currentEpochInfo;
  const nvdaBalance = treasury.data?.nvdaBalance ?? 0n;
  const accumulated = currentEpochInfo?.totalDividends ?? nvdaBalance;
  const userClaim = treasury.data?.userClaim;
  const epochDays = treasury.data?.epochDuration
    ? Number(treasury.data.epochDuration) / 86400
    : 7;

  const [weightedBal, setWeightedBal] = useState('');
  const [claimAmt, setClaimAmt] = useState('');
  const [proofText, setProofText] = useState('');
  const [manifestStatus, setManifestStatus] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!address || claimableEpoch === 0n) return;
    let cancelled = false;

    async function load() {
      setManifestStatus('Loading manifest…');
      const manifest = await fetchDividendManifest(claimableEpoch);
      if (cancelled) return;
      if (!manifest) {
        setManifestStatus(env.dividendsManifestUrl
          ? 'Manifest not found — enter proof manually below.'
          : 'Set VITE_DIVIDENDS_MANIFEST_URL or paste proof manually.');
        return;
      }
      const entry = lookupClaim(manifest, address!);
      if (!entry) {
        setManifestStatus(`No entry for your address in epoch ${claimableEpoch} manifest.`);
        return;
      }
      setWeightedBal(entry.weightedBalance);
      setClaimAmt(entry.claimAmount);
      setProofText(entry.proof.join('\n'));
      setManifestStatus(`Loaded from manifest (epoch ${manifest.epochId}).`);
    }

    load();
    return () => { cancelled = true; };
  }, [address, claimableEpoch]);

  useEffect(() => {
    if (isSuccess && txHash) {
      setOk(`CLAIMED · tx ${txHash.slice(0, 10)}…`);
      reset();
      treasury.refetch();
    }
  }, [isSuccess, txHash]);

  const weightedRaw = parseDecimalInput(weightedBal, env.stratDecimals);
  const claimRaw = parseDecimalInput(claimAmt, env.nvdaDecimals);
  const proof = parseProofText(proofText);

  const handleClaim = async () => {
    setErr('');
    setOk('');
    if (!isConnected || !address) {
      connect({ connector: injected(), chainId: env.chainId });
      return;
    }
    if (chainId !== env.chainId) {
      switchChain({ chainId: env.chainId });
      return;
    }
    if (claimableEpoch === 0n) {
      setErr('No claimable epoch right now.');
      return;
    }
    if (userClaim?.hasClaimed) {
      setErr('Already claimed this epoch.');
      return;
    }
    if (!weightedRaw || !claimRaw || claimRaw <= 0n) {
      setErr('Enter weighted balance and claim amount.');
      return;
    }
    if (proof.length === 0) {
      setErr('Merkle proof required (one 0x hash per line).');
      return;
    }

    try {
      if (client) {
        await client.simulateContract({
          address: env.treasury,
          abi: treasuryAbi,
          functionName: 'claimDividends',
          args: [claimableEpoch, weightedRaw, claimRaw, proof],
          account: address,
        });
      }
      writeContract({
        address: env.treasury,
        abi: treasuryAbi,
        functionName: 'claimDividends',
        args: [claimableEpoch, weightedRaw, claimRaw, proof],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Claim simulation failed — check proof.');
    }
  };

  const sidebar = (
    <>
      <Module title="How dividends work">
        <p style={{ fontSize: 'var(--fs-small)' }}>
          On each lot execute, 20% of purchased NVDA goes to Treasury. Every {epochDays} days an epoch ends,
          gets finalized with a Merkle root, then {env.tokenSymbol} holders claim <strong>NVDA</strong> proportional to weighted balance.
        </p>
        <hr className="dotted-rule" />
        <StatRow label="Epoch length" value={`${epochDays} days`} />
        <StatRow label="Payout token" value="NVDA" />
        <StatRow label="Claim window" value="previous epoch only" />
        <StatRow label="Leaf hash" value="keccak256(addr, weight, amt)" />
      </Module>
    </>
  );

  return (
    <ForumLayout
      breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Claim</strong></>}
      sidebar={sidebar}
    >
      <Module title="Dividend claim desk — TreasuryV2" announce>
        <p style={{ fontSize: 'var(--fs-small)' }}>
          Claim NVDA dividends for the active finalized epoch. You need a valid Merkle proof for your wallet.
        </p>
      </Module>

      <div className="lots-summary">
        <div className="sum-box">
          <div className="lbl">Accumulated</div>
          <div className="val num up">{formatTokenAmount(accumulated, env.nvdaDecimals, 4)} NVDA</div>
        </div>
        <div className="sum-box">
          <div className="lbl">Current epoch</div>
          <div className="val num">{treasury.data?.currentEpoch?.toString() ?? '—'}</div>
        </div>
        <div className="sum-box">
          <div className="lbl">Claimable epoch</div>
          <div className="val num">{claimableEpoch > 0n ? claimableEpoch.toString() : 'none'}</div>
        </div>
        <div className="sum-box">
          <div className="lbl">Your status</div>
          <div className={`val num ${userClaim?.hasClaimed ? '' : 'up'}`}>
            {userClaim?.hasClaimed ? 'CLAIMED' : claimableEpoch > 0n ? 'ELIGIBLE?' : '—'}
          </div>
        </div>
      </div>

      {currentEpochInfo && currentEpochInfo.epochId > 0n && (
        <Module title={`Epoch #${currentEpochInfo.epochId.toString()} — accumulating`}>
          <StatRow
            label="Dividends this epoch"
            value={`${formatTokenAmount(currentEpochInfo.totalDividends, env.nvdaDecimals, 4)} NVDA`}
            tone="up"
          />
          <StatRow
            label="Treasury NVDA balance"
            value={`${formatTokenAmount(nvdaBalance, env.nvdaDecimals, 4)} NVDA`}
          />
          {currentEpochInfo.startTime > 0n && (
            <StatRow
              label="Started"
              value={new Date(Number(currentEpochInfo.startTime) * 1000).toLocaleString()}
            />
          )}
          <StatRow
            label="Status"
            value={currentEpochInfo.endTime > 0n ? 'ended — awaiting finalize' : 'open · deposits accruing'}
          />
        </Module>
      )}

      {epoch && claimableEpoch > 0n && (
        <Module title={`Epoch #${claimableEpoch.toString()} snapshot`}>
          <StatRow label="Total dividends" value={`${formatTokenAmount(epoch.totalDividends, env.nvdaDecimals, 4)} NVDA`} />
          <StatRow label="Already claimed" value={`${formatTokenAmount(epoch.claimedAmount, env.nvdaDecimals, 4)} NVDA`} />
          <StatRow label="Finalized" value={epoch.isFinalized ? 'yes' : 'no'} />
          <StatRow label="Claimable" value={epoch.isClaimable ? 'YES' : 'no'} tone={epoch.isClaimable ? 'up' : undefined} />
          <StatRow label="Merkle root" value={<span style={{ fontSize: 9 }}>{epoch.merkleRoot}</span>} />
          {epoch.startTime > 0n && (
            <StatRow
              label="Started"
              value={new Date(Number(epoch.startTime) * 1000).toLocaleString()}
            />
          )}
          {epoch.endTime > 0n && (
            <StatRow
              label="Ended"
              value={new Date(Number(epoch.endTime) * 1000).toLocaleString()}
            />
          )}
        </Module>
      )}

      {claimableEpoch === 0n && !treasury.isLoading && (
        <Module title="Nothing to claim yet">
          <p style={{ fontSize: 'var(--fs-small)' }}>
            No finalized claimable epoch. Dividends are accumulating in the current epoch
            ({formatTokenAmount(accumulated, env.nvdaDecimals, 4)} NVDA so far) and become claimable
            after the owner ends &amp; finalizes it with a Merkle root.
          </p>
        </Module>
      )}

      {claimableEpoch > 0n && (
        <Module title="Claim form">
          {manifestStatus && (
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)', marginBottom: 8 }}>{manifestStatus}</p>
          )}

          {userClaim?.hasClaimed ? (
            <div className="ok show" style={{ display: 'block' }}>
              Already claimed {formatTokenAmount(userClaim.claimAmount, env.nvdaDecimals, 4)} NVDA
              {userClaim.weightedBalance > 0n && (
                <> · weighted {formatTokenAmount(userClaim.weightedBalance, env.stratDecimals)} {env.tokenSymbol}</>
              )}
            </div>
          ) : (
            <>
              <div className="field">
                <label>Weighted {env.tokenSymbol} balance (epoch snapshot)</label>
                <div className="field-row">
                  <input type="text" inputMode="decimal" value={weightedBal} onChange={(e) => setWeightedBal(e.target.value)} placeholder="0.00" />
                  <span className="unit">{env.tokenSymbol}</span>
                </div>
              </div>

              <div className="field">
                <label>Claim amount</label>
                <div className="field-row">
                  <input type="text" inputMode="decimal" value={claimAmt} onChange={(e) => setClaimAmt(e.target.value)} placeholder="0.00" />
                  <span className="unit">NVDA</span>
                </div>
              </div>

              <div className="field">
                <label>Merkle proof (one 0x hash per line)</label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    border: '1px solid var(--border)',
                    background: '#FFFFF0',
                    padding: 6,
                    borderRadius: 0,
                  }}
                  placeholder="0xabc…&#10;0xdef…"
                />
              </div>

              <button
                type="button"
                className="btn-swap buy-mode"
                disabled={isPending || confirming || connecting}
                onClick={handleClaim}
              >
                {!isConnected ? (connecting ? 'CONNECTING…' : 'CONNECT WALLET') : isPending || confirming ? 'CONFIRMING…' : 'CLAIM NVDA DIVIDENDS'}
              </button>

              <div className={`err${err ? ' show' : ''}`} role="alert">{err}</div>
              <div className={`ok${ok ? ' show' : ''}`} role="status">{ok}</div>
            </>
          )}
        </Module>
      )}

      <Module title="Epoch calendar">
        <p style={{ fontSize: 'var(--fs-small)' }}>
          Epochs last {epochDays} days. Only <strong>currentEpoch − 1</strong> can be claimed once finalized.
          Unclaimed NVDA rolls into the next epoch.
        </p>
      </Module>
    </ForumLayout>
  );
}
