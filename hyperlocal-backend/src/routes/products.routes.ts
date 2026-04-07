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

