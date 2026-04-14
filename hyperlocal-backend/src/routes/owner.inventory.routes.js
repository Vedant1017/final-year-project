import { Router } from 'express';
import { ProductModel } from '../models/Product.js';
import { ShopModel } from '../models/Shop.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireApprovedOwner } from '../middleware/requireApprovedOwner.js';
import { z } from 'zod';

export function createOwnerInventoryRouter(inventoryGateway) {
  const router = Router();
  router.use(requireAuth, requireRole('OWNER'), requireApprovedOwner);

  router.get('/inventory', async (req, res) => {
    const ownerId = req.user.sub;
    const shops = await ShopModel.find({ ownerId });
    const shopIds = shops.map((s) => s.id);
    if (!shopIds.length) return res.json({ success: true, shops: [] });

    const products = await ProductModel.find({ shopId: { $in: shopIds } });

    const productsByShop = new Map();
    for (const s of shops) productsByShop.set(s.id, []);
    for (const p of products) productsByShop.get(p.shopId)?.push(p);

    res.json({
      success: true,
      shops: shops.map((s) => ({
        id: s.id,
        name: s.name,
        products: (productsByShop.get(s.id) ?? []).map((p) => {
          const j = p.toJSON();
          return {
            id: j.id,
            sku: j.sku,
            name: j.name,
            description: j.description ?? null,
            price: j.price,
            stock: j.stock,
            shopId: j.shopId,
            imageUrl: j.imageUrl ?? null,
            brand: j.brand ?? '',
            quantity: j.quantity ?? ''
          };
        })
      }))
    });
  });

  const restockSchema = z.object({
    amount: z.number().int().min(1).max(1000)
  });

  router.post('/products/:productId/restock', async (req, res) => {
    const ownerId = req.user.sub;
    const parsed = restockSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

    const product = await ProductModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const shop = await ShopModel.findById(product.shopId);
    if (!shop || shop.ownerId !== ownerId) return res.status(403).json({ success: false, message: 'Forbidden' });

    product.stock += parsed.data.amount;
    await product.save();

    res.json({ success: true, product: { id: product.id, stock: product.stock } });
  });

  const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    description: z.string().optional(),
    price: z.string().min(1),
    stock: z.number().int().min(0).default(0),
    shopId: z.string().min(1),
    imageUrl: z.string().optional(),
    brand: z.string().optional(),
    quantity: z.string().optional()
  });

  router.post('/products', async (req, res) => {
    const ownerId = req.user.sub;
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body', errors: parsed.error.format() });

    const shop = await ShopModel.findOne({ _id: parsed.data.shopId, ownerId });
    if (!shop) return res.status(403).json({ success: false, message: 'Forbidden or shop not found' });

    const existingSku = await ProductModel.findOne({ sku: parsed.data.sku, shopId: parsed.data.shopId });
    if (existingSku) return res.status(400).json({ success: false, message: 'Product with this SKU already exists in this shop' });

    const product = await ProductModel.create(parsed.data);
    inventoryGateway.broadcastStockUpdate(product.shopId, product.sku, product.stock);

    res.status(201).json({ success: true, product });
  });

  const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.string().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    imageUrl: z.string().optional(),
    brand: z.string().optional(),
    quantity: z.string().optional()
  });

  router.patch('/products/:productId', async (req, res) => {
    const ownerId = req.user.sub;
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

    const product = await ProductModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const shop = await ShopModel.findOne({ _id: product.shopId, ownerId });
    if (!shop) return res.status(403).json({ success: false, message: 'Forbidden' });

    Object.assign(product, parsed.data);
    await product.save();

    if (parsed.data.stock !== undefined) {
      inventoryGateway.broadcastStockUpdate(product.shopId, product.sku, product.stock);
    }

    res.json({ success: true, product });
  });

  router.delete('/products/:productId', async (req, res) => {
    const ownerId = req.user.sub;
    const product = await ProductModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const shop = await ShopModel.findOne({ _id: product.shopId, ownerId });
    if (!shop) return res.status(403).json({ success: false, message: 'Forbidden' });

    await ProductModel.deleteOne({ _id: product.id });
    inventoryGateway.broadcastStockUpdate(product.shopId, product.sku, 0); // Broadcast zero stock on delete

    res.json({ success: true, message: 'Product deleted' });
  });

  return router;
}
