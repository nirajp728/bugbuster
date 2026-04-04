import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login({ setToken }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
                <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">STM32 Lab Login</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Email</label>
                        <input type="email" required className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">Password</label>
                        <input type="password" required className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors">
                        Login
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400 text-sm">
                    Don't have an account? <Link to="/register" className="text-green-400 hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
}