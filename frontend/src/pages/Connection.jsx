import { useState, useEffect } from 'react';

export default function Connection({ socket }) {
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        socket.emit('get-ports');
        socket.on('ports-list', setPorts);
        socket.on('serial-status', (status) => setIsConnected(status.connected));
        socket.on('serial-error', (err) => setLogs(prev => [...prev, `[ERR] ${err}`]));
        
        return () => {
            socket.off('ports-list');
            socket.off('serial-status');
            socket.off('serial-error');
        };
    }, [socket]);

    const handleConnect = () => socket.emit('connect-port', selectedPort);
    const handleDisconnect = () => socket.emit('disconnect-port');

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-lg font-bold text-gray-400 mb-4 uppercase">Serial Port</h2>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center">
                    <select 
                        className="bg-gray-900 border border-gray-600 rounded p-2 text-white flex-1 w-full"
                        value={selectedPort} 
                        onChange={(e) => setSelectedPort(e.target.value)}
                        disabled={isConnected}
                    >
                        <option value="">Select COM Port</option>
                        {ports.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button onClick={() => socket.emit('get-ports')} className="bg-gray-700 p-2 rounded">↻</button>
                    
                    {!isConnected ? (
                        <button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded text-white font-bold w-full sm:w-auto">CONNECT</button>
                    ) : (
                        <button onClick={handleDisconnect} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded text-white font-bold w-full sm:w-auto">DISCONNECT</button>
                    )}
                </div>
                <div className="mt-4 flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={isConnected ? 'text-green-500' : 'text-gray-500'}>
                        {isConnected ? `Connected to ${selectedPort}` : 'Disconnected'}
                    </span>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-64 overflow-y-auto">
                <h2 className="text-lg font-bold text-gray-400 mb-4 uppercase">Logs</h2>
                {logs.map((log, i) => <div key={i} className="font-mono text-sm text-green-400">{log}</div>)}
            </div>
        </div>
    );
}