import User from '../models/User.js'; // Note the .js extension!
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendAuthEmail } from '../utils/mailer.js';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        sendAuthEmail(newUser.email, 'register', newUser.name);
        res.status(201).json({ message: 'User registered' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        sendAuthEmail(user.email, 'login', user.name);
        res.json({ token, name: user.name });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};