// routes/orderStatus.js
const express  = require('express');
const router   = express.Router();
const asyncH   = require('express-async-handler');
const Order    = require('../model/order');
const User     = require('../model/user');
const { sendToPlayers } = require('../service/oneSignalService');

router.put('/:id/status', asyncH(async (req, res) => {
  const { status } = req.body;        // new status
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ msg: 'Order not found' });

  order.status = status;
  await order.save();

  // Lấy playerId khách
  const user = await User.findById(order.userId);
  if (user?.playerId) {
    await sendToPlayers({
      playerIds: [user.playerId],
      title: 'Cập nhật đơn hàng',
      message: `Đơn #${order._id} đã chuyển sang: ${status}`,
      data: { orderId: order._id.toString(), status },
    });
  }

  res.json({ success: true, order });
}));

module.exports = router;
