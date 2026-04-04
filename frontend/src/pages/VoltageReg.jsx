import { useState, useEffect } from 'react';

export default function VoltageReg({ socket }) {
    const [voltage, setVoltage] = useState(0.0);
    const [boostFeedback, setBoostFeedback] = useState('--');
    const [tempFeedback, setTempFeedback] = useState('--');

    useEffect(() => {
        socket.on('stm32-data', (msg) => {
            if (msg.kind === 'BOOST') setBoostFeedback(msg.fields.V || '--');
            if (msg.kind === 'TEMP') setTempFeedback(msg.fields.T || '--');
        });
        return () => socket.off('stm32-data');
    }, [socket]);

    const handleSend = () => {
        socket.emit('send-command', `#VREG:V=${voltage.toFixed(1)};`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Control Panel */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-lg font-bold text-gray-400 mb-6 uppercase">Output Voltage</h2>
                <label className="text-gray-500 block mb-2">Set Voltage (0 - 12 V)</label>
                
                <div className="flex items-center space-x-4 mb-6">
                    <input type="range" min="0" max="120" 
                        className="flex-1 accent-blue-500"
                        value={voltage * 10} onChange={e => setVoltage(Number(e.target.value) / 10)} />
                    <div className="bg-gray-900 border border-gray-600 rounded p-2 w-24 text-center text-white font-mono">
                        {voltage.toFixed(1)} V
                    </div>
                </div>

                <button onClick={handleSend} className="w-full bg-gray-700 hover:bg-green-500 hover:text-gray-900 border border-green-500 text-green-500 font-bold py-2 rounded transition-colors">
                    ▶ SEND
                </button>
            </div>

            {/* Feedback Panel */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-lg font-bold text-gray-400 mb-6 uppercase">Feedback</h2>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-900 p-4 rounded border border-gray-700">
                        <span className="text-gray-400">Boost Output:</span>
                        <span className="text-2xl font-mono text-yellow-500">{boostFeedback} V</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 p-4 rounded border border-gray-700">
                        <span className="text-gray-400">Temperature:</span>
                        <span className="text-2xl font-mono text-red-400">{tempFeedback} °C</span>
                    </div>
                </div>
            </div>
        </div>
    );
}