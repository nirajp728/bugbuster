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
    io.on('connection', (socket) => {
        console.log('Client connected via WebSocket');

        // List Ports
        socket.on('get-ports', async () => {
            try {
                const ports = await SerialPort.list();
                socket.emit('ports-list', ports.map(p => p.path));
            } catch (err) {
                socket.emit('serial-error', 'Failed to list ports');
            }
        });

        // Connect to STM32
        socket.on('connect-port', (path) => {
            if (activePort && activePort.isOpen) {
                activePort.close();
            }
            
            activePort = new SerialPort({ path, baudRate: 115200 }, (err) => {
                if (err) {
                    socket.emit('serial-error', err.message);
                } else {
                    socket.emit('serial-status', { connected: true, path });
                }
            });

            const parser = activePort.pipe(new ReadlineParser({ delimiter: ';' }));
            
            parser.on('data', (data) => {
                const msg = parseMessage(data);
                if (msg) socket.emit('stm32-data', msg);
            });
        });

        // Disconnect
        socket.on('disconnect-port', () => {
            if (activePort && activePort.isOpen) {
                activePort.close();
            }
            socket.emit('serial-status', { connected: false });
        });

        // Send Command to STM32
        socket.on('send-command', (cmd) => {
            if (activePort && activePort.isOpen) {
                activePort.write(cmd, (err) => {
                    if (err) socket.emit('serial-error', 'Write failed');
                });
            }
        });
    });
};