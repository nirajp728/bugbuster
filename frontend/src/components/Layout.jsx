import { Link, useLocation } from 'react-router-dom';
import { Activity, AudioWaveform, Battery, LogOut } from 'lucide-react'; // Or your icon library

export default function Layout({ children, setToken }) {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Multimeter', icon: <Activity size={20} /> },
        { path: '/function-gen', label: 'Function Gen', icon: <AudioWaveform size={20} /> },
        { path: '/voltage-reg', label: 'Voltage Reg', icon: <Battery size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <div className="flex h-screen bg-[#0d1117] text-gray-200 font-sans">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-64 flex-col bg-[#161b22] border-r border-gray-800">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-emerald-500 tracking-wider">STM32 Lab</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <Link key={item.path} to={item.path}
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                location.pathname === item.path 
                                ? 'bg-gray-800 text-emerald-400 border border-gray-700' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}>
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4">
                    <button onClick={handleLogout} className="flex items-center space-x-2 text-red-400 hover:text-red-300 p-2 w-full transition-colors">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>

            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="md:hidden fixed bottom-0 w-full bg-[#161b22] border-t border-gray-800 flex justify-around p-3 z-50">
                {navItems.map((item) => (
                    <Link key={item.path} to={item.path}
                        className={`flex flex-col items-center p-2 rounded-lg ${
                            location.pathname === item.path ? 'text-emerald-400' : 'text-gray-400'
                        }`}>
                        {item.icon}
                        <span className="text-xs mt-1">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}