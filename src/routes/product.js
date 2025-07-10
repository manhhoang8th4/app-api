const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');

// Get all products
router.get('/', asyncHandler(async (_req, res) => {
  try {
    const products = await Product.find()
      .populate('proCategoryId', 'id name')
      .populate('proSubCategoryId', 'id name')
      .populate('proBrandId', 'id name')
      .populate('proVariantTypeId', 'id type')
      .populate('proVariantId', 'id name');

    res.json({ success: true, message: 'Products retrieved successfully.', data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('proCategoryId', 'id name')
      .populate('proSubCategoryId', 'id name')
      .populate('proBrandId', 'id name')
      .populate('proVariantTypeId', 'id name')
      .populate('proVariantId', 'id name');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product retrieved successfully.', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Create new product
router.post('/', asyncHandler(async (req, res) => {
  uploadProduct.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    { name: 'image5', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File size is too large. Maximum filesize is 5MB per image.'
        : err.message || err;
      return res.json({ success: false, message: msg });
    }

    const {
      name, description, quantity, price, offerPrice,
      proCategoryId, proSubCategoryId, proBrandId,
      proVariantTypeId, proVariantId,
    } = req.body;

    if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
      return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    // Collect Cloudinary URLs
    const imageUrls = [];
    const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
    fields.forEach((field, idx) => {
      if (req.files[field]?.length) {
        const url = req.files[field][0].path;          // <- Cloudinary URL
        imageUrls.push({ image: idx + 1, url });
      }
    });

    try {
      await new Product({
        name, description, quantity, price, offerPrice,
        proCategoryId, proSubCategoryId, proBrandId,
        proVariantTypeId, proVariantId,
        images: imageUrls,
      }).save();

      res.json({ success: true, message: 'Product created successfully.', data: null });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
}));

// Update a product
router.put('/:id', asyncHandler(async (req, res) => {
  const productId = req.params.id;

  uploadProduct.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    { name: 'image5', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File size is too large. Maximum filesize is 5MB per image.'
        : err.message || err;
      return res.status(500).json({ success: false, message: msg });
    }

    const {
      name, description, quantity, price, offerPrice,
      proCategoryId, proSubCategoryId, proBrandId,
      proVariantTypeId, proVariantId,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Update primitive fields if provided
    Object.assign(product, {
      name: name ?? product.name,
      description: description ?? product.description,
      quantity: quantity ?? product.quantity,
      price: price ?? product.price,
      offerPrice: offerPrice ?? product.offerPrice,
      proCategoryId: proCategoryId ?? product.proCategoryId,
      proSubCategoryId: proSubCategoryId ?? product.proSubCategoryId,
      proBrandId: proBrandId ?? product.proBrandId,
      proVariantTypeId: proVariantTypeId ?? product.proVariantTypeId,
      proVariantId: proVariantId ?? product.proVariantId,
    });

    // Update/append images
    const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
    fields.forEach((field, idx) => {
      if (req.files[field]?.length) {
        const url = req.files[field][0].path;           // <- Cloudinary URL
        const existing = product.images.find(img => img.image === idx + 1);
        if (existing) existing.url = url;
        else product.images.push({ image: idx + 1, url });
      }
    });

    await product.save();
    res.json({ success: true, message: 'Product updated successfully.' });
  });
}));

// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

module.exports = router;