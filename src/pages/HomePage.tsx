import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { IconSparkles } from '../components/Icons';
import MainLayout from '../layouts/MainLayout';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 mb-4">
            AI Video Synthesizer
          </h1>
          
          <p className="text-xl text-slate-300 mb-8">
            Transform your ideas into compelling video narratives using the power of AI.
            Create professional-quality videos with just a few clicks.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 p-6 rounded-xl">
                <IconSparkles className="w-8 h-8 text-sky-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-sky-400 mb-2">AI-Powered</h3>
                <p className="text-slate-400">Leverage advanced AI to generate creative content</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl">
                <IconSparkles className="w-8 h-8 text-sky-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-sky-400 mb-2">Easy to Use</h3>
                <p className="text-slate-400">Simple interface for creating professional videos</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl">
                <IconSparkles className="w-8 h-8 text-sky-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-sky-400 mb-2">Customizable</h3>
                <p className="text-slate-400">Edit and refine your content to perfection</p>
              </div>
            </div>

            <Button
              onClick={() => navigate('/generate')}
              className="w-full md:w-auto px-8 py-4 text-lg"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage; 