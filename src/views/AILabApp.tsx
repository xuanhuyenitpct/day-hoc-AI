import React, { useState, useRef } from "react";
import { GoogleGenAI, Modality, Chat } from "@google/genai";
import { useApiKey } from '../context/ApiContext';

export const AILabApp = () => {
    const { runWithApiKey, apiKey } = useApiKey();
    const [concept, setConcept] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState('');
    
    const [followUp, setFollowUp] = useState('');
    const chatSessionRef = useRef<Chat | null>(null);
    const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);

    const handleExplore = async (isFollowUp = false) => {
        const currentQuery = isFollowUp ? followUp : concept;
        if (!currentQuery) {
            setError('Vui lòng nhập một khái niệm hoặc câu hỏi.');
            return;
        }

        setIsLoading(true);
        setError('');
        if (!isFollowUp) {
            setExplanation('');
            setImageUrl('');
            chatSessionRef.current = null;
            setConversationHistory([]); 
        }

        try {
            if (!apiKey) throw new Error("API Key is not set.");
            const ai = new GoogleGenAI({ apiKey });

            if (!chatSessionRef.current) {
                chatSessionRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "Bạn là một gia sư AI chuyên giải thích các khái niệm khoa học một cách đơn giản, dễ hiểu cho học sinh trung học. Hãy tập trung vào các ý chính và sử dụng ví dụ nếu có thể. Luôn trả lời bằng tiếng Việt.",
                    }
                });
            }

            const textPrompt = isFollowUp
                ? currentQuery
                : `Hãy giải thích khái niệm khoa học sau: "${currentQuery}".`;
            
            const chatHistoryForImage = conversationHistory
                .map(turn => `${turn.role === 'user' ? 'Người dùng' : 'AI'}: ${turn.text}`)
                .join('\n');

            const imagePrompt = isFollowUp
                ? `Dựa trên bối cảnh khoa học và cuộc trò chuyện sau, hãy tạo một hình ảnh minh họa cho câu hỏi hiện tại.
Chủ đề gốc: "${concept}"
Lịch sử trò chuyện:
${chatHistoryForImage}
Câu hỏi hiện tại của người dùng: "${currentQuery}"

Hãy tạo một hình ảnh 3D, sống động, minh họa cho câu trả lời của câu hỏi này. Hình ảnh cần có chiều sâu, ánh sáng ấn tượng, và thể hiện rõ sự thay đổi hoặc điểm cốt lõi trong câu hỏi.`
                : `Tạo một hình ảnh 3D, sống động, đẹp mắt, theo phong cách nghệ thuật kỹ thuật số, mang tính giáo dục về khái niệm khoa học: "${currentQuery}". Hình ảnh cần có chiều sâu, ánh sáng ấn tượng, màu sắc rực rỡ và tập trung vào chủ đề chính.`;


            const [explanationResponse, imageResponse] = await Promise.all([
                chatSessionRef.current.sendMessage({ message: textPrompt }),
                ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: imagePrompt }] },
                    config: { responseModalities: [Modality.IMAGE] },
                })
            ]);

            const newExplanation = explanationResponse.text;
            setExplanation(newExplanation);

            setConversationHistory(prev => [
                ...prev,
                { role: 'user', text: currentQuery },
                { role: 'model', text: newExplanation },
            ]);

            const imageCandidate = imageResponse?.candidates?.[0];
            const imagePart = imageCandidate?.content?.parts?.find(p => p.inlineData);

            if (imagePart?.inlineData) {
                const base64ImageBytes = imagePart.inlineData.data;
                const url = `data:image/png;base64,${base64ImageBytes}`;
                setImageUrl(url);
            } else {
                if (imageCandidate?.finishReason === 'SAFETY') {
                    throw new Error("Hình ảnh không thể được tạo vì lý do an toàn. Vui lòng thử một khái niệm khác.");
                } else {
                    throw new Error("AI không tạo ra được hình ảnh cho khái niệm này.");
                }
            }
            
            setFollowUp('');

        } catch (err) {
            console.error("Error in AI Lab:", err);
            const errorMessage = (err as Error).message || String(err);
            setError("Không thể tạo nội dung. Lỗi: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMouseMove3D = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const img = target.querySelector('img');
        if (!img) return;
        
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const width = rect.width;
        const height = rect.height;
    
        const rotateY = 20 * ((x - width / 2) / width);
        const rotateX = -20 * ((y - height / 2) / height);
    
        img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave3D = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const img = target.querySelector('img');
        if (!img) return;
    
        img.style.transform = `rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
    };

    const PRESET_CONCEPTS = ["Quang hợp", "So sánh tế bào động vật và tế bào thực vật", "Cấu trúc của DNA", "Hiệu ứng nhà kính", "Chu trình nước"];

    return (
        <section className="bg-indigo-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl w-full max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]">Phòng Thí Nghiệm Ảo Tương Tác</h1>
                <p className="mt-2 text-white/80">"Thí nghiệm" với các ý tưởng khoa học để khám phá sâu hơn!</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                <input
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') runWithApiKey(() => handleExplore(false)); }}
                    placeholder="Nhập khái niệm hoặc so sánh, ví dụ: 'Sao Neutron'"
                    className="flex-grow w-full text-lg rounded-xl bg-indigo-950/50 border-2 border-white/20 p-4 placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all shadow-inner"
                />
                <button
                    onClick={() => runWithApiKey(() => handleExplore(false))}
                    disabled={isLoading}
                    className="w-full md:w-auto px-8 py-4 text-lg rounded-xl font-bold bg-cyan-400 text-slate-900 hover:bg-cyan-300 active:scale-[.97] transition-all shadow-[0_0_20px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Đang xử lý..." : "Khám Phá"}
                </button>
            </div>
             <div className="mb-8 text-center">
                  <label className="block text-sm mb-2 opacity-80">Hoặc thử một vài gợi ý:</label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {PRESET_CONCEPTS.map((prompt) => (
                      <button 
                        key={prompt} 
                        onClick={() => setConcept(prompt)}
                        className="px-4 py-2 text-sm rounded-full bg-indigo-950/40 hover:bg-indigo-950/80 border border-white/20 text-white/80 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

            {error && <div className="text-sm text-rose-300 text-center mb-6 p-3 bg-rose-900/40 border border-rose-500/50 rounded-lg">{error}</div>}

            {isLoading && (
                 <div className="text-center my-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    <p className="mt-4 opacity-80">AI đang tư duy và sáng tạo, vui lòng chờ trong giây lát...</p>
                </div>
            )}

            {!isLoading && (explanation || imageUrl) && (
                <div className="animate-fade-in space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-indigo-950/40 p-5 rounded-2xl border border-white/20">
                            <h2 className="text-xl font-bold mb-3 text-cyan-300">Giải thích của AI</h2>
                            <p className="whitespace-pre-wrap leading-relaxed opacity-90">{explanation}</p>
                        </div>
                         <div className="bg-indigo-950/40 p-5 rounded-2xl border border-white/20">
                            <h2 className="text-xl font-bold mb-3 text-cyan-300">Mô phỏng 3D Tương tác</h2>
                            {imageUrl ? (
                                <div>
                                    <div
                                      onMouseMove={handleMouseMove3D}
                                      onMouseLeave={handleMouseLeave3D}
                                      style={{ perspective: '1000px' }}
                                      className="cursor-pointer"
                                    >
                                      <img 
                                        src={imageUrl} 
                                        alt={concept} 
                                        className="rounded-lg w-full h-auto object-cover border-2 border-cyan-400/30 transition-transform duration-100 ease-out" 
                                      />
                                    </div>
                                    <p className="text-xs text-center mt-2 opacity-70">Di chuyển chuột qua hình để xem hiệu ứng 3D</p>
                                    <a href={imageUrl} download={`${concept.replace(/\s+/g, '_')}_ai_art.png`} className="block w-full text-center mt-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 transition">
                                        Tải ảnh xuống
                                    </a>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center opacity-70">Không có hình ảnh.</div>
                            )}
                        </div>
                    </div>
                    <div className="bg-indigo-950/50 p-5 rounded-2xl border-2 border-cyan-400/30 shadow-inner">
                        <h3 className="text-lg font-bold mb-3 text-cyan-200">Thí nghiệm: "Điều gì sẽ xảy ra nếu...?"</h3>
                        <p className="text-sm opacity-80 mb-4">Đặt câu hỏi tiếp theo để khám phá sâu hơn về chủ đề này.</p>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                             <input
                                type="text"
                                value={followUp}
                                onChange={(e) => setFollowUp(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') runWithApiKey(() => handleExplore(true)); }}
                                placeholder="Ví dụ: Điều gì sẽ xảy ra nếu không có lục lạp?"
                                className="flex-grow w-full rounded-xl bg-indigo-950/50 border-2 border-white/20 p-3 placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
                            />
                            <button
                                onClick={() => runWithApiKey(() => handleExplore(true))}
                                disabled={isLoading}
                                className="w-full md:w-auto px-6 py-3 rounded-xl font-semibold bg-cyan-500/80 text-slate-900 hover:bg-cyan-400 active:scale-[.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "..." : "Hỏi AI"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
