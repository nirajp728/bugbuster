import { useState } from 'react';

export default function FunctionGen({ socket }) {
    const [waveType, setWaveType] = useState('SQ');
    const [frequency, setFrequency] = useState(100);

    const handleSend = () => {
        socket.emit('send-command', `#WAVE:T=${waveType};`);
        socket.emit('send-command', `#WAVE:F=${frequency};`);
    };

    return (
        <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold text-gray-400 mb-6 uppercase">Waveform Settings</h2>
            
            <div className="space-y-6">
                <div>
                    <label className="text-gray-500 block mb-2">Waveform Type</label>
                    <select className="bg-gray-900 border border-gray-600 rounded p-2 w-full text-white"
                        value={waveType} onChange={e => setWaveType(e.target.value)}>
                        <option value="SQ">Square</option>
                        <option value="TR">Triangle</option>
                        <option value="PA">Parabola</option>
                        <option value="G">Ground</option>
                    </select>
                </div>

                <div>
                    <label className="text-gray-500 block mb-2">Frequency ({frequency} Hz)</label>
                    <div className="flex items-center space-x-4">
                        <input type="range" min="0" max="1000" 
                            className="flex-1 accent-blue-500"
                            value={frequency} onChange={e => setFrequency(Number(e.target.value))} />
                        <input type="number" min="0" max="1000" 
                            className="bg-gray-900 border border-gray-600 rounded p-2 w-24 text-white text-center"
                            value={frequency} onChange={e => setFrequency(Number(e.target.value))} />
                    </div>
                </div>

                <button onClick={handleSend} className="w-full sm:w-auto px-8 bg-gray-700 hover:bg-green-500 hover:text-gray-900 border border-green-500 text-green-500 font-bold py-2 rounded transition-colors mt-4">
                    ▶ SEND
                </button>
            </div>
        </div>
    );
}