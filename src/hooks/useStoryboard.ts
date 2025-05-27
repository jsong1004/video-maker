import { useState, useCallback } from 'react';
import { ClipPrompts, GeneratedClip } from '../types';
import { useApiKey } from '../context/ApiKeyContext';

export const useStoryboard = () => {
  const [clipPrompts, setClipPrompts] = useState<ClipPrompts[]>([]);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [generatingClipIds, setGeneratingClipIds] = useState<string[]>([]);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editedPromptsCache, setEditedPromptsCache] = useState<Omit<ClipPrompts, 'id'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isApiKeyConfigured } = useApiKey();

  const handleEditClip = useCallback((clipId: string) => {
    const clipToEdit = clipPrompts.find(p => p.id === clipId);
    if (clipToEdit) {
      setEditingClipId(clipId);
      const { id, ...editableParts } = clipToEdit;
      setEditedPromptsCache(editableParts);
    }
  }, [clipPrompts]);

  const handlePromptInputChange = useCallback((clipId: string, field: keyof Omit<ClipPrompts, 'id'>, value: string) => {
    if (editingClipId === clipId && editedPromptsCache) {
      setEditedPromptsCache(prev => ({ ...prev!, [field]: value }));
    }
  }, [editingClipId, editedPromptsCache]);

  const handleSaveClipEdit = useCallback((clipId: string) => {
    if (!editedPromptsCache) return;
    setClipPrompts(prevPrompts =>
      prevPrompts.map(p =>
        p.id === clipId ? { ...p, ...editedPromptsCache } : p
      )
    );
    setGeneratedClips(prevClips => prevClips.filter(gc => gc.id !== clipId));
    setEditingClipId(null);
    setEditedPromptsCache(null);
  }, [editedPromptsCache]);

  const handleCancelClipEdit = useCallback(() => {
    setEditingClipId(null);
    setEditedPromptsCache(null);
  }, []);

  const handleGenerateSingleVisual = useCallback(async (clipId: string) => {
    if (!isApiKeyConfigured) {
      setError("API Key not configured. Cannot generate visuals.");
      return;
    }
    const promptToGenerate = clipPrompts.find(p => p.id === clipId);
    if (!promptToGenerate) return;

    setGeneratingClipIds(prev => [...prev, clipId]);
    setError(null);

    try {
      const [videoRes, voiceRes, audioRes] = await Promise.all([
        fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoPrompt: promptToGenerate.videoPrompt, config: { aspectRatio: '16:9', durationSeconds: 8 } }),
        }),
        fetch('/api/generate-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceScript: promptToGenerate.voiceScript, config: { voiceName: 'Kore', speed: 1.0 } }),
        }),
        fetch('/api/generate-music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioPrompt: promptToGenerate.audioPrompt, config: { duration: 8, style: 'cinematic', mood: 'calm' } }),
        })
      ]);
      if (!videoRes.ok || !voiceRes.ok || !audioRes.ok) throw new Error('Failed to generate one or more assets');
      const { videoUrl } = await videoRes.json();
      const { voiceUrl } = await voiceRes.json();
      const { audioUrl } = await audioRes.json();
      const newVisual: GeneratedClip = {
        ...promptToGenerate,
        videoUrl,
        voiceUrl,
        audioUrl,
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
    } catch (error) {
      setError("Failed to generate video. Please try again.");
    }
    setGeneratingClipIds(prev => prev.filter(id => id !== clipId));
  }, [clipPrompts, isApiKeyConfigured]);

  const handleGenerateAllVisuals = useCallback(async () => {
    if (!isApiKeyConfigured) {
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
        const [videoRes, voiceRes, audioRes] = await Promise.all([
          fetch('/api/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoPrompt: prompt.videoPrompt, config: { aspectRatio: '16:9', durationSeconds: 8 } }),
          }),
          fetch('/api/generate-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voiceScript: prompt.voiceScript, config: { voiceName: 'Kore', speed: 1.0 } }),
          }),
          fetch('/api/generate-music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioPrompt: prompt.audioPrompt, config: { duration: 8, style: 'cinematic', mood: 'calm' } }),
          })
        ]);
        if (!videoRes.ok || !voiceRes.ok || !audioRes.ok) throw new Error('Failed to generate one or more assets');
        const { videoUrl } = await videoRes.json();
        const { voiceUrl } = await voiceRes.json();
        const { audioUrl } = await audioRes.json();
        const newVisual: GeneratedClip = {
          ...prompt,
          videoUrl,
          voiceUrl,
          audioUrl,
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
      } catch (error) {
        setError(`Failed to generate video for clip ${prompt.id}`);
      }
    }
    setGeneratingClipIds(prev => prev.filter(id => !promptsToGenerate.some(p => p.id === id)));
  }, [clipPrompts, generatedClips, generatingClipIds, isApiKeyConfigured]);

  const handleGenerateVoiceForClip = useCallback(async (clipId: string) => {
    if (!isApiKeyConfigured) {
      setError("API Key not configured. Cannot generate voice.");
      return;
    }
    const promptToGenerate = clipPrompts.find(p => p.id === clipId);
    if (!promptToGenerate) return;

    setGeneratingClipIds(prev => [...prev, `voice-${clipId}`]);
    setError(null);

    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceScript: promptToGenerate.voiceScript, config: { voiceName: 'Kore', speed: 1.0 } }),
      });
      if (!response.ok) throw new Error('Failed to generate voice');
      const { voiceUrl } = await response.json();
      setGeneratedClips(prevClips => {
        const existingIndex = prevClips.findIndex(c => c.id === clipId);
        if (existingIndex > -1) {
          const updatedClips = [...prevClips];
          updatedClips[existingIndex] = { ...updatedClips[existingIndex], voiceUrl };
          return updatedClips;
        }
        // If no existing clip, create new one with voice
        const newClip: GeneratedClip = {
          ...promptToGenerate,
          videoUrl: '',
          voiceUrl,
        };
        return [...prevClips, newClip];
      });
    } catch (error) {
      setError("Failed to generate voice. Please try again.");
    }
    setGeneratingClipIds(prev => prev.filter(id => id !== `voice-${clipId}`));
  }, [clipPrompts, isApiKeyConfigured]);

  const handleSaveStoryboard = useCallback(() => {
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
  }, [clipPrompts]);

  return {
    clipPrompts,
    setClipPrompts,
    generatedClips,
    generatingClipIds,
    editingClipId,
    editedPromptsCache,
    error,
    setError,
    handleEditClip,
    handlePromptInputChange,
    handleSaveClipEdit,
    handleCancelClipEdit,
    handleGenerateSingleVisual,
    handleGenerateAllVisuals,
    handleGenerateVoiceForClip,
    handleSaveStoryboard,
    isApiKeyConfigured,
  };
}; 