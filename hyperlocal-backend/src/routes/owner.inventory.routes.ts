import { Router } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '../db/dataSource';
import { Product } from '../entities/Product';
import { Shop } from '../entities/Shop';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { z } from 'zod';
import { InventoryGateway } from '../inventory.gateway';
import type { AuthedRequest } from '../middleware/requireAuth';

export function createOwnerInventoryRouter(inventoryGateway: InventoryGateway) {
  const router = Router();
  router.use(requireAuth, requireRole('OWNER'));

  router.get('/inventory', async (req: AuthedRequest, res) => {
    const ownerId = req.user!.sub;
    const shopRepo = AppDataSource.getRepository(Shop);
    const shops = await shopRepo.find({ where: { ownerId } });
    const shopIds = shops.map((s) => s.id);
    if (!shopIds.length) return res.json({ success: true, shops: [] });

    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({ where: { shopId: In(shopIds) } });

    const productsByShop = new Map<string, Product[]>();
    for (const s of shops) productsByShop.set(s.id, []);
    for (const p of products) productsByShop.get(p.shopId)?.push(p);

    res.json({
      success: true,
      shops: shops.map((s) => ({
        id: s.id,
        name: s.name,
        products: (productsByShop.get(s.id) ?? []).map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          description: (p as any).description ?? null,
          price: p.price,
          stock: p.stock,
          shopId: p.shopId
        }))
      }))
    });
  });

  const restockSchema = z.object({
    amount: z.number().int().min(1).max(1000)
  });

  router.post('/products/:productId/restock', async (req: AuthedRequest, res) => {
    const ownerId = req.user!.sub;
    const parsed = restockSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

    const productRepo = AppDataSource.getRepository(Product);
    const shopRepo = AppDataSource.getRepository(Shop);

    const product = await productRepo.findOne({ where: { id: req.params.productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const shop = await shopRepo.findOne({ where: { id: product.shopId } });
    if (!shop || shop.ownerId !== ownerId) return res.status(403).json({ success: false, message: 'Forbidden' });

    product.stock += parsed.data.amount;
    await productRepo.save(product);

    inventoryGateway.broadcastStockUpdate(product.shopId, product.sku, product.stock);

    res.json({ success: true, product: { id: product.id, stock: product.stock } });
  });

  return router;
}

