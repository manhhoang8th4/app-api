const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Notification = require('../model/notification');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Send notification
router.post('/send-notification', asyncHandler(async (req, res) => {
    const { title, description, imageUrl } = req.body;

    const body = {
        app_id: process.env.ONE_SIGNAL_APP_ID,
        included_segments: ['All'],
        contents: { en: description },
        headings: { en: title },
        ...(imageUrl && { big_picture: imageUrl })
    };

    try {
        const response = await axios.post(
            'https://api.onesignal.com/notifications', // ✅ new API base
            body,
            {
                headers: {
                    Authorization: `Basic ${process.env.ONE_SIGNAL_REST_API_KEY}`, // ✅ Bearer instead of Basic
                    'Content-Type': 'application/json'
                }
            }
        );

        const notificationId = response.data.id;

        const notification = new Notification({
            notificationId,
            title,
            description,
            imageUrl
        });
        await notification.save();

        res.json({ success: true, message: 'Notification sent successfully', data: null });
    } catch (error) {
        console.error('Notification send error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data || error.message
        });
    }
}));

// Track notification (Note: still under legacy endpoint, may not work with Bearer key long term)
router.get('/track-notification/:id', asyncHandler(async (req, res) => {
    const notificationId = req.params.id;

    try {
        const response = await axios.get(
            `https://api.onesignal.com/notifications/${notificationId}?app_id=${process.env.ONE_SIGNAL_APP_ID}`,
            {
                headers: {
                    Authorization: `Basic ${process.env.ONE_SIGNAL_REST_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const stats = response.data.platform_delivery_stats;
        const result = {
            platform: 'Android',
            success_delivery: stats.android?.successful || 0,
            failed_delivery: stats.android?.failed || 0,
            errored_delivery: stats.android?.errored || 0,
            opened_notification: stats.android?.converted || 0
        };

        res.json({ success: true, message: 'Success', data: result });
    } catch (error) {
        console.error('Track error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data || error.message
        });
    }
}));

// Get all notifications
router.get('/all-notification', asyncHandler(async (req, res) => {
    try {
        const notifications = await Notification.find({}).sort({ _id: -1 });
        res.json({
            success: true,
            message: 'Notifications retrieved successfully.',
            data: notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a notification
router.delete('/delete-notification/:id', asyncHandler(async (req, res) => {
    const notificationID = req.params.id;

    try {
        const notification = await Notification.findByIdAndDelete(notificationID);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }
        res.json({ success: true, message: "Notification deleted successfully.",data:null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
