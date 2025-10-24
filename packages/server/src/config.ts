import 'dotenv/config';

export const RPC_URL = process.env.MEGAETH_RPC_URL ?? 'https://carrot.megaeth.com/rpc';
export const CHAIN_ID = Number(process.env.MEGAETH_CHAIN_ID ?? 6342);
export const CONTRACT_ADDRESS = process.env.TIPS_VAULT_ADDRESS ?? '';
export const SERVER_PRIVATE_KEY = process.env.MEGAETH_SIGNER_KEY ?? '';
export const PORT = Number(process.env.PORT ?? 3000);

if (!CONTRACT_ADDRESS) {
  console.warn('TIPS_VAULT_ADDRESS is not set. Realtime tipping will be disabled.');
}
if (!SERVER_PRIVATE_KEY) {
  console.warn('MEGAETH_SIGNER_KEY is not set. Realtime tipping will be disabled.');
}
