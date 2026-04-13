import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ensureDbInitialized } from './connection.js';
import { UserModel } from '../models/User.js';
import { ShopModel } from '../models/Shop.js';
import { ProductModel } from '../models/Product.js';

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
  },
  {
    sku: 'ONION-01',
    name: 'Onions (1kg)',
    description: 'Cooking onions for everyday meals.',
    price: '35.00',
    stock: 40
  },
  {
    sku: 'YOGURT-01',
    name: 'Curd / Yogurt 400g',
    description: 'Fresh set curd—great with rice or as a snack.',
    price: '45.00',
    stock: 22
  }
];

async function main() {
  await ensureDbInitialized();

  const ownerEmail = 'owner@demo.com';
  const customerEmail = 'customer@demo.com';
  const demoPassword = 'password123';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  let owner = await UserModel.findOne({ email: ownerEmail });
  if (!owner) {
    owner = await UserModel.create({
      email: ownerEmail,
      role: 'OWNER',
      passwordHash,
      sellerApproved: true
    });
  } else if (owner.sellerApproved === undefined || owner.sellerApproved === null) {
    owner.sellerApproved = true;
    await owner.save();
  }

  const adminEmail = 'admin@demo.com';
  let admin = await UserModel.findOne({ email: adminEmail });
  if (!admin) {
    admin = await UserModel.create({ email: adminEmail, role: 'ADMIN', passwordHash, sellerApproved: true });
  }

  let customer = await UserModel.findOne({ email: customerEmail });
  if (!customer) {
    customer = await UserModel.create({ email: customerEmail, role: 'CUSTOMER', passwordHash, sellerApproved: true });
  }

  const shopNames = ['Fresh Mart', 'Green Valley Store', 'City Supermarket', 'Local Organic Grocers', 'Daily Needs Hub'];
  const shops = [];
  for (const name of shopNames) {
    let s = await ShopModel.findOne({ name, ownerId: owner.id });
    if (!s) {
      s = await ShopModel.create({
        name,
        ownerId: owner.id,
        shopType: idx === 0 ? 'Supermarket' : idx === 1 ? 'Dairy' : 'Grocery',
        openTime: '08:00',
        closeTime: '22:00',
        ownerName: 'Demo Owner',
        contactPhone: '9876543210'
      });
    }
    shops.push(s);
  }

  for (let idx = 0; idx < seedProducts.length; idx++) {
    const p = seedProducts[idx];
    const existing = await ProductModel.findOne({ sku: p.sku });
    if (!existing) {
      const assignedShop = shops[idx % shops.length];
      await ProductModel.create({ ...p, shopId: assignedShop.id });
    } else if (existing.description == null && p.description) {
      existing.description = p.description;
      await existing.save();
    }
  }

  await mongoose.disconnect();

  console.log('Seed complete.');
  console.log(`Owner login: ${ownerEmail} / ${demoPassword}`);
  console.log(`Customer login: ${customerEmail} / ${demoPassword}`);
  console.log(`Admin login: ${adminEmail} / ${demoPassword}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
