import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApiKeyProvider } from './context/ApiKeyContext';
import HomePage from './pages/HomePage';
import GenerateStoryboardPage from './pages/GenerateStoryboardPage';
import StoryboardPage from './pages/StoryboardPage';
import SynthesizePage from './pages/SynthesizePage';

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