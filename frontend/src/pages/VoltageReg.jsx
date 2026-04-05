import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

export default function VoltageReg({ socket }) {
    const [vreg, setVreg] = useState(0.0);
    const [boostOut, setBoostOut] = useState('--');
    const [temp, setTemp] = useState('--');

    useEffect(() => {
        const handleData = (msg) => {
            if (msg.kind === 'BOOST') setBoostOut(msg.fields.V || '--');
            if (msg.kind === 'TEMP') setTemp(msg.fields.T || '--');
        };

        socket.on('stm32-data', handleData);
        return () => socket.off('stm32-data', handleData);
    }, [socket]);

    const handleSend = () => {
        socket.emit('send-command', `#VREG:V=${vreg.toFixed(1)};`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-300 md:hidden mb-4 transition-colors">Voltage Reg</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SET VOLTAGE CARD */}
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-6 md:p-8 rounded-3xl shadow-xl dark:shadow-2xl transition-colors duration-300">
                    <h3 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-10 transition-colors">Output Voltage</h3>
                    
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide transition-colors">Set Voltage (0 - 12 V)</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 transition-colors">
                                    <input 
                                        type="number" 
                                        value={vreg} 
                                        onChange={(e) => setVreg(Number(e.target.value))}
                                        className="w-16 bg-transparent text-emerald-600 dark:text-emerald-400 text-right font-mono font-bold text-lg outline-none appearance-none"
                                        min="0" max="12" step="0.1"
                                    />
                                    <span className="text-slate-400 dark:text-gray-500 font-bold text-xs">V</span>
                                </div>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="12" step="0.1"
                                value={vreg} 
                                onChange={(e) => setVreg(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-colors"
                            />
                        </div>

                        <button onClick={handleSend} 
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm mt-8">
                            <Play size={16} fill="white" /> SET VOLTAGE
                        </button>
                    </div>
                </div>

                {/* LIVE FEEDBACK CARD */}
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-6 md:p-8 rounded-3xl shadow-xl dark:shadow-2xl transition-colors duration-300">
                    <h3 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-8 transition-colors">Live Feedback</h3>
                    
                    <div className="space-y-6">
                        {/* Boost Output Card */}
                        <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 p-6 rounded-2xl flex justify-between items-center transition-colors shadow-sm dark:shadow-none">
                            <span className="text-slate-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wide">Boost Output</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-amber-500 font-mono font-black text-3xl tracking-tighter">{boostOut}</span>
                                <span className="text-amber-600 dark:text-amber-500 font-bold text-sm">V</span>
                            </div>
                        </div>

                        {/* Temperature Card */}
                        <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 p-6 rounded-2xl flex justify-between items-center transition-colors shadow-sm dark:shadow-none">
                            <span className="text-slate-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wide">System Temp</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-red-500 font-mono font-black text-3xl tracking-tighter">{temp}</span>
                                <span className="text-red-600 dark:text-red-500 font-bold text-sm">°C</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}