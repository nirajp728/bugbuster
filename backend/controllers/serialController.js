import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import Session from '../models/Session.js'; // Ensure you created this model

let activePort = null;
let isRecording = false;      // Global state: are we logging to DB?
let currentSessionId = null;  // Global state: which DB doc are we hitting?

/**
 * Helper to parse the "#KIND:K=V,K2=V2;" string
 * Matches the logic used in your STM32 Python GUI
 */
const parseMessage = (raw) => {
    let clean = raw.trim();
    if (clean.endsWith(';')) clean = clean.slice(0, -1);
    if (!clean.startsWith('#')) return null;

    clean = clean.slice(1);
    const parts = clean.split(':');
    if (parts.length < 2) return null;
    
    const kind = parts[0].trim();
    const rest = parts.slice(1).join(':'); 

    const fields = {};
    rest.split(',').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k && v) fields[k.trim()] = v.trim();
    });
    
    return { kind, fields };
};

export const initSerialSockets = (io) => {
    const portName = process.env.COM_PORT;

    // 1. Establish Hardware Connection
    if (portName && !activePort) {
        activePort = new SerialPort({ path: portName, baudRate: 115200 }, (err) => {
            if (err) console.error(`[SERIAL] Error:`, err.message);
            else console.log(`[SERIAL] Connected to ${portName}`);
        });

        const parser = activePort.pipe(new ReadlineParser({ delimiter: ';' }));
        
        // 2. Handle Incoming Data from STM32
        parser.on('data', async (data) => {
            const msg = parseMessage(data);
            if (msg) {
                // Always broadcast to the live website
                io.emit('stm32-data', msg); 

                // If "Record" was clicked, save to MongoDB
                if (isRecording && currentSessionId && msg.kind === 'DATA') {
                    try {
                        await Session.findByIdAndUpdate(currentSessionId, {
                            $push: { 
                                dataPoints: { 
                                    mode: msg.fields.M, 
                                    value: parseFloat(msg.fields.X),
                                    timestamp: new Date()
                                } 
                            }
                        });
                    } catch (err) {
                        console.error("[DB-LOG] Error:", err.message);
                    }
                }
            }
        });
    }

    // 3. Handle WebSocket Events from React
    io.on('connection', (socket) => {
        console.log('Client connected to Lab');

        // Logic for the Red "Record" Circle
        socket.on('start-recording', async (userId) => {
            try {
                const newSession = new Session({ userId });
                await newSession.save();
                currentSessionId = newSession._id;
                isRecording = true;
                socket.emit('recording-status', { active: true });
                console.log(`[SESSION] Started: ${currentSessionId}`);
            } catch (err) {
                socket.emit('serial-error', 'Database session failed to start');
            }
        });

        // Logic for the "Stop" Square
        socket.on('stop-recording', async () => {
            isRecording = false;
            if (currentSessionId) {
                await Session.findByIdAndUpdate(currentSessionId, { endTime: Date.now() });
            }
            currentSessionId = null;
            socket.emit('recording-status', { active: false });
            console.log(`[SESSION] Stopped and saved.`);
        });

        // Command forwarding (Send buttons)
        socket.on('send-command', (cmd) => {
            if (activePort && activePort.isOpen) {
                activePort.write(cmd);
            }
        });
    });
};