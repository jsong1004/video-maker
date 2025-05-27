import express, { Request, Response } from 'express';
import OpenAI from 'openai';
const appConfig = {
  geminiModel: 'google/gemini-2.0-flash-001'
};

const router = express.Router();

// Debug: Log if API key exists (but not the actual key for security)
console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:8000', // Required by OpenRouter
    'X-Title': 'AI Video Synthesizer' // Optional but recommended
  },
});

interface ClipPrompts {
  id: string;
  videoPrompt: string;
  audioPrompt: string;
  voiceScript: string;
}

/**
 * POST /api/generate-prompts
 * Body: { userInput: string }
 * Returns: Array of generated prompts
 */
router.post('/generate-prompts', async (req: Request, res: Response) => {
  const { userInput } = req.body;
  if (!userInput) return res.status(400).json({ error: 'userInput is required' });
  
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY environment variable is required' });
  }
  
  const systemPrompt = `You are an expert creative assistant. Given a user idea, generate 2 sets of prompts for a storyboard. Each set should include:\n- A detailed video prompt for a scene (at least 8 seconds of visual content)\n- A detailed background music prompt (at least 8 seconds of music)\n- A voiceover script (at least 8 seconds of narration)\nMake each prompt vivid, descriptive, and long enough for 8 seconds  at most.`;
  try {
    const completion = await openai.chat.completions.create({
      model: appConfig.geminiModel || 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
    });
    let clips: ClipPrompts[] = [];
    try {
      const content = completion.choices[0].message.content;
      clips = JSON.parse(content || '[]');
      clips = clips.map((clip: any, idx: number) => ({ ...clip, id: `clip-${Date.now()}-${idx + 1}` }));
    } catch (err) {
      const content = completion.choices[0].message.content || '';
      const parts = content.split(/\n\s*\n/).filter(Boolean);
      for (let i = 0; i < parts.length; i += 3) {
        if (parts[i] && parts[i+1] && parts[i+2]) {
          clips.push({
            id: `clip-${Date.now()}-${(i/3)+1}`,
            videoPrompt: parts[i].replace(/^Video Prompt:/i, '').trim(),
            audioPrompt: parts[i+1].replace(/^Audio Prompt:/i, '').trim(),
            voiceScript: parts[i+2].replace(/^Voice Script:/i, '').trim(),
          });
        }
      }
    }
    res.json(clips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 