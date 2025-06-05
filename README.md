# AI Video Synthesizer
This project is an AI-powered video synthesizer app built with React and React Router. It leverages Google Gemini APIs for high-quality text-to-speech (TTS), music, and video generation.

Despite rapid advancements in AI, creating longer-form videos tailored for marketing or promotions directly from some models (like Google's Veo, which can have limitations such as short clip lengths, e.g., ~8 seconds, or API constraints for extended outputs) often presents challenges. This video synthesizer app is designed to bridge this gap. It empowers you to combine and sequence AI-generated content—such as video elements, voiceovers, and music—into cohesive, extended presentations ideal for your marketing and promotional campaigns.

## Features
- Generate storyboard prompts from user input
- Generate video clips using Google Gemini Veo2
- Generate voiceovers using Gemini TTS
- Edit prompts and scripts at the field level
- Download generated assets

## Requirements
- Node.js (v18+ recommended)
- npm or yarn
- Google Cloud account with Gemini API access (TTS and Veo)
- API key(s) for Gemini

## Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/jsong1004/video-maker.git
   cd video-maker
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local` and fill in your Gemini API key(s):
     ```sh
     cp .env.local.example .env.local
     ```
   - Edit `.env.local`:
     ```env
     GEMINI_API_KEY=your_google_gemini_api_key
     voiceName=Kore
     voiceModel=gemini-2.5-flash-preview-tts
     vodeoModel=veo-2.0-generate-001
     ```
   - Make sure the Generative Language API is enabled for your Google Cloud project.

4. **Start the backend:**
   ```sh
   npm run server
   # or
   yarn server
   ```

5. **Start the frontend:**
   ```sh
   npm start
   # or
   yarn start
   ```

## Usage
- Go to `http://localhost:3000` in your browser.
- Enter a topic or upload a storyboard to generate prompts.
- Generate video, voice, and music for each clip.
- Download or edit assets as needed.

## Troubleshooting
- **403 or SERVICE_DISABLED errors:**
  - Make sure the Gemini API is enabled for your Google Cloud project.
  - Ensure your API key is from the correct project.
  - Wait a few minutes after enabling the API.
- **Empty video or audio:**
  - Check backend logs for Gemini API errors or quota issues.
  - Ensure your API key has access to Veo (video) and TTS (voice) endpoints.
- **Environment variables not picked up:**
  - Restart your backend after changing `.env.local`.
  - Double-check for typos in variable names.

## Project Structure
- `src/` - React frontend
- `server/` - Express backend API routes
- `.env.local` - Environment variables (not committed)

## License
MIT