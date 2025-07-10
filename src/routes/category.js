const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Product = require('../model/product');
const { uploadCategory } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');

// GET all categories
router.get('/', asyncHandler(async (_req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, message: 'Categories retrieved successfully.', data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// GET category by ID
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category retrieved successfully.', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// POST create category
router.post('/', asyncHandler(async (req, res) => {
  uploadCategory.single('img')(req, res, async (err) => {
    if (err) {
      // giới hạn dung lượng / lỗi Multer khác
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File size is too large. Maximum filesize is 5MB.'
        : err.message || err;
      console.log(`Add category: ${msg}`);
      return res.json({ success: false, message: msg });
    }

    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

    // Cloudinary trả về URL ở req.file.path (với multer‑storage‑cloudinary)
    const imageUrl = req.file?.path || 'no_url';

    try {
      await new Category({ name, image: imageUrl }).save();
      res.json({ success: true, message: 'Category created successfully.', data: null });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
}));

// PUT update category
router.put('/:id', asyncHandler(async (req, res) => {
  uploadCategory.single('img')(req, res, async (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File size is too large. Maximum filesize is 5MB.'
        : err.message || err;
      console.log(`Update category: ${msg}`);
      return res.json({ success: false, message: msg });
    }

    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

    // Nếu user up file mới ⇒ lấy URL mới; nếu không, giữ URL cũ từ body
    const image = req.file?.path || req.body.image;
    if (!image) return res.status(400).json({ success: false, message: 'Image is required.' });

    try {
      const updated = await Category.findByIdAndUpdate(
        req.params.id,
        { name, image },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Category not found.' });
      res.json({ success: true, message: 'Category updated successfully.', data: null });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}));

// DELETE category
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const categoryID = req.params.id;

    // kiểm tra ràng buộc
    const hasSub = await SubCategory.exists({ categoryId: categoryID });
    if (hasSub) return res.status(400).json({ success: false, message: 'Cannot delete category. Subcategories are referencing it.' });

    const hasProduct = await Product.exists({ proCategoryId: categoryID });
    if (hasProduct) return res.status(400).json({ success: false, message: 'Cannot delete category. Products are referencing it.' });

    const category = await Category.findByIdAndDelete(categoryID);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

module.exports = router;
