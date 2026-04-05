import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { Play, Pause, Circle, Square, Zap, Thermometer, Activity, Settings, Wifi, WifiOff, Sparkles, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai'; 

export default function Dashboard({ socket }) {
    const [reading, setReading] = useState('0.00');
    const [mode, setMode] = useState('V');
    const [temp, setTemp] = useState('--');
    const [boost, setBoost] = useState('--');
    const [isConnected, setIsConnected] = useState(false);
    
    const [chartData, setChartData] = useState([]);
    const [isFrozen, setIsFrozen] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [triggerLevel, setTriggerLevel] = useState(2.5);
    
    const [freq, setFreq] = useState(100);
    const [vOut, setVOut] = useState(0);

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

    const analyzeHardware = async () => {
        setIsAnalyzing(true);
        setAiAnalysis("Extracting 15-second telemetry buffer and consulting AI...");
        triggerHaptic();
        
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing API Key");

            const ai = new GoogleGenAI({ apiKey: apiKey });

            const currentTime = Date.now();
            const fifteenSecondsAgo = currentTime - 15000; 
            const recentData = chartData.filter(d => d.t >= fifteenSecondsAgo);
            const voltageArray = recentData.map(d => d.v.toFixed(2));

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
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Main Readout Card */}
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center relative shadow-xl dark:shadow-2xl overflow-hidden group transition-colors duration-300">
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] transition-colors duration-1000 opacity-30 dark:opacity-20 ${mode === 'A' ? 'bg-blue-400 dark:bg-blue-500' : 'bg-emerald-400 dark:bg-emerald-500'}`} />
                    
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        {isConnected ? <Wifi size={12} className="text-emerald-500 animate-pulse" /> : <WifiOff size={12} className="text-red-500" />}
                        <span className={`text-[10px] uppercase font-black tracking-widest ${isConnected ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                            {isConnected ? 'Linked' : 'Offline'}
                        </span>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                        {['V', 'A', 'D'].map((m) => (
                            <button key={m} onClick={() => sendCmd(`#MODE:T=${m};`)}
                                className={`px-2 py-1 rounded text-[9px] font-bold transition-all border ${mode === m ? 'bg-emerald-100 dark:bg-emerald-500 border-emerald-200 dark:border-emerald-500 text-emerald-800 dark:text-black' : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300'}`}>
                                {m}
                            </button>
                        ))}
                    </div>

                    <h1 className={`text-8xl font-mono font-black tracking-tighter transition-all duration-300 relative z-10 ${mode === 'A' ? 'text-blue-500 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {reading}
                    </h1>
                    <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-4 relative z-10">
                        {mode === 'A' ? 'Amperes (I)' : 'Volts (DC)'}
                    </span>
                </div>

                {/* Health Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-4 rounded-xl flex items-center gap-4 hover:border-red-300 dark:hover:border-red-500/30 transition-colors shadow-sm dark:shadow-none">
                        <Thermometer size={18} className={parseFloat(temp) > 50 ? "text-red-500 animate-bounce" : "text-slate-400 dark:text-gray-500"}/>
                        <div>
                            <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-tighter">Thermal</p>
                            <p className="font-mono font-bold text-sm text-slate-800 dark:text-gray-200">{temp}°C</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-4 rounded-xl flex items-center gap-4 hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors shadow-sm dark:shadow-none">
                        <Zap size={18} className="text-amber-500"/>
                        <div>
                            <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-tighter">V-Boost</p>
                            <p className="font-mono font-bold text-sm text-amber-600 dark:text-amber-500">{boost}V</p>
                        </div>
                    </div>
                </div>

                {/* Control Deck */}
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-6 rounded-2xl space-y-6 shadow-sm dark:shadow-inner transition-colors duration-300">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2"><Settings size={14}/> Control Deck</h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                <span className="text-slate-500 dark:text-gray-400">Frequency</span>
                                <span className="text-emerald-600 dark:text-emerald-500 font-mono">{freq} Hz</span>
                            </div>
                            <input type="range" min="0" max="1000" value={freq} 
                                onChange={(e) => setFreq(e.target.value)} 
                                onMouseUp={() => sendCmd(`#WAVE:F=${freq};`)}
                                onTouchEnd={() => sendCmd(`#WAVE:F=${freq};`)}
                                className="w-full h-1.5 bg-slate-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                <span className="text-slate-500 dark:text-gray-400">Regulator</span>
                                <span className="text-blue-500 dark:text-blue-500 font-mono">{vOut} V</span>
                            </div>
                            <input type="range" min="0" max="12" step="0.1" value={vOut} 
                                onChange={(e) => setVOut(e.target.value)} 
                                onMouseUp={() => sendCmd(`#VREG:V=${vOut};`)}
                                onTouchEnd={() => sendCmd(`#VREG:V=${vOut};`)}
                                className="w-full h-1.5 bg-slate-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: OSCILLOSCOPE */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Oscilloscope Monitor Card */}
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-xl dark:shadow-2xl min-h-[450px] transition-colors duration-300">
                    <div className="p-4 bg-slate-50 dark:bg-[#1c2128] border-b border-slate-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-4 transition-colors">
                        <div className="flex items-center gap-4">
                            <Activity size={16} className="text-emerald-500" />
                            <h3 className="text-[10px] font-black text-slate-800 dark:text-gray-300 uppercase tracking-[0.2em]">Oscilloscope Monitor</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            
                            <button onClick={analyzeHardware} disabled={isAnalyzing || chartData.length === 0}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-2 ${
                                    isAnalyzing ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500 text-purple-600 dark:text-purple-400 animate-pulse' : 'bg-white dark:bg-[#0d1117] border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                                <Sparkles size={12} />
                                {isAnalyzing ? 'Analyzing...' : 'AI Diagnose'}
                            </button>

                            <button onClick={toggleRecording} title="Record Session"
                                className={`p-2 rounded-xl transition-all border ${isLogging ? 'bg-red-500 border-red-600 dark:border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-500/50 hover:text-red-500'}`}>
                                {isLogging ? <Square size={16} fill="white" /> : <Circle size={16} fill="currentColor" />}
                            </button>

                            <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-[#0d1117] px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-inner text-[10px] font-bold">
                                <span className="text-slate-400 dark:text-gray-500 uppercase tracking-widest">Trig</span>
                                <input type="range" min="0" max="12" step="0.1" value={triggerLevel} onChange={(e) => setTriggerLevel(parseFloat(e.target.value))} className="w-20 accent-amber-500" />
                                <span className="text-amber-500 font-mono w-8">{triggerLevel}V</span>
                            </div>

                            <button onClick={() => setIsFrozen(!isFrozen)} 
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-2 ${
                                    isFrozen ? 'bg-amber-400 dark:bg-amber-500 border-amber-500 dark:border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-500'
                                }`}>
                                {isFrozen ? <Play size={12} fill="black" /> : <Pause size={12} />}
                                {isFrozen ? 'Live' : 'Freeze'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 bg-slate-50 dark:bg-[#0d1117] relative min-h-[300px] transition-colors">
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                                <XAxis dataKey="t" hide />
                                <YAxis 
                                    domain={[0, mode === 'A' ? 'auto' : 15]} 
                                    stroke="#64748b" 
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
                                    stroke={mode === 'A' ? '#3b82f6' : '#10b981'} 
                                    strokeWidth={3} 
                                    dot={false} 
                                    isAnimationActive={false} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI System Diagnosis Panel */}
                {aiAnalysis && (
                    <div className="bg-purple-50 dark:bg-[#161b22] border border-purple-200 dark:border-purple-500/30 p-6 rounded-2xl shadow-lg dark:shadow-[0_0_30px_rgba(168,85,247,0.05)] text-sm font-mono text-purple-900 dark:text-purple-200 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 relative transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={16} className="animate-pulse" /> 
                                AI Diagnostic Report
                            </span>
                            <button onClick={() => setAiAnalysis("")} className="p-1 rounded-lg bg-white dark:bg-[#0d1117] text-slate-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-white transition-colors border border-purple-200 dark:border-gray-800">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="bg-white dark:bg-[#0d1117] p-4 rounded-xl border border-purple-100 dark:border-gray-800 text-slate-700 dark:text-gray-300 transition-colors">
                            {aiAnalysis}
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
}