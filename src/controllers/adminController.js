const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Venue = require("../models/Venue");

// Helper function to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Helper function for sending JWT token response
const createSendToken = (admin, statusCode, res) => {
  const token = signToken(admin._id);

  // Remove password from output
  admin.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      admin,
    },
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username and password exist
    if (!username || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide username and password",
      });
    }

    // Find admin and include password for comparison
    const admin = await Admin.findOne({ username }).select("+password");

    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect username or password",
      });
    }

    // Update last login timestamp
    admin.lastLogin = Date.now();
    await admin.save({ validateBeforeSave: false });

    // Send token
    createSendToken(admin, 200, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error logging in",
      error: error.message,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get category statistics
    const categoryStats = await Venue.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get total venues count
    const totalVenues = await Venue.countDocuments();

    // Get recent updates (venues updated in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUpdates = await Venue.countDocuments({
      updatedAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      status: "success",
      data: {
        totalVenues,
        categoryStats,
        recentUpdates,
        // Add the count of unique categories
        totalCategories: categoryStats.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

exports.signup = async (req, res) => {
  try {
    console.log("Signup endpoint hit");
    console.log("Request body:", req.body);

    const { username, password } = req.body;

    // Check if username and password exist
    if (!username || !password) {
      console.log("Missing username or password");
      return res.status(400).json({
        status: "fail",
        message: "Please provide username and password",
      });
    }

    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log("Username already exists:", username);
      return res.status(400).json({
        status: "fail",
        message: "Username already exists",
      });
    }

    // Create new admin with default role
    const newAdmin = await Admin.create({
      username,
      password,
      role: "admin", // Default role for new signups
    });

    console.log("New admin created:", username);

    // Remove password from output
    newAdmin.password = undefined;

    res.status(201).json({
      status: "success",
      message: "Admin account created successfully",
      data: {
        admin: newAdmin,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      status: "error",
      message: "Error creating admin account",
      error: error.message,
    });
  }
};
