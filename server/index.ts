import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
  console.log('Environment loaded:', result.error ? 'FAILED' : 'SUCCESS');
} else {
  console.log('Production mode: using environment variables from deployment');
}
console.log('GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
console.log('PORT:', process.env.PORT || 'using default 8000');

import expressPkg from 'express';
import cors from 'cors';
import geminiRoute from './geminiRoute.ts';
import videoRoute from './videoRoute.ts';
import musicRoute from './musicRoute.ts';
import voiceRoute from './voiceRoute.ts';
import type { Request, Response } from 'express';
const express = expressPkg;

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Health check endpoint for Cloud Run
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', geminiRoute);
app.use('/api', videoRoute);
app.use('/api', musicRoute);
app.use('/api', voiceRoute);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  
  // Handle client-side routing - send all non-API requests to index.html
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  app.get('/', (req: Request, res: Response) => {
    res.send('AI Video Synthesizer API is running');
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
});

server.on('error', (error: Error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 