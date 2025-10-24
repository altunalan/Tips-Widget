import { JsonRpcProvider, Wallet, Contract, parseEther } from 'ethers';
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URL, SERVER_PRIVATE_KEY } from '../config.js';

const tipsVaultAbi = [
  'function tip(address to, string memo) payable',
  'event TipSent(address indexed from, address indexed to, uint256 amount, string memo)',
];

export interface RealtimeSendParams {
  recipient: string;
  memo: string;
  amountEth: string;
}

export interface RealtimeSendSuccess {
  receipt: {
    transactionHash: string;
    blockNumber: number;
  };
}

export interface RealtimeSendPending {
  txHash: string;
}

export type RealtimeSendResult = RealtimeSendSuccess | RealtimeSendPending;

export async function realtimeSendTip(params: RealtimeSendParams): Promise<RealtimeSendResult> {
  if (!CONTRACT_ADDRESS || !SERVER_PRIVATE_KEY) {
    throw new Error('Realtime tipping is not configured on the server.');
  }

  const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet = new Wallet(SERVER_PRIVATE_KEY, provider);
  const contract = new Contract(CONTRACT_ADDRESS, tipsVaultAbi, wallet);

  const value = parseEther(params.amountEth);
  const tx = await contract.tip(params.recipient, params.memo, { value });

  try {
    const receipt = await tx.wait();
    if (!receipt) {
      return { txHash: tx.hash };
    }

    return {
      receipt: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber ?? 0,
      },
    };
  } catch (error) {
    console.error('Realtime send failed to confirm, falling back to hash', error);
    return { txHash: tx.hash };
  }
}
