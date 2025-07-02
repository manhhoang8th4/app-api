const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary');

const createCloudStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: { folder, allowed_formats: ['jpg','jpeg','png'] },
  });

module.exports = {
  uploadCategory: multer({ storage: createCloudStorage('categories'), limits: { fileSize: 5*1024*1024 } }),
  uploadProduct : multer({ storage: createCloudStorage('products'),   limits: { fileSize: 5*1024*1024 } }),
  uploadPosters : multer({ storage: createCloudStorage('posters'),    limits: { fileSize: 5*1024*1024 } }),
};
