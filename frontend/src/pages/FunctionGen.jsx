import { useState } from 'react';
import { Play } from 'lucide-react';

export default function FunctionGen({ socket }) {
    const [wave, setWave] = useState('SQ');
    const [freq, setFreq] = useState(100);

    const handleSend = () => {
        socket.emit('send-command', `#WAVE:T=${wave};`);
        socket.emit('send-command', `#WAVE:F=${freq};`);
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-300 md:hidden mb-4 transition-colors">Function Gen</h2>
            
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 p-6 md:p-8 rounded-2xl shadow-xl dark:shadow-2xl transition-colors duration-300">
                <h3 className="text-xs font-black text-slate-400 dark:text-gray-500 tracking-widest mb-8 uppercase transition-colors">Waveform Settings</h3>
                
                <div className="space-y-8">
                    {/* Wave Type */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-wide transition-colors">Waveform Type</label>
                        <select value={wave} onChange={(e) => setWave(e.target.value)}
                            className="w-full md:w-1/2 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white p-3 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer transition-colors font-semibold">
                            <option value="SQ">Square</option>
                            <option value="TR">Triangle</option>
                            <option value="PA">Parabola</option>
                            <option value="G">Ground</option>
                        </select>
                    </div>

                    {/* Frequency Slider */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide transition-colors">Frequency (Hz)</label>
                            <input 
                                type="number" 
                                value={freq} 
                                onChange={(e) => setFreq(Number(e.target.value))}
                                className="w-24 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 text-center p-2 rounded-lg font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                min="0" max="1000"
                            />
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1000" 
                            value={freq} 
                            onChange={(e) => setFreq(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-colors"
                        />
                    </div>

                    <button onClick={handleSend} 
                        className="w-full md:w-auto md:px-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 text-sm">
                        <Play size={16} fill="currentColor"/> SEND CONFIG
                    </button>
                </div>
            </div>
        </div>
    );
}