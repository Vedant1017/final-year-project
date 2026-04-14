import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ShopModel } from './src/models/Shop.js';
import { ProductModel } from './src/models/Product.js';
import { UserModel } from './src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const shops = await ShopModel.find();
    console.log(`Found ${shops.length} shops`);

    for (const shop of shops) {
      if (!shop.location || (shop.location.coordinates[0] === 0 && shop.location.coordinates[1] === 0)) {
        const owner = await UserModel.findById(shop.ownerId);
        if (owner && owner.location && owner.location.lat) {
          console.log(`Updating shop ${shop.name} with owner location: ${owner.location.lat}, ${owner.location.lng}`);
          shop.location = {
            type: 'Point',
            coordinates: [owner.location.lng, owner.location.lat]
          };
          await shop.save();
        } else {
          console.log(`No location for owner of ${shop.name}, using Pune default.`);
          shop.location = {
            type: 'Point',
            coordinates: [73.8567, 18.5204]
          };
          await shop.save();
        }
      }
    }

    const products = await ProductModel.find();
    console.log(`Found ${products.length} products`);
    for (const prod of products) {
      if (prod.brand === undefined || prod.quantity === undefined) {
        prod.brand = prod.brand || '';
        prod.quantity = prod.quantity || '';
        await prod.save();
      }
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
