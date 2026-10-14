const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// 1. CRITICAL: CORS middleware MUST come before any routes
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', // Added port 5174 to fix the block
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://192.168.1.5:5173' // Replace with your actual mobile/network IP if testing on phone
  ], 
  credentials: true
}));

// 2. Parsers
app.use(express.json());
app.use(cookieParser());

// 3. Mount Routes
// Note: Ensure your user route file matches this import (e.g., './routes/userRoutes' or './routes/users')
app.use('/api/logs', require('./routes/logs'));
app.use('/api/users', require('./routes/userRoutes')); 
app.use('/api/alerts', require('./routes/alertRoutes'));
// 4. Default Route
app.get('/', (req, res) => {
    res.send('Premium Auth API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});