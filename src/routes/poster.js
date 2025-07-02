const express = require('express');
const router = express.Router();
const Poster = require('../model/poster');
const { uploadPosters } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');

// Get all posters
router.get('/', asyncHandler(async (_req, res) => {
    try {
        const posters = await Poster.find({});
        res.json({ success: true, message: "Posters retrieved successfully.", data: posters });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a poster by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);
        if (!poster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }
        res.json({ success: true, message: "Poster retrieved successfully.", data: poster });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new poster
router.post('/', asyncHandler(async (req, res) => {
    uploadPosters.single('img')(req, res, async function (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.json({ success: false, message: 'File size is too large. Maximum filesize is 5MB.' });
        } else if (err) {
            return res.json({ success: false, message: err.message || err });
        }

        const { posterName } = req.body;
        const imageUrl = req.file?.path || 'no_url'; // lấy URL từ cloudinary

        if (!posterName) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        try {
            const newPoster = new Poster({ posterName, imageUrl });
            await newPoster.save();
            res.json({ success: true, message: "Poster created successfully.", data: null });
        } catch (error) {
            console.error("Error creating Poster:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
}));

// Update a poster
router.put('/:id', asyncHandler(async (req, res) => {
    const posterID = req.params.id;

    uploadPosters.single('img')(req, res, async function (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.json({ success: false, message: 'File size is too large. Maximum filesize is 5MB.' });
        } else if (err) {
            return res.json({ success: false, message: err.message || err });
        }

        const { posterName } = req.body;
        const image = req.file?.path || req.body.image;

        if (!posterName || !image) {
            return res.status(400).json({ success: false, message: "Name and image are required." });
        }

        try {
            const updatedPoster = await Poster.findByIdAndUpdate(
                posterID,
                { posterName, imageUrl: image },
                { new: true }
            );
            if (!updatedPoster) {
                return res.status(404).json({ success: false, message: "Poster not found." });
            }
            res.json({ success: true, message: "Poster updated successfully.", data: null });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
}));

// Delete a poster
router.delete('/:id', asyncHandler(async (req, res) => {
    const posterID = req.params.id;
    try {
        const deletedPoster = await Poster.findByIdAndDelete(posterID);
        if (!deletedPoster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }
        res.json({ success: true, message: "Poster deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
