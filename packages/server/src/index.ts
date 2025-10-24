import express from 'express';
import bodyParser from 'body-parser';
import { PORT } from './config.js';
import { realtimeRouter } from './routes/realtime.js';

const app = express();
app.use(bodyParser.json());

app.use('/api/realtimeSend', realtimeRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`MegaETH Tips server listening on port ${PORT}`);
});
