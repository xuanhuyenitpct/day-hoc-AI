import React from "react";

export const Sidebar = ({ view, setView, onLogout, isSidebarOpen }) => {
    const navItems = [
        { id: 'dashboard', label: 'Bảng điều khiển', icon: '🏠' },
        { id: 'quizMaster', label: 'Trợ lý Dạy học', icon: '📚' },
        { id: 'kidGenius', label: 'Gia sư AI', icon: '✨' },
        { id: 'aiLab', label: 'Phòng Thí Nghiệm', icon: '🔬' },
        { id: 'english', label: 'Luyện Tiếng Anh', icon: '💬' },
    ];

    return (
        <aside className={`absolute md:relative z-20 h-full bg-indigo-950/70 backdrop-blur-lg border-r border-white/10 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64`}>
            <div className="p-4 text-center border-b border-white/10">
                <h1 className="text-xl font-bold text-white">EduSpark AI</h1>
            </div>
            <nav className="flex-1 p-2 space-y-1">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-colors ${view === item.id ? 'bg-cyan-500/20 text-cyan-200' : 'text-white/80 hover:bg-white/10'}`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm text-white/80 hover:bg-white/10"
                >
                    <span className="text-lg">🚪</span>
                    <span>Đổi vai trò</span>
                </button>
            </div>
        </aside>
    );
};
