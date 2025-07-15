const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Cho phép rỗng với Google/Facebook
  },
  password: {
    type: String,
    required: false, // Rỗng với người dùng mạng xã hội
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Tránh lỗi unique nếu không có email
  },
  googleId: {
    type: String,
    default: null,
  },
  facebookId: {
    type: String,
    default: null,
  },
  picture: {
    type: String,
    default: null, // URL avatar
  },
  playerId: {
    type: String,
    default: null, // Dùng cho OneSignal
  },
  isBlocked: {
    type: Boolean,
    default: false, // 👈 Mặc định không bị khóa
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Cập nhật updatedAt mỗi khi gọi save()
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Nếu bạn sử dụng updateOne hoặc findOneAndUpdate, bạn cần hook khác
userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
