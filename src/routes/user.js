const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');
const { OAuth2Client } = require('google-auth-library');

// Get all users
router.get('/', asyncHandler(async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, message: "Users retrieved successfully.", data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// login
router.post('/login', async (req, res) => {
    const { name, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ name });


        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid name or password." });
        }
        // Check if the password is correct
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid name or password." });
        }

        // Authentication successful
        res.status(200).json({ success: true, message: "Login successful.",data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// login with google

const GOOGLE_CLIENT_ID = process.env.YOUR_GOOGLE_CLIENT_ID; // Replace with your actual Google Client ID
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/google', asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    // Tìm user theo email (Google)
    let user = await User.findOne({ email });

    // Nếu chưa có, tạo mới
    if (!user) {
      user = new User({
        name: name || email,
        email,
        googleId,
        picture,
        password: null,
      });
      await user.save();
    }

    res.status(200).json({ success: true, message: "Google login successful.", data: user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid Google token', error: error.message });
  }
}));


// Get a user by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User retrieved successfully.", data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new user
router.post('/register', asyncHandler(async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) {
        return res.status(400).json({ success: false, message: "Name, and password are required." });
    }

    try {
        const user = new User({ name, password });
        const newUser = await user.save();
        res.json({ success: true, message: "User created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a user
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { name, password } = req.body;
        if (!name || !password) {
            return res.status(400).json({ success: false, message: "Name,  and password are required." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { name, password },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User updated successfully.", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a user
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userID);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
