require('dotenv').config();
const connectDB = require('../config/db');
const Venue = require('../models/Venue');
const mongoose = require('mongoose');

async function checkVenueStructure() {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Get first venue and log its structure
        const firstVenue = await Venue.findOne({}).lean();
        
        console.log('\nVenue Structure:');
        console.log(JSON.stringify(firstVenue, null, 2));
        
        // Log available fields
        console.log('\nAvailable fields:');
        Object.keys(firstVenue).forEach(key => {
            console.log(`- ${key}: ${typeof firstVenue[key]}`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

checkVenueStructure();