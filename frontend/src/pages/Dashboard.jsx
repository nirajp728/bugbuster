import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Play, Pause, Circle, Square, Zap, Thermometer, Activity, Sliders, Settings, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard({ socket }) {
    const [reading, setReading] = useState('0.00');
    const [mode, setMode] = useState('V');
    const [temp, setTemp] = useState('--');
    const [boost, setBoost] = useState('--');
    const [isConnected, setIsConnected] = useState(false);
    
    const [chartData, setChartData] = useState([]);
    const [isFrozen, setIsFrozen] = useState(false);
    const [triggerLevel, setTriggerLevel] = useState(2.5);
    
    const [freq, setFreq] = useState(100);
    const [vOut, setVOut] = useState(0);

    useEffect(() => {
        // Track connection status
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('serial-status', (status) => setIsConnected(status.connected));

        socket.on('stm32-data', (msg) => {
            if (msg.kind === 'TEMP') setTemp(msg.fields.T);
            if (msg.kind === 'BOOST') setBoost(msg.fields.V);
            
            if (msg.kind === 'DATA') {
                const val = parseFloat(msg.fields.X || 0);
                setMode(msg.fields.M); // Sync mode from hardware

                if (!isFrozen) {
                    setReading(val.toFixed(2));
                    setChartData(prev => [...prev, { t: Date.now(), v: val }].slice(-60));
                }
            }
        });

        return () => {
            socket.off('stm32-data');
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [socket, isFrozen]);

    // Enhanced Send Command with Haptic Feedback
    const sendCmd = (cmd) => {
        if (window.navigator.vibrate) window.navigator.vibrate(50); 
        socket.emit('send-command', cmd);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 lg:pb-8 animate-in fade-in duration-500">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Main Readout Card */}
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
                    {/* Background Glow Effect */}
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20 ${mode === 'A' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        {isConnected ? (
                            <Wifi size={12} className="text-emerald-500" />
                        ) : (
                            <WifiOff size={12} className="text-red-500" />
                        )}
                        <span className={`text-[10px] uppercase font-black tracking-widest ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isConnected ? 'Hardware Linked' : 'Offline'}
                        </span>
                    </div>

                    <h1 className={`text-8xl font-mono font-black tracking-tighter transition-colors duration-300 ${mode === 'A' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {reading}
                    </h1>
                    <span className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">
                        {mode === 'A' ? 'Amperes (I)' : 'Volts (DC)'}
                    </span>
                </div>

                {/* System Health stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl flex items-center gap-4 group hover:border-red-500/50 transition-colors">
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-500 group-hover:scale-110 transition-transform"><Thermometer size={18}/></div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black">System Heat</p>
                            <p className={`font-mono font-bold text-sm ${parseFloat(temp) > 60 ? 'text-red-500 animate-pulse' : 'text-gray-200'}`}>{temp}°C</p>
                        </div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl flex items-center gap-4 group hover:border-amber-500/50 transition-colors">
                        <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 group-hover:scale-110 transition-transform"><Zap size={18}/></div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black">Boost Rail</p>
                            <p className="font-mono font-bold text-sm text-amber-500">{boost}V</p>
                        </div>
                    </div>
                </div>

                {/* Remote Controls */}
                <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl space-y-6 shadow-inner">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Settings size={14}/> Control Deck</h3>
                        <button onClick={() => sendCmd('#MODE:T=G;')} className="text-[9px] text-gray-600 hover:text-red-400 uppercase font-bold transition-colors">Emergency GND</button>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">Frequency Output</label>
                                <span className="text-emerald-500 font-mono text-xs">{freq} Hz</span>
                            </div>
                            <input type="range" min="0" max="1000" value={freq} 
                                onChange={(e) => setFreq(e.target.value)} 
                                onMouseUp={() => sendCmd(`#WAVE:F=${freq};`)}
                                onTouchEnd={() => sendCmd(`#WAVE:F=${freq};`)}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] text-gray-400 uppercase font-bold">V-Regulator</label>
                                <span className="text-blue-500 font-mono text-xs">{vOut} V</span>
                            </div>
                            <input type="range" min="0" max="12" step="0.1" value={vOut} 
                                onChange={(e) => setVOut(e.target.value)} 
                                onMouseUp={() => sendCmd(`#VREG:V=${vOut};`)}
                                onTouchEnd={() => sendCmd(`#VREG:V=${vOut};`)}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 bg-[#161b22] border border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl min-h-[500px]">
                
                {/* DSO Toolbar */}
                <div className="p-4 bg-[#1c2128] border-b border-gray-800 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Activity size={16} className="text-emerald-500" />
                        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Live Spectrum Analyzer</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-[#0d1117] px-4 py-2 rounded-xl border border-gray-700 shadow-inner">
                            <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Trig</span>
                            <input type="range" min="0" max="12" step="0.1" value={triggerLevel} onChange={(e) => setTriggerLevel(parseFloat(e.target.value))} className="w-20 accent-emerald-500" />
                            <span className="text-emerald-400 font-mono text-xs w-8">{triggerLevel}V</span>
                        </div>
                        <button onClick={() => setIsFrozen(!isFrozen)} 
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-2 ${
                                isFrozen ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}>
                            {isFrozen ? <Play size={12} fill="black" /> : <Pause size={12} />}
                            {isFrozen ? 'Resume' : 'Freeze'}
                        </button>
                    </div>
                </div>

                {/* Main Graph Area */}
                <div className="flex-1 p-6 bg-[#0d1117] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="t" hide />
                            {/* Auto-scaling Y-Axis for Ammeter mode */}
                            <YAxis 
                                domain={[0, mode === 'A' ? 'auto' : 15]} 
                                stroke="#4b5563" 
                                fontSize={10} 
                                tickFormatter={(val) => `${val}${mode === 'A' ? 'A' : 'V'}`} 
                            />
                            <ReferenceLine 
                                y={triggerLevel} 
                                stroke="#f59e0b" 
                                strokeDasharray="3 3" 
                                label={{ position: 'right', value: 'TRG', fill: '#f59e0b', fontSize: 9, fontWeight: 'bold' }} 
                            />
                            <Line 
                                type="monotone" 
                                dataKey="v" 
                                stroke={mode === 'A' ? '#60a5fa' : '#10b981'} 
                                strokeWidth={3} 
                                dot={false} 
                                isAnimationActive={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}