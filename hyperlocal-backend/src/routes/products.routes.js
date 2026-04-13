import { Router } from 'express';
import mongoose from 'mongoose';
import { ProductModel } from '../models/Product.js';

export const productsRouter = Router();

productsRouter.get('/', async (_req, res) => {
  const products = await ProductModel.find();
  res.json({ success: true, products: products.map((p) => p.toJSON()) });
});

productsRouter.get('/shops/:shopId/products', async (req, res) => {
  const products = await ProductModel.find({ shopId: req.params.shopId });
  res.json({ success: true, products: products.map((p) => p.toJSON()) });
});

productsRouter.get('/:id', async (req, res) => {
  let product = await ProductModel.findById(req.params.id);
  if (!product && req.params.id.length === 24) {
    try {
      product = await ProductModel.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    } catch(e) {}
  }
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product: product.toJSON() });
});
