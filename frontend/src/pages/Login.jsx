import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login({ setToken }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 font-sans text-gray-200">
            <div className="w-full max-w-md bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl p-8">
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-emerald-500 tracking-wider mb-2">STM32 Lab</h1>
                    <p className="text-gray-400 text-sm">Sign in to access your remote hardware</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                        <input 
                            type="email" required
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#0d1117] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="engineer@lab.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                        <input 
                            type="password" required
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#0d1117] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-4">
                        {loading ? 'Connecting...' : 'Secure Login'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400 text-sm">
                    No account yet?{' '}
                    <Link to="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}