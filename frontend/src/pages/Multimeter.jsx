import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Play, Pause, Circle, Square, Zap, Activity } from 'lucide-react';

export default function Multimeter({ socket }) {
    const [mode, setMode] = useState('V');
    const [range, setRange] = useState('12');
    const [reading, setReading] = useState('---');
    
    // Advanced Oscilloscope States
    const [isFrozen, setIsFrozen] = useState(false);
    const [triggerLevel, setTriggerLevel] = useState(2.5);
    const [chartData, setChartData] = useState([]);
    
    // Logging States
    const [isLogging, setIsLogging] = useState(false);
    const [sessionData, setSessionData] = useState([]);

    const lastValue = useRef(0);

    useEffect(() => {
        socket.on('stm32-data', (msg) => {
            if (msg.kind === 'DATA') {
                const val = parseFloat(msg.fields.X || 0);

                // 1. Data Logging Logic
                if (isLogging) {
                    setSessionData(prev => [...prev, { 
                        timestamp: new Date().toLocaleTimeString(), 
                        value: val,
                        mode: msg.fields.M 
                    }]);
                }

                // 2. Oscilloscope Freeze Logic
                if (isFrozen) return;

                // 3. Simple Trigger Logic
                if (lastValue.current < triggerLevel && val >= triggerLevel) {
                    setReading(val.toFixed(2));
                } else if (triggerLevel === 0) { // Auto-mode if trigger is at bottom
                    setReading(val.toFixed(2));
                }

                // 4. Update Chart Buffer (Keep last 50 points)
                setChartData(prev => {
                    const newData = [...prev, { time: Date.now(), val }];
                    return newData.slice(-50);
                });

                lastValue.current = val;
            }
        });

        return () => socket.off('stm32-data');
    }, [socket, isFrozen, triggerLevel, isLogging]);

    const handleSend = () => {
        socket.emit('send-command', `#MODE:T=${mode};`);
        if (mode === 'V' || mode === 'D') {
            socket.emit('send-command', `#RANGE:V=${range};`);
        }
    };

    const exportToCSV = () => {
        const headers = "Timestamp,Value,Mode\n";
        const csv = sessionData.map(row => `${row.timestamp},${row.value},${row.mode}`).join("\n");
        const blob = new Blob([headers + csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment_${new Date().getTime()}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                {/* CACHE BUSTER: Changed title slightly to Multimeter Terminal */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100 transition-colors">Multimeter Terminal</h2>
                <div className="flex gap-2">
                    {isLogging && (
                        <button onClick={exportToCSV} className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1 rounded-md hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-sm">
                            Export CSV
                        </button>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls Card */}
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-6 rounded-2xl shadow-xl dark:shadow-2xl flex flex-col justify-between transition-colors duration-300">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 tracking-widest uppercase flex items-center gap-2">
                            <Zap size={14}/> Input Config
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Function Mode</label>
                                <select value={mode} onChange={(e) => setMode(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white p-3 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer transition-colors text-sm font-semibold">
                                    <option value="V">Voltmeter (V)</option>
                                    <option value="A">Ammeter (A)</option>
                                    <option value="D">DSO (D)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Voltage Range</label>
                                <select value={range} onChange={(e) => setRange(e.target.value)} disabled={mode === 'A'}
                                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white p-3 rounded-lg disabled:opacity-50 appearance-none cursor-pointer transition-colors text-sm font-semibold">
                                    <option value="12">12 V Max</option>
                                    <option value="16">16 V Max</option>
                                    <option value="24">24 V Max</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSend} 
                        className="mt-8 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 text-sm">
                        <Play size={16} fill="currentColor"/> UPDATE HARDWARE
                    </button>
                </div>

                {/* Big Display Card */}
                <div className="lg:col-span-2 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-6 rounded-2xl shadow-xl dark:shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-100 dark:bg-emerald-500/20">
                        <div className="h-full bg-emerald-400 dark:bg-emerald-500 animate-pulse" style={{width: '100%'}}></div>
                    </div>
                    <div className="text-center z-10">
                        <div className={`text-8xl md:text-9xl font-mono font-black tracking-tighter transition-all ${mode === 'A' ? 'text-blue-500 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {reading}
                        </div>
                        <div className="text-slate-400 dark:text-gray-500 text-xs mt-4 font-bold uppercase tracking-[0.3em]">
                            Current {mode === 'A' ? 'Amperage' : 'Voltage'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Tool Area */}
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden transition-colors duration-300">
                <div className="p-4 border-b border-slate-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50 dark:bg-[#1c2128] transition-colors">
                    <div className="flex items-center gap-6">
                        <h3 className="text-[10px] font-black text-slate-800 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                           <Activity size={16} className="text-emerald-500" /> Waveform Monitor
                        </h3>
                        <div className="hidden sm:flex gap-4">
                           <div className="flex flex-col">
                               <span className="text-[8px] text-slate-400 dark:text-gray-500 uppercase font-bold">Vrms</span>
                               <span className="text-amber-600 dark:text-amber-500 font-mono text-xs font-bold">11.86 V</span>
                           </div>
                           <div className="flex flex-col">
                               <span className="text-[8px] text-slate-400 dark:text-gray-500 uppercase font-bold">Vpp</span>
                               <span className="text-amber-600 dark:text-amber-500 font-mono text-xs font-bold">12.66 V</span>
                           </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Trigger Slider */}
                        <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-[#0d1117] px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-inner transition-colors">
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-widest">Trigger</span>
                            <input type="range" min="0" max="12" step="0.1" 
                                value={triggerLevel} onChange={(e) => setTriggerLevel(parseFloat(e.target.value))}
                                className="w-20 accent-emerald-500"
                            />
                            <span className="text-emerald-600 dark:text-emerald-500 font-mono text-xs w-8 font-bold">{triggerLevel}V</span>
                        </div>

                        {/* Freeze Button */}
                        <button onClick={() => setIsFrozen(!isFrozen)} 
                            className={`p-2 rounded-xl transition-all border ${isFrozen ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500 text-amber-600 dark:text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-500/50'}`}>
                            {isFrozen ? <Play size={16}/> : <Pause size={16}/>}
                        </button>

                        {/* Record Button */}
                        <button onClick={() => setIsLogging(!isLogging)} 
                            className={`p-2 rounded-xl transition-all border ${isLogging ? 'bg-red-500 border-red-600 dark:border-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/50'}`}>
                            {isLogging ? <Square size={16} fill="currentColor"/> : <Circle size={16} fill="currentColor"/>}
                        </button>
                    </div>
                </div>

                {/* Chart Content */}
                <div className="h-72 w-full p-6 bg-slate-50 dark:bg-[#0d1117] transition-colors">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[0, parseInt(range) || 12]} stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}V`} />
                            <ReferenceLine y={triggerLevel} stroke="#f59e0b" strokeDasharray="3 3" />
                            <Line 
                                type="monotone" 
                                dataKey="val" 
                                stroke={mode === 'A' ? '#3b82f6' : '#10b981'} 
                                strokeWidth={2} 
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