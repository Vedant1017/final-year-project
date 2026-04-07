import { Router } from 'express';
import { AppDataSource } from '../db/dataSource';
import { Product } from '../entities/Product';

export const productsRouter = Router();

productsRouter.get('/', async (_req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const products = await repo.find();
  res.json({ success: true, products });
});

productsRouter.get('/shops/:shopId/products', async (req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const products = await repo.find({ where: { shopId: req.params.shopId } });
  res.json({ success: true, products });
});

productsRouter.get('/:id', async (req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const product = await repo.findOne({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

