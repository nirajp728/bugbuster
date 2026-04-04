import { Link, useLocation } from 'react-router-dom';
import { Activity, AudioWaveform, Battery, Plug, LogOut } from 'lucide-react';

export default function Layout({ children, setToken }) {
    const location = useLocation();
    const navItems = [
        { path: '/', label: 'Multimeter', icon: <Activity /> },
        { path: '/function-gen', label: 'Function Gen', icon: <AudioWaveform /> }, // <-- Updated here
        { path: '/voltage-reg', label: 'Voltage Reg', icon: <Battery /> },
        { path: '/connection', label: 'Connection', icon: <Plug /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white flex-col md:flex-row">
            {/* Sidebar */}
            <nav className="w-full md:w-64 bg-gray-800 p-4 flex flex-col justify-between shadow-lg">
                <div>
                    <h1 className="text-xl font-bold text-green-400 mb-8 text-center">STM32 Lab</h1>
                    <div className="flex flex-col space-y-2">
                        {navItems.map((item) => (
                            <Link key={item.path} to={item.path}
                                className={`flex items-center space-x-3 p-3 rounded transition-colors ${
                                    location.pathname === item.path ? 'bg-gray-700 text-green-400 border-b-2 border-green-400' : 'hover:bg-gray-700'
                                }`}>
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-3 p-3 text-red-400 hover:bg-gray-700 rounded mt-4 md:mt-0">
                    <LogOut /> <span>Logout</span>
                </button>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}