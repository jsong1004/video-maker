# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start frontend**: `npm run dev` (Vite dev server)
- **Start backend**: `npm run server` (Express server on port 8000)
- **Build frontend**: `npm run build` (uses react-scripts)
- **Preview production build**: `npm run preview`
- **Run tests**: `npm test`
- **Install dependencies**: `npm install`

## Environment Setup

- Create `.env.local` file with API configuration:
  - `GEMINI_API_KEY` - Google Gemini API key for all services
  - `voiceName=Kore` - Default voice for TTS
  - `voiceModel=gemini-2.5-flash-preview-tts`
  - `videoModel=veo-2.0-generate-001`
- Frontend uses Vite with React and TypeScript
- Backend is Express.js with TypeScript (ES modules)
- Styling with Tailwind CSS

## Architecture Overview

This is a full-stack AI video synthesizer with separate frontend (React) and backend (Express) services.

### Frontend-Backend Communication
- Frontend runs on port 3000 (Vite dev server)
- Backend API runs on port 8000 (Express server)
- API endpoints: `/api/generate-video`, `/api/generate-voice`, `/api/generate-music`, `/api/generate-storyboard`

### Core Data Flow
1. **Initial Phase**: User inputs description → calls `/api/generate-storyboard`
2. **Prompts Generated**: Editable prompts for video/audio/voice per clip
3. **Clips Generated**: Parallel generation of video, voice, and music assets
4. **Video Playback**: Sequential playback of synthesized video clips

### Key State Management
- `useStoryboard` hook in `src/hooks/useStoryboard.ts` manages entire clip workflow
- `ApiKeyContext` provides client-side API key state
- `AppPhase` enum tracks application state progression
- State flows: ClipPrompts → GeneratedClip → final video sequence

### Server API Routes
- `server/geminiRoute.ts` - Storyboard prompt generation
- `server/videoRoute.ts` - Veo 2.0 video generation with sample fallbacks  
- `server/voiceRoute.ts` - Gemini TTS with Web Speech API fallback
- `server/musicRoute.ts` - Audio generation with synthetic fallbacks
- All routes handle error cases and provide fallback media

### Core Data Types (types.ts)
- `ClipPrompts` - Contains prompts for video/audio/voice generation
- `GeneratedClip` - Extends ClipPrompts with generated media URLs  
- `AppPhase` - Enum tracking app workflow state

### Component Architecture
- Pages (`src/pages/`) handle routing and high-level state
- Hooks (`src/hooks/`) encapsulate complex state logic and API calls
- Components are functional with TypeScript, styled with Tailwind
- API calls use fetch with parallel Promise.all for asset generation