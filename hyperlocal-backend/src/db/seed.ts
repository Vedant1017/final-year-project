import bcrypt from 'bcryptjs';
import { ensureDbInitialized, AppDataSource } from './dataSource';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { Product } from '../entities/Product';

const seedProducts = [
  { sku: 'MILK-500', name: 'Organic Milk 500ml', price: '30.00', stock: 15 },
  { sku: 'BREAD-001', name: 'Whole Wheat Bread', price: '40.00', stock: 8 },
  { sku: 'TOMATO-01', name: 'Fresh Red Tomatoes (1kg)', price: '45.00', stock: 50 },
  { sku: 'BANANA-01', name: 'Ripe Bananas (1 Dozen)', price: '60.00', stock: 25 },
  { sku: 'EGGS-12', name: 'Farm Fresh Eggs (12 pack)', price: '80.00', stock: 5 },
  { sku: 'CARROT-01', name: 'Farm Fresh Carrots', price: '50.00', stock: 30 },
  { sku: 'APPLE-01', name: 'Crisp Red Apples (1kg)', price: '140.00', stock: 18 },
  { sku: 'RICE-5KG', name: 'Basmati Rice (5kg)', price: '520.00', stock: 12 },
  { sku: 'COFFEE-01', name: 'Instant Coffee 200g', price: '260.00', stock: 20 },
  { sku: 'CHIPS-01', name: 'Potato Chips (Classic)', price: '35.00', stock: 40 },
  { sku: 'COLA-01', name: 'Cola 1.25L', price: '75.00', stock: 25 }
];

async function main() {
  await ensureDbInitialized();

  const userRepo = AppDataSource.getRepository(User);
  const shopRepo = AppDataSource.getRepository(Shop);
  const productRepo = AppDataSource.getRepository(Product);

  const ownerEmail = 'owner@demo.com';
  const customerEmail = 'customer@demo.com';
  const demoPassword = 'password123';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  let owner = await userRepo.findOne({ where: { email: ownerEmail } });
  if (!owner) {
    owner = userRepo.create({ email: ownerEmail, role: 'OWNER', passwordHash });
    await userRepo.save(owner);
  }

  let customer = await userRepo.findOne({ where: { email: customerEmail } });
  if (!customer) {
    customer = userRepo.create({ email: customerEmail, role: 'CUSTOMER', passwordHash });
    await userRepo.save(customer);
  }

  let shop = await shopRepo.findOne({ where: { ownerId: owner.id } });
  if (!shop) {
    shop = shopRepo.create({ name: 'Fresh Mart', ownerId: owner.id });
    await shopRepo.save(shop);
  }

  for (const p of seedProducts) {
    const existing = await productRepo.findOne({ where: { sku: p.sku } });
    if (!existing) {
      const product = productRepo.create({ ...p, shopId: shop.id });
      await productRepo.save(product);
    }
  }

  await AppDataSource.destroy();

  console.log('Seed complete.');
  console.log(`Owner login: ${ownerEmail} / ${demoPassword}`);
  console.log(`Customer login: ${customerEmail} / ${demoPassword}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

