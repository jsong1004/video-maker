import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PromptsDisplay } from '../components/PromptsDisplay';
import { ClipsGrid } from '../components/ClipsGrid';
import { IconDownload, IconMovie } from '../components/Icons';
import { ClipPrompts, GeneratedClip } from '../types';
import { useApiKey } from '../context/ApiKeyContext';
import { appConfig } from '../config/appConfig';

const StoryboardPage: React.FC = () => {
  const [clipPrompts, setClipPrompts] = useState<ClipPrompts[]>([]);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [generatingClipIds, setGeneratingClipIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isApiKeyConfigured: API_KEY_CONFIGURED } = useApiKey();

  useEffect(() => {
    const savedPrompts = localStorage.getItem('clipPrompts');
    if (!savedPrompts) {
      navigate('/generate');
      return;
    }
    try {
      setClipPrompts(JSON.parse(savedPrompts));
    } catch (err) {
      setError('Failed to load storyboard. Please try generating a new one.');
      navigate('/generate');
    }
  }, [navigate]);

  const handleSaveStoryboard = () => {
    if (clipPrompts.length === 0) {
      setError("No storyboard to save.");
      return;
    }
    const storyboardToSave = clipPrompts.map(({ videoPrompt, audioPrompt, voiceScript }) => ({
      videoPrompt,
      audioPrompt,
      voiceScript,
    }));
    const jsonString = JSON.stringify(storyboardToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setError(null);
  };

  const handlePromptInputChange = (clipId: string, field: keyof Omit<ClipPrompts, 'id'>, value: string) => {
    setClipPrompts(prev =>
      prev.map(p =>
        p.id === clipId ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSaveClipEdit = () => {};
  const handleCancelClipEdit = () => {};

  const handleGenerateSingleVisual = async (clipId: string) => {
    if (!API_KEY_CONFIGURED) {
      setError("API Key not configured. Cannot generate visuals.");
      return;
    }
    const promptToGenerate = clipPrompts.find(p => p.id === clipId);
    if (!promptToGenerate) return;

    setGeneratingClipIds(prev => [...prev, clipId]);
    setError(null);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPrompt: promptToGenerate.videoPrompt }),
      });
      if (!response.ok) throw new Error('Failed to generate video');
      const { videoUrl } = await response.json();
      if (videoUrl) {
        setGeneratedClips(prevClips => {
          const existingIndex = prevClips.findIndex(c => c.id === clipId);
          if (existingIndex > -1) {
            const updatedClips = [...prevClips];
            updatedClips[existingIndex] = {
              ...updatedClips[existingIndex],
              videoUrl,
            };
            return updatedClips;
          }
          return [...prevClips, { ...promptToGenerate, videoUrl }];
        });
      } else {
        setError('No video was generated. Please try again.');
      }
    } catch (err) {
      setError("Failed to generate visual.");
    } finally {
      setGeneratingClipIds(prev => prev.filter(id => id !== clipId));
    }
  };

  const handleGenerateAllVisuals = async () => {
    if (!API_KEY_CONFIGURED) {
      setError("API Key not configured. Cannot generate visuals.");
      return;
    }
    if (clipPrompts.length === 0) return;

    setError(null);
    const promptsToGenerate = clipPrompts.filter(
      p => !generatedClips.find(gc => gc.id === p.id) && !generatingClipIds.includes(p.id)
    );

    if (promptsToGenerate.length === 0) return;

    setGeneratingClipIds(prev => [...prev, ...promptsToGenerate.map(p => p.id)]);

    for (const prompt of promptsToGenerate) {
      try {
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoPrompt: prompt.videoPrompt }),
        });
        if (!response.ok) throw new Error('Failed to generate video');
        const { videoUrl } = await response.json();
        const newVisual: GeneratedClip = {
          ...prompt,
          videoUrl,
        };
        setGeneratedClips(prevClips => {
          const existingIndex = prevClips.findIndex(c => c.id === prompt.id);
          if (existingIndex > -1) {
            const updatedClips = [...prevClips];
            updatedClips[existingIndex] = newVisual;
            return updatedClips;
          }
          return [...prevClips, newVisual];
        });
      } catch (err) {
        setError("Failed to generate visual.");
      }
    }

    setGeneratingClipIds(prev => prev.filter(id => !promptsToGenerate.some(p => p.id === id)));
  };

  const handleProceedToSynthesis = () => {
    if (generatedClips.length !== clipPrompts.length) {
      setError("Please generate all visuals before proceeding to synthesis.");
      return;
    }
    localStorage.setItem('generatedClips', JSON.stringify(generatedClips));
    navigate('/synthesize');
  };

  const handleGenerateVideo = handleGenerateSingleVisual;
  const handleGenerateAudio = async (clipId: string) => {
    if (!API_KEY_CONFIGURED) {
      setError("API Key not configured. Cannot generate audio.");
      return;
    }
    const promptToGenerate = clipPrompts.find(p => p.id === clipId);
    if (!promptToGenerate) return;

    setGeneratingClipIds(prev => [...prev, `audio-${clipId}`]);
    setError(null);

    try {
      console.log(`Generating audio for clip: ${clipId}`);
      
      // Construct music config from user's audio script
      const extractMusicConfig = (script: string) => {
        const lower = script.toLowerCase();
        let mood: 'happy' | 'sad' | 'energetic' | 'calm' | 'dramatic' | undefined;
        let tempo: 'fast' | 'medium' | 'slow' | undefined;
        let style: string | undefined;
        let duration: number | undefined;
        let instruments: string[] | undefined = undefined;

        // Mood
        if (/happy|joy|upbeat/.test(lower)) mood = 'happy';
        else if (/sad|melancholy|dark/.test(lower)) mood = 'sad';
        else if (/energetic|action|intense/.test(lower)) mood = 'energetic';
        else if (/dramatic|epic|tension/.test(lower)) mood = 'dramatic';
        else if (/calm|gentle|peaceful|ambient|relax/.test(lower)) mood = 'calm';

        // Tempo
        if (/fast|quick|rapid/.test(lower)) tempo = 'fast';
        else if (/slow|gentle|peaceful/.test(lower)) tempo = 'slow';
        else if (/medium|moderate/.test(lower)) tempo = 'medium';

        // Style/Genre
        if (/orchestral|symphony|score/.test(lower)) style = 'orchestral';
        else if (/electronic|synth|edm|techno|trance|house/.test(lower)) style = 'electronic';
        else if (/ambient|atmospheric/.test(lower)) style = 'ambient';
        else if (/rock|guitar/.test(lower)) style = 'rock';
        else if (/jazz/.test(lower)) style = 'jazz';
        else if (/pop/.test(lower)) style = 'pop';
        else if (/folk/.test(lower)) style = 'folk';
        else if (/hip hop|trap|rap/.test(lower)) style = 'hip hop';
        else if (/cinematic/.test(lower)) style = 'cinematic';

        // Duration (look for e.g. '8 seconds', '30s', etc.)
        const durMatch = lower.match(/(\d+)(\s*)(seconds|s)\b/);
        if (durMatch) duration = parseInt(durMatch[1], 10);

        // Instruments (look for known instrument names)
        const instrumentList = [
          'guitar','piano','violin','drums','synth','bass','trumpet','saxophone','flute','cello','harp','accordion','banjo','clarinet','tuba','vibraphone','mandolin','harmonica','tabla','marimba','bongos','bagpipes','fiddle','kalimba','ocarina','sitar','steel drum','lyre','mbira','mellotron','bouzouki','shamisen','didgeridoo','djembe','hang drum','charango','dulcimer','balalaika','koto','persian tar','pipa','slide guitar','precision bass','ragtime piano','rhodes piano','hurdy-gurdy','buchla synths','moog oscillations','buchla','moog','clavichord','conga','drumline','drum machine','tr-909','808','303','spacey synths','synth pads','dirty synths','funk drums','funky','flamenco guitar','warm acoustic guitar','smooth pianos','woodwinds','viola ensemble','alto saxophone','bagpipes','bouzouki','charango','clavichord','conga drums','didgeridoo','djembe','drumline','dulcimer','fiddle','funk drums','glockenspiel','hang drum','harpsichord','hurdy-gurdy','kalimba','koto','mandolin','maracas','marimba','mbira','ocarina','persian tar','pipa','precision bass','ragtime piano','rhodes piano','shamisen','shredding guitar','sitar','slide guitar','steel drum','tabla','trumpet','tuba','vibraphone','viola ensemble','woodwinds'
        ];
        let foundInstruments: string[] = [];
        for (const instr of instrumentList) {
          if (lower.includes(instr)) foundInstruments.push(instr);
        }
        if (foundInstruments.length > 0) {
          instruments = Array.from(new Set(foundInstruments));
        }

        return {
          mood,
          tempo,
          style,
          duration,
          instruments,
        };
      };
      const musicConfig = extractMusicConfig(promptToGenerate.audioPrompt);
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioPrompt: promptToGenerate.audioPrompt, config: musicConfig }),
      });
      if (!response.ok) throw new Error('Failed to generate audio');
      const { audioUrl } = await response.json();
      setGeneratedClips(prevClips => {
        const existingIndex = prevClips.findIndex(c => c.id === clipId);
        if (existingIndex > -1) {
          const updatedClips = [...prevClips];
          updatedClips[existingIndex] = {
            ...updatedClips[existingIndex],
            audioUrl,
          };
          return updatedClips;
        }
        return [...prevClips, { ...promptToGenerate, videoUrl: '', audioUrl }];
      });
      console.log(`Audio generated successfully for clip: ${clipId}`);
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(`Failed to generate audio for clip ${clipId}. Please try again.`);
    }

    setGeneratingClipIds(prev => prev.filter(id => id !== `audio-${clipId}`));
  };
  const handleGenerateClip = async (clipId: string) => {
    if (!API_KEY_CONFIGURED) {
      setError("API Key not configured. Cannot generate clip.");
      return;
    }
    
    const promptToGenerate = clipPrompts.find(p => p.id === clipId);
    if (!promptToGenerate) return;

    setGeneratingClipIds(prev => [...prev, clipId, `voice-${clipId}`]);
    setError(null);

    try {
      // Generate video and voice in parallel
      const [videoRes, voiceRes] = await Promise.all([
        fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoPrompt: promptToGenerate.videoPrompt, config: { aspectRatio: '16:9', durationSeconds: 8 } }),
        }),
        fetch('/api/generate-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceScript: promptToGenerate.voiceScript, config: { voiceName: 'Kore', speed: 1.0 } }),
        })
      ]);

      // Check individual responses for better error reporting
      const errors = [];
      if (!videoRes.ok) {
        const videoError = await videoRes.text();
        errors.push(`Video: ${videoError}`);
      }
      if (!voiceRes.ok) {
        const voiceError = await voiceRes.text();
        errors.push(`Voice: ${voiceError}`);
      }

      if (errors.length > 0) {
        throw new Error(`Failed to generate: ${errors.join(', ')}`);
      }

      const { videoUrl } = await videoRes.json();
      const voiceBlob = await voiceRes.blob();
      const voiceUrl = URL.createObjectURL(voiceBlob);

      const newClip: GeneratedClip = {
        ...promptToGenerate,
        videoUrl,
        voiceUrl,
      };

      setGeneratedClips(prevClips => {
        const existingIndex = prevClips.findIndex(c => c.id === clipId);
        if (existingIndex > -1) {
          const updatedClips = [...prevClips];
          updatedClips[existingIndex] = newClip;
          return updatedClips;
        }
        return [...prevClips, newClip];
      });

    } catch (error) {
      console.error('Error generating clip:', error);
      setError(`Failed to generate clip ${clipId}. Please try again.`);
    } finally {
      setGeneratingClipIds(prev => prev.filter(id => 
        id !== clipId && id !== `voice-${clipId}`
      ));
    }
  };

  const handleDeleteClip = (clipId: string) => {
    // Remove from prompts
    setClipPrompts(prev => prev.filter(p => p.id !== clipId));
    
    // Remove from generated clips
    setGeneratedClips(prev => prev.filter(gc => gc.id !== clipId));
    
    // Remove from generating IDs
    setGeneratingClipIds(prev => prev.filter(id => 
      id !== clipId && id !== `voice-${clipId}`
    ));

    // Update localStorage
    const updatedPrompts = clipPrompts.filter(p => p.id !== clipId);
    localStorage.setItem('clipPrompts', JSON.stringify(updatedPrompts));
    
    setError(null);
  };

  const handleGenerateVoice = async (clipId: string) => {
    if (!API_KEY_CONFIGURED) {
      setError("API Key not configured. Cannot generate voice.");
      return;
    }
    
    const promptToGenerate = clipPrompts.find(p => p.id === clipId);
    if (!promptToGenerate) return;

    setGeneratingClipIds(prev => [...prev, `voice-${clipId}`]);
    setError(null);

    try {
      console.log(`Generating voice for clip: ${clipId}`);
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceScript: promptToGenerate.voiceScript, config: { voiceName: appConfig.defaultVoiceName, speed: 1.0 } }),
      });
      
      if (response.status === 501) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          setError('Voice generation not yet supported: TTS feature is currently unavailable');
          return;
        }
        setError(`Voice generation not yet supported: ${errorData.message || 'TTS feature is currently unavailable'}`);
        return;
      }
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          throw new Error(`HTTP ${response.status}: Failed to generate voice`);
        }
        throw new Error(errorData.error || 'Failed to generate voice');
      }
      
      // Use blob for audio/wav
      const blob = await response.blob();
      const voiceUrl = URL.createObjectURL(blob);
      setGeneratedClips(prevClips => {
        const existingIndex = prevClips.findIndex(c => c.id === clipId);
        if (existingIndex > -1) {
          const updatedClips = [...prevClips];
          updatedClips[existingIndex] = {
            ...updatedClips[existingIndex],
            voiceUrl,
          };
          return updatedClips;
        }
        return [...prevClips, { ...promptToGenerate, videoUrl: '', voiceUrl }];
      });
      console.log(`Voice generated successfully for clip: ${clipId}`);
    } catch (error) {
      console.error('Error generating voice:', error);
      setError(`Failed to generate voice for clip ${clipId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setGeneratingClipIds(prev => prev.filter(id => id !== `voice-${clipId}`));
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 mb-4">
            Storyboard Editor
          </h1>
          <p className="text-slate-400 text-lg">
            Review, edit, and generate visuals for your storyboard.
          </p>
        </header>

        {error && (
          <div className="p-4 bg-red-800 text-red-100 border border-red-600 rounded-lg shadow-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <section className="bg-slate-800 p-6 rounded-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
              <IconMovie className="w-6 h-6 mr-2" />
              Storyboard & Visuals
            </h2>
            <div className="mt-3 sm:mt-0 flex space-x-2">
              <Button
                onClick={handleSaveStoryboard}
                variant="secondary"
                disabled={clipPrompts.length === 0 || generatingClipIds.length > 0}
                className="px-3 py-1.5 text-sm"
              >
                <IconDownload className="w-4 h-4 mr-1.5" />
                Save Storyboard
              </Button>
            </div>
          </div>

          <PromptsDisplay
            prompts={clipPrompts}
            generatedClips={generatedClips}
            generatingClipIds={generatingClipIds}
            onPromptInputChange={handlePromptInputChange}
            isApiKeyConfigured={API_KEY_CONFIGURED}
            onGenerateVideo={handleGenerateVideo}
            onGenerateAudio={handleGenerateAudio}
            onGenerateVoice={handleGenerateVoice}
            onGenerateClip={handleGenerateClip}
            onDeleteClip={handleDeleteClip}
          />

          <div className="mt-6 space-y-4">
            {generatedClips.length > 0 && (
              <Button
                onClick={handleProceedToSynthesis}
                disabled={generatedClips.length !== clipPrompts.length || generatingClipIds.length > 0}
                className="w-full"
              >
                Proceed to Synthesis
              </Button>
            )}
          </div>
        </section>

        {generatedClips.length > 0 && (
          <section className="bg-slate-800 p-6 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-semibold text-sky-400 mb-4">Generated Visuals</h2>
            <ClipsGrid clips={generatedClips} />
          </section>
        )}
      </div>
    </div>
  );
};

export default StoryboardPage; 