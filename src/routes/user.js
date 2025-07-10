const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const User = require("../model/user");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { uploadAvatar } = require("../uploadFile");
// Get all users
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const users = await User.find();
      res.json({
        success: true,
        message: "Users retrieved successfully.",
        data: users,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });

    if (!email) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid name or password." });
    }
    // Check if the password is correct
    if (user.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid name or password." });
    }

    // Authentication successful
    res
      .status(200)
      .json({ success: true, message: "Login successful.", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// login with google

const GOOGLE_CLIENT_ID = process.env.YOUR_GOOGLE_CLIENT_ID; // Replace with your actual Google Client ID
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post(
  "/google",
  asyncHandler(async (req, res) => {
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
          name: email,
          email,
          googleId,
          picture,
          password: null,
        });
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: "Google login successful.",
        data: user,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid Google token",
        error: error.message,
      });
    }
  }),
);

// login with facebook
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

router.post(
  "/facebook",
  asyncHandler(async (req, res) => {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }

    try {
      // Xác minh access_token có hợp lệ với app_id không
      const debugTokenResponse = await axios.get(
        `https://graph.facebook.com/debug_token`,
        {
          params: {
            input_token: access_token,
            access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
          },
        },
      );

      const isValid = debugTokenResponse.data?.data?.is_valid;
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid Facebook access token.",
        });
      }

      // Lấy thông tin user
      const fbResponse = await axios.get(`https://graph.facebook.com/me`, {
        params: {
          fields: "id,name,email,picture",
          access_token,
        },
      });

      const fbUser = fbResponse.data;
      const facebookId = fbUser.id;
      const name = fbUser.name;
      const email = fbUser.email || `${facebookId}@facebook.com`;
      const picture = fbUser.picture?.data?.url || "";

      // Kiểm tra hoặc tạo mới user
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          name,
          email,
          facebookId,
          picture,
          password: null,
        });

        await user.save();
      }

      // Trả kết quả
      return res.status(200).json({
        success: true,
        message: "Facebook login successful.",
        data: user,
      });
    } catch (error) {
      console.error(
        "Facebook login error:",
        error?.response?.data || error.message,
      );
      return res.status(500).json({
        success: false,
        message: "Facebook login failed.",
        error: error?.response?.data || error.message,
      });
    }
  }),
);

// Get a user by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userID = req.params.id;
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      res.json({
        success: true,
        message: "User retrieved successfully.",
        data: user,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Create a new user
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, and password are required." });
    }

    try {
      const user = new User({ name, email, password });
      const newUser = await user.save();
      res.json({
        success: true,
        message: "User created successfully.",
        data: null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

// Update a user
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userID = req.params.id;
      const { password } = req.body;

      if (!password) {
        return res
          .status(400)
          .json({ success: false, message: "Password is required." });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userID,
        { password }, // 👈 cập nhật password
        { new: true }, // 👈 trả về bản ghi mới sau khi cập nhật
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      res.json({
        success: true,
        message: "Password updated successfully.",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);
// Delete a user
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userID = req.params.id;
      const deletedUser = await User.findByIdAndDelete(userID);
      if (!deletedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

//forgot password
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email.",
      });
    }

    // Tạo mật khẩu ngẫu nhiên (8 ký tự hex)
    const newPassword = crypto.randomBytes(4).toString("hex");

    // Cập nhật mật khẩu mới vào MongoDB (không hash)
    user.password = newPassword;
    await user.save();

    // Gửi email mật khẩu mới
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // email của bạn
        pass: process.env.EMAIL_PASS, // app password (không phải password Gmail)
      },
    });

    const mailOptions = {
      from: `"MyApp Support" <${process.env.EMAIL_USER}>`,
      to: user.name,
      subject: "🔐 Your New Password",
      html: `
        <p>Hello <b>${user.name}</b>,</p>
        <p>Your new password is:</p>
        <h3 style="color: #d9534f;">${newPassword}</h3>
        <p>You can now login using this new password and change it later.</p>
        <br>
        <p style="font-size: 12px; color: gray;">If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "A new password has been sent to your email.",
    });
  }),
);
//upload avatar
router.post(
  "/upload-avatar/:userId",
  uploadAvatar.single("avatar"),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Không có file => báo lỗi
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    // URL Cloudinary
    const avatarUrl = req.file.path;

    // Cập nhật vào MongoDB
    const user = await User.findByIdAndUpdate(
      userId,
      { picture: avatarUrl },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({
      success: true,
      message: "Avatar uploaded successfully.",
      data: user,
    });
  }),
);

router.put("/:id/player-id", async (req, res) => {
  const { id } = req.params;
  const { playerId } = req.body;

  try {
    // $set cho rõ ràng & trả document mới
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { playerId } },
      { new: true, runValidators: true },
    );

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
