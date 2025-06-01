import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const result = dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
console.log('Environment loaded:', result.error ? 'FAILED' : 'SUCCESS');
console.log('GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');

import expressPkg from 'express';
import cors from 'cors';
import geminiRoute from './geminiRoute.ts';
import videoRoute from './videoRoute.ts';
import musicRoute from './musicRoute.ts';
import voiceRoute from './voiceRoute.ts';
import type { Request, Response } from 'express';
const express = expressPkg;

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