import expressPkg from 'express';
import type { Request, Response } from 'express';
const express = expressPkg;
import type { GeneratedClip } from '../types.js';

const router = express.Router();

/**
 * POST /api/synthesize-clips
 * Body: { clips: GeneratedClip[] }
 * Returns: synthesis configuration for client-side processing
 */
router.post('/synthesize-clips', async (req: Request, res: Response) => {
  try {
    const { clips } = req.body;
    
    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({ error: 'clips array is required' });
    }

    // Validate that all clips have required media URLs
    const invalidClips = clips.filter((clip: GeneratedClip) => 
      !clip.videoUrl || (!clip.voiceUrl && !clip.audioUrl)
    );
    
    if (invalidClips.length > 0) {
      return res.status(400).json({ 
        error: 'All clips must have videoUrl and at least one audio source (voiceUrl or audioUrl)',
        invalidClipIds: invalidClips.map((clip: GeneratedClip) => clip.id)
      });
    }

    // Return synthesis configuration for client-side processing
    // Since we don't have server-side video processing (FFmpeg), 
    // we'll let the client handle audio mixing with Web Audio API
    const synthesisConfig = {
      clips: clips.map((clip: GeneratedClip) => ({
        id: clip.id,
        videoUrl: clip.videoUrl,
        voiceUrl: clip.voiceUrl,
        audioUrl: clip.audioUrl,
        duration: 8, // Default clip duration in seconds
        sequence: clips.indexOf(clip)
      })),
      totalDuration: clips.length * 8,
      instructions: {
        method: 'client-side-synthesis',
        description: 'Use Web Audio API to mix voice and background audio with video playback'
      }
    };

    res.json({
      success: true,
      synthesisConfig,
      message: 'Ready for client-side audio synthesis'
    });
    
  } catch (error: any) {
    console.error('Video synthesis preparation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/synthesis-status/:sessionId
 * Returns status of a synthesis job (placeholder for future server-side processing)
 */
router.get('/synthesis-status/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  // For now, always return ready status since we're doing client-side synthesis
  res.json({
    sessionId,
    status: 'ready',
    method: 'client-side',
    message: 'Use client-side Web Audio API for synthesis'
  });
});

export default router; 