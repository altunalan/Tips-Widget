import { DEFAULT_MEMO_LIMIT, DEFAULT_AMOUNT, RPC_URL } from '../config.js';

interface RealtimeSendSuccess {
  receipt: {
    transactionHash: string;
    blockNumber: number;
  };
}

interface RealtimeSendPending {
  txHash: string;
}

type RealtimeResponse = RealtimeSendSuccess | RealtimeSendPending;

type StatusState =
  | { type: 'idle' }
  | { type: 'sending' }
  | { type: 'confirmed'; transactionHash: string }
  | { type: 'pending'; transactionHash: string }
  | { type: 'error'; message: string };

export class MegaEthTipsElement extends HTMLElement {
  private status: StatusState = { type: 'idle' };
  private pollHandle: ReturnType<typeof setTimeout> | null = null;
  private pollIntervalMs = 3000;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    if (this.pollHandle) {
      clearTimeout(this.pollHandle);
      this.pollHandle = null;
    }
  }

  /**
   * Testing helper to speed up polling loops.
   */
  public setPollIntervalForTesting(ms: number): void {
    this.pollIntervalMs = ms;
  }

  private get recipient(): string {
    const attr = this.getAttribute('data-recipient');
    if (!attr) {
      throw new Error('data-recipient attribute is required');
    }
    return attr;
  }

  private setStatus(next: StatusState): void {
    this.status = next;
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const statusMessage = this.renderStatus();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          font-family: system-ui, sans-serif;
          display: block;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          max-width: 320px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          background: #ffffff;
        }
        h2 {
          font-size: 1.1rem;
          margin-top: 0;
        }
        form {
          display: grid;
          gap: 12px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-size: 0.85rem;
          color: #475569;
        }
        input, textarea {
          margin-top: 4px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #cbd5f5;
          font-size: 1rem;
          font-family: inherit;
        }
        button {
          padding: 10px 16px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #6366f1, #14b8a6);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        button[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .status {
          font-size: 0.85rem;
          color: #334155;
        }
        .status.error {
          color: #dc2626;
        }
        .status.success {
          color: #16a34a;
        }
        small {
          color: #94a3b8;
        }
      </style>
      <h2>Send a tip</h2>
      <form>
        <label>
          Amount (ETH)
          <input name="amount" type="number" min="0" step="0.0001" value="${DEFAULT_AMOUNT}" required />
        </label>
        <label>
          Memo
          <textarea name="memo" maxlength="${DEFAULT_MEMO_LIMIT}" rows="2" placeholder="Thanks for the alpha" required></textarea>
          <small>Max ${DEFAULT_MEMO_LIMIT} characters</small>
        </label>
        <button type="submit" ${this.status.type === 'sending' ? 'disabled' : ''}>Send tip</button>
      </form>
      <div class="status ${this.status.type === 'error' ? 'error' : this.status.type === 'confirmed' ? 'success' : ''}">
        ${statusMessage}
      </div>
    `;

    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form as HTMLFormElement);
        const amount = String(formData.get('amount') ?? '');
        const memo = String(formData.get('memo') ?? '');
        void this.submitTip(amount, memo);
      });
    }
  }

  private renderStatus(): string {
    switch (this.status.type) {
      case 'idle':
        return 'Fill in the form to send a tip.';
      case 'sending':
        return 'Sending tip via MegaETH Realtime…';
      case 'confirmed':
        return `✔ Tip confirmed (Realtime) — tx ${this.status.transactionHash}`;
      case 'pending':
        return `⏳ Confirming… tracking ${this.status.transactionHash}`;
      case 'error':
        return `Error: ${this.status.message}`;
      default:
        return '';
    }
  }

  private async submitTip(amount: string, memo: string): Promise<void> {
    if (!amount || Number(amount) <= 0) {
      this.setStatus({ type: 'error', message: 'Amount must be greater than 0.' });
      return;
    }

    if (memo.length > DEFAULT_MEMO_LIMIT) {
      this.setStatus({ type: 'error', message: `Memo is limited to ${DEFAULT_MEMO_LIMIT} characters.` });
      return;
    }

    this.setStatus({ type: 'sending' });

    try {
      const response = await fetch('/api/realtimeSend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: this.recipient,
          amountEth: amount,
          memo,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error ?? 'Server error');
      }

      const data = (await response.json()) as RealtimeResponse;
      if ('receipt' in data) {
        this.setStatus({ type: 'confirmed', transactionHash: data.receipt.transactionHash });
      } else {
        this.setStatus({ type: 'pending', transactionHash: data.txHash });
        this.pollReceipt(data.txHash);
      }
    } catch (error) {
      this.setStatus({ type: 'error', message: (error as Error).message });
    }
  }

  private async pollReceipt(txHash: string): Promise<void> {
    if (this.pollHandle) {
      clearTimeout(this.pollHandle);
      this.pollHandle = null;
    }

    const poll = async (): Promise<void> => {
      try {
        const receipt = await this.fetchReceipt(txHash);
        if (receipt) {
          this.setStatus({ type: 'confirmed', transactionHash: txHash });
          return;
        }
      } catch (error) {
        console.error('Failed to poll receipt', error);
      }

      this.pollHandle = setTimeout(poll, this.pollIntervalMs);
    };

    await poll();
  }

  private async fetchReceipt(txHash: string): Promise<unknown> {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });

    const payload = await response.json();
    if ('error' in payload) {
      throw new Error(payload.error?.message ?? 'RPC error');
    }

    return payload.result;
  }
}
