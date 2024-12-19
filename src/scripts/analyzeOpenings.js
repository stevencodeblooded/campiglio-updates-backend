require('dotenv').config();
const connectDB = require('../config/db');  // One level up to src, then into config
const Venue = require('../models/Venue');   // One level up to src, then into models
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function analyzeOpeningHours() {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Fetch all venues with relevant fields
        const venues = await Venue.find({}, 'name openingHours is24_7').lean();

        // Prepare the output content
        let output = 'Venue Opening Hours Analysis\n';
        output += '===========================\n\n';
        
        // Add summary statistics
        const stats = {
            total: venues.length,
            is24_7Count: venues.filter(v => v.is24_7).length,
            hasOpeningHours: venues.filter(v => v.openingHours && Object.values(v.openingHours).some(h => h && (h.open || h.close))).length
        };

        output += `Total Venues: ${stats.total}\n`;
        output += `24/7 Venues: ${stats.is24_7Count}\n`;
        output += `Venues with Opening Hours: ${stats.hasOpeningHours}\n\n`;

        // Detailed venue information
        output += 'Detailed Venue Information\n';
        output += '-------------------------\n\n';

        venues.forEach((venue, index) => {
            output += `${index + 1}. ${venue.name}\n`;
            output += `   24/7: ${venue.is24_7 ? 'Yes' : 'No'}\n`;
            
            if (venue.openingHours) {
                output += '   Opening Hours:\n';
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                days.forEach(day => {
                    const hours = venue.openingHours[day];
                    if (hours) {
                        output += `      ${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.open || 'N/A'} - ${hours.close || 'N/A'}\n`;
                    } else {
                        output += `      ${day.charAt(0).toUpperCase() + day.slice(1)}: Not specified\n`;
                    }
                });
            } else {
                output += '   Opening Hours: Not specified\n';
            }
            output += '\n';
        });

        // Save to file in the scripts directory
        const fileName = `venue_hours_analysis_${new Date().toISOString().split('T')[0]}.txt`;
        fs.writeFileSync(path.join(__dirname, fileName), output);

        console.log(`Analysis complete! Results saved to ${fileName}`);
        console.log(`File location: ${path.join(__dirname, fileName)}`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

analyzeOpeningHours();