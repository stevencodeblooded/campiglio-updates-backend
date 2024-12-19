const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A banner must have a name'],
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'A banner must have an image URL']
    },
    link: {
        type: String,
        required: [true, 'A banner must have a link URL']
    },
    order: {
        type: Number,
        default: 999
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for ordering
bannerSchema.index({ order: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;