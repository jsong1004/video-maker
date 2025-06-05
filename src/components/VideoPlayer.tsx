import React, { useRef, useEffect, useState } from 'react';
import { GeneratedClip } from '../types';
import { DEFAULT_CLIP_DURATION_MS } from '../constants';
import { IconVolume, IconMessageCircle } from './Icons';

interface VideoPlayerProps {
  clip: GeneratedClip;
  clipNumber: number;
  totalClips: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ clip, clipNumber, totalClips }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Setup audio element when voice is available
  useEffect(() => {
    if (clip?.voiceUrl && audioRef.current) {
      audioRef.current.src = clip.voiceUrl;
      audioRef.current.load();
      setAudioReady(true);
      setAudioError(null);
    } else {
      setAudioReady(false);
    }
  }, [clip?.id, clip?.voiceUrl]);

  // Synchronize audio with video playback
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio || !clip?.voiceUrl) return;

    const handlePlay = () => {
      audio.currentTime = video.currentTime;
      audio.play().catch(error => {
        console.warn('Audio play failed:', error);
        setAudioError('Failed to play voice audio');
      });
    };

    const handlePause = () => {
      audio.pause();
    };

    const handleSeeked = () => {
      audio.currentTime = video.currentTime;
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [clip?.voiceUrl, audioReady]);

  if (!clip) {
    return <div className="aspect-video w-full bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">No clip to display.</div>;
  }
  
  const animationKey = `${clip.id}-${clipNumber}`;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden shadow-2xl border-2 border-sky-500 relative">
        <video 
          ref={videoRef}
          src={clip.videoUrl}
          className="w-full h-full object-cover"
          controls
          playsInline
          muted={false}
        />
        {/* Hidden audio element for voice synchronization */}
        <audio 
          ref={audioRef}
          style={{ display: 'none' }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 text-white">
          <h3 className="text-lg font-semibold text-sky-300">{`Clip ${clipNumber} of ${totalClips}`}</h3>
          {audioError && (
            <div className="mb-2 text-red-400 text-sm">
              ⚠️ {audioError}
            </div>
          )}
          {!audioReady && !audioError && clip.voiceUrl && (
            <div className="mb-2 text-yellow-400 text-sm">
              🔄 Loading voice audio...
            </div>
          )}
          {audioReady && clip.voiceUrl && (
            <div className="mb-2 text-green-400 text-sm">
              ✅ Voice audio ready
            </div>
          )}
          <div className="mt-1 text-sm space-y-1">
            <div className="flex items-start">
              <IconMessageCircle className="w-4 h-4 mr-2 mt-0.5 text-sky-400 flex-shrink-0" />
              <p className="text-slate-200">
                <span className="font-semibold">Script:</span> {clip.voiceScript}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1.5 bg-sky-500/50 w-full">
          <div 
            key={animationKey} 
            className="h-full bg-sky-400" 
            style={{ animation: `progress ${DEFAULT_CLIP_DURATION_MS / 1000}s linear forwards` }}
          ></div>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
    