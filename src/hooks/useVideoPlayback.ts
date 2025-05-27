import { useState, useEffect } from 'react';
import { GeneratedClip } from '../types';
import { DEFAULT_CLIP_DURATION_MS } from '../constants';

export const useVideoPlayback = (clips: GeneratedClip[]) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timerId: number | undefined;
    if (isPlaying && clips.length > 0) {
      if (currentPlaybackIndex < clips.length) {
        timerId = window.setTimeout(() => {
          setCurrentPlaybackIndex(prevIndex => prevIndex + 1);
        }, DEFAULT_CLIP_DURATION_MS);
      } else {
        handleStopPlayback();
      }
    }
    return () => {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }, [isPlaying, currentPlaybackIndex, clips.length]);

  const handleStartPlayback = () => {
    if (clips.length === 0) {
      setError("No clips available for playback.");
      return;
    }
    setIsPlaying(true);
    setCurrentPlaybackIndex(0);
  };

  const handleStopPlayback = () => {
    setIsPlaying(false);
    setCurrentPlaybackIndex(0);
  };

  return {
    isPlaying,
    currentPlaybackIndex,
    error,
    setError,
    handleStartPlayback,
    handleStopPlayback,
  };
}; 