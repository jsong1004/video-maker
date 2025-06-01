import React from 'react';
import { GeneratedClip } from '../types';
import { IconVolume, IconMessageCircle, IconPlayerPlay } from './Icons';


interface ClipsGridProps {
  clips: GeneratedClip[];
}

export const ClipsGrid: React.FC<ClipsGridProps> = ({ clips }) => {
  if (clips.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto p-1 pr-2 custom-scrollbar">
      {clips.map((clip, index) => (
        <div key={clip.id} className="bg-slate-700 rounded-lg shadow-xl overflow-hidden border border-slate-600 flex flex-col">
          <div className="aspect-video bg-slate-600">
            <video 
              src={clip.videoUrl}
              controls
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
              <h4 className="text-md font-semibold text-sky-400 mb-1">Clip {index + 1}</h4>
              <p className="text-xs text-slate-400 mb-2 truncate" title={clip.videoPrompt}>
                Visual: {clip.videoPrompt}
              </p>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex items-start">
                  <IconVolume className="w-3 h-3 mr-1.5 mt-0.5 text-sky-500 flex-shrink-0" />
                  <span className="truncate" title={clip.audioPrompt}>Audio: {clip.audioPrompt}</span>
                </div>
                <div className="flex items-start">
                  <IconMessageCircle className="w-3 h-3 mr-1.5 mt-0.5 text-sky-500 flex-shrink-0" />
                  <span className="line-clamp-2" title={clip.voiceScript}>Script: {clip.voiceScript}</span>
                </div>
                {clip.voiceUrl && (
                  <div className="flex items-center mt-2">
                    <IconPlayerPlay className="w-3 h-3 mr-1.5 text-green-500 flex-shrink-0" />
                    <audio 
                      src={clip.voiceUrl}
                      controls
                      className="h-6 flex-1"
                      style={{ maxWidth: '100%' }}
                      onError={(e) => console.error('Audio error for clip', clip.id, ':', e)}
                      onLoadStart={() => console.log('Audio loading started for clip', clip.id)}
                      onCanPlay={() => console.log('Audio can play for clip', clip.id)}
                    />
                  </div>
                )}
                {!clip.voiceUrl && (
                  <div className="text-xs text-gray-500 mt-2">No voice URL available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
    