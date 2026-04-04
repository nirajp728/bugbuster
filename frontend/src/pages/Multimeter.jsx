import { useState, useEffect } from 'react';

export default function Multimeter({ socket }) {
    const [mode, setMode] = useState('V');
    const [range, setRange] = useState('12');
    const [reading, setReading] = useState('---');

    useEffect(() => {
        socket.on('stm32-data', (msg) => {
            if (msg.kind === 'DATA') {
                setReading(msg.fields.X || '0.00');
            }
        });
        return () => socket.off('stm32-data');
    }, [socket]);

    const handleSend = () => {
        socket.emit('send-command', `#MODE:T=${mode};`);
        if (mode === 'V' || mode === 'D') {
            socket.emit('send-command', `#RANGE:V=${range};`);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-300 md:hidden mb-4">Multimeter</h2>
            
            {/* Top Row: Controls & Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Controls Card */}
                <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider mb-4 uppercase">Controls</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Mode</label>
                                <select value={mode} onChange={(e) => setMode(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-gray-700 text-white p-2.5 rounded-lg focus:border-emerald-500 outline-none transition-colors">
                                    <option value="V">Voltmeter (V)</option>
                                    <option value="A">Ammeter (A)</option>
                                    <option value="D">DSO (D)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Range</label>
                                <select value={range} onChange={(e) => setRange(e.target.value)} disabled={mode === 'A'}
                                    className="w-full bg-[#0d1117] border border-gray-700 text-white p-2.5 rounded-lg focus:border-emerald-500 outline-none disabled:opacity-50 transition-colors">
                                    <option value="12">12 V</option>
                                    <option value="16">16 V</option>
                                    <option value="24">24 V</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSend} 
                        className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2">
                        <span>▶</span> SEND
                    </button>
                </div>

                {/* Big Display Card */}
                <div className="lg:col-span-2 bg-[#161b22] border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center min-h-[250px]">
                    <div className="text-center">
                        <div className={`text-6xl md:text-8xl font-mono font-bold tracking-widest ${mode === 'A' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {reading}
                        </div>
                        <div className="text-gray-500 text-lg md:text-xl mt-4 font-light uppercase tracking-widest">
                            {mode === 'A' ? 'Amperes (A)' : 'Volts (V)'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">DSO Waveform</h3>
                    <div className="flex gap-4 text-amber-500 text-sm font-mono">
                        <span>Vrms: 11.865 V</span>
                        <span>Vpp: 12.660 V</span>
                    </div>
                </div>
                {/* Your Chart Component Goes Here */}
                <div className="h-64 w-full bg-[#0d1117] border border-gray-800 rounded-lg flex items-center justify-center text-gray-600">
                    [ Chart Canvas ]
                </div>
            </div>
        </div>
    );
}