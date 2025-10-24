import { Router } from 'express';
import { realtimeSendTip } from '../lib/realtime.js';

export const realtimeRouter = Router();

realtimeRouter.post('/', async (req, res) => {
  const { recipient, memo, amountEth } = req.body ?? {};

  if (typeof recipient !== 'string' || typeof memo !== 'string' || typeof amountEth !== 'string') {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  try {
    const result = await realtimeSendTip({ recipient, memo, amountEth });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
