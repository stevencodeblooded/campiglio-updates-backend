const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('Starting MongoDB connection attempt...');
        
        const options = {
            serverSelectionTimeoutMS: 15000, // Increase timeout to 15 seconds
            socketTimeoutMS: 45000,          // Increase socket timeout
            family: 4,                       // Force IPv4
            maxPoolSize: 10,                 // Limit concurrent connections
            connectTimeoutMS: 15000,         // Connection timeout
            retryWrites: true,
            retryReads: true
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`MongoDB Connected Successfully to ${conn.connection.host}`);
        
        // Add connection event listeners
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });

        return conn;
    } catch (error) {
        console.error('MongoDB Connection Error Details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
        throw error;
    }
};

module.exports = connectDB;