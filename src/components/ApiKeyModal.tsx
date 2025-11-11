import React, { useState } from "react";

export const ApiKeyModal = ({ onSave }) => {
  const [key, setKey] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800/80 border-2 border-purple-400 rounded-3xl p-6 w-full max-w-md shadow-lg animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Nhập API Key của bạn</h2>
        <p className="text-sm opacity-80 mb-4">
          Để sử dụng ứng dụng này, bạn cần một Google AI API key. Vui lòng dán key của bạn vào ô bên dưới.
        </p>
        <input 
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Nhập API key của bạn tại đây"
          className="w-full rounded-xl bg-black/40 border-2 border-purple-400/50 p-3 mb-4 placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-purple-400/50"
        />
        <button
          onClick={() => onSave(key)}
          disabled={!key.trim()}
          className="w-full px-6 py-3 rounded-xl font-semibold bg-purple-500 text-white disabled:opacity-50 hover:bg-purple-600 transition"
        >
          Lưu và Tiếp tục
        </button>
        <p className="text-xs text-center mt-4 opacity-70">
          Bạn có thể lấy key từ <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-300">Google AI Studio</a>.
        </p>
      </div>
    </div>
  );
};
