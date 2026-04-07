import bcrypt from 'bcryptjs';
import { ensureDbInitialized, AppDataSource } from './dataSource';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { Product } from '../entities/Product';

const seedProducts = [
  {
    sku: 'MILK-500',
    name: 'Organic Milk 500ml',
    description: 'Fresh organic whole milk. Great for tea/coffee, cereal, and smoothies.',
    price: '30.00',
    stock: 15
  },
  {
    sku: 'BREAD-001',
    name: 'Whole Wheat Bread',
    description: 'Soft whole wheat loaf—perfect for sandwiches and toast.',
    price: '40.00',
    stock: 8
  },
  {
    sku: 'TOMATO-01',
    name: 'Fresh Red Tomatoes (1kg)',
    description: 'Juicy tomatoes for salads, gravies, and everyday cooking.',
    price: '45.00',
    stock: 50
  },
  {
    sku: 'BANANA-01',
    name: 'Ripe Bananas (1 Dozen)',
    description: 'Naturally sweet bananas—ideal for snacks and shakes.',
    price: '60.00',
    stock: 25
  },
  {
    sku: 'EGGS-12',
    name: 'Farm Fresh Eggs (12 pack)',
    description: 'Protein-packed farm eggs for breakfast and baking.',
    price: '80.00',
    stock: 5
  },
  {
    sku: 'CARROT-01',
    name: 'Farm Fresh Carrots',
    description: 'Crunchy carrots—great for salads, juices, and sabzi.',
    price: '50.00',
    stock: 30
  },
  {
    sku: 'APPLE-01',
    name: 'Crisp Red Apples (1kg)',
    description: 'Sweet and crunchy apples, handpicked for freshness.',
    price: '140.00',
    stock: 18
  },
  {
    sku: 'RICE-5KG',
    name: 'Basmati Rice (5kg)',
    description: 'Long-grain basmati with a rich aroma—ideal for biryani.',
    price: '520.00',
    stock: 12
  },
  {
    sku: 'COFFEE-01',
    name: 'Instant Coffee 200g',
    description: 'Bold instant coffee—quick to prepare, smooth taste.',
    price: '260.00',
    stock: 20
  },
  {
    sku: 'CHIPS-01',
    name: 'Potato Chips (Classic)',
    description: 'Classic salted chips—crispy and snack-ready.',
    price: '35.00',
    stock: 40
  },
  {
    sku: 'COLA-01',
    name: 'Cola 1.25L',
    description: 'Chilled cola for parties and quick refreshment.',
    price: '75.00',
    stock: 25
  }
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

  // Ensure 5 shops (all owned by the demo owner for MVP)
  const shopNames = ['Fresh Mart', 'Green Valley Store', 'City Supermarket', 'Local Organic Grocers', 'Daily Needs Hub'];
  const shops: Shop[] = [];
  for (const name of shopNames) {
    let s = await shopRepo.findOne({ where: { name, ownerId: owner.id } });
    if (!s) {
      s = shopRepo.create({ name, ownerId: owner.id });
      await shopRepo.save(s);
    }
    shops.push(s);
  }

  for (let idx = 0; idx < seedProducts.length; idx++) {
    const p = seedProducts[idx];
    const existing = await productRepo.findOne({ where: { sku: p.sku } });
    if (!existing) {
      // Distribute items across shops so customer sees multiple suppliers.
      const assignedShop = shops[idx % shops.length];
      const product = productRepo.create({ ...p, shopId: assignedShop.id });
      await productRepo.save(product);
    } else {
      // Backfill description + ensure shop assignment exists
      if ((existing as any).description == null && (p as any).description) {
        (existing as any).description = (p as any).description;
      }
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

