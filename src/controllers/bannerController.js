const Banner = require('../models/bannerModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllBanners = catchAsync(async (req, res) => {
    const banners = await Banner.find().sort('order');
    
    res.status(200).json({
        status: 'success',
        data: banners
    });
});

exports.createBanner = catchAsync(async (req, res) => {
    const banner = await Banner.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: banner
    });
});

exports.updateBanner = catchAsync(async (req, res) => {
    const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!banner) {
        throw new AppError('No banner found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: banner
    });
});

exports.deleteBanner = catchAsync(async (req, res) => {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
        throw new AppError('No banner found with that ID', 404);
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.reorderBanners = catchAsync(async (req, res) => {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
        throw new AppError('Orders must be an array', 400);
    }

    const updateOperations = orders.map(({ id, order }) => ({
        updateOne: {
            filter: { _id: id },
            update: { $set: { order } }
        }
    }));

    await Banner.bulkWrite(updateOperations);

    const updatedBanners = await Banner.find().sort('order');

    res.status(200).json({
        status: 'success',
        data: updatedBanners
    });
});