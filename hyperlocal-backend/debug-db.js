import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ShopModel } from './src/models/Shop.js';
import { ProductModel } from './src/models/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal';

async function debug() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const shops = await ShopModel.find();
    console.log(`Shops: ${shops.length}`);
    shops.forEach(s => {
      console.log(`Shop: ${s.name}, Location: ${JSON.stringify(s.location)}, ID: ${s._id}`);
    });

    const products = await ProductModel.find().limit(5);
    console.log(`Products: ${products.length}`);
    products.forEach(p => {
        console.log(`Product: ${p.name}, ShopID: ${p.shopId}, SKU: ${p.sku}`);
    });

    // Test the specific aggregation
    const userLng = 73.8567;
    const userLat = 18.5204;
    const q = 'Milk';

    const results = await ShopModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [userLng, userLat] },
          distanceField: 'distance_km',
          maxDistance: 100000, // 100km for debug
          spherical: true,
          distanceMultiplier: 0.001
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'shopId',
          as: 'products'
        }
      },
      { $unwind: '$products' },
      {
        $match: {
          'products.name': { $regex: q || '', $options: 'i' }
        }
      }
    ]);

    console.log(`Aggregation Results for "Milk": ${results.length}`);
    results.forEach(r => {
        console.log(`Match: ${r.products.name} at ${r.name} (Dist: ${r.distance_km}km)`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err);
    process.exit(1);
  }
}

debug();
