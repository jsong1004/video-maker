import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const result = dotenv.config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import geminiRoute from './geminiRoute.ts';
import videoRoute from './videoRoute.ts';
import musicRoute from './musicRoute.ts';
import voiceRoute from './voiceRoute.ts';
import { Request, Response } from 'express';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.use('/api', geminiRoute);
app.use('/api', videoRoute);
app.use('/api', musicRoute);
app.use('/api', voiceRoute);

app.get('/', (req: Request, res: Response) => {
  res.send('AI Video Synthesizer API is running');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 