import { useState } from 'react';

export default function FunctionGen({ socket }) {
    const [wave, setWave] = useState('SQ');
    const [freq, setFreq] = useState(100);

    const handleSend = () => {
        socket.emit('send-command', `#WAVE:T=${wave};`);
        socket.emit('send-command', `#WAVE:F=${freq};`);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-300 md:hidden mb-4">Function Gen</h2>
            
            <div className="bg-[#161b22] border border-gray-800 p-6 md:p-8 rounded-xl shadow-lg">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider mb-6 uppercase">Waveform Settings</h3>
                
                <div className="space-y-8">
                    {/* Wave Type */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Waveform Type</label>
                        <select value={wave} onChange={(e) => setWave(e.target.value)}
                            className="w-full md:w-1/2 bg-[#0d1117] border border-gray-700 text-white p-3 rounded-lg focus:border-emerald-500 outline-none">
                            <option value="SQ">Square</option>
                            <option value="TR">Triangle</option>
                            <option value="PA">Parabola</option>
                            <option value="G">Ground</option>
                        </select>
                    </div>

                    {/* Frequency Slider */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm text-gray-400">Frequency (Hz)</label>
                            <input 
                                type="number" 
                                value={freq} 
                                onChange={(e) => setFreq(Number(e.target.value))}
                                className="w-24 bg-[#0d1117] border border-gray-700 text-emerald-400 text-right p-2 rounded-lg font-mono outline-none focus:border-emerald-500"
                                min="0" max="1000"
                            />
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1000" 
                            value={freq} 
                            onChange={(e) => setFreq(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <button onClick={handleSend} 
                        className="w-full md:w-auto md:px-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                        <span>▶</span> SEND CONFIG
                    </button>
                </div>
            </div>
        </div>
    );
}