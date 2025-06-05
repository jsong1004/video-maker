import React from 'react';
import { ClipPrompts, GeneratedClip } from '../types';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { IconPencil, IconCheck, IconX, IconVideo, IconVolume, IconMessageCircle } from './Icons';
import { TextInput } from './TextInput'; // Use the existing TextInput for consistency

interface EditablePromptItemProps {
  prompt: ClipPrompts;
  generatedClip: GeneratedClip | undefined;
  isEditingThisClip: boolean;
  isGeneratingThisClip: boolean;
  onEdit: (id: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onGenerateVisual: (id: string) => void;
  onPromptInputChange: (id: string, field: keyof Omit<ClipPrompts, 'id'>, value: string) => void;
  editedPromptsCache: Omit<ClipPrompts, 'id'>;
  isApiKeyConfigured: boolean;
  index: number;
}

export const EditablePromptItem: React.FC<EditablePromptItemProps> = ({
  prompt,
  generatedClip,
  isEditingThisClip,
  isGeneratingThisClip,
  onEdit,
  onSave,
  onCancel,
  onGenerateVisual,
  onPromptInputChange,
  editedPromptsCache,
  isApiKeyConfigured,
  index,
}) => {

  const handleInputChange = (field: keyof Omit<ClipPrompts, 'id'>, value: string) => {
    onPromptInputChange(prompt.id, field, value);
  };
  
  const visualAvailable = generatedClip && !isGeneratingThisClip;

  return (
    <div className="p-4 bg-slate-700 rounded-lg shadow-lg border border-slate-600 space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-sky-400">Clip {index + 1}</h3>
        {!isEditingThisClip && (
          <Button onClick={() => onEdit(prompt.id)} variant="secondary" className="px-3 py-1 text-sm" disabled={!isApiKeyConfigured || isGeneratingThisClip}>
            <IconPencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        )}
      </div>

      {isEditingThisClip ? (
        <div className="space-y-3">
          <TextInput
            label="Video Prompt:"
            value={editedPromptsCache.videoPrompt}
            onChange={(val) => handleInputChange('videoPrompt', val)}
            rows={3}
          />
          <TextInput
            label="Voice Script:"
            value={editedPromptsCache.voiceScript}
            onChange={(val) => handleInputChange('voiceScript', val)}
            rows={3}
          />
          <div className="flex space-x-2 mt-2">
            <Button onClick={() => onSave(prompt.id)} className="flex-1 px-3 py-1 text-sm">
              <IconCheck className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button onClick={onCancel} variant="secondary" className="flex-1 px-3 py-1 text-sm">
              <IconX className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <IconVideo className="w-5 h-5 mr-2 mt-0.5 text-sky-500 flex-shrink-0" />
            <div>
              <strong className="text-slate-300">Video:</strong>
              <p className="text-slate-400 ml-1 inline whitespace-pre-wrap">{prompt.videoPrompt}</p>
            </div>
          </div>
          <div className="flex items-start">
            <IconMessageCircle className="w-5 h-5 mr-2 mt-0.5 text-sky-500 flex-shrink-0" />
            <div>
              <strong className="text-slate-300">Voice Script:</strong>
              <p className="text-slate-400 ml-1 inline whitespace-pre-wrap">{prompt.voiceScript}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
        <h4 className="text-sm font-medium text-slate-300">Visual:</h4>
        {isGeneratingThisClip && (
          <div className="flex items-center justify-center h-32 bg-slate-600/50 rounded">
            <LoadingSpinner />
            <span className="ml-2 text-slate-400">Generating visual...</span>
          </div>
        )}
        {visualAvailable && (
          <div className="aspect-video bg-slate-600 rounded overflow-hidden">
            <img 
              src={generatedClip.imageUrl} 
              alt={`Visual for Clip ${index + 1}`} 
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = 'https://picsum.photos/320/180?grayscale&text=Error')}
            />
          </div>
        )}
        {!isGeneratingThisClip && !visualAvailable && (
          <div className="flex items-center justify-center h-32 bg-slate-600/30 rounded text-slate-500">
            No visual generated yet.
          </div>
        )}
        {!isEditingThisClip && (
            <Button 
                onClick={() => onGenerateVisual(prompt.id)} 
                isLoading={isGeneratingThisClip}
                disabled={isGeneratingThisClip || !isApiKeyConfigured}
                variant="secondary"
                className="w-full mt-2 text-sm py-2"
            >
            {isGeneratingThisClip ? "Generating..." : (visualAvailable ? "Re-generate Visual" : "Generate Visual")}
            </Button>
        )}
      </div>
    </div>
  );
};
