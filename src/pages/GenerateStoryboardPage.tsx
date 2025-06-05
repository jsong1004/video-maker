import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { IconUpload, IconSparkles } from '../components/Icons';
import { ClipPrompts, GeneratedClip } from '../types';
import { useApiKey } from '../context/ApiKeyContext';

const GenerateStoryboardPage: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isApiKeyConfigured: API_KEY_CONFIGURED } = useApiKey();
  const [clipPrompts, setClipPrompts] = useState<ClipPrompts[]>([]);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [generatingClipIds, setGeneratingClipIds] = useState<string[]>([]);

  const handleGeneratePrompts = async () => {
    if (!userInput.trim() || !API_KEY_CONFIGURED) {
      setError(!API_KEY_CONFIGURED ? "API Key not configured." : "Please enter a topic or text.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompts');
      }
      
      const prompts = await response.json();
      if (prompts.length === 0) {
        setError("No prompts were generated. Try a different topic or be more specific.");
      } else {
        localStorage.setItem('clipPrompts', JSON.stringify(prompts));
        navigate('/storyboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while generating prompts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      setError("Invalid file type. Please upload a JSON file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Failed to read file content.");
        }
        const parsedData = JSON.parse(text);

        if (Array.isArray(parsedData) && parsedData.every(item =>
          item &&
          typeof item.videoPrompt === 'string' &&
          typeof item.voiceScript === 'string'
        )) {
          const newPrompts: ClipPrompts[] = parsedData.map((item, index) => ({
            id: `uploaded-clip-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`,
            videoPrompt: item.videoPrompt,
            voiceScript: item.voiceScript,
          }));
          localStorage.setItem('clipPrompts', JSON.stringify(newPrompts));
          navigate('/storyboard');
        } else {
          throw new Error("Invalid JSON structure. Expected an array of objects with videoPrompt and voiceScript strings.");
        }
      } catch (err) {
        setError(err instanceof Error ? `Error processing file: ${err.message}` : "An unknown error occurred while processing the file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

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
      // Call backend for video generation
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPrompt: promptToGenerate.videoPrompt }),
      });
      if (!response.ok) throw new Error('Failed to generate video');
      const { videoUrl } = await response.json();
      const newVisual: GeneratedClip = {
        ...promptToGenerate,
        videoUrl,
      };
      setGeneratedClips(prevClips => {
        const existingIndex = prevClips.findIndex(c => c.id === clipId);
        if (existingIndex > -1) {
          const updatedClips = [...prevClips];
          updatedClips[existingIndex] = newVisual;
          return updatedClips;
        }
        return [...prevClips, newVisual];
      });
    } catch (err) {
      setError("Failed to generate visual.");
    } finally {
      setGeneratingClipIds(prev => prev.filter(id => id !== clipId));
    }
  };

  const handleGenerateVoice = async (clipId: string) => {
    if (!API_KEY_CONFIGURED) {
      setError("API Key not configured. Cannot generate voice.");
      return;
    }
    const clip = generatedClips.find(c => c.id === clipId);
    if (!clip) return;

    setGeneratingClipIds(prev => [...prev, clipId]);
    setError(null);

    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceScript: clip.voiceScript }),
      });
      if (!response.ok) throw new Error('Failed to generate voice');
      const blob = await response.blob();
      const voiceUrl = URL.createObjectURL(blob);
      const updatedClip: GeneratedClip = { ...clip, voiceUrl };
      setGeneratedClips(prevClips => {
        const existingIndex = prevClips.findIndex(c => c.id === clipId);
        if (existingIndex > -1) {
          const updatedClips = [...prevClips];
          updatedClips[existingIndex] = updatedClip;
          return updatedClips;
        }
        return [...prevClips, updatedClip];
      });
    } catch (err) {
      setError("Failed to generate voice.");
    } finally {
      setGeneratingClipIds(prev => prev.filter(id => id !== clipId));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 mb-4">
            Generate Your Storyboard
          </h1>
          <p className="text-slate-400 text-lg">
            Enter your topic or upload an existing storyboard to begin.
          </p>
        </header>

        {!API_KEY_CONFIGURED && (
          <div className="w-full p-4 mb-6 bg-red-700 border border-red-500 text-white rounded-lg shadow-lg">
            <h2 className="font-semibold text-lg mb-2">API Key Configuration Error</h2>
            <p>The Gemini API Key is not properly configured. Please ensure the <code>API_KEY</code> environment variable is set correctly.</p>
          </div>
        )}

        <section className="bg-slate-800 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold text-sky-400 mb-4 flex items-center">
            <IconSparkles className="w-6 h-6 mr-2" />
            Create New Storyboard
          </h2>
          <TextInput
            label="Enter your topic or a detailed description:"
            value={userInput}
            onChange={setUserInput}
            placeholder="e.g., 'A short promo for a new eco-friendly coffee brand' or 'The future of space travel'"
            rows={4}
            disabled={isLoading || !API_KEY_CONFIGURED}
          />
          <div className="mt-4 space-y-3 md:space-y-0 md:flex md:space-x-3">
            <Button
              onClick={handleGeneratePrompts}
              isLoading={isLoading}
              disabled={isLoading || !userInput.trim() || !API_KEY_CONFIGURED}
              className="w-full md:flex-1"
            >
              {isLoading ? 'Generating...' : 'Generate Storyboard'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              style={{ display: 'none' }}
              disabled={isLoading || !API_KEY_CONFIGURED}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              disabled={isLoading || !API_KEY_CONFIGURED}
              className="w-full md:flex-1"
            >
              <IconUpload className="w-5 h-5 mr-2" />
              Upload Storyboard (.json)
            </Button>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-800 text-red-100 border border-red-600 rounded-lg shadow-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {generatedClips.length > 0 && (
          <section className="bg-slate-800 p-6 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-semibold text-sky-400 mb-4">Generated Clips</h2>
            <div className="space-y-4">
              {generatedClips.map(clip => (
                <div key={clip.id} className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-sky-300">{clip.videoPrompt}</h3>
                  {clip.videoUrl && (
                    <div className="mt-2">
                      <video src={clip.videoUrl} controls className="w-full rounded" />
                    </div>
                  )}
                  {clip.videoUrl && !clip.voiceUrl && (
                    <Button
                      onClick={() => handleGenerateVoice(clip.id)}
                      isLoading={generatingClipIds.includes(clip.id)}
                      disabled={generatingClipIds.includes(clip.id)}
                      className="mt-2"
                    >
                      Generate Voice
                    </Button>
                  )}
                  {clip.voiceUrl && (
                    <div className="mt-2">
                      <audio src={clip.voiceUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GenerateStoryboardPage; 