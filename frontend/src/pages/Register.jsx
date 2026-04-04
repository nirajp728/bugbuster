import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
                <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">Create Account</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Name</label>
                        <input type="text" required className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
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
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition-colors">
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}