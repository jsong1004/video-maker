
export interface ClipPrompts {
  id: string;
  videoPrompt: string;
  audioPrompt: string;
  voiceScript: string;
}

export interface GeneratedClip extends ClipPrompts {
  videoUrl?: string;
  audioUrl?: string;
  voiceUrl?: string;
}

export enum AppPhase {
  INITIAL = "INITIAL",
  PROMPTS_GENERATED = "PROMPTS_GENERATED",
  CLIPS_GENERATED = "CLIPS_GENERATED",
  PLAYING_VIDEO = "PLAYING_VIDEO",
}
    