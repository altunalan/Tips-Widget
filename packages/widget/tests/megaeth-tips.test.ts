import { fireEvent, waitFor, within } from '@testing-library/dom';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

const INITIAL_SNAPSHOT = `
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
          <input name="amount" type="number" min="0" step="0.0001" value="0.01" required="">
        </label>
        <label>
          Memo
          <textarea name="memo" maxlength="64" rows="2" placeholder="Thanks for the alpha" required=""></textarea>
          <small>Max 64 characters</small>
        </label>
        <button type="submit">Send tip</button>
      </form>
      <div class="status ">
        Fill in the form to send a tip.
      </div>
      `;
import MegaEthTipsElement from '../src/index.js';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('MegaEthTipsElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('renders the widget form snapshot', () => {
    const element = new MegaEthTipsElement();
    element.setAttribute('data-recipient', '0x1234567890123456789012345678901234567890');
    document.body.appendChild(element);

    const shadow = element.shadowRoot;
    expect(shadow).not.toBeNull();
    const html = shadow?.innerHTML ?? '';
    expect(typeof html).toBe('string');
    expect(html.trim()).toBe(INITIAL_SNAPSHOT.trim());
  });

  test('shows confirmed status when realtime receipt is returned', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ receipt: { transactionHash: '0xabc', blockNumber: 1 } }));

    const element = document.createElement('megaeth-tips') as MegaEthTipsElement;
    element.setAttribute('data-recipient', '0x1234567890123456789012345678901234567890');
    element.setPollIntervalForTesting(0);
    document.body.appendChild(element);

    const shadow = element.shadowRoot as ShadowRoot;
    const form = shadow.querySelector('form') as HTMLFormElement;
    const amountInput = within(shadow).getByLabelText('Amount (ETH)') as HTMLInputElement;
    const memoInput = shadow.querySelector('textarea[name="memo"]') as HTMLTextAreaElement;

    amountInput.value = '0.2';
    memoInput.value = 'Great work';

    fireEvent.submit(form);

    await waitFor(() => {
      const status = shadow.querySelector('.status') as HTMLElement;
      expect(status.textContent).toContain('Tip confirmed (Realtime)');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('polls for a receipt when realtime response is pending', async () => {
    vi.useFakeTimers();

    const element = new MegaEthTipsElement();
    element.setAttribute('data-recipient', '0x1234567890123456789012345678901234567890');
    element.setPollIntervalForTesting(0);
    document.body.appendChild(element);

    const receiptSpy = vi
      .spyOn(element as unknown as { fetchReceipt: (hash: string) => Promise<unknown> }, 'fetchReceipt')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: '0x1' });

    await (element as unknown as { pollReceipt: (hash: string) => Promise<void> }).pollReceipt('0xdeadbeef');

    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();

    await waitFor(() => {
      const status = element.shadowRoot?.querySelector('.status') as HTMLElement;
      expect(status.textContent).toContain('Tip confirmed (Realtime)');
    });

    expect(receiptSpy).toHaveBeenCalledTimes(2);
  });
});
