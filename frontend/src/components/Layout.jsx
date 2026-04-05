import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, AudioWaveform, Battery, History, LogOut, Sun, Moon, Zap } from 'lucide-react';

export default function Layout({ children, setToken }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Theme Management State
    const [isDark, setIsDark] = useState(true);

    // Apply the 'dark' class to the root HTML element
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/multimeter', label: 'Multimeter', icon: <Activity size={20} /> },
        { path: '/function-gen', label: 'Function Gen', icon: <AudioWaveform size={20} /> },
        { path: '/voltage-reg', label: 'Voltage Reg', icon: <Battery size={20} /> },
        { path: '/sessions', label: 'Past Sessions', icon: <History size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-800 dark:text-gray-200 font-sans selection:bg-emerald-500/30 transition-colors duration-300">
            
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-gray-800 shadow-xl transition-colors duration-300">
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Zap size={18} className="text-white dark:text-[#0d1117] fill-current" />
                        </div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                            STM32<span className="text-emerald-500">LAB</span>
                        </h1>
                    </div>
                    
                    {/* THEME TOGGLE (DESKTOP) */}
                    <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                    isActive 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-inner' 
                                    : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <span className={`${isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-200 dark:border-gray-800/50">
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-slate-500 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 md:pb-10">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* MOBILE BOTTOM NAVIGATION (Scrollable Carousel) */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-xl border border-slate-200/50 dark:border-gray-700/50 h-[72px] rounded-3xl z-50 flex items-center justify-start flex-nowrap overflow-x-auto gap-2 px-3 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 transition-colors duration-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* Iterate over ALL items, NO slicing */}
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
                                isActive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 dark:text-gray-500'
                            }`}
                        >
                            {item.icon}
                            <span className="text-[9px] mt-1 font-bold">{item.label.split(' ')[0]}</span>
                        </Link>
                    );
                })}
                
                {/* Divider Line */}
                <div className="shrink-0 w-[1px] h-8 bg-slate-200 dark:bg-gray-700 mx-1"></div>
                
                {/* THEME TOGGLE (MOBILE) */}
                <button onClick={() => setIsDark(!isDark)} className="shrink-0 flex flex-col items-center justify-center w-16 h-14 text-slate-400 dark:text-gray-500 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="text-[9px] mt-1 font-bold">Theme</span>
                </button>

                {/* EXIT BUTTON */}
                <button onClick={handleLogout} className="shrink-0 flex flex-col items-center justify-center w-16 h-14 text-red-500/70 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors mr-2">
                    <LogOut size={20} />
                    <span className="text-[9px] mt-1 font-bold">Exit</span>
                </button>
            </nav>
        </div>
    );
}