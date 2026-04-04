import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Play, Pause, Circle, Square, Zap, Thermometer, Activity, Settings, Wifi, WifiOff } from 'lucide-react';
import STM32Model from '../components/STM32Model'; 

export default function Dashboard({ socket }) {
    const [reading, setReading] = useState('0.00');
    const [mode, setMode] = useState('V');
    const [temp, setTemp] = useState('--');
    const [boost, setBoost] = useState('--');
    const [isConnected, setIsConnected] = useState(false);
    
    // Oscilloscope & Recording States
    const [chartData, setChartData] = useState([]);
    const [isFrozen, setIsFrozen] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [triggerLevel, setTriggerLevel] = useState(2.5);
    
    const [freq, setFreq] = useState(100);
    const [vOut, setVOut] = useState(0);

    // 3D & Haptic States
    const [isSending, setIsSending] = useState(false);
    const lastVibrate = useRef(0);

    useEffect(() => {
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('serial-status', (status) => setIsConnected(status.connected));
        socket.on('recording-status', (status) => setIsLogging(status.active));

        socket.on('stm32-data', (msg) => {
            if (msg.kind === 'TEMP') setTemp(msg.fields.T);
            if (msg.kind === 'BOOST') setBoost(msg.fields.V);
            if (msg.kind === 'DATA') {
                const val = parseFloat(msg.fields.X || 0);
                setMode(msg.fields.M); 

                if (!isFrozen) {
                    setReading(val.toFixed(2));
                    setChartData(prev => [...prev, { t: Date.now(), v: val }].slice(-60));
                }
            }
        });

        return () => {
            socket.off('stm32-data');
            socket.off('serial-status');
            socket.off('recording-status');
        };
    }, [socket, isFrozen]);

    const triggerHaptic = () => {
        const now = Date.now();
        if (now - lastVibrate.current > 100 && window.navigator.vibrate) {
            window.navigator.vibrate(40);
            lastVibrate.current = now;
        }
    };

    const sendCmd = (cmd) => {
        triggerHaptic();
        setIsSending(true); 
        socket.emit('send-command', cmd);
        setTimeout(() => setIsSending(false), 600); 
    };

    const toggleRecording = () => {
        triggerHaptic();
        if (!isLogging) {
            socket.emit('start-recording', 'default_user'); 
        } else {
            socket.emit('stop-recording');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 lg:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* LEFT COLUMN: 3D MODEL & TELEMETRY */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* 3D DIGITAL TWIN STAGE */}
                <div className="h-64 w-full bg-[#0d1117] rounded-2xl border border-gray-800 relative overflow-hidden shadow-inner group">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-[#161b22] px-2 py-1 rounded border border-gray-800">
                            Digital Twin v1.0
                        </span>
                    </div>

                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">Initializing GPU...</div>}>
                        <Canvas camera={{ position: [0, 5, 10], fov: 35 }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} />
                            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
                            
                            <STM32Model temp={parseFloat(temp) || 25} isSending={isSending} />
                            
                            <gridHelper args={[20, 40, '#1f2937', '#111827']} position={[0, -2, 0]} />
                        </Canvas>
                    </Suspense>
                </div>

                {/* Main Readout Card */}
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden group">
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] transition-colors duration-1000 opacity-20 ${mode === 'A' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        {isConnected ? <Wifi size={12} className="text-emerald-500 animate-pulse" /> : <WifiOff size={12} className="text-red-500" />}
                        <span className={`text-[10px] uppercase font-black tracking-widest ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isConnected ? 'Linked' : 'Offline'}
                        </span>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                        {['V', 'A', 'D'].map((m) => (
                            <button key={m} onClick={() => sendCmd(`#MODE:T=${m};`)}
                                className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${mode === m ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                                {m}
                            </button>
                        ))}
                    </div>

                    <h1 className={`text-7xl font-mono font-black tracking-tighter transition-all duration-300 relative z-10 ${mode === 'A' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {reading}
                    </h1>
                    <span className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[9px] mt-2 relative z-10">
                        {mode === 'A' ? 'Amperes (I)' : 'Volts (DC)'}
                    </span>
                </div>

                {/* Health & Controls (Condensed) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl flex items-center gap-4">
                        <Thermometer size={18} className={parseFloat(temp) > 50 ? "text-red-500 animate-bounce" : "text-gray-500"}/>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black">Thermal</p>
                            <p className="font-mono font-bold text-sm text-gray-200">{temp}°C</p>
                        </div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl flex items-center gap-4">
                        <Zap size={18} className="text-amber-500"/>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black">V-Boost</p>
                            <p className="font-mono font-bold text-sm text-amber-500">{boost}V</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl space-y-4 shadow-inner">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-gray-400">Freq</span>
                                <span className="text-emerald-500 font-mono">{freq} Hz</span>
                            </div>
                            <input type="range" min="0" max="1000" value={freq} 
                                onChange={(e) => setFreq(e.target.value)} 
                                onMouseUp={() => sendCmd(`#WAVE:F=${freq};`)}
                                onTouchEnd={() => sendCmd(`#WAVE:F=${freq};`)}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-gray-400">Reg</span>
                                <span className="text-blue-500 font-mono">{vOut} V</span>
                            </div>
                            <input type="range" min="0" max="12" step="0.1" value={vOut} 
                                onChange={(e) => setVOut(e.target.value)} 
                                onMouseUp={() => sendCmd(`#VREG:V=${vOut};`)}
                                onTouchEnd={() => sendCmd(`#VREG:V=${vOut};`)}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: OSCILLOSCOPE */}
            <div className="lg:col-span-8 bg-[#161b22] border border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl min-h-[500px]">
                <div className="p-4 bg-[#1c2128] border-b border-gray-800 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Activity size={16} className="text-emerald-500" />
                        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Oscilloscope Monitor</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleRecording} 
                            className={`p-2 rounded-xl transition-all border ${isLogging ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                            {isLogging ? <Square size={16} fill="white" /> : <Circle size={16} fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-3 bg-[#0d1117] px-4 py-2 rounded-xl border border-gray-700 shadow-inner text-[10px] font-bold">
                            <span className="text-gray-500 uppercase tracking-widest">Trig</span>
                            <input type="range" min="0" max="12" step="0.1" value={triggerLevel} onChange={(e) => setTriggerLevel(parseFloat(e.target.value))} className="w-20 accent-amber-500" />
                            <span className="text-amber-500 font-mono w-8">{triggerLevel}V</span>
                        </div>

                        <button onClick={() => setIsFrozen(!isFrozen)} 
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-2 ${
                                isFrozen ? 'bg-amber-500 border-amber-400 text-black' : 'bg-gray-800 border-gray-700 text-gray-400'
                            }`}>
                            {isFrozen ? <Play size={12} fill="black" /> : <Pause size={12} />}
                            {isFrozen ? 'Live' : 'Freeze'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6 bg-[#0d1117] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="t" hide />
                            <YAxis domain={[0, mode === 'A' ? 'auto' : 15]} stroke="#4b5563" fontSize={10} tickFormatter={(val) => `${val}${mode === 'A' ? 'A' : 'V'}`} />
                            <ReferenceLine y={triggerLevel} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: 'TRG', fill: '#f59e0b', fontSize: 9, fontWeight: 'bold' }} />
                            <Line type="monotone" dataKey="v" stroke={mode === 'A' ? '#60a5fa' : '#10b981'} strokeWidth={3} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}