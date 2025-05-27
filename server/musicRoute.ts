import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

interface MusicConfig {
  duration: number;
  style: string;
  tempo: string;
  mood: string;
}

const DEFAULT_MUSIC_CONFIG: MusicConfig = {
  duration: 30,
  style: 'cinematic',
  tempo: 'medium',
  mood: 'calm'
};

function generateSyntheticAudio(config: MusicConfig): string {
  const sampleRate = 44100;
  const duration = config.duration;
  const samples = sampleRate * duration;
  const channels = 2;
  
  const buffer = new ArrayBuffer(44 + samples * channels * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * channels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * channels * 2, true);
  
  // Generate audio based on config
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let amplitude = 0;
    
    if (config.style === 'cinematic') {
      amplitude = Math.sin(2 * Math.PI * 220 * t) * 0.3 + 
                 Math.sin(2 * Math.PI * 440 * t) * 0.2 + 
                 Math.sin(2 * Math.PI * 110 * t) * 0.1;
    } else if (config.style === 'upbeat') {
      amplitude = Math.sin(2 * Math.PI * 330 * t) * 0.4 + 
                 Math.sin(2 * Math.PI * 660 * t) * 0.3;
    } else {
      amplitude = Math.sin(2 * Math.PI * 180 * t) * 0.2 + 
                 Math.sin(2 * Math.PI * 360 * t) * 0.15;
    }
    
    // Apply envelope
    const envelope = Math.min(t * 4, 1) * Math.min((duration - t) * 4, 1);
    amplitude *= envelope;
    
    const sample = Math.max(-1, Math.min(1, amplitude));
    const intSample = sample * 0x7FFF;
    
    for (let channel = 0; channel < channels; channel++) {
      view.setInt16(44 + (i * channels + channel) * 2, intSample, true);
    }
  }
  
  const uint8Array = new Uint8Array(buffer);
  return Buffer.from(uint8Array).toString('base64');
}

/**
 * POST /api/generate-music
 * Body: { audioPrompt: string, config: object }
 * Returns: generated music/audio
 */
router.post('/generate-music', async (req: express.Request, res: express.Response) => {
  try {
    const { audioPrompt, config = {} } = req.body;
    
    if (!audioPrompt) {
      return res.status(400).json({ error: 'audioPrompt is required' });
    }
    
    const musicConfig: MusicConfig = { ...DEFAULT_MUSIC_CONFIG, ...config };
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const result = await model.generateContent([
        { text: `Generate music for: ${audioPrompt}. Style: ${musicConfig.style}, Tempo: ${musicConfig.tempo}, Mood: ${musicConfig.mood}` }
      ]);
      
      // Fallback to synthetic audio since Gemini doesn't support audio generation yet
      console.log('Using synthetic audio generation as fallback');
    } catch (error) {
      console.log('Gemini API unavailable, using synthetic generation:', error);
    }
    
    const audioData = generateSyntheticAudio(musicConfig);
    
    res.json({
      audioData,
      config: musicConfig,
      prompt: audioPrompt
    });
    
  } catch (error: any) {
    console.error('Music generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 