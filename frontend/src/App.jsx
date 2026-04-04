import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Multimeter from './pages/Multimeter';
import FunctionGen from './pages/FunctionGen';
import VoltageReg from './pages/VoltageReg';
import Connection from './pages/Connection';

// Create a global socket instance
const API_URL = import.meta.env.VITE_BACKEND_URL;
export const socket = io(`${API_URL}`);

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));

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
                    <Route path="/" element={<Multimeter socket={socket} />} />
                    <Route path="/function-gen" element={<FunctionGen socket={socket} />} />
                    <Route path="/voltage-reg" element={<VoltageReg socket={socket} />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}