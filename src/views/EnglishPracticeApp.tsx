import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, Modality, Chat } from "@google/genai";
import { useApiKey } from '../context/ApiContext';
import { decode, decodeAudioData } from '../utils/audio';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const EnglishPracticeApp = () => {
    const { runWithApiKey, apiKey } = useApiKey();
    const [scenario, setScenario] = useState('general');
    const [messages, setMessages] = useState<{id: number; sender: 'ai' | 'user'; text: string}[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [loadingAudioKey, setLoadingAudioKey] = useState<string | null>(null);

    const audioCache = useRef(new Map());
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const chatSessionRef = useRef<Chat | null>(null);
    const chatEndRef = useRef<null | HTMLDivElement>(null);

    const SCENARIOS = {
        general: {
            title: "Trò chuyện Tự do",
            initialMessage: "Hello! Welcome to 7A Class. I'm here to help you practice English. Let's start with a simple question: How are you today?",
            systemInstruction: "You are an AI from 7A Class, a friendly and patient English teacher for a Vietnamese student. Your goal is to have a natural conversation in English. Keep your responses concise and encouraging."
        },
        restaurant: {
            title: "Gọi món tại Nhà hàng",
            initialMessage: "Good evening! Welcome to The Gemini Bistro. Here is your menu. Are you ready to order, or would you like a few more minutes?",
            systemInstruction: "You are a helpful and polite waiter at a restaurant called 'The Gemini Bistro'. The user is a customer who is a Vietnamese speaker learning English. Your goal is to take their order and respond naturally to their questions."
        },
        interview: {
            title: "Phỏng vấn Xin việc",
            initialMessage: "Hello, thank you for coming in today. My name is Alex, and I'll be conducting your interview for the Software Engineer position. To start, could you please tell me a little bit about yourself?",
            systemInstruction: "You are a professional and friendly interviewer named Alex. You are interviewing the user for a Software Engineer position. The user is a Vietnamese speaker learning English. Your goal is to ask common interview questions and engage in a realistic conversation."
        }
    };

    const handleScenarioChange = (newScenarioKey: string) => {
        setScenario(newScenarioKey);
        const newScenario = SCENARIOS[newScenarioKey];
        setMessages([{
            id: Date.now(),
            sender: 'ai',
            text: newScenario.initialMessage,
        }]);
        chatSessionRef.current = null;
        setInputText('');
    };
    
    useEffect(() => {
        handleScenarioChange('general');
    }, []);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const speechToText = event.results[0][0].transcript;
                setInputText(speechToText);
            };
            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };
            recognition.onend = () => {
                setIsRecording(false);
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const playAudio = async (textToPlay: string, audioKey: string) => {
        if (!textToPlay || loadingAudioKey === audioKey) return;

        if (audioCache.current.has(textToPlay)) {
            const buffer = audioCache.current.get(textToPlay);
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);
            return;
        }
        
        setLoadingAudioKey(audioKey);
        try {
            if (!apiKey) throw new Error("API Key is not set.");
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: textToPlay }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                audioCache.current.set(textToPlay, audioBuffer);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start(0);
            }
        } catch (error) {
            console.error("Error generating or playing audio:", error);
        } finally {
            setLoadingAudioKey(null);
        }
    };
    
    const sendMessage = async (text: string) => {
        const messageText = text.trim();
        if (!messageText) return;

        setInputText('');
        setIsLoading(true);

        const newUserMessage: {id: number; sender: 'user' | 'ai'; text: string} = {
            id: Date.now(),
            sender: 'user',
            text: messageText,
        };
        setMessages(prev => [...prev, newUserMessage]);
        
        try {
            if (!apiKey) throw new Error("API Key is not set.");
            const ai = new GoogleGenAI({ apiKey });
            
            if (!chatSessionRef.current) {
                const currentScenario = SCENARIOS[scenario];
                const history = [{
                    role: 'model',
                    parts: [{ text: currentScenario.initialMessage }]
                }];

                chatSessionRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    history: history,
                    config: {
                        systemInstruction: currentScenario.systemInstruction,
                    }
                });
            }

            const response = await chatSessionRef.current.sendMessage({ message: messageText });

            const newAiMessage: {id: number; sender: 'user' | 'ai'; text: string} = {
                id: Date.now() + 1,
                sender: 'ai',
                text: response.text,
            };
            setMessages(prev => [...prev, newAiMessage]);
            runWithApiKey(() => playAudio(newAiMessage.text, `main-${newAiMessage.id}`));

        } catch (error) {
            console.error("Error with Gemini API:", error);
            const errorAiMessage: {id: number; sender: 'user' | 'ai'; text: string} = {
                id: Date.now() + 1,
                sender: 'ai',
                text: "I'm sorry, I encountered an error. Please try again.",
            };
            setMessages(prev => [...prev, errorAiMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setInputText('');
            recognitionRef.current.start();
        }
        setIsRecording(!isRecording);
    };

    return (
        <section className="backdrop-blur-xl bg-[#1E1B3A]/80 border border-white/15 rounded-3xl p-4 md:p-6 shadow-2xl w-full max-w-3xl mx-auto h-full flex flex-col font-sans">
            <header className="text-center mb-2 flex-shrink-0">
                <h1 className="text-2xl md:text-3xl font-bold">Huấn Luyện Viên Giao Tiếp AI</h1>
                <p className="opacity-80 text-sm mt-1">Tình huống: <span className="font-semibold text-cyan-300">{SCENARIOS[scenario].title}</span></p>
            </header>
            <div className="flex justify-center flex-wrap gap-2 my-3 border-b border-white/10 pb-4 flex-shrink-0">
                {Object.keys(SCENARIOS).map(key => (
                    <button 
                        key={key} 
                        onClick={() => handleScenarioChange(key)}
                        className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${scenario === key ? 'bg-cyan-400 text-slate-900 border-transparent font-semibold' : 'bg-black/20 border-white/20 hover:bg-black/40'}`}
                    >
                        {SCENARIOS[key].title}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-lg flex-shrink-0">AI</div>}
                        <div className={`max-w-md p-3 rounded-2xl text-white ${msg.sender === 'user' ? 'bg-[#1D4ED8] rounded-br-lg' : 'bg-[#4B5563] rounded-bl-lg'}`}>
                           <p>{msg.text}</p>
                           {msg.sender === 'ai' && (
                                <button 
                                    onClick={() => runWithApiKey(() => playAudio(msg.text, `main-${msg.id}`))}
                                    disabled={loadingAudioKey === `main-${msg.id}`}
                                    className="mt-2 text-2xl opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    {loadingAudioKey === `main-${msg.id}` ? 
                                        <div className="w-5 h-5 border-b-2 border-white rounded-full animate-spin"></div> 
                                        : 
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zM4 7a1 1 0 011-1h2a1 1 0 110 2H5a1 1 0 01-1-1zm12 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg>
                                    }
                                </button>
                           )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-3 justify-start">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-lg flex-shrink-0">AI</div>
                        <div className="max-w-md p-3 rounded-2xl bg-[#4B5563] rounded-bl-lg">
                           <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-0"></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200"></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-400"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={handleMicClick}
                    className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-2xl transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#1D4ED8] hover:bg-blue-700'}`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 102 0v-2.07a8.001 8.001 0 00-6 0z" clipRule="evenodd" /></svg>
                </button>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runWithApiKey(() => sendMessage(inputText)); } }}
                    placeholder="Nhập hoặc ghi âm tin nhắn của bạn..."
                    className="w-full h-12 rounded-lg bg-[#374151] border-none px-5 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                    onClick={() => runWithApiKey(() => sendMessage(inputText))}
                    disabled={isLoading || !inputText}
                    className="w-12 h-12 flex-shrink-0 rounded-full bg-[#4B5563] hover:bg-slate-700 disabled:bg-slate-800 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Send message"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </div>
        </section>
    );
};
