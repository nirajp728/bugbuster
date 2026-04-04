import { useState, useEffect } from 'react';

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
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-gray-300 md:hidden mb-4">Voltage Reg</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Control Panel */}
                <div className="bg-[#161b22] border border-gray-800 p-6 md:p-8 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider mb-6 uppercase">Output Voltage</h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm text-gray-400">Set Voltage (0 - 12 V)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={vreg} 
                                        onChange={(e) => setVreg(Number(e.target.value))}
                                        className="w-24 bg-[#0d1117] border border-gray-700 text-emerald-400 text-right p-2 pr-8 rounded-lg font-mono outline-none focus:border-emerald-500"
                                        min="0" max="12" step="0.1"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500 font-mono">V</span>
                                </div>
                            </div>
                            
                            <input 
                                type="range" 
                                min="0" max="12" step="0.1"
                                value={vreg} 
                                onChange={(e) => setVreg(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                    </div>

                    <button onClick={handleSend} 
                        className="mt-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                        <span>▶</span> SET VOLTAGE
                    </button>
                </div>

                {/* Live Feedback Panel */}
                <div className="bg-[#161b22] border border-gray-800 p-6 md:p-8 rounded-xl shadow-lg">
                    <h3 className="text-sm font-semibold text-gray-400 tracking-wider mb-6 uppercase">Live Feedback</h3>
                    
                    <div className="space-y-6">
                        {/* Boost Output Card */}
                        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-5 flex items-center justify-between">
                            <div className="text-gray-400 font-medium">Boost Output</div>
                            <div className="text-3xl font-mono font-bold text-amber-500 tracking-wider">
                                {boostOut} <span className="text-xl text-amber-700">V</span>
                            </div>
                        </div>

                        {/* Temperature Card */}
                        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-5 flex items-center justify-between">
                            <div className="text-gray-400 font-medium">System Temp</div>
                            <div className="text-3xl font-mono font-bold text-red-500 tracking-wider">
                                {temp} <span className="text-xl text-red-800">°C</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}