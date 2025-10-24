import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/config.js', () => ({
  RPC_URL: 'http://localhost',
  CHAIN_ID: 1,
  CONTRACT_ADDRESS: '0xcontract',
  SERVER_PRIVATE_KEY: '0xkey',
}));

describe('realtimeSendTip', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns receipt when transaction confirms', async () => {
    const waitMock = vi.fn().mockResolvedValue({ hash: '0xhash', blockNumber: 42 });
    const tipMock = vi.fn().mockResolvedValue({ hash: '0xhash', wait: waitMock });

    vi.doMock('ethers', () => ({
      JsonRpcProvider: vi.fn(),
      Wallet: vi.fn().mockImplementation(() => ({})),
      Contract: vi.fn().mockImplementation(() => ({ tip: tipMock })),
      parseEther: vi.fn().mockReturnValue(123n),
    }));

    const { realtimeSendTip } = await import('../src/lib/realtime.js');
    const result = await realtimeSendTip({ recipient: '0x1', memo: 'gm', amountEth: '0.1' });

    expect(result).toEqual({
      receipt: {
        transactionHash: '0xhash',
        blockNumber: 42,
      },
    });
    expect(tipMock).toHaveBeenCalledWith('0x1', 'gm', { value: 123n });
  });

  it('falls back to txHash when confirmation fails', async () => {
    const waitMock = vi.fn().mockRejectedValue(new Error('boom'));
    const tipMock = vi.fn().mockResolvedValue({ hash: '0xfail', wait: waitMock });

    vi.doMock('ethers', () => ({
      JsonRpcProvider: vi.fn(),
      Wallet: vi.fn().mockImplementation(() => ({})),
      Contract: vi.fn().mockImplementation(() => ({ tip: tipMock })),
      parseEther: vi.fn().mockReturnValue(55n),
    }));

    const { realtimeSendTip } = await import('../src/lib/realtime.js');
    const result = await realtimeSendTip({ recipient: '0x1', memo: 'gm', amountEth: '0.1' });

    expect(result).toEqual({ txHash: '0xfail' });
  });
});
