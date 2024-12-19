require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const venueRoutes = require('./routes/venueRoutes');
const errorHandler = require('./middleware/errorHandler');
const { publicRouter, protectedRouter } = require('./routes/adminRoutes');

// Initialize express app
const app = express();

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        status: 'error',
        message: 'Too many login attempts, please try again later.'
    }
});

// Basic middleware
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5501', 'http://127.0.0.1:5501', 'https://italia-map.netlify.app', 'https://campiglioismagic.it'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Origin']
}));

// Additional CORS handling
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Apply rate limiters
app.use('/api', limiter);
app.use('/api/admin/login', loginLimiter);

// Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        time: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: mongoose.connection.host
        }
    });
});

// Debug route for MongoDB connection
app.get('/debug/mongodb', (req, res) => {
    res.status(200).json({
        mongodb: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: mongoose.connection.host,
            name: mongoose.connection.name,
            port: mongoose.connection.port
        }
    });
});

// API Routes - order is important
app.use('/api/venues', venueRoutes);
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Handle undefined routes
app.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// Global Error Handler
app.use(errorHandler);

// Server Setup
const PORT = process.env.PORT || 5001;

const startServer = async () => {
    try {
        let retries = 5;
        while (retries > 0) {
            try {
                console.log('Attempting MongoDB connection...');
                await connectDB();
                console.log('MongoDB connected successfully');
                break;
            } catch (error) {
                retries--;
                console.error('MongoDB Connection Error:', {
                    message: error.message,
                    code: error.code
                });
                
                if (retries === 0) {
                    throw error;
                }
                console.log(`Connection failed. Retrying in 5 seconds... (${retries} attempts remaining)`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        // Start server
        const server = app.listen(PORT, () => {
            console.log(`
══════════════════════════════════════════
 Server running in ${process.env.NODE_ENV} mode
 Port: ${PORT}
 URL: http://localhost:${PORT}
 Health Check: http://localhost:${PORT}/health
 MongoDB Debug: http://localhost:${PORT}/debug/mongodb
══════════════════════════════════════════
            `);
        });

        // MongoDB connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Process event handlers
        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
            server.close(() => {
                mongoose.connection.close(false, () => {
                    console.log('MongoDB connection closed.');
                    console.log('💥 Process terminated!');
                });
            });
        });

    } catch (error) {
        console.error('Failed to start server:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

// Process event handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });
    process.exit(1);
});

// Start the server
startServer();