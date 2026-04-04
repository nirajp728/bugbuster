import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

let activePort = null;

// Helper to parse the "#KIND:K=V;" string
const parseMessage = (raw) => {
    if (!raw.startsWith('#')) return null;
    const clean = raw.slice(1).replace(';', '');
    const [kind, rest] = clean.split(':');
    if (!rest) return null;
    
    const fields = {};
    rest.split(',').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k && v) fields[k.trim()] = v.trim();
    });
    return { kind: kind.trim(), fields };
};

export const initSerialSockets = (io) => {
    const portName = process.env.COM_PORT;

    // 1. Auto-connect to the STM32 board when the backend server starts
    if (portName && !activePort) {
        activePort = new SerialPort({ path: portName, baudRate: 115200 }, (err) => {
            if (err) {
                console.error(`[SERIAL] Failed to connect to ${portName}:`, err.message);
            } else {
                console.log(`[SERIAL] Successfully auto-connected to ${portName}`);
            }
        });

        // Use the same delimiter your Python code used
        const parser = activePort.pipe(new ReadlineParser({ delimiter: ';' }));
        
        // 2. Listen to hardware ONCE globally, and broadcast to all connected web clients
        parser.on('data', (data) => {
            const msg = parseMessage(data);
            // io.emit blasts the data to all connected React frontends instantly
            if (msg) io.emit('stm32-data', msg); 
        });
    } else if (!portName) {
        console.warn("[SERIAL] No COM_PORT defined in .env file. Please add it!");
    }

    // 3. Handle incoming WebSocket connections from your Vercel frontend
    io.on('connection', (socket) => {
        console.log('Client connected via WebSocket');

        // Optional: Instantly tell the frontend if the hardware is currently connected
        socket.emit('serial-status', { 
            connected: activePort ? activePort.isOpen : false, 
            path: portName 
        });

        // 4. Send Command to STM32 when the green SEND buttons are clicked
        socket.on('send-command', (cmd) => {
            if (activePort && activePort.isOpen) {
                activePort.write(cmd, (err) => {
                    if (err) console.error('[SERIAL] Write failed:', err);
                });
            } else {
                // Send an error back to the specific user if the board got unplugged
                socket.emit('serial-error', 'Hardware is not connected to the backend laptop');
            }
        });
    });
};