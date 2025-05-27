# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`

## Environment Setup

- API key configuration: Set `VITE_GEMINI_API_KEY` in `.env.local` file
- The app uses Vite with React and TypeScript
- Styling with Tailwind CSS

## Application Architecture

This is a React-based AI video synthesizer with a multi-phase workflow:

### Core Data Flow
1. **Initial Phase**: User inputs description
2. **Prompts Generated**: Creates video/audio/voice prompts using Gemini API
3. **Clips Generated**: Generates actual media clips 
4. **Video Playback**: Plays synthesized video

### Key State Management
- `useStoryboard` hook manages the entire clip generation workflow
- `ApiKeyContext` provides Gemini API key throughout the app
- App phases tracked via `AppPhase` enum in types.ts

### Route Structure
- `/` - HomePage (initial input)
- `/generate` - GenerateStoryboardPage (prompt generation)
- `/storyboard` - StoryboardPage (edit prompts, generate clips)
- `/synthesize` - SynthesizePage (final video playback)

### Service Layer
- `geminiService.ts` - Handles AI prompt generation (currently mock implementation)
- `videoService.ts` - Real Veo 2.0 video generation with fallback to sample videos
- `voiceService.ts` - Voice generation using Gemini TTS with Web Speech API fallback
- `musicService.ts` - Music generation with Gemini Audio API and synthetic audio fallback
- Video service uses `@google/genai` package for Veo integration
- Voice service supports multiple voice configurations and handles errors gracefully
- Music service analyzes prompts for mood/tempo/style and generates appropriate audio

### Data Types
- `ClipPrompts` - Contains video/audio/voice prompts for a single clip
- `GeneratedClip` - Extends ClipPrompts with generated media URLs
- State flows from prompts → generated clips → final video

### Component Architecture
- Pages handle routing and high-level state
- Hooks (`useStoryboard`, `useVideoPlayback`) manage complex state logic
- Components are functional with TypeScript interfaces
- Styled with Tailwind utility classes