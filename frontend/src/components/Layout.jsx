import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, AudioWaveform, Battery, History, LogOut } from 'lucide-react';

export default function Layout({ children, setToken }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Updated Navigation Items to include Dashboard and Sessions
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
        <div className="flex h-screen bg-[#0d1117] text-gray-200 font-sans selection:bg-emerald-500/30">
            
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-64 flex-col bg-[#161b22] border-r border-gray-800 shadow-xl">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Zap size={18} className="text-[#0d1117] fill-current" />
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tighter italic">
                            STM32<span className="text-emerald-500">LAB</span>
                        </h1>
                    </div>
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
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' 
                                    : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                                }`}
                            >
                                <span className={`${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400'} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-gray-800/50">
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto bg-[#0d1117] p-4 md:p-10 pb-32 md:pb-10">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* MOBILE BOTTOM NAVIGATION (Glassmorphism) */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] bg-[#161b22]/90 backdrop-blur-xl border border-gray-700/50 h-18 rounded-3xl z-50 flex justify-around items-center px-4 shadow-2xl shadow-black/50">
                {navItems.slice(0, 4).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
                                isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500'
                            }`}
                        >
                            {item.icon}
                            <span className="text-[10px] mt-1 font-bold">{item.label.split(' ')[0]}</span>
                        </Link>
                    );
                })}
                <button 
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center w-14 h-14 text-red-500/70"
                >
                    <LogOut size={20} />
                    <span className="text-[10px] mt-1 font-bold">Exit</span>
                </button>
            </nav>
        </div>
    );
}

// Internal Icon helper
function Zap({ size, className }) {
    return (
        <svg 
            width={size} height={size} viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
            strokeLinejoin="round" className={className}
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}