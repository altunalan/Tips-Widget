import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchRecentTips, type TipEntry } from '@megaeth/widget';
import { TipTable } from '../components/TipTable';

interface StatusState {
  type: 'idle' | 'sending' | 'confirmed' | 'pending' | 'error';
  message?: string;
  transactionHash?: string;
}

const DEFAULT_RECIPIENT = '0x1234567890123456789012345678901234567890';

export const DemoPage: React.FC = () => {
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [amountEth, setAmountEth] = useState('0.01');
  const [memo, setMemo] = useState('Love the content!');
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const [tips, setTips] = useState<TipEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const cursorRef = useRef<string | undefined>();
  const [loadingTips, setLoadingTips] = useState(false);

  const statusMessage = useMemo(() => {
    switch (status.type) {
      case 'idle':
        return 'Fill in the form and send a tip!';
      case 'sending':
        return 'Sending tip via realtime API…';
      case 'confirmed':
        return `Tip confirmed at transaction ${status.transactionHash}`;
      case 'pending':
        return `Confirming transaction ${status.transactionHash}`;
      case 'error':
        return status.message ?? 'Something went wrong';
      default:
        return '';
    }
  }, [status]);

  const loadTips = useCallback(
    async (reset = false) => {
      if (!recipient) return;
      if (!reset && !cursorRef.current) {
        return;
      }
      setLoadingTips(true);
      try {
        const result = await fetchRecentTips(recipient, {
          cursor: reset ? undefined : cursorRef.current,
        });
        setCursor(result.nextCursor);
        cursorRef.current = result.nextCursor;
        setTips((prev) => (reset ? result.tips : [...prev, ...result.tips]));
      } catch (error) {
        console.error('Failed to load tips', error);
      } finally {
        setLoadingTips(false);
      }
    },
    [recipient],
  );

  useEffect(() => {
    cursorRef.current = undefined;
    void loadTips(true);
  }, [loadTips]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recipient) {
      setStatus({ type: 'error', message: 'Recipient is required' });
      return;
    }

    setStatus({ type: 'sending' });

    try {
      const response = await fetch('/api/realtimeSend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient, amountEth, memo }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Server error');
      }

      if (payload.receipt) {
        setStatus({ type: 'confirmed', transactionHash: payload.receipt.transactionHash });
        void loadTips(true);
      } else if (payload.txHash) {
        setStatus({ type: 'pending', transactionHash: payload.txHash });
      }
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message });
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'grid', gap: '2rem' }}>
      <header>
        <h1>MegaETH Tips Demo</h1>
        <p>Send realtime tips and inspect the TipSent event log feed.</p>
      </header>

      <section style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <form onSubmit={handleSubmit} style={cardStyle}>
          <h2>Send a tip (React)</h2>
          <label style={labelStyle}>
            Recipient
            <input value={recipient} onChange={(event) => setRecipient(event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Amount (ETH)
            <input
              type="number"
              min="0"
              step="0.0001"
              value={amountEth}
              onChange={(event) => setAmountEth(event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Memo
            <textarea value={memo} onChange={(event) => setMemo(event.target.value)} rows={2} style={inputStyle} />
          </label>
          <button type="submit" style={buttonStyle} disabled={status.type === 'sending'}>
            Send tip
          </button>
          <p>{statusMessage}</p>
        </form>

        <div style={cardStyle}>
          <h2>Embedded widget</h2>
          <megaeth-tips data-recipient={recipient}></megaeth-tips>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Recent tips</h2>
          <button type="button" style={buttonStyle} onClick={() => loadTips(false)} disabled={loadingTips || !cursor}>
            {loadingTips ? 'Loading…' : cursor ? 'Load more' : 'Latest loaded'}
          </button>
        </div>
        <TipTable tips={tips} />
      </section>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
  border: '1px solid #e2e8f0',
};

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const inputStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '0.75rem',
  border: '1px solid #cbd5f5',
  fontSize: '1rem',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer',
};

export default DemoPage;
