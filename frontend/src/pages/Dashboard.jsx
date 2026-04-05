import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { Play, Pause, Circle, Square, Zap, Thermometer, Activity, Settings, Wifi, WifiOff, Sparkles, X } from 'lucide-react';

// FIX 1: Import the brand new SDK
import { GoogleGenAI } from '@google/genai'; 

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

    // AI Inference States
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        socket.emit('send-command', cmd);
    };

    const toggleRecording = () => {
        triggerHaptic();
        if (!isLogging) {
            socket.emit('start-recording', 'default_user'); 
        } else {
            socket.emit('stop-recording');
        }
    };

    // --- UPDATED AI INFERENCE LOGIC ---
   // --- AI INFERENCE LOGIC (15-Second Window) ---
    const analyzeHardware = async () => {
        setIsAnalyzing(true);
        setAiAnalysis("Extracting 15-second telemetry buffer and consulting AI...");
        triggerHaptic();
        
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing API Key");

            const ai = new GoogleGenAI({ apiKey: apiKey });

            // 1. Calculate the 15-second window
            const currentTime = Date.now();
            const fifteenSecondsAgo = currentTime - 15000; // 15000 milliseconds

            // 2. Filter the chart data to ONLY include points from the last 15 seconds
            const recentData = chartData.filter(d => d.t >= fifteenSecondsAgo);
            
            // 3. Extract just the values
            const voltageArray = recentData.map(d => d.v.toFixed(2));

            // 4. The upgraded testbench prompt
            const prompt = `
            You are an expert embedded systems engineer monitoring an STM32-based digital testbench.
            Below is the telemetry data captured over the exact last 15 seconds.
            
            [Hardware State]
            - Active Mode: ${mode === 'A' ? 'Ammeter' : 'Voltmeter / DSO'}
            - System Temp: ${temp}°C
            - Function Gen Target: ${freq}Hz
            - V-Regulator Output: ${vOut}V
            
            [15-Second Telemetry Buffer (${voltageArray.length} samples)]
            [${voltageArray.join(', ')}]
            
            Analyze this 15-second diagnostic window. Identify any thermal risks (>60C), waveform instability, noise, or deviations from the target frequency/voltage. Provide a highly technical, professional 2-sentence diagnosis. Do not use markdown.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAiAnalysis(response.text);
            
        } catch (error) {
            console.error("AI Error:", error);
            setAiAnalysis("AI Diagnostic failed. Please ensure your VITE_GEMINI_API_KEY is correct and active.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 lg:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* LEFT COLUMN: TELEMETRY & CONTROLS */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Main Readout Card */}
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden group">
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

                    <h1 className={`text-8xl font-mono font-black tracking-tighter transition-all duration-300 relative z-10 ${mode === 'A' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {reading}
                    </h1>
                    <span className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-4 relative z-10">
                        {mode === 'A' ? 'Amperes (I)' : 'Volts (DC)'}
                    </span>
                </div>

                {/* Health Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl flex items-center gap-4 hover:border-red-500/30 transition-colors">
                        <Thermometer size={18} className={parseFloat(temp) > 50 ? "text-red-500 animate-bounce" : "text-gray-500"}/>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Thermal</p>
                            <p className="font-mono font-bold text-sm text-gray-200">{temp}°C</p>
                        </div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl flex items-center gap-4 hover:border-amber-500/30 transition-colors">
                        <Zap size={18} className="text-amber-500"/>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">V-Boost</p>
                            <p className="font-mono font-bold text-sm text-amber-500">{boost}V</p>
                        </div>
                    </div>
                </div>

                {/* Control Deck */}
                <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl space-y-6 shadow-inner">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Settings size={14}/> Control Deck</h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                <span className="text-gray-400">Frequency</span>
                                <span className="text-emerald-500 font-mono">{freq} Hz</span>
                            </div>
                            <input type="range" min="0" max="1000" value={freq} 
                                onChange={(e) => setFreq(e.target.value)} 
                                onMouseUp={() => sendCmd(`#WAVE:F=${freq};`)}
                                onTouchEnd={() => sendCmd(`#WAVE:F=${freq};`)}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                <span className="text-gray-400">Regulator</span>
                                <span className="text-blue-500 font-mono">{vOut} V</span>
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

            {/* RIGHT COLUMN: OSCILLOSCOPE & AI PANEL */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Oscilloscope Monitor Card */}
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl min-h-[450px]">
                    <div className="p-4 bg-[#1c2128] border-b border-gray-800 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Activity size={16} className="text-emerald-500" />
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Oscilloscope Monitor</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            
                            <button onClick={analyzeHardware} disabled={isAnalyzing || chartData.length === 0}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-2 ${
                                    isAnalyzing ? 'bg-purple-500/20 border-purple-500 text-purple-400 animate-pulse' : 'bg-[#0d1117] border-purple-500/30 text-purple-400 hover:border-purple-500 hover:bg-purple-500/10'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                                <Sparkles size={12} />
                                {isAnalyzing ? 'Analyzing...' : 'AI Diagnose'}
                            </button>

                            <button onClick={toggleRecording} title="Record Session"
                                className={`p-2 rounded-xl transition-all border ${isLogging ? 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#0d1117] border-gray-700 text-gray-400 hover:border-red-500/50'}`}>
                                {isLogging ? <Square size={16} fill="white" /> : <Circle size={16} fill="currentColor" />}
                            </button>

                            <div className="hidden sm:flex items-center gap-3 bg-[#0d1117] px-4 py-2 rounded-xl border border-gray-700 shadow-inner text-[10px] font-bold">
                                <span className="text-gray-500 uppercase tracking-widest">Trig</span>
                                <input type="range" min="0" max="12" step="0.1" value={triggerLevel} onChange={(e) => setTriggerLevel(parseFloat(e.target.value))} className="w-20 accent-amber-500" />
                                <span className="text-amber-500 font-mono w-8">{triggerLevel}V</span>
                            </div>

                            <button onClick={() => setIsFrozen(!isFrozen)} 
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-2 ${
                                    isFrozen ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-[#0d1117] border-gray-700 text-gray-400 hover:border-gray-500'
                                }`}>
                                {isFrozen ? <Play size={12} fill="black" /> : <Pause size={12} />}
                                {isFrozen ? 'Live' : 'Freeze'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 bg-[#0d1117] relative min-h-[300px]">
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="t" hide />
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

                {/* AI System Diagnosis Dedicated Panel */}
                {aiAnalysis && (
                    <div className="bg-[#161b22] border border-purple-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.05)] text-sm font-mono text-purple-200 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-purple-400 font-black uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={16} className="animate-pulse" /> 
                                AI Diagnostic Report
                            </span>
                            <button onClick={() => setAiAnalysis("")} className="p-1 rounded-lg bg-[#0d1117] text-gray-500 hover:text-white transition-colors border border-gray-800 hover:border-gray-600">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800 text-gray-300">
                            {aiAnalysis}
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
}