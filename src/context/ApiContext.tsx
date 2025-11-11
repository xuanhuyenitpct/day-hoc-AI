import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { ApiKeyModal } from '../components/ApiKeyModal';

interface ApiContextType {
  apiKey: string | null;
  isReady: boolean;
  runWithApiKey: (callback: () => Promise<any>) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | null>(null);

export const ApiProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('google-api-key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowKeyModal(true);
    }
  }, []);

  const saveApiKey = (key: string) => {
    if (key && key.trim()) {
      const sanitizedKey = key.trim();
      setApiKey(sanitizedKey);
      localStorage.setItem('google-api-key', sanitizedKey);
      setShowKeyModal(false);
    }
  };
  
  const clearApiKey = useCallback(() => {
    setApiKey(null);
    localStorage.removeItem('google-api-key');
    setShowKeyModal(true);
  }, []);

  const runWithApiKey = useCallback(async (callback: () => Promise<any>) => {
    if (!apiKey) {
      setShowKeyModal(true);
      alert("Vui lòng nhập Google AI API key của bạn để tiếp tục.");
      return Promise.reject(new Error("API key is required."));
    }
    
    try {
      return await callback();
    } catch (err) {
       const errorMessage = (err as Error).message?.toLowerCase() || '';
       if (errorMessage.includes("api key not valid") || 
           errorMessage.includes("permission denied") || 
           errorMessage.includes("api key is invalid") ||
           errorMessage.includes("requested entity was not found")) {
          console.error("API key became invalid. Forcing re-entry.");
          alert("API key của bạn không hợp lệ hoặc thiếu quyền. Vui lòng nhập một key hợp lệ.");
          clearApiKey();
       }
       // Re-throw the original error to be handled by the caller
       throw err;
    }
  }, [apiKey, clearApiKey]);

  return (
    <ApiContext.Provider value={{ apiKey, isReady: !!apiKey, runWithApiKey }}>
      {children}
      {showKeyModal && <ApiKeyModal onSave={saveApiKey} />}
    </ApiContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApiKey must be used within an ApiProvider");
  }
  return context;
};
