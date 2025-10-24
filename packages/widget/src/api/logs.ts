import { Interface, Log, formatUnits, zeroPadValue } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL } from '../config.js';

const tipsVaultInterface = new Interface([
  'event TipSent(address indexed from, address indexed to, uint256 amount, string memo)',
]);

export interface FetchRecentTipsOptions {
  fromBlock?: string;
  cursor?: string;
}

export interface TipEntry {
  from: string;
  to: string;
  amountEth: string;
  memo: string;
  blockNumber: number;
  transactionHash: string;
  cursor?: string;
}

export interface FetchRecentTipsResult {
  tips: TipEntry[];
  nextCursor?: string;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function toTopicAddress(address: string): string {
  return zeroPadValue(address, 32);
}

export async function fetchRecentTips(
  to: string,
  options: FetchRecentTipsOptions = {},
): Promise<FetchRecentTipsResult> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('TipsVault address is not configured');
  }

  const topicTo = toTopicAddress(to);
  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'eth_getLogsWithCursor',
    params: [
      {
        address: CONTRACT_ADDRESS,
        topics: [tipsVaultInterface.getEvent('TipSent')?.topicHash, null, topicTo],
        fromBlock: options.fromBlock,
        cursor: options.cursor,
      },
    ],
  };

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if ('error' in payload) {
    throw new Error(payload.error?.message ?? 'Failed to fetch logs');
  }

  const result = payload.result as { logs: (Log & { cursor?: string })[]; nextCursor?: string };
  if (!result || !Array.isArray(result.logs)) {
    return { tips: [] };
  }

  const tips: TipEntry[] = result.logs.map((rawLog) => {
    const parsed = tipsVaultInterface.parseLog(rawLog);
    const amountEth = formatUnits(parsed.args.amount as bigint, 18);
    return {
      from: normalizeAddress(parsed.args.from as string),
      to: normalizeAddress(parsed.args.to as string),
      amountEth,
      memo: parsed.args.memo as string,
      blockNumber: Number(rawLog.blockNumber),
      transactionHash: rawLog.transactionHash,
      cursor: (rawLog as { cursor?: string }).cursor,
    };
  });

  return {
    tips,
    nextCursor: result.nextCursor,
  };
}
