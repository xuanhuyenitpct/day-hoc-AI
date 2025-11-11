import React, { useState, useMemo } from "react";
import { ApiProvider } from "./src/context/ApiContext";
import { Sidebar } from "./src/components/Sidebar";
import { MemoryGame } from "./src/components/MemoryGame";
import { AILabApp } from "./src/views/AILabApp";
import { KidGeniusApp } from "./src/views/KidGeniusApp";
import { EnglishPracticeApp } from "./src/views/EnglishPracticeApp";
import { QuizMasterApp } from "./src/views/QuizMasterApp";

// ===================================
//      MAIN APP Component
// ===================================
export const App = () => {
    const [view, setView] = useState('dashboard');
    const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
    const [showMemoryGame, setShowMemoryGame] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const MOCK_USER = useMemo(() => ({
        uid: userRole === 'teacher' ? 'demo_teacher_001' : 'demo_student_001',
        displayName: userRole === 'teacher' ? 'Giáo viên Demo' : 'Học sinh Demo',
    }), [userRole]);

    const MOCK_USER_PROFILE = useMemo(() => ({
        displayName: userRole === 'teacher' ? 'Giáo viên Demo' : 'Học sinh Demo',
        role: userRole,
    }), [userRole]);


    const renderAppContent = () => {
        switch (view) {
            case 'aiLab':
                return <AILabApp />;
            case 'kidGenius':
                return <KidGeniusApp currentUser={MOCK_USER} />;
            case 'english':
                return <EnglishPracticeApp />;
            case 'quizMaster':
                return <QuizMasterApp userRole={MOCK_USER_PROFILE.role} />;
            case 'dashboard':
            default:
                const toolsForRole = {
                    teacher: [
                        { id: 'quizMaster', title: 'Trợ lý Dạy học', desc: 'Tạo bộ tài liệu, câu hỏi, thẻ học tập và giao bài cho học sinh.', icon: '📚' },
                        { id: 'kidGenius', title: 'Gia Sư AI Cá Nhân Hóa', desc: 'Lộ trình học tập và bài kiểm tra trắc nghiệm thông minh.', icon: '✨' },
                        { id: 'aiLab', title: 'Phòng Thí Nghiệm Ảo', desc: 'Khám phá khái niệm khoa học qua giải thích và mô phỏng 3D.', icon: '🔬' },
                        { id: 'english', title: 'Luyện Giao Tiếp Tiếng Anh', desc: 'Thực hành hội thoại với AI trong các tình huống thực tế.', icon: '💬' },
                    ],
                    student: [
                        { id: 'kidGenius', title: 'Gia Sư AI Cá Nhân Hóa', desc: 'Lộ trình học tập và bài kiểm tra trắc nghiệm thông minh.', icon: '✨' },
                        { id: 'aiLab', title: 'Phòng Thí Nghiệm Ảo', desc: 'Khám phá khái niệm khoa học qua giải thích và mô phỏng 3D.', icon: '🔬' },
                        { id: 'english', title: 'Luyện Giao Tiếp Tiếng Anh', desc: 'Thực hành hội thoại với AI trong các tình huống thực tế.', icon: '💬' },
                         { id: 'quizMaster', title: 'Trợ lý Học tập Cá nhân', desc: 'Tự tạo bộ đề và thẻ học để chinh phục mọi kiến thức', icon: '📚' },
                    ]
                };

                return (
                    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold">Chào mừng, {MOCK_USER_PROFILE.displayName}!</h1>
                            <p className="opacity-80">{MOCK_USER_PROFILE.role === 'teacher' ? 'Chọn một công cụ để bắt đầu.' : 'Hãy chọn một hoạt động học tập.'}</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(toolsForRole[MOCK_USER_PROFILE.role] || []).map(tool => (
                                <button key={tool.id} onClick={() => setView(tool.id)} className="p-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left">
                                    <div className="text-4xl mb-2">{tool.icon}</div>
                                    <h3 className="font-bold text-lg">{tool.title}</h3>
                                    <p className="text-sm opacity-80">{tool.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    const renderBackground = () => (
        <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="parallax-bg" style={{
                backgroundImage: 'url(https://firebasestorage.googleapis.com/v0/b/svelteshot-425216.appspot.com/o/public%2Fsparkle-edu%2Fparallax-bg.png?alt=media&token=8039c9f2-257a-4223-952b-7c5e87a2d67a)',
                animationDuration: '40s'
            }}></div>
            <div className="parallax-bg opacity-50" style={{
                backgroundImage: 'url(https://firebasestorage.googleapis.com/v0/b/svelteshot-425216.appspot.com/o/public%2Fsparkle-edu%2Fparallax-stars.png?alt=media&token=4883f3b9-166c-482a-a226-9d332616428c)',
                animationDuration: '80s'
            }}></div>
            {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="sparkle" style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 5 + 3}s`,
                    animationDelay: `${Math.random() * 5}s`,
                }}></div>
            ))}
        </div>
    );
    
    return (
        <ApiProvider>
            <main className="h-full w-full text-white bg-indigo-950/50 relative overflow-hidden">
                {renderBackground()}
                
                <div className="relative z-10 h-full w-full flex">
                    {userRole ? (
                        <>
                            <Sidebar view={view} setView={setView} onLogout={() => setUserRole(null)} isSidebarOpen={isSidebarOpen} />
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <header className="md:hidden p-2 bg-indigo-950/50 flex items-center gap-4">
                                     <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-white/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                    </button>
                                     <h1 className="text-lg font-bold text-white">EduSpark AI</h1>
                                </header>
                                <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
                                    {renderAppContent()}
                                </div>
                            </div>
                            {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setIsSidebarOpen(false)}></div>}
                        </>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
                            {showMemoryGame && <MemoryGame onClose={() => setShowMemoryGame(false)} />}
                            <div className="relative z-10 max-w-5xl">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-4">Chào mừng bạn đến với EduSpark AI</h1>
                                <p className="text-lg text-white/80 mb-10">Vui lòng chọn vai trò của bạn hoặc thư giãn với một trò chơi.</p>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <button 
                                        onClick={() => setUserRole('teacher')}
                                        className="group flex-1 p-8 rounded-3xl bg-indigo-900/40 backdrop-blur-xl border-2 border-white/20 hover:border-cyan-400/80 hover:bg-indigo-900/60 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">👩‍🏫</div>
                                        <h2 className="text-3xl font-bold text-cyan-300">Giáo viên</h2>
                                        <p className="text-white/70 mt-2">Tạo bài giảng, giao bài tập, và quản lý lớp học.</p>
                                    </button>
                                    <button 
                                        onClick={() => setUserRole('student')}
                                        className="group flex-1 p-8 rounded-3xl bg-indigo-900/40 backdrop-blur-xl border-2 border-white/20 hover:border-purple-400/80 hover:bg-indigo-900/60 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">🎓</div>
                                        <h2 className="text-3xl font-bold text-purple-300">Học sinh</h2>
                                        <p className="text-white/70 mt-2">Học tập, làm bài kiểm tra, và khám phá kiến thức.</p>
                                    </button>
                                    <button 
                                        onClick={() => setShowMemoryGame(true)}
                                        className="group flex-1 p-8 rounded-3xl bg-indigo-900/40 backdrop-blur-xl border-2 border-white/20 hover:border-yellow-400/80 hover:bg-indigo-900/60 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">🎮</div>
                                        <h2 className="text-3xl font-bold text-yellow-300">Giải trí</h2>
                                        <p className="text-white/70 mt-2">Thử tài trí nhớ với trò chơi tìm cặp vui nhộn.</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </ApiProvider>
    );
};
