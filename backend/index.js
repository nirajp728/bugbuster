import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

// IMPORTANT: Local imports must have .js extensions in ES Modules
import authRoutes from './routes/authRoutes.js';
import { initSerialSockets } from './controllers/serialController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Database Connect
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize Hardware Bridge
initSerialSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} using ES Modules`);
});