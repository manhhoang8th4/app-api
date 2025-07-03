const axios = require('axios');
require('dotenv').config();

exports.sendToPlayers = async ({ playerIds, title, message, data }) => {
  const body = {
    app_id: process.env.ONE_SIGNAL_APP_ID,
    include_player_ids: playerIds,      // ⬅️ gửi cho danh sách cụ thể
    headings: { en: title },
    contents: { en: message },
    data,                               // payload tuỳ ý (orderId, status…)
  };

  return axios.post('https://api.onesignal.com/notifications', body, {
    headers: {
      Authorization: `Basic ${process.env.ONE_SIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
};