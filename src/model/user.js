const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // vì người dùng Google có thể không có name ban đầu
  },
  password: {
    type: String,
    required: false, // người dùng Google không có password
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // tránh lỗi trùng nếu không có email (chỉ cho Google dùng)
  },
  googleId: {
    type: String,
  },
  picture: {
    type: String, // ảnh đại diện
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Middleware để cập nhật updatedAt khi save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
