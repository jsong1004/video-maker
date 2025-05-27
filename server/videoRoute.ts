import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

/**
 * POST /api/generate-video
 * Body: { videoPrompt: string, config: object }
 * Returns: generated video URL
 */
router.post('/generate-video', async (req: import('express').Request, res: import('express').Response) => {
  try {
    const { videoPrompt } = req.body;
    if (!videoPrompt) {
      return res.status(400).json({ error: 'videoPrompt is required' });
    }

    console.log('videoRoute loaded: ', process.env.GEMINI_API_KEY)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let operation = await ai.models.generateVideos({
      model: process.env.vodeoModel || 'veo-2.0-generate-001',
      prompt: videoPrompt,
      config: {
        personGeneration: 'dont_allow',
        aspectRatio: '16:9',
      },
    });

    // Debug: log the initial operation
    console.log('Initial Gemini video operation:', JSON.stringify(operation, null, 2));

    // Poll until done
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      // Debug: log each poll result
      console.log('Polled Gemini video operation:', JSON.stringify(operation, null, 2));
    }

    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      console.error('No generatedVideos in Gemini response:', JSON.stringify(operation, null, 2));
      return res.status(500).json({ error: 'No video was generated', debug: operation });
    }

    const videoUrl = generatedVideos[0].video?.uri;
    if (!videoUrl) {
      console.error('No videoUrl in Gemini response:', JSON.stringify(generatedVideos[0], null, 2));
      return res.status(500).json({ error: 'Generated video URL is missing', debug: generatedVideos[0] });
    }

    res.json({ videoUrl });
  } catch (error: any) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 