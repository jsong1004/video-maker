import React, { useState } from 'react';
import { ClipPrompts, GeneratedClip } from '../types';
import { Button } from './Button';
import { IconPencil, IconCheck, IconX, IconImage, IconDownload, IconTrash, IconSparkles } from './Icons';

interface PromptsDisplayProps {
  prompts: ClipPrompts[];
  generatedClips: GeneratedClip[];
  generatingClipIds: string[];
  onPromptInputChange: (clipId: string, field: keyof Omit<ClipPrompts, 'id'>, value: string) => void;
  isApiKeyConfigured: boolean;
  onGenerateVideo: (clipId: string) => void;
  onGenerateAudio: (clipId: string) => void;
  onGenerateVoice: (clipId: string) => void;
  onGenerateClip: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
}

export const PromptsDisplay: React.FC<PromptsDisplayProps> = ({
  prompts,
  generatedClips,
  generatingClipIds,
  onPromptInputChange,
  isApiKeyConfigured,
  onGenerateVideo,
  onGenerateAudio,
  onGenerateVoice,
  onGenerateClip,
  onDeleteClip,
}) => {
  const [editingField, setEditingField] = useState<{ id: string; field: keyof Omit<ClipPrompts, 'id'> } | null>(null);
  const [fieldValue, setFieldValue] = useState<string>('');

  const startEdit = (id: string, field: keyof Omit<ClipPrompts, 'id'>, value: string) => {
    setEditingField({ id, field });
    setFieldValue(value);
  };
  const saveEdit = () => {
    if (editingField) {
      onPromptInputChange(editingField.id, editingField.field, fieldValue);
      setEditingField(null);
      setFieldValue('');
    }
  };
  const cancelEdit = () => {
    setEditingField(null);
    setFieldValue('');
  };

  const downloadVideo = (videoUrl: string, clipId: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video-${clipId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAudio = (audioUrl: string, clipId: string) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `audio-${clipId}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadVoice = (voiceUrl: string, clipId: string) => {
    const link = document.createElement('a');
    link.href = voiceUrl;
    link.download = `voice-${clipId}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-4">
      {prompts.map((prompt, index) => {
        const isGenerating = generatingClipIds.includes(prompt.id);
        const isGeneratingVoice = generatingClipIds.includes(`voice-${prompt.id}`);
        const isGeneratingAudio = generatingClipIds.includes(`audio-${prompt.id}`);
        const generatedClip = generatedClips.find(gc => gc.id === prompt.id);

        return (
          <div
            key={prompt.id}
            className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-sky-400">
                Clip {index + 1}
              </h3>
              <div className="flex space-x-2">
                <Button
                  onClick={() => onGenerateClip(prompt.id)}
                  variant="primary"
                  className="px-3 py-1.5 text-sm"
                  disabled={isGenerating || isGeneratingVoice || !isApiKeyConfigured}
                >
                  <IconSparkles className="w-4 h-4 mr-1" />
                  {(isGenerating || isGeneratingVoice) ? 'Generating...' : 'Generate'}
                </Button>
                <Button
                  onClick={() => onDeleteClip(prompt.id)}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white"
                >
                  <IconTrash className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Video Prompt
                </label>
                {editingField && editingField.id === prompt.id && editingField.field === 'videoPrompt' ? (
                  <>
                  <textarea
                      value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-100"
                    rows={2}
                  />
                    <div className="flex space-x-2 mt-2">
                      <Button onClick={saveEdit} className="px-2 py-1 text-sm">Save</Button>
                      <Button onClick={cancelEdit} variant="secondary" className="px-2 py-1 text-sm">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-slate-300 flex-1">{prompt.videoPrompt}</p>
                    <Button
                      onClick={() => startEdit(prompt.id, 'videoPrompt', prompt.videoPrompt)}
                      variant="secondary"
                      className="ml-2 px-2 py-1 text-xs"
                      disabled={isGenerating}
                    >
                      <IconPencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {generatedClip?.videoUrl && (
                  <div className="mt-2 bg-slate-800 p-3 rounded border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Generated Video</span>
                      <Button
                        onClick={() => generatedClip?.videoUrl && downloadVideo(generatedClip.videoUrl, prompt.id)}
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                      >
                        <IconDownload className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <video
                      src={generatedClip.videoUrl}
                      controls
                      className="w-full max-w-sm rounded"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Voice Script
                </label>
                {editingField && editingField.id === prompt.id && editingField.field === 'voiceScript' ? (
                  <>
                  <textarea
                      value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-100"
                    rows={2}
                  />
                    <div className="flex space-x-2 mt-2">
                      <Button onClick={saveEdit} className="px-2 py-1 text-sm">Save</Button>
                      <Button onClick={cancelEdit} variant="secondary" className="px-2 py-1 text-sm">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-slate-300 flex-1">{prompt.voiceScript}</p>
                    <Button
                      onClick={() => startEdit(prompt.id, 'voiceScript', prompt.voiceScript)}
                      variant="secondary"
                      className="ml-2 px-2 py-1 text-xs"
                      disabled={isGenerating || isGeneratingVoice}
                    >
                      <IconPencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {generatedClip?.voiceUrl && (
                  <div className="mt-2 bg-slate-800 p-3 rounded border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Generated Voice</span>
                      <Button
                        onClick={() => generatedClip?.voiceUrl && downloadVoice(generatedClip.voiceUrl, prompt.id)}
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                      >
                        <IconDownload className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <audio
                      src={generatedClip.voiceUrl}
                      controls
                      className="w-full max-w-sm"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Audio Prompt
                </label>
                {editingField && editingField.id === prompt.id && editingField.field === 'audioPrompt' ? (
                  <>
                  <textarea
                      value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-100"
                    rows={2}
                  />
                    <div className="flex space-x-2 mt-2">
                      <Button onClick={saveEdit} className="px-2 py-1 text-sm">Save</Button>
                      <Button onClick={cancelEdit} variant="secondary" className="px-2 py-1 text-sm">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-slate-300 flex-1">{prompt.audioPrompt}</p>
                    <Button
                      onClick={() => startEdit(prompt.id, 'audioPrompt', prompt.audioPrompt)}
                      variant="secondary"
                      className="ml-2 px-2 py-1 text-xs"
                      disabled={isGenerating}
                    >
                      <IconPencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {generatedClip?.audioUrl && (
                  <div className="mt-2 bg-slate-800 p-3 rounded border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Generated Audio</span>
                      <Button
                        onClick={() => generatedClip?.audioUrl && downloadAudio(generatedClip.audioUrl, prompt.id)}
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                      >
                        <IconDownload className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <audio
                      src={generatedClip.audioUrl}
                      controls
                      className="w-full max-w-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
