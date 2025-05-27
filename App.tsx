import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApiKeyProvider } from './src/context/ApiKeyContext';
import HomePage from './src/pages/HomePage';
import GenerateStoryboardPage from './src/pages/GenerateStoryboardPage';
import StoryboardPage from './src/pages/StoryboardPage';
import SynthesizePage from './src/pages/SynthesizePage';

const App: React.FC = () => {
  return (
    <ApiKeyProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generate" element={<GenerateStoryboardPage />} />
          <Route path="/storyboard" element={<StoryboardPage />} />
          <Route path="/synthesize" element={<SynthesizePage />} />
        </Routes>
      </Router>
    </ApiKeyProvider>
  );
};

export default App;
