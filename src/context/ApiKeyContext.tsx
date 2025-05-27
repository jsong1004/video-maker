import React, { createContext, useContext, useState } from 'react';

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeyConfigured: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    return envKey || '';
  });
  
  const isApiKeyConfigured = Boolean(apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey.length > 10);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeyConfigured }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};

export default ApiKeyContext; 