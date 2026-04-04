import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Multimeter({ socket }) {
    const [value, setValue] = useState('---');
    const [unit, setUnit] = useState('-');
    const [mode, setMode] = useState('V');
    const [range, setRange] = useState('12');
    const [dsoData, setDsoData] = useState([]);
    
    // New state for math calculations
    const [vrms, setVrms] = useState('0.000');
    const [vpp, setVpp] = useState('0.000');

    useEffect(() => {
        socket.on('stm32-data', (msg) => {
            if (msg.kind === 'DATA') {
                const val = parseFloat(msg.fields.X);

                if (msg.fields.M === 'V') {
                    setValue(val.toFixed(2));
                    setUnit('Volts (V)');
                } else if (msg.fields.M === 'A') {
                    setValue(val.toFixed(3));
                    setUnit('Amperes (A)');
                }
                
                // Keep buffer at 200 samples to match Python DSO_SAMPLES
                setDsoData(prev => {
                    const newData = [...prev, { val }];
                    if (newData.length > 200) newData.shift(); 
                    
                    // Calculate Vrms and Vpp (React equivalent of numpy math)
                    if (newData.length > 0) {
                        const vals = newData.map(d => d.val);
                        const max = Math.max(...vals);
                        const min = Math.min(...vals);
                        const sumSq = vals.reduce((acc, curr) => acc + (curr * curr), 0);
                        
                        setVpp((max - min).toFixed(3));
                        setVrms(Math.sqrt(sumSq / vals.length).toFixed(3));
                    }
                    
                    return newData;
                });
            }
        });
        return () => socket.off('stm32-data');
    }, [socket]);

    const handleSend = () => {
        socket.emit('send-command', `#MODE:T=${mode};`);
        if (mode === 'V' || mode === 'D') socket.emit('send-command', `#RANGE:V=${range};`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 lg:col-span-1">
                <h2 className="text-lg font-bold text-gray-400 mb-4 uppercase">Controls</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-500 block mb-1">Mode</label>
                        <select className="bg-gray-900 border border-gray-600 rounded p-2 w-full text-white" 
                                value={mode} onChange={e => setMode(e.target.value)}>
                            <option value="V">Voltmeter (V)</option>
                            <option value="A">Ammeter (A)</option>
                            <option value="D">DSO (D)</option>
                        </select>
                    </div>
                    {/* Range selection dropdown (shows when V or D is selected) */}
                    {(mode === 'V' || mode === 'D') && (
                        <div>
                            <label className="text-gray-500 block mb-1">Range</label>
                            <select className="bg-gray-900 border border-gray-600 rounded p-2 w-full text-white" 
                                    value={range} onChange={e => setRange(e.target.value)}>
                                <option value="12">12 V</option>
                                <option value="16">16 V</option>
                                <option value="24">24 V</option>
                            </select>
                        </div>
                    )}
                    <button onClick={handleSend} className="w-full bg-gray-700 hover:bg-green-500 hover:text-gray-900 border border-green-500 text-green-500 font-bold py-2 rounded mt-4 transition-colors">
                        ▶ SEND
                    </button>
                </div>
            </div>

            {/* Big Display */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 lg:col-span-2 flex flex-col items-center justify-center">
                <div className="text-6xl font-mono font-bold text-green-400 tracking-widest">{value}</div>
                <div className="text-xl text-gray-500 mt-2">{unit}</div>
            </div>

            {/* DSO Chart */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 lg:col-span-3 h-96 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-400 uppercase mb-2 sm:mb-0">DSO Waveform</h2>
                    
                    {/* The new Vrms and Vpp display */}
                    <div className="flex space-x-6 bg-gray-900 px-4 py-2 rounded border border-gray-700">
                        <span className="text-yellow-500 font-mono text-sm sm:text-base">Vrms: {vrms} V</span>
                        <span className="text-yellow-500 font-mono text-sm sm:text-base">Vpp: {vpp} V</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dsoData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="time" hide />
                            <YAxis stroke="#9ca3af" domain={['auto', 'auto']} />
                            <Line type="monotone" dataKey="val" stroke="#3b82f6" dot={false} isAnimationActive={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}