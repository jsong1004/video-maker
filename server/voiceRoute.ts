import expressPkg from 'express';
import type { Request, Response } from 'express';
const express = expressPkg;
import { GoogleGenAI } from '@google/genai';
import wav from 'wav';

const router: import('express').Router = express.Router();



interface VoiceConfig {
  voiceName: string;
  language: string;
  speed: number;
  pitch: number;
}

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceName: process.env.voiceName || "Kore",
  language: "en-US",
  speed: 1.0,
  pitch: 0.0
};

// Helper function to wrap PCM data in a WAV header
function wrapPCMInWAV(pcmData: Buffer, sampleRate: number = 24000, channels: number = 1, sampleWidth: number = 2): Buffer {
  const headerLength = 44;
  const dataLength = pcmData.length;
  const buffer = Buffer.alloc(headerLength + dataLength);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * sampleWidth, 28); // byte rate
  buffer.writeUInt16LE(channels * sampleWidth, 32); // block align
  buffer.writeUInt16LE(sampleWidth * 8, 34); // bits per sample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  pcmData.copy(buffer, headerLength);

  return buffer;
}

/**
 * POST /api/generate-voice
 * Body: { voiceScript: string, config: object }
 * Returns: generated voice/audio as WAV
 */
router.post('/generate-voice', async (req: Request, res: Response) => {
  try {
    const { voiceScript, config = {} } = req.body;
    
    if (!voiceScript) {
      return res.status(400).json({ error: 'voiceScript is required' });
    }
    
    const voiceConfig: VoiceConfig = { ...DEFAULT_VOICE_CONFIG, ...config };
    
 
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.voiceModel || "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: voiceScript }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceConfig.voiceName },
          },
        },
      },
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) {
      return res.status(500).json({ error: 'No audio data returned from Gemini TTS' });
    }

    const audioBuffer = Buffer.from(data, 'base64');
    const wavBuffer = wrapPCMInWAV(audioBuffer);
    
    res.setHeader('Content-Type', 'audio/wav');
    res.send(wavBuffer);
  } catch (error: any) {
    console.error('Voice generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;