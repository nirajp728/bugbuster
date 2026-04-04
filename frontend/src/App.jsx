import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { io } from 'socket.io-client';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard'; // The new Unified view
import Multimeter from './pages/Multimeter';
import FunctionGen from './pages/FunctionGen';
import VoltageReg from './pages/VoltageReg';
import PastSessions from './pages/PastSessions'; // For your data logging

// Create a global socket instance
const API_URL = import.meta.env.VITE_BACKEND_URL;

// ✅ THE FIX: Bypasses Ngrok's anti-abuse warning page for the WebSocket
export const socket = io(`${API_URL}`, {
    extraHeaders: {
        "ngrok-skip-browser-warning": "true"
    }
});

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Authentication Guard
    if (!token) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login setToken={setToken} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Layout setToken={setToken}>
                <Routes>
                    {/* Default View is now the Master Dashboard */}
                    <Route path="/" element={<Dashboard socket={socket} />} />
                    
                    {/* Detailed Tool Views */}
                    <Route path="/multimeter" element={<Multimeter socket={socket} />} />
                    <Route path="/function-gen" element={<FunctionGen socket={socket} />} />
                    <Route path="/voltage-reg" element={<VoltageReg socket={socket} />} />
                    
                    {/* New Data Logging View */}
                    <Route path="/sessions" element={<PastSessions />} />
                    
                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}