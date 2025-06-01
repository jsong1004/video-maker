import express from 'express';
import { GoogleGenAI } from '@google/genai';
const router = express.Router();

interface ClipPrompts {
  id: string;
  videoPrompt: string;
//  audioPrompt: string;
  voiceScript: string;
}

// Helper to strip Markdown formatting
function stripMarkdown(text: string): string {
  return text
    .replace(/[*_~`]+/g, '') // Remove *, _, ~, `
    .replace(/\\n/g, '\n') // Unescape newlines if needed
    .replace(/\\"/g, '"'); // Unescape quotes if needed
}

/**
 * POST /api/generate-prompts
 * Body: { userInput: string }
 * Returns: Array of generated prompts
 */
router.post('/generate-prompts', async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) return res.status(400).json({ error: 'userInput is required' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is required' });
  }

  const systemPrompt = `You are an expert creative assistant. Given a user idea, generate exactly 2 sets of prompts for a storyboard. For each set, output ONLY:
Video Prompt: <the video prompt>
Voice Script: <the voiceover script>

Do NOT include any introductory text, explanations, or extra lines. Do not say things like 'Here are two sets...' or anything else. Only output the two sets, each with a Video Prompt and a Voice Script, separated by a blank line. For example, if the user input is "A man is walking down the street", the output should be:
Video Prompt: A man is walking down the street
Voice Script: A man is walking down the street

Video Prompt: ...
Voice Script: ...`;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userInput}` }] }
      ],
    });
    console.log('Gemini API raw response:', JSON.stringify(response, null, 2));
    let content = '';
    if (
      response.candidates &&
      Array.isArray(response.candidates) &&
      response.candidates.length > 0 &&
      response.candidates[0].content &&
      Array.isArray(response.candidates[0].content.parts) &&
      response.candidates[0].content.parts.length > 0 &&
      typeof response.candidates[0].content.parts[0].text === 'string'
    ) {
      content = response.candidates[0].content.parts[0].text;
    } else {
      return res.status(500).json({ error: 'No valid text response from Gemini API', debug: response });
    }
    content = stripMarkdown(content); // Strip markdown before parsing
    // Robustly extract Video Prompt and Voice Script pairs
    const regex = /Video Prompt:\s*(.+?)\s*Voice Script:\s*(.+?)(?=Video Prompt:|$)/gs;
    let match;
    let idx = 0;
    let clips: ClipPrompts[] = [];
    while ((match = regex.exec(content)) !== null) {
      clips.push({
        id: `clip-${Date.now()}-${++idx}`,
        videoPrompt: match[1].trim(),
        audioPrompt: '',
        voiceScript: match[2].trim(),
      });
    }
    // If no pairs found, fallback to old logic
    if (clips.length === 0) {
      try {
        clips = JSON.parse(content || '[]');
        clips = clips.map((clip: any, idx: number) => ({ ...clip, id: `clip-${Date.now()}-${idx + 1}` }));
      } catch (err) {
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
    }
    res.json(clips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 