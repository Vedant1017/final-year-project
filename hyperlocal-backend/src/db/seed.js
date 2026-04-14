import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ensureDbInitialized } from './connection.js';
import { UserModel } from '../models/User.js';
import { ShopModel } from '../models/Shop.js';
import { ProductModel } from '../models/Product.js';
import { CartModel } from '../models/Cart.js';
import { OrderModel } from '../models/Order.js';

const demoPassword = 'password123';

const productsData = [
  // DAIRY
  { name: 'Organic Milk 500ml', brand: 'Amul', quantity: '500ml', price: '30', category: 'Dairy', sku: 'D001', img: 'https://images.unsplash.com/photo-1550583724-125581f778d3?w=800' },
  { name: 'Cow Milk 500ml', brand: 'Mother Dairy', quantity: '500ml', price: '28', category: 'Dairy', sku: 'D002', img: 'https://images.unsplash.com/photo-1563636619-e910009355dc?w=800' },
  { name: 'Full Cream Milk 1L', brand: 'Amul', quantity: '1L', price: '64', category: 'Dairy', sku: 'D003', img: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=800' },
  { name: 'Fresh Curd 400g', brand: 'Nestle', quantity: '400g', price: '45', category: 'Dairy', sku: 'D004', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800' },
  { name: 'Pure Ghee 500ml', brand: 'Patandjali', quantity: '500ml', price: '320', category: 'Dairy', sku: 'D005', img: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800' },

  // STATIONERY
  { name: 'Cello Finegrip Pen', brand: 'Cello', quantity: '1 pc', price: '10', category: 'Stationery', sku: 'S001', img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800' },
  { name: 'Cello Gripper Pen', brand: 'Cello', quantity: '1 pc', price: '15', category: 'Stationery', sku: 'S002', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800' },
  { name: 'Reynolds 045 Pen', brand: 'Reynolds', quantity: '1 pc', price: '7', category: 'Stationery', sku: 'S003', img: 'https://images.unsplash.com/photo-1590514125838-8a8b167576f7?w=800' },
  { name: 'Classmate Notebook', brand: 'Classmate', quantity: '160 pages', price: '60', category: 'Stationery', sku: 'S004', img: 'https://images.unsplash.com/photo-1533467647146-5900501f2042?w=800' },
  { name: 'Natraj Pencils Box', brand: 'Natraj', quantity: '10 pcs', price: '50', category: 'Stationery', sku: 'S005', img: 'https://images.unsplash.com/photo-1513542789411-b3a5d204d811?w=800' },

  // GROCERY
  { name: 'Basmati Rice 5kg', brand: 'India Gate', quantity: '5kg', price: '550', category: 'Grocery', sku: 'G001', img: 'https://images.unsplash.com/photo-1586201375761-838634509121?w=800' },
  { name: 'Fortune Sunflower Oil 1L', brand: 'Fortune', quantity: '1L', price: '165', category: 'Grocery', sku: 'G002', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800' },
  { name: 'Tata Salt 1kg', brand: 'Tata', quantity: '1kg', price: '25', category: 'Grocery', sku: 'G003', img: 'https://images.unsplash.com/photo-1610450937666-3d237198a287?w=800' },
  { name: 'Aashirvaad Atta 5kg', brand: 'ITC', quantity: '5kg', price: '280', category: 'Grocery', sku: 'G004', img: 'https://images.unsplash.com/photo-1627485750519-216694e99f91?w=800' },
  { name: 'Maggi Noodles 4-Pack', brand: 'Nestle', quantity: '280g', price: '60', category: 'Grocery', sku: 'G005', img: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800' },

  // SNACKS
  { name: 'Lays Classic Chips', brand: 'Lays', quantity: '50g', price: '20', category: 'Snacks', sku: 'K001', img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800' },
  { name: 'Kurkure Masala Munch', brand: 'PepsiCo', quantity: '90g', price: '30', category: 'Snacks', sku: 'K002', img: 'https://images.unsplash.com/photo-1600492842240-a36c646ae006?w=800' },
  { name: 'Oreo Biscuits', brand: 'Cadbury', quantity: '120g', price: '40', category: 'Snacks', sku: 'K003', img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800' },
  { name: 'Thumbs Up 750ml', brand: 'Coca Cola', quantity: '750ml', price: '45', category: 'Snacks', sku: 'K004', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800' },
  { name: 'Red Bull Energy Drink', brand: 'Red Bull', quantity: '250ml', price: '125', category: 'Snacks', sku: 'K005', img: 'https://images.unsplash.com/photo-1613214049841-028bb4f43e08?w=800' },

  // FRUITS/VEG
  { name: 'Fresh Apples 1kg', brand: 'Shimla', quantity: '1kg', price: '180', category: 'Fruits', sku: 'F001', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bccb?w=800' },
  { name: 'Ripe Bananas 1 Dozen', brand: 'Local', quantity: '12 pcs', price: '60', category: 'Fruits', sku: 'F002', img: 'https://images.unsplash.com/photo-1571771894821-ad99024177c6?w=800' },
  { name: 'Fresh Alfonso Mangoes', brand: 'Ratnagiri', quantity: '2 pcs', price: '150', category: 'Fruits', sku: 'F003', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800' },
  { name: 'Potatoes 1kg', brand: 'Local', quantity: '1kg', price: '40', category: 'Fruits', sku: 'F004', img: 'https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=800' },
  { name: 'Onions 1kg', brand: 'Local', quantity: '1kg', price: '35', category: 'Fruits', sku: 'F005', img: 'https://images.unsplash.com/photo-1508747703725-7197771375a0?w=800' },

  // PHARMACY / HYGIENE
  { name: 'Dettol Soap 125g', brand: 'Dettol', quantity: '125g', price: '45', category: 'Hygiene', sku: 'P001', img: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800' },
  { name: 'Colgate Max Fresh', brand: 'Colgate', quantity: '150g', price: '95', category: 'Hygiene', sku: 'P002', img: 'https://images.unsplash.com/photo-1559591937-e62030cafa0c?w=800' },
  { name: 'Hand Sanitizer 500ml', brand: 'Lifebuoy', quantity: '500ml', price: '250', category: 'Hygiene', sku: 'P003', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800' }
];

async function main() {
  await ensureDbInitialized();
  console.log('Cleaning database...');
  await UserModel.deleteMany({});
  await ShopModel.deleteMany({});
  await ProductModel.deleteMany({});
  await CartModel.deleteMany({});
  await OrderModel.deleteMany({});

  const passwordHash = await bcrypt.hash(demoPassword, 10);

  console.log('Creating 15 users...');
  const owners = [];
  const customers = [];
  const deliveryBoys = [];

  for (let i = 1; i <= 5; i++) {
    owners.push(await UserModel.create({ email: `owner${i}@demo.com`, role: 'OWNER', passwordHash, sellerApproved: true, shopName: `Shop ${i}` }));
    customers.push(await UserModel.create({ email: `customer${i}@demo.com`, role: 'CUSTOMER', passwordHash }));
    deliveryBoys.push(await UserModel.create({ email: `delivery${i}@demo.com`, role: 'DELIVERY_MAN', passwordHash }));
  }

  // Add one Admin
  await UserModel.create({ email: 'admin@demo.com', role: 'ADMIN', passwordHash });

  console.log('Creating 5 shops...');
  const shopCoords = [
    [73.8567, 18.5204], // Shop 1 - Center
    [73.8400, 18.5300], // Shop 2 - North West
    [73.8700, 18.5100], // Shop 3 - South East
    [73.8500, 18.5000], // Shop 4 - South
    [73.8800, 18.5400]  // Shop 5 - North East
  ];

  const shops = [];
  const shopTypes = ['Supermarket', 'Dairy', 'Stationery', 'Grocery', 'Pharmacy'];
  
  for (let i = 0; i < 5; i++) {
    const s = await ShopModel.create({
      name: `${owners[i].shopName} Multi-Store`,
      ownerId: owners[i]._id,
      shopType: shopTypes[i],
      openTime: '08:00',
      closeTime: '22:00',
      ownerName: `Owner ${i+1}`,
      contactPhone: `900000000${i+1}`,
      location: { type: 'Point', coordinates: shopCoords[i] }
    });
    shops.push(s);
  }

  console.log('Seeding 28+ products...');
  for (let i = 0; i < productsData.length; i++) {
    const p = productsData[i];
    // Distribute products across shops based on category or index
    const assignedShop = shops[Math.floor(i / 6) % shops.length]; 
    
    await ProductModel.create({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      quantity: p.quantity,
      description: `Premium ${p.name} for your daily needs. Best quality guaranteed.`,
      price: p.price,
      stock: 50,
      shopId: assignedShop._id,
      shopName: assignedShop.name,
      imageUrl: p.img
    });

    // Also add some price-comparison duplicates for Stationery and Dairy
    if (p.category === 'Dairy' || p.category === 'Stationery') {
        const nextShop = shops[(shops.indexOf(assignedShop) + 1) % shops.length];
        await ProductModel.create({
            sku: `${p.sku}-ALT`,
            name: p.name,
            brand: p.brand,
            quantity: p.quantity,
            description: `Alternative source for ${p.name}.`,
            price: (parseFloat(p.price) + (Math.random() > 0.5 ? 2 : -2)).toFixed(2),
            stock: 30,
            shopId: nextShop._id,
            shopName: nextShop.name,
            imageUrl: p.img
        });
    }
  }

  await mongoose.disconnect();
  console.log('==========================================');
  console.log('SEED COMPLETE!');
  console.log('==========================================');
  console.log('Credentials (Password: password123):');
  console.log('Owners: owner1@demo.com to owner5@demo.com');
  console.log('Customers: customer1@demo.com to customer5@demo.com');
  console.log('Delivery: delivery1@demo.com to delivery5@demo.com');
  console.log('Admin: admin@demo.com');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
