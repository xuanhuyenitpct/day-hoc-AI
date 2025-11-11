import React, { useState, useEffect } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { useApiKey } from '../context/ApiContext';

export const KidGeniusApp = ({ currentUser }) => {
    const { runWithApiKey, apiKey } = useApiKey();
    const [stage, setStage] = useState('setup'); // 'setup', 'quiz', 'result'
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(`kidGeniusSettings_${currentUser.uid}`);
            const defaults = { grade: 'Lớp 6', subject: 'Toán', difficulty: 'Dễ', topic: '' };
            if (saved) {
                return { ...defaults, ...JSON.parse(saved) };
            }
            return defaults;
        } catch (e) {
            console.error("Failed to load kid genius settings:", e);
            return { grade: 'Lớp 6', subject: 'Toán', difficulty: 'Dễ', topic: '' };
        }
    });
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null); // { index: number, isCorrect: boolean }
    const [showFeedback, setShowFeedback] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [unlockedLevels, setUnlockedLevels] = useState({});

    const [learningPath, setLearningPath] = useState(null);
    const [quizHistory, setQuizHistory] = useState([]);
    const [isFromPath, setIsFromPath] = useState(false);
    const [aiTutorFeedback, setAITutorFeedback] = useState(null);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [viewingHistoryEntry, setViewingHistoryEntry] = useState(null);

    const GRADES = ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];
    const SUBJECTS = ['Toán', 'Ngữ Văn', 'Tiếng Anh', 'Khoa học tự nhiên', 'Lịch sử và Địa lí', 'Tin học', 'Giáo dục công dân'];
    const DIFFICULTIES = ['Dễ', 'Trung bình', 'Khó'];
    const EMOJIS = { 'Dễ': '😊', 'Trung bình': '🤔', 'Khó': '🤯' };
    const difficultyOrder = { 'Dễ': 1, 'Trung bình': 2, 'Khó': 3 };

    useEffect(() => {
        try {
            const savedProgress = localStorage.getItem(`kidGeniusProgress_${currentUser.uid}`);
            if (savedProgress) {
                setUnlockedLevels(JSON.parse(savedProgress));
            }
        } catch (e) {
            console.error("Failed to parse kid genius progress:", e);
            localStorage.removeItem(`kidGeniusProgress_${currentUser.uid}`);
        }
    }, [currentUser.uid]);
    
    useEffect(() => {
        try {
            const settingsToSave = {
                grade: settings.grade,
                subject: settings.subject,
            };
            localStorage.setItem(`kidGeniusSettings_${currentUser.uid}`, JSON.stringify(settingsToSave));
        } catch (e) {
            console.error("Failed to save kid genius settings:", e);
        }
    }, [settings.grade, settings.subject, currentUser.uid]);

    useEffect(() => {
        try {
            const savedPath = localStorage.getItem(`kidGeniusPath_${currentUser.uid}_${settings.grade}_${settings.subject}`);
            if (savedPath) {
                setLearningPath(JSON.parse(savedPath));
            } else {
                setLearningPath(null);
            }

            const savedHistory = localStorage.getItem(`kidGeniusHistory_${currentUser.uid}_${settings.grade}_${settings.subject}`);
            if (savedHistory) {
                setQuizHistory(JSON.parse(savedHistory));
            } else {
                setQuizHistory([]);
            }
        } catch (e)
            {
            console.error("Failed to load learning path or history:", e);
            setLearningPath(null);
            setQuizHistory([]);
        }
    }, [settings.grade, settings.subject, currentUser.uid]);

    useEffect(() => {
        if (stage === 'result' && score >= 70) {
            const currentGrade = settings.grade;
            const currentSubject = settings.subject;
            const currentDifficulty = settings.difficulty;

            const currentLevelIndex = difficultyOrder[currentDifficulty];
            if (currentLevelIndex < 3) {
                const nextDifficulty = Object.keys(difficultyOrder).find(key => difficultyOrder[key] === currentLevelIndex + 1);
                
                setUnlockedLevels(prev => {
                    const newProgress = JSON.parse(JSON.stringify(prev)); 
                    if (!newProgress[currentGrade]) {
                        newProgress[currentGrade] = {};
                    }
                    
                    const currentUnlockedLevel = newProgress[currentGrade][currentSubject] || 'Dễ';
                    const currentUnlockedLevelIndex = difficultyOrder[currentUnlockedLevel];

                    if (nextDifficulty && difficultyOrder[nextDifficulty] > currentUnlockedLevelIndex) {
                        newProgress[currentGrade][currentSubject] = nextDifficulty;
                        localStorage.setItem(`kidGeniusProgress_${currentUser.uid}`, JSON.stringify(newProgress));
                    }
                    return newProgress;
                });
            }
        }
    }, [stage, score, settings, currentUser.uid]);


    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    const generateKidGeniusQuiz = async (fromPath = false) => {
        setIsLoading(true);
        setError('');
        setIsFromPath(fromPath);
        try {
            if (!apiKey) throw new Error("API Key is not set.");
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Bạn là chuyên gia tạo câu hỏi trắc nghiệm cho học sinh trung học cơ sở Việt Nam theo Chương trình giáo dục phổ thông 2018.
Hãy tạo 5 câu hỏi trắc nghiệm dựa trên các tiêu chí sau:
- Lớp: ${settings.grade}
- Môn học: ${settings.subject}
- Chủ đề cụ thể: ${settings.topic || 'Kiến thức tổng hợp của môn học'}
- Cấp độ: ${settings.difficulty}

Các câu hỏi phải phù hợp với trình độ của học sinh.
Chỉ trả về kết quả dưới dạng một mảng JSON. Mỗi đối tượng trong mảng phải có cấu trúc sau:
{
  "question": "Nội dung câu hỏi bằng tiếng Việt.",
  "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
  "correctAnswerIndex": 0,
  "explanation": "Giải thích ngắn gọn vì sao đáp án đó đúng, bằng tiếng Việt."
}
QUAN TRỌNG: Hãy kiểm tra lại thật kỹ để đảm bảo 'correctAnswerIndex' trỏ chính xác đến đáp án đúng trong mảng 'options' và 'explanation' phải giải thích cho đáp án đúng đó một cách logic và chính xác, đặc biệt là các phép tính toán học.`;
            
            const quizSchema = {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctAnswerIndex', 'explanation']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: quizSchema
                    },
                },
            });

            const generatedQuestions = JSON.parse(response.text.trim());
            if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
              throw new Error("AI không trả về câu hỏi hợp lệ.");
            }
            
            setQuestions(generatedQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setShowFeedback(false);
            setUserAnswers({});
            setAITutorFeedback(null);
            setStage('quiz');

        } catch (err) {
            console.error("Error generating quiz with Gemini:", err);
            const errorMessage = (err as Error).message || String(err);
            setError("Không thể tạo câu hỏi. Vui lòng thử lại. Lỗi: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const generateLearningPath = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (!apiKey) throw new Error("API Key is not set.");
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Bạn là một gia sư AI chuyên nghiệp, tạo ra một lộ trình học tập cá nhân hóa trong 4 tuần cho học sinh Việt Nam, bám sát theo Chương trình giáo dục phổ thông 2018.
- Lớp: ${settings.grade}
- Môn học: ${settings.subject}
Mục tiêu là giúp học sinh cải thiện điểm số ít nhất 15% sau khi hoàn thành. Lộ trình cần chia thành 4 tuần, mỗi tuần tập trung vào các chủ đề cốt lõi của chương trình học theo chuẩn của Bộ Giáo dục và Đào tạo Việt Nam.
Chỉ trả về một mảng JSON gồm 4 đối tượng. Mỗi đối tượng đại diện cho một tuần và có cấu trúc:
{
  "week": (số tuần, ví dụ: 1),
  "title": "Tiêu đề hấp dẫn cho tuần học (ví dụ: 'Làm chủ Phân số')",
  "topics": ["Chủ đề 1", "Chủ đề 2"],
  "objective": "Mục tiêu học tập cho tuần này, ví dụ: 'Nắm vững các phép toán cộng, trừ phân số và giải các bài toán liên quan.'"
}`;
            
            const pathSchema = {
                type: Type.OBJECT,
                properties: {
                    week: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    objective: { type: Type.STRING },
                },
                required: ['week', 'title', 'topics', 'objective']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: pathSchema
                    },
                },
            });

            const pathData = JSON.parse(response.text.trim());
            if (!Array.isArray(pathData) || pathData.length !== 4) {
              throw new Error("AI không trả về lộ trình hợp lệ.");
            }
            
            setLearningPath(pathData);
            localStorage.setItem(`kidGeniusPath_${currentUser.uid}_${settings.grade}_${settings.subject}`, JSON.stringify(pathData));

        } catch (err) {
            console.error("Error generating learning path:", err);
            const errorMessage = (err as Error).message || String(err);
            setError("Không thể tạo lộ trình. Vui lòng thử lại. Lỗi: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const generateAITutorFeedback = async (finalScore, finalQuestions, finalUserAnswers) => {
        setIsFeedbackLoading(true);
        setAITutorFeedback(null);
        let feedbackData = null;

        try {
            const wrongAnswersInfo = finalQuestions.map((q, index) => {
                const userAnswerIndex = finalUserAnswers[index];
                const isCorrect = userAnswerIndex === q.correctAnswerIndex;
                const studentChoice = (userAnswerIndex !== undefined && userAnswerIndex !== null && q.options[userAnswerIndex]) 
                    ? `"${q.options[userAnswerIndex]}"` 
                    : "Không trả lời";

                if (!isCorrect) {
                    return `Câu hỏi: "${q.question}"\n- Học sinh chọn: ${studentChoice}\n- Đáp án đúng: "${q.options[q.correctAnswerIndex]}"\n- Giải thích: ${q.explanation}`;
                }
                return null;
            }).filter(Boolean);

            if (wrongAnswersInfo.length === 0 && finalScore >= 100) {
                feedbackData = {
                    title: "Xuất sắc! 100 Điểm!",
                    content: "Chúc mừng em đã đạt điểm 100/100 trong bài kiểm tra! Đây là một thành tích rất xuất sắc và đáng tự hào, thể hiện sự nỗ lực và kiến thức vững vàng của em. Em đã làm rất tốt rồi!"
                };
                setAITutorFeedback(feedbackData);
            } else {
                if (!apiKey) throw new Error("API Key is not set.");
                const ai = new GoogleGenAI({ apiKey });
                const prompt = `Bạn là một gia sư AI tận tâm và thấu hiểu. Một học sinh vừa hoàn thành bài kiểm tra với điểm số ${finalScore}/100.
                Dưới đây là những câu học sinh đã trả lời sai:
                ${wrongAnswersInfo.join('\n\n')}

                Hãy phân tích các lỗi sai này và đưa ra một nhận xét sâu sắc.
                - Tìm ra (nếu có) một mẫu số chung trong các lỗi sai (ví dụ: nhầm lẫn về một khái niệm cụ thể, đọc đề không kỹ).
                - Đưa ra lời khuyên cụ thể và mang tính xây dựng để giúp học sinh cải thiện.
                - Giọng văn cần tích cực, khích lệ và thân thiện. Bắt đầu bằng một lời chúc mừng hoặc động viên về số điểm đã đạt được.

                Chỉ trả về một đối tượng JSON với cấu trúc:
                {
                  "title": "Một tiêu đề ngắn gọn, khích lệ (ví dụ: 'Phân tích từ Gia sư AI: Nền tảng vững chắc cho thành công')",
                  "content": "Nội dung phân tích và lời khuyên chi tiết của bạn."
                }`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.STRING },
                            },
                            required: ['title', 'content'],
                        },
                    },
                });
                feedbackData = JSON.parse(response.text.trim());
                setAITutorFeedback(feedbackData);
            }
        } catch (err) {
            console.error("Error generating AI tutor feedback:", err);
            feedbackData = { title: "Lỗi", content: "Không thể tạo nhận xét của gia sư AI lúc này." };
            setAITutorFeedback(feedbackData);
        } finally {
            const newHistoryEntry = {
                date: new Date().toISOString(),
                score: finalScore,
                difficulty: settings.difficulty,
                topic: settings.topic || settings.subject,
                questions: finalQuestions,
                userAnswers: finalUserAnswers,
                aiTutorFeedback: feedbackData,
            };
            
            setQuizHistory(prevHistory => {
                const updatedHistory = [...prevHistory, newHistoryEntry];
                localStorage.setItem(`kidGeniusHistory_${currentUser.uid}_${settings.grade}_${settings.subject}`, JSON.stringify(updatedHistory));
                return updatedHistory;
            });

            setIsFeedbackLoading(false);
        }
    };


    const handleAnswerSelect = (optionIndex) => {
        if (showFeedback) return;
        
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
        
        setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
        setSelectedAnswer({ index: optionIndex, isCorrect });
        if (isCorrect) {
            setScore(s => s + 20);
        }
        setShowFeedback(true);
    };

    const handleNext = () => {
        setSelectedAnswer(null);
        setShowFeedback(false);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            const finalScore = score;
            setStage('result');
            runWithApiKey(() => generateAITutorFeedback(finalScore, questions, userAnswers));
        }
    };

    const handlePlayAgain = () => {
        setViewingHistoryEntry(null);
        setStage('setup');
        setQuestions([]);
        setError('');
        setAITutorFeedback(null);
        setSettings(prev => ({ ...prev, topic: '' }));
    };
    
    const startQuizFromPath = (weekTopics, difficulty) => {
        setSettings(prev => ({
            ...prev,
            topic: weekTopics.join(', '),
            difficulty: difficulty,
        }));
        runWithApiKey(() => generateKidGeniusQuiz(true));
    };

    const LearningPathMap = ({ path, history, onStartQuiz }) => {
        const [selectedWeek, setSelectedWeek] = useState(null);
    
        const DIFFICULTIES = ['Dễ', 'Trung bình', 'Khó'];
        const difficultyOrder = { 'Dễ': 1, 'Trung bình': 2, 'Khó': 3 };

        let maxUnlockedWeek = 1;
        if (path) {
            while (maxUnlockedWeek <= path.length) {
                const currentWeekToCheck = path.find(w => w.week === maxUnlockedWeek);
                if (!currentWeekToCheck) break;
    
                const weekHistory = history.filter(h => h.topic === currentWeekToCheck.topics.join(', '));
                
                const passedDifficulties = new Set(
                    weekHistory
                        .filter(h => h.score >= 70)
                        .map(h => h.difficulty)
                );
                const hasPassedAllDifficulties = 
                    passedDifficulties.has('Dễ') && 
                    passedDifficulties.has('Trung bình') && 
                    passedDifficulties.has('Khó');

                if (hasPassedAllDifficulties) {
                    maxUnlockedWeek++;
                } else {
                    break;
                }
            }
        }
        
        const getUnlockedDifficultyIndex = (week) => {
            if (!week) return 1;
            const weekTopic = week.topics.join(', ');
            const passedQuizzes = history.filter(h => h.topic === weekTopic && h.score >= 70);

            if (passedQuizzes.length > 0) {
                const highestPassedDifficulty = Math.max(1, ...passedQuizzes.map(h => difficultyOrder[h.difficulty]));
                return Math.min(highestPassedDifficulty + 1, 3);
            }
            return 1;
        };

        const unlockedDifficultyIndexForModal = getUnlockedDifficultyIndex(selectedWeek);

    
        return (
            <div className="w-full px-4 md:px-10 py-8">
                <div className="relative flex justify-between items-start w-full">
                    <div
                        className="absolute top-7 left-0 w-full h-px -translate-y-1/2"
                        style={{
                            backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.4) 50%, transparent 50%)",
                            backgroundSize: "12px 1px",
                            backgroundRepeat: 'repeat-x'
                        }}
                    ></div>
    
                    {path.map((week) => {
                        const isLocked = week.week > maxUnlockedWeek;
                        const isCurrent = week.week === maxUnlockedWeek;
    
                        let nodeClasses = "relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg";
                        let icon;
                        let glowClasses = "";
                        let textColor = "text-white/70";
    
                        if (!isLocked) {
                            nodeClasses += " cursor-pointer";
                        }
    
                        if (isLocked) {
                            nodeClasses += " bg-slate-800/60 border-slate-600";
                            textColor = "text-white/50";
                            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400/70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" clipRule="evenodd" /></svg>;
                        } else if (isCurrent) {
                            nodeClasses += " bg-purple-600 border-purple-300";
                            glowClasses = "animate-pulse shadow-[0_0_20px_5px_rgba(192,132,252,0.6)]";
                            textColor = "text-white font-semibold";
                            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
                        } else { // Completed
                            nodeClasses += " bg-slate-700/80 border-slate-500";
                            textColor = "text-white/80";
                            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
                        }
    
                        return (
                            <div key={week.week} className="relative flex flex-col items-center z-10" onClick={() => !isLocked && setSelectedWeek(week)}>
                                <div className={`${nodeClasses} ${glowClasses}`}>
                                    {icon}
                                </div>
                                <div className={`text-center mt-3 w-32 text-xs ${textColor}`}>{week.title}</div>
                            </div>
                        );
                    })}
                </div>
    
                {selectedWeek && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setSelectedWeek(null)}>
                        <div className="bg-slate-800/80 border-2 border-purple-400 rounded-3xl p-6 w-full max-w-md shadow-[0_0_25px_rgba(192,132,252,0.5)]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold opacity-90">{`Tuần ${selectedWeek.week}`}</p>
                                    <h3 className="text-2xl font-extrabold leading-tight text-white mt-1">{selectedWeek.title}</h3>
                                </div>
                                <button onClick={() => setSelectedWeek(null)} className="text-2xl opacity-70 hover:opacity-100">&times;</button>
                            </div>
                            <div className="text-sm opacity-80 space-y-2 pt-4 my-4 border-t border-white/20">
                                <p><b className="font-semibold text-white/90">Chủ đề:</b> {selectedWeek.topics.join(', ')}</p>
                                <p><b className="font-semibold text-white/90">Mục tiêu:</b> {selectedWeek.objective}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-auto">
                               {DIFFICULTIES.map(d => {
                                    const difficultyIndex = difficultyOrder[d];
                                    const isLocked = difficultyIndex > unlockedDifficultyIndexForModal;

                                    return (
                                        <button
                                            key={d}
                                            onClick={() => { if (!isLocked) { onStartQuiz(selectedWeek.topics, d); setSelectedWeek(null); } }}
                                            disabled={isLocked}
                                            className={`relative py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                                                isLocked
                                                    ? 'bg-black/20 text-white/50 cursor-not-allowed'
                                                    : 'bg-black/40 hover:bg-black/60'
                                            }`}
                                        >
                                            {d}
                                            {isLocked && <span className="absolute top-1 right-1 text-xs" aria-label="Khóa">🔒</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    if (stage === 'setup') {
        const highestUnlockedForCurrent = unlockedLevels[settings.grade]?.[settings.subject] || 'Dễ';
        const highestUnlockedIndex = difficultyOrder[highestUnlockedForCurrent];
        
        return (
            <section className="backdrop-blur-xl bg-black/30 border-2 border-purple-500/30 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_0_25px_rgba(192,132,252,0.2)] w-full max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-[0_0_10px_rgba(192,132,252,0.7)] text-purple-300">Gia Sư AI Cá Nhân Hóa</h1>
                    <p className="opacity-95 mt-2 text-purple-100/90">Chọn môn học và bắt đầu cuộc phiêu lưu của bạn! ✨</p>
                </header>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                     <div>
                        <label className="flex items-center gap-2 text-sm mb-2 opacity-90">🚀 Chọn Lớp</label>
                        <select value={settings.grade} onChange={(e) => handleSettingChange('grade', e.target.value)} className="w-full rounded-xl bg-black/40 border-2 border-purple-400/50 p-3 placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-purple-400/50 appearance-none">
                            {GRADES.map(g => <option key={g} value={g} className="bg-indigo-600">{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm mb-2 opacity-90">🪐 Chọn Môn</label>
                        <select value={settings.subject} onChange={(e) => handleSettingChange('subject', e.target.value)} className="w-full rounded-xl bg-black/40 border-2 border-purple-400/50 p-3 placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-purple-400/50 appearance-none">
                            {SUBJECTS.map(s => <option key={s} value={s} className="bg-indigo-600">{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-black/30 p-4 sm:p-6 rounded-3xl border-2 border-purple-400/30">
                    <h2 className="text-2xl font-bold mb-4 text-center text-purple-300">Bản đồ học tập</h2>
                    {learningPath ? (
                         <div>
                            <LearningPathMap path={learningPath} history={quizHistory} onStartQuiz={startQuizFromPath} />
                             <button onClick={() => { if(confirm('Bạn có chắc muốn xóa lộ trình hiện tại và tạo lại?')) { setLearningPath(null); localStorage.removeItem(`kidGeniusPath_${currentUser.uid}_${settings.grade}_${settings.subject}`); } }} className="text-xs underline opacity-70 hover:opacity-100 mt-2 mx-auto block">Xóa lộ trình & tạo lại</button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="mb-4">Bạn chưa có lộ trình. Hãy để AI vạch ra một bản đồ chinh phục 4 tuần cho môn học này!</p>
                             <button onClick={() => runWithApiKey(generateLearningPath)} disabled={isLoading} className="px-6 py-3 rounded-xl font-semibold bg-purple-500 text-white hover:scale-[1.02] active:scale-[.98] transition shadow-[0_0_15px_rgba(192,132,252,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? "AI đang vẽ bản đồ..." : "🚀 Tạo Lộ Trình Học Tập"}
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="bg-black/30 p-4 sm:p-6 rounded-3xl border-2 border-purple-400/30 mt-6">
                    <h2 className="text-2xl font-bold mb-4 text-center text-purple-300">Lịch sử làm bài</h2>
                    {quizHistory.length > 0 ? (
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {quizHistory.slice().reverse().map((entry, index) => (
                                <li key={index}>
                                    <button 
                                        onClick={() => { setViewingHistoryEntry(entry); setStage('result'); }}
                                        disabled={!entry.aiTutorFeedback}
                                        className="w-full flex justify-between items-center text-left p-3 rounded-lg bg-black/40 hover:bg-black/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div>
                                            <p className="font-semibold">{entry.topic}</p>
                                            <p className="text-xs opacity-70">
                                                {new Date(entry.date).toLocaleString('vi-VN')} - {entry.difficulty}
                                            </p>
                                        </div>
                                        <div className={`font-bold text-lg ${entry.score >= 70 ? 'text-green-300' : 'text-yellow-300'}`}>
                                            {entry.score}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center opacity-70">Chưa có bài kiểm tra nào được hoàn thành cho môn học này.</p>
                    )}
                </div>
                
                {error && <div className="text-sm text-rose-300 text-center mt-4 p-3 bg-rose-900/40 border border-rose-500/50 rounded-lg">{error}</div>}
            </section>
        );
    }
    
    if (stage === 'quiz' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        return (
             <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl w-full max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-4">
                    <button onClick={() => {
                        if (confirm("Bạn có chắc muốn thoát? Tiến trình của bạn sẽ không được lưu.")) {
                            setStage('setup');
                        }
                    }} className="px-4 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">← Quay lại</button>
                    <div className="text-right">
                        <div className="font-bold text-lg">Điểm</div>
                        <div className="text-2xl font-extrabold text-yellow-300">{score}<span className="text-base opacity-70">/100</span></div>
                    </div>
                </header>
                 <div className="w-full bg-white/20 rounded-full h-2.5 mb-6">
                    <div className="bg-green-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>

                <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-semibold mb-6 min-h-[6rem] flex items-center justify-center p-4 bg-black/20 rounded-2xl">{currentQuestion.question}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt, i) => {
                            let borderColor = 'border-transparent';
                            if (showFeedback) {
                                if (i === currentQuestion.correctAnswerIndex) {
                                    borderColor = 'border-green-400';
                                } else if (selectedAnswer?.index === i) {
                                    borderColor = 'border-red-500';
                                }
                            }
                            return (
                                <button key={i} onClick={() => handleAnswerSelect(i)} disabled={showFeedback} className={`text-left flex items-center gap-3 rounded-xl p-4 bg-white/10 border-4 transition-all hover:bg-white/20 disabled:cursor-not-allowed ${borderColor}`}>
                                    <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/20 flex items-center justify-center font-bold text-md">{String.fromCharCode(65 + i)}</div>
                                    <span className="flex-1">{opt}</span>
                                </button>
                            );
                        })}
                    </div>

                    {showFeedback && (
                         <div className={`mt-6 p-4 rounded-2xl text-left border-2 ${selectedAnswer?.isCorrect ? 'bg-green-900/40 border-green-500/50' : 'bg-red-900/40 border-red-500/50'}`}>
                            <h3 className="font-bold text-lg mb-2">{selectedAnswer?.isCorrect ? 'Chính xác!' : 'Chưa đúng rồi...'}</h3>
                            {!selectedAnswer?.isCorrect && <p className="mb-2">Đáp án đúng: <b>{currentQuestion.options[currentQuestion.correctAnswerIndex]}</b></p>}
                            <p className="text-sm opacity-90">{currentQuestion.explanation}</p>
                            <button onClick={handleNext} className="w-full mt-4 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold">
                                {currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                            </button>
                         </div>
                    )}
                </div>
            </section>
        );
    }
    
    if (stage === 'result') {
        const isViewingHistory = !!viewingHistoryEntry;
        const resultData = isViewingHistory ? viewingHistoryEntry : {
            score: score,
            aiTutorFeedback: aiTutorFeedback,
        };
        const showUnlockMessage = !isViewingHistory && score >= 70 && settings.difficulty !== 'Khó';

         return (
             <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl w-full max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-extrabold mb-2">Hoàn thành!</h2>
                 <p className="opacity-80 mb-6">{isViewingHistory ? `Xem lại kết quả cho: "${resultData.topic}"` : "Kết quả của em đây:"}</p>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div>
                        <div className="bg-black/20 rounded-2xl p-6">
                            <div className="text-lg opacity-80">Tổng điểm</div>
                            <div className="text-6xl font-black text-yellow-300 drop-shadow-lg my-1">{resultData.score}</div>
                            <div className="text-lg opacity-80">/ 100</div>
                        </div>
                        {showUnlockMessage && isFromPath && (
                            <div className="p-3 bg-green-900/40 border border-green-500/50 rounded-2xl mt-4 text-green-200 text-sm">
                                Chúc mừng! Hãy tiếp tục với cấp độ khó hơn nhé.
                            </div>
                         )}
                         {showUnlockMessage && !isFromPath && (
                            <div className="p-3 bg-green-900/40 border border-green-500/50 rounded-2xl mt-4 text-green-200 text-sm">
                                Tuyệt vời! Cấp độ tiếp theo đã được mở khóa.
                            </div>
                         )}
                         <div className="text-5xl mt-4">
                             {resultData.score >= 80 ? '🥳' : resultData.score >= 50 ? '🙂' : '🤔'}
                         </div>
                         <p className="mb-6">{resultData.score >= 80 ? 'Làm tốt lắm!' : resultData.score >= 50 ? 'Cố gắng nhé!' : 'Hãy thử lại nào!'}</p>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-5 text-left border border-purple-400/40">
                         <h3 className="text-xl font-bold mb-3 text-purple-300">
                             {isViewingHistory
                                ? (resultData.aiTutorFeedback?.title || "Phân tích từ Gia sư AI")
                                : (isFeedbackLoading ? "Gia sư AI đang phân tích..." : (aiTutorFeedback?.title || "Phân tích từ Gia sư AI"))
                            }
                         </h3>
                         {isViewingHistory ? (
                            <p className="whitespace-pre-wrap opacity-90 leading-relaxed text-sm">{resultData.aiTutorFeedback?.content}</p>
                         ) : (
                             isFeedbackLoading ? (
                                 <div className="flex items-center justify-center h-24">
                                    <div className="w-8 h-8 border-b-2 border-purple-300 rounded-full animate-spin"></div>
                                 </div>
                             ) : (
                                 <p className="whitespace-pre-wrap opacity-90 leading-relaxed text-sm">{aiTutorFeedback?.content}</p>
                             )
                         )}
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-8">
                    <button onClick={handlePlayAgain} className="px-8 py-4 rounded-2xl font-semibold bg-white text-indigo-700 hover:scale-[1.02] active:scale-[.98] transition shadow-lg">
                        {isViewingHistory ? 'Quay lại' : (isFromPath ? 'Về trang lộ trình' : 'Chơi lại')}
                    </button>
                </div>
             </section>
         );
    }

    return null;
};
