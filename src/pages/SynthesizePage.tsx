import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApiKey } from "../context/ApiKeyContext";
import { GeneratedClip } from "../types";
import { DEFAULT_CLIP_DURATION_MS } from "../constants";
import { VideoPlayer } from "../components/VideoPlayer";
import { Button } from "../components/Button";
import { IconPlayerPlay, IconPlayerStop, IconArrowLeft, IconDownload } from "../components/Icons";

const SynthesizePage = () => {
  const navigate = useNavigate();
  const { isApiKeyConfigured } = useApiKey();
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiKeyConfigured) {
      navigate("/generate");
      return;
    }

    const savedClips = localStorage.getItem("generatedClips");
    if (!savedClips) {
      navigate("/storyboard");
      return;
    }

    try {
      const parsedClips = JSON.parse(savedClips);
      setClips(parsedClips);
    } catch (err) {
      setError("Error loading saved clips");
      console.error("Error parsing saved clips:", err);
    }
  }, [isApiKeyConfigured, navigate]);

  useEffect(() => {
    let timeoutId: number;

    if (isPlaying && clips.length > 0) {
      timeoutId = window.setTimeout(() => {
        setCurrentClipIndex((prev) => (prev + 1) % clips.length);
      }, DEFAULT_CLIP_DURATION_MS);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isPlaying, clips.length, currentClipIndex]);

  const handleGenerateVideo = async (clip: GeneratedClip) => {
    try {
      setIsGenerating(true);
      setError(null);
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPrompt: clip.videoPrompt, config: { durationSeconds: DEFAULT_CLIP_DURATION_MS / 1000, aspectRatio: '16:9' } }),
      });
      if (!response.ok) throw new Error('Failed to generate video');
      const { videoUrl } = await response.json();
      setClips(prev => prev.map(c =>
        c.id === clip.id
          ? { ...c, videoUrl }
          : c
      ));
    } catch (err) {
      setError("Error generating video");
      console.error("Error generating video:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartPlayback = () => {
    if (clips.length === 0) {
      setError("No clips available");
      return;
    }
    setIsPlaying(true);
  };

  const handleStopPlayback = () => {
    setIsPlaying(false);
  };

  const synthesizeVideoWithVoice = async (videoUrl: string, voiceUrl?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      
      video.onloadedmetadata = async () => {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        try {
          // Create audio context for mixing
          const audioContext = new AudioContext();
          const audioDestination = audioContext.createMediaStreamDestination();
          
          // Load voice audio if available
          let audioSource: AudioBufferSourceNode | null = null;
          if (voiceUrl) {
            try {
              const audioResponse = await fetch(voiceUrl);
              const audioBuffer = await audioResponse.arrayBuffer();
              const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
              
              audioSource = audioContext.createBufferSource();
              audioSource.buffer = decodedAudio;
              audioSource.connect(audioDestination);
            } catch (audioError) {
              console.warn('Failed to load voice audio:', audioError);
            }
          }
          
          // Create video stream
          const videoStream = canvas.captureStream(30);
          
          // Combine streams
          const combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...audioDestination.stream.getAudioTracks(),
          ]);
          
          // Create media recorder
          const mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm;codecs=vp8,opus',
          });
          
          const chunks: Blob[] = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            audioContext.close();
            resolve(url);
          };
          
          // Start recording
          mediaRecorder.start();
          
          // Start audio if available
          if (audioSource) {
            audioSource.start();
          }
          
          // Play video and draw frames
          video.currentTime = 0;
          video.play();
          
          const drawFrame = () => {
            if (video.paused || video.ended) {
              mediaRecorder.stop();
              return;
            }
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          };
          
          video.addEventListener('play', drawFrame);
          
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
    });
  };

  const handleDownloadAllClips = async () => {
    if (clips.length === 0) {
      setError("No clips available to download");
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      // Process each clip
      for (let index = 0; index < clips.length; index++) {
        const clip = clips[index];
        
        if (clip.videoUrl) {
          try {
            // Synthesize video with voice
            const synthesizedUrl = await synthesizeVideoWithVoice(clip.videoUrl, clip.voiceUrl);
            
            // Download the synthesized video
            const link = document.createElement('a');
            link.href = synthesizedUrl;
            link.download = `synthesized-clip-${index + 1}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up URL
            setTimeout(() => URL.revokeObjectURL(synthesizedUrl), 10000);
            
          } catch (clipError) {
            console.error(`Failed to synthesize clip ${index + 1}:`, clipError);
            // Fallback to original video
            const link = document.createElement('a');
            link.href = clip.videoUrl;
            link.download = `video-clip-${index + 1}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      }
    } catch (error) {
      setError("Error processing video downloads");
      console.error("Download error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSingleClip = async (clip: GeneratedClip, index: number) => {
    if (!clip.videoUrl) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Synthesize video with voice
      const synthesizedUrl = await synthesizeVideoWithVoice(clip.videoUrl, clip.voiceUrl);
      
      // Download the synthesized video
      const link = document.createElement('a');
      link.href = synthesizedUrl;
      link.download = `synthesized-clip-${index + 1}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(synthesizedUrl), 10000);
      
    } catch (clipError) {
      console.error(`Failed to synthesize clip ${index + 1}:`, clipError);
      // Fallback to original video
      const link = document.createElement('a');
      link.href = clip.videoUrl;
      link.download = `video-clip-${index + 1}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    navigate("/storyboard");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
          <Button onClick={handleBack} variant="secondary">
            <IconArrowLeft className="w-5 h-5 mr-2" />
            Back to Storyboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button onClick={handleBack} variant="secondary">
            <IconArrowLeft className="w-5 h-5 mr-2" />
            Back to Storyboard
          </Button>
          <div className="flex gap-4">
            <Button
              onClick={handleDownloadAllClips}
              disabled={clips.length === 0 || isGenerating}
              variant="primary"
            >
              <IconDownload className="w-5 h-5 mr-2" />
              {isGenerating ? "Processing..." : "Download All Videos"}
            </Button>
            <Button
              onClick={handleStartPlayback}
              disabled={isPlaying || clips.length === 0}
              variant="primary"
            >
              <IconPlayerPlay className="w-5 h-5 mr-2" />
              Play All
            </Button>
            <Button
              onClick={handleStopPlayback}
              disabled={!isPlaying}
              variant="secondary"
            >
              <IconPlayerStop className="w-5 h-5 mr-2" />
              Pause
            </Button>
          </div>
        </div>


        <div className="space-y-8">
          {clips.map((clip, index) => (
            <div
              key={clip.id}
              className={`bg-gray-800 rounded-lg p-6 ${
                index === currentClipIndex && isPlaying
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Clip {index + 1}</h3>
                  <p className="text-gray-400 mb-2">{clip.videoPrompt}</p>
                  <p className="text-gray-400">{clip.voiceScript}</p>
                </div>
                <div className="flex gap-2">
                  {!clip.videoUrl && (
                    <Button
                      onClick={() => handleGenerateVideo(clip)}
                      disabled={isGenerating}
                      variant="primary"
                    >
                      Generate Video
                    </Button>
                  )}
                  {clip.videoUrl && (
                    <Button
                      onClick={() => handleDownloadSingleClip(clip, index)}
                      disabled={isGenerating}
                      variant="secondary"
                    >
                      <IconDownload className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
              {clip.videoUrl && (
                <VideoPlayer
                  clip={clip}
                  clipNumber={index + 1}
                  totalClips={clips.length}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SynthesizePage; 