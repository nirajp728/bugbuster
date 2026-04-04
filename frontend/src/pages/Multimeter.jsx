import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, CartesianGrid, Tooltip } from 'recharts';
import { Play, Pause, Circle, Square, Zap, ChevronDown } from 'lucide-react';

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
                // If value crosses the trigger level upwards, update the display
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
        <div className="space-y-6 pb-10">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-100">Lab Terminal</h2>
                <div className="flex gap-2">
                    {isLogging && (
                        <button onClick={exportToCSV} className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md hover:bg-emerald-500 hover:text-white transition-all">
                            Export CSV
                        </button>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls Card */}
                <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
                            <Zap size={14}/> Input Config
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-2 uppercase">Function Mode</label>
                                <select value={mode} onChange={(e) => setMode(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-gray-700 text-white p-3 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                                    <option value="V">Voltmeter (V)</option>
                                    <option value="A">Ammeter (A)</option>
                                    <option value="D">DSO (D)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-2 uppercase">Voltage Range</label>
                                <select value={range} onChange={(e) => setRange(e.target.value)} disabled={mode === 'A'}
                                    className="w-full bg-[#0d1117] border border-gray-700 text-white p-3 rounded-lg disabled:opacity-30 appearance-none cursor-pointer">
                                    <option value="12">12 V Max</option>
                                    <option value="16">16 V Max</option>
                                    <option value="24">24 V Max</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSend} 
                        className="mt-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2">
                        <Play size={18} fill="currentColor"/> UPDATE HARDWARE
                    </button>
                </div>

                {/* Big Display Card */}
                <div className="lg:col-span-2 bg-[#161b22] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20">
                        <div className="h-full bg-emerald-500 animate-pulse" style={{width: '100%'}}></div>
                    </div>
                    <div className="text-center z-10">
                        <div className={`text-7xl md:text-9xl font-mono font-bold tracking-tighter transition-all ${mode === 'A' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {reading}
                        </div>
                        <div className="text-gray-500 text-sm md:text-base mt-4 font-bold uppercase tracking-[0.3em]">
                            Current {mode === 'A' ? 'Amperage' : 'Voltage'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Tool Area */}
            <div className="bg-[#161b22] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex flex-wrap justify-between items-center gap-4 bg-[#1c2128]">
                    <div className="flex items-center gap-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Waveform Monitor</h3>
                        <div className="flex gap-4">
                           <div className="flex flex-col">
                               <span className="text-[10px] text-gray-500 uppercase font-bold">Vrms</span>
                               <span className="text-amber-500 font-mono text-sm">11.86 V</span>
                           </div>
                           <div className="flex flex-col">
                               <span className="text-[10px] text-gray-500 uppercase font-bold">Vpp</span>
                               <span className="text-amber-500 font-mono text-sm">12.66 V</span>
                           </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Trigger Slider */}
                        <div className="hidden sm:flex items-center gap-3 bg-[#0d1117] px-3 py-2 rounded-lg border border-gray-700">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Trigger</span>
                            <input type="range" min="0" max="12" step="0.1" 
                                value={triggerLevel} onChange={(e) => setTriggerLevel(parseFloat(e.target.value))}
                                className="w-20 accent-emerald-500"
                            />
                            <span className="text-emerald-500 font-mono text-xs w-8">{triggerLevel}V</span>
                        </div>

                        {/* Freeze Button */}
                        <button onClick={() => setIsFrozen(!isFrozen)} 
                            className={`p-2 rounded-lg transition-all border ${isFrozen ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                            {isFrozen ? <Play size={20}/> : <Pause size={20}/>}
                        </button>

                        {/* Record Button */}
                        <button onClick={() => setIsLogging(!isLogging)} 
                            className={`p-2 rounded-lg transition-all border ${isLogging ? 'bg-red-500 border-red-600 text-white animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                            {isLogging ? <Square size={20} fill="currentColor"/> : <Circle size={20} fill="currentColor"/>}
                        </button>
                    </div>
                </div>

                {/* Chart Content */}
                <div className="h-72 w-full p-4 bg-[#0d1117]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[0, parseInt(range) || 12]} stroke="#4b5563" fontSize={12} tickFormatter={(val) => `${val}V`} />
                            <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #374151' }} labelStyle={{ display: 'none' }} />
                            <Line 
                                type="monotone" 
                                dataKey="val" 
                                stroke={mode === 'A' ? '#60a5fa' : '#10b981'} 
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